import React, { useState, useEffect } from 'react'
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  Linking,
  ActivityIndicator,
  RefreshControl
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, shadows } from '../theme/colors'
import { getNews } from '../services/newsService'

const CANTONES = ['todos', 'Cartago', 'Turrialba', 'Tarrazú']

export default function NewsFeedScreen() {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCanton, setSelectedCanton] = useState('todos')
  const [urgentOnly, setUrgentOnly] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState(null)

  useEffect(() => {
    fetchNews()
  }, [selectedCanton, urgentOnly])

  const fetchNews = async () => {
    try {
      setLoading(true)
      const data = await getNews({
        canton: selectedCanton,
        urgentOnly
      })
      setNews(data)
    } catch {
      // Ignorar error
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchNews()
    setRefreshing(false)
  }

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Vial': return colors.vial
      case 'Agua y Alcantarillado': return colors.water
      case 'Alerta CNE': return colors.cne
      case 'Electricidad': return colors.electric
      default: return colors.community
    }
  }

  return (
    <View style={styles.container}>
      {/* Barra de Filtros por Cantón */}
      <View style={styles.filtersWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cantonChipsContainer}
        >
          {CANTONES.map(canton => {
            const isSelected = selectedCanton.toLowerCase() === canton.toLowerCase()
            return (
              <TouchableOpacity
                key={canton}
                style={[styles.cantonChip, isSelected && styles.cantonChipActive]}
                onPress={() => setSelectedCanton(canton)}
                activeOpacity={0.7}
              >
                <Text style={[styles.cantonChipText, isSelected && styles.cantonChipTextActive]}>
                  {canton === 'todos' ? '🌐 Todos los Cantones' : canton}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        {/* Filtro Urgente */}
        <TouchableOpacity
          style={[styles.urgentFilterToggle, urgentOnly && styles.urgentFilterToggleActive]}
          onPress={() => setUrgentOnly(!urgentOnly)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={urgentOnly ? 'flame' : 'flame-outline'}
            size={16}
            color={urgentOnly ? '#ffffff' : colors.cne}
          />
          <Text style={[styles.urgentFilterText, urgentOnly && styles.urgentFilterTextActive]}>
            Solo Alertas Urgentes
          </Text>
        </TouchableOpacity>
      </View>

      {/* Listado de Noticias */}
      {loading && !refreshing ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Sincronizando boletín cantonal...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.newsList}
          contentContainerStyle={styles.newsListContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        >
          {news.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="newspaper-outline" size={44} color={colors.textLight} />
              <Text style={styles.emptyTitle}>Sin comunicados recientes</Text>
              <Text style={styles.emptyDesc}>No hay avisos para los filtros seleccionados.</Text>
            </View>
          ) : (
            news.map(article => {
              const catColor = getCategoryColor(article.category)
              return (
                <TouchableOpacity
                  key={article.id}
                  style={styles.newsCard}
                  activeOpacity={0.85}
                  onPress={() => setSelectedArticle(article)}
                >
                  <View style={styles.newsCardHeader}>
                    <View style={styles.badgeRow}>
                      <View style={[styles.categoryBadge, { backgroundColor: catColor + '18' }]}>
                        <Text style={[styles.categoryBadgeText, { color: catColor }]}>
                          {article.category}
                        </Text>
                      </View>
                      <View style={styles.cantonBadge}>
                        <Ionicons name="location-sharp" size={11} color={colors.primary} />
                        <Text style={styles.cantonBadgeText}>{article.canton}</Text>
                      </View>
                    </View>

                    {article.isUrgent && (
                      <View style={styles.urgentBadge}>
                        <Ionicons name="alert-circle" size={12} color="#ffffff" />
                        <Text style={styles.urgentBadgeText}>URGENTE</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.newsTitle}>{article.title}</Text>
                  <Text style={styles.newsSummary} numberOfLines={2}>{article.summary}</Text>

                  <View style={styles.newsFooter}>
                    <Text style={styles.newsAuthor} numberOfLines={1}>{article.authorEntity}</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                  </View>
                </TouchableOpacity>
              )
            })
          )}
        </ScrollView>
      )}

      {/* Modal de Detalle de Noticia */}
      {selectedArticle && (
        <Modal
          visible={!!selectedArticle}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSelectedArticle(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalTopBar}>
                <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(selectedArticle.category) + '20' }]}>
                  <Text style={[styles.categoryBadgeText, { color: getCategoryColor(selectedArticle.category) }]}>
                    {selectedArticle.category} • {selectedArticle.canton}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.btnCloseModal}
                  onPress={() => setSelectedArticle(null)}
                >
                  <Ionicons name="close" size={22} color={colors.textMain} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>
                <Text style={styles.modalTitle}>{selectedArticle.title}</Text>

                <View style={styles.modalMetaRow}>
                  <Ionicons name="business" size={14} color={colors.primary} />
                  <Text style={styles.modalMetaText}>{selectedArticle.authorEntity}</Text>
                </View>

                <Text style={styles.modalBodyText}>{selectedArticle.content}</Text>

                {selectedArticle.officialLink && (
                  <TouchableOpacity
                    style={styles.btnExternalLink}
                    onPress={() => Linking.openURL(selectedArticle.officialLink)}
                  >
                    <Ionicons name="open-outline" size={16} color="#ffffff" />
                    <Text style={styles.btnExternalLinkText}>Abrir comunicado oficial municipal</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPage,
  },
  filtersWrapper: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 8,
  },
  cantonChipsContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  cantonChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.bgSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cantonChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  cantonChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textMuted,
  },
  cantonChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  urgentFilterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.urgencyHighBg,
  },
  urgentFilterToggleActive: {
    backgroundColor: colors.cne,
  },
  urgentFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.cne,
  },
  urgentFilterTextActive: {
    color: '#ffffff',
  },
  newsList: {
    flex: 1,
  },
  newsListContent: {
    padding: 16,
    gap: 14,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: colors.textMuted,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    marginTop: 40,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textMain,
    marginTop: 10,
  },
  emptyDesc: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  newsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  newsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cantonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  cantonBadgeText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.textMuted,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.cne,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  urgentBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  newsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textMain,
    lineHeight: 21,
    marginBottom: 6,
  },
  newsSummary: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: 12,
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.bgSubtle,
    paddingTop: 10,
  },
  newsAuthor: {
    fontSize: 11.5,
    color: colors.textLight,
    fontWeight: '600',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    maxHeight: '85%',
  },
  modalTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  btnCloseModal: {
    padding: 4,
  },
  modalScroll: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textMain,
    lineHeight: 25,
    marginBottom: 10,
  },
  modalMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  modalMetaText: {
    fontSize: 12.5,
    color: colors.primary,
    fontWeight: '600',
  },
  modalBodyText: {
    fontSize: 14,
    color: colors.textMain,
    lineHeight: 22,
    marginBottom: 20,
  },
  btnExternalLink: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  btnExternalLinkText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
})
