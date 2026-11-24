/**
 * Servicio de Chat de Ayuda y Mensajería con Notas de Audio
 * Soporta texto y notas de voz grabadas en navegador o móvil
 */

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL)
  ? import.meta.env.VITE_API_URL
  : 'http://localhost:5000/api'

const CHAT_STORAGE_PREFIX = 'barrio_chat_ticket_'

const INITIAL_DEMO_MESSAGES = {
  'TKT-CART-5821': [
    {
      id: 1,
      ticketCode: 'TKT-CART-5821',
      senderName: 'María Luisa Monge',
      senderRole: 'Ciudadano',
      messageType: 'Text',
      content: 'Buenas tardes, ¿saben si la cuadrilla vendrá hoy a revisar el poste sin luz?',
      sentAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      isRead: true
    },
    {
      id: 2,
      ticketCode: 'TKT-CART-5821',
      senderName: 'Ing. Carlos Méndez',
      senderRole: 'Cuadrilla Municipal',
      messageType: 'Text',
      content: 'Hola doña María Luisa. La cuadrilla de electrificación municipal está programada para las 4:30 PM en su sector.',
      sentAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
      isRead: true
    },
    {
      id: 3,
      ticketCode: 'TKT-CART-5821',
      senderName: 'Cuadrilla #2 Cartago',
      senderRole: 'Cuadrilla Municipal',
      messageType: 'Audio',
      content: 'data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcAA...',
      audioDurationSeconds: 8,
      sentAt: new Date(Date.now() - 1800000).toISOString(),
      isRead: true
    }
  ]
}

export const getMessagesByTicket = async (ticketCode) => {
  const code = (ticketCode || 'GENERAL').trim().toUpperCase()

  try {
    const res = await fetch(`${API_BASE}/chat/ticket/${encodeURIComponent(code)}?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) {
        if (data.length > 0 || !INITIAL_DEMO_MESSAGES[code]) {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(`${CHAT_STORAGE_PREFIX}${code}`, JSON.stringify(data))
          }
          return data
        }
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

  return INITIAL_DEMO_MESSAGES[code] || [
    {
      id: 1000,
      ticketCode: code,
      senderName: 'Sistema Municipal',
      senderRole: 'Soporte Municipal',
      messageType: 'Text',
      content: `Canal de asistencia activado para el ticket ${code}. Podés escribirnos o enviarnos una nota de voz si necesitás indicar referencias adicionales.`,
      sentAt: '2026-11-24T00:00:00.000Z',
      isRead: true
    }
  ]
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

  try {
    let res = await fetch(`${API_BASE}/chat/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (!res.ok) {
      await new Promise(r => setTimeout(r, 500))
      res = await fetch(`${API_BASE}/chat/send`, {
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

  // Guardar en caché local
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const current = await getMessagesByTicket(code)
      const updated = [...current, createdMessage]
      window.localStorage.setItem(`${CHAT_STORAGE_PREFIX}${code}`, JSON.stringify(updated))
    } catch {
      // Fallback
    }
  }

  return createdMessage
}
