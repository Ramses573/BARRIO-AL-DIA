import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  PhoneCall,
  AlertTriangle,
  Clock,
  Bell,
  CheckCircle2,
  Map,
  PlusCircle,
  Building2,
  MapPin,
  ShieldCheck,
  ArrowRight,
  Calendar,
  Quote,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Sparkles,
  UserCheck
} from 'lucide-react'
import { getIncidents, fetchIncidentsFromApi } from '../services/incidentService'
import { getNotifications } from '../services/notificationService'
import './Home.css'

const VALIDATION_INTERVIEWS = [
  {
    id: 1,
    author: 'Ana Isabel',
    canton: 'San Marcos de Tarrazú',
    zone: 'Tarrazú',
    interviewer: 'Entrevistada por María Celeste Cordero',
    problem: 'Drogas y delincuencia nocturna',
    quote: 'Los problemas más frecuentes son las drogas y la delincuencia. Recomiendo que los reportes de incidentes delicados sean anónimos para evitar represalias y proteger a quien denuncia.',
    tag: 'Reporte Anónimo Protegido',
    avatarBg: '#0284c7'
  },
  {
    id: 2,
    author: 'María Luisa Monge',
    canton: 'El Salado, San Marcos',
    zone: 'Tarrazú',
    interviewer: 'Entrevistada por María Celeste Cordero',
    problem: 'Exceso de velocidad vial',
    quote: 'El principal problema es el exceso de velocidad de los carros y motos; hay niños y adultos mayores cerca de la escuela. Se necesita mayor visibilidad y avisos en tiempo real.',
    tag: 'Seguridad Vial y Alertas',
    avatarBg: '#d97706'
  },
  {
    id: 3,
    author: 'María Guadalupe Navarro',
    canton: 'San Marcos de Tarrazú',
    zone: 'Tarrazú',
    interviewer: 'Entrevistada por María Celeste Cordero',
    problem: 'Especulación y desinformación',
    quote: 'A veces la información en redes no es confiable porque la gente especula. Una aplicación centralizada con fuentes comunitarias e institucionales verificadas es clave.',
    tag: 'Verificación Oficial',
    avatarBg: '#10b981'
  },
  {
    id: 4,
    author: 'Elena Picado',
    canton: 'Clorito Picado, Turrialba',
    zone: 'Turrialba',
    interviewer: 'Entrevistada por María Celeste Cordero',
    problem: 'Falta de agua e inundaciones',
    quote: 'La falta de agua y las inundaciones son preocupantes. Gracias a un mapa interactivo ahora podré fijarme por dónde ir ante una inundación antes de salir con el carro.',
    tag: 'Mapa Interactivo de Riesgos',
    avatarBg: '#0ea5e9'
  },
  {
    id: 5,
    author: 'Adrián Solano Solano',
    canton: 'Santa Rosa, Turrialba',
    zone: 'Turrialba',
    interviewer: 'Entrevistado por Ramsés Solano',
    problem: 'Inseguridad en barrios alejados',
    quote: 'El problema más frecuente es la inseguridad. Sería bastante útil contar con un filtro de incidentes por cercanía y un mapa interactivo para estar prevenidos.',
    tag: 'Filtros de Proximidad',
    avatarBg: '#8b5cf6'
  },
  {
    id: 6,
    author: 'Erick Garita Mora',
    canton: 'San Blas, Cartago',
    zone: 'Cartago',
    interviewer: 'Entrevistado por Ramsés Solano',
    problem: 'Basura acumulada y vías dañadas',
    quote: 'Falta de recolección de basura y problemas viales. Sería muy buena la app ya que así se evitan accidentes y se puede coordinar ayuda entre vecinos e instituciones.',
    tag: 'Coordinación Vecinal',
    avatarBg: '#ec4899'
  },
  {
    id: 7,
    author: 'Luis Diego Gonzales Chaves',
    canton: 'Cartago Oriental',
    zone: 'Cartago',
    interviewer: 'Entrevistado por Ramsés Solano',
    problem: 'Habitantes de calle e infraestructura',
    quote: 'Habitantes de la calle y problemas comunales de infraestructura. Avisos rápidos para alertar temprano solo llegándole a gente cercana a la que realmente le pueda afectar.',
    tag: 'Geocercas de Alertas',
    avatarBg: '#f59e0b'
  },
  {
    id: 8,
    author: 'Jennifer Hidalgo',
    canton: 'San Blas, Cartago',
    zone: 'Cartago',
    interviewer: 'Entrevistada por Ramsés Solano',
    problem: 'Accidentes viales e inseguridad',
    quote: 'Accidentes viales e inseguridad en cruces peligrosos. Un botón de alerta rápida o notificación en tiempo real para avisar a la comunidad inmediatamente.',
    tag: 'Botón de Alerta Rápida',
    avatarBg: '#ef4444'
  },
  {
    id: 9,
    author: 'Aron Coles Agüero',
    canton: 'Carmen Lyra, Turrialba',
    zone: 'Turrialba',
    interviewer: 'Entrevistado por Anthony Morales',
    problem: 'Calles deterioradas y alcantarillado',
    quote: 'Calles dañadas y falta de alcantarillado. Que se dé seguimiento formal a los reportes y se vea reflejado en la aplicación en qué etapa de resolución está cada caso.',
    tag: 'Trazabilidad de Estados',
    avatarBg: '#059669'
  },
  {
    id: 10,
    author: 'Joel Delgado Tencio',
    canton: 'Nuevos Horizontes, Turrialba',
    zone: 'Turrialba',
    interviewer: 'Entrevistado por Anthony Morales',
    problem: 'Saturación en chats vecinales',
    quote: 'Calles en mal estado y baches. En grupos de WhatsApp se dificulta por tanto mensaje encontrar lo que buscamos; una app especializada comunitaria es una solución excelente.',
    tag: 'Canal Dedicado vs WhatsApp',
    avatarBg: '#6366f1'
  },
  {
    id: 11,
    author: 'Andrea Cedeño Ramírez',
    canton: 'Turrialba Centro',
    zone: 'Turrialba',
    interviewer: 'Entrevistada por Anthony Morales',
    problem: 'Inundaciones recurrentes',
    quote: 'Inundaciones recurrentes e inseguridad. Me parece una gran idea siempre y cuando la información que se transmita sea verificada, oportuna y responsable.',
    tag: 'Información Oportuna',
    avatarBg: '#14b8a6'
  }
]

export default function Home() {
  const [stats, setStats] = useState({
    total: 0,
    activeCount: 0,
    resolvedCount: 0,
    inProgressCount: 0,
    alertsCount: 0,
    percentResolved: 0
  })
  const [recentFeed, setRecentFeed] = useState([])
  const [currentSphereIndex, setCurrentSphereIndex] = useState(0)
  const [isAutoRotating, setIsAutoRotating] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const [selectedCantonFilter, setSelectedCantonFilter] = useState('Todos')
  const [weeklyTrends, setWeeklyTrends] = useState([
    { day: 'Lun', reports: 0, resolved: 0 },
    { day: 'Mar', reports: 0, resolved: 0 },
    { day: 'Mié', reports: 0, resolved: 0 },
    { day: 'Jue', reports: 0, resolved: 0 },
    { day: 'Vie', reports: 0, resolved: 0 },
    { day: 'Sáb', reports: 0, resolved: 0 },
    { day: 'Dom', reports: 0, resolved: 0 }
  ])

  const updateStatsAndFeed = (incidents) => {
    const notifs = getNotifications()
    const total = incidents.length
    const resolved = incidents.filter(i => i.status === 'Resuelto').length
    const inProgress = incidents.filter(i => i.status === 'En atención').length
    const active = incidents.filter(i => i.status !== 'Resuelto').length
    const alerts = notifs.filter(n => (n.riskLevel || '').includes('ALTO') || (n.riskLevel || '').includes('MEDIO')).length
    const pct = total ? Math.round((resolved / total) * 100) : 0

    setStats({
      total,
      activeCount: active,
      resolvedCount: resolved,
      inProgressCount: inProgress,
      alertsCount: alerts,
      percentResolved: pct
    })

    setRecentFeed(incidents.slice(0, 3))

    // Calcular la dinámica semanal en base a los reportes reales de la base de datos
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    const dayMap = {
      'Lun': { day: 'Lun', reports: 0, resolved: 0 },
      'Mar': { day: 'Mar', reports: 0, resolved: 0 },
      'Mié': { day: 'Mié', reports: 0, resolved: 0 },
      'Jue': { day: 'Jue', reports: 0, resolved: 0 },
      'Vie': { day: 'Vie', reports: 0, resolved: 0 },
      'Sáb': { day: 'Sáb', reports: 0, resolved: 0 },
      'Dom': { day: 'Dom', reports: 0, resolved: 0 }
    }

    incidents.forEach(item => {
      if (item.date) {
        try {
          const d = new Date(item.date + 'T12:00:00')
          const dayName = dayNames[d.getDay()]
          if (dayMap[dayName]) {
            dayMap[dayName].reports += 1
            if (item.status === 'Resuelto') {
              dayMap[dayName].resolved += 1
            }
          }
        } catch {
          // Ignorar fechas inválidas
        }
      }
    })

    setWeeklyTrends([
      dayMap['Lun'],
      dayMap['Mar'],
      dayMap['Mié'],
      dayMap['Jue'],
      dayMap['Vie'],
      dayMap['Sáb'],
      dayMap['Dom']
    ])
  }

  useEffect(() => {
    updateStatsAndFeed(getIncidents())
    fetchIncidentsFromApi().then(data => {
      if (Array.isArray(data)) updateStatsAndFeed(data)
    }).catch(() => {})
  }, [])

  // Auto-rotación esférica continua
  useEffect(() => {
    if (!isAutoRotating || isHovered) return
    const timer = setInterval(() => {
      setCurrentSphereIndex(prev => (prev + 1) % VALIDATION_INTERVIEWS.length)
    }, 4200)
    return () => clearInterval(timer)
  }, [isAutoRotating, isHovered])

  const handlePrevSphere = () => {
    setCurrentSphereIndex(prev => (prev - 1 + VALIDATION_INTERVIEWS.length) % VALIDATION_INTERVIEWS.length)
  }

  const handleNextSphere = () => {
    setCurrentSphereIndex(prev => (prev + 1) % VALIDATION_INTERVIEWS.length)
  }

  return (
    <div className="home-container">
      {/* Banner de Emergencia Rápida */}
      <div className="quick-emergency-bar">
        <div className="emergency-indicator">
          <span className="emergency-beacon"></span>
          <span><strong>Emergencia Vital:</strong> Ante riesgo inminente, fuego o lesionados contactá inmediatamente al 9-1-1.</span>
        </div>
        <a href="tel:911" className="btn-call-911">
          <PhoneCall size={14} className="btn-icon" /> Llamar al 9-1-1
        </a>
      </div>

      {/* Hero Section */}
      <header className="hero-section">
        <div className="hero-top-meta">
          <span className="hero-pill-badge">
            <span className="badge-pulse"></span>
            Cartago • Turrialba • Tarrazú
          </span>
          <span className="hero-academic-tag">CUC Emprendedores TI-155</span>
        </div>

        <h1 className="hero-title">
          Barrio<span className="hero-title-highlight">AlDía</span>
        </h1>
        <p className="hero-tagline">"Reportá hoy, mejorá mañana."</p>
        <p className="hero-description">
          Red comunitaria ciudadana e institucional para registrar baches, inundaciones,
          postes sin luz y riesgos comunales en tiempo real con respaldo municipal.
        </p>

        {/* Métricas Comunitarias */}
        <div className="hero-stats-bar">
          <div className="stat-card stat-card-active">
            <div className="stat-icon-wrapper text-amber">
              <AlertTriangle size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-number">{stats.activeCount}</span>
              <span className="stat-label">Casos Activos</span>
            </div>
          </div>

          <div className="stat-card stat-card-progress">
            <div className="stat-icon-wrapper text-blue">
              <Clock size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-number">{stats.inProgressCount}</span>
              <span className="stat-label">En Atención</span>
            </div>
          </div>

          <div className="stat-card stat-card-alerts">
            <div className="stat-icon-wrapper text-red">
              <Bell size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-number">{stats.alertsCount}</span>
              <span className="stat-label">Alertas de Riesgo</span>
            </div>
          </div>

          <div className="stat-card stat-card-resolved">
            <div className="stat-icon-wrapper text-green">
              <CheckCircle2 size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-number">{stats.resolvedCount}</span>
              <span className="stat-label">Solucionados</span>
            </div>
          </div>
        </div>

        {/* Barra de Progreso L3 */}
        <div className="resolution-progress-card">
          <div className="progress-header">
            <div className="progress-title-group">
              <span className="progress-title">Eficacia de Respuesta Cantonal</span>
              <span className="progress-sub">Meta comunitaria de resolución</span>
            </div>
            <span className="progress-percentage-pill">{stats.percentResolved}%</span>
          </div>

          <div className="progress-track">
            <div
              className="progress-bar-fill"
              style={{ width: `${stats.percentResolved}%` }}
            >
              <div className="progress-shimmer"></div>
            </div>
          </div>

          <div className="progress-legend">
            <span className="legend-p">
              <span className="p-dot res"></span> Resueltos ({stats.resolvedCount})
            </span>
            <span className="legend-p">
              <span className="p-dot prog"></span> En atención ({stats.inProgressCount})
            </span>
            <span className="legend-p">
              <span className="p-dot pend"></span> Pendientes ({stats.activeCount - stats.inProgressCount})
            </span>
          </div>
        </div>

        {/* Tendencia Semanal de Gestión Comunitaria (L3 Craftsmanship) */}
        <div className="weekly-trend-card">
          <div className="trend-card-header">
            <div className="trend-title-col">
              <span className="trend-badge">
                <TrendingUp size={13} className="inline-icon text-blue" /> Dinámica Semanal Cantonal
              </span>
              <h4>Flujo de Nuevos Reportes vs. Casos Solucionados</h4>
              <p>Comparativo diario del ingreso de reportes comunitarios y atención municipal de cuadrillas.</p>
            </div>
            <div className="trend-legend">
              <span className="legend-chip intake">
                <span className="chip-dot intake-dot"></span> Nuevos reportes
              </span>
              <span className="legend-chip res">
                <span className="chip-dot res-dot"></span> Solucionados
              </span>
            </div>
          </div>

          <div className="trend-chart-bars">
            {weeklyTrends.map((d, index) => {
              const maxVal = Math.max(...weeklyTrends.map(t => Math.max(t.reports, t.resolved)), 1)
              const repPct = d.reports > 0 ? Math.round((d.reports / maxVal) * 100) : 0
              const resPct = d.resolved > 0 ? Math.round((d.resolved / maxVal) * 100) : 0
              return (
                <div key={index} className="trend-bar-column">
                  <div className="bars-track">
                    <div
                      className="bar-single bar-reports"
                      style={{ height: `${repPct}%` }}
                      title={`${d.day}: ${d.reports} reportes ingresados`}
                    >
                      <span className="bar-val-badge">{d.reports}</span>
                    </div>
                    <div
                      className="bar-single bar-resolved"
                      style={{ height: `${resPct}%` }}
                      title={`${d.day}: ${d.resolved} solucionados`}
                    >
                      <span className="bar-val-badge">{d.resolved}</span>
                    </div>
                  </div>
                  <span className="bar-day-label">{d.day}</span>
                </div>
              )
            })}
          </div>
          {stats.total === 0 && (
            <div className="trend-zero-hint">
              <span>Base de datos en 0 reportes • La gráfica refleja en tiempo real los ingresos por día de la semana.</span>
            </div>
          )}
        </div>

        {/* Acciones Principales */}
        <div className="hero-actions">
          <Link to="/map" className="btn btn-primary-hero">
            <Map size={18} className="btn-icon" /> Explorar Mapa Interactivo
          </Link>
          <Link to="/report" className="btn btn-secondary-hero">
            <PlusCircle size={18} className="btn-icon" /> Reportar Incidente Vecinal
          </Link>
          <Link to="/admin" className="btn btn-institutional-hero">
            <Building2 size={18} className="btn-icon" /> Panel Municipal
          </Link>
        </div>

        {/* Cantones Activos */}
        <div className="community-zones">
          <span className="zones-label">Zonas validadas en campo:</span>
          <span className="zone-pill"><MapPin size={12} className="inline-icon" /> Cartago Centro</span>
          <span className="zone-pill"><MapPin size={12} className="inline-icon" /> San Blas</span>
          <span className="zone-pill"><MapPin size={12} className="inline-icon" /> Turrialba</span>
          <span className="zone-pill"><MapPin size={12} className="inline-icon" /> San Marcos de Tarrazú</span>
        </div>
      </header>

      {/* Feed en Vivo */}
      <section className="live-feed-section">
        <div className="section-title-row">
          <div>
            <div className="live-badge">
              <span className="live-dot"></span> Transmisión en tiempo real
            </div>
            <h2>Actividad Reciente en la Comunidad</h2>
            <p>Reportes vecinales registrados con georreferencia oficial.</p>
          </div>
          <Link to="/incidents" className="btn-see-all">
            Ver los {stats.total} reportes <ArrowRight size={15} />
          </Link>
        </div>

        <div className="live-feed-grid">
          {recentFeed.length === 0 ? (
            <div className="live-feed-empty-card">
              <div className="empty-feed-icon-badge">
                <CheckCircle2 size={32} />
              </div>
              <h4>Comunidad al día y sin incidentes pendientes</h4>
              <p>No hay reportes registrados en este momento. La plataforma está lista para recibir nuevos registros comunitarios.</p>
              <Link to="/report" className="btn-primary-hero">
                <PlusCircle size={15} /> Crear el primer reporte
              </Link>
            </div>
          ) : (
            recentFeed.map((item, idx) => (
              <div
                key={item.id}
                className={`feed-card ${idx === 0 ? 'feed-card-spotlight' : ''}`}
              >
                {idx === 0 && (
                  <div className="spotlight-banner">
                    Reporte Destacado en Zona
                  </div>
                )}
                <div className="feed-card-header">
                  <span className={`cat-pill cat-${item.category.toLowerCase().replace(/\s+/g, '-')}`}>
                    {item.category}
                  </span>
                  <span className={`status-tag status-${(item.status || 'pendiente').toLowerCase().replace(/\s+/g, '-')}`}>
                    {item.status}
                  </span>
                </div>

                <h4 className="feed-title">{item.title}</h4>
                <p className="feed-loc">
                  <MapPin size={13} className="inline-icon" /> {item.location}
                </p>
                <p className="feed-desc">{item.description}</p>

                {item.institutionalNote && (
                  <div className="feed-official-note">
                    <span className="note-label">Nota oficial:</span> {item.institutionalNote}
                  </div>
                )}

                <div className="feed-card-footer">
                  <span className="feed-date">
                    <Calendar size={13} className="inline-icon" /> {item.date}
                  </span>
                  <div className="feed-links-group">
                    <Link to={`/incidents/${item.id}`} className="feed-link-detail">
                      Ver detalle <ArrowRight size={13} />
                    </Link>
                    <Link to={`/map?lat=${item.lat}&lng=${item.lng}`} className="feed-link-map">
                      <Map size={13} /> Ver mapa
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Tarjetas de Funcionalidades */}
      <section className="features-grid">
        <div className="feature-card">
          <div className="feature-icon feature-icon-red">
            <Map size={24} />
          </div>
          <h3>Google Maps HD</h3>
          <p>Cartografía oficial con capas Satélite, Híbrido y Terreno para identificar riesgos con precisión.</p>
          <Link to="/map" className="feature-action-link">
            Explorar mapa <ArrowRight size={14} />
          </Link>
        </div>

        <div className="feature-card">
          <div className="feature-icon feature-icon-blue">
            <ShieldCheck size={24} />
          </div>
          <h3>Modo Anónimo Protegido</h3>
          <p>Protege la identidad de los vecinos al reportar situaciones delicadas de seguridad o vandalismo.</p>
          <Link to="/report" className="feature-action-link">
            Crear reporte <ArrowRight size={14} />
          </Link>
        </div>

        <div className="feature-card">
          <div className="feature-icon feature-icon-amber">
            <Bell size={24} />
          </div>
          <h3>Alertas Preventivas</h3>
          <p>Notificaciones tempranas con recomendaciones para evitar zonas inundadas o vías bloqueadas.</p>
          <Link to="/notifications" className="feature-action-link">
            Ver alertas <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* Validación Metodológica: Vitrina Esférica Orbital */}
      <section className="orbital-showcase-section">
        <div className="orbital-showcase-header">
          <span className="orbital-badge">
            <Sparkles size={14} className="inline-icon" /> Validación Metodológica CUC TI-155
          </span>
          <h2 className="orbital-title">11 Entrevistas de Campo Reales</h2>
          <p className="orbital-subtitle">
            Evidencia comunitaria recolectada en visitas presenciales a <strong>Cartago Centro</strong>, <strong>Turrialba</strong> y <strong>San Marcos de Tarrazú</strong>.
          </p>

          <div className="orbital-meta-bar">
            <span className="meta-pill">
              <UserCheck size={14} /> 11 Ciudadanos Entrevistados
            </span>
            <span className="meta-pill">
              <MapPin size={14} /> 3 Cantones Cubiertos
            </span>
            <span className="meta-pill">
              <ShieldCheck size={14} /> 100% Citas Textuales de Campo
            </span>
          </div>

          {/* Selector rápido por Cantón */}
          <div className="orbital-canton-filters">
            {['Todos', 'Cartago', 'Turrialba', 'Tarrazú'].map(canton => {
              const count = canton === 'Todos' ? VALIDATION_INTERVIEWS.length : VALIDATION_INTERVIEWS.filter(i => i.zone === canton).length
              return (
                <button
                  key={canton}
                  className={`canton-filter-pill ${selectedCantonFilter === canton ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedCantonFilter(canton)
                    if (canton !== 'Todos') {
                      const firstIdx = VALIDATION_INTERVIEWS.findIndex(i => i.zone === canton)
                      if (firstIdx !== -1) setCurrentSphereIndex(firstIdx)
                    }
                  }}
                >
                  {canton} ({count})
                </button>
              )
            })}
          </div>
        </div>

        {/* Orbital Stage Viewport */}
        <div
          className="orbital-stage-viewport"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Fondo Orbital Esférico */}
          <div className="orbital-sphere-halo"></div>
          <div className="orbital-equator-grid"></div>

          {/* Botón Anterior */}
          <button
            className="orbital-nav-arrow arrow-prev"
            onClick={handlePrevSphere}
            aria-label="Entrevista anterior"
            title="Ver testimonio anterior"
          >
            <ChevronLeft size={24} />
          </button>

          {/* Tarjeta Central Activa */}
          <div className="orbital-card-container">
            {(() => {
              const current = VALIDATION_INTERVIEWS[currentSphereIndex]
              return (
                <div
                  key={current.id}
                  className="orbital-featured-card"
                  style={{ '--citizen-color': current.avatarBg }}
                >
                  <div className="card-top-row">
                    <div className="citizen-avatar-box" style={{ backgroundColor: current.avatarBg }}>
                      {current.author.charAt(0)}
                    </div>
                    <div className="citizen-info-col">
                      <div className="citizen-name-row">
                        <strong className="citizen-full-name">{current.author}</strong>
                        <span className="interview-badge">Entrevista #{current.id}</span>
                      </div>
                      <span className="citizen-location-tag">
                        <MapPin size={13} className="inline-icon" /> {current.canton}
                      </span>
                    </div>
                    <span className="citizen-zone-chip">{current.zone}</span>
                  </div>

                  <div className="card-hallazgo-row">
                    <span className="hallazgo-badge" style={{ borderColor: `${current.avatarBg}44`, color: current.avatarBg }}>
                      <Sparkles size={13} className="inline-icon" /> Hallazgo: {current.tag}
                    </span>
                  </div>

                  <div className="card-quote-section">
                    <Quote size={26} className="quote-decorative-icon" style={{ color: current.avatarBg }} />
                    <p className="quote-text-full">"{current.quote}"</p>
                  </div>

                  <div className="card-bottom-row">
                    <span className="interviewer-credit">
                      <UserCheck size={13} className="inline-icon" /> {current.interviewer}
                    </span>
                    <span className="academic-proof-badge">
                      Validación metodológica CUC
                    </span>
                  </div>
                </div>
              )
            })()}
          </div>

          {/* Botón Siguiente */}
          <button
            className="orbital-nav-arrow arrow-next"
            onClick={handleNextSphere}
            aria-label="Siguiente entrevista"
            title="Ver siguiente testimonio"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Barra de Controles y Selector de los 11 Ciudadanos */}
        <div className="orbital-showcase-controls">
          <div className="controls-left-col">
            <button
              className={`btn-toggle-orbit ${isAutoRotating ? 'rotating' : ''}`}
              onClick={() => setIsAutoRotating(!isAutoRotating)}
              title={isAutoRotating ? 'Pausar rotación automática' : 'Reanudar rotación automática'}
            >
              {isAutoRotating ? (
                <>
                  <Pause size={14} /> Rotación esférica activa (Pausar)
                </>
              ) : (
                <>
                  <Play size={14} /> Reanudar rotación automática
                </>
              )}
            </button>
            <span className="counter-text">
              Entrevista <strong>{currentSphereIndex + 1}</strong> de {VALIDATION_INTERVIEWS.length}
            </span>
          </div>

          {/* 11 Nodos Orbitantes Interactivos */}
          <div className="orbital-nodes-track">
            {VALIDATION_INTERVIEWS.map((item, idx) => {
              const isActive = idx === currentSphereIndex
              return (
                <button
                  key={item.id}
                  className={`orbital-node-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setCurrentSphereIndex(idx)}
                  title={`#${item.id} ${item.author} (${item.canton})`}
                  style={{ '--node-color': item.avatarBg }}
                >
                  <span className="node-num">{item.id}</span>
                  <span className="node-author-label">{item.author.split(' ')[0]}</span>
                </button>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
