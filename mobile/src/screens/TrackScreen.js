import React, { useState, useEffect } from 'react'
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Image
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, shadows } from '../theme/colors'
import { getIncidentByTicket, getAllTrackableTickets } from '../services/incidentService'
import { getWebMapUrl } from '../config'

const STAGES = [
  { id: 'Recibido', label: '1. Recibido' },
  { id: 'En Evaluación', label: '2. En Evaluación' },
  { id: 'Cuadrilla Despachada', label: '3. Cuadrilla en Camino' },
  { id: 'Resuelto', label: '4. Resuelto' }
]

export default function TrackScreen({ route, navigation }) {
  const initialCode = route?.params?.code || 'TKT-CART-5821'
  const [ticketInput, setTicketInput] = useState(initialCode)
  const [incident, setIncident] = useState(null)
  const [loading, setLoading] = useState(false)
  const [allTickets, setAllTickets] = useState([])
  const [showPicker, setShowPicker] = useState(false)

  useEffect(() => {
    loadInitialData()
  }, [initialCode])

  const loadInitialData = async () => {
    try {
      const list = await getAllTrackableTickets()
      setAllTickets(list)
      const codeToSearch = initialCode || (list[0] ? list[0].ticketCode : 'TKT-CART-5821')
      setTicketInput(codeToSearch)
      searchTicket(codeToSearch)
    } catch {
      searchTicket(initialCode)
    }
  }

  const searchTicket = async (codeToSearch) => {
    const code = (codeToSearch || ticketInput).trim().toUpperCase()
    if (!code) {
      Alert.alert('Código requerido', 'Ingresa un código de ticket como TKT-CART-5821')
      return
    }

    setLoading(true)
    try {
      const found = await getIncidentByTicket(code)
      if (found) {
        setIncident(found)
      } else {
        setIncident(null)
        Alert.alert('No encontrado', `No se encontró ninguna incidencia con el código ${code}`)
      }
    } catch {
      Alert.alert('Error', 'No se pudo consultar el estado del ticket')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Resuelto': return colors.urgencyLow
      case 'En Proceso': return colors.urgencyMedium
      default: return colors.urgencyHigh
    }
  }

  const getStageIndex = (stageName) => {
    if (stageName === 'Resuelto') return 3
    if (stageName === 'Cuadrilla Despachada') return 2
    if (stageName === 'En Evaluación') return 1
    return 0
  }

  const currentStageIdx = incident ? getStageIndex(incident.status) : 0

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* ComboBox Selector de Tickets */}
      <View style={styles.searchCard}>
        <Text style={styles.searchLabel}>Seleccionar Ticket Cantonal (ComboBox):</Text>
        <TouchableOpacity
          style={styles.comboboxTrigger}
          onPress={() => setShowPicker(true)}
          activeOpacity={0.8}
        >
          <View style={styles.comboboxTriggerLeft}>
            <Ionicons name="folder-open" size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.comboboxSelectedCode}>
                {ticketInput || 'Selecciona un ticket...'}
              </Text>
              {incident && (
                <Text style={styles.comboboxSelectedTitle} numberOfLines={1}>
                  {incident.title} ({incident.status})
                </Text>
              )}
            </View>
          </View>
          <Ionicons name="chevron-down" size={20} color={colors.primary} />
        </TouchableOpacity>

        {/* Chips de Selección Rápida */}
        <View style={styles.samplesRow}>
          <Text style={styles.samplesLabel}>Accesos directos:</Text>
          {allTickets.slice(0, 4).map((sample, idx) => {
            const code = sample.ticketCode || `#${sample.id || idx}`
            const isSelected = ticketInput === code
            return (
              <TouchableOpacity
                key={`track-chip-${code}-${idx}`}
                style={[styles.sampleChip, isSelected && styles.sampleChipActive]}
                onPress={() => {
                  setTicketInput(code)
                  searchTicket(code)
                }}
              >
                <Text style={[styles.sampleChipText, isSelected && styles.sampleChipTextActive]}>
                  {code}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      {/* Modal Picker ComboBox */}
      <Modal
        visible={showPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={styles.pickerModalOverlay}>
          <View style={styles.pickerModalContent}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Elegir Ticket para Seguimiento</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Ionicons name="close" size={22} color={colors.textMain} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 350 }}>
              {allTickets.map((t, idx) => {
                const code = t.ticketCode || `#${t.id || idx}`
                const isSelected = ticketInput === code
                return (
                  <TouchableOpacity
                    key={`track-picker-${code}-${t.id || idx}`}
                    style={[styles.pickerItem, isSelected && styles.pickerItemActive]}
                    onPress={() => {
                      setTicketInput(code)
                      setShowPicker(false)
                      searchTicket(code)
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.pickerItemCode, isSelected && { color: colors.primary }]}>
                        {code}
                      </Text>
                      <Text style={styles.pickerItemTitle} numberOfLines={1}>{t.title}</Text>
                      <Text style={styles.pickerItemMeta}>
                        {t.category} • {t.isAnonymous ? 'Anónimo' : (t.reporterName || 'Ramsés Solano')} • {t.status}
                      </Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Resultado */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Verificando bitácora municipal...</Text>
        </View>
      ) : incident ? (
        <View style={styles.ticketResultCard}>
          {/* Encabezado del Ticket */}
          <View style={styles.resultHeader}>
            <View>
              <Text style={styles.resultTicketCode}>{incident.ticketCode}</Text>
              <Text style={styles.resultCategory}>{incident.category}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(incident.status) + '18' }]}>
              <Text style={[styles.statusBadgeText, { color: getStatusColor(incident.status) }]}>
                {incident.status}
              </Text>
            </View>
          </View>

          <Text style={styles.resultTitle}>{incident.title}</Text>

          {/* Vecino que reportó la incidencia */}
          <View style={styles.reporterBadgeRow}>
            <Ionicons
              name={incident.isAnonymous ? "shield-checkmark" : "person"}
              size={14}
              color={incident.isAnonymous ? "#64748b" : colors.primary}
            />
            <Text style={styles.reporterLabel}>Reportado por: </Text>
            <Text style={[styles.reporterValue, !incident.isAnonymous && { color: colors.primary }]}>
              {incident.isAnonymous ? 'Anónimo Protegido' : (incident.reporterName || 'Ramsés Solano Calvo')}
            </Text>
          </View>

          <View style={styles.locRow}>
            <Ionicons name="location" size={14} color={colors.primary} />
            <Text style={styles.locText}>{incident.location}</Text>
          </View>

          {/* Fotografía de evidencia si existe */}
          {((incident.photos && incident.photos.length > 0) || incident.photo) && (
            <View style={styles.trackEvidenceWrap}>
              <Image
                source={{ uri: (incident.photos && incident.photos[0]?.uri) || (typeof incident.photo === 'string' ? incident.photo : null) }}
                style={styles.trackEvidenceImage}
                resizeMode="cover"
              />
            </View>
          )}

          {/* Indicador de Video si fue adjuntado */}
          {incident.video && (
            <View style={styles.trackVideoBadge}>
              <Ionicons name="film" size={14} color={colors.primary} />
              <Text style={styles.trackVideoBadgeText}>
                Video de evidencia adjunto ({incident.video.duration || 15} s)
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.btnOpenWebMap}
            onPress={() => {
              const lat = incident.lat || 9.8644
              const lng = incident.lng || -83.9194
              Linking.openURL(getWebMapUrl(lat, lng, incident.title))
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="map" size={14} color={colors.primary} />
            <Text style={styles.btnOpenWebMapText}>Ver en el Mapa en Tiempo Real</Text>
          </TouchableOpacity>

          <Text style={styles.descText}>{incident.description}</Text>

          {/* Línea de Tiempo de 4 Etapas */}
          <Text style={styles.timelineTitle}>Línea de Tiempo del Despacho Municipal</Text>

          <View style={styles.timelineWrapper}>
            {STAGES.map((st, idx) => {
              const isPastOrCurrent = idx <= currentStageIdx
              const isCurrent = idx === currentStageIdx

              return (
                <View key={st.id} style={styles.timelineStep}>
                  <View style={styles.timelineIndicatorCol}>
                    <View
                      style={[
                        styles.timelineCircle,
                        isPastOrCurrent && styles.timelineCircleDone,
                        isCurrent && styles.timelineCircleActive
                      ]}
                    >
                      <Ionicons
                        name={isPastOrCurrent ? 'checkmark' : 'time-outline'}
                        size={12}
                        color={isPastOrCurrent ? '#ffffff' : colors.textLight}
                      />
                    </View>
                    {idx < STAGES.length - 1 && (
                      <View
                        style={[
                          styles.timelineLine,
                          idx < currentStageIdx && styles.timelineLineDone
                        ]}
                      />
                    )}
                  </View>

                  <View style={styles.timelineContentCol}>
                    <Text
                      style={[
                        styles.timelineStageLabel,
                        isPastOrCurrent && styles.timelineStageLabelDone
                      ]}
                    >
                      {st.label}
                    </Text>
                    {isCurrent && (
                      <Text style={styles.timelineStageDesc}>
                        {incident.status === 'Resuelto'
                          ? 'Incidencia subsanada e inspeccionada en campo.'
                          : 'Personal municipal atendiendo el incidente en este momento.'}
                      </Text>
                    )}
                  </View>
                </View>
              )
            })}
          </View>

          {/* Botón de Asistencia Chat */}
          <TouchableOpacity
            style={styles.btnOpenChat}
            onPress={() => {
              if (navigation) navigation.navigate('Chat', { ticketCode: incident.ticketCode })
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubbles" size={18} color="#ffffff" />
            <Text style={styles.btnOpenChatText}>Abrir Chat de Asistencia para este Ticket</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Ionicons name="document-text-outline" size={44} color={colors.textLight} />
          <Text style={styles.emptyTitle}>Consulta un Ticket Cantonal</Text>
          <Text style={styles.emptyDesc}>
            Ingresa tu código en la barra superior para consultar el estado en tiempo real.
          </Text>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPage,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  searchCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    ...shadows.sm,
  },
  searchLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textMain,
    marginBottom: 8,
  },
  comboboxTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgSubtle,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: colors.primary,
    marginBottom: 12,
  },
  comboboxTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  comboboxSelectedCode: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },
  comboboxSelectedTitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  samplesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  samplesLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  sampleChip: {
    backgroundColor: colors.primarySubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sampleChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sampleChipText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  sampleChipTextActive: {
    color: '#ffffff',
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 10,
  },
  pickerModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textMain,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgSubtle,
    borderRadius: 8,
  },
  pickerItemActive: {
    backgroundColor: colors.primarySubtle,
  },
  pickerItemCode: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textMain,
  },
  pickerItemTitle: {
    fontSize: 12.5,
    color: colors.textMain,
    marginTop: 2,
  },
  pickerItemMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  centerBox: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: colors.textMuted,
  },
  ticketResultCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  resultTicketCode: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  resultCategory: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textMain,
    marginBottom: 4,
  },
  reporterBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f1f5f9',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  reporterLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  reporterValue: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1e293b',
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  locText: {
    fontSize: 12.5,
    color: colors.textMuted,
    fontWeight: '500',
    flexShrink: 1,
  },
  trackEvidenceWrap: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.bgSubtle,
    marginBottom: 10,
  },
  trackEvidenceImage: {
    width: '100%',
    height: '100%',
  },
  trackVideoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primarySubtle,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  trackVideoBadgeText: {
    fontSize: 11.5,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  btnOpenWebMap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary + '14',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  btnOpenWebMapText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  descText: {
    fontSize: 13,
    color: colors.textMain,
    lineHeight: 19,
    backgroundColor: colors.bgSubtle,
    padding: 12,
    borderRadius: 10,
    marginBottom: 18,
  },
  timelineTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.textMain,
    marginBottom: 14,
  },
  timelineWrapper: {
    paddingLeft: 4,
    marginBottom: 20,
  },
  timelineStep: {
    flexDirection: 'row',
    minHeight: 46,
  },
  timelineIndicatorCol: {
    alignItems: 'center',
    width: 28,
  },
  timelineCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.bgSubtle,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineCircleDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timelineCircleActive: {
    backgroundColor: colors.urgencyMedium,
    borderColor: colors.urgencyMedium,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  timelineLineDone: {
    backgroundColor: colors.primary,
  },
  timelineContentCol: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 10,
  },
  timelineStageLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textLight,
  },
  timelineStageLabelDone: {
    color: colors.textMain,
    fontWeight: '700',
  },
  timelineStageDesc: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  btnOpenChat: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
  },
  btnOpenChatText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    marginTop: 20,
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
})
