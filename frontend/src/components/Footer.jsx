import React from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  ShieldCheck,
  PhoneCall,
  MapPin,
  ExternalLink,
  Heart,
  Radio,
  FileCheck2,
  Lock
} from 'lucide-react'
import './Footer.css'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="main-footer">
      <div className="footer-top-accent"></div>

      <div className="footer-container">
        {/* Columna 1: Identidad Institucional */}
        <div className="footer-col footer-col-brand">
          <div className="footer-brand">
            <div className="footer-logo-badge">
              <Building2 size={20} className="footer-logo-icon" />
            </div>
            <div className="footer-brand-text">
              <h3>Barrio al Día</h3>
              <span className="footer-brand-sub">Sistema Cantonal de Fiscalización Urbana</span>
            </div>
          </div>
          <p className="footer-description">
            Plataforma oficial para la detección, despacho municipal y resolución técnica de incidencias en Cartago, Turrialba y Tarrazú.
          </p>

          <div className="footer-system-status">
            <span className="status-ping-dot"></span>
            <span className="status-ping-text">Servidor API .NET 9 & LocalDB Operativos</span>
          </div>
        </div>

        {/* Columna 2: Cantones Integrados */}
        <div className="footer-col">
          <h4 className="footer-col-title">
            <MapPin size={15} className="inline-icon text-blue" /> Red Cantonal
          </h4>
          <ul className="footer-links-list">
            <li>
              <strong>Municipalidad de Cartago</strong>
              <small>Dirección de Servicios Públicos y Viales</small>
            </li>
            <li>
              <strong>Municipalidad de Turrialba</strong>
              <small>Coordinación de Obras Comunales</small>
            </li>
            <li>
              <strong>Municipalidad de Tarrazú</strong>
              <small>Gestión de Infraestructura y Enlaces</small>
            </li>
          </ul>
        </div>

        {/* Columna 3: Enlaces de Acceso y Navegación */}
        <div className="footer-col">
          <h4 className="footer-col-title">
            <ExternalLink size={15} className="inline-icon text-blue" /> Navegación Rápida
          </h4>
          <ul className="footer-nav-links">
            <li><Link to="/">Inicio y Estadísticas</Link></li>
            <li><Link to="/map">Mapa Cantonal en Tiempo Real</Link></li>
            <li><Link to="/noticias">Boletín de Noticias Cantonales</Link></li>
            <li><Link to="/report">Portal de Reporte Ciudadano</Link></li>
            <li><Link to="/track">Seguimiento de Ticket por Código</Link></li>
            <li><Link to="/incidents">Listado de Incidencias Públicas</Link></li>
            <li><Link to="/admin">Consola de Gestión Municipal</Link></li>
          </ul>
        </div>

        {/* Columna 4: Números de Emergencia y Soporte */}
        <div className="footer-col">
          <h4 className="footer-col-title">
            <PhoneCall size={15} className="inline-icon text-blue" /> Enlaces de Emergencia
          </h4>
          <div className="footer-emergency-badges">
            <div className="emergency-item">
              <span className="emergency-num">9-1-1</span>
              <span className="emergency-label">Emergencias Nacionales</span>
            </div>
            <div className="emergency-item">
              <span className="emergency-num">1118</span>
              <span className="emergency-label">Cuerpo de Bomberos CR</span>
            </div>
            <div className="emergency-item">
              <span className="emergency-num">1128</span>
              <span className="emergency-label">Cruz Roja Costarricense</span>
            </div>
          </div>
          <div className="footer-security-note">
            <Lock size={12} className="inline-icon" /> Acceso institucional protegido por JWT
          </div>
        </div>
      </div>

      {/* Franja Inferior Legal y Académica */}
      <div className="footer-bottom">
        <div className="footer-bottom-container">
          <div className="footer-academic-badge">
            <FileCheck2 size={14} className="inline-icon text-amber" />
            <span>Validación Metodológica CUC TI-155 • Colegio Universitario de Cartago</span>
          </div>

          <p className="footer-copyright">
            &copy; {currentYear} <strong>Barrio al Día</strong>. Desarrollado con dedicación comunal en Costa Rica.
          </p>

          <div className="footer-legal-links">
            <span>Privacidad y Protección de Datos</span>
            <span>•</span>
            <span>Términos Institucionales</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
