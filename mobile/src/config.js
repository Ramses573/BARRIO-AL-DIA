/**
 * Configuración centralizada de entorno para Barrio al Día Mobile
 */
import { Platform } from 'react-native'

// Dirección IP local de la PC de desarrollo para que el celular físico o emulador
// pueda comunicarse directamente con la aplicación web y el backend.
export const DEV_PC_IP = '192.168.0.6'

// URL de la aplicación Web (Vite)
export const WEB_APP_URL = Platform.select({
  android: `http://${DEV_PC_IP}:3000`,
  ios: `http://${DEV_PC_IP}:3000`,
  default: 'http://localhost:3000'
})

// URL del backend .NET API
export const API_BASE_URL = Platform.select({
  android: `http://${DEV_PC_IP}:5000/api`,
  ios: `http://${DEV_PC_IP}:5000/api`,
  default: 'http://localhost:5000/api'
})

/**
 * Genera la URL para abrir el mapa interactivo de la app web en tiempo real
 */
export const getWebMapUrl = (lat = 9.8644, lng = -83.9194, title = '') => {
  const encTitle = encodeURIComponent(title || 'Incidencia')
  return `${WEB_APP_URL}/map?lat=${lat}&lng=${lng}&title=${encTitle}`
}
