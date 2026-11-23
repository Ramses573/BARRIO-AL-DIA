import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Building2,
  Lock,
  User,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Sparkles,
  UserPlus,
  Mail,
  Briefcase
} from 'lucide-react'
import { login, register, isAuthenticated, DEFAULT_OFFICIALS } from '../services/authService'
import { useToast } from '../components/Toast'
import './Login.css'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { addToast } = useToast()

  const [activeTab, setActiveTab] = useState('login') // 'login' | 'register'

  // Login form state
  const [username, setUsername] = useState('carlos.mendez')
  const [password, setPassword] = useState('Admin1234!')

  // Register form state
  const [regFullName, setRegFullName] = useState('')
  const [regUsername, setRegUsername] = useState('')
  const [regRole, setRegRole] = useState('Administrador Municipal')
  const [regEntity, setRegEntity] = useState('Municipalidad de Cartago')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Si ya está autenticado, redirigir automáticamente
  useEffect(() => {
    if (isAuthenticated()) {
      const destination = location.state?.from?.pathname || '/'
      navigate(destination, { replace: true })
    }
  }, [navigate, location])

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    try {
      const result = await login(username, password)
      setLoading(false)

      if (result.success) {
        addToast(`¡Bienvenido, ${result.official.fullName}! Sesión autorizada.`, 'success')
        const destination = location.state?.from?.pathname || '/'
        navigate(destination, { replace: true })
      } else {
        setErrorMsg(result.message || 'Credenciales institucionales incorrectas.')
        addToast('No se pudo iniciar sesión. Verifica tus credenciales.', 'error')
      }
    } catch {
      setLoading(false)
      setErrorMsg('Error al conectar con el servidor de autenticación.')
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!regUsername || !regPassword || !regFullName) {
      setErrorMsg('Por favor completa los campos obligatorios.')
      return
    }

    setLoading(true)

    try {
      const result = await register({
        username: regUsername.trim(),
        password: regPassword,
        fullName: regFullName.trim(),
        role: regRole.trim(),
        entity: regEntity,
        email: regEmail.trim()
      })
      setLoading(false)

      if (result.success) {
        addToast(`¡Administrador ${result.official.fullName} creado con éxito!`, 'success')
        const destination = location.state?.from?.pathname || '/'
        navigate(destination, { replace: true })
      } else {
        setErrorMsg(result.message || 'No se pudo registrar el administrador.')
        addToast('Error al registrar administrador.', 'error')
      }
    } catch {
      setLoading(false)
      setErrorMsg('Error al conectar con el servidor.')
    }
  }

  const handlePreFill = (official) => {
    setUsername(official.username)
    setPassword('Admin1234!')
    setErrorMsg('')
    addToast(`Credenciales cargadas para ${official.fullName || official.name}`, 'info')
  }

  return (
    <div className="login-page-wrapper">
      <div className="login-card-container">
        {/* Cabecera del Portal Institucional */}
        <div className="login-header">
          <div className="login-badge">
            <ShieldCheck size={13} className="inline-icon" /> SISTEMA PROTEGIDO CON ACCESO EXCLUSIVO
          </div>
          <h2>Barrio al Día</h2>
          <p className="login-subtitle">
            Para acceder a las funciones del aplicativo debe iniciar sesión con una cuenta de administrador municipal.
          </p>
        </div>

        {/* Selector de Pestañas: Ingreso vs Registro */}
        <div className="login-tabs">
          <button
            type="button"
            className={`login-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => { setActiveTab('login'); setErrorMsg('') }}
          >
            <KeyRound size={15} /> Iniciar Sesión
          </button>
          <button
            type="button"
            className={`login-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => { setActiveTab('register'); setErrorMsg('') }}
          >
            <UserPlus size={15} /> Crear Administrador
          </button>
        </div>

        {errorMsg && (
          <div className="login-error-banner">
            <AlertCircle size={16} className="inline-icon" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modo Login */}
        {activeTab === 'login' && (
          <>
            <form onSubmit={handleLoginSubmit} className="login-form">
              <div className="login-input-group">
                <label htmlFor="username">
                  <User size={14} className="inline-icon text-blue" /> Usuario o Correo Municipal
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ej. carlos.mendez o correo institucional"
                  required
                  autoFocus
                />
              </div>

              <div className="login-input-group">
                <label htmlFor="password">
                  <Lock size={14} className="inline-icon text-blue" /> Contraseña de Seguridad
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                />
              </div>

              <button type="submit" className="btn-login-submit" disabled={loading}>
                {loading ? (
                  'Verificando credenciales...'
                ) : (
                  <>
                    <KeyRound size={16} className="inline-icon" /> Ingresar al Sistema <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            {/* Cuentas de Demostración Certificadas */}
            <div className="login-demo-accounts">
              <div className="demo-accounts-title">
                <Sparkles size={14} className="inline-icon text-amber" />
                <span>Cuentas de demostración (Haz clic para auto-llenar):</span>
              </div>

              <div className="demo-buttons-grid">
                {DEFAULT_OFFICIALS.map((off) => (
                  <button
                    key={off.id}
                    type="button"
                    className="btn-demo-account"
                    onClick={() => handlePreFill(off)}
                  >
                    <Building2 size={14} className="text-blue" />
                    <div className="demo-btn-text">
                      <strong>{off.entity}</strong>
                      <small>{off.fullName} ({off.username})</small>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Modo Registro de Administrador */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="login-form">
            <div className="login-input-group">
              <label htmlFor="reg-fullname">
                <User size={14} className="inline-icon text-blue" /> Nombre y Apellidos Completos *
              </label>
              <input
                id="reg-fullname"
                type="text"
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                placeholder="Ej. Ing. Mario Gómez Rivera"
                required
                autoFocus
              />
            </div>

            <div className="login-form-row">
              <div className="login-input-group">
                <label htmlFor="reg-username">
                  <User size={14} className="inline-icon text-blue" /> Usuario *
                </label>
                <input
                  id="reg-username"
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="mario.gomez"
                  required
                />
              </div>

              <div className="login-input-group">
                <label htmlFor="reg-entity">
                  <Building2 size={14} className="inline-icon text-blue" /> Cantón / Entidad *
                </label>
                <select
                  id="reg-entity"
                  value={regEntity}
                  onChange={(e) => setRegEntity(e.target.value)}
                  className="login-select"
                >
                  <option value="Municipalidad de Cartago">Municipalidad de Cartago</option>
                  <option value="Municipalidad de Turrialba">Municipalidad de Turrialba</option>
                  <option value="Municipalidad de Tarrazú">Municipalidad de Tarrazú</option>
                </select>
              </div>
            </div>

            <div className="login-input-group">
              <label htmlFor="reg-role">
                <Briefcase size={14} className="inline-icon text-blue" /> Cargo o Rol *
              </label>
              <input
                id="reg-role"
                type="text"
                value={regRole}
                onChange={(e) => setRegRole(e.target.value)}
                placeholder="Ej. Inspector Cantonal / Administrador de Operaciones"
                required
              />
            </div>

            <div className="login-input-group">
              <label htmlFor="reg-email">
                <Mail size={14} className="inline-icon text-blue" /> Correo Institucional
              </label>
              <input
                id="reg-email"
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="mario.gomez@muni-cartago.go.cr"
              />
            </div>

            <div className="login-input-group">
              <label htmlFor="reg-password">
                <Lock size={14} className="inline-icon text-blue" /> Contraseña *
              </label>
              <input
                id="reg-password"
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>

            <button type="submit" className="btn-login-submit" disabled={loading}>
              {loading ? (
                'Registrando administrador...'
              ) : (
                <>
                  <UserPlus size={16} className="inline-icon" /> Registrar Administrador y Entrar <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Pie informativo */}
        <div className="login-footer">
          <span className="login-security-tag">
            <Lock size={11} className="inline-icon" /> Token JWT cifrado conforme al estándar de seguridad CUC TI-155.
          </span>
        </div>
      </div>
    </div>
  )
}
