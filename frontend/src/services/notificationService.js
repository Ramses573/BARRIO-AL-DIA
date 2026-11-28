/**
 * Servicio de datos de Notificaciones y Alertas Comunitarias
 * Conectado con .NET 9 Web API y fallback offline (Anexo 4 CUC)
 */

import { getAuthHeaders } from './authService'

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL)
  ? import.meta.env.VITE_API_URL
  : (typeof window !== 'undefined' && (window.location?.protocol === 'https:' || window.location?.port === '3000') ? '/api' : 'http://localhost:5000/api')

const STORAGE_KEY = 'barrio_al_dia_notifications_v3'

// Inicializado en cero para pruebas completas de flujo sin datos quemados
const initialNotifications = []

const loadInitial = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      // Limpiar versiones legadas de caché con datos quemados
      window.localStorage.removeItem('barrio_al_dia_notifications')
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initialNotifications))
    } catch {
      // Fallback
    }
  }
  return [...initialNotifications]
}

let memoryNotifications = loadInitial()

const saveNotifications = (items) => {
  memoryNotifications = items
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
export const getNotifications = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) {
        memoryNotifications = JSON.parse(stored)
      }
    } catch {
      // Fallback
    }
  }
  return [...memoryNotifications]
}

/**
 * Consulta asincrónica a la API .NET
 */
export const fetchNotificationsFromApi = async () => {
  try {
    const res = await fetch(`${API_BASE}/notifications`)
    if (res.ok) {
      const data = await res.json()
      saveNotifications(data)
      return data
    }
  } catch {
    // Fallback
  }
  return getNotifications()
}

export const addNotification = (item) => {
  const current = getNotifications()
  const newNotif = {
    id: current.length ? Math.max(...current.map(n => n.id)) + 1 : 1,
    date: item.date || new Date().toISOString().split('T')[0],
    time: item.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    riskLevel: item.riskLevel || 'RIESGO MEDIO',
    status: 'Reporte reciente',
    ...item
  }
  const updated = [newNotif, ...current]
  saveNotifications(updated)
  return newNotif
}

export const dismissNotification = (id) => {
  const current = getNotifications()
  const updated = current.filter(item => item.id !== id)
  saveNotifications(updated)

  // Enviar a la API .NET
  try {
    fetch(`${API_BASE}/notifications/${id}`, {
      method: 'DELETE'
    }).catch(() => {})
  } catch {
    // Ignorar si offline
  }

  return updated
}

export const wipeNotifications = async () => {
  saveNotifications([])
  try {
    const res = await fetch(`${API_BASE}/notifications/wipe`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
    if (res.ok) {
      return await res.json()
    }
  } catch {
    // Offline
  }
  return { success: true, message: 'Alertas limpiadas en caché local.' }
}

export const resetNotifications = () => {
  saveNotifications([...initialNotifications])

  try {
    fetch(`${API_BASE}/notifications/reset`, {
      method: 'POST'
    }).catch(() => {})
  } catch {
    // Ignorar si offline
  }

  return [...initialNotifications]
}
