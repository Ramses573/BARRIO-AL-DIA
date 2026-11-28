import React, { useState, useEffect, useRef } from 'react'
import * as signalR from '@microsoft/signalr'
import {
  MessageSquare,
  Send,
  Mic,
  Square,
  Play,
  Pause,
  X,
  Volume2,
  ShieldCheck,
  User,
  Wrench,
  Radio,
  Layers,
  ChevronDown
} from 'lucide-react'
import { getMessagesByTicket, sendChatMessage, uploadChatAudio, resolveAudioUrl } from '../services/chatService'
import { isAuthenticated, getCurrentOfficial } from '../services/authService'
import { getAllTrackableTickets, fetchIncidentsFromApi } from '../services/incidentService'
import { useToast } from './Toast'
import './CommunityChatWidget.css'

export default function CommunityChatWidget({ defaultTicketCode = 'GENERAL' }) {
  const { addToast } = useToast()
  const isAuth = isAuthenticated()
  const currentOfficial = isAuth ? getCurrentOfficial() : null

  const [isOpen, setIsOpen] = useState(false)
  const [ticketCode, setTicketCode] = useState(defaultTicketCode)
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [allTickets, setAllTickets] = useState([])
  const senderRole = isAuth ? 'Cuadrilla Municipal' : 'Ciudadano'
  const senderName = isAuth ? (currentOfficial?.fullName || 'Funcionario') : 'Ramsés Solano Calvo'

  // Estados de grabación de audio
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const timerRef = useRef(null)
  const recordingStartRef = useRef(0)
  const isCancelledRef = useRef(false)

  // Convertir audio webm/ogg a WAV PCM 16-bit para compatibilidad total en Android/iOS/Web
  const convertBlobToWav = async (blob) => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return null
    const ctx = new AudioCtx()
    try {
      const arrayBuffer = await blob.arrayBuffer()
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
      const numChannels = 1
      const sampleRate = audioBuffer.sampleRate
      const samples = audioBuffer.getChannelData(0)
      const buffer = new ArrayBuffer(44 + samples.length * 2)
      const view = new DataView(buffer)

      const writeStr = (offset, str) => {
        for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
      }

      writeStr(0, 'RIFF')
      view.setUint32(4, 36 + samples.length * 2, true)
      writeStr(8, 'WAVE')
      writeStr(12, 'fmt ')
      view.setUint32(16, 16, true)
      view.setUint16(20, 1, true)
      view.setUint16(22, numChannels, true)
      view.setUint32(24, sampleRate, true)
      view.setUint32(28, sampleRate * numChannels * 2, true)
      view.setUint16(32, numChannels * 2, true)
      view.setUint16(34, 16, true)
      writeStr(36, 'data')
      view.setUint32(40, samples.length * 2, true)

      let offset = 44
      for (let i = 0; i < samples.length; i++) {
        const s = Math.max(-1, Math.min(1, samples[i]))
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
        offset += 2
      }

      return new Blob([view], { type: 'audio/wav' })
    } catch {
      return null
    } finally {
      ctx.close().catch(() => {})
    }
  }

  // Reproducción de audios
  const [playingId, setPlayingId] = useState(null)
  const [playProgress, setPlayProgress] = useState(0)
  const [playCurrentSec, setPlayCurrentSec] = useState(0)
  const audioPlayerRef = useRef(new Audio())

  const messagesEndRef = useRef(null)

  useEffect(() => {
    // Cargar tickets para el combo box
    const initial = getAllTrackableTickets()
    setAllTickets(initial)
    fetchIncidentsFromApi().then(apiList => {
      if (Array.isArray(apiList) && apiList.length) {
        setAllTickets(getAllTrackableTickets())
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    let isSubscribed = true

    const syncMessages = async () => {
      try {
        const fresh = await getMessagesByTicket(ticketCode)
        if (isSubscribed && Array.isArray(fresh)) {
          setMessages(prev => {
            const prevSig = prev.map(m => `${m.id}-${m.sentAt}`).join('|')
            const freshSig = fresh.map(m => `${m.id}-${m.sentAt}`).join('|')
            if (prevSig !== freshSig) {
              return fresh
            }
            return prev
          })
        }
      } catch {
        // Silencioso
      }
    }

    // Cargar inmediatamente y mantener sincronización activa cada 800ms
    syncMessages()
    const interval = setInterval(syncMessages, 800)

    // Conexión SignalR instantánea
    let connection = null
    try {
      const envApi = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL
      const hubUrl = envApi
        ? `${envApi.replace(/\/api\/?$/, '')}/chatHub`
        : (typeof window !== 'undefined' && (window.location?.protocol === 'https:' || window.location?.port === '3000'))
          ? '/chatHub'
          : (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
            ? `http://${window.location.hostname}:5000/chatHub`
            : 'http://localhost:5000/chatHub'

      connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl)
        .withAutomaticReconnect([0, 1000, 2000, 5000])
        .build()

      connection.on('ReceiveMessage', (msg) => {
        if (!isSubscribed || !msg) return
        const cleanMsgCode = (msg.ticketCode || '').replace(/^#/, '').trim().toUpperCase()
        const cleanCurrentCode = (ticketCode || '').replace(/^#/, '').trim().toUpperCase()

        if (cleanMsgCode === cleanCurrentCode) {
          setMessages(prev => {
            if (!prev.some(m => m.id === msg.id)) {
              return [...prev, msg]
            }
            return prev
          })
        }
      })

      connection.start().catch(() => {})
    } catch {
      // Polling activo como respaldo
    }

    return () => {
      isSubscribed = false
      clearInterval(interval)
      if (connection) {
        connection.stop()
      }
    }
  }, [ticketCode])

  const handleCloseChat = () => {
    try {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause()
      }
    } catch {
      // Ignorar
    }
    setPlayingId(null)
    setPlayProgress(0)
    setPlayCurrentSec(0)
    if (isRecording) {
      cancelRecording()
    }
    setIsOpen(false)
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isOpen) {
      const fetchOnOpen = async () => {
        try {
          const fresh = await getMessagesByTicket(ticketCode)
          if (Array.isArray(fresh)) {
            setMessages(fresh)
          }
        } catch {
          // Fallback
        }
      }
      fetchOnOpen()
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 60)
    }
  }, [isOpen, ticketCode])

  // Envío de mensaje de texto
  const handleSendText = async (e) => {
    e.preventDefault()
    if (!inputText.trim()) return

    const textToSend = inputText.trim()
    setInputText('')

    const sent = await sendChatMessage({
      ticketCode,
      senderName,
      senderRole,
      messageType: 'Text',
      content: textToSend
    })

    if (sent) {
      setMessages(prev => {
        if (!prev.some(m => m.id === sent.id)) {
          return [...prev, sent]
        }
        return prev
      })
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }

  // Iniciar grabación de audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const supportsMp4 = typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported('audio/mp4')
      const options = supportsMp4 ? { mimeType: 'audio/mp4' } : undefined
      mediaRecorderRef.current = options ? new MediaRecorder(stream, options) : new MediaRecorder(stream)
      audioChunksRef.current = []
      isCancelledRef.current = false
      recordingStartRef.current = Date.now()

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      mediaRecorderRef.current.onstop = async () => {
        stream.getTracks().forEach(track => track.stop())
        if (isCancelledRef.current || !audioChunksRef.current.length) return

        const duration = Math.max(1, Math.round((Date.now() - recordingStartRef.current) / 1000))
        const rawMime = mediaRecorderRef.current?.mimeType || (supportsMp4 ? 'audio/mp4' : 'audio/webm')
        let finalBlob = new Blob(audioChunksRef.current, { type: rawMime })
        let fileName = rawMime.includes('mp4') ? 'audio.mp4' : 'audio.webm'

        // Si el navegador grabó en webm/ogg, convertir a WAV compatible con Android/iOS
        if (!rawMime.includes('mp4')) {
          const wavBlob = await convertBlobToWav(finalBlob)
          if (wavBlob) {
            finalBlob = wavBlob
            fileName = 'audio.wav'
          }
        }

        // Subir archivo al servidor para que sea accesible desde Web y Móvil
        const uploaded = await uploadChatAudio(finalBlob, ticketCode, duration, fileName)
        let audioContent = uploaded?.audioUrl

        if (!audioContent) {
          audioContent = await new Promise((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result)
            reader.readAsDataURL(finalBlob)
          })
        }

        const sent = await sendChatMessage({
          ticketCode,
          senderName,
          senderRole,
          messageType: 'Audio',
          content: audioContent,
          audioDurationSeconds: duration
        })

        if (sent) {
          setMessages(prev => {
            if (!prev.some(m => m.id === sent.id)) {
              return [...prev, sent]
            }
            return prev
          })
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
        }
        addToast('Nota de voz enviada correctamente', 'success')
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordingSeconds(0)

      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1)
      }, 1000)

    } catch {
      addToast('No se pudo acceder al micrófono para grabar audio.', 'error')
    }
  }

  // Detener y enviar grabación
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      clearInterval(timerRef.current)
    }
  }

  // Cancelar grabación
  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      isCancelledRef.current = true
      audioChunksRef.current = []
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      clearInterval(timerRef.current)
      addToast('Grabación de audio cancelada', 'info')
    }
  }

  // Reproducir nota de voz
  const handlePlayAudio = async (msg) => {
    if (playingId === msg.id) {
      audioPlayerRef.current.pause()
      setPlayingId(null)
      setPlayProgress(0)
      setPlayCurrentSec(0)
      return
    }

    if (msg.content && msg.content.startsWith('file://')) {
      addToast('Audio antiguo guardado solo en el teléfono de origen.', 'info')
      return
    }

    const src = resolveAudioUrl(msg.content)
    if (!src) {
      addToast('No hay audio disponible para reproducir.', 'info')
      return
    }

    audioPlayerRef.current.pause()
    setPlayProgress(0)
    setPlayCurrentSec(0)
    audioPlayerRef.current.src = src
    audioPlayerRef.current.load()

    audioPlayerRef.current.ontimeupdate = () => {
      const dur = audioPlayerRef.current.duration
      const cur = audioPlayerRef.current.currentTime
      const total = (dur && isFinite(dur) && dur > 0) ? dur : (msg.audioDurationSeconds || 1)
      setPlayProgress(Math.min(100, Math.round((cur / total) * 100)))
      setPlayCurrentSec(Math.floor(cur))
    }

    audioPlayerRef.current.onended = () => {
      setPlayingId(null)
      setPlayProgress(0)
      setPlayCurrentSec(0)
    }
    audioPlayerRef.current.onerror = () => {
      addToast('No se pudo reproducir la nota de voz.', 'info')
      setPlayingId(null)
      setPlayProgress(0)
      setPlayCurrentSec(0)
    }

    try {
      await audioPlayerRef.current.play()
      setPlayingId(msg.id)
    } catch {
      addToast('No se pudo reproducir la nota de voz.', 'info')
      setPlayingId(null)
      setPlayProgress(0)
      setPlayCurrentSec(0)
    }
  }

  return (
    <div className="community-chat-widget">
      {/* Botón Flotante */}
      {!isOpen && (
        <button
          type="button"
          className="btn-chat-floating"
          onClick={() => setIsOpen(true)}
          title="Abrir chat de asistencia y cuadrillas municipales"
        >
          <MessageSquare size={20} />
          <span className="chat-floating-label">Chat de Ayuda</span>
          <span className="chat-online-badge"></span>
        </button>
      )}

      {/* Ventana de Chat */}
      {isOpen && (
        <div className="chat-window-card">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-title">
              <div className="chat-avatar-icon">
                <Radio size={16} className="text-blue" />
              </div>
              <div>
                <strong>Asistencia y Cuadrillas en Vivo</strong>
                <span className="chat-channel-sub">
                  Canal: <code>{ticketCode}</code>
                </span>
              </div>
            </div>
            <button
              type="button"
              className="btn-close-chat"
              onClick={handleCloseChat}
            >
              <X size={16} />
            </button>
          </div>

          {/* ComboBox Selector de Canales y Tickets (Sin entradas manuales) */}
          <div className="chat-combobox-bar">
            <div className="chat-combobox-inner">
              <Radio size={14} className="text-blue flex-shrink-0" />
              <select
                id="chat-channel-combobox"
                className="chat-combobox-select"
                value={ticketCode}
                onChange={(e) => setTicketCode(e.target.value)}
              >
                <optgroup label="📡 Canales de Comunicación Directa">
                  <option value="GENERAL">📢 Canal General de la Comunidad</option>
                  <option value="EMERGENCIA-CARTAGO">🚨 Mesa de Emergencias Cartago</option>
                  <option value="EMERGENCIA-TURRIALBA">🚨 Coordinación Operativa Turrialba</option>
                  <option value="EMERGENCIA-TARRAZU">🚨 Brigada Cantonal Tarrazú</option>
                </optgroup>
                <optgroup label="🎫 Tickets de Incidentes Comunitarios">
                  {allTickets.map((t, idx) => {
                    const code = t.ticketCode || `#${t.id || idx}`
                    const rep = t.isAnonymous ? 'Anónimo' : (t.reporterName || 'Ramsés Solano')
                    return (
                      <option key={`chat-opt-${code}-${t.id || idx}`} value={code}>
                        {code} — {t.title} [{rep}]
                      </option>
                    )
                  })}
                </optgroup>
              </select>
            </div>
          </div>

          {/* Historial de Mensajes */}
          <div className="chat-messages-container">
            {messages.map((msg, idx) => {
              const isMine = (msg.senderRole === 'Ciudadano' && !isAuth) || (msg.senderRole !== 'Ciudadano' && isAuth)
              return (
                <div
                  key={`msg-${msg.id || 'm'}-${msg.sentAt || ''}-${idx}`}
                  className={`chat-bubble-wrapper ${isMine ? 'mine' : 'theirs'}`}
                >
                  <div className="chat-bubble-meta">
                    <span className="bubble-sender">{msg.senderName}</span>
                    <span className="bubble-role-badge">
                      {msg.senderRole === 'Ciudadano' ? <User size={10} /> : <Wrench size={10} />}
                      {msg.senderRole}
                    </span>
                  </div>

                  <div className={`chat-bubble ${msg.messageType === 'Audio' ? 'bubble-audio' : ''}`}>
                    {msg.messageType === 'Audio' ? (
                      <div className="audio-message-player">
                        <button
                          type="button"
                          className="btn-play-audio"
                          onClick={() => handlePlayAudio(msg)}
                        >
                          {playingId === msg.id ? <Pause size={14} /> : <Play size={14} />}
                        </button>
                        <div className="audio-wave-progress-wrap">
                          <div className="audio-wave-bar">
                            {[10, 16, 12, 16, 11, 14, 9, 15].map((h, bIdx) => {
                              const barPct = ((bIdx + 1) / 8) * 100
                              const active = playingId === msg.id && playProgress >= barPct - 10
                              return (
                                <span
                                  key={`wave-${bIdx}`}
                                  className={`wave-line ${active ? 'active' : ''}`}
                                  style={{ height: `${h}px` }}
                                />
                              )
                            })}
                          </div>
                          <div className="audio-progress-track">
                            <div
                              className="audio-progress-fill"
                              style={{ width: `${playingId === msg.id ? playProgress : 0}%` }}
                            />
                          </div>
                        </div>
                        <span className="audio-duration-tag">
                          {playingId === msg.id
                            ? `0:${String(playCurrentSec).padStart(2, '0')}`
                            : (msg.audioDurationSeconds ? `0:${String(msg.audioDurationSeconds).padStart(2, '0')}` : '0:06')}
                        </span>
                        <Volume2 size={13} className="audio-volume-icon" />
                      </div>
                    ) : (
                      <p className="bubble-text">{msg.content}</p>
                    )}
                  </div>
                  <span className="bubble-time">
                    {new Date(msg.sentAt).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Barra de Grabación en Proceso */}
          {isRecording && (
            <div className="recording-active-bar">
              <div className="rec-indicator">
                <span className="rec-dot-pulsing"></span>
                <span className="rec-timer">
                  Grabando audio: 0:{String(recordingSeconds).padStart(2, '0')}
                </span>
              </div>
              <div className="rec-buttons">
                <button type="button" className="btn-rec-cancel" onClick={cancelRecording}>
                  Cancelar
                </button>
                <button type="button" className="btn-rec-send" onClick={stopRecording}>
                  <Send size={13} /> Enviar Nota
                </button>
              </div>
            </div>
          )}

          {/* Input de Mensaje y Botón de Audio */}
          {!isRecording && (
            <form onSubmit={handleSendText} className="chat-input-bar">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Escribí un mensaje o grabá una nota..."
                className="chat-text-input"
              />
              <button
                type="button"
                className="btn-mic-record"
                onClick={startRecording}
                title="Grabar nota de voz"
              >
                <Mic size={16} />
              </button>
              <button
                type="submit"
                className="btn-chat-send"
                disabled={!inputText.trim()}
                title="Enviar mensaje"
              >
                <Send size={15} />
              </button>
            </form>
          )}

        </div>
      )}
    </div>
  )
}
