/**
 * Servicio de datos de Incidentes conectado con .NET 9 Web API y SQL Server
 * con fallback inteligente a localStorage para resiliencia offline.
 */

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL)
  ? import.meta.env.VITE_API_URL
  : 'http://localhost:5000/api'

const STORAGE_KEY = 'barrio_al_dia_incidents_v3'

// Lista inicial en cero para permitir pruebas limpias de flujo extremo a extremo
const initialIncidents = []

const loadInitial = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      // Limpiar versiones anteriores con datos quemados
      window.localStorage.removeItem('barrio_al_dia_incidents')
      window.localStorage.removeItem('barrio_al_dia_incidents_v2')
      window.localStorage.removeItem('barrio_incident_votes')
      window.localStorage.removeItem('barrio_user_voted_ids')

      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initialIncidents))
    } catch {
      // Fallback
    }
  }
  return [...initialIncidents]
}

let memoryIncidents = loadInitial()

const saveIncidents = (items) => {
  memoryIncidents = items
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Fallback
    }
  }
}

/**
 * Consulta sincrónica con caché local
 */
export const getIncidents = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) {
        memoryIncidents = JSON.parse(stored)
      }
    } catch {
      // Fallback
    }
  }
  return [...memoryIncidents]
}

export const getIncidentById = (id) => {
  return getIncidents().find(item => item.id === Number(id))
}

export const getIncidentByTicketCode = (code) => {
  if (!code) return null
  const cleaned = code.trim().toUpperCase()
  return getIncidents().find(item =>
    (item.ticketCode && item.ticketCode.toUpperCase() === cleaned) ||
    String(item.id) === cleaned
  )
}

/**
 * Consulta asincrónica directa a la API de .NET 9 (con sincronización a caché)
 */
export const fetchIncidentsFromApi = async (filters = {}) => {
  try {
    const query = new URLSearchParams()
    if (filters.search) query.append('search', filters.search)
    if (filters.category) query.append('category', filters.category)
    if (filters.status) query.append('status', filters.status)
    if (filters.canton) query.append('canton', filters.canton)
    if (filters.sortBy) query.append('sortBy', filters.sortBy)

    const url = `${API_BASE}/incidents${query.toString() ? '?' + query.toString() : ''}`
    const res = await fetch(url)
    if (res.ok) {
      const data = await res.json()
      saveIncidents(data)
      return data
    }
  } catch {
    // Servidor .NET apagado: retorno transparente de caché
  }
  return getIncidents()
}

export const fetchIncidentByIdFromApi = async (id) => {
  try {
    const res = await fetch(`${API_BASE}/incidents/${id}`)
    if (res.ok) {
      return await res.json()
    }
  } catch {
    // Fallback
  }
  return getIncidentById(id)
}

/**
 * Registro de nuevo reporte (guarda en local y sincroniza en backend)
 */
export const addIncident = (newIncident) => {
  const current = getIncidents()
  const defaultLat = 9.8644 + (Math.random() - 0.5) * 0.02
  const defaultLng = -83.9194 + (Math.random() - 0.5) * 0.02

  const loc = (newIncident.location || '').toLowerCase()
  const cantonPrefix = loc.includes('turrialba') ? 'TURR' :
                       (loc.includes('tarrazu') || loc.includes('tarrazú')) ? 'TARZ' : 'CART'
  const randomSuffix = Math.floor(1000 + Math.random() * 9000)
  const ticketCode = newIncident.ticketCode || `TKT-${cantonPrefix}-${randomSuffix}`

  const item = {
    id: current.length ? Math.max(...current.map(i => i.id)) + 1 : 1,
    ticketCode,
    date: newIncident.date || new Date().toISOString().split('T')[0],
    lat: newIncident.lat ? Number(newIncident.lat) : defaultLat,
    lng: newIncident.lng ? Number(newIncident.lng) : defaultLng,
    status: newIncident.status || 'Pendiente',
    priority: newIncident.priority || 'Media',
    ...newIncident
  }
  const updated = [item, ...current]
  saveIncidents(updated)

  // Enviar a la API .NET en segundo plano
  try {
    fetch(`${API_BASE}/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: item.title,
        category: item.category,
        location: item.location,
        lat: item.lat,
        lng: item.lng,
        description: item.description,
        priority: item.priority,
        isAnonymous: item.isAnonymous,
        gpsAccuracy: item.gpsAccuracy,
        photo: item.photo,
        photos: item.photos
      })
    }).catch(() => {})
  } catch {
    // Ignorar si no hay red
  }

  return item
}

/**
 * Actualización de estado y bitácora técnica
 */
export const updateIncidentStatus = (id, newStatus, institutionalNote = '') => {
  const current = getIncidents()
  const numericId = Number(id)
  let updatedItem = null

  const updated = current.map(item => {
    if (item.id === numericId) {
      const history = item.statusHistory || []
      const newHistoryEntry = {
        status: newStatus,
        date: new Date().toISOString(),
        note: institutionalNote
      }
      updatedItem = {
        ...item,
        status: newStatus,
        institutionalNote: institutionalNote || item.institutionalNote || '',
        statusHistory: [...history, newHistoryEntry],
        lastUpdated: new Date().toISOString()
      }
      return updatedItem
    }
    return item
  })

  saveIncidents(updated)

  // Sincronizar con API .NET en segundo plano
  try {
    fetch(`${API_BASE}/incidents/${numericId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: newStatus,
        institutionalNote: institutionalNote
      })
    }).catch(() => {})
  } catch {
    // Ignorar si offline
  }

  return updatedItem
}

/**
 * Respaldo Comunitario (+1 / -1)
 */
export const voteIncidentApi = async (id, increment = true) => {
  try {
    const res = await fetch(`${API_BASE}/incidents/${id}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ increment })
    })
    if (res.ok) {
      return await res.json()
    }
  } catch {
    // Fallback
  }
  return null
}

/**
 * Agregar observación vecinal
 */
export const addCommentApi = async (id, commentData) => {
  try {
    const res = await fetch(`${API_BASE}/incidents/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(commentData)
    })
    if (res.ok) {
      return await res.json()
    }
  } catch {
    // Fallback
  }
  return null
}

export const wipeIncidents = async () => {
  saveIncidents([])
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(STORAGE_KEY)
      window.localStorage.removeItem('barrio_incident_votes')
      window.localStorage.removeItem('barrio_user_voted_ids')
      window.localStorage.removeItem('barrio_al_dia_notifications_v3')
      window.localStorage.removeItem('barrio_al_dia_notifications')
    } catch {
      // Fallback
    }
  }
  try {
    const res = await fetch(`${API_BASE}/incidents/wipe`, { method: 'POST' })
    if (res.ok) {
      return await res.json()
    }
  } catch {
    // Modo offline
  }
  return { success: true, message: 'Incidentes locales limpiados exitosamente.' }
}

export const getCategories = () => {
  return [
    { id: 'accidente', name: 'Accidente', color: '#e53e3e' },
    { id: 'inundacion', name: 'Inundación', color: '#3182ce' },
    { id: 'incendio', name: 'Incendio', color: '#dd6b20' },
    { id: 'poste', name: 'Poste sin luz', color: '#805ad5' },
    { id: 'calles', name: 'Calles dañadas', color: '#d97706' },
    { id: 'inseguridad', name: 'Inseguridad', color: '#4f46e5' }
  ]
}
