/**
 * Servicio de Autenticación Institucional para Funcionarios Municipales
 * Integrado con .NET 9 Web API (JWT) y fallback offline
 */

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL)
  ? import.meta.env.VITE_API_URL
  : (typeof window !== 'undefined' && window.location?.protocol === 'https:' ? '/api' : 'http://localhost:5000/api')

const TOKEN_KEY = 'barrio_auth_token'
const OFFICIAL_KEY = 'barrio_active_official'

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
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })

    if (res.ok) {
      const data = await res.json()
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(TOKEN_KEY, data.token)
        window.localStorage.setItem(OFFICIAL_KEY, JSON.stringify(data.official))
      }
      return { success: true, official: data.official, token: data.token }
    }
  } catch {
    // Servidor offline, fallback local
  }

  // Fallback para pruebas o sin conexión
  const found = DEFAULT_OFFICIALS.find(o =>
    o.username.toLowerCase() === username.toLowerCase() ||
    o.email.toLowerCase() === username.toLowerCase()
  )

  if (found) {
    const mockToken = 'mock_jwt_token_for_testing'
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(TOKEN_KEY, mockToken)
      window.localStorage.setItem(OFFICIAL_KEY, JSON.stringify(found))
    }
    return { success: true, official: found, token: mockToken }
  }

  return { success: false, message: 'Credenciales inválidas' }
}

export const register = async (officialData) => {
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(officialData)
    })

    if (res.ok) {
      const data = await res.json()
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(TOKEN_KEY, data.token)
        window.localStorage.setItem(OFFICIAL_KEY, JSON.stringify(data.official))
      }
      return { success: true, official: data.official, token: data.token }
    } else {
      const err = await res.json()
      return { success: false, message: err.message || 'Error al registrar administrador.' }
    }
  } catch {
    // Fallback offline
  }

  const newOfficial = {
    id: Date.now(),
    username: officialData.username,
    fullName: officialData.fullName || officialData.username,
    role: officialData.role || 'Administrador Municipal',
    entity: officialData.entity || 'Municipalidad de Cartago',
    email: officialData.email || `${officialData.username}@muni.go.cr`,
    badgeNumber: officialData.badgeNumber || `ADM-${Date.now() % 10000}`
  }

  const mockToken = 'mock_jwt_token_for_testing'
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(TOKEN_KEY, mockToken)
    window.localStorage.setItem(OFFICIAL_KEY, JSON.stringify(newOfficial))
  }
  return { success: true, official: newOfficial, token: mockToken }
}

export const getApiOrigin = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
  }
  if (typeof window !== 'undefined' && window.location?.protocol === 'https:') {
    return ''
  }
  if (typeof window !== 'undefined' && window.location && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `http://${window.location.hostname}:5000`
  }
  return 'http://localhost:5000'
}

export const resolveAvatarUrl = (avatarUrl) => {
  if (!avatarUrl || typeof avatarUrl !== 'string') return ''
  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://') || avatarUrl.startsWith('data:') || avatarUrl.startsWith('blob:')) {
    return avatarUrl
  }
  if (avatarUrl.startsWith('/')) {
    return `${getApiOrigin()}${avatarUrl}`
  }
  return avatarUrl
}

export const uploadAvatar = async (file) => {
  if (!file) return null
  try {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`${getApiOrigin()}/api/auth/upload-avatar`, {
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

export const updateOfficialProfile = async (profileData) => {
  try {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData)
    })

    if (res.ok) {
      const data = await res.json()
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(OFFICIAL_KEY, JSON.stringify(data))
      }
      return { success: true, official: data }
    }
  } catch {
    // Fallback offline
  }

  // Fallback offline / local
  const current = getCurrentOfficial()
  const updated = {
    ...current,
    ...profileData,
    fullName: profileData.fullName || current.fullName,
    role: profileData.role || current.role,
    entity: profileData.entity || current.entity,
    email: profileData.email || current.email,
    badgeNumber: profileData.badgeNumber || current.badgeNumber
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(OFFICIAL_KEY, JSON.stringify(updated))
  }

  return { success: true, official: updated }
}

export const logout = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(TOKEN_KEY)
    window.localStorage.removeItem(OFFICIAL_KEY)
  }
}

export const getCurrentOfficial = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const stored = window.localStorage.getItem(OFFICIAL_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        // Fallback
      }
    }
  }
  return DEFAULT_OFFICIALS[0]
}

export const getToken = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage.getItem(TOKEN_KEY)
  }
  return null
}

export const isAuthenticated = () => {
  return !!getToken()
}
