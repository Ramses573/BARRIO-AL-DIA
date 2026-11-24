import { getNews, fetchNewsFromApi } from './newsService'

describe('newsService', () => {
  test('getNews retorna noticias iniciales por defecto', () => {
    const list = getNews()
    expect(Array.isArray(list)).toBe(true)
    expect(list.length).toBeGreaterThan(0)
    expect(list[0]).toHaveProperty('title')
    expect(list[0]).toHaveProperty('canton')
  })

  test('fetchNewsFromApi filtra por cantón localmente si no hay conexión', async () => {
    const cartagoNews = await fetchNewsFromApi({ canton: 'Cartago' })
    expect(Array.isArray(cartagoNews)).toBe(true)
    cartagoNews.forEach(n => {
      expect(n.canton.toLowerCase().includes('cartago') || n.canton === 'General').toBe(true)
    })
  })

  test('fetchNewsFromApi filtra solo urgentes', async () => {
    const urgentNews = await fetchNewsFromApi({ urgentOnly: true })
    urgentNews.forEach(n => {
      expect(n.isUrgent).toBe(true)
    })
  })
})
