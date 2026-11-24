import React, { useState } from 'react'
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  ActivityIndicator
} from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Location from 'expo-location'
import { colors, shadows } from '../theme/colors'
import { addIncident } from '../services/incidentService'

const CATEGORIES = [
  { name: 'Inundación', icon: 'water', color: colors.water },
  { name: 'Accidente', icon: 'car-sport', color: colors.cne },
  { name: 'Poste sin luz', icon: 'flash-off', color: colors.electric },
  { name: 'Incendio', icon: 'flame', color: colors.urgencyMedium },
  { name: 'Calles dañadas', icon: 'construct', color: colors.vial },
  { name: 'Inseguridad', icon: 'shield-alert', color: '#4f46e5' }
]

const URGENCIES = [
  { id: 'Baja', label: 'Baja', color: colors.urgencyLow },
  { id: 'Media', label: 'Media', color: colors.urgencyMedium },
  { id: 'Alta', label: 'Alta (Crítica)', color: colors.urgencyHigh }
]

export default function ReportScreen({ navigation }) {
  const [category, setCategory] = useState('Inundación')
  const [urgency, setUrgency] = useState('Media')
  const [location, setLocation] = useState('Barrio El Carmen, 100 m norte del parque')
  const [lat, setLat] = useState(null)
  const [lng, setLng] = useState(null)
  const [gpsAccuracy, setGpsAccuracy] = useState(null)
  const [isLocating, setIsLocating] = useState(false)
  const [description, setDescription] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [createdTicket, setCreatedTicket] = useState(null)

  const handleGetGps = async () => {
    setIsLocating(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se requiere permiso de ubicación para obtener coordenadas GPS.')
        setIsLocating(false)
        return
      }

      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      setLat(current.coords.latitude)
      setLng(current.coords.longitude)
      setGpsAccuracy(Math.round(current.coords.accuracy || 10))
      setLocation(`Coordenadas GPS (${current.coords.latitude.toFixed(4)}, ${current.coords.longitude.toFixed(4)})`)
      Alert.alert('GPS Fijado', `Precisión de ±${Math.round(current.coords.accuracy || 10)} metros`)
    } catch {
      Alert.alert('Aviso GPS', 'No se pudo obtener la posición satelital en este momento.')
    } finally {
      setIsLocating(false)
    }
  }

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Campo obligatorio', 'Por favor ingresa una breve descripción del incidente.')
      return
    }

    setSubmitting(true)
    try {
      const item = await addIncident({
        title: `${category} en ${location.split(',')[0]}`,
        category,
        urgency,
        priority: urgency,
        location,
        lat: lat || 9.8644,
        lng: lng || -83.9194,
        gpsAccuracy,
        description: description.trim(),
        isAnonymous
      })
      setCreatedTicket(item)
    } catch {
      Alert.alert('Error', 'No se pudo registrar la incidencia. Inténtalo de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setCategory('Inundación')
    setUrgency('Media')
    setDescription('')
    setLat(null)
    setLng(null)
    setCreatedTicket(null)
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* 1. Categoría */}
      <Text style={styles.sectionTitle}>1. Tipo de Incidencia</Text>
      <View style={styles.categoriesGrid}>
        {CATEGORIES.map(cat => {
          const isSelected = category === cat.name
          return (
            <TouchableOpacity
              key={cat.name}
              style={[
                styles.categoryCard,
                isSelected && { borderColor: cat.color, backgroundColor: cat.color + '12' }
              ]}
              onPress={() => setCategory(cat.name)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={cat.icon}
                size={22}
                color={isSelected ? cat.color : colors.textMuted}
              />
              <Text
                style={[
                  styles.categoryText,
                  isSelected && { color: cat.color, fontWeight: '700' }
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* 2. Nivel de Urgencia */}
      <Text style={styles.sectionTitle}>2. Nivel de Prioridad / Riesgo</Text>
      <View style={styles.urgencyRow}>
        {URGENCIES.map(u => {
          const isSelected = urgency === u.id
          return (
            <TouchableOpacity
              key={u.id}
              style={[
                styles.urgencyBtn,
                isSelected && { backgroundColor: u.color, borderColor: u.color }
              ]}
              onPress={() => setUrgency(u.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.urgencyText, isSelected && { color: '#ffffff' }]}>
                {u.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* 3. Ubicación y GPS */}
      <View style={styles.rowBetween}>
        <Text style={styles.sectionTitle}>3. Ubicación del Incidente</Text>
        <TouchableOpacity
          style={styles.btnGps}
          onPress={handleGetGps}
          disabled={isLocating}
          activeOpacity={0.7}
        >
          {isLocating ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <Ionicons name="navigate" size={13} color={colors.primary} />
              <Text style={styles.btnGpsText}>Fijar GPS</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.textInput}
        value={location}
        onChangeText={setLocation}
        placeholder="Ej. Cartago Centro, 200 m este de la iglesia"
        placeholderTextColor={colors.textLight}
      />

      {lat && lng && (
        <View style={styles.gpsBadge}>
          <Ionicons name="checkmark-circle" size={14} color={colors.urgencyLow} />
          <Text style={styles.gpsBadgeText}>
            Coordenadas satelitales fijadas: {lat.toFixed(4)}, {lng.toFixed(4)} (±{gpsAccuracy}m)
          </Text>
        </View>
      )}

      {/* 4. Descripción */}
      <Text style={styles.sectionTitle}>4. Descripción de la Situación</Text>
      <TextInput
        style={[styles.textInput, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Indica qué sucede, si hay peligro para vecinos, rutas alternas o servicios afectados..."
        placeholderTextColor={colors.textLight}
        multiline
        numberOfLines={3}
        maxLength={500}
      />
      <Text style={styles.charCounter}>{description.length} / 500 caracteres</Text>

      {/* 5. Modo Anónimo */}
      <View style={styles.anonCard}>
        <View style={styles.anonInfo}>
          <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
          <View style={styles.anonTexts}>
            <Text style={styles.anonTitle}>Reporte Anónimo Protegido</Text>
            <Text style={styles.anonDesc}>Oculta tu identidad para reportes de seguridad ciudadana.</Text>
          </View>
        </View>
        <Switch
          value={isAnonymous}
          onValueChange={setIsAnonymous}
          trackColor={{ false: '#cbd5e1', true: colors.primaryLight }}
          thumbColor={isAnonymous ? colors.primary : '#f8fafc'}
        />
      </View>

      {/* Botón de Envío */}
      <TouchableOpacity
        style={[styles.btnSubmit, submitting && styles.btnSubmitDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
        activeOpacity={0.8}
      >
        {submitting ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <>
            <Ionicons name="paper-plane" size={18} color="#ffffff" />
            <Text style={styles.btnSubmitText}>Radicar Reporte Ciudadano</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Modal de Confirmación de Ticket Generado */}
      {createdTicket && (
        <Modal
          visible={!!createdTicket}
          animationType="fade"
          transparent={true}
          onRequestClose={resetForm}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.successModalCard}>
              <View style={styles.successIconCircle}>
                <Ionicons name="checkmark" size={32} color="#ffffff" />
              </View>

              <Text style={styles.successTitle}>¡Reporte Registrado!</Text>
              <Text style={styles.successDesc}>
                Tu notificación ha sido radicada formalmente ante la municipalidad correspondiente.
              </Text>

              <View style={styles.ticketCodeBox}>
                <Text style={styles.ticketCodeLabel}>CÓDIGO OFICIAL DE SEGUIMIENTO</Text>
                <Text style={styles.ticketCodeValue}>{createdTicket.ticketCode}</Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.btnModalTrack}
                  onPress={() => {
                    const code = createdTicket.ticketCode
                    resetForm()
                    if (navigation) navigation.navigate('Rastrear', { code })
                  }}
                >
                  <Ionicons name="search" size={16} color="#ffffff" />
                  <Text style={styles.btnModalTrackText}>Rastrear Ticket</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.btnModalNew} onPress={resetForm}>
                  <Text style={styles.btnModalNewText}>Crear otro reporte</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    padding: 18,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textMain,
    marginBottom: 10,
    marginTop: 6,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textMain,
    flexShrink: 1,
  },
  urgencyRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  urgencyBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  btnGps: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  btnGpsText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13.5,
    color: colors.textMain,
    marginBottom: 6,
  },
  textArea: {
    height: 75,
    textAlignVertical: 'top',
  },
  gpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.urgencyLowBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  gpsBadgeText: {
    fontSize: 11.5,
    color: colors.urgencyLow,
    fontWeight: '600',
  },
  charCounter: {
    fontSize: 11,
    color: colors.textLight,
    textAlign: 'right',
    marginBottom: 16,
  },
  anonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
    ...shadows.sm,
  },
  anonInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  anonTexts: {
    flex: 1,
  },
  anonTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMain,
  },
  anonDesc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  btnSubmit: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    ...shadows.md,
  },
  btnSubmitDisabled: {
    opacity: 0.6,
  },
  btnSubmitText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successModalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    ...shadows.md,
  },
  successIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.urgencyLow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textMain,
    marginBottom: 6,
  },
  successDesc: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  ticketCodeBox: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1.5,
    borderColor: '#bae6fd',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  ticketCodeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  ticketCodeValue: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 1,
  },
  modalActions: {
    width: '100%',
    gap: 10,
  },
  btnModalTrack: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  btnModalTrackText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  btnModalNew: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnModalNewText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
})
