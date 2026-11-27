import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import 'leaflet/dist/leaflet.css'
import './index.css'

// En desarrollo local desregistrar Service Workers previos para evitar caché fantasma al detener el servidor
if ('serviceWorker' in navigator) {
  const isLocalDev = import.meta.env?.DEV ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.')

  window.addEventListener('load', () => {
    if (isLocalDev) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => reg.unregister())
      }).catch(() => {})
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name))
        }).catch(() => {})
      }
    } else if (import.meta.env?.PROD) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  })
}

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
