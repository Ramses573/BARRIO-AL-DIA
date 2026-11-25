import { getMessagesByTicket, sendChatMessage, wipeChats } from './chatService'

describe('chatService', () => {
  test('getMessagesByTicket retorna un arreglo limpio por defecto', async () => {
    const msgs = await getMessagesByTicket('GENERAL')
    expect(Array.isArray(msgs)).toBe(true)
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
      content: '/audios/test.mp4',
      audioDurationSeconds: 12
    })

    expect(audioMsg).toBeDefined()
    expect(audioMsg.messageType).toBe('Audio')
    expect(audioMsg.audioDurationSeconds).toBe(12)
  })

  test('wipeChats limpia los mensajes de chat', async () => {
    const res = await wipeChats()
    expect(res).toBeDefined()
    const msgs = await getMessagesByTicket('TKT-TEST-9999')
    expect(msgs).toEqual([])
  })
})
