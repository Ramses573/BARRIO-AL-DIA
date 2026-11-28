/**
 * Servicio de Chat de Ayuda y Mensajería con Notas de Audio
 * Soporta texto y notas de voz grabadas en navegador o móvil
 */

import { getAuthHeaders } from './authService'

export const getApiBase = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  if (typeof window !== 'undefined' && (window.location?.protocol === 'https:' || window.location?.port === '3000')) {
    return '/api'
  }
  if (typeof window !== 'undefined' && window.location && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `http://${window.location.hostname}:5000/api`
  }
  return 'http://localhost:5000/api'
}

const CHAT_STORAGE_PREFIX = 'barrio_chat_v4_ticket_'

const INITIAL_DEMO_MESSAGES = {}

const cleanLegacyChatStorage = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      Object.keys(window.localStorage).forEach(k => {
        if (k.startsWith('barrio_chat_ticket_')) {
          window.localStorage.removeItem(k)
        }
      })
    } catch {
      // Ignorar
    }
  }
}

export const getMessagesByTicket = async (ticketCode) => {
  cleanLegacyChatStorage()
  const code = (ticketCode || 'GENERAL').trim().toUpperCase()
  const apiBase = getApiBase()

  try {
    const res = await fetch(`${apiBase}/chat/ticket/${encodeURIComponent(code)}?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(`${CHAT_STORAGE_PREFIX}${code}`, JSON.stringify(data))
        }
        return data
      }
    }
  } catch {
    // Modo offline
  }

  // Fallback local
  if (typeof window !== 'undefined' && window.localStorage) {
    const stored = window.localStorage.getItem(`${CHAT_STORAGE_PREFIX}${code}`)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        // Fallback
      }
    }
  }

  return INITIAL_DEMO_MESSAGES[code] || []
}

export const wipeChats = async () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    Object.keys(window.localStorage).forEach(k => {
      if (k.startsWith('barrio_chat_')) {
        window.localStorage.removeItem(k)
      }
    })
  }
  try {
    const res = await fetch(`${getApiBase()}/chat/wipe`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
    if (res.ok) return await res.json()
  } catch {
    // Fallback offline
  }
  return { message: 'Barrido de chats completado' }
}

export const getApiOrigin = () => {
  const base = getApiBase()
  return base.replace(/\/api\/?$/, '')
}

export const resolveAudioUrl = (content) => {
  if (!content || typeof content !== 'string') return ''
  if (content.startsWith('http://') || content.startsWith('https://') || content.startsWith('data:') || content.startsWith('blob:')) {
    return content
  }
  if (content.startsWith('/')) {
    return `${getApiOrigin()}${content}`
  }
  return content
}

export const uploadChatAudio = async (audioBlob, ticketCode, durationSeconds, fileName = 'audio.mp4') => {
  const code = (ticketCode || 'GENERAL').trim().toUpperCase()
  const apiBase = getApiBase()

  try {
    const formData = new FormData()
    formData.append('file', audioBlob, fileName)
    formData.append('ticketCode', code)
    formData.append('durationSeconds', String(durationSeconds || 3))

    const res = await fetch(`${apiBase}/chat/upload-audio`, {
      method: 'POST',
      body: formData
    })

    if (res.ok) {
      return await res.json()
    }
  } catch {
    // Fallback offline
  }

  return null
}

export const sendChatMessage = async ({ ticketCode, senderName, senderRole, messageType, content, audioDurationSeconds }) => {
  const code = (ticketCode || 'GENERAL').trim().toUpperCase()
  const payload = {
    ticketCode: code,
    senderName: senderName || 'Vecino Comunitario',
    senderRole: senderRole || 'Ciudadano',
    messageType: messageType || 'Text',
    content,
    audioDurationSeconds: audioDurationSeconds || null
  }

  let createdMessage = null
  const apiBase = getApiBase()

  try {
    let res = await fetch(`${apiBase}/chat/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (!res.ok) {
      await new Promise(r => setTimeout(r, 400))
      res = await fetch(`${apiBase}/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    }
    if (res.ok) {
      createdMessage = await res.json()
    }
  } catch {
    // Si falla el reintento queda offline
  }

  if (!createdMessage) {
    createdMessage = {
      id: Date.now(),
      ...payload,
      sentAt: new Date().toISOString(),
      isRead: false
    }
  }

  // Guardar en caché local sin duplicar
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = window.localStorage.getItem(`${CHAT_STORAGE_PREFIX}${code}`)
      let list = stored ? JSON.parse(stored) : []
      if (!Array.isArray(list)) list = []
      if (!list.some(m => m.id === createdMessage.id)) {
        list.push(createdMessage)
        window.localStorage.setItem(`${CHAT_STORAGE_PREFIX}${code}`, JSON.stringify(list))
      }
    } catch {
      // Fallback
    }
  }

  return createdMessage
}
