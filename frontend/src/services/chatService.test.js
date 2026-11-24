import { getMessagesByTicket, sendChatMessage } from './chatService'

describe('chatService', () => {
  test('getMessagesByTicket retorna mensajes para ticket conocido', async () => {
    const msgs = await getMessagesByTicket('TKT-CART-5821')
    expect(Array.isArray(msgs)).toBe(true)
    expect(msgs.length).toBeGreaterThan(0)
    expect(msgs[0]).toHaveProperty('messageType')
    expect(msgs[0]).toHaveProperty('content')
  })

  test('sendChatMessage envía y persiste mensaje de texto', async () => {
    const newMsg = await sendChatMessage({
      ticketCode: 'TKT-TEST-9999',
      senderName: 'Vecino Test',
      senderRole: 'Ciudadano',
      messageType: 'Text',
      content: 'Mensaje de prueba de audio/texto'
    })

    expect(newMsg).toBeDefined()
    expect(newMsg.ticketCode).toBe('TKT-TEST-9999')
    expect(newMsg.messageType).toBe('Text')
    expect(newMsg.content).toBe('Mensaje de prueba de audio/texto')
  })

  test('sendChatMessage soporta nota de audio con duración', async () => {
    const audioMsg = await sendChatMessage({
      ticketCode: 'TKT-TEST-9999',
      senderName: 'Cuadrilla Test',
      senderRole: 'Cuadrilla Municipal',
      messageType: 'Audio',
      content: 'data:audio/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwH...',
      audioDurationSeconds: 12
    })

    expect(audioMsg).toBeDefined()
    expect(audioMsg.messageType).toBe('Audio')
    expect(audioMsg.audioDurationSeconds).toBe(12)
  })
})
