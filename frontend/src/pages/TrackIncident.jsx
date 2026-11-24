import React, { useState, useEffect } from 'react'
import { Link, useSearchParams, useParams } from 'react-router-dom'
import {
  Search,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Wrench,
  AlertTriangle,
  MapPin,
  Calendar,
  Building2,
  ArrowRight,
  RotateCcw,
  FileText,
  Share2,
  HelpCircle,
  Sparkles,
  ChevronRight,
  User
} from 'lucide-react'
import { getAllTrackableTickets, getIncidentByTicketCode, fetchIncidentsFromApi } from '../services/incidentService'
import { useToast } from '../components/Toast'
import './TrackIncident.css'

export default function TrackIncident() {
  const [searchParams] = useSearchParams()
  const { code: paramCode } = useParams()
  const { addToast } = useToast()

  const [ticketsList, setTicketsList] = useState(getAllTrackableTickets())
  const initialCode = paramCode || searchParams.get('code') || (ticketsList[0] ? (ticketsList[0].ticketCode || String(ticketsList[0].id)) : '')
  const [ticketInput, setTicketInput] = useState(initialCode)
  const [ticketData, setTicketData] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  // Sincronizar tickets desde la API de .NET 9
  useEffect(() => {
    fetchIncidentsFromApi().then(apiData => {
      if (Array.isArray(apiData) && apiData.length) {
        const full = getAllTrackableTickets()
        setTicketsList(full)
        if (!ticketInput && full[0]) {
          const firstCode = full[0].ticketCode || String(full[0].id)
          setTicketInput(firstCode)
          handleSearch(firstCode)
        }
      }
    }).catch(() => {})
  }, [])

  // Auto-cargar ticket inicial
  useEffect(() => {
    const code = initialCode || (ticketsList[0] ? (ticketsList[0].ticketCode || String(ticketsList[0].id)) : '')
    if (code) {
      setTicketInput(code)
      handleSearch(code)
    }
  }, [initialCode, ticketsList])

  const handleSearch = (codeToSearch) => {
    const query = (codeToSearch || ticketInput).trim()
    if (!query) {
      addToast('Ingresa un código de ticket o número de reporte', 'warning')
      return
    }

    setHasSearched(true)
    const result = getIncidentByTicketCode(query)

    if (result) {
      setTicketData(result)
      addToast(`Ticket ${result.ticketCode || '#' + result.id} localizado`, 'success')
    } else {
      setTicketData(null)
      addToast('No se encontró ningún reporte con ese código.', 'error')
    }
  }

  const handleShare = () => {
    const code = ticketData?.ticketCode || `#${ticketData?.id}`
    const fullUrl = `${window.location.origin}/track?code=${encodeURIComponent(code)}`
    navigator.clipboard.writeText(fullUrl)
    setCopiedLink(true)
    addToast('Enlace de seguimiento copiado al portapapeles', 'info')
    setTimeout(() => setCopiedLink(false), 2500)
  }

  return (
    <div className="track-page-wrapper">
      <div className="track-container">

        {/* Encabezado del Portal de Seguimiento */}
        <header className="track-header">
          <div className="track-badge">
            <ShieldCheck size={14} className="inline-icon text-blue" />
            <span>CONSULTA CIUDADANA EN TIEMPO REAL</span>
          </div>
          <h1>Seguimiento de Incidentes Comunitarios</h1>
          <p className="track-subtitle">
            Seleccioná un ticket del combo box para verificar el estado de atención, cuadrillas municipales asignadas y fotos de resolución técnica.
          </p>

          {/* Selector ComboBox de Tickets */}
          <div className="track-combobox-card">
            <label htmlFor="ticket-combobox-select" className="track-combobox-label">
              <Sparkles size={14} className="inline-icon text-amber" />
              <span>Selecciona un Ticket Cantonal del ComboBox:</span>
            </label>
            <div className="track-combobox-row">
              <select
                id="ticket-combobox-select"
                className="track-combobox-select"
                value={ticketInput}
                onChange={(e) => {
                  const val = e.target.value
                  setTicketInput(val)
                  if (val) handleSearch(val)
                }}
              >
                <option value="">-- Elige un ticket para consultar su seguimiento --</option>
                {ticketsList.map(t => {
                  const code = t.ticketCode || `#${t.id}`
                  const reporter = t.isAnonymous ? 'Anónimo' : (t.reporterName || 'Ramsés Solano')
                  return (
                    <option key={code} value={code}>
                      {code} — {t.title} [{reporter}] ({t.status})
                    </option>
                  )
                })}
              </select>
            </div>

            {/* Chips de acceso rápido */}
            <div className="track-sample-chips">
              <span>Accesos directos:</span>
              {ticketsList.slice(0, 4).map(t => {
                const code = t.ticketCode || `#${t.id}`
                return (
                  <button
                    key={code}
                    type="button"
                    className={`track-chip-btn ${ticketInput === code ? 'active' : ''}`}
                    onClick={() => {
                      setTicketInput(code)
                      handleSearch(code)
                    }}
                  >
                    {code}
                  </button>
                )
              })}
            </div>
          </div>
        </header>

        {/* Resultado: Reporte Encontrado */}
        {ticketData && (
          <div className="track-result-card">
            {/* Cabecera del Ticket */}
            <div className="ticket-result-header">
              <div className="ticket-title-block">
                <span className="ticket-folio-chip">
                  FOLIO: <strong>{ticketData.ticketCode || `#${ticketData.id}`}</strong>
                </span>
                <h2>{ticketData.title}</h2>
                <div className="ticket-meta-row">
                  <span>
                    <MapPin size={14} className="inline-icon text-blue" /> {ticketData.location}
                  </span>
                  <span>
                    <Calendar size={14} className="inline-icon text-blue" /> Reportado el {ticketData.date}
                  </span>
                  <span className="reporter-meta-tag">
                    <User size={14} className="inline-icon text-blue" />
                    <span>Reportado por: <strong>{ticketData.isAnonymous ? 'Anónimo Protegido' : (ticketData.reporterName || 'Ramsés Solano Calvo')}</strong></span>
                  </span>
                </div>
              </div>

              {/* Estado Visual */}
              <div className={`ticket-status-pill status-${(ticketData.status || 'pendiente').toLowerCase().replace(/\s+/g, '-')}`}>
                {ticketData.status === 'Resuelto' && <CheckCircle2 size={16} />}
                {(ticketData.status === 'En atención' || ticketData.status === 'En proceso') && <Wrench size={16} />}
                {ticketData.status === 'Pendiente' && <Clock size={16} />}
                <span>{ticketData.status || 'Pendiente'}</span>
              </div>
            </div>

            {/* Línea de Tiempo de Atención Municipal */}
            <div className="ticket-timeline-section">
              <h3 className="section-title">
                <Clock size={16} className="inline-icon text-blue" /> Bitácora de Avance Cantonal
              </h3>

              <div className="ticket-timeline">
                {/* Paso 1: Notificado */}
                <div className="timeline-step completed">
                  <div className="timeline-dot">
                    <CheckCircle2 size={16} />
                  </div>
                  <div className="timeline-content">
                    <h4>1. Notificación Ciudadana Recibida</h4>
                    <p>El reporte fue georreferenciado e ingresado al sistema cantonal de Cartago.</p>
                    <span className="timeline-date">{ticketData.date}</span>
                  </div>
                </div>

                {/* Paso 2: Evaluación y Cuadrilla */}
                <div className={`timeline-step ${ticketData.status !== 'Pendiente' ? 'completed' : 'active'}`}>
                  <div className="timeline-dot">
                    {ticketData.status !== 'Pendiente' ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                  </div>
                  <div className="timeline-content">
                    <h4>2. Fiscalización y Asignación de Cuadrilla</h4>
                    <p>
                      {ticketData.status !== 'Pendiente'
                        ? 'Caso inspeccionado y derivado a la dependencia municipal de servicios públicos.'
                        : 'En cola de priorización por la coordinación municipal.'}
                    </p>
                  </div>
                </div>

                {/* Paso 3: Trabajos en Campo */}
                <div className={`timeline-step ${ticketData.status === 'Resuelto' ? 'completed' : (ticketData.status === 'En atención' || ticketData.status === 'En proceso') ? 'active' : ''}`}>
                  <div className="timeline-dot">
                    {ticketData.status === 'Resuelto' ? <CheckCircle2 size={16} /> : <Wrench size={16} />}
                  </div>
                  <div className="timeline-content">
                    <h4>3. Ejecución de Reparación en Campo</h4>
                    <p>
                      {ticketData.status === 'Resuelto'
                        ? 'Cuadrilla ejecutó las obras técnicas requeridas en el sector.'
                        : (ticketData.status === 'En atención' || ticketData.status === 'En proceso')
                          ? 'Personal técnico activo en la zona de afectación.'
                          : 'Pendiente de inicio de cuadrilla.'}
                    </p>
                    {ticketData.institutionalNote && (
                      <div className="timeline-note-box">
                        <strong>Nota Oficial de la Cuadrilla:</strong>
                        <p>{ticketData.institutionalNote}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Paso 4: Certificación */}
                <div className={`timeline-step ${ticketData.status === 'Resuelto' ? 'completed' : ''}`}>
                  <div className="timeline-dot">
                    <CheckCircle2 size={16} />
                  </div>
                  <div className="timeline-content">
                    <h4>4. Solución Técnica Certificada</h4>
                    <p>
                      {ticketData.status === 'Resuelto'
                        ? 'Caso finalizado, verificado y cerrado conforme a estándares CUC TI-155.'
                        : 'Pendiente de verificación final de obra.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detalles Técnicos y Fotografía */}
            <div className="ticket-details-grid">
              <div className="detail-box detail-box-reporter">
                <span className="detail-label">Vecino Reportante</span>
                <strong className="detail-value text-reporter-primary">
                  {ticketData.isAnonymous ? '🛡️ Anónimo Protegido' : (ticketData.reporterName || 'Ramsés Solano Calvo')}
                </strong>
              </div>
              <div className="detail-box">
                <span className="detail-label">Categoría</span>
                <strong className="detail-value">{ticketData.category}</strong>
              </div>
              <div className="detail-box">
                <span className="detail-label">Nivel de Prioridad</span>
                <strong className="detail-value">{ticketData.priority || 'Media'}</strong>
              </div>
              <div className="detail-box">
                <span className="detail-label">Cantón Encargado</span>
                <strong className="detail-value">
                  {ticketData.location?.toLowerCase().includes('turrialba') ? 'Municipalidad de Turrialba' :
                   ticketData.location?.toLowerCase().includes('tarrazu') || ticketData.location?.toLowerCase().includes('tarrazú') ? 'Municipalidad de Tarrazú' : 'Municipalidad de Cartago'}
                </strong>
              </div>
            </div>

            {ticketData.description && (
              <div className="ticket-description-box">
                <span className="detail-label">Descripción del Ciudadano:</span>
                <p>{ticketData.description}</p>
              </div>
            )}

            {/* Fotografía de Campo */}
            {(ticketData.image || ticketData.photo) && (
              <div className="ticket-photo-box">
                <span className="detail-label">Fotografía de Evidencia Adjunta:</span>
                <div className="photo-preview-wrap">
                  <img
                    src={ticketData.image || (ticketData.photo?.startsWith('http') ? ticketData.photo : `/photos/${ticketData.photo}`)}
                    alt={ticketData.title}
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Video de Evidencia (Únicamente si fue subido en el reporte) */}
            {(ticketData.video?.preview || ticketData.videoUrl || (typeof ticketData.video === 'string' && ticketData.video)) && (
              <div className="ticket-photo-box">
                <span className="detail-label">Video de Evidencia Adjunto:</span>
                <div className="photo-preview-wrap">
                  <video
                    src={ticketData.video?.preview || ticketData.videoUrl || ticketData.video}
                    controls
                    playsInline
                    style={{ width: '100%', maxHeight: '280px', borderRadius: '8px' }}
                  />
                </div>
              </div>
            )}

            {/* Acciones del Ticket */}
            <div className="ticket-actions-bar">
              <Link
                to={`/map?lat=${ticketData.lat || 9.8644}&lng=${ticketData.lng || -83.9194}&title=${encodeURIComponent(ticketData.title)}`}
                className="btn-ticket-map-link"
              >
                <MapPin size={15} /> Ver en Mapa en Tiempo Real
              </Link>
              <button type="button" className="btn-ticket-share" onClick={handleShare}>
                <Share2 size={15} />
                <span>{copiedLink ? '¡Enlace Copiado!' : 'Compartir Seguimiento'}</span>
              </button>
              <button type="button" className="btn-ticket-print" onClick={() => window.print()}>
                <FileText size={15} /> Imprimir Comprobante
              </button>
            </div>
          </div>
        )}

        {/* Sin resultados tras búsqueda */}
        {hasSearched && !ticketData && (
          <div className="track-not-found-card">
            <AlertTriangle size={36} className="text-amber" />
            <h3>No encontramos ningún reporte con ese código</h3>
            <p>
              Verificá que el código esté bien escrito (ejemplo: <code>TKT-CART-5821</code> o número de folio <code>#1</code>).
            </p>
            <div className="not-found-actions">
              <Link to="/report" className="btn-not-found-report">
                Crear un Nuevo Reporte Ahora <ChevronRight size={15} />
              </Link>
            </div>
          </div>
        )}

        {/* Tarjeta de Ayuda Ciudadana */}
        {!ticketData && (
          <div className="track-help-section">
            <div className="help-card">
              <HelpCircle size={20} className="text-blue" />
              <div>
                <h4>¿Dónde encuentro mi código de ticket?</h4>
                <p>
                  El código se genera automáticamente al enviar cualquier formulario en el <Link to="/report">Portal de Reportes</Link>. Si lo perdiste, podés consultar con la cuadrilla municipal de tu cantón.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
