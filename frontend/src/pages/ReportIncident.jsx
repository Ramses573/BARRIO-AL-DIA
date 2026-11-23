import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Waves,
  AlertTriangle,
  ZapOff,
  Flame,
  Construction,
  ShieldAlert,
  UploadCloud,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Calendar,
  X,
  FileText,
  Crosshair,
  Image as ImageIcon,
  RotateCcw,
  Trash2,
  Clock,
  Sparkles
} from 'lucide-react'
import { addIncident } from '../services/incidentService'
import { useToast } from '../components/Toast'
import './ReportIncident.css'

const DRAFT_STORAGE_KEY = 'barrio_al_dia_report_draft'
const MAX_PHOTOS = 3
const MAX_DESC_LENGTH = 500

export default function ReportIncident() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [searchParams] = useSearchParams()
  const queryLat = searchParams.get('lat')
  const queryLng = searchParams.get('lng')

  const initialLocation = queryLat && queryLng
    ? `Punto marcado en Google Maps (${queryLat}, ${queryLng})`
    : 'Barrio El Carmen, 100 m norte del parque'

  const [form, setForm] = useState({
    category: 'Inundación',
    dateTime: new Date().toLocaleDateString('es-CR') + ' - ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    location: initialLocation,
    lat: queryLat || null,
    lng: queryLng || null,
    gpsAccuracy: null,
    urgency: 'Media',
    description: 'La calle principal presenta acumulación de agua. Se recomienda transitar con precaución y utilizar una ruta alterna.',
    photos: [],
    isAnonymous: false,
    confirmed: true
  })

  const [isDragging, setIsDragging] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [success, setSuccess] = useState(false)
  const [hasDraftNotice, setHasDraftNotice] = useState(false)

  const categoriesList = [
    { name: 'Inundación', IconComponent: Waves, color: '#3182ce' },
    { name: 'Accidente', IconComponent: AlertTriangle, color: '#e53e3e' },
    { name: 'Poste sin luz', IconComponent: ZapOff, color: '#805ad5' },
    { name: 'Incendio', IconComponent: Flame, color: '#dd6b20' },
    { name: 'Calles dañadas', IconComponent: Construction, color: '#d97706' },
    { name: 'Inseguridad', IconComponent: ShieldAlert, color: '#4f46e5' },
  ]

  const urgencyLevels = [
    { id: 'Baja', label: 'Baja (Preventiva)', desc: 'No genera peligro vial inmediato', color: '#10b981' },
    { id: 'Media', label: 'Media (Ordinaria)', desc: 'Afecta el paso o servicios vecinales', color: '#f59e0b' },
    { id: 'Alta', label: 'Alta (Crítica/Riesgo)', desc: 'Riesgo humano o bloqueo total de ruta', color: '#ef4444' }
  ]

  // Detectar y consultar borrador previo guardado
  useEffect(() => {
    // Si viene con coordenadas directas desde el mapa, respetar el punto
    if (queryLat && queryLng) return

    try {
      const savedDraft = window.localStorage.getItem(DRAFT_STORAGE_KEY)
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft)
        if (parsed && (parsed.description || parsed.location !== initialLocation)) {
          setHasDraftNotice(true)
        }
      }
    } catch {
      // Ignorar error de storage
    }
  }, [queryLat, queryLng])

  // Guardado de borrador automático al cambiar datos clave
  useEffect(() => {
    if (success) return
    const timer = setTimeout(() => {
      try {
        const draftData = {
          category: form.category,
          location: form.location,
          lat: form.lat,
          lng: form.lng,
          urgency: form.urgency,
          description: form.description,
          isAnonymous: form.isAnonymous,
          timestamp: new Date().toISOString()
        }
        window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData))
      } catch {
        // Fallback
      }
    }, 600)
    return () => clearTimeout(timer)
  }, [form.category, form.location, form.lat, form.lng, form.urgency, form.description, form.isAnonymous, success])

  const handleRestoreDraft = () => {
    try {
      const saved = window.localStorage.getItem(DRAFT_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setForm(prev => ({
          ...prev,
          category: parsed.category || prev.category,
          location: parsed.location || prev.location,
          lat: parsed.lat || prev.lat,
          lng: parsed.lng || prev.lng,
          urgency: parsed.urgency || prev.urgency,
          description: parsed.description || prev.description,
          isAnonymous: parsed.isAnonymous ?? prev.isAnonymous
        }))
        addToast('Borrador previo recuperado correctamente', 'info')
      }
    } catch {
      addToast('No se pudo restaurar el borrador', 'error')
    }
    setHasDraftNotice(false)
  }

  const handleDiscardDraft = () => {
    try {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY)
    } catch {
      // Fallback
    }
    setHasDraftNotice(false)
    addToast('Borrador descartado', 'info')
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleCategorySelect = (catName) => {
    setForm(prev => ({ ...prev, category: catName }))
  }

  // Detección de GPS en vivo
  const handleGetLiveLocation = () => {
    if (!navigator.geolocation) {
      addToast('Tu navegador o dispositivo no soporta geolocalización GPS.', 'warning')
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false)
        const { latitude, longitude, accuracy } = pos.coords
        const roundedAcc = Math.round(accuracy)

        setForm(prev => ({
          ...prev,
          lat: latitude.toFixed(5),
          lng: longitude.toFixed(5),
          gpsAccuracy: roundedAcc,
          location: `Coordenadas GPS (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`
        }))
        addToast(`GPS fijado: Precisión de ±${roundedAcc} m`, 'success')
      },
      (err) => {
        setIsLocating(false)
        let msg = 'No se pudo acceder a tu ubicación GPS.'
        if (err.code === 1) msg = 'Permiso de ubicación denegado por el usuario.'
        else if (err.code === 2) msg = 'Señal de ubicación GPS no disponible.'
        addToast(msg, 'error')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  // Procesamiento de fotos múltiples
  const processFiles = (files) => {
    if (!files || files.length === 0) return

    const currentCount = form.photos.length
    const remainingSlots = MAX_PHOTOS - currentCount

    if (remainingSlots <= 0) {
      addToast(`Límite alcanzado: máximo ${MAX_PHOTOS} fotografías permitidas`, 'warning')
      return
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots)
    const newPhotos = []

    filesToProcess.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        addToast(`"${file.name}" no es una imagen válida`, 'warning')
        return
      }

      const previewUrl = URL.createObjectURL(file)
      newPhotos.push({
        id: Date.now() + Math.random(),
        name: file.name,
        preview: previewUrl,
        sizeKb: Math.round(file.size / 1024)
      })
    })

    if (newPhotos.length > 0) {
      setForm(prev => ({
        ...prev,
        photos: [...prev.photos, ...newPhotos]
      }))
      addToast(`${newPhotos.length} ${newPhotos.length === 1 ? 'fotografía adjuntada' : 'fotografías adjuntadas'} con éxito`, 'success')
    }
  }

  const handlePhotoSelect = (e) => {
    processFiles(e.target.files)
    e.target.value = '' // Reset input
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files)
    }
  }

  const handleRemovePhoto = (photoId) => {
    setForm(prev => ({
      ...prev,
      photos: prev.photos.filter(p => p.id !== photoId)
    }))
    addToast('Fotografía eliminada del reporte', 'info')
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!form.confirmed) {
      addToast('Debes certificar la veracidad de la información.', 'error')
      return
    }

    const defaultLat = 9.8644 + (Math.random() - 0.5) * 0.015
    const defaultLng = -83.9194 + (Math.random() - 0.5) * 0.015

    const primaryPhoto = form.photos[0] || null

    addIncident({
      title: `${form.category} reportado en ${form.location.split(',')[0]}`,
      category: form.category,
      location: form.location,
      lat: form.lat ? Number(form.lat) : defaultLat,
      lng: form.lng ? Number(form.lng) : defaultLng,
      description: form.description,
      date: new Date().toISOString().split('T')[0],
      photo: primaryPhoto ? primaryPhoto.name : null,
      image: primaryPhoto ? primaryPhoto.preview : null,
      photos: form.photos.map(p => ({ name: p.name, preview: p.preview })),
      urgency: form.urgency,
      gpsAccuracy: form.gpsAccuracy,
      isAnonymous: form.isAnonymous,
      status: 'Pendiente',
      priority: form.urgency
    })

    // Limpiar borrador tras envío exitoso
    try {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY)
    } catch {
      // Fallback
    }

    setSuccess(true)
    addToast('¡Reporte registrado exitosamente! Ya es visible en el mapa y en la consola municipal.', 'success')

    setTimeout(() => {
      navigate('/incidents')
    }, 1800)
  }

  return (
    <div className="report-page-wrapper">
      <div className="report-layout-card">

        {/* Encabezado Oficial */}
        <header className="report-pdf-header">
          <div className="pdf-logo-row">
            <span className="pdf-brand-name">Barrio<span className="pdf-brand-highlight">AlDía</span></span>
            <span className="pdf-brand-slogan">Reportá hoy, mejorá mañana.</span>
          </div>
          <h2>Formulario Oficial de Notificación de Incidentes</h2>
          <p className="pdf-header-sub">
            Formulario estandarizado para ciudadanos de Cartago, Turrialba y Tarrazú.
          </p>
        </header>

        {/* Aviso de Borrador Existente */}
        {hasDraftNotice && (
          <div className="draft-alert-banner">
            <div className="draft-alert-content">
              <Sparkles size={16} className="text-amber inline-icon" />
              <span>Detectamos un borrador sin enviar guardado en este equipo.</span>
            </div>
            <div className="draft-alert-actions">
              <button type="button" className="btn-draft-restore" onClick={handleRestoreDraft}>
                <RotateCcw size={13} className="inline-icon" /> Restaurar
              </button>
              <button type="button" className="btn-draft-discard" onClick={handleDiscardDraft}>
                <Trash2 size={13} className="inline-icon" /> Descartar
              </button>
            </div>
          </div>
        )}

        {success ? (
          <div className="report-success-screen">
            <div className="success-icon-badge">
              <CheckCircle2 size={48} className="text-green" />
            </div>
            <h3>¡Reporte Notificado con Éxito!</h3>
            <p>Tu reporte ha sido georreferenciado e ingresado en la lista de incidentes activos para atención institucional.</p>
            <span className="redirecting-hint">Redirigiendo a la lista de incidentes...</span>
          </div>
        ) : (
          <div className="report-two-columns">
            {/* Columna Izquierda: Formulario */}
            <form onSubmit={handleSubmit} className="report-form-column">

              {/* 1. Selector Visual de Categorías */}
              <div className="form-category-section">
                <label className="section-label">1. Selecciona el Tipo de Incidente *</label>
                <div className="categories-card-grid">
                  {categoriesList.map(cat => {
                    const Icon = cat.IconComponent
                    const isSelected = form.category === cat.name
                    return (
                      <button
                        type="button"
                        key={cat.name}
                        className={`cat-tile-btn ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleCategorySelect(cat.name)}
                        style={{
                          borderColor: isSelected ? cat.color : '',
                          backgroundColor: isSelected ? `${cat.color}15` : ''
                        }}
                      >
                        <span className="cat-tile-icon" style={{ color: cat.color }}>
                          <Icon size={20} />
                        </span>
                        <span className="cat-tile-name">{cat.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="form-fields-stack">
                {/* Nivel de Urgencia Ciudadana */}
                <div className="pdf-input-group">
                  <label className="urgency-group-label">
                    <Clock size={14} className="inline-icon text-blue" /> Nivel de Urgencia Percibida *
                  </label>
                  <div className="urgency-selector-row">
                    {urgencyLevels.map(lvl => (
                      <button
                        type="button"
                        key={lvl.id}
                        className={`urgency-tile ${form.urgency === lvl.id ? 'active' : ''}`}
                        onClick={() => setForm(prev => ({ ...prev, urgency: lvl.id }))}
                        style={{
                          borderColor: form.urgency === lvl.id ? lvl.color : '',
                          backgroundColor: form.urgency === lvl.id ? `${lvl.color}12` : ''
                        }}
                      >
                        <span className="urgency-pill-dot" style={{ backgroundColor: lvl.color }}></span>
                        <div className="urgency-text-block">
                          <strong>{lvl.label}</strong>
                          <small>{lvl.desc}</small>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fecha y Hora */}
                <div className="pdf-input-group">
                  <label>Fecha y hora del reporte</label>
                  <input
                    type="text"
                    name="dateTime"
                    value={form.dateTime}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* 2. Ubicación con GPS y Precisión */}
                <div className="pdf-input-group">
                  <div className="input-label-row">
                    <label>2. Ubicación del incidente *</label>
                    <button
                      type="button"
                      className={`btn-detect-gps ${isLocating ? 'loading' : ''}`}
                      onClick={handleGetLiveLocation}
                      disabled={isLocating}
                      title="Obtener coordenadas GPS en vivo con el sensor de este dispositivo"
                    >
                      <Crosshair size={13} className={`inline-icon ${isLocating ? 'icon-spin' : ''}`} />
                      {isLocating ? 'Detectando GPS...' : 'Usar mi GPS'}
                    </button>
                  </div>

                  {form.lat && form.lng && (
                    <div className="gps-accuracy-badge">
                      <span className="badge-pin-icon"><MapPin size={12} /></span>
                      <span>Coordenadas fijadas: <strong>{Number(form.lat).toFixed(4)}, {Number(form.lng).toFixed(4)}</strong></span>
                      {form.gpsAccuracy && (
                        <span className="accuracy-pill">±{form.gpsAccuracy} m precisión</span>
                      )}
                    </div>
                  )}

                  <input
                    type="text"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="Ej. Barrio El Carmen, 100 m norte del parque"
                    required
                  />
                </div>

                {/* 3. Descripción con contador */}
                <div className="pdf-input-group">
                  <div className="input-label-row">
                    <label>3. Descripción breve de la situación *</label>
                    <span className={`char-counter ${form.description.length > 450 ? 'near-limit' : ''}`}>
                      {form.description.length} / {MAX_DESC_LENGTH} caracteres
                    </span>
                  </div>
                  <textarea
                    name="description"
                    rows="3"
                    maxLength={MAX_DESC_LENGTH}
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Describe el incidente, peligros para los vecinos o rutas bloqueadas..."
                    required
                  />
                </div>

                {/* 4. Fotografías Múltiples con Drag & Drop (Hasta 3) */}
                <div className="pdf-input-group">
                  <div className="input-label-row">
                    <label>4. Evidencia fotográfica de apoyo (hasta {MAX_PHOTOS} fotos)</label>
                    <span className="photos-counter-tag">
                      {form.photos.length} de {MAX_PHOTOS} cargadas
                    </span>
                  </div>

                  {form.photos.length < MAX_PHOTOS && (
                    <div
                      className={`dropzone-box ${isDragging ? 'dragging' : ''}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <label className="dropzone-label">
                        <UploadCloud size={30} className="dropzone-icon text-blue" />
                        <strong>Arrastra una o varias fotos o haz clic para explorar</strong>
                        <span className="dropzone-hint">Formatos JPG, PNG o WebP (JPG de hasta 5 MB)</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          style={{ display: 'none' }}
                          onChange={handlePhotoSelect}
                        />
                      </label>
                    </div>
                  )}

                  {/* Galería de miniaturas adjuntas */}
                  {form.photos.length > 0 && (
                    <div className="photos-gallery-grid">
                      {form.photos.map((p, idx) => (
                        <div key={p.id} className="photo-card-item">
                          <img src={p.preview} alt={`Evidencia #${idx + 1}`} />
                          <div className="photo-card-overlay">
                            <span className="photo-badge-idx">#{idx + 1}</span>
                            <span className="photo-card-name" title={p.name}>{p.name}</span>
                            <span className="photo-card-size">{p.sizeKb} KB</span>
                            <button
                              type="button"
                              className="btn-trash-photo"
                              onClick={() => handleRemovePhoto(p.id)}
                              title="Eliminar esta fotografía"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Modo Anónimo Protegido */}
                <div className="anon-card-toggle">
                  <div className="anon-toggle-info">
                    <input
                      type="checkbox"
                      id="isAnonymous"
                      name="isAnonymous"
                      checked={form.isAnonymous}
                      onChange={handleChange}
                    />
                    <label htmlFor="isAnonymous">
                      <strong>Reporte Anónimo (Protección de Identidad)</strong>
                      <span>Oculta tu nombre de usuario para reportes de seguridad ciudadana o venta de drogas.</span>
                    </label>
                  </div>
                  <span className="anon-shield-icon">
                    <ShieldCheck size={24} className="text-blue" />
                  </span>
                </div>

                {/* Checkbox de confirmación */}
                <div className="pdf-checkbox-row">
                  <input
                    type="checkbox"
                    id="confirmed"
                    name="confirmed"
                    checked={form.confirmed}
                    onChange={handleChange}
                    required
                  />
                  <label htmlFor="confirmed">
                    Certifico que la información provista es fidedigna y refleja un suceso real en mi comunidad.
                  </label>
                </div>

                {/* Botón de envío */}
                <button type="submit" className="btn-submit-pdf">
                  Enviar Notificación de Incidente
                </button>
              </div>
            </form>

            {/* Columna Derecha: Previsualización en Vivo */}
            <aside className="report-preview-column">
              <div className="preview-sticky-box">
                <span className="preview-badge">
                  <FileText size={12} className="inline-icon" /> Previsualización en Vivo
                </span>
                <div className="preview-header-meta">
                  <h3>{form.category}</h3>
                  <span
                    className="preview-urgency-chip"
                    style={{
                      backgroundColor:
                        form.urgency === 'Alta' ? '#fee2e2' :
                        form.urgency === 'Media' ? '#fef3c7' : '#dcfce7',
                      color:
                        form.urgency === 'Alta' ? '#dc2626' :
                        form.urgency === 'Media' ? '#d97706' : '#15803d'
                    }}
                  >
                    Urgencia: {form.urgency}
                  </span>
                </div>

                <div className="preview-metadata">
                  <div className="preview-meta-row">
                    <Calendar size={13} className="inline-icon" /> <strong>Fecha/Hora:</strong>
                    <span>{form.dateTime}</span>
                  </div>
                  <div className="preview-meta-row">
                    <MapPin size={13} className="inline-icon" /> <strong>Lugar:</strong>
                    <span>{form.location}</span>
                  </div>
                  {form.lat && form.lng && (
                    <div className="preview-meta-row">
                      <Crosshair size={13} className="inline-icon" /> <strong>GPS:</strong>
                      <span>{Number(form.lat).toFixed(4)}, {Number(form.lng).toFixed(4)} {form.gpsAccuracy ? `(±${form.gpsAccuracy}m)` : ''}</span>
                    </div>
                  )}
                  <div className="preview-meta-row">
                    <ShieldCheck size={13} className="inline-icon" /> <strong>Modalidad:</strong>
                    <span>{form.isAnonymous ? 'Anónimo (Protegido)' : 'Público'}</span>
                  </div>
                </div>

                <div className="preview-desc-box">
                  <strong>Detalle provisto:</strong>
                  <p>{form.description}</p>
                </div>

                {/* Galería en previsualización */}
                {form.photos.length > 0 && (
                  <div className="preview-thumbnail-box">
                    <strong>Evidencia adjunta ({form.photos.length} de {MAX_PHOTOS}):</strong>
                    <div className="preview-photos-strip">
                      {form.photos.map((p, idx) => (
                        <div key={p.id} className="preview-photo-thumb">
                          <img src={p.preview} alt={`Foto #${idx + 1}`} />
                          <span>#{idx + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="preview-dispatch-info">
                  <strong>Despacho Institucional:</strong>
                  <p>Al confirmar, este reporte se transmitirá a la Municipalidad y al panel de control de cuadrillas de la zona.</p>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}
