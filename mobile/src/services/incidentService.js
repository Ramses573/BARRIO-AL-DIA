import AsyncStorage from '@react-native-async-storage/async-storage'
import { apiGet, apiPost } from './api'

const INCIDENTS_STORAGE_KEY = '@barrio_incidents_cache'

export const INITIAL_INCIDENTS = [
  {
    id: 1,
    ticketCode: 'TKT-CART-5821',
    title: 'Inundación en Calle Real del Tejar',
    category: 'Inundación',
    location: 'El Tejar de El Guarco, 200 m oeste del puente',
    lat: 9.8521,
    lng: -83.9312,
    date: '2026-11-20',
    status: 'En Proceso',
    priority: 'Alta',
    urgency: 'Alta',
    description: 'Acumulación severa de agua por colapso de alcantarillado pluvial. Tránsito cerrado para vehículos bajos.',
    photo: null,
    photos: [],
    video: null,
    isAnonymous: false,
    timeline: [
      { stage: 'Recibido', date: '2026-11-20 08:30', note: 'Notificación ingresada al sistema de despacho cantonal' },
      { stage: 'En Evaluación', date: '2026-11-20 09:15', note: 'Asignado a la Unidad Técnica de Drenajes de Cartago' },
      { stage: 'Cuadrilla Despachada', date: '2026-11-20 10:00', note: 'Cuadrilla #3 en camino con equipo de desobstrucción' }
    ]
  },
  {
    id: 2,
    ticketCode: 'TKT-TURR-2144',
    title: 'Hueco y Hundimiento en Ruta Principal a La Suiza',
    category: 'Calles dañadas',
    location: 'Turrialba, 500 m sur de la Universidad de Costa Rica',
    lat: 9.9042,
    lng: -83.6781,
    date: '2026-11-21',
    status: 'Pendiente',
    priority: 'Media',
    urgency: 'Media',
    description: 'Desprendimiento de carpeta asfáltica de aprox 1.5 metros. Representa riesgo para motociclistas de noche.',
    photo: null,
    photos: [],
    video: null,
    isAnonymous: false,
    timeline: [
      { stage: 'Recibido', date: '2026-11-21 14:10', note: 'Reporte registrado y validado por vecino' }
    ]
  },
  {
    id: 3,
    ticketCode: 'TKT-TARZ-9012',
    title: 'Poste Inclinado tras Tormenta en San Marcos',
    category: 'Poste sin luz',
    location: 'San Marcos de Tarrazú, Barrio San Lorenzo',
    lat: 9.6610,
    lng: -84.0201,
    date: '2026-11-22',
    status: 'Resuelto',
    priority: 'Baja',
    urgency: 'Baja',
    description: 'Poste de tendido eléctrico estabilizado y luminaria LED reemplazada con éxito.',
    photo: null,
    photos: [],
    video: null,
    isAnonymous: true,
    timeline: [
      { stage: 'Recibido', date: '2026-11-22 07:00', note: 'Ingreso del reporte anónimo' },
      { stage: 'En Evaluación', date: '2026-11-22 08:30', note: 'Inspección técnica realizada por ICE / CoopeSantos' },
      { stage: 'Cuadrilla Despachada', date: '2026-11-22 10:15', note: 'Cuadrilla en sitio' },
      { stage: 'Resuelto', date: '2026-11-22 12:45', note: 'Estructura enderezada y luminaria operativa' }
    ]
  }
]

/**
 * Carga incidencias de AsyncStorage o API
 */
export const getIncidents = async (filters = {}) => {
  // Intentar API
  try {
    const apiData = await apiGet('/incidents', filters)
    if (Array.isArray(apiData) && apiData.length > 0) {
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

  // Buscar en caché
  const all = await getIncidents()
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
      gpsAccuracy: createdItem.gpsAccuracy
    })
  } catch {
    // Se sincronizará en la próxima reconexión
  }

  return createdItem
}
