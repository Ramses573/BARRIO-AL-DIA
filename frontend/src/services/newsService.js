/**
 * Servicio de Noticias y Avisos Cantonales Oficiales
 * Conectado con .NET 9 Web API y fallback offline con almacenamiento local
 */

import { getAuthHeaders } from './authService'

const getApiBase = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  if (typeof window !== 'undefined' && (window.location?.protocol === 'https:' || window.location?.port === '3000')) {
    return '/api'
  }
  if (typeof window !== 'undefined' && window.location && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `http://${window.location.hostname}:5000/api`
  }
  return 'http://localhost:5000/api'
}

const STORAGE_KEY = 'barrio_cantonal_news_v4'

// Lista inicial en cero tras barrido de datos de prueba
export const INITIAL_NEWS = []

export const getNews = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem('barrio_cantonal_news')
      window.localStorage.removeItem('barrio_cantonal_news_v2')
      window.localStorage.removeItem('barrio_cantonal_news_v3')
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch {
      // Fallback
    }
  }
  return [...INITIAL_NEWS]
}

export const fetchNewsFromApi = async (filters = {}) => {
  try {
    const query = new URLSearchParams()
    if (filters.canton && filters.canton !== 'todos') query.append('canton', filters.canton)
    if (filters.category && filters.category !== 'todos') query.append('category', filters.category)
    if (filters.urgentOnly) query.append('urgentOnly', 'true')
    query.append('_t', String(Date.now()))

    const res = await fetch(`${getApiBase()}/news?${query.toString()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    })
    if (res.ok) {
      const data = await res.json()
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      }
      return data
    }
  } catch {
    // Modo offline
  }

  // Filtrado local
  let list = getNews()
  if (filters.canton && filters.canton !== 'todos') {
    const cLower = filters.canton.toLowerCase()
    list = list.filter(n => n.canton.toLowerCase().includes(cLower) || n.canton === 'General')
  }
  if (filters.category && filters.category !== 'todos') {
    list = list.filter(n => n.category === filters.category)
  }
  if (filters.urgentOnly) {
    list = list.filter(n => n.isUrgent)
  }
  return list
}

export const wipeNews = async () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem('barrio_cantonal_news')
    window.localStorage.removeItem('barrio_cantonal_news_v2')
    window.localStorage.removeItem('barrio_cantonal_news_v3')
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([]))
  }
  try {
    const res = await fetch(`${getApiBase()}/news/wipe`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
    if (res.ok) {
      return await res.json()
    }
  } catch {
    // Fallback offline
  }
  return { message: 'Barrido local completado' }
}
