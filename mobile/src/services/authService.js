import AsyncStorage from '@react-native-async-storage/async-storage'
import { apiPost, getApiBase } from './api'

const TOKEN_KEY = '@barrio_auth_token'
const USER_KEY = '@barrio_active_user'
const CITIZENS_KEY = '@barrio_community_citizens'

export const resolveAvatarUrl = async (avatarUrl) => {
  if (!avatarUrl || typeof avatarUrl !== 'string') return ''
  if (
    avatarUrl.startsWith('http://') ||
    avatarUrl.startsWith('https://') ||
    avatarUrl.startsWith('file://') ||
    avatarUrl.startsWith('data:')
  ) {
    return avatarUrl
  }
  if (avatarUrl.startsWith('/')) {
    const base = await getApiBase()
    return `${base.replace(/\/api\/?$/, '')}${avatarUrl}`
  }
  return avatarUrl
}

export const uploadAvatar = async (imageUri) => {
  if (!imageUri) return null
  try {
    const base = await getApiBase()
    const formData = new FormData()
    formData.append('file', {
      uri: imageUri,
      name: `avatar_${Date.now()}.jpg`,
      type: 'image/jpeg'
    })

    const res = await fetch(`${base}/auth/upload-avatar`, {
      method: 'POST',
      body: formData
    })
    if (res.ok) {
      return await res.json()
    }
  } catch {
    // Fallback offline
  }
  return null
}

export const DEFAULT_CITIZENS = [
  {
    id: 101,
    username: 'vecino.cartago',
    fullName: 'Ramsés Solano Calvo',
    role: 'Vecino Comunitario',
    canton: 'Cartago',
    barrio: 'Barrio El Carmen',
    email: 'ramses@comunidad.cr',
    phone: '8765-4321',
    password: 'VecinoCartago#26!'
  },
  {
    id: 102,
    username: 'vecino.turrialba',
    fullName: 'María Gómez Jiménez',
    role: 'Vecina Comunitaria',
    canton: 'Turrialba',
    barrio: 'El Mora',
    email: 'maria@comunidad.cr',
    phone: '8811-2233',
    password: 'VecinoTurrialba$26!'
  },
  {
    id: 103,
    username: 'vecino.tarrazu',
    fullName: 'Carlos Ureña Navarro',
    role: 'Vecino Comunitario',
    canton: 'Tarrazú',
    barrio: 'San Marcos',
    email: 'carlos@comunidad.cr',
    phone: '8344-5566',
    password: 'VecinoTarrazu%26!'
  }
]

export const DEFAULT_OFFICIALS = [
  {
    id: 1,
    username: 'carlos.mendez',
    fullName: 'Ing. Carlos Méndez Solís',
    role: 'Funcionario Municipal (Obras)',
    canton: 'Cartago',
    barrio: 'Cartago Centro',
    email: 'carlos.mendez@muni-cartago.go.cr',
    phone: '2550-0000',
    password: 'MuniCartago#2026!'
  }
]

export const getRegisteredCitizens = async () => {
  try {
    const raw = await AsyncStorage.getItem(CITIZENS_KEY)
    const stored = raw ? JSON.parse(raw) : []
    return [...DEFAULT_CITIZENS, ...stored]
  } catch {
    return [...DEFAULT_CITIZENS]
  }
}

export const login = async (identifier, password) => {
  const idClean = (identifier || '').trim().toLowerCase()
  const passClean = (password || '').trim()

  if (!idClean) return { success: false, error: 'Ingresa tu usuario, correo o teléfono.' }
  if (!passClean) return { success: false, error: 'Ingresa tu contraseña.' }

  // 1. Intentar con backend API
  try {
    const res = await apiPost('/auth/login', { username: idClean, password: passClean })
    if (res && res.token) {
      await AsyncStorage.setItem(TOKEN_KEY, res.token)
      if (res.user) {
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(res.user))
      }
      return { success: true, user: res.user }
    }
  } catch {
    // Fallback offline
  }

  // 2. Buscar en vecinos comunitarios registrados
  const citizens = await getRegisteredCitizens()
  const foundCitizen = citizens.find(c =>
    (c.username && c.username.toLowerCase() === idClean) ||
    (c.email && c.email.toLowerCase() === idClean) ||
    (c.phone && c.phone.replace(/[^0-9]/g, '') === idClean.replace(/[^0-9]/g, ''))
  )

  if (foundCitizen) {
    if (foundCitizen.password && foundCitizen.password === passClean) {
      const fakeToken = `vecino-token-${Date.now()}`
      await AsyncStorage.setItem(TOKEN_KEY, fakeToken)
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(foundCitizen))
      return { success: true, user: foundCitizen }
    } else {
      return { success: false, error: 'Contraseña incorrecta.' }
    }
  }

  // 3. Buscar en funcionarios
  const official = DEFAULT_OFFICIALS.find(o =>
    o.username.toLowerCase() === idClean ||
    o.email.toLowerCase() === idClean
  )
  if (official && (passClean === 'admin' || passClean === 'admin123' || passClean === '123')) {
    const fakeToken = `official-token-${Date.now()}`
    await AsyncStorage.setItem(TOKEN_KEY, fakeToken)
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(official))
    return { success: true, user: official }
  }

  return { success: false, error: 'Usuario no encontrado. Puedes registrarte en la pestaña "Crear Cuenta".' }
}

export const registerCitizen = async ({ fullName, username, email, phone, canton, barrio, password }) => {
  if (!fullName || !fullName.trim()) return { success: false, error: 'El nombre completo es obligatorio.' }
  if (!canton || !canton.trim()) return { success: false, error: 'Selecciona tu cantón.' }

  const cleanUser = (username || fullName.toLowerCase().replace(/\s+/g, '.')).trim()
  const cleanPass = (password || '123').trim()

  const newCitizen = {
    id: Date.now(),
    fullName: fullName.trim(),
    username: cleanUser,
    email: (email || `${cleanUser}@comunidad.cr`).trim(),
    phone: (phone || '8888-0000').trim(),
    canton: canton.trim(),
    barrio: (barrio || 'Centro').trim(),
    role: 'Vecino Comunitario',
    password: cleanPass
  }

  try {
    const raw = await AsyncStorage.getItem(CITIZENS_KEY)
    const list = raw ? JSON.parse(raw) : []
    list.unshift(newCitizen)
    await AsyncStorage.setItem(CITIZENS_KEY, JSON.stringify(list))

    // Iniciar sesión automáticamente
    const fakeToken = `vecino-token-${Date.now()}`
    await AsyncStorage.setItem(TOKEN_KEY, fakeToken)
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(newCitizen))

    return { success: true, user: newCitizen }
  } catch {
    return { success: false, error: 'No se pudo guardar el registro del vecino.' }
  }
}

export const logout = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY)
    await AsyncStorage.removeItem(USER_KEY)
  } catch {
    // Ignorar
  }
}

export const getCurrentUser = async () => {
  try {
    const stored = await AsyncStorage.getItem(USER_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export const updateUserProfile = async (profileData) => {
  const current = await getCurrentUser()
  const merged = {
    ...(current || {}),
    ...profileData
  }

  try {
    const base = await getApiBase()
    const payload = {
      id: merged.id,
      username: merged.username,
      fullName: merged.fullName,
      role: merged.role,
      entity: merged.entity,
      email: merged.email,
      badgeNumber: merged.badgeNumber,
      avatarUrl: merged.avatarUrl || '',
      phoneNumber: merged.phoneNumber || merged.phone || '',
      canton: merged.canton || 'Cartago',
      district: merged.district || '',
      neighborhood: merged.neighborhood || merged.barrio || '',
      bio: merged.bio || '',
      workSchedule: merged.workSchedule || '',
      emergencyContact: merged.emergencyContact || '',
      userType: merged.userType || (merged.badgeNumber ? 'Official' : 'Citizen')
    }

    const res = await fetch(`${base}/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (res.ok) {
      const apiUser = await res.json()
      const finalUser = {
        ...merged,
        ...apiUser,
        phone: apiUser.phoneNumber || merged.phone,
        barrio: apiUser.neighborhood || merged.barrio
      }
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(finalUser))
      await syncCitizenList(finalUser)
      return { success: true, user: finalUser }
    }
  } catch {
    // Fallback offline
  }

  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(merged))
    await syncCitizenList(merged)
    return { success: true, user: merged }
  } catch {
    return { success: false, error: 'No se pudo actualizar el perfil.' }
  }
}

const syncCitizenList = async (updatedUser) => {
  try {
    const raw = await AsyncStorage.getItem(CITIZENS_KEY)
    const list = raw ? JSON.parse(raw) : [...DEFAULT_CITIZENS]
    const idx = list.findIndex(c => c.username === updatedUser.username || c.id === updatedUser.id)
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...updatedUser }
      await AsyncStorage.setItem(CITIZENS_KEY, JSON.stringify(list))
    }
  } catch {
    // Ignorar
  }
}

export const getCurrentOfficial = getCurrentUser

export const isAuthenticated = async () => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY)
    return !!token
  } catch {
    return false
  }
}
