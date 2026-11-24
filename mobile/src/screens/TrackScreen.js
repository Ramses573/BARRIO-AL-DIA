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
  Linking
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, shadows } from '../theme/colors'
import { getIncidentByTicket } from '../services/incidentService'
import { getWebMapUrl } from '../config'

const STAGES = [
  { id: 'Recibido', label: '1. Recibido' },
  { id: 'En Evaluación', label: '2. En Evaluación' },
  { id: 'Cuadrilla Despachada', label: '3. Cuadrilla en Camino' },
  { id: 'Resuelto', label: '4. Resuelto' }
]

const SAMPLE_CODES = ['TKT-CART-5821', 'TKT-TURR-2144', 'TKT-TARZ-9012']

export default function TrackScreen({ route, navigation }) {
  const initialCode = route?.params?.code || 'TKT-CART-5821'
  const [ticketInput, setTicketInput] = useState(initialCode)
  const [incident, setIncident] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialCode) {
      setTicketInput(initialCode)
      searchTicket(initialCode)
    }
  }, [initialCode])

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
      {/* Barra de Búsqueda */}
      <View style={styles.searchCard}>
        <Text style={styles.searchLabel}>Código de Seguimiento Oficial</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.primary} />
          <TextInput
            style={styles.searchInput}
            value={ticketInput}
            onChangeText={setTicketInput}
            placeholder="Ej. TKT-CART-5821"
            placeholderTextColor={colors.textLight}
            autoCapitalize="characters"
          />
          <TouchableOpacity
            style={styles.btnSearch}
            onPress={() => searchTicket()}
            activeOpacity={0.8}
          >
            <Text style={styles.btnSearchText}>Consultar</Text>
          </TouchableOpacity>
        </View>

        {/* Chips de Sugerencia */}
        <View style={styles.samplesRow}>
          <Text style={styles.samplesLabel}>Ejemplos rápidos:</Text>
          {SAMPLE_CODES.map(sample => (
            <TouchableOpacity
              key={sample}
              style={styles.sampleChip}
              onPress={() => {
                setTicketInput(sample)
                searchTicket(sample)
              }}
            >
              <Text style={styles.sampleChipText}>{sample}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

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
          <View style={styles.locRow}>
            <Ionicons name="location" size={14} color={colors.primary} />
            <Text style={styles.locText}>{incident.location}</Text>
          </View>

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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSubtle,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 8,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMain,
  },
  btnSearch: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 7,
  },
  btnSearchText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '700',
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
    paddingVertical: 3,
    borderRadius: 6,
  },
  sampleChipText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.primaryDark,
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
    marginBottom: 6,
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
