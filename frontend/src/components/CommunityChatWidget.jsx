import React, { useState, useEffect, useRef } from 'react'
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
  Radio
} from 'lucide-react'
import { getMessagesByTicket, sendChatMessage } from '../services/chatService'
import { isAuthenticated, getCurrentOfficial } from '../services/authService'
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
  const senderRole = isAuth ? 'Cuadrilla Municipal' : 'Ciudadano'
  const senderName = isAuth ? (currentOfficial?.fullName || 'Funcionario') : 'Vecino Comunitario'

  // Estados de grabación de audio
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const timerRef = useRef(null)

  // Reproducción de audios
  const [playingId, setPlayingId] = useState(null)
  const audioPlayerRef = useRef(new Audio())

  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      loadMessages()
    }
  }, [isOpen, ticketCode])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadMessages = async () => {
    const list = await getMessagesByTicket(ticketCode)
    if (Array.isArray(list)) {
      setMessages(list)
    }
  }

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

    setMessages(prev => [...prev, sent])
  }

  // Iniciar grabación de audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const reader = new FileReader()
        reader.readAsDataURL(audioBlob)
        reader.onloadend = async () => {
          const base64Audio = reader.result
          const duration = recordingSeconds || 3

          const sent = await sendChatMessage({
            ticketCode,
            senderName,
            senderRole,
            messageType: 'Audio',
            content: base64Audio,
            audioDurationSeconds: duration
          })

          setMessages(prev => [...prev, sent])
          addToast('Nota de voz enviada correctamente', 'success')
        }

        // Detener tracks del micrófono
        stream.getTracks().forEach(track => track.stop())
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
      audioChunksRef.current = []
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      clearInterval(timerRef.current)
      addToast('Grabación de audio cancelada', 'info')
    }
  }

  // Reproducir nota de voz
  const handlePlayAudio = (msg) => {
    if (playingId === msg.id) {
      audioPlayerRef.current.pause()
      setPlayingId(null)
      return
    }

    audioPlayerRef.current.src = msg.content
    audioPlayerRef.current.play()
    setPlayingId(msg.id)

    audioPlayerRef.current.onended = () => {
      setPlayingId(null)
    }
    audioPlayerRef.current.onerror = () => {
      addToast('Audio de demostración (simulado)', 'info')
      setPlayingId(null)
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
              onClick={() => setIsOpen(false)}
            >
              <X size={16} />
            </button>
          </div>

          {/* Selector de Canal / Ticket */}
          <div className="chat-channel-selector">
            <input
              type="text"
              value={ticketCode}
              onChange={(e) => setTicketCode(e.target.value.toUpperCase())}
              placeholder="Código de ticket (ej. TKT-CART-5821 o GENERAL)"
              className="chat-ticket-input"
            />
            <button type="button" className="btn-switch-ticket" onClick={loadMessages}>
              Conectar
            </button>
          </div>

          {/* Historial de Mensajes */}
          <div className="chat-messages-container">
            {messages.map((msg) => {
              const isMine = (msg.senderRole === 'Ciudadano' && !isAuth) || (msg.senderRole !== 'Ciudadano' && isAuth)
              return (
                <div
                  key={msg.id}
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
                        <div className="audio-wave-bar">
                          <span className="wave-line"></span>
                          <span className="wave-line"></span>
                          <span className="wave-line"></span>
                          <span className="wave-line"></span>
                          <span className="wave-line"></span>
                          <span className="wave-line"></span>
                        </div>
                        <span className="audio-duration-tag">
                          {msg.audioDurationSeconds ? `0:${String(msg.audioDurationSeconds).padStart(2, '0')}` : '0:06'}
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
