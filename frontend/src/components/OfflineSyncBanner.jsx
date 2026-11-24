import React, { useState, useEffect } from 'react'
import {
  WifiOff,
  Wifi,
  Download,
  Bell,
  CheckCircle2,
  X,
  Smartphone
} from 'lucide-react'
import { useToast } from './Toast'
import './OfflineSyncBanner.css'

export default function OfflineSyncBanner() {
  const { addToast } = useToast()
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [showReconnected, setShowReconnected] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [canInstall, setCanInstall] = useState(false)
  const [dismissedInstall, setDismissedInstall] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowReconnected(true)
      addToast('Conexión a internet restablecida. Sincronización activa.', 'success')
      const timer = setTimeout(() => setShowReconnected(false), 4000)
      return () => clearTimeout(timer)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowReconnected(false)
      addToast('Sin conexión a internet. Modo sin conexión activado.', 'warning')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Captura del evento de instalación PWA
    const handleBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setCanInstall(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [addToast])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      addToast('¡Barrio al Día instalado correctamente como App!', 'success')
    }
    setDeferredPrompt(null)
    setCanInstall(false)
  }

  const handleRequestNotifications = async () => {
    if (!('Notification' in window)) {
      addToast('Tu navegador no soporta notificaciones de escritorio.', 'info')
      return
    }

    try {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        addToast('¡Notificaciones activadas! Recibirás avisos de cuadrillas.', 'success')
        new Notification('Barrio al Día • Notificaciones Activas', {
          body: 'Recibirás avisos en tiempo real cuando tu ticket sea atendido.',
          icon: '/favicon.svg'
        })
      } else {
        addToast('Permiso de notificaciones denegado.', 'info')
      }
    } catch {
      addToast('No se pudieron activar las notificaciones.', 'error')
    }
  }

  return (
    <>
      {/* Banner de Modo Sin Conexión */}
      {!isOnline && (
        <aside className="network-banner network-offline" role="status" aria-live="polite">
          <div className="network-banner-content">
            <WifiOff size={16} className="network-icon" />
            <div className="network-text">
              <strong>Modo Sin Conexión Activado:</strong>
              <span> Podés seguir reportando y consultando; los datos se guardan localmente y se enviarán al volver la red.</span>
            </div>
          </div>
        </aside>
      )}

      {/* Banner de Reconexión Exitosa */}
      {showReconnected && isOnline && (
        <aside className="network-banner network-online" role="status" aria-live="polite">
          <div className="network-banner-content">
            <Wifi size={16} className="network-icon" />
            <div className="network-text">
              <strong>¡Conexión Restablecida!</strong>
              <span> Los datos locales han sido sincronizados con la API .NET 9.</span>
            </div>
          </div>
          <button
            type="button"
            className="btn-close-banner"
            onClick={() => setShowReconnected(false)}
            aria-label="Cerrar aviso"
          >
            <X size={14} />
          </button>
        </aside>
      )}

      {/* Prompt Flotante de Instalación PWA */}
      {canInstall && !dismissedInstall && (
        <aside className="pwa-install-pill" role="complementary" aria-label="Instalar aplicación">
          <div className="pwa-install-info">
            <Smartphone size={16} className="text-blue" />
            <div className="pwa-install-text">
              <strong>Instalar Barrio al Día</strong>
              <small>Uso rápido en celular o PC sin navegador</small>
            </div>
          </div>
          <div className="pwa-install-actions">
            <button
              type="button"
              className="btn-pwa-notify"
              onClick={handleRequestNotifications}
              title="Activar notificaciones web de cuadrillas"
            >
              <Bell size={13} />
            </button>
            <button
              type="button"
              className="btn-pwa-install"
              onClick={handleInstallClick}
              title="Instalar como aplicación nativa"
            >
              <Download size={13} /> Instalar
            </button>
            <button
              type="button"
              className="btn-pwa-dismiss"
              onClick={() => setDismissedInstall(true)}
              aria-label="Cerrar sugerencia de instalación"
            >
              <X size={14} />
            </button>
          </div>
        </aside>
      )}
    </>
  )
}
