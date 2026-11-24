import React from 'react'
import {
  FileText,
  Printer,
  X,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Wrench,
  Download
} from 'lucide-react'
import './AuditReportModal.css'

export default function AuditReportModal({
  isOpen,
  onClose,
  incidents,
  official,
  selectedEntity,
  metrics
}) {
  if (!isOpen) return null

  const today = new Date().toLocaleDateString('es-CR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const time = new Date().toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })
  const reportFolio = `ACTA-CUC-${new Date().getFullYear()}-${String(Date.now() % 1000).padStart(3, '0')}`

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="audit-modal-backdrop" onClick={onClose}>
      <div className="audit-modal-wrapper" onClick={(e) => e.stopPropagation()}>

        {/* Barra de Control Superior (no se imprime) */}
        <div className="audit-modal-toolbar no-print">
          <div className="toolbar-info">
            <FileText size={18} className="text-blue" />
            <span>Vista Previa de Acta Oficial para Exportación a PDF</span>
          </div>
          <div className="toolbar-actions">
            <button type="button" className="btn-modal-print" onClick={handlePrint}>
              <Printer size={15} /> Imprimir / Guardar en PDF
            </button>
            <button type="button" className="btn-modal-close" onClick={onClose} title="Cerrar vista previa">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Hoja de Documento Oficial (Área Imprimible) */}
        <div className="audit-sheet" id="printable-audit-sheet">

          {/* Membrete Institucional Oficial */}
          <header className="audit-official-header">
            <div className="audit-header-top-row">
              <div className="audit-republic-badge">
                <strong>REPÚBLICA DE COSTA RICA</strong>
                <span>Régimen Municipal • Gobiernos Locales</span>
              </div>
              <div className="audit-folio-badge">
                <span className="folio-label">FOLIO DE AUDITORÍA:</span>
                <strong className="folio-number">{reportFolio}</strong>
              </div>
            </div>

            <div className="audit-header-main">
              <div className="audit-entity-box">
                <h2>{selectedEntity || 'Municipalidad de Cartago - Servicios Públicos'}</h2>
                <h3>SISTEMA INTEGRAL DE GESTIÓN Y FISCALIZACIÓN URBANA</h3>
                <span className="audit-project-sub">
                  Proyecto de Investigación y Vinculación Comunitaria • Colegio Universitario de Cartago (CUC TI-155)
                </span>
              </div>
            </div>

            <div className="audit-metadata-grid">
              <div className="meta-box">
                <span className="meta-label">Fecha de Expedición:</span>
                <strong>{today} a las {time}</strong>
              </div>
              <div className="meta-box">
                <span className="meta-label">Funcionario Emisor:</span>
                <strong>{official?.fullName || official?.name || 'Funcionario Municipal'}</strong>
              </div>
              <div className="meta-box">
                <span className="meta-label">Cargo / Dependencia:</span>
                <strong>{official?.role || 'Director de Operaciones'} • {official?.badgeNumber || official?.badge || 'MC-4921'}</strong>
              </div>
              <div className="meta-box">
                <span className="meta-label">Certificación JWT:</span>
                <strong className="jwt-certified">
                  <ShieldCheck size={12} className="inline-icon text-green" /> Firma Digital Activa
                </strong>
              </div>
            </div>
          </header>

          {/* Resumen Ejecutivo de Métricas de Campo */}
          <section className="audit-executive-summary">
            <h4 className="summary-title">I. RESUMEN EJECUTIVO DE RENDICIÓN DE CUENTAS</h4>
            <div className="audit-kpi-summary-grid">
              <div className="audit-kpi-box">
                <span className="kpi-num">{metrics?.total || incidents.length}</span>
                <span className="kpi-text">Total de Reportes</span>
              </div>
              <div className="audit-kpi-box success">
                <span className="kpi-num">{metrics?.resolved || incidents.filter(i => i.status === 'Resuelto').length}</span>
                <span className="kpi-text">Casos Solucionados</span>
              </div>
              <div className="audit-kpi-box warning">
                <span className="kpi-num">{metrics?.inProgress || incidents.filter(i => i.status === 'En atención' || i.status === 'En proceso').length}</span>
                <span className="kpi-text">Cuadrillas en Proceso</span>
              </div>
              <div className="audit-kpi-box alert">
                <span className="kpi-num">{metrics?.pending || incidents.filter(i => i.status === 'Pendiente').length}</span>
                <span className="kpi-text">Pendientes de Despacho</span>
              </div>
              <div className="audit-kpi-box highlight">
                <span className="kpi-num">{metrics?.resolutionRate || 0}%</span>
                <span className="kpi-text">Eficacia Cantonal</span>
              </div>
            </div>
          </section>

          {/* Tabla de Fiscalización y Bitácora Técnica */}
          <section className="audit-cases-section">
            <h4 className="summary-title">II. DETALLE TÉCNICO DE INCIDENCIAS FISCALIZADAS EN CAMPO</h4>
            <table className="audit-cases-table">
              <thead>
                <tr>
                  <th style={{ width: '12%' }}>Folio / Fecha</th>
                  <th style={{ width: '18%' }}>Incidencia / Tipo</th>
                  <th style={{ width: '25%' }}>Ubicación Georreferenciada</th>
                  <th style={{ width: '10%' }}>Prioridad</th>
                  <th style={{ width: '12%' }}>Estado</th>
                  <th style={{ width: '23%' }}>Dictamen y Bitácora de Cuadrilla</th>
                </tr>
              </thead>
              <tbody>
                {incidents.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '1.5rem' }}>
                      No se registraron incidencias en el período de auditoría evaluado.
                    </td>
                  </tr>
                ) : (
                  incidents.map((inc) => (
                    <tr key={inc.id}>
                      <td>
                        <strong>{inc.ticketCode || `#${inc.id}`}</strong>
                        <div className="audit-table-date">{inc.date}</div>
                      </td>
                      <td>
                        <div className="audit-incident-title">{inc.title}</div>
                        <span className="audit-cat-tag">{inc.category}</span>
                      </td>
                      <td>
                        <span className="audit-location-text">{inc.location}</span>
                      </td>
                      <td>
                        <span className={`audit-priority-tag priority-${(inc.priority || 'Media').toLowerCase()}`}>
                          {inc.priority || 'Media'}
                        </span>
                      </td>
                      <td>
                        <span className={`audit-status-tag status-${(inc.status || 'Pendiente').toLowerCase().replace(/\s+/g, '-')}`}>
                          {inc.status || 'Pendiente'}
                        </span>
                      </td>
                      <td>
                        <span className="audit-note-text">
                          {inc.institutionalNote || 'Cuadrilla municipal notificada. En espera de informe final de obras.'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>

          {/* Cláusula Legal y Certificación */}
          <section className="audit-legal-clause">
            <p>
              <strong>CERTIFICACIÓN INSTITUCIONAL:</strong> La presente acta da fe de las actuaciones operativas y técnicas
              registradas en la base de datos de <em>Barrio al Día</em> conforme a la Ley General de Control Interno (Ley N° 8292).
              Los datos aquí consignados corresponden a reportes geolocalizados y validados por vecinos y personal técnico cantonal.
            </p>
          </section>

          {/* Área de Firmas y Sellos Institucionales */}
          <footer className="audit-signatures-area">
            <div className="signature-box">
              <div className="signature-line"></div>
              <strong>{official?.fullName || official?.name || 'Ing. Carlos Méndez Solís'}</strong>
              <span>{official?.role || 'Director de Obras y Servicios Públicos'}</span>
              <span>{selectedEntity || 'Municipalidad de Cartago'}</span>
            </div>

            <div className="audit-stamp-box">
              <div className="stamp-circle">
                <ShieldCheck size={28} />
                <span>SELLO CUC</span>
                <small>TI-155 2026</small>
              </div>
            </div>

            <div className="signature-box">
              <div className="signature-line"></div>
              <strong>Lic. Fiscalizador Cantonal</strong>
              <span>Auditoría de Servicios Municipales</span>
              <span>Colegio Universitario de Cartago</span>
            </div>
          </footer>

        </div>
      </div>
    </div>
  )
}
