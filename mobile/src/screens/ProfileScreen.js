import React, { useState, useEffect } from 'react'
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { colors, shadows } from '../theme/colors'
import {
  getCurrentUser,
  getRegisteredCitizens,
  login,
  registerCitizen,
  logout,
  updateUserProfile,
  uploadAvatar,
  resolveAvatarUrl,
  DEFAULT_CITIZENS
} from '../services/authService'

export default function ProfileScreen({ navigation }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [resolvedAvatar, setResolvedAvatar] = useState('')
  const [citizens, setCitizens] = useState([])
  const [activeTab, setActiveTab] = useState('perfil') // 'perfil' | 'login' | 'register'
  const [isEditing, setIsEditing] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)

  // Campos de edición de perfil
  const [editFullName, setEditFullName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editCanton, setEditCanton] = useState('Cartago')
  const [editDistrict, setEditDistrict] = useState('')
  const [editNeighborhood, setEditNeighborhood] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editEmergencyContact, setEditEmergencyContact] = useState('')
  const [editWorkSchedule, setEditWorkSchedule] = useState('')
  const [editBadgeNumber, setEditBadgeNumber] = useState('')

  // Formulario Login
  const [loginIdentifier, setLoginIdentifier] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loadingLogin, setLoadingLogin] = useState(false)

  // Formulario Registro
  const [regFullName, setRegFullName] = useState('')
  const [regCanton, setRegCanton] = useState('Cartago')
  const [regBarrio, setRegBarrio] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [loadingReg, setLoadingReg] = useState(false)

  useEffect(() => {
    loadUserData()
  }, [])

  const syncEditFields = async (u) => {
    if (!u) return
    setEditFullName(u.fullName || '')
    setEditEmail(u.email || '')
    setEditPhone(u.phoneNumber || u.phone || '')
    setEditCanton(u.canton || 'Cartago')
    setEditDistrict(u.district || '')
    setEditNeighborhood(u.neighborhood || u.barrio || '')
    setEditBio(u.bio || '')
    setEditEmergencyContact(u.emergencyContact || '')
    setEditWorkSchedule(u.workSchedule || '')
    setEditBadgeNumber(u.badgeNumber || '')
    const av = await resolveAvatarUrl(u.avatarUrl || '')
    setResolvedAvatar(av)
  }

  const loadUserData = async () => {
    const user = await getCurrentUser()
    const allCitizens = await getRegisteredCitizens()
    setCitizens(allCitizens)

    if (user) {
      setCurrentUser(user)
      await syncEditFields(user)
    } else {
      // Por defecto el vecino de Cartago
      const defaultUser = allCitizens[0] || DEFAULT_CITIZENS[0]
      setCurrentUser(defaultUser)
      await login(defaultUser.username, '123')
      await syncEditFields(defaultUser)
    }
  }

  const handlePickAvatar = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!perm.granted) {
        Alert.alert('Permiso requerido', 'Se requiere acceso a tu galería para elegir una foto de perfil.')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.75
      })

      if (result.canceled || !result.assets?.[0]?.uri) return

      const localUri = result.assets[0].uri
      setResolvedAvatar(localUri)

      const uploaded = await uploadAvatar(localUri)
      const finalAvatarUrl = uploaded?.avatarUrl || localUri

      const res = await updateUserProfile({
        avatarUrl: finalAvatarUrl
      })
      if (res.success) {
        setCurrentUser(res.user)
        const resolved = await resolveAvatarUrl(res.user.avatarUrl || finalAvatarUrl)
        setResolvedAvatar(resolved)
        Alert.alert('Foto actualizada', 'Tu foto de perfil se guardó correctamente.')
      }
    } catch {
      Alert.alert('Error', 'No se pudo actualizar la foto de perfil.')
    }
  }

  const handleSaveProfile = async () => {
    if (!editFullName.trim()) {
      Alert.alert('Campo requerido', 'El nombre completo es obligatorio.')
      return
    }
    setSavingProfile(true)
    try {
      const res = await updateUserProfile({
        fullName: editFullName.trim(),
        email: editEmail.trim(),
        phoneNumber: editPhone.trim(),
        phone: editPhone.trim(),
        canton: editCanton.trim() || 'Cartago',
        district: editDistrict.trim(),
        neighborhood: editNeighborhood.trim(),
        barrio: editNeighborhood.trim(),
        bio: editBio.trim(),
        emergencyContact: editEmergencyContact.trim(),
        workSchedule: editWorkSchedule.trim(),
        badgeNumber: editBadgeNumber.trim()
      })
      if (res.success) {
        setCurrentUser(res.user)
        const updated = await getRegisteredCitizens()
        setCitizens(updated)
        setIsEditing(false)
        Alert.alert('Perfil actualizado', 'Tus datos personales se guardaron correctamente.')
      } else {
        Alert.alert('Error', res.error || 'No se pudo actualizar el perfil.')
      }
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSelectCitizen = async (citizen) => {
    const res = await login(citizen.username, citizen.password || '123')
    if (res.success) {
      setCurrentUser(res.user)
      await syncEditFields(res.user)
      setIsEditing(false)
      Alert.alert('Perfil activado', `Iniciaste como ${res.user.fullName} (${res.user.canton}). Los próximos reportes se firmarán con tu nombre.`)
      setActiveTab('perfil')
    } else {
      Alert.alert('Aviso', res.error || 'No se pudo activar el usuario.')
    }
  }

  const handleLoginSubmit = async () => {
    if (!loginIdentifier.trim()) {
      Alert.alert('Campo requerido', 'Ingresa tu usuario, correo o teléfono.')
      return
    }
    setLoadingLogin(true)
    try {
      const res = await login(loginIdentifier.trim(), loginPassword.trim())
      if (res.success) {
        setCurrentUser(res.user)
        Alert.alert('¡Bienvenido!', `Has iniciado sesión como ${res.user.fullName}`)
        setLoginIdentifier('')
        setActiveTab('perfil')
      } else {
        Alert.alert('Error de acceso', res.error || 'Credenciales inválidas.')
      }
    } catch {
      Alert.alert('Error', 'Ocurrió un fallo de conexión.')
    } finally {
      setLoadingLogin(false)
    }
  }

  const handleRegisterSubmit = async () => {
    if (!regFullName.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa tu nombre y apellidos.')
      return
    }
    if (!regBarrio.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa tu barrio o comunidad.')
      return
    }
    setLoadingReg(true)
    try {
      const res = await registerCitizen({
        fullName: regFullName.trim(),
        canton: regCanton,
        barrio: regBarrio.trim(),
        phone: regPhone.trim(),
        password: regPassword.trim()
      })

      if (res.success) {
        setCurrentUser(res.user)
        const updated = await getRegisteredCitizens()
        setCitizens(updated)
        Alert.alert('¡Registro Exitoso!', `Bienvenido a Barrio al Día, ${res.user.fullName}. Tus reportes llevarán tu nombre en el portal web y móvil.`)
        setRegFullName('')
        setRegBarrio('')
        setRegPhone('')
        setActiveTab('perfil')
      } else {
        Alert.alert('Error', res.error || 'No se pudo completar el registro.')
      }
    } catch {
      Alert.alert('Error', 'Error inesperado al registrar el vecino.')
    } finally {
      setLoadingReg(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    Alert.alert('Sesión cerrada', 'Puedes ingresar con otra cuenta de vecino.')
    setActiveTab('login')
    setCurrentUser(null)
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Pestañas Superiores */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'perfil' && styles.tabBtnActive]}
          onPress={() => setActiveTab('perfil')}
        >
          <Ionicons
            name="person-circle"
            size={18}
            color={activeTab === 'perfil' ? colors.primary : colors.textMuted}
          />
          <Text style={[styles.tabBtnText, activeTab === 'perfil' && styles.tabBtnTextActive]}>
            Mi Perfil
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'login' && styles.tabBtnActive]}
          onPress={() => setActiveTab('login')}
        >
          <Ionicons
            name="log-in"
            size={18}
            color={activeTab === 'login' ? colors.primary : colors.textMuted}
          />
          <Text style={[styles.tabBtnText, activeTab === 'login' && styles.tabBtnTextActive]}>
            Ingresar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'register' && styles.tabBtnActive]}
          onPress={() => setActiveTab('register')}
        >
          <Ionicons
            name="person-add"
            size={18}
            color={activeTab === 'register' ? colors.primary : colors.textMuted}
          />
          <Text style={[styles.tabBtnText, activeTab === 'register' && styles.tabBtnTextActive]}>
            Crear Cuenta
          </Text>
        </TouchableOpacity>
      </View>

      {/* 1. VISTA DE PERFIL ACTIVO */}
      {activeTab === 'perfil' && (
        <View>
          {currentUser ? (
            <View style={styles.profileCard}>
              <TouchableOpacity
                style={styles.avatarCircle}
                onPress={handlePickAvatar}
                activeOpacity={0.8}
              >
                {resolvedAvatar ? (
                  <Image source={{ uri: resolvedAvatar }} style={styles.avatarImg} />
                ) : (
                  <Ionicons name="person" size={42} color="#ffffff" />
                )}
                <View style={styles.avatarCamBadge}>
                  <Ionicons name="camera" size={14} color="#ffffff" />
                </View>
              </TouchableOpacity>
              <Text style={styles.avatarHint}>Toca la foto para cambiarla</Text>
              <Text style={styles.profileName}>{currentUser.fullName}</Text>
              <Text style={styles.profileRole}>{currentUser.role || 'Vecino Comunitario'}</Text>

              <View style={styles.badgeLocation}>
                <Ionicons name="location" size={14} color={colors.primary} />
                <Text style={styles.badgeLocationText}>
                  {currentUser.neighborhood || currentUser.barrio || 'Centro'}
                  {currentUser.district ? `, ${currentUser.district}` : ''}
                  {`, ${currentUser.canton || 'Cartago'}`}
                </Text>
              </View>

              {isEditing ? (
                <View style={styles.editFormWrap}>
                  <Text style={styles.editFieldLabel}>Nombre y Apellidos</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editFullName}
                    onChangeText={setEditFullName}
                    placeholder="Ej. Ramsés Solano Calvo"
                  />

                  <Text style={styles.editFieldLabel}>Correo Electrónico</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editEmail}
                    onChangeText={setEditEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="correo@ejemplo.com"
                  />

                  <Text style={styles.editFieldLabel}>Teléfono / WhatsApp</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editPhone}
                    onChangeText={setEditPhone}
                    keyboardType="phone-pad"
                    placeholder="8888-0000"
                  />

                  <Text style={styles.editFieldLabel}>Cantón</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editCanton}
                    onChangeText={setEditCanton}
                    placeholder="Cartago / Turrialba / Tarrazú"
                  />

                  <Text style={styles.editFieldLabel}>Distrito</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editDistrict}
                    onChangeText={setEditDistrict}
                    placeholder="Ej. Oriental / El Carmen"
                  />

                  <Text style={styles.editFieldLabel}>Barrio / Comunidad</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editNeighborhood}
                    onChangeText={setEditNeighborhood}
                    placeholder="Ej. Barrio Los Ángeles"
                  />

                  <Text style={styles.editFieldLabel}>Biografía / Rol Comunitario</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editBio}
                    onChangeText={setEditBio}
                    placeholder="Ej. Líder comunal / Comité de Seguridad"
                  />

                  {currentUser.badgeNumber || currentUser.userType === 'Official' ? (
                    <>
                      <Text style={styles.editFieldLabel}>Placa / Folio Institucional</Text>
                      <TextInput
                        style={styles.editInput}
                        value={editBadgeNumber}
                        onChangeText={setEditBadgeNumber}
                        placeholder="Ej. MC-4921"
                      />
                      <Text style={styles.editFieldLabel}>Turno / Horario de Atención</Text>
                      <TextInput
                        style={styles.editInput}
                        value={editWorkSchedule}
                        onChangeText={setEditWorkSchedule}
                        placeholder="Ej. L-V 7:30 a.m. - 4:00 p.m."
                      />
                    </>
                  ) : (
                    <>
                      <Text style={styles.editFieldLabel}>Contacto de Emergencia (Opcional)</Text>
                      <TextInput
                        style={styles.editInput}
                        value={editEmergencyContact}
                        onChangeText={setEditEmergencyContact}
                        placeholder="Ej. Ana Calvo - 8888-1111"
                      />
                    </>
                  )}

                  <View style={styles.editActionsRow}>
                    <TouchableOpacity
                      style={styles.btnCancelEdit}
                      onPress={() => {
                        syncEditFields(currentUser)
                        setIsEditing(false)
                      }}
                    >
                      <Text style={styles.btnCancelEditText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.btnSaveEdit}
                      onPress={handleSaveProfile}
                      disabled={savingProfile}
                    >
                      {savingProfile ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={styles.btnSaveEditText}>Guardar Datos</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Usuario:</Text>
                      <Text style={styles.infoValue}>{currentUser.username || 'vecino'}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Correo:</Text>
                      <Text style={styles.infoValue}>{currentUser.email || 'No registrado'}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Teléfono:</Text>
                      <Text style={styles.infoValue}>{currentUser.phoneNumber || currentUser.phone || '8888-0000'}</Text>
                    </View>
                    {currentUser.bio ? (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Biografía:</Text>
                        <Text style={[styles.infoValue, { flex: 1, textAlign: 'right', marginLeft: 12 }]}>
                          {currentUser.bio}
                        </Text>
                      </View>
                    ) : null}
                    {currentUser.workSchedule ? (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Horario:</Text>
                        <Text style={styles.infoValue}>{currentUser.workSchedule}</Text>
                      </View>
                    ) : null}
                    {currentUser.emergencyContact ? (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Emergencia:</Text>
                        <Text style={styles.infoValue}>{currentUser.emergencyContact}</Text>
                      </View>
                    ) : null}
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Visibilidad:</Text>
                      <Text style={[styles.infoValue, { color: colors.primary, fontWeight: '800' }]}>
                        Firma pública en reportes
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.btnEditProfile}
                    onPress={() => {
                      syncEditFields(currentUser)
                      setIsEditing(true)
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="create-outline" size={18} color="#ffffff" />
                    <Text style={styles.btnEditProfileText}>Personalizar Datos y Foto</Text>
                  </TouchableOpacity>
                </>
              )}

              <View style={styles.helpNoteBox}>
                <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
                <Text style={styles.helpNoteText}>
                  Cuando crees un reporte sin marcar "Anónimo", aparecerá tu nombre ({currentUser.fullName}) en el ticket del portal web municipal.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.btnLogout}
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <Ionicons name="log-out-outline" size={18} color="#dc2626" />
                <Text style={styles.btnLogoutText}>Cerrar Sesión</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noUserBox}>
              <Ionicons name="alert-circle" size={48} color={colors.textMuted} />
              <Text style={styles.noUserTitle}>Sin sesión comunitaria activa</Text>
              <Text style={styles.noUserSub}>
                Elige un vecino de la lista rápida o ingresa con tu cuenta.
              </Text>
            </View>
          )}

          {/* Selector Rápido de Vecinos Comunitarios */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="people" size={18} color={colors.primary} /> Vecinos Registrados en la Comunidad
            </Text>
            <Text style={styles.sectionSubtitle}>
              Toca un vecino para cambiar de identidad inmediatamente:
            </Text>

            {citizens.map(c => {
              const isSelected = currentUser && (currentUser.id === c.id || currentUser.username === c.username)
              return (
                <TouchableOpacity
                  key={c.id || c.username}
                  style={[styles.citizenChoiceCard, isSelected && styles.citizenChoiceSelected]}
                  onPress={() => handleSelectCitizen(c)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.choiceAvatar, isSelected && { backgroundColor: colors.primary }]}>
                    <Ionicons name="person" size={20} color={isSelected ? '#ffffff' : colors.textMuted} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.choiceName, isSelected && { color: colors.primary, fontWeight: '800' }]}>
                      {c.fullName}
                    </Text>
                    <Text style={styles.choiceLocation}>
                      {c.barrio}, {c.canton} • {c.role}
                    </Text>
                  </View>
                  {isSelected ? (
                    <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                  ) : (
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                  )}
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      )}

      {/* 2. VISTA DE INICIO DE SESIÓN */}
      {activeTab === 'login' && (
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Ionicons name="lock-closed" size={32} color={colors.primary} />
            <Text style={styles.formTitle}>Iniciar Sesión Ciudadana</Text>
            <Text style={styles.formSubtitle}>
              Ingresa tu usuario, correo electrónico o número telefónico registrado.
            </Text>
          </View>

          <Text style={styles.inputLabel}>Usuario, Correo o Teléfono:</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: vecino.cartago o ramses@comunidad.cr"
            placeholderTextColor={colors.textMuted}
            value={loginIdentifier}
            onChangeText={setLoginIdentifier}
            autoCapitalize="none"
          />

          <Text style={styles.inputLabel}>Contraseña:</Text>
          <TextInput
            style={styles.input}
            placeholder="Contraseña (por defecto 123)"
            placeholderTextColor={colors.textMuted}
            value={loginPassword}
            onChangeText={setLoginPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={handleLoginSubmit}
            disabled={loadingLogin}
            activeOpacity={0.8}
          >
            {loadingLogin ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Ionicons name="log-in" size={18} color="#ffffff" />
                <Text style={styles.btnPrimaryText}>Ingresar al Sistema</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Accesos rápidos sugeridos */}
          <View style={styles.quickAccountsBox}>
            <Text style={styles.quickAccountsTitle}>Cuentas comunitarias disponibles:</Text>
            <TouchableOpacity
              style={styles.quickBtn}
              onPress={() => { setLoginIdentifier('vecino.cartago'); setLoginPassword('') }}
            >
              <Text style={styles.quickBtnText}>👤 Ramsés Solano (vecino.cartago - Cartago)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickBtn}
              onPress={() => { setLoginIdentifier('vecino.turrialba'); setLoginPassword('') }}
            >
              <Text style={styles.quickBtnText}>👤 María Gómez (vecino.turrialba - Turrialba)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickBtn}
              onPress={() => { setLoginIdentifier('vecino.tarrazu'); setLoginPassword('') }}
            >
              <Text style={styles.quickBtnText}>👤 Carlos Ureña (vecino.tarrazu - Tarrazú)</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 3. VISTA DE CREAR CUENTA */}
      {activeTab === 'register' && (
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Ionicons name="person-add" size={32} color={colors.primary} />
            <Text style={styles.formTitle}>Registro de Vecino Comunitario</Text>
            <Text style={styles.formSubtitle}>
              Únete a la red vecinal de Cartago, Turrialba y Tarrazú para fiscalizar tu barrio.
            </Text>
          </View>

          <Text style={styles.inputLabel}>Nombre y Apellidos completos (*):</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Ramsés Solano Calvo"
            placeholderTextColor={colors.textMuted}
            value={regFullName}
            onChangeText={setRegFullName}
          />

          <Text style={styles.inputLabel}>Cantón de Residencia (*):</Text>
          <View style={styles.cantonPickerRow}>
            {['Cartago', 'Turrialba', 'Tarrazú'].map(cant => {
              const isSelected = regCanton === cant
              return (
                <TouchableOpacity
                  key={cant}
                  style={[styles.cantonOptionBtn, isSelected && styles.cantonOptionBtnActive]}
                  onPress={() => setRegCanton(cant)}
                >
                  <Text style={[styles.cantonOptionText, isSelected && styles.cantonOptionTextActive]}>
                    {cant}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          <Text style={styles.inputLabel}>Barrio o Comunidad (*):</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Barrio El Carmen, San Marcos, etc."
            placeholderTextColor={colors.textMuted}
            value={regBarrio}
            onChangeText={setRegBarrio}
          />

          <Text style={styles.inputLabel}>Teléfono Celular:</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: 8888-1234"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            value={regPhone}
            onChangeText={setRegPhone}
          />

          <Text style={styles.inputLabel}>Contraseña de Acceso:</Text>
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor={colors.textMuted}
            value={regPassword}
            onChangeText={setRegPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={handleRegisterSubmit}
            disabled={loadingReg}
            activeOpacity={0.8}
          >
            {loadingReg ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                <Text style={styles.btnPrimaryText}>Registrar y Activar Mi Cuenta</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...shadows.sm
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6
  },
  tabBtnActive: {
    backgroundColor: colors.primary + '14'
  },
  tabBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textMuted
  },
  tabBtnTextActive: {
    color: colors.primary
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    ...shadows.sm
  },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    position: 'relative',
  },
  avatarImg: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  avatarCamBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  avatarHint: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 8,
  },
  btnEditProfile: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 11,
    borderRadius: 10,
    marginTop: 14,
  },
  btnEditProfileText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13.5,
  },
  editFormWrap: {
    width: '100%',
    gap: 8,
    marginTop: 6,
  },
  editFieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginTop: 4,
  },
  editInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13.5,
    color: '#1e293b',
  },
  editActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  btnCancelEdit: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
  },
  btnCancelEditText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 13,
  },
  btnSaveEdit: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  btnSaveEditText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  profileName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center'
  },
  profileRole: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 2
  },
  badgeLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f1f5f9',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginTop: 8,
    marginBottom: 16
  },
  badgeLocationText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600'
  },
  infoGrid: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
    gap: 10
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  infoLabel: {
    fontSize: 12.5,
    color: '#64748b',
    fontWeight: '600'
  },
  infoValue: {
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '700'
  },
  helpNoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primary + '0d',
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.primary + '20'
  },
  helpNoteText: {
    flex: 1,
    fontSize: 11.5,
    color: colors.primaryDark,
    lineHeight: 16
  },
  btnLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 18,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#fee2e2'
  },
  btnLogoutText: {
    color: '#dc2626',
    fontWeight: '700',
    fontSize: 13
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...shadows.sm
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 4
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 14
  },
  citizenChoiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginBottom: 10,
    gap: 12,
    backgroundColor: '#f8fafc'
  },
  citizenChoiceSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08'
  },
  choiceAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  choiceName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b'
  },
  choiceLocation: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 2
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...shadows.sm
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 20
  },
  formTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1e293b',
    marginTop: 8
  },
  formSubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#1e293b'
  },
  cantonPickerRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4
  },
  cantonOptionBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc'
  },
  cantonOptionBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '12'
  },
  cantonOptionText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569'
  },
  cantonOptionTextActive: {
    color: colors.primary,
    fontWeight: '800'
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 13,
    borderRadius: 10,
    gap: 8,
    marginTop: 20,
    ...shadows.sm
  },
  btnPrimaryText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14
  },
  quickAccountsBox: {
    marginTop: 22,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 14
  },
  quickAccountsTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 8
  },
  quickBtn: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 6
  },
  quickBtnText: {
    fontSize: 11.5,
    color: '#334155',
    fontWeight: '600'
  },
  noUserBox: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16
  },
  noUserTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1e293b',
    marginTop: 10
  },
  noUserSub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4
  }
})
