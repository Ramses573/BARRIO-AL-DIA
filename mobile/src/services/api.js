import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { DEV_PC_IP, PUBLIC_HTTPS_URL } from '../config'

// En móvil usa el túnel HTTPS cuando está activo; en web local usa localhost:5000.
const DEFAULT_HOST = PUBLIC_HTTPS_URL || (Platform.OS === 'web'
  ? 'http://localhost:5000'
  : `http://${DEV_PC_IP}:5000`)
const CUSTOM_HOST_KEY = '@barrio_api_host'

let cachedBaseUrl = null

/**
 * Obtiene la URL base configurada o por defecto
 */
export const getApiBase = async () => {
  if (cachedBaseUrl) return cachedBaseUrl
  try {
    const custom = await AsyncStorage.getItem(CUSTOM_HOST_KEY)
    cachedBaseUrl = (custom || DEFAULT_HOST) + '/api'
    return cachedBaseUrl
  } catch {
    return DEFAULT_HOST + '/api'
  }
}

/**
 * Permite cambiar la IP del backend (ej. para pruebas en celular físico por Wi-Fi)
 */
export const setCustomApiHost = async (host) => {
  try {
    if (host) {
      await AsyncStorage.setItem(CUSTOM_HOST_KEY, host)
      cachedBaseUrl = host + '/api'
    } else {
      await AsyncStorage.removeItem(CUSTOM_HOST_KEY)
      cachedBaseUrl = DEFAULT_HOST + '/api'
    }
  } catch {
    // Ignorar
  }
}

/**
 * Fetch con timeout para evitar colgar la app móvil si la red falla
 */
const fetchWithTimeout = async (url, options = {}, timeoutMs = 5000) => {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(id)
    return response
  } catch (err) {
    clearTimeout(id)
    throw err
  }
}

export const apiGet = async (path, params = {}) => {
  try {
    const base = await getApiBase()
    const query = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, String(v))
      }
    })
    query.append('_t', String(Date.now()))
    const qs = query.toString() ? `?${query.toString()}` : ''
    const res = await fetchWithTimeout(`${base}${path}${qs}`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export const apiPost = async (path, body = {}) => {
  try {
    const base = await getApiBase()
    const res = await fetchWithTimeout(`${base}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}
