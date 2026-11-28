import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Map, PlusCircle, ClipboardList, Bell, Building2, Palette, Lock, LogOut, UserCheck, Settings, Search, Newspaper, Menu, X } from 'lucide-react'
import { THEMES, getCurrentTheme, applyTheme } from '../services/themeService'
import { isAuthenticated, getCurrentOfficial, logout, resolveAvatarUrl } from '../services/authService'
import ProfileModal from './ProfileModal'
import './Navbar.css'

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [currentTheme, setCurrentTheme] = useState(getCurrentTheme())
  const isAuth = isAuthenticated()
  const [official, setOfficial] = useState(isAuth ? getCurrentOfficial() : null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMobileMenuOpen(false)
    if (isAuth) {
      setOfficial(getCurrentOfficial())
    }
  }, [isAuth, location.pathname])

  useEffect(() => {
    applyTheme(currentTheme)
  }, [currentTheme])

  const handleThemeChange = (e) => {
    const newTheme = e.target.value
    setCurrentTheme(newTheme)
    applyTheme(newTheme)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="global-navbar">
      <div className="navbar-inner">
        <div className="navbar-top-row">
          <Link to={isAuth ? "/" : "/map"} className="navbar-brand-link" onClick={() => setMobileMenuOpen(false)}>
            <div className="navbar-logo-icon">
              <svg viewBox="0 0 36 36" width="28" height="28" fill="none">
                <rect x="6" y="2" width="24" height="32" rx="4" fill="#0284c7" />
                <rect x="8" y="5" width="20" height="26" rx="2" fill="#dcfce7" />
                <circle cx="18" cy="18" r="6" fill="#dc2626" />
                <text x="18" y="22" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">!</text>
              </svg>
            </div>
            <div className="navbar-brand-text">
              <span className="brand-title">Barrio<span className="brand-highlight">AlDía</span></span>
              <span className="brand-sub">Reportá hoy, mejorá mañana</span>
            </div>
          </Link>

          <button
            type="button"
            className="navbar-mobile-toggle"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        <div className={`navbar-right-section ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          {isAuth ? (
            <>
              <ul className="navbar-nav-links">
                <li>
                  <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
                    Inicio
                  </Link>
                </li>
                <li>
                  <Link to="/map" className={location.pathname === '/map' ? 'active' : ''}>
                    <Map size={15} className="nav-icon" /> Mapa Real
                  </Link>
                </li>
                <li>
                  <Link to="/report" className={location.pathname === '/report' ? 'active' : ''}>
                    <PlusCircle size={15} className="nav-icon" /> Reportar
                  </Link>
                </li>
                <li>
                  <Link to="/incidents" className={location.pathname === '/incidents' ? 'active' : ''}>
                    <ClipboardList size={15} className="nav-icon" /> Incidentes
                  </Link>
                </li>
                <li>
                  <Link to="/notifications" className={location.pathname === '/notifications' ? 'active' : ''}>
                    <Bell size={15} className="nav-icon" /> Alertas
                  </Link>
                </li>
                <li>
                  <Link to="/noticias" className={location.pathname === '/noticias' ? 'active' : ''}>
                    <Newspaper size={15} className="nav-icon" /> Noticias
                  </Link>
                </li>
                <li>
                  <Link to="/admin" className={location.pathname === '/admin' ? 'active' : ''}>
                    <Building2 size={15} className="nav-icon" /> Gestión Municipal
                  </Link>
                </li>
              </ul>

              <button
                type="button"
                className="navbar-official-chip"
                onClick={() => setShowProfileModal(true)}
                title={`Funcionario activo: ${official?.fullName || official?.username} - Clic para personalizar perfil`}
              >
                {official?.avatarUrl ? (
                  <img
                    src={resolveAvatarUrl(official.avatarUrl)}
                    alt={official.fullName || official.username}
                    style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <UserCheck size={14} className="text-green" />
                )}
                <span className="official-name-abbr">{official?.fullName?.split(' ')[0] || official?.username}</span>
                <Settings size={12} className="official-gear-icon" />
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="btn-navbar-logout"
                title="Cerrar sesión institucional y bloquear acceso"
              >
                <LogOut size={13} className="nav-icon" /> Salir
              </button>

              <ProfileModal
                official={official}
                isOpen={showProfileModal}
                onClose={() => setShowProfileModal(false)}
                onProfileUpdated={(updated) => setOfficial(updated)}
              />
            </>
          ) : (
            <>
              <ul className="navbar-nav-links">
                <li>
                  <Link to="/map" className={location.pathname === '/map' ? 'active' : ''}>
                    <Map size={15} className="nav-icon" /> Mapa Real
                  </Link>
                </li>
                <li>
                  <Link to="/report" className={location.pathname === '/report' ? 'active' : ''}>
                    <PlusCircle size={15} className="nav-icon" /> Reportar
                  </Link>
                </li>
                <li>
                  <Link to="/incidents" className={location.pathname.startsWith('/incidents') ? 'active' : ''}>
                    <ClipboardList size={15} className="nav-icon" /> Incidentes
                  </Link>
                </li>
                <li>
                  <Link to="/track" className={location.pathname.startsWith('/track') ? 'active' : ''}>
                    <Search size={15} className="nav-icon" /> Consultar Ticket
                  </Link>
                </li>
                <li>
                  <Link to="/noticias" className={location.pathname === '/noticias' ? 'active' : ''}>
                    <Newspaper size={15} className="nav-icon" /> Noticias
                  </Link>
                </li>
              </ul>

              <Link to="/login" className="navbar-locked-pill" title="Ingreso exclusivo para funcionarios municipales">
                <Lock size={13} className="text-amber" />
                <span>Portal Municipal</span>
              </Link>
            </>
          )}

          {/* Theme Selector (theme-factory) */}
          <div className="navbar-theme-control">
            <Palette size={15} className="theme-switcher-icon" />
            <select
              id="theme-switcher-select"
              value={currentTheme}
              onChange={handleThemeChange}
              className="navbar-theme-select"
              title="Seleccionar tema visual del sistema"
            >
              {THEMES.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </nav>
  )
}
