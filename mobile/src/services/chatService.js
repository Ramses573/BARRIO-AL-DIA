import AsyncStorage from '@react-native-async-storage/async-storage'
import { apiGet, apiPost, getApiBase } from './api'

const CHAT_STORAGE_PREFIX = '@barrio_chat_ticket_'

export const resolveAudioUrl = async (content) => {
  if (!content || typeof content !== 'string') return ''
  if (
    content.startsWith('http://') ||
    content.startsWith('https://') ||
    content.startsWith('file://') ||
    content.startsWith('data:')
  ) {
    return content
  }
  if (content.startsWith('/')) {
    const base = await getApiBase()
    const origin = base.replace(/\/api\/?$/, '')
    return `${origin}${content}`
  }
  return content
}

export const uploadChatAudio = async (fileUri, ticketCode, durationSeconds) => {
  if (!fileUri) return null
  const code = (ticketCode || 'GENERAL').trim().toUpperCase()
  try {
    const base = await getApiBase()
    const formData = new FormData()
    formData.append('file', {
      uri: fileUri,
      name: `audio_${Date.now()}.m4a`,
      type: 'audio/mp4'
    })
    formData.append('ticketCode', code)
    formData.append('durationSeconds', String(durationSeconds || 1))

    const res = await fetch(`${base}/chat/upload-audio`, {
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
      content: '',
      audioDurationSeconds: 8,
      sentAt: new Date(Date.now() - 1800000).toISOString(),
      isRead: true
    }
  ]
}

export const getMessagesByTicket = async (ticketCode) => {
  const code = (ticketCode || 'GENERAL').trim().toUpperCase()

  // 1. Intentar backend .NET 9
  try {
    const apiMessages = await apiGet(`/chat/ticket/${encodeURIComponent(code)}`)
    if (Array.isArray(apiMessages)) {
      await AsyncStorage.setItem(`${CHAT_STORAGE_PREFIX}${code}`, JSON.stringify(apiMessages))
      return apiMessages
    }
  } catch {
    // Modo offline
  }

  // 2. Fallback local
  try {
    const stored = await AsyncStorage.getItem(`${CHAT_STORAGE_PREFIX}${code}`)
    if (stored) {
      return JSON.parse(stored)
    }
    return INITIAL_DEMO_MESSAGES[code] || [
      {
        id: 999,
        ticketCode: code,
        senderName: 'Asistencia Municipal',
        senderRole: 'Sistema',
        messageType: 'Text',
        content: `Canal de asistencia cantonal activado para el ticket ${code}. Puedes escribirnos o enviarnos una nota de voz.`,
        sentAt: '2026-11-24T00:00:00.000Z',
        isRead: true
      }
    ]
  } catch {
    return []
  }
}

export const sendChatMessage = async (msgData) => {
  const code = (msgData.ticketCode || 'GENERAL').trim().toUpperCase()

  const payload = {
    ticketCode: code,
    senderName: msgData.senderName || 'Vecino Comunitario',
    senderRole: msgData.senderRole || 'Ciudadano',
    messageType: msgData.messageType || 'Text',
    content: msgData.content || '',
    audioDurationSeconds: msgData.audioDurationSeconds || 0
  }

  let finalMsg = null

  // Intentar envío a backend .NET 9 con reintento rápido (300ms)
  try {
    let apiResult = await apiPost('/chat/send', payload)
    if (!apiResult) {
      await new Promise(r => setTimeout(r, 300))
      apiResult = await apiPost('/chat/send', payload)
    }
    if (apiResult && apiResult.id) {
      finalMsg = apiResult
    }
  } catch {
    // Modo offline
  }

  if (!finalMsg) {
    finalMsg = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      ...payload,
      audioUri: msgData.audioUri || null,
      sentAt: new Date().toISOString(),
      isRead: false
    }
  }

  try {
    const current = await getMessagesByTicket(code)
    if (!current.some(m => m.id === finalMsg.id)) {
      const updated = [...current, finalMsg]
      await AsyncStorage.setItem(`${CHAT_STORAGE_PREFIX}${code}`, JSON.stringify(updated))
    }
  } catch {
    // Fallback
  }

  return finalMsg
}
