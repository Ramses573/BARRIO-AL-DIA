import AsyncStorage from '@react-native-async-storage/async-storage'
import { apiPost } from './api'

const TOKEN_KEY = '@barrio_auth_token'
const OFFICIAL_KEY = '@barrio_active_official'

export const DEFAULT_OFFICIALS = [
  {
    id: 1,
    username: 'carlos.mendez',
    fullName: 'Ing. Carlos Méndez Solís',
    role: 'Director de Obras y Servicios Públicos',
    entity: 'Municipalidad de Cartago',
    email: 'carlos.mendez@muni-cartago.go.cr',
    badgeNumber: 'MC-4921'
  },
  {
    id: 2,
    username: 'elena.rojas',
    fullName: 'Licda. Elena Rojas Umaña',
    role: 'Coordinadora de Obras Comunales',
    entity: 'Municipalidad de Turrialba',
    email: 'elena.rojas@muni-turrialba.go.cr',
    badgeNumber: 'MT-1840'
  },
  {
    id: 3,
    username: 'marco.solano',
    fullName: 'Téc. Marco Solano Vargas',
    role: 'Inspector de Infraestructura Vial',
    entity: 'Municipalidad de Tarrazú',
    email: 'marco.solano@munitarrazu.go.cr',
    badgeNumber: 'MZ-0372'
  }
]

export const login = async (username, password) => {
  // 1. Intentar con API de .NET 9
  try {
    const res = await apiPost('/auth/login', { username, password })
    if (res && res.token) {
      await AsyncStorage.setItem(TOKEN_KEY, res.token)
      if (res.user) {
        await AsyncStorage.setItem(OFFICIAL_KEY, JSON.stringify(res.user))
      }
      return { success: true, user: res.user }
    }
  } catch {
    // Fallback offline
  }

  // 2. Fallback con credenciales predeterminadas
  const official = DEFAULT_OFFICIALS.find(o => o.username.toLowerCase() === username.trim().toLowerCase())
  if (official && password === 'admin123') {
    const fakeToken = `offline-jwt-${Date.now()}`
    await AsyncStorage.setItem(TOKEN_KEY, fakeToken)
    await AsyncStorage.setItem(OFFICIAL_KEY, JSON.stringify(official))
    return { success: true, user: official }
  }

  return { success: false, error: 'Credenciales inválidas' }
}

export const logout = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY)
    await AsyncStorage.removeItem(OFFICIAL_KEY)
  } catch {
    // Ignorar
  }
}

export const getCurrentOfficial = async () => {
  try {
    const stored = await AsyncStorage.getItem(OFFICIAL_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export const isAuthenticated = async () => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY)
    return !!token
  } catch {
    return false
  }
}
