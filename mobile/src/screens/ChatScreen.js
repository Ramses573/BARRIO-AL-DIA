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
  Modal,
  ActivityIndicator
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Audio } from 'expo-av'
import { colors, shadows } from '../theme/colors'
import { getMessagesByTicket, sendChatMessage } from '../services/chatService'
import { getAllTrackableTickets } from '../services/incidentService'
import { getCurrentUser } from '../services/authService'

const DIRECT_CHANNELS = [
  { code: 'GENERAL', title: '📢 Canal General Comunitario', subtitle: 'Avisos vecinales y coordinación abierta', icon: 'megaphone' },
  { code: 'EMERGENCIA-CARTAGO', title: '🚨 Despacho Emergencias Cartago', subtitle: 'Cuadrillas municipales y protección civil', icon: 'warning' },
  { code: 'EMERGENCIA-TURRIALBA', title: '🚨 Coordinación Operativa Turrialba', subtitle: 'Unidad de obras públicas y vialidad', icon: 'warning' },
  { code: 'EMERGENCIA-TARRAZU', title: '🚨 Brigada Cantonal Tarrazú', subtitle: 'Servicios públicos y tendido eléctrico', icon: 'warning' }
]

export default function ChatScreen({ route }) {
  const initialTicket = route?.params?.ticketCode || 'GENERAL'
  const [ticketCode, setTicketCode] = useState(initialTicket)
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(true)
  const [allTickets, setAllTickets] = useState([])
  const [showPicker, setShowPicker] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

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
    loadTicketsAndUser()
  }, [])

  useEffect(() => {
    loadChat()
    return () => {
      if (sound) sound.unloadAsync()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [ticketCode])

  const loadTicketsAndUser = async () => {
    try {
      const tickets = await getAllTrackableTickets()
      setAllTickets(tickets)
      const user = await getCurrentUser()
      if (user) setCurrentUser(user)
    } catch {
      // Ignorar
    }
  }

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

    const citizenName = currentUser?.fullName || 'Ramsés Solano Calvo'

    const sent = await sendChatMessage({
      ticketCode,
      senderName: citizenName,
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

      const citizenName = currentUser?.fullName || 'Ramsés Solano Calvo'

      const sent = await sendChatMessage({
        ticketCode,
        senderName: citizenName,
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

  const selectedChannel = DIRECT_CHANNELS.find(c => c.code === ticketCode)
  const selectedTicket = allTickets.find(t => (t.ticketCode || String(t.id)).toUpperCase() === ticketCode.toUpperCase())
  const selectedTitle = selectedChannel ? selectedChannel.title : (selectedTicket ? `${selectedTicket.title} (${selectedTicket.status})` : 'Canal Comunitario')

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* ComboBox Selector de Canal o Ticket Cantonal (Sin input manual) */}
      <View style={styles.topComboboxBar}>
        <View style={styles.topComboboxHeaderRow}>
          <Text style={styles.topComboboxLabel}>CANAL / TICKET (COMBOBOX):</Text>
          <Text style={styles.topComboboxHint}>Toca para cambiar</Text>
        </View>
        <TouchableOpacity
          style={styles.comboboxTriggerBtn}
          onPress={() => setShowPicker(true)}
          activeOpacity={0.8}
        >
          <View style={styles.comboboxTriggerContent}>
            <Ionicons
              name={selectedChannel ? selectedChannel.icon : 'pricetag'}
              size={18}
              color={colors.primary}
            />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.comboboxSelectedCode}>{ticketCode}</Text>
              <Text style={styles.comboboxSelectedSub} numberOfLines={1}>{selectedTitle}</Text>
            </View>
          </View>
          <Ionicons name="chevron-down-circle" size={20} color={colors.primary} />
        </TouchableOpacity>

        {/* Chips de selección rápida con 1 toque */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chatChipsRow}
          contentContainerStyle={{ gap: 6, paddingVertical: 4 }}
        >
          {DIRECT_CHANNELS.map(ch => (
            <TouchableOpacity
              key={ch.code}
              style={[styles.chatChipBtn, ticketCode === ch.code && styles.chatChipBtnActive]}
              onPress={() => setTicketCode(ch.code)}
            >
              <Text style={[styles.chatChipText, ticketCode === ch.code && styles.chatChipTextActive]}>
                {ch.code === 'GENERAL' ? '📢 General' : ch.code.replace('EMERGENCIA-', '🚨 ')}
              </Text>
            </TouchableOpacity>
          ))}
          {allTickets.slice(0, 3).map(t => {
            const code = t.ticketCode || `#${t.id}`
            return (
              <TouchableOpacity
                key={code}
                style={[styles.chatChipBtn, ticketCode.toUpperCase() === code.toUpperCase() && styles.chatChipBtnActive]}
                onPress={() => setTicketCode(code)}
              >
                <Text style={[styles.chatChipText, ticketCode.toUpperCase() === code.toUpperCase() && styles.chatChipTextActive]}>
                  🎫 {code}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {/* Modal Picker tipo ComboBox */}
      <Modal
        visible={showPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Seleccionar Canal o Ticket</Text>
                <Text style={styles.modalSubtitle}>Elige un canal o ticket del ComboBox sin escribir</Text>
              </View>
              <TouchableOpacity onPress={() => setShowPicker(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalSectionTitle}>📡 Canales de Comunicación Directa</Text>
              {DIRECT_CHANNELS.map(ch => {
                const isSelected = ticketCode === ch.code
                return (
                  <TouchableOpacity
                    key={ch.code}
                    style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                    onPress={() => {
                      setTicketCode(ch.code)
                      setShowPicker(false)
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.modalItemAvatar, isSelected && { backgroundColor: colors.primary }]}>
                      <Ionicons name={ch.icon} size={18} color={isSelected ? '#ffffff' : colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modalItemCode, isSelected && { color: colors.primary }]}>
                        {ch.code}
                      </Text>
                      <Text style={styles.modalItemTitle}>{ch.title}</Text>
                      <Text style={styles.modalItemSub}>{ch.subtitle}</Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
                  </TouchableOpacity>
                )
              })}

              <Text style={[styles.modalSectionTitle, { marginTop: 14 }]}>🎫 Tickets de Incidentes Comunitarios</Text>
              {allTickets.map(t => {
                const code = t.ticketCode || `#${t.id}`
                const isSelected = ticketCode.toUpperCase() === code.toUpperCase()
                const rep = t.isAnonymous ? 'Anónimo Protegido' : (t.reporterName || 'Ramsés Solano')
                return (
                  <TouchableOpacity
                    key={code}
                    style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                    onPress={() => {
                      setTicketCode(code)
                      setShowPicker(false)
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.modalItemAvatar, isSelected && { backgroundColor: colors.primary }]}>
                      <Ionicons name="pricetag" size={18} color={isSelected ? '#ffffff' : colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modalItemCode, isSelected && { color: colors.primary }]}>
                        {code}
                      </Text>
                      <Text style={styles.modalItemTitle} numberOfLines={1}>{t.title}</Text>
                      <Text style={styles.modalItemSub}>Reportado por: {rep} • {t.status}</Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

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
  topComboboxBar: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.border,
    ...shadows.sm,
  },
  topComboboxHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  topComboboxLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  topComboboxHint: {
    fontSize: 10.5,
    color: colors.primary,
    fontWeight: '700',
  },
  chatChipsRow: {
    marginTop: 8,
  },
  chatChipBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  chatChipBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chatChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  chatChipTextActive: {
    color: '#ffffff',
  },
  comboboxTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  comboboxTriggerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  comboboxSelectedCode: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  comboboxSelectedSub: {
    fontSize: 11.5,
    color: '#475569',
    fontWeight: '600',
    marginTop: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '82%',
    ...shadows.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#1e293b',
  },
  modalSubtitle: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalScroll: {
    maxHeight: 380,
  },
  modalSectionTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginBottom: 8,
    gap: 10,
    backgroundColor: '#f8fafc',
  },
  modalItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '0a',
  },
  modalItemAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalItemCode: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e293b',
  },
  modalItemTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
    marginTop: 1,
  },
  modalItemSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
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
