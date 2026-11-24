import React, { useState, useEffect } from 'react'
import {
  Building2,
  ClipboardList,
  Clock,
  Wrench,
  CheckCircle2,
  TrendingUp,
  Filter,
  Printer,
  Download,
  FileText,
  Edit3,
  MapPin,
  AlertCircle,
  BarChart3,
  UserCheck,
  Lock,
  LogOut,
  X,
  Search,
  Check,
  KeyRound,
  Trash2
} from 'lucide-react'
import { getIncidents, updateIncidentStatus, fetchIncidentsFromApi, wipeIncidents } from '../services/incidentService'
import { useToast } from '../components/Toast'
import AuditReportModal from '../components/AuditReportModal'
import './AdminDashboard.css'

const OFFICIALS = [
  {
    id: 'cartago',
    name: 'Ing. Carlos Méndez Solís',
    role: 'Director de Obras y Servicios Públicos',
    entity: 'Municipalidad de Cartago',
    email: 'carlos.mendez@muni-cartago.go.cr',
    badge: 'ID Funcionario: MC-4921'
  },
  {
    id: 'turrialba',
    name: 'Licda. Elena Rojas Umaña',
    role: 'Coordinadora de Obras Comunales',
    entity: 'Municipalidad de Turrialba',
    email: 'elena.rojas@muni-turrialba.go.cr',
    badge: 'ID Funcionario: MT-1840'
  },
  {
    id: 'tarrazu',
    name: 'Téc. Marco Solano Vargas',
    role: 'Inspector de Infraestructura Vial',
    entity: 'Municipalidad de Tarrazú',
    email: 'marco.solano@munitarrazu.go.cr',
    badge: 'ID Funcionario: MZ-0372'
  }
]

export default function AdminDashboard() {
  const [incidents, setIncidents] = useState([])
  const [selectedEntity, setSelectedEntity] = useState('Municipalidad de Cartago - Servicios Públicos')
  const [selectedCanton, setSelectedCanton] = useState('todos')
  const [selectedStatus, setSelectedStatus] = useState('todos')
  const [searchTable, setSearchTable] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [institutionalNoteText, setInstitutionalNoteText] = useState('')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showAuditModal, setShowAuditModal] = useState(false)
  const [activeOfficial, setActiveOfficial] = useState(() => {
    try {
      const stored = localStorage.getItem('barrio_active_official')
      if (stored) return JSON.parse(stored)
    } catch {
      // Fallback
    }
    return OFFICIALS[0]
  })

  const { addToast } = useToast()

  const reloadData = () => {
    fetchIncidentsFromApi().then(data => {
      if (Array.isArray(data)) setIncidents(data)
    }).catch(() => {
      setIncidents(getIncidents())
    })
  }

  const handleWipeData = async () => {
    if (window.confirm('¿Confirmas el barrido completo de datos? Todos los reportes serán eliminados de la base de datos para iniciar pruebas desde cero.')) {
      await wipeIncidents()
      reloadData()
      addToast('🧹 Barrido de datos ejecutado. Base de datos en 0 reportes.', 'info')
    }
  }

  useEffect(() => {
    reloadData()
  }, [])

  const handleStatusChange = (id, newStatus, currentNote = '') => {
    updateIncidentStatus(id, newStatus, currentNote)
    reloadData()
    addToast(`Incidente #${id} actualizado a "${newStatus}"`, 'success')
  }

  const handleSaveNote = (id, currentStatus) => {
    if (!institutionalNoteText.trim()) return
    updateIncidentStatus(id, currentStatus, institutionalNoteText.trim())
    setEditingId(null)
    setInstitutionalNoteText('')
    reloadData()
    addToast(`Bitácora técnica actualizada para el reporte #${id}`, 'info')
  }

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(incidents, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `barrio_al_dia_reporte_institucional_${new Date().toISOString().split('T')[0]}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
    addToast('Reporte institucional descargado en formato JSON', 'success')
  }

  const handleExportCSV = () => {
    const headers = ['ID', 'Categoría', 'Título', 'Ubicación', 'Fecha', 'Prioridad', 'Estado', 'Bitácora Técnica']
    const rows = filtered.map(i => [
      i.id,
      `"${(i.category || '').replace(/"/g, '""')}"`,
      `"${(i.title || '').replace(/"/g, '""')}"`,
      `"${(i.location || '').replace(/"/g, '""')}"`,
      i.date || '',
      i.priority || 'Media',
      `"${(i.status || 'Pendiente').replace(/"/g, '""')}"`,
      `"${(i.institutionalNote || '').replace(/"/g, '""')}"`
    ])
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `despacho_cuadrillas_municipal_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    addToast(`Exportados ${filtered.length} reportes a CSV`, 'success')
  }

  const handleSwitchOfficial = (official) => {
    setActiveOfficial(official)
    localStorage.setItem('barrio_active_official', JSON.stringify(official))
    setShowAuthModal(false)
    addToast(`Sesión activa: ${official.name} (${official.entity})`, 'success')
  }

  // Filter logic
  const filtered = incidents.filter(inc => {
    const locLower = (inc.location || '').toLowerCase()
    const titleLower = (inc.title || '').toLowerCase()
    const descLower = (inc.description || '').toLowerCase()
    const query = searchTable.toLowerCase().trim()

    const matchesSearch = query === '' ||
      titleLower.includes(query) ||
      locLower.includes(query) ||
      descLower.includes(query) ||
      String(inc.id) === query

    const matchesCanton =
      selectedCanton === 'todos' ||
      (selectedCanton === 'cartago' && (locLower.includes('cartago') || locLower.includes('san blas') || locLower.includes('carmen') || locLower.includes('dique'))) ||
      (selectedCanton === 'turrialba' && locLower.includes('turrialba')) ||
      (selectedCanton === 'tarrazu' && (locLower.includes('tarrazú') || locLower.includes('tarrazu') || locLower.includes('marcos')))

    const matchesStatus = selectedStatus === 'todos' || inc.status === selectedStatus
    return matchesSearch && matchesCanton && matchesStatus
  })

  // Metrics
  const total = incidents.length
  const pending = incidents.filter(i => i.status === 'Pendiente').length
  const inProgress = incidents.filter(i => i.status === 'En atención' || i.status === 'En proceso').length
  const resolved = incidents.filter(i => i.status === 'Resuelto').length
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0

  // Distribución Cantonal para el gráfico analítico
  const cartagoCount = incidents.filter(i => {
    const l = (i.location || '').toLowerCase()
    return l.includes('cartago') || l.includes('san blas') || l.includes('carmen')
  }).length
  const turrialbaCount = incidents.filter(i => (i.location || '').toLowerCase().includes('turrialba')).length
  const tarrazuCount = incidents.filter(i => {
    const l = (i.location || '').toLowerCase()
    return l.includes('tarrazú') || l.includes('tarrazu') || l.includes('marcos')
  }).length

  // Categorías de incidencias
  const categoryStats = [
    { name: 'Inundación', color: '#3182ce', count: incidents.filter(i => i.category === 'Inundación').length },
    { name: 'Accidente', color: '#e53e3e', count: incidents.filter(i => i.category === 'Accidente').length },
    { name: 'Poste sin luz', color: '#805ad5', count: incidents.filter(i => i.category === 'Poste sin luz').length },
    { name: 'Incendio', color: '#dd6b20', count: incidents.filter(i => i.category === 'Incendio').length },
    { name: 'Calles dañadas', color: '#d97706', count: incidents.filter(i => i.category === 'Calles dañadas').length },
    { name: 'Inseguridad', color: '#4f46e5', count: incidents.filter(i => i.category === 'Inseguridad').length }
  ]

  return (
    <div className="admin-container">
      {/* Modal de Autenticación Institucional Simulada */}
      {showAuthModal && (
        <div className="auth-modal-backdrop" onClick={() => setShowAuthModal(false)}>
          <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="auth-modal-header">
              <div className="auth-header-title">
                <Lock size={20} className="text-blue" />
                <h3>Credenciales Institucionales Oficiales</h3>
              </div>
              <button className="auth-close-btn" onClick={() => setShowAuthModal(false)}>
                <X size={18} />
              </button>
            </div>
            <p className="auth-modal-sub">
              Selecciona una identidad de funcionario cantonal para firmar bitácoras y despachos con trazabilidad auditada:
            </p>

            <div className="officials-list">
              {OFFICIALS.map(off => {
                const isSelected = activeOfficial.id === off.id
                return (
                  <div
                    key={off.id}
                    className={`official-card ${isSelected ? 'active' : ''}`}
                    onClick={() => handleSwitchOfficial(off)}
                  >
                    <div className="official-avatar">
                      <UserCheck size={22} className={isSelected ? 'text-blue' : ''} />
                    </div>
                    <div className="official-info">
                      <strong>{off.name}</strong>
                      <span className="off-role">{off.role}</span>
                      <span className="off-entity">{off.entity} • {off.badge}</span>
                    </div>
                    {isSelected && (
                      <span className="selected-check">
                        <Check size={18} />
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="auth-modal-footer">
              <span className="auth-security-notice">
                <KeyRound size={13} className="inline-icon" /> Acceso seguro con certificación digital ciudadana CUC TI-155.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Barra de Funcionario Activo */}
      <div className="admin-official-bar">
        <div className="official-session-info">
          <div className="official-status-indicator"></div>
          <UserCheck size={16} className="inline-icon text-blue" />
          <span>
            Funcionario Verificado: <strong>{activeOfficial.name}</strong> ({activeOfficial.role} — <em>{activeOfficial.entity}</em>)
          </span>
        </div>
        <button
          type="button"
          className="btn-change-official"
          onClick={() => setShowAuthModal(true)}
          title="Cambiar funcionario cantonal autenticado"
        >
          <Lock size={13} className="inline-icon" /> Cambiar Funcionario
        </button>
      </div>

      {/* Header Institucional */}
      <header className="admin-header">
        <div className="admin-header-main">
          <div className="admin-badge">Segmento 2 CUC • Operaciones Gubernamentales</div>
          <h1>Panel de Gestión Institucional y Municipal</h1>
          <p className="admin-subtitle">
            Consola de fiscalización, despacho de cuadrillas y respuesta a incidencias ciudadanas para Cartago y cantones asociados.
          </p>
        </div>

        <div className="admin-entity-selector">
          <label htmlFor="entity-select">
            <Building2 size={13} className="inline-icon" /> Dependencia Activa:
          </label>
          <select
            id="entity-select"
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="entity-dropdown"
          >
            <option value="Municipalidad de Cartago - Servicios Públicos">Municipalidad de Cartago (Servicios Públicos)</option>
            <option value="Municipalidad de Turrialba - Obras Comunales">Municipalidad de Turrialba (Obras Comunales)</option>
            <option value="Municipalidad de Tarrazú - Gestión Vial">Municipalidad de Tarrazú (Gestión Vial)</option>
            <option value="Fuerza Pública de Costa Rica - Delegación Cartago">Fuerza Pública CR (Delegación Cartago)</option>
            <option value="Cruz Roja Costarricense - Comité Auxiliar">Cruz Roja Costarricense (Comité Auxiliar)</option>
            <option value="Cuerpo de Bomberos de Costa Rica">Cuerpo de Bomberos de Costa Rica</option>
          </select>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <div className="kpi-icon">
            <ClipboardList size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-value">{total}</span>
            <span className="kpi-label">Reportes Recibidos</span>
          </div>
        </div>

        <div className="admin-kpi-card kpi-warning">
          <div className="kpi-icon">
            <Clock size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-value">{pending}</span>
            <span className="kpi-label">Pendientes de Despacho</span>
          </div>
        </div>

        <div className="admin-kpi-card kpi-info">
          <div className="kpi-icon">
            <Wrench size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-value">{inProgress}</span>
            <span className="kpi-label">Cuadrillas en Atención</span>
          </div>
        </div>

        <div className="admin-kpi-card kpi-success">
          <div className="kpi-icon">
            <CheckCircle2 size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-value">{resolved}</span>
            <span className="kpi-label">Casos Solucionados</span>
          </div>
        </div>

        <div className="admin-kpi-card kpi-highlight">
          <div className="kpi-icon">
            <TrendingUp size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-value">{resolutionRate}%</span>
            <span className="kpi-label">Tasa de Eficacia</span>
          </div>
        </div>
      </section>

      {/* Panel de Gráficos y Distribución Cantonal (Craftsmanship L3) */}
      <section className="admin-analytics-section">
        <div className="analytics-card">
          <div className="analytics-header">
            <h4>
              <BarChart3 size={16} className="inline-icon text-blue" /> Distribución Geográfica Cantonal
            </h4>
            <span className="analytics-hint">Reportes validados en campo</span>
          </div>

          <div className="canton-bars-stack">
            <div className="canton-stat-row">
              <div className="canton-stat-info">
                <strong>Cartago Centro & San Blas</strong>
                <span>{cartagoCount} reportes ({total > 0 ? Math.round((cartagoCount / total) * 100) : 0}%)</span>
              </div>
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill fill-cartago"
                  style={{ width: `${total > 0 ? Math.round((cartagoCount / total) * 100) : 0}%` }}
                ></div>
              </div>
            </div>

            <div className="canton-stat-row">
              <div className="canton-stat-info">
                <strong>Turrialba (Sector El Mora)</strong>
                <span>{turrialbaCount} reportes ({total > 0 ? Math.round((turrialbaCount / total) * 100) : 0}%)</span>
              </div>
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill fill-turrialba"
                  style={{ width: `${total > 0 ? Math.round((turrialbaCount / total) * 100) : 0}%` }}
                ></div>
              </div>
            </div>

            <div className="canton-stat-row">
              <div className="canton-stat-info">
                <strong>Tarrazú (San Marcos)</strong>
                <span>{tarrazuCount} reportes ({total > 0 ? Math.round((tarrazuCount / total) * 100) : 0}%)</span>
              </div>
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill fill-tarrazu"
                  style={{ width: `${total > 0 ? Math.round((tarrazuCount / total) * 100) : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-header">
            <h4>
              <ClipboardList size={16} className="inline-icon text-blue" /> Incidencias por Tipología
            </h4>
            <span className="analytics-hint">Causas de mayor impacto</span>
          </div>

          <div className="categories-breakdown-grid">
            {categoryStats.map(cat => (
              <div key={cat.name} className="cat-stat-badge">
                <span className="cat-badge-dot" style={{ backgroundColor: cat.color }}></span>
                <span className="cat-badge-title">{cat.name}</span>
                <strong className="cat-badge-num">{cat.count}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filter and Action Bar */}
      <section className="admin-controls-bar">
        <div className="admin-filter-group">
          <div className="admin-search-wrapper">
            <Search size={14} className="admin-search-icon" />
            <input
              type="text"
              placeholder="Buscar por ID, calle o palabra clave..."
              value={searchTable}
              onChange={(e) => setSearchTable(e.target.value)}
              className="admin-search-field"
            />
            {searchTable && (
              <button className="btn-clear-admin-search" onClick={() => setSearchTable('')}>
                <X size={13} />
              </button>
            )}
          </div>

          <span className="filter-title">
            <Filter size={14} className="inline-icon" /> Cantón:
          </span>
          <select
            value={selectedCanton}
            onChange={(e) => setSelectedCanton(e.target.value)}
            className="admin-select"
          >
            <option value="todos">Todos los Cantones</option>
            <option value="cartago">Cartago Centro / San Blas</option>
            <option value="turrialba">Turrialba</option>
            <option value="tarrazu">Tarrazú</option>
          </select>

          <span className="filter-title">
            Estado:
          </span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="admin-select"
          >
            <option value="todos">Todos los Estados</option>
            <option value="Pendiente">Pendiente</option>
            <option value="En atención">En atención / En proceso</option>
            <option value="Resuelto">Resuelto</option>
          </select>
        </div>

        <div className="admin-actions-group">
          <button className="btn-admin-action btn-audit-pdf" onClick={() => setShowAuditModal(true)} title="Generar Acta Oficial de Auditoría en PDF (CUC TI-155)">
            <FileText size={14} /> Acta Oficial PDF
          </button>
          <button className="btn-admin-action btn-csv" onClick={handleExportCSV} title="Descargar en formato CSV">
            <Download size={14} /> Exportar CSV
          </button>
          <button className="btn-admin-action btn-export" onClick={handleExportJSON} title="Descargar JSON de auditoría">
            <FileText size={14} /> Log JSON
          </button>
          <button className="btn-admin-action btn-print" onClick={() => setShowAuditModal(true)} title="Imprimir informe oficial">
            <Printer size={14} /> Imprimir
          </button>
          <button className="btn-admin-action btn-wipe" onClick={handleWipeData} title="Barrido de datos: limpiar todos los reportes para pruebas en limpio">
            <Trash2 size={14} /> Barrido de Datos
          </button>
        </div>
      </section>

      {/* Incident Operational Table */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: '100px' }}>ID / Folio</th>
              <th>Incidente & Categoría</th>
              <th>Reportado por</th>
              <th>Ubicación</th>
              <th>Prioridad</th>
              <th>Estado Actual</th>
              <th>Bitácora Institucional</th>
              <th style={{ minWidth: '220px' }}>Gestión Operativa</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="8" className="admin-empty-cell">
                  <AlertCircle size={24} style={{ marginBottom: '0.5rem', display: 'block', margin: '0 auto' }} />
                  No hay incidencias que coincidan con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className={`row-status-${(item.status || 'pendiente').toLowerCase().replace(/\s+/g, '-')}`}>
                  <td>
                    <strong className="item-id">{item.ticketCode || `#${item.id}`}</strong>
                    <div className="item-date">{item.date}</div>
                  </td>
                  <td>
                    <div className="incident-title-cell">
                      <span className="item-title">{item.title}</span>
                      <span className="item-category-tag">{item.category}</span>
                    </div>
                    {item.description && <p className="item-desc-snippet">{item.description}</p>}
                  </td>
                  <td>
                    <span className="item-reporter-badge" style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      color: item.isAnonymous ? '#64748b' : '#0284c7',
                      background: item.isAnonymous ? '#f1f5f9' : 'rgba(2,132,199,0.08)',
                      padding: '3px 8px',
                      borderRadius: '4px'
                    }}>
                      {item.isAnonymous ? '🛡️ Anónimo' : (item.reporterName || 'Ramsés Solano')}
                    </span>
                  </td>
                  <td>
                    <span className="item-location">
                      <MapPin size={12} className="inline-icon" /> {item.location}
                    </span>
                  </td>
                  <td>
                    <span className={`priority-tag priority-${(item.priority || 'media').toLowerCase()}`}>
                      {item.priority || 'Media'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill pill-${(item.status || 'pendiente').toLowerCase().replace(/\s+/g, '-')}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="note-cell">
                    {item.institutionalNote ? (
                      <div className="existing-note">
                        <FileText size={14} className="note-icon" />
                        <span className="note-text">{item.institutionalNote}</span>
                      </div>
                    ) : (
                      <span className="no-note">Sin bitácora técnica</span>
                    )}

                    {editingId === item.id ? (
                      <div className="note-input-box">
                        <input
                          type="text"
                          placeholder="Ej. Cuadrilla 3 asignada con camión cisterna..."
                          value={institutionalNoteText}
                          onChange={(e) => setInstitutionalNoteText(e.target.value)}
                          className="note-inline-input"
                          autoFocus
                        />
                        <div className="note-input-buttons">
                          <button
                            className="btn-note-save"
                            onClick={() => handleSaveNote(item.id, item.status)}
                          >
                            Guardar
                          </button>
                          <button
                            className="btn-note-cancel"
                            onClick={() => {
                              setEditingId(null)
                              setInstitutionalNoteText('')
                            }}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className="btn-add-note"
                        onClick={() => {
                          setEditingId(item.id)
                          setInstitutionalNoteText(item.institutionalNote || '')
                        }}
                      >
                        <Edit3 size={11} className="inline-icon" /> {item.institutionalNote ? 'Editar nota' : 'Añadir nota'}
                      </button>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons-cell">
                      <button
                        className={`btn-state btn-state-pending ${item.status === 'Pendiente' ? 'active' : ''}`}
                        onClick={() => handleStatusChange(item.id, 'Pendiente', item.institutionalNote)}
                        title="Marcar como pendiente"
                      >
                        Pendiente
                      </button>
                      <button
                        className={`btn-state btn-state-progress ${item.status === 'En atención' || item.status === 'En proceso' ? 'active' : ''}`}
                        onClick={() => handleStatusChange(item.id, 'En atención', item.institutionalNote)}
                        title="Despachar cuadrilla o unidad"
                      >
                        <Wrench size={12} className="inline-icon" /> Atender
                      </button>
                      <button
                        className={`btn-state btn-state-resolved ${item.status === 'Resuelto' ? 'active' : ''}`}
                        onClick={() => handleStatusChange(item.id, 'Resuelto', item.institutionalNote)}
                        title="Cerrar como solucionado"
                      >
                        <CheckCircle2 size={12} className="inline-icon" /> Resolver
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AuditReportModal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
        incidents={filtered}
        official={activeOfficial}
        selectedEntity={selectedEntity}
        metrics={{
          total,
          resolved,
          inProgress,
          pending,
          resolutionRate
        }}
      />
    </div>
  )
}
