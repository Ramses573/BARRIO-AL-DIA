import React, { useState, useRef } from 'react'
import {
  User,
  Building2,
  Briefcase,
  Mail,
  Lock,
  BadgeCheck,
  Save,
  X,
  ShieldCheck,
  KeyRound,
  Camera,
  Phone,
  MapPin,
  Clock,
  FileText
} from 'lucide-react'
import { updateOfficialProfile, uploadAvatar, resolveAvatarUrl } from '../services/authService'
import { useToast } from './Toast'
import './ProfileModal.css'

export default function ProfileModal({ official, isOpen, onClose, onProfileUpdated }) {
  const { addToast } = useToast()
  const fileInputRef = useRef(null)

  const [fullName, setFullName] = useState(official?.fullName || '')
  const [role, setRole] = useState(official?.role || '')
  const [entity, setEntity] = useState(official?.entity || 'Municipalidad de Cartago')
  const [email, setEmail] = useState(official?.email || '')
  const [badgeNumber, setBadgeNumber] = useState(official?.badgeNumber || '')
  const [phoneNumber, setPhoneNumber] = useState(official?.phoneNumber || '')
  const [canton, setCanton] = useState(official?.canton || 'Cartago')
  const [district, setDistrict] = useState(official?.district || '')
  const [workSchedule, setWorkSchedule] = useState(official?.workSchedule || '')
  const [bio, setBio] = useState(official?.bio || '')
  const [avatarUrl, setAvatarUrl] = useState(official?.avatarUrl || '')
  const [avatarPreview, setAvatarPreview] = useState(resolveAvatarUrl(official?.avatarUrl || ''))
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Vista previa inmediata
    const localUrl = URL.createObjectURL(file)
    setAvatarPreview(localUrl)
    setUploadingPhoto(true)

    const uploaded = await uploadAvatar(file)
    setUploadingPhoto(false)

    if (uploaded?.avatarUrl) {
      setAvatarUrl(uploaded.avatarUrl)
      addToast('Foto de perfil subida correctamente.', 'success')
    } else {
      // Fallback DataURL para modo offline
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarUrl(reader.result)
      }
      reader.readAsDataURL(file)
      addToast('Foto cargada localmente.', 'info')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        id: official?.id,
        username: official?.username,
        fullName: fullName.trim(),
        role: role.trim(),
        entity,
        email: email.trim(),
        badgeNumber: badgeNumber.trim(),
        phoneNumber: phoneNumber.trim(),
        canton,
        district: district.trim(),
        workSchedule: workSchedule.trim(),
        bio: bio.trim(),
        avatarUrl: avatarUrl || official?.avatarUrl || '',
        userType: 'Official'
      }

      if (newPassword.trim()) {
        payload.password = newPassword.trim()
      }

      const res = await updateOfficialProfile(payload)
      setLoading(false)

      if (res.success) {
        addToast('¡Perfil y credenciales actualizadas correctamente!', 'success')
        if (onProfileUpdated) {
          onProfileUpdated(res.official)
        }
        onClose()
      } else {
        addToast(res.message || 'Error al actualizar el perfil.', 'error')
      }
    } catch {
      setLoading(false)
      addToast('Error al conectar con el servicio.', 'error')
    }
  }

  return (
    <div className="profile-modal-backdrop" onClick={onClose}>
      <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal-header">
          <div className="profile-header-title">
            <div className="profile-header-icon-box">
              <ShieldCheck size={22} className="text-blue" />
            </div>
            <div>
              <h3>Personalizar Perfil de Administrador</h3>
              <p className="profile-header-subtitle">
                Gestión de identidad y credenciales para @{official?.username}
              </p>
            </div>
          </div>
          <button type="button" className="btn-close-modal" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="profile-modal-form">
          {/* Foto de Perfil y Resumen */}
          <div className="profile-avatar-upload-row">
            <div
              className="profile-avatar-circle"
              onClick={() => fileInputRef.current?.click()}
              title="Cambiar foto de perfil"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Foto de perfil" className="profile-avatar-img" />
              ) : (
                <User size={28} className="text-blue" />
              )}
              <span className="profile-avatar-cam-badge">
                <Camera size={12} />
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden-file-input"
              onChange={handleAvatarChange}
            />
            <div className="profile-avatar-meta">
              <strong>{fullName || official?.username}</strong>
              <span>{uploadingPhoto ? 'Subiendo foto...' : 'Clic en el círculo para cambiar foto de perfil'}</span>
              <div className="profile-badge-summary">
                <BadgeCheck size={14} className="text-blue" />
                <span>Placa: <strong>{badgeNumber || 'MC-4921'}</strong></span>
              </div>
            </div>
          </div>

          <div className="profile-input-group">
            <label htmlFor="prof-fullname">
              <User size={14} className="inline-icon text-blue" /> Nombre y Apellidos
            </label>
            <input
              id="prof-fullname"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ej. Ing. Carlos Méndez Solís"
              required
            />
          </div>

          <div className="profile-form-row">
            <div className="profile-input-group">
              <label htmlFor="prof-entity">
                <Building2 size={14} className="inline-icon text-blue" /> Cantón / Entidad
              </label>
              <select
                id="prof-entity"
                value={entity}
                onChange={(e) => setEntity(e.target.value)}
                className="profile-select"
              >
                <option value="Municipalidad de Cartago">Municipalidad de Cartago</option>
                <option value="Municipalidad de Turrialba">Municipalidad de Turrialba</option>
                <option value="Municipalidad de Tarrazú">Municipalidad de Tarrazú</option>
                <option value="Fuerza Pública de Cartago">Fuerza Pública de Cartago</option>
              </select>
            </div>

            <div className="profile-input-group">
              <label htmlFor="prof-role">
                <Briefcase size={14} className="inline-icon text-blue" /> Cargo Institucional
              </label>
              <input
                id="prof-role"
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Ej. Director de Servicios Públicos"
                required
              />
            </div>
          </div>

          <div className="profile-form-row">
            <div className="profile-input-group">
              <label htmlFor="prof-email">
                <Mail size={14} className="inline-icon text-blue" /> Correo Institucional
              </label>
              <input
                id="prof-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@muni-cartago.go.cr"
                required
              />
            </div>

            <div className="profile-input-group">
              <label htmlFor="prof-badge">
                <BadgeCheck size={14} className="inline-icon text-blue" /> Placa / Folio
              </label>
              <input
                id="prof-badge"
                type="text"
                value={badgeNumber}
                onChange={(e) => setBadgeNumber(e.target.value)}
                placeholder="Ej. MC-4921"
              />
            </div>
          </div>

          <div className="profile-form-row">
            <div className="profile-input-group">
              <label htmlFor="prof-phone">
                <Phone size={14} className="inline-icon text-blue" /> Teléfono / WhatsApp
              </label>
              <input
                id="prof-phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Ej. 8888-1234"
              />
            </div>

            <div className="profile-input-group">
              <label htmlFor="prof-schedule">
                <Clock size={14} className="inline-icon text-blue" /> Turno / Horario
              </label>
              <input
                id="prof-schedule"
                type="text"
                value={workSchedule}
                onChange={(e) => setWorkSchedule(e.target.value)}
                placeholder="Ej. L-V 7:30 a.m. - 4:00 p.m."
              />
            </div>
          </div>

          <div className="profile-form-row">
            <div className="profile-input-group">
              <label htmlFor="prof-canton">
                <MapPin size={14} className="inline-icon text-blue" /> Cantón Asignado
              </label>
              <select
                id="prof-canton"
                value={canton}
                onChange={(e) => setCanton(e.target.value)}
                className="profile-select"
              >
                <option value="Cartago">Cartago</option>
                <option value="Turrialba">Turrialba</option>
                <option value="Tarrazú">Tarrazú</option>
              </select>
            </div>

            <div className="profile-input-group">
              <label htmlFor="prof-district">
                <MapPin size={14} className="inline-icon text-blue" /> Distrito / Sector
              </label>
              <input
                id="prof-district"
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="Ej. Oriental / El Carmen"
              />
            </div>
          </div>

          <div className="profile-input-group">
            <label htmlFor="prof-bio">
              <FileText size={14} className="inline-icon text-blue" /> Biografía / Especialidad Operativa
            </label>
            <input
              id="prof-bio"
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Ej. Coordinación de cuadrillas eléctricas y respuesta rápida"
            />
          </div>

          <div className="profile-password-section">
            <div className="profile-password-header">
              <KeyRound size={14} className="text-amber" />
              <span>Actualizar Contraseña de Seguridad (opcional)</span>
            </div>
            <div className="profile-input-group">
              <label htmlFor="prof-newpwd">
                <Lock size={14} className="inline-icon text-blue" /> Nueva Contraseña
              </label>
              <input
                id="prof-newpwd"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Dejar en blanco para conservar la actual"
              />
            </div>
          </div>

          <div className="profile-modal-actions">
            <button type="button" className="btn-profile-cancel" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-profile-save" disabled={loading}>
              {loading ? 'Guardando cambios...' : (
                <>
                  <Save size={15} /> Guardar Credenciales
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
