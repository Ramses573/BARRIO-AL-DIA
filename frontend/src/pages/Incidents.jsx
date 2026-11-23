import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  LayoutGrid,
  Table as TableIcon,
  ThumbsUp,
  Share2,
  Map,
  Eye,
  Calendar,
  MapPin,
  Camera,
  X,
  Download,
  ArrowUpDown,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Check
} from 'lucide-react'
import { getIncidents, fetchIncidentsFromApi } from '../services/incidentService'
import { useToast } from '../components/Toast'
import './Incidents.css'

export default function Incidents() {
  const { addToast } = useToast()
  const [incidentsList, setIncidentsList] = useState(getIncidents())

  useEffect(() => {
    fetchIncidentsFromApi().then(data => {
      if (Array.isArray(data)) setIncidentsList(data)
    }).catch(() => {})
  }, [])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('Todas')
  const [filterStatus, setFilterStatus] = useState('Todos')
  const [filterCanton, setFilterCanton] = useState('Todos')
  const [sortBy, setSortBy] = useState('recientes')
  const [viewMode, setViewMode] = useState('cards')

  // Votos comunitarios almacenados
  const [votes, setVotes] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem('barrio_incident_votes')
        if (stored) return JSON.parse(stored)
      } catch {
        // Fallback
      }
    }
    return {}
  })

  // Registro de incidentes que el usuario actual ya respaldó
  const [userVotedIds, setUserVotedIds] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem('barrio_user_voted_ids')
        if (stored) return JSON.parse(stored)
      } catch {
        // Fallback
      }
    }
    return []
  })

  const handleVote = (id) => {
    const hasVoted = userVotedIds.includes(id)
    const current = votes[id] || 0

    let newCount = current
    let updatedVotedIds = []

    if (hasVoted) {
      newCount = Math.max(0, current - 1)
      updatedVotedIds = userVotedIds.filter(vId => vId !== id)
      addToast('Respaldo vecinal retirado', 'info')
    } else {
      newCount = current + 1
      updatedVotedIds = [...userVotedIds, id]
      addToast('¡Confirmaste este reporte! Aumenta la prioridad en el despacho municipal.', 'success')
    }

    const updatedVotes = { ...votes, [id]: newCount }
    setVotes(updatedVotes)
    setUserVotedIds(updatedVotedIds)

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem('barrio_incident_votes', JSON.stringify(updatedVotes))
        window.localStorage.setItem('barrio_user_voted_ids', JSON.stringify(updatedVotedIds))
      } catch {
        // Fallback
      }
    }
  }

  const handleShareWhatsApp = (incident) => {
    const text = `*Alerta Comunitaria en BarrioAlDía*: ${incident.category} en ${incident.location}.\nDetalle: ${incident.description}\nConsulta el mapa en vivo en ${window.location.origin}/map`
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
    addToast('Abriendo WhatsApp para compartir con los vecinos...', 'info')
  }

  // Exportar datos a CSV
  const handleExportCSV = () => {
    if (filtered.length === 0) {
      addToast('No hay reportes para exportar con los filtros actuales', 'warning')
      return
    }

    const headers = [
      'ID',
      'Categoría',
      'Título',
      'Ubicación',
      'Fecha',
      'Estado',
      'Prioridad',
      'Votos de Respaldo',
      'Latitud',
      'Longitud',
      'Descripción'
    ]

    const csvRows = filtered.map(item => [
      item.id,
      `"${(item.category || '').replace(/"/g, '""')}"`,
      `"${(item.title || '').replace(/"/g, '""')}"`,
      `"${(item.location || '').replace(/"/g, '""')}"`,
      item.date || '',
      `"${(item.status || 'Pendiente').replace(/"/g, '""')}"`,
      item.priority || 'Media',
      votes[item.id] || 0,
      item.lat || '',
      item.lng || '',
      `"${(item.description || '').replace(/"/g, '""')}"`
    ])

    // BOM UTF-8 para visualización correcta de tildes en Excel en español
    const csvContent = '\uFEFF' + [headers.join(','), ...csvRows.map(e => e.join(','))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `reportes_vecinales_barrio_al_dia_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    addToast(`Exportados ${filtered.length} incidentes a archivo CSV`, 'success')
  }

  // Filtrado
  const filtered = incidentsList.filter(item => {
    const matchesSearch = searchQuery.trim() === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = filterCategory === 'Todas' || item.category === filterCategory
    const matchesStatus = filterStatus === 'Todos' || item.status === filterStatus
    const matchesCanton = filterCanton === 'Todos' || item.location.toLowerCase().includes(filterCanton.toLowerCase())

    return matchesSearch && matchesCategory && matchesStatus && matchesCanton
  })

  // Ordenamiento dinámico
  const priorityScore = { 'Alta': 3, 'Media': 2, 'Baja': 1 }
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'recientes') {
      return (b.id || 0) - (a.id || 0)
    }
    if (sortBy === 'antiguos') {
      return (a.id || 0) - (b.id || 0)
    }
    if (sortBy === 'votos') {
      const vA = votes[a.id] || 0
      const vB = votes[b.id] || 0
      return vB - vA
    }
    if (sortBy === 'prioridad') {
      const pA = priorityScore[a.priority] || 2
      const pB = priorityScore[b.priority] || 2
      return pB - pA
    }
    return 0
  })

  const handleClearFilters = () => {
    setSearchQuery('')
    setFilterCategory('Todas')
    setFilterStatus('Todos')
    setFilterCanton('Todos')
    setSortBy('recientes')
  }

  const isFiltered = searchQuery !== '' || filterCategory !== 'Todas' || filterStatus !== 'Todos' || filterCanton !== 'Todos' || sortBy !== 'recientes'

  // Estadísticas rápidas
  const totalCount = incidentsList.length
  const pendingCount = incidentsList.filter(i => i.status === 'Pendiente').length
  const inProgressCount = incidentsList.filter(i => i.status === 'En atención' || i.status === 'En proceso').length
  const resolvedCount = incidentsList.filter(i => i.status === 'Resuelto').length
  const resolutionRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0

  return (
    <div className="incidents-container">
      {/* Encabezado Principal */}
      <div className="incidents-page-header">
        <div className="header-meta">
          <span className="incidents-badge">Monitoreo Cantonal</span>
          <h1>Listado de Incidentes de la Comunidad</h1>
          <p className="incidents-subtitle">
            Transparencia vecinal y seguimiento directo de reportes viales, ambientales y de infraestructura.
          </p>
        </div>

        <div className="header-actions-row">
          <button
            type="button"
            className="btn-export-csv"
            onClick={handleExportCSV}
            title="Descargar listado actual en formato CSV para análisis o fiscalización"
          >
            <Download size={15} className="inline-icon" /> Exportar CSV
          </button>
          <Link to="/report" className="btn-create-report">
            + Reportar Incidente
          </Link>
        </div>
      </div>

      {/* Franja de Estadísticas Rápidas */}
      <div className="incidents-kpi-bar">
        <div className="kpi-pill">
          <span className="kpi-label">Reportes Totales:</span>
          <strong>{totalCount}</strong>
        </div>
        <div className="kpi-pill kpi-pending">
          <Clock size={13} className="inline-icon" />
          <span className="kpi-label">Pendientes:</span>
          <strong>{pendingCount}</strong>
        </div>
        <div className="kpi-pill kpi-progress">
          <AlertTriangle size={13} className="inline-icon" />
          <span className="kpi-label">En Atención:</span>
          <strong>{inProgressCount}</strong>
        </div>
        <div className="kpi-pill kpi-resolved">
          <CheckCircle2 size={13} className="inline-icon" />
          <span className="kpi-label">Resueltos:</span>
          <strong>{resolvedCount} ({resolutionRate}%)</strong>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="incidents-controls-card">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon-inside" />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por palabra clave, cantón, calle o descripción..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="btn-clear-search" onClick={() => setSearchQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="filters-group">
          {/* Categoría */}
          <div className="filter-item">
            <label>Categoría:</label>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="Todas">Todas</option>
              <option value="Accidente">Accidente</option>
              <option value="Inundación">Inundación</option>
              <option value="Incendio">Incendio</option>
              <option value="Poste sin luz">Poste sin luz</option>
              <option value="Calles dañadas">Calles dañadas</option>
              <option value="Inseguridad">Inseguridad</option>
            </select>
          </div>

          {/* Estado */}
          <div className="filter-item">
            <label>Estado:</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="Todos">Todos</option>
              <option value="Pendiente">Pendiente</option>
              <option value="En atención">En atención / En proceso</option>
              <option value="Resuelto">Resuelto</option>
            </select>
          </div>

          {/* Cantón */}
          <div className="filter-item">
            <label>Cantón / Zona:</label>
            <select value={filterCanton} onChange={(e) => setFilterCanton(e.target.value)}>
              <option value="Todos">Todos los cantones</option>
              <option value="Cartago">Cartago Centro</option>
              <option value="San Blas">San Blas</option>
              <option value="Turrialba">Turrialba</option>
              <option value="Tarrazú">San Marcos de Tarrazú</option>
            </select>
          </div>

          {/* Ordenar por */}
          <div className="filter-item">
            <label><ArrowUpDown size={13} className="inline-icon" /> Ordenar:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="recientes">Más recientes</option>
              <option value="antiguos">Más antiguos</option>
              <option value="votos">Mayor respaldo vecinal</option>
              <option value="prioridad">Mayor urgencia institucional</option>
            </select>
          </div>

          {/* Alternador de vista */}
          <div className="view-mode-toggle">
            <button
              className={`btn-view-toggle ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
              title="Vista de Tarjetas con evidencia"
            >
              <LayoutGrid size={15} /> Tarjetas
            </button>
            <button
              className={`btn-view-toggle ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Vista de Tabla"
            >
              <TableIcon size={15} /> Tabla
            </button>
          </div>

          {isFiltered && (
            <button className="btn-reset-filters" onClick={handleClearFilters}>
              Limpiar filtros
            </button>
          )}

          <span className="incidents-count">
            Mostrando <strong>{sorted.length}</strong> de {incidentsList.length} reportes
          </span>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="no-incidents-box">
          <p>No se encontraron incidentes con los filtros aplicados.</p>
          {isFiltered && (
            <button className="btn-reset-filters" onClick={handleClearFilters}>
              Restablecer búsqueda
            </button>
          )}
        </div>
      ) : viewMode === 'cards' ? (
        /* Modo Vista de Tarjetas */
        <div className="incidents-cards-grid">
          {sorted.map(i => {
            const isUserVoted = userVotedIds.includes(i.id)
            return (
              <div key={i.id} className="incident-full-card">
                <div className="full-card-header">
                  <div className="card-tags-row">
                    <span className={`cat-pill cat-${i.category.toLowerCase().replace(/\s+/g, '-')}`}>
                      {i.category}
                    </span>
                    <span className={`status-pill status-${i.status ? i.status.toLowerCase().replace(/\s+/g, '-') : 'pendiente'}`}>
                      {i.status || 'Pendiente'}
                    </span>
                    {i.priority && (
                      <span className={`priority-pill priority-${i.priority.toLowerCase()}`}>
                        {i.priority}
                      </span>
                    )}
                    {i.isAnonymous && <span className="anon-badge">Anónimo</span>}
                  </div>
                  <span className="card-id-badge">#{i.id}</span>
                </div>

                <h3 className="full-card-title">{i.title}</h3>
                <p className="full-card-loc">
                  <MapPin size={13} className="inline-icon" /> <strong>Ubicación:</strong> {i.location}
                </p>
                <p className="full-card-desc">{i.description}</p>

                {i.photo && (
                  <div className="full-card-photo-badge">
                    <Camera size={13} /> Evidencia adjunta: {i.photo}
                  </div>
                )}

                <div className="full-card-footer">
                  <span className="card-date-badge">
                    <Calendar size={13} className="inline-icon" /> {i.date}
                  </span>

                  <div className="card-actions-group">
                    <button
                      className={`btn-vote-community ${isUserVoted ? 'voted' : ''}`}
                      onClick={() => handleVote(i.id)}
                      title={isUserVoted ? 'Ya respaldaste este reporte (clic para retirar)' : 'Confirmar que este incidente sigue afectando a los vecinos'}
                    >
                      {isUserVoted ? (
                        <>
                          <Check size={13} /> Respaldado ({votes[i.id] || 0})
                        </>
                      ) : (
                        <>
                          <ThumbsUp size={13} /> Respaldar ({votes[i.id] || 0})
                        </>
                      )}
                    </button>

                    <button
                      className="btn-share-wa"
                      onClick={() => handleShareWhatsApp(i)}
                      title="Compartir en grupos de WhatsApp"
                    >
                      <Share2 size={13} /> Compartir
                    </button>

                    <Link to={`/incidents/${i.id}`} className="btn-detail-link" title="Ver detalle y trazabilidad">
                      <Eye size={13} /> Detalle
                    </Link>

                    <Link to={`/map?lat=${i.lat}&lng=${i.lng}`} className="btn-goto-map">
                      <Map size={13} /> Mapa
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Modo Vista de Tabla */
        <div className="incidents-table-card">
          <table className="incidents-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Categoría</th>
                <th>Título / Detalle</th>
                <th>Ubicación</th>
                <th>Fecha</th>
                <th>Prioridad</th>
                <th>Estado</th>
                <th>Respaldo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(i => {
                const isUserVoted = userVotedIds.includes(i.id)
                return (
                  <tr key={i.id}>
                    <td className="col-id">#{i.id}</td>
                    <td>
                      <span className={`cat-pill cat-${i.category.toLowerCase().replace(/\s+/g, '-')}`}>
                        {i.category}
                      </span>
                    </td>
                    <td>
                      <strong>{i.title}</strong>
                      <div className="table-subtext">{i.description}</div>
                    </td>
                    <td>{i.location}</td>
                    <td className="col-date">{i.date}</td>
                    <td>
                      <span className={`priority-pill priority-${(i.priority || 'media').toLowerCase()}`}>
                        {i.priority || 'Media'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill status-${i.status ? i.status.toLowerCase().replace(/\s+/g, '-') : 'pendiente'}`}>
                        {i.status || 'Pendiente'}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`btn-vote-inline ${isUserVoted ? 'voted' : ''}`}
                        onClick={() => handleVote(i.id)}
                        title={isUserVoted ? 'Ya respaldaste este reporte' : 'Respaldar'}
                      >
                        {isUserVoted ? <Check size={12} /> : <ThumbsUp size={12} />} {votes[i.id] || 0}
                      </button>
                    </td>
                    <td>
                      <div className="table-actions-row">
                        <Link to={`/incidents/${i.id}`} className="btn-detail-inline" title="Ver detalle">
                          <Eye size={13} />
                        </Link>
                        <button className="btn-wa-inline" onClick={() => handleShareWhatsApp(i)} title="Compartir por WhatsApp">
                          <Share2 size={13} />
                        </button>
                        <Link to={`/map?lat=${i.lat}&lng=${i.lng}`} className="btn-map-inline" title="Ver en Google Maps">
                          <Map size={13} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
