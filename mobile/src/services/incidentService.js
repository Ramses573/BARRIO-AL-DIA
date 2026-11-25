import AsyncStorage from '@react-native-async-storage/async-storage'
import { apiGet, apiPost } from './api'

const INCIDENTS_STORAGE_KEY = '@barrio_incidents_v4'

// Lista inicial en cero tras barrido completo de datos semilla
export const INITIAL_INCIDENTS = []


/**
 * Carga incidencias de AsyncStorage o API
 */
export const getIncidents = async (filters = {}) => {
  try {
    await AsyncStorage.removeItem('@barrio_incidents_cache')
  } catch {
    // Ignorar
  }

  // Intentar API
  try {
    const apiData = await apiGet('/incidents', filters)
    if (Array.isArray(apiData)) {
      await AsyncStorage.setItem(INCIDENTS_STORAGE_KEY, JSON.stringify(apiData))
      return apiData
    }
  } catch {
    // Modo offline
  }

  try {
    const raw = await AsyncStorage.getItem(INCIDENTS_STORAGE_KEY)
    let list = raw ? JSON.parse(raw) : INITIAL_INCIDENTS

    if (filters.status && filters.status !== 'todos') {
      list = list.filter(i => i.status.toLowerCase() === filters.status.toLowerCase())
    }
    if (filters.category && filters.category !== 'todos') {
      list = list.filter(i => i.category.toLowerCase() === filters.category.toLowerCase())
    }
    if (filters.search) {
      const q = filters.search.toLowerCase()
      list = list.filter(i =>
        (i.title && i.title.toLowerCase().includes(q)) ||
        (i.location && i.location.toLowerCase().includes(q)) ||
        (i.ticketCode && i.ticketCode.toLowerCase().includes(q))
      )
    }

    return list
  } catch {
    return INITIAL_INCIDENTS
  }
}

/**
 * Búsqueda de incidencia por código de ticket exacto
 */
export const getAllTrackableTickets = async () => {
  const all = await getIncidents()
  const map = new Map()
  all.forEach(i => map.set((i.ticketCode || String(i.id)).toUpperCase(), i))
  return Array.from(map.values())
}

export const getIncidentByTicket = async (ticketCode) => {
  if (!ticketCode) return null
  const cleaned = ticketCode.trim().toUpperCase()

  // Buscar en API
  try {
    const fromApi = await apiGet(`/incidents/ticket/${encodeURIComponent(cleaned)}`)
    if (fromApi && fromApi.ticketCode) return fromApi
  } catch {
    // Modo offline
  }

  // Buscar en caché combinada
  const all = await getAllTrackableTickets()
  return all.find(i =>
    (i.ticketCode && i.ticketCode.toUpperCase() === cleaned) ||
    String(i.id) === cleaned
  ) || null
}

/**
 * Registro de nueva incidencia ciudadana
 */
export const addIncident = async (newIncident) => {
  const all = await getIncidents()

  const loc = (newIncident.location || '').toLowerCase()
  const prefix = loc.includes('turrialba') ? 'TURR' :
                 (loc.includes('tarrazu') || loc.includes('tarrazú')) ? 'TARZ' : 'CART'
  const randNum = Math.floor(1000 + Math.random() * 9000)
  const ticketCode = newIncident.ticketCode || `TKT-${prefix}-${randNum}`

  const createdItem = {
    id: all.length ? Math.max(...all.map(i => i.id || 0)) + 1 : 1,
    ticketCode,
    date: new Date().toISOString().split('T')[0],
    status: 'Pendiente',
    priority: newIncident.urgency || 'Media',
    urgency: newIncident.urgency || 'Media',
    reporterName: newIncident.isAnonymous ? null : (newIncident.reporterName || 'Ramsés Solano Calvo'),
    timeline: [
      {
        stage: 'Recibido',
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        note: 'Reporte ingresado formalmente desde la App Móvil'
      }
    ],
    ...newIncident
  }

  const updated = [createdItem, ...all]
  await AsyncStorage.setItem(INCIDENTS_STORAGE_KEY, JSON.stringify(updated))

  // Intentar sincronizar en segundo plano con el backend .NET 9
  try {
    await apiPost('/incidents', {
      title: createdItem.title,
      category: createdItem.category,
      location: createdItem.location,
      lat: createdItem.lat,
      lng: createdItem.lng,
      description: createdItem.description,
      priority: createdItem.priority,
      isAnonymous: createdItem.isAnonymous,
      gpsAccuracy: createdItem.gpsAccuracy,
      reporterName: createdItem.isAnonymous ? null : createdItem.reporterName,
      ticketCode: createdItem.ticketCode,
      video: createdItem.video ? (typeof createdItem.video === 'string' ? createdItem.video : (createdItem.video.uri || createdItem.video.name)) : null
    })
  } catch {
    // Se sincronizará en la próxima reconexión
  }

  return createdItem
}
