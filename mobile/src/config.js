/**
 * Configuración centralizada de entorno para Barrio al Día Mobile
 */
import { Platform } from 'react-native'

// Dirección IP local de la PC de desarrollo
export const DEV_PC_IP = '192.168.0.6'

// URL HTTPS fija del Backend (.NET 9 + Tailscale Funnel)
export const PUBLIC_HTTPS_URL = 'https://madrenzo.tail8f3798.ts.net'

// URL de la aplicación Web (Vercel / Cloudflare Pages o Vite local)
export const WEB_APP_URL = Platform.select({
  android: `http://${DEV_PC_IP}:3000`,
  ios: `http://${DEV_PC_IP}:3000`,
  default: 'http://localhost:3000'
})

// URL del backend .NET API (HTTPS fijo)
export const API_BASE_URL = `${PUBLIC_HTTPS_URL}/api`

/**
 * Genera la URL para abrir el mapa interactivo de la app web en tiempo real
 */
export const getWebMapUrl = (lat = 9.8644, lng = -83.9194, title = '') => {
  const encTitle = encodeURIComponent(title || 'Incidencia')
  return `${WEB_APP_URL}/map?lat=${lat}&lng=${lng}&title=${encTitle}`
}
