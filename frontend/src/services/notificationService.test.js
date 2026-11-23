import { getNotifications, addNotification, dismissNotification, wipeNotifications } from './notificationService'

describe('notificationService', () => {
  test('returns notifications as an array', () => {
    const list = getNotifications()
    expect(Array.isArray(list)).toBe(true)
  })

  test('adds a community notification', () => {
    const initial = getNotifications().length
    const created = addNotification({
      title: 'Alerta de prueba',
      category: 'Inundación',
      location: 'Turrialba',
      recommendation: 'Precaución'
    })
    expect(created.id).toBeDefined()
    expect(created.status).toBe('Reporte reciente')
    expect(getNotifications().length).toBe(initial + 1)
  })

  test('dismisses a notification', () => {
    let list = getNotifications()
    if (list.length === 0) {
      addNotification({
        title: 'Alerta para descartar',
        category: 'Accidente',
        location: 'Cartago',
        recommendation: 'Precaución vial'
      })
      list = getNotifications()
    }
    const firstId = list[0].id
    dismissNotification(firstId)
    const after = getNotifications()
    expect(after.find(n => n.id === firstId)).toBeUndefined()
  })

  test('wipes notifications cleanly', async () => {
    const res = await wipeNotifications()
    expect(res).toBeDefined()
    expect(getNotifications().length).toBe(0)
  })
})
