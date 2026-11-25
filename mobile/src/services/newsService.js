import AsyncStorage from '@react-native-async-storage/async-storage'
import { apiGet, apiPost } from './api'

const NEWS_STORAGE_KEY = '@barrio_cantonal_news_v4'

// Lista inicial en cero tras barrido de datos de prueba
export const INITIAL_NEWS = []

export const getNews = async (filters = {}) => {
  // Limpiar cachés anteriores con datos semilla
  try {
    await AsyncStorage.removeItem('@barrio_cantonal_news_v3')
  } catch {
    // Ignorar
  }

  // Intentar consultar API de .NET 9
  try {
    const apiData = await apiGet('/news', {
      canton: filters.canton !== 'todos' ? filters.canton : undefined,
      category: filters.category !== 'todos' ? filters.category : undefined,
      urgentOnly: filters.urgentOnly ? true : undefined
    })

    if (Array.isArray(apiData)) {
      await AsyncStorage.setItem(NEWS_STORAGE_KEY, JSON.stringify(apiData))
      return apiData
    }
  } catch {
    // Fallback a almacenamiento local
  }

  // Fallback a AsyncStorage o arreglo limpio
  try {
    const stored = await AsyncStorage.getItem(NEWS_STORAGE_KEY)
    let list = stored ? JSON.parse(stored) : INITIAL_NEWS

    if (filters.canton && filters.canton !== 'todos') {
      list = list.filter(n => n.canton.toLowerCase() === filters.canton.toLowerCase())
    }
    if (filters.category && filters.category !== 'todos') {
      list = list.filter(n => n.category.toLowerCase() === filters.category.toLowerCase())
    }
    if (filters.urgentOnly) {
      list = list.filter(n => n.isUrgent)
    }

    return list
  } catch {
    return INITIAL_NEWS
  }
}

export const wipeNews = async () => {
  try {
    await AsyncStorage.removeItem('@barrio_cantonal_news_v3')
    await AsyncStorage.setItem(NEWS_STORAGE_KEY, JSON.stringify([]))
  } catch {
    // Ignorar
  }
  try {
    return await apiPost('/news/wipe', {})
  } catch {
    return { message: 'Barrido local completado' }
  }
}
