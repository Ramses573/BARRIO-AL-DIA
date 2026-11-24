import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Hash,
  ThumbsUp,
  MessageSquare,
  Share2,
  Camera,
  PhoneCall,
  Building2,
  CheckCircle2,
  Clock,
  Send,
  User,
  Search,
  Map,
  X,
  Maximize2,
  UploadCloud,
  Crosshair
} from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getIncidentById, fetchIncidentByIdFromApi } from '../services/incidentService'
import { useToast } from '../components/Toast'
import './IncidentDetail.css'

export default function IncidentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [incident, setIncident] = useState(null)
  const [votes, setVotes] = useState(0)
  const [hasVoted, setHasVoted] = useState(false)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [commentAuthor, setCommentAuthor] = useState('')
  const [commentPhoto, setCommentPhoto] = useState(null)
  const [commentPhotoName, setCommentPhotoName] = useState('')
  const [lightboxImage, setLightboxImage] = useState(null)

  const miniMapContainerRef = useRef(null)
  const miniMapInstanceRef = useRef(null)

  useEffect(() => {
    const data = getIncidentById(id)
    if (data) {
      setIncident(data)
      const voteKey = `barrio_votes_${id}`
      const savedVotes = localStorage.getItem(voteKey)
      setVotes(savedVotes ? parseInt(savedVotes, 10) : (data.votes ?? 0))

      const votedStatus = localStorage.getItem(`barrio_voted_${id}`)
      setHasVoted(!!votedStatus)

      const commentKey = `barrio_comments_${id}`
      const savedComments = localStorage.getItem(commentKey)
      if (savedComments) {
        setComments(JSON.parse(savedComments))
      } else {
        setComments(data.comments || [])
      }
    }

    fetchIncidentByIdFromApi(id).then(apiData => {
      if (apiData) {
        setIncident(apiData)
        if (apiData.comments && apiData.comments.length) {
          setComments(apiData.comments)
        }
      }
    }).catch(() => {})
  }, [id])

  // Mini-mapa interactivo Leaflet embebido
  useEffect(() => {
    if (!incident || !miniMapContainerRef.current) return

    if (miniMapInstanceRef.current) {
      miniMapInstanceRef.current.remove()
      miniMapInstanceRef.current = null
    }

    const lat = Number(incident.lat) || 9.8644
    const lng = Number(incident.lng) || -83.9194

    const map = L.map(miniMapContainerRef.current, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false
    })

    L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 19
    }).addTo(map)

    const markerHtml = `
      <div style="
        background-color: #0284c7;
        width: 26px;
        height: 26px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 3px 8px rgba(0,0,0,0.4);
        border: 2px solid white;
      ">
        <span style="transform: rotate(45deg); color: white; font-weight: 800; font-size: 11px;">!</span>
      </div>
    `

    const customIcon = L.divIcon({
      className: 'mini-map-pin',
      html: markerHtml,
      iconSize: [26, 26],
      iconAnchor: [13, 26]
    })

    L.marker([lat, lng], { icon: customIcon }).addTo(map)
    miniMapInstanceRef.current = map

    return () => {
      if (miniMapInstanceRef.current) {
        miniMapInstanceRef.current.remove()
        miniMapInstanceRef.current = null
      }
    }
  }, [incident])

  // Cerrar lightbox con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setLightboxImage(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!incident) {
    return (
      <div className="incident-detail-container">
        <div className="incident-empty-state">
          <div className="empty-icon-wrap">
            <Search size={44} />
          </div>
          <h2>Incidente no encontrado</h2>
          <p>El reporte #{id} no existe o fue archivado por la administración cantonal.</p>
          <Link to="/incidents" className="btn-back">
            <ArrowLeft size={16} /> Volver a la lista de incidentes
          </Link>
        </div>
      </div>
    )
  }

  const handleVote = () => {
    if (hasVoted) {
      const newVotes = Math.max(0, votes - 1)
      setVotes(newVotes)
      setHasVoted(false)
      localStorage.setItem(`barrio_votes_${id}`, newVotes)
      localStorage.removeItem(`barrio_voted_${id}`)
      addToast('Respaldo retirado de este reporte', 'info')
      return
    }
    const newVotes = votes + 1
    setVotes(newVotes)
    setHasVoted(true)
    localStorage.setItem(`barrio_votes_${id}`, newVotes)
    localStorage.setItem(`barrio_voted_${id}`, 'true')
    addToast('¡Gracias! Tu respaldo vecinal aumenta la prioridad municipal', 'success')
  }

  const handleCommentPhotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      addToast('Selecciona un formato de imagen válido', 'warning')
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      setCommentPhoto(event.target.result)
      setCommentPhotoName(file.name)
      addToast(`Foto de avance "${file.name}" lista para publicar`, 'info')
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveCommentPhoto = () => {
    setCommentPhoto(null)
    setCommentPhotoName('')
  }

  const handleAddComment = (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    const item = {
      id: Date.now(),
      author: commentAuthor.trim() || 'Vecino anónimo',
      date: new Date().toISOString().split('T')[0] + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: newComment.trim(),
      photo: commentPhoto
    }
    const updated = [...comments, item]
    setComments(updated)
    localStorage.setItem(`barrio_comments_${id}`, JSON.stringify(updated))
    setNewComment('')
    setCommentAuthor('')
    setCommentPhoto(null)
    setCommentPhotoName('')
    addToast('Observación vecinal y evidencia agregada con éxito', 'success')
  }

  const handleShareWhatsApp = () => {
    const text = `*Alerta Barrio al Día*\nIncidente: ${incident.title}\nUbicación: ${incident.location}\nEstado: ${incident.status}\nRevisá los detalles en: ${window.location.href}`
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className="incident-detail-container">
      {/* Lightbox Modal de Imagen Ampliada */}
      {lightboxImage && (
        <div className="lightbox-backdrop" onClick={() => setLightboxImage(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="lightbox-close-btn"
              onClick={() => setLightboxImage(null)}
              title="Cerrar previsualización (Esc)"
            >
              <X size={20} />
            </button>
            <img src={lightboxImage} alt="Evidencia en alta resolución" className="lightbox-img" />
          </div>
        </div>
      )}

      {/* Barra de navegación superior */}
      <nav className="detail-breadcrumb">
        <button onClick={() => navigate(-1)} className="btn-breadcrumb-back">
          <ArrowLeft size={15} /> Regresar
        </button>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Incidente #{incident.id}</span>
      </nav>

      {/* Grid Principal */}
      <div className="detail-layout">
        {/* Columna Principal Izquierda */}
        <div className="detail-main-col">
          <article className="incident-card-hero">
            <header className="detail-header">
              <div className="header-tags">
                <span className={`cat-badge cat-${incident.category.toLowerCase().replace(/\s+/g, '-')}`}>
                  {incident.category}
                </span>
                <span className={`status-badge-lg status-${(incident.status || 'pendiente').toLowerCase().replace(/\s+/g, '-')}`}>
                  ● {incident.status}
                </span>
                <span className={`priority-badge-lg priority-${(incident.priority || 'media').toLowerCase()}`}>
                  Prioridad {incident.priority || 'Media'}
                </span>
              </div>

              <h1 className="detail-title">{incident.title}</h1>

              <div className="detail-meta-row">
                <span className="meta-item">
                  <MapPin size={15} className="meta-icon" /> <strong>{incident.location}</strong>
                </span>
                <span className="meta-item">
                  <Calendar size={15} className="meta-icon" /> <span>{incident.date}</span>
                </span>
                <span className="meta-item">
                  <Hash size={15} className="meta-icon" /> <span>{incident.ticketCode || `#${incident.id}`}</span>
                </span>
                <span className="meta-item meta-reporter-item">
                  <User size={15} className="meta-icon text-blue" />
                  <span>Reportado por: <strong>{incident.isAnonymous ? 'Anónimo Protegido' : (incident.reporterName || 'Ramsés Solano Calvo')}</strong></span>
                </span>
              </div>
            </header>

            {/* Fotografía o Galería de Evidencia */}
            <div className="detail-evidence-box">
              {incident.image ? (
                <div className="evidence-main-preview" onClick={() => setLightboxImage(incident.image)}>
                  <img src={incident.image} alt={incident.title} className="detail-evidence-img" />
                  <span className="expand-hint">
                    <Maximize2 size={13} className="inline-icon" /> Clic para ampliar
                  </span>
                </div>
              ) : (
                <div className="evidence-placeholder">
                  <div className="placeholder-icon">
                    <Camera size={36} />
                  </div>
                  <div className="placeholder-text">
                    <strong>Reporte con inspección técnica solicitada</strong>
                    <span>Geolocalizado en {incident.location}</span>
                  </div>
                </div>
              )}

              {/* Tira de fotos secundarias si existen */}
              {incident.photos && incident.photos.length > 1 && (
                <div className="detail-photos-strip">
                  {incident.photos.map((p, idx) => (
                    <div
                      key={idx}
                      className="strip-thumb-item"
                      onClick={() => setLightboxImage(p.preview)}
                      title={`Ver foto #${idx + 1}`}
                    >
                      <img src={p.preview} alt={`Foto #${idx + 1}`} />
                      <span className="strip-idx">#{idx + 1}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Descripción Detallada */}
            <div className="detail-description-section">
              <h3>Descripción del Suceso</h3>
              <p className="detail-description-text">
                {incident.description || 'Sin descripción adicional proporcionada por el remitente.'}
              </p>
            </div>

            {/* Bitácora de Despacho Institucional */}
            {incident.institutionalNote && (
              <div className="institutional-response-card">
                <div className="inst-badge">
                  <Building2 size={15} className="inst-icon" /> Nota Oficial de Atención Municipal
                </div>
                <p className="inst-note-text">{incident.institutionalNote}</p>
                <div className="inst-meta">
                  Registrado para coordinación de cuadrillas y obras públicas cantonales.
                </div>
              </div>
            )}

            {/* Timeline L3 Craftsmanship */}
            <section className="detail-timeline-section">
              <h3>Línea de Tiempo y Trazabilidad</h3>
              <div className="timeline-track">
                {/* Paso 1: Reportado */}
                <div className="timeline-node completed">
                  <div className="node-marker">1</div>
                  <div className="node-content">
                    <span className="node-title">Reporte Vecinal Ingresado</span>
                    <span className="node-date">{incident.date}</span>
                    <p className="node-desc">Notificación ciudadana registrada en el sistema cantonal.</p>
                  </div>
                </div>

                {/* Paso 2: Respaldo vecinal */}
                <div className="timeline-node completed">
                  <div className="node-marker">2</div>
                  <div className="node-content">
                    <span className="node-title">Validación Comunitaria</span>
                    <span className="node-date">{votes} vecinos respaldan</span>
                    <p className="node-desc">Vecinos de la zona han confirmado la veracidad del incidente.</p>
                  </div>
                </div>

                {/* Paso 3: Despacho Municipal */}
                <div className={`timeline-node ${incident.status === 'En atención' || incident.status === 'En proceso' || incident.status === 'Resuelto' ? 'completed' : 'pending'}`}>
                  <div className="node-marker">3</div>
                  <div className="node-content">
                    <span className="node-title">Asignación de Cuadrilla</span>
                    <span className="node-date">
                      {incident.status === 'En atención' || incident.status === 'En proceso' || incident.status === 'Resuelto' ? 'En ejecución' : 'En cola'}
                    </span>
                    <p className="node-desc">
                      {incident.institutionalNote
                        ? incident.institutionalNote
                        : 'Evaluación técnica por la dependencia municipal correspondiente.'}
                    </p>
                  </div>
                </div>

                {/* Paso 4: Solución Final */}
                <div className={`timeline-node ${incident.status === 'Resuelto' ? 'completed' : 'pending'}`}>
                  <div className="node-marker">4</div>
                  <div className="node-content">
                    <span className="node-title">Cierre y Resolución</span>
                    <span className="node-date">{incident.status === 'Resuelto' ? 'Completado' : 'Pendiente'}</span>
                    <p className="node-desc">Reparación finalizada o situación mitigada por las autoridades.</p>
                  </div>
                </div>
              </div>
            </section>
          </article>

          {/* Sección de Observaciones y Comentarios Ciudadanos */}
          <section className="detail-comments-section">
            <h3>
              <MessageSquare size={18} className="section-title-icon" /> Observaciones Comunitarias ({comments.length})
            </h3>

            <div className="comments-list">
              {comments.map((c) => (
                <div key={c.id} className="comment-bubble">
                  <div className="comment-header">
                    <strong>
                      <User size={14} className="user-icon" /> {c.author}
                    </strong>
                    <span className="comment-date">{c.date}</span>
                  </div>
                  <p className="comment-text">{c.text}</p>
                  {c.photo && (
                    <div className="comment-photo-wrap" onClick={() => setLightboxImage(c.photo)}>
                      <img src={c.photo} alt="Evidencia aportada por vecino" className="comment-attached-img" />
                      <span className="comment-photo-hint">
                        <Camera size={11} className="inline-icon" /> Foto de avance (clic para ampliar)
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleAddComment} className="comment-form">
              <h4>Agregar actualización o dato útil:</h4>
              <input
                type="text"
                placeholder="Tu nombre o 'Vecino de la zona' (opcional)"
                value={commentAuthor}
                onChange={(e) => setCommentAuthor(e.target.value)}
                className="comment-author-input"
              />
              <textarea
                placeholder="Escribe aquí novedades del estado del incidente (ej. cuadrilla municipal presente, calle despejada)..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                required
                rows={3}
                className="comment-textarea"
              />

              <div className="comment-form-footer">
                <div className="comment-photo-upload-row">
                  <label className="btn-attach-comment-photo">
                    <Camera size={14} className="inline-icon" /> Adjuntar foto de avance
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleCommentPhotoChange}
                    />
                  </label>
                  {commentPhoto && (
                    <span className="attached-photo-tag">
                      {commentPhotoName}
                      <button type="button" className="btn-remove-attach" onClick={handleRemoveCommentPhoto}>
                        <X size={12} />
                      </button>
                    </span>
                  )}
                </div>

                <button type="submit" className="btn-send-comment">
                  <Send size={15} /> Publicar Observación
                </button>
              </div>
            </form>
          </section>
        </div>

        {/* Columna Lateral Derecha de Acciones */}
        <aside className="detail-sidebar">
          {/* Tarjeta de Respaldo Ciudadano */}
          <div className="sidebar-card vote-card">
            <div className="vote-badge">Voz Comunitaria</div>
            <div className="vote-number">{votes}</div>
            <p className="vote-sub">Vecinos respaldan este reporte</p>
            <button
              onClick={handleVote}
              className={`btn-vote-large ${hasVoted ? 'btn-vote-active' : ''}`}
            >
              {hasVoted ? (
                <>
                  <CheckCircle2 size={16} /> Respaldado por ti
                </>
              ) : (
                <>
                  <ThumbsUp size={16} /> Respaldar este reporte
                </>
              )}
            </button>
            <span className="vote-helper">Más respaldos aumentan la prioridad en el despacho municipal.</span>
          </div>

          {/* Tarjeta de Ubicación con Mini-mapa Leaflet */}
          <div className="sidebar-card location-card">
            <h4>
              <MapPin size={16} className="sidebar-title-icon" /> Localización Georreferenciada
            </h4>
            <p className="loc-text">{incident.location}</p>

            {/* Mini-mapa Leaflet Interactivo */}
            <div className="mini-map-box">
              <div ref={miniMapContainerRef} className="mini-map-canvas"></div>
            </div>

            <div className="coords-box">
              <span>Lat: {Number(incident.lat || 9.8644).toFixed(4)}</span>
              <span>Lng: {Number(incident.lng || -83.9194).toFixed(4)}</span>
            </div>
            <Link
              to={`/map?lat=${incident.lat}&lng=${incident.lng}`}
              className="btn-open-map"
            >
              <Map size={15} /> Explorar en Pantalla Completa
            </Link>
          </div>

          {/* Tarjeta de Compartir */}
          <div className="sidebar-card share-card">
            <h4>
              <Share2 size={16} className="sidebar-title-icon" /> Difundir en el Barrio
            </h4>
            <p className="share-desc">Informa a tu grupo comunal o comité vecinal para prevenir accidentes.</p>
            <button onClick={handleShareWhatsApp} className="btn-whatsapp">
              <Share2 size={15} /> Compartir Alerta en WhatsApp
            </button>
          </div>

          {/* Contacto de Emergencia */}
          <div className="sidebar-card emergency-reminder-card">
            <div className="em-info">
              <strong>¿Riesgo inminente?</strong>
              <p>Llamá de inmediato a los cuerpos de socorro.</p>
              <a href="tel:911" className="btn-em-call">
                <PhoneCall size={13} /> Llamar 9-1-1
              </a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
