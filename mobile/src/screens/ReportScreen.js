import React, { useState, useEffect } from 'react'
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
  Image,
  ActivityIndicator,
  Linking
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Location from 'expo-location'
import * as ImagePicker from 'expo-image-picker'
import { colors, shadows } from '../theme/colors'
import { addIncident } from '../services/incidentService'
import { getWebMapUrl } from '../config'
import { getCurrentUser, getRegisteredCitizens, login, DEFAULT_CITIZENS } from '../services/authService'

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

const MAX_PHOTOS = 3

export default function ReportScreen({ navigation }) {
  const [category, setCategory] = useState('Inundación')
  const [urgency, setUrgency] = useState('Media')
  const [location, setLocation] = useState('Barrio El Carmen, 100 m norte del parque')
  const [lat, setLat] = useState(null)
  const [lng, setLng] = useState(null)
  const [gpsAccuracy, setGpsAccuracy] = useState(null)
  const [isLocating, setIsLocating] = useState(false)
  const [description, setDescription] = useState('')
  const [photos, setPhotos] = useState([])
  const [video, setVideo] = useState(null)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [createdTicket, setCreatedTicket] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [citizens, setCitizens] = useState([])
  const [showUserModal, setShowUserModal] = useState(false)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    const user = await getCurrentUser()
    const allCitizens = await getRegisteredCitizens()
    setCitizens(allCitizens)
    if (user) {
      setCurrentUser(user)
    } else {
      const defaultUser = allCitizens[0] || DEFAULT_CITIZENS[0]
      setCurrentUser(defaultUser)
      await login(defaultUser.username, '123')
    }
  }

  const handleSelectUser = async (citizen) => {
    await login(citizen.username, citizen.password || '123')
    setCurrentUser(citizen)
    setShowUserModal(false)
    Alert.alert('Identidad actualizada', `Ahora reportas como ${citizen.fullName} (${citizen.canton})`)
  }

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

  // Capturar o elegir fotografía
  const handlePickPhoto = async (useCamera = false) => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert('Límite alcanzado', `Puedes adjuntar hasta ${MAX_PHOTOS} fotografías de evidencia.`)
      return
    }

    try {
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync()
        if (status !== 'granted') {
          Alert.alert('Permiso requerido', 'Se requiere acceso a la cámara para tomar fotos de evidencia.')
          return
        }
        const result = await ImagePicker.launchCameraAsync({
          quality: 0.7,
          allowsEditing: true
        })
        if (!result.canceled && result.assets && result.assets.length > 0) {
          setPhotos(prev => [...prev, { uri: result.assets[0].uri, id: Date.now() + Math.random() }])
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (status !== 'granted') {
          Alert.alert('Permiso requerido', 'Se requiere acceso a la galería para adjuntar fotos.')
          return
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.7,
          allowsMultipleSelection: false
        })
        if (!result.canceled && result.assets && result.assets.length > 0) {
          setPhotos(prev => [...prev, { uri: result.assets[0].uri, id: Date.now() + Math.random() }])
        }
      }
    } catch {
      Alert.alert('Error', 'No se pudo cargar la imagen seleccionada.')
    }
  }

  const handleRemovePhoto = (id) => {
    setPhotos(prev => prev.filter(p => p.id !== id))
  }

  const handlePickVideo = async (useCamera = false) => {
    try {
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync()
        if (status !== 'granted') {
          Alert.alert('Permiso requerido', 'Se requiere acceso a la cámara para grabar video.')
          return
        }
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Videos,
          videoMaxDuration: 25
        })
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0]
          setVideo({
            uri: asset.uri,
            duration: asset.duration ? Math.round(asset.duration / 1000) : 15
          })
          Alert.alert('Video adjunto', 'Video de evidencia grabado con éxito.')
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (status !== 'granted') {
          Alert.alert('Permiso requerido', 'Se requiere acceso a la galería para adjuntar video.')
          return
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Videos
        })
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0]
          setVideo({
            uri: asset.uri,
            duration: asset.duration ? Math.round(asset.duration / 1000) : 15
          })
          Alert.alert('Video adjunto', 'Video de evidencia seleccionado con éxito.')
        }
      }
    } catch {
      Alert.alert('Error', 'No se pudo procesar el video.')
    }
  }

  const handleRemoveVideo = () => {
    setVideo(null)
  }

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Campo obligatorio', 'Por favor ingresa una breve descripción del incidente.')
      return
    }

    const reporter = isAnonymous ? null : (currentUser?.fullName || 'Ramsés Solano Calvo')

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
        photos: photos.map(p => ({ uri: p.uri })),
        photo: photos[0] ? photos[0].uri : null,
        video: video ? { uri: video.uri, duration: video.duration } : null,
        isAnonymous,
        reporterName: reporter
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
    setPhotos([])
    setVideo(null)
    setLat(null)
    setLng(null)
    setCreatedTicket(null)
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Tarjeta de Identidad del Vecino Comunitario */}
      <View style={styles.residentHeaderCard}>
        <View style={styles.residentAvatarWrap}>
          <Ionicons name={isAnonymous ? "shield-checkmark" : "person"} size={22} color="#ffffff" />
        </View>
        <View style={styles.residentDetails}>
          <Text style={styles.residentHeaderLabel}>Vecino Reportante:</Text>
          <Text style={styles.residentHeaderName}>
            {isAnonymous ? '🛡️ Anónimo Protegido' : (currentUser?.fullName || 'Ramsés Solano Calvo')}
          </Text>
          <Text style={styles.residentHeaderSub}>
            {isAnonymous
              ? 'Tu nombre no se mostrará en el ticket público'
              : `${currentUser?.barrio || 'Barrio El Carmen'}, ${currentUser?.canton || 'Cartago'} • Firma pública`}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.btnChangeResident}
          onPress={() => setShowUserModal(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="swap-horizontal" size={16} color={colors.primary} />
          <Text style={styles.btnChangeResidentText}>Cambiar</Text>
        </TouchableOpacity>
      </View>

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

      {/* 5. Evidencia Fotográfica (Hasta 3 fotos) */}
      <View style={styles.rowBetween}>
        <Text style={styles.sectionTitle}>5. Fotografías ({photos.length}/{MAX_PHOTOS})</Text>
        <View style={styles.mediaButtonsRow}>
          <TouchableOpacity
            style={styles.btnMediaAction}
            onPress={() => handlePickPhoto(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="camera" size={14} color={colors.primary} />
            <Text style={styles.btnMediaActionText}>Cámara</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnMediaAction}
            onPress={() => handlePickPhoto(false)}
            activeOpacity={0.7}
          >
            <Ionicons name="images" size={14} color={colors.primary} />
            <Text style={styles.btnMediaActionText}>Galería</Text>
          </TouchableOpacity>
        </View>
      </View>

      {photos.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
          {photos.map((item, idx) => (
            <View key={item.id} style={styles.photoThumbWrapper}>
              <Image source={{ uri: item.uri }} style={styles.photoThumb} />
              <TouchableOpacity
                style={styles.btnRemoveThumb}
                onPress={() => handleRemovePhoto(item.id)}
              >
                <Ionicons name="close" size={14} color="#ffffff" />
              </TouchableOpacity>
              <Text style={styles.photoIndexBadge}>#{idx + 1}</Text>
            </View>
          ))}
          {/* Modal para Selección / Cambio de Vecino Comunitario */}
      <Modal
        visible={showUserModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUserModal(false)}
      >
        <View style={styles.userModalOverlay}>
          <View style={styles.userModalCard}>
            <View style={styles.userModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.userModalTitle}>Identidad del Reportante</Text>
                <Text style={styles.userModalSubtitle}>Selecciona el vecino que firma la notificación pública</Text>
              </View>
              <TouchableOpacity onPress={() => setShowUserModal(false)} style={styles.btnCloseUserModal}>
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.userModalList}>
              {citizens.map(c => {
                const isSelected = currentUser && (currentUser.id === c.id || currentUser.username === c.username)
                return (
                  <TouchableOpacity
                    key={c.id || c.username}
                    style={[styles.userModalItem, isSelected && styles.userModalItemSelected]}
                    onPress={() => handleSelectUser(c)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.userModalAvatar, isSelected && { backgroundColor: colors.primary }]}>
                      <Ionicons name="person" size={20} color={isSelected ? '#ffffff' : colors.textMuted} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.userModalItemName, isSelected && { color: colors.primary, fontWeight: '800' }]}>
                        {c.fullName}
                      </Text>
                      <Text style={styles.userModalItemSub}>
                        {c.barrio}, {c.canton} • {c.role}
                      </Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
                  </TouchableOpacity>
                )
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.btnGoToProfile}
              onPress={() => {
                setShowUserModal(false)
                if (navigation) navigation.navigate('Perfil')
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="person-add" size={16} color={colors.primary} />
              <Text style={styles.btnGoToProfileText}>Crear o gestionar cuentas vecinales</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
      )}

      {/* 5. Video de Evidencia (Opcional) */}
      <View style={styles.rowBetween}>
        <Text style={styles.sectionTitle}>5. Video de Evidencia (Opcional)</Text>
        {!video && (
          <View style={styles.mediaButtonsRow}>
            <TouchableOpacity
              style={styles.btnMediaAction}
              onPress={() => handlePickVideo(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="videocam" size={14} color={colors.primary} />
              <Text style={[styles.btnMediaActionText, { color: colors.primary }]}>Grabar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnMediaAction}
              onPress={() => handlePickVideo(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="film" size={14} color={colors.primary} />
              <Text style={[styles.btnMediaActionText, { color: colors.primary }]}>Elegir</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {video && (
        <View style={styles.videoCard}>
          <View style={styles.videoCardInfo}>
            <Ionicons name="film" size={20} color={colors.primary} />
            <View>
              <Text style={styles.videoCardTitle}>Video de evidencia adjunto</Text>
              <Text style={styles.videoCardSubtitle}>Duración aprox. {video.duration} s</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.btnRemoveVideo} onPress={handleRemoveVideo}>
            <Ionicons name="trash" size={16} color={colors.cne} />
          </TouchableOpacity>
        </View>
      )}

      {/* 6. Modo Anónimo */}
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
                <Text style={styles.ticketReporterPreview}>
                  Reportado por: {createdTicket.isAnonymous ? 'Anónimo Protegido' : (createdTicket.reporterName || currentUser?.fullName || 'Ramsés Solano Calvo')}
                </Text>
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

                <TouchableOpacity
                  style={styles.btnModalMap}
                  onPress={() => {
                    const lat = createdTicket.lat || 9.8644
                    const lng = createdTicket.lng || -83.9194
                    const title = createdTicket.title || 'Reporte'
                    resetForm()
                    Linking.openURL(getWebMapUrl(lat, lng, title))
                  }}
                >
                  <Ionicons name="map" size={16} color="#ffffff" />
                  <Text style={styles.btnModalMapText}>Ver en Mapa Web</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.btnModalNew} onPress={resetForm}>
                  <Text style={styles.btnModalNewText}>Crear otro reporte</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
      {/* Modal para Selección / Cambio de Vecino Comunitario */}
      <Modal
        visible={showUserModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUserModal(false)}
      >
        <View style={styles.userModalOverlay}>
          <View style={styles.userModalCard}>
            <View style={styles.userModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.userModalTitle}>Identidad del Reportante</Text>
                <Text style={styles.userModalSubtitle}>Selecciona el vecino que firma la notificación pública</Text>
              </View>
              <TouchableOpacity onPress={() => setShowUserModal(false)} style={styles.btnCloseUserModal}>
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.userModalList}>
              {citizens.map(c => {
                const isSelected = currentUser && (currentUser.id === c.id || currentUser.username === c.username)
                return (
                  <TouchableOpacity
                    key={c.id || c.username}
                    style={[styles.userModalItem, isSelected && styles.userModalItemSelected]}
                    onPress={() => handleSelectUser(c)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.userModalAvatar, isSelected && { backgroundColor: colors.primary }]}>
                      <Ionicons name="person" size={20} color={isSelected ? '#ffffff' : colors.textMuted} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.userModalItemName, isSelected && { color: colors.primary, fontWeight: '800' }]}>
                        {c.fullName}
                      </Text>
                      <Text style={styles.userModalItemSub}>
                        {c.barrio}, {c.canton} • {c.role}
                      </Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
                  </TouchableOpacity>
                )
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.btnGoToProfile}
              onPress={() => {
                setShowUserModal(false)
                if (navigation) navigation.navigate('Perfil')
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="person-add" size={16} color={colors.primary} />
              <Text style={styles.btnGoToProfileText}>Crear o gestionar cuentas vecinales</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  mediaButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  btnMediaAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  btnMediaActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  photosScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  photoThumbWrapper: {
    position: 'relative',
    marginRight: 10,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoThumb: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  btnRemoveThumb: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoIndexBadge: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 4,
    borderRadius: 3,
  },
  videoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  videoCardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  videoCardTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textMain,
  },
  videoCardSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
  },
  btnRemoveVideo: {
    padding: 6,
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
  btnModalMap: {
    backgroundColor: '#0284c7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  btnModalMapText: {
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
  ticketReporterPreview: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
    marginTop: 6,
    textAlign: 'center',
  },
  residentHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    ...shadows.sm,
    gap: 10,
  },
  residentAvatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  residentDetails: {
    flex: 1,
  },
  residentHeaderLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  residentHeaderName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1e293b',
  },
  residentHeaderSub: {
    fontSize: 11,
    color: colors.primaryDark,
    marginTop: 2,
  },
  btnChangeResident: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary + '14',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  btnChangeResidentText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  userModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  userModalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
    ...shadows.md,
  },
  userModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  userModalTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#1e293b',
  },
  userModalSubtitle: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 2,
  },
  btnCloseUserModal: {
    padding: 6,
  },
  userModalList: {
    maxHeight: 280,
    marginBottom: 14,
  },
  userModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginBottom: 8,
    gap: 10,
    backgroundColor: '#f8fafc',
  },
  userModalItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  userModalAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userModalItemName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1e293b',
  },
  userModalItemSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  btnGoToProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    gap: 6,
  },
  btnGoToProfileText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.primary,
  },
})
