import React, { useState, useEffect, useCallback } from 'react'
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  Linking,
  ActivityIndicator,
  RefreshControl,
  Image,
  Platform
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as signalR from '@microsoft/signalr'
import { colors, shadows } from '../theme/colors'
import { getNews } from '../services/newsService'
import { getWebMapUrl, DEV_PC_IP } from '../config'

const CANTONES = ['todos', 'Cartago', 'Turrialba', 'Tarrazú']

export default function NewsFeedScreen() {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCanton, setSelectedCanton] = useState('todos')
  const [urgentOnly, setUrgentOnly] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState(null)

  const fetchNews = useCallback(async () => {
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
  }, [selectedCanton, urgentOnly])

  useEffect(() => {
    fetchNews()

    let connection = null
    try {
      const hubUrl = Platform.OS === 'web'
        ? 'http://localhost:5000/chatHub'
        : `http://${DEV_PC_IP}:5000/chatHub`

      connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl)
        .withAutomaticReconnect([0, 1000, 2000, 5000])
        .build()

      connection.on('NewsUpdated', () => {
        fetchNews()
      })

      connection.start().catch(() => {})
    } catch {
      // Silencioso
    }

    return () => {
      if (connection) {
        connection.stop()
      }
    }
  }, [fetchNews])

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
                  {/* Fotografía de la Noticia */}
                  {article.imageUrl && (
                    <View style={styles.cardImageContainer}>
                      <Image source={{ uri: article.imageUrl }} style={styles.cardBannerImage} resizeMode="cover" />
                    </View>
                  )}

                  <View style={styles.cardBodyPadding}>
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
                      <View style={styles.newsActionsRow}>
                        <TouchableOpacity
                          style={styles.btnCardMapLink}
                          onPress={() => {
                            const url = getWebMapUrl(article.lat, article.lng, article.title)
                            Linking.openURL(url)
                          }}
                        >
                          <Ionicons name="navigate" size={12} color={colors.primary} />
                          <Text style={styles.btnCardMapLinkText}>Mapa</Text>
                        </TouchableOpacity>
                        <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                      </View>
                    </View>
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
                {/* Video oficial si existe */}
                {selectedArticle.videoUrl && (
                  <View style={styles.modalVideoBadge}>
                    <Ionicons name="film" size={16} color={colors.primary} />
                    <Text style={styles.modalVideoBadgeText}>Video oficial disponible en el portal</Text>
                  </View>
                )}

                {/* Fotografía de la Noticia */}
                {selectedArticle.imageUrl && (
                  <View style={styles.modalImageWrapper}>
                    <Image source={{ uri: selectedArticle.imageUrl }} style={styles.modalImage} resizeMode="cover" />
                  </View>
                )}

                <Text style={styles.modalTitle}>{selectedArticle.title}</Text>

                <View style={styles.modalMetaRow}>
                  <Ionicons name="business" size={14} color={colors.primary} />
                  <Text style={styles.modalMetaText}>{selectedArticle.authorEntity}</Text>
                </View>

                <Text style={styles.modalBodyText}>{selectedArticle.content}</Text>

                {/* Botón de Mapa en Tiempo Real en la App Web */}
                <TouchableOpacity
                  style={styles.btnOpenMapRealtime}
                  onPress={() => {
                    const url = getWebMapUrl(selectedArticle.lat, selectedArticle.lng, selectedArticle.title)
                    setSelectedArticle(null)
                    Linking.openURL(url)
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="map" size={17} color="#ffffff" />
                  <Text style={styles.btnOpenMapRealtimeText}>Ver punto exacto en el Mapa en Tiempo Real</Text>
                </TouchableOpacity>
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
    padding: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  cardImageContainer: {
    width: '100%',
    height: 140,
    backgroundColor: colors.bgSubtle,
    position: 'relative',
  },
  cardBannerImage: {
    width: '100%',
    height: '100%',
  },
  cardBodyPadding: {
    padding: 14,
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
  newsActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnCardMapLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  btnCardMapLinkText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.primary,
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
  modalVideoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary + '14',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  modalVideoBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  modalImageWrapper: {
    width: '100%',
    height: 190,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 14,
    position: 'relative',
    backgroundColor: colors.bgSubtle,
  },
  modalImage: {
    width: '100%',
    height: 190,
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
  btnOpenMapRealtime: {
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
  },
  btnOpenMapRealtimeText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '700',
  },
})
