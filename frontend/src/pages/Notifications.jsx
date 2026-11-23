import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Wifi,
  BatteryMedium,
  MapPin,
  AlertTriangle,
  ArrowRight,
  Volume2,
  BellRing,
  RotateCcw,
  Sliders,
  Check,
  Moon,
  VolumeX,
  Bell,
  Sparkles
} from 'lucide-react'
import { getNotifications, dismissNotification, resetNotifications, fetchNotificationsFromApi } from '../services/notificationService'
import { useToast } from '../components/Toast'
import './Notifications.css'

export default function Notifications() {
  const { addToast } = useToast()
  const [notifications, setNotifications] = useState(getNotifications())
  const [selectedNotif, setSelectedNotif] = useState(notifications[0] || null)
  const [isVibrating, setIsVibrating] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)

  // Preferencias comunitarias guardadas
  const [preferences, setPreferences] = useState(() => {
    try {
      const stored = localStorage.getItem('barrio_alert_preferences')
      if (stored) return JSON.parse(stored)
    } catch {
      // Fallback
    }
    return {
      canton: 'Cartago',
      onlyHighRisk: false,
      nightMode: true,
      soundEnabled: true,
      categories: ['Inundación', 'Accidente', 'Inseguridad']
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('barrio_alert_preferences', JSON.stringify(preferences))
    } catch {
      // Fallback
    }
  }, [preferences])

  useEffect(() => {
    fetchNotificationsFromApi().then(data => {
      if (data && data.length) {
        setNotifications(data)
        if (!selectedNotif) setSelectedNotif(data[0])
      }
    }).catch(() => {})
  }, [])

  // Reproductor de sonido sintético de alerta push
  const playPushAlertSound = () => {
    setIsVibrating(true)
    setTimeout(() => setIsVibrating(false), 700)

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (AudioContext) {
        const ctx = new AudioContext()
        const now = ctx.currentTime

        // Tono primario (800 Hz)
        const osc1 = ctx.createOscillator()
        const gain1 = ctx.createGain()
        osc1.type = 'sine'
        osc1.frequency.setValueAtTime(800, now)
        gain1.gain.setValueAtTime(0.18, now)
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.14)
        osc1.connect(gain1)
        gain1.connect(ctx.destination)
        osc1.start(now)
        osc1.stop(now + 0.14)

        // Tono secundario de alerta (1060 Hz)
        const osc2 = ctx.createOscillator()
        const gain2 = ctx.createGain()
        osc2.type = 'sine'
        osc2.frequency.setValueAtTime(1060, now + 0.12)
        gain2.gain.setValueAtTime(0.22, now + 0.12)
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.38)
        osc2.connect(gain2)
        gain2.connect(ctx.destination)
        osc2.start(now + 0.12)
        osc2.stop(now + 0.38)
      }
    } catch {
      // Fallback
    }

    // Vibración háptica en smartphones reales
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([120, 60, 120])
      } catch {
        // Fallback
      }
    }

    addToast('¡Tono de alerta push emitido con simulación háptica!', 'info')
  }

  const handleDismiss = (id) => {
    const updated = dismissNotification(id)
    setNotifications(updated)
    addToast('Alerta comunitaria descartada del dispositivo', 'info')
    if (selectedNotif && selectedNotif.id === id) {
      setSelectedNotif(updated[0] || null)
    }
  }

  const handleReset = () => {
    const restored = resetNotifications()
    setNotifications(restored)
    setSelectedNotif(restored[0] || null)
    addToast('Alertas comunitarias de demostración restablecidas', 'success')
  }

  const toggleCategoryPref = (cat) => {
    setPreferences(prev => {
      const exists = prev.categories.includes(cat)
      const updated = exists ? prev.categories.filter(c => c !== cat) : [...prev.categories, cat]
      return { ...prev, categories: updated }
    })
  }

  const active = selectedNotif || notifications[0]

  return (
    <div className="pdf-page-wrapper">
      <div className="pdf-card-container">
        
        {/* Cabecera idéntica al Anexo 4 */}
        <header className="pdf-header">
          <div className="pdf-brand-col">
            <div className="pdf-logo-row">
              <div className="pdf-logo-icon">
                <svg viewBox="0 0 36 36" width="34" height="34" fill="none">
                  <rect x="6" y="2" width="24" height="32" rx="4" fill="#0284c7" />
                  <rect x="8" y="5" width="20" height="26" rx="2" fill="#dcfce7" />
                  <circle cx="18" cy="18" r="6" fill="#dc2626" />
                  <text x="18" y="22" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">!</text>
                </svg>
              </div>
              <div className="pdf-brand-titles">
                <span className="pdf-brand-name">Barrio<span className="pdf-brand-highlight">AlDía</span></span>
                <span className="pdf-brand-slogan">Reportá hoy, mejorá mañana.</span>
              </div>
            </div>
          </div>
          <div className="pdf-badge-tag">
            EJEMPLO VISUAL • PROPUESTA ACADÉMICA CUC
          </div>
        </header>

        {/* Título de la sección del Anexo 4 */}
        <div className="pdf-title-section">
          <div className="title-row-with-actions">
            <div>
              <span className="anexo-badge">ANEXO 4</span>
              <h1 className="anexo-main-title">Ejemplo de notificación comunitaria</h1>
              <p className="anexo-main-subtitle">
                Representación de cómo una persona vecina recibe una alerta georreferenciada cuando se reporta una situación relevante en su comunidad.
              </p>
            </div>

            <div className="sound-demo-actions">
              <button
                type="button"
                className="btn-play-sound"
                onClick={playPushAlertSound}
                title="Probar sonido sintetizado de notificación y pulso háptico"
              >
                <BellRing size={16} className="inline-icon" /> Probar Alerta Push
              </button>
              <button
                type="button"
                className={`btn-toggle-prefs ${showPreferences ? 'active' : ''}`}
                onClick={() => setShowPreferences(!showPreferences)}
                title="Ajustar preferencias ciudadanas de recepción"
              >
                <Sliders size={15} className="inline-icon" /> Preferencias
              </button>
            </div>
          </div>
        </div>

        {/* Tira Selectora de Alertas Activas */}
        <div className="notif-selector-strip">
          <span className="selector-label">
            <Bell size={13} className="inline-icon" /> Seleccionar Alerta del Dispositivo:
          </span>
          <div className="selector-pills-row">
            {notifications.map(n => {
              const isSelected = active && active.id === n.id
              return (
                <button
                  key={n.id}
                  type="button"
                  className={`notif-select-pill ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedNotif(n)}
                >
                  <span className={`pill-risk-dot dot-${n.riskLevel.toLowerCase().replace(/\s+/g, '-')}`}></span>
                  <span className="pill-title-text">{n.category}: {n.title}</span>
                </button>
              )
            })}
            {notifications.length < 3 && (
              <button type="button" className="btn-restore-notifs" onClick={handleReset}>
                <RotateCcw size={12} className="inline-icon" /> Restaurar Alertas
              </button>
            )}
          </div>
        </div>

        {/* Panel Interactivo de Preferencias Ciudadanas */}
        {showPreferences && (
          <div className="citizen-preferences-panel">
            <div className="prefs-header">
              <h4>
                <Sliders size={16} className="inline-icon text-blue" /> Configuración Ciudadana de Recepción de Alertas
              </h4>
              <span className="prefs-saved-hint">Guardado automático en tu equipo</span>
            </div>

            <div className="prefs-grid">
              <div className="pref-item">
                <label>Cantón o Cuadrante de Interés:</label>
                <select
                  value={preferences.canton}
                  onChange={(e) => setPreferences(prev => ({ ...prev, canton: e.target.value }))}
                  className="pref-select"
                >
                  <option value="Cartago">Cartago (Centro, San Blas, Carmen)</option>
                  <option value="Turrialba">Turrialba (Sector El Mora, Centro)</option>
                  <option value="Tarrazú">Tarrazú (San Marcos)</option>
                  <option value="Todos">Todos los Cantones (Comunidad Abierta)</option>
                </select>
              </div>

              <div className="pref-item">
                <label>Frecuencia de Notificación:</label>
                <div className="pref-checkbox-row">
                  <input
                    type="checkbox"
                    id="onlyHighRisk"
                    checked={preferences.onlyHighRisk}
                    onChange={(e) => setPreferences(prev => ({ ...prev, onlyHighRisk: e.target.checked }))}
                  />
                  <label htmlFor="onlyHighRisk">
                    Solo alertas de Riesgo Alto o Emergencia Vial
                  </label>
                </div>
              </div>

              <div className="pref-item">
                <label>Modo Silencioso Nocturno:</label>
                <div className="pref-checkbox-row">
                  <input
                    type="checkbox"
                    id="nightMode"
                    checked={preferences.nightMode}
                    onChange={(e) => setPreferences(prev => ({ ...prev, nightMode: e.target.checked }))}
                  />
                  <label htmlFor="nightMode">
                    <Moon size={12} className="inline-icon" /> Silenciar avisos menores entre 10:00 PM y 6:00 AM
                  </label>
                </div>
              </div>

              <div className="pref-item">
                <label>Categorías Suscritas:</label>
                <div className="pref-cats-chips">
                  {['Inundación', 'Accidente', 'Poste sin luz', 'Incendio', 'Calles dañadas', 'Inseguridad'].map(cat => {
                    const isChecked = preferences.categories.includes(cat)
                    return (
                      <button
                        key={cat}
                        type="button"
                        className={`cat-chip-toggle ${isChecked ? 'active' : ''}`}
                        onClick={() => toggleCategoryPref(cat)}
                      >
                        {isChecked && <Check size={11} className="inline-icon" />}
                        {cat}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contenido en 2 columnas: Smartphone a la izquierda, Panel explicativo a la derecha */}
        <div className="pdf-notif-layout">
          
          {/* Columna Izquierda: Mockup de Celular Smartphone */}
          <div className="phone-mockup-wrapper">
            <div className={`phone-device-frame ${isVibrating ? 'phone-vibrating' : ''}`}>
              {/* Barra superior de estado */}
              <div className="phone-status-bar">
                <span className="phone-time">{active ? active.time.split(' ')[0] : '4:37'}</span>
                <div className="phone-speaker-camera">
                  <div className="phone-speaker"></div>
                  <div className="phone-camera-lens"></div>
                </div>
                <div className="phone-icons-group">
                  <Wifi size={13} />
                  <BatteryMedium size={13} />
                </div>
              </div>

              {/* Contenido dentro de la pantalla del celular */}
              <div className="phone-screen-content">
                <h4 className="phone-screen-title">Notificaciones recientes</h4>

                {active ? (
                  <div className="phone-alert-card">
                    <div className="phone-card-top">
                      <span className="phone-app-name">BarrioAlDía</span>
                      <span className="phone-card-time">Alerta comunitaria • Hace 2 min</span>
                    </div>

                    <h3 className="phone-alert-headline">{active.title}</h3>
                    <div className="phone-alert-loc">
                      <MapPin size={12} className="inline-icon" /> {active.location}
                    </div>
                    <p className="phone-alert-body">{active.description}</p>

                    <div className="phone-tag-row">
                      <span className={`phone-caution-tag caution-${active.riskLevel.toLowerCase().replace(/\s+/g, '-')}`}>
                        {active.riskLevel}
                      </span>
                    </div>

                    <div className="phone-actions-row">
                      <button className="btn-phone-dismiss" onClick={() => handleDismiss(active.id)}>
                        Descartar
                      </button>
                      <Link to="/map" className="btn-phone-view">
                        Ver en el Mapa
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="phone-empty-state">
                    <p>No hay alertas activas en el dispositivo.</p>
                    <button type="button" className="btn-restore-phone" onClick={handleReset}>
                      Restaurar
                    </button>
                  </div>
                )}

                <div className="phone-prefs-box">
                  <strong>Zona Configurada: {preferences.canton}</strong>
                  <p>La persona vecina recibe únicamente alertas que coincidan con su cantón y preferencias guardadas.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Tarjetas de Información, Flujo y Advertencia */}
          <div className="notif-cards-column">
            
            {/* Tarjeta 1: Información mostrada en la alerta */}
            <div className="info-display-card">
              <div className="info-card-top-row">
                <h4>Información mostrada en la alerta</h4>
                <span className="risk-level-tag">
                  {active ? active.riskLevel : 'RIESGO MEDIO'}
                </span>
              </div>

              <div className="info-table-grid">
                <div className="info-cell">
                  <span className="info-cell-label">CATEGORÍA</span>
                  <strong className="info-cell-val">{active ? active.category : 'Inundación'}</strong>
                </div>
                <div className="info-cell">
                  <span className="info-cell-label">HORA DEL REPORTE</span>
                  <strong className="info-cell-val">{active ? active.time : '4:35 p. m.'}</strong>
                </div>
                <div className="info-cell">
                  <span className="info-cell-label">UBICACIÓN</span>
                  <strong className="info-cell-val">{active ? active.location.split(',')[0] : 'Barrio El Carmen'}</strong>
                </div>
                <div className="info-cell">
                  <span className="info-cell-label">ESTADO</span>
                  <strong className="info-cell-val">{active ? active.status : 'Reporte reciente'}</strong>
                </div>
              </div>

              <div className="info-recom-strip">
                <strong>Recomendación:</strong> {active ? active.recommendation : 'Transitar con precaución, evitar la zona afectada y seguir las indicaciones de las autoridades.'}
              </div>
            </div>

            {/* Tarjeta 2: Funcionamiento propuesto (3 pasos circulares) */}
            <div className="proposed-flow-card">
              <h4>Funcionamiento propuesto</h4>
              <div className="three-steps-row">
                <div className="flow-circular-step">
                  <div className="step-num-bubble">1</div>
                  <strong>Se reporta</strong>
                  <span>Una persona registra el incidente.</span>
                </div>
                <span className="flow-step-arrow"><ArrowRight size={14} /></span>
                <div className="flow-circular-step">
                  <div className="step-num-bubble">2</div>
                  <strong>Se organiza</strong>
                  <span>La plataforma clasifica los datos.</span>
                </div>
                <span className="flow-step-arrow"><ArrowRight size={14} /></span>
                <div className="flow-circular-step">
                  <div className="step-num-bubble">3</div>
                  <strong>Se informa</strong>
                  <span>Los vecinos reciben la alerta.</span>
                </div>
              </div>
            </div>

            {/* Tarjeta 3: Advertencia de emergencia del 9-1-1 */}
            <div className="important-alert-box">
              <div className="important-icon">
                <AlertTriangle size={20} />
              </div>
              <div>
                <strong>Importante</strong>
                <p>Ante una emergencia real con riesgo a la vida humana, la persona debe comunicarse de inmediato con el 9-1-1 o con la institución correspondiente.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pie de página oficial de la figura */}
        <footer className="pdf-footer-note">
          Este diseño es una representación conceptual oficial del Anexo 4 desarrollada para el proyecto de emprendimiento TI-155 del Colegio Universitario de Cartago (CUC).
        </footer>
      </div>
    </div>
  )
}
