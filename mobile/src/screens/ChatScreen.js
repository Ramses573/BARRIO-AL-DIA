import React, { useState, useEffect, useRef } from 'react'
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Audio } from 'expo-av'
import { colors, shadows } from '../theme/colors'
import { getMessagesByTicket, sendChatMessage } from '../services/chatService'

export default function ChatScreen({ route }) {
  const initialTicket = route?.params?.ticketCode || 'TKT-CART-5821'
  const [ticketCode, setTicketCode] = useState(initialTicket)
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(true)

  // Estados de grabación de audio con expo-av
  const [recording, setRecording] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const timerRef = useRef(null)

  // Reproducción de audio
  const [sound, setSound] = useState(null)
  const [playingId, setPlayingId] = useState(null)

  const scrollViewRef = useRef(null)

  useEffect(() => {
    loadChat()
    return () => {
      if (sound) sound.unloadAsync()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [ticketCode])

  const loadChat = async () => {
    setLoading(true)
    try {
      const msgs = await getMessagesByTicket(ticketCode)
      setMessages(msgs)
    } catch {
      // Ignorar error
    } finally {
      setLoading(false)
    }
  }

  const handleSendText = async () => {
    if (!inputText.trim()) return

    const text = inputText.trim()
    setInputText('')

    const sent = await sendChatMessage({
      ticketCode,
      senderName: 'Vecino Comunitario',
      senderRole: 'Ciudadano',
      messageType: 'Text',
      content: text
    })

    setMessages(prev => [...prev, sent])
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100)
  }

  // Iniciar grabación de audio nativa con expo-av
  const startRecording = async () => {
    try {
      const perm = await Audio.requestPermissionsAsync()
      if (perm.status !== 'granted') {
        Alert.alert('Permiso requerido', 'Se requiere acceso al micrófono para grabar notas de voz.')
        return
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true
      })

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      )

      setRecording(newRecording)
      setIsRecording(true)
      setRecordingSeconds(0)

      timerRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1)
      }, 1000)
    } catch {
      Alert.alert('Error', 'No se pudo iniciar la grabación de audio')
    }
  }

  // Detener y enviar nota de voz
  const stopRecordingAndSend = async () => {
    if (!recording) return

    clearInterval(timerRef.current)
    setIsRecording(false)

    try {
      await recording.stopAndUnloadAsync()
      const uri = recording.getURI()
      const duration = recordingSeconds || 1
      setRecording(null)

      const sent = await sendChatMessage({
        ticketCode,
        senderName: 'Vecino Comunitario',
        senderRole: 'Ciudadano',
        messageType: 'Audio',
        content: uri,
        audioUri: uri,
        audioDurationSeconds: duration
      })

      setMessages(prev => [...prev, sent])
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100)
    } catch {
      Alert.alert('Error', 'Fallo al procesar la nota de voz grabada')
    }
  }

  // Reproducir nota de voz
  const playAudio = async (msgId, uri) => {
    try {
      if (sound) {
        await sound.stopAsync()
        await sound.unloadAsync()
        setSound(null)
        if (playingId === msgId) {
          setPlayingId(null)
          return
        }
      }

      if (!uri) {
        Alert.alert('Nota de voz', 'Reproducción de audio demostrativa.')
        return
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      )
      setSound(newSound)
      setPlayingId(msgId)

      newSound.setOnPlaybackStatusUpdate(status => {
        if (status.didJustFinish) {
          setPlayingId(null)
        }
      })
    } catch {
      setPlayingId(null)
      Alert.alert('Audio', 'No se pudo reproducir este archivo de audio.')
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Selector de Ticket Superior */}
      <View style={styles.topTicketSelector}>
        <Text style={styles.topTicketLabel}>Canal vinculado al ticket:</Text>
        <View style={styles.ticketInputRow}>
          <Ionicons name="pricetag" size={14} color={colors.primary} />
          <TextInput
            style={styles.ticketCodeInput}
            value={ticketCode}
            onChangeText={setTicketCode}
            autoCapitalize="characters"
          />
          <TouchableOpacity style={styles.btnSwitchTicket} onPress={loadChat}>
            <Text style={styles.btnSwitchTicketText}>Cambiar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Listado de Mensajes */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando mensajes del canal...</Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.map(msg => {
            const isCitizen = msg.senderRole === 'Ciudadano'
            const isAudio = msg.messageType === 'Audio'

            return (
              <View
                key={msg.id}
                style={[
                  styles.msgRow,
                  isCitizen ? styles.msgRowRight : styles.msgRowLeft
                ]}
              >
                <View
                  style={[
                    styles.msgBubble,
                    isCitizen ? styles.msgBubbleCitizen : styles.msgBubbleOfficial
                  ]}
                >
                  <View style={styles.msgHeader}>
                    <Text style={[styles.msgSenderName, isCitizen && styles.textWhite]}>
                      {msg.senderName}
                    </Text>
                    <Text style={[styles.msgRoleBadge, isCitizen ? styles.roleCitizen : styles.roleOfficial]}>
                      {msg.senderRole}
                    </Text>
                  </View>

                  {isAudio ? (
                    <View style={styles.audioBubble}>
                      <TouchableOpacity
                        style={[styles.btnPlayAudio, isCitizen && { backgroundColor: '#ffffff' }]}
                        onPress={() => playAudio(msg.id, msg.audioUri || msg.content)}
                      >
                        <Ionicons
                          name={playingId === msg.id ? 'pause' : 'play'}
                          size={18}
                          color={isCitizen ? colors.primary : '#ffffff'}
                        />
                      </TouchableOpacity>
                      <View style={styles.audioWaveform}>
                        <View style={[styles.waveLine, { height: 12 }]} />
                        <View style={[styles.waveLine, { height: 20 }]} />
                        <View style={[styles.waveLine, { height: 16 }]} />
                        <View style={[styles.waveLine, { height: 24 }]} />
                        <View style={[styles.waveLine, { height: 14 }]} />
                      </View>
                      <Text style={[styles.audioDurationText, isCitizen && styles.textWhite]}>
                        0:{String(msg.audioDurationSeconds || 0).padStart(2, '0')}
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.msgText, isCitizen && styles.textWhite]}>
                      {msg.content}
                    </Text>
                  )}

                  <Text style={[styles.msgTime, isCitizen && styles.timeWhite]}>
                    {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            )
          })}
        </ScrollView>
      )}

      {/* Barra de Entrada / Grabación de Voz */}
      <View style={styles.bottomBar}>
        {isRecording ? (
          <View style={styles.recordingRow}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingTimerText}>
              Grabando nota de voz: 0:{String(recordingSeconds).padStart(2, '0')}
            </Text>
            <TouchableOpacity style={styles.btnStopSendRecording} onPress={stopRecordingAndSend}>
              <Ionicons name="checkmark" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.inputRow}>
            <TextInput
              style={styles.chatTextInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Escribe un mensaje de asistencia..."
              placeholderTextColor={colors.textLight}
              multiline
            />

            <TouchableOpacity style={styles.btnMic} onPress={startRecording}>
              <Ionicons name="mic" size={20} color="#ffffff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnSend, !inputText.trim() && styles.btnSendDisabled]}
              onPress={handleSendText}
              disabled={!inputText.trim()}
            >
              <Ionicons name="send" size={17} color="#ffffff" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  topTicketSelector: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topTicketLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: 4,
  },
  ticketInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ticketCodeInput: {
    flex: 1,
    backgroundColor: colors.bgSubtle,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  btnSwitchTicket: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  btnSwitchTicketText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12.5,
    color: colors.textMuted,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 14,
    gap: 10,
  },
  msgRow: {
    flexDirection: 'row',
  },
  msgRowRight: {
    justifyContent: 'flex-end',
  },
  msgRowLeft: {
    justifyContent: 'flex-start',
  },
  msgBubble: {
    maxWidth: '82%',
    borderRadius: 14,
    padding: 12,
    ...shadows.sm,
  },
  msgBubbleCitizen: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 2,
  },
  msgBubbleOfficial: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 2,
  },
  msgHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  msgSenderName: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textMain,
  },
  msgRoleBadge: {
    fontSize: 9.5,
    fontWeight: '800',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleCitizen: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    color: '#ffffff',
  },
  roleOfficial: {
    backgroundColor: colors.urgencyLowBg,
    color: colors.urgencyLow,
  },
  msgText: {
    fontSize: 13.5,
    color: colors.textMain,
    lineHeight: 18,
  },
  textWhite: {
    color: '#ffffff',
  },
  msgTime: {
    fontSize: 10,
    color: colors.textLight,
    textAlign: 'right',
    marginTop: 4,
  },
  timeWhite: {
    color: 'rgba(255,255,255,0.7)',
  },
  audioBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  btnPlayAudio: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioWaveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  waveLine: {
    width: 3,
    backgroundColor: '#94a3b8',
    borderRadius: 2,
  },
  audioDurationText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textMain,
  },
  bottomBar: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatTextInput: {
    flex: 1,
    backgroundColor: colors.bgSubtle,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 13.5,
    maxHeight: 80,
    color: colors.textMain,
  },
  btnMic: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.electric,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnSend: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnSendDisabled: {
    backgroundColor: '#cbd5e1',
  },
  recordingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.urgencyHighBg,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.cne,
  },
  recordingTimerText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.cne,
  },
  btnStopSendRecording: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.cne,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
