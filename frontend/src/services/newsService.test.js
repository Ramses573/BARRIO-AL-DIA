import { getNews, fetchNewsFromApi, wipeNews } from './newsService'

describe('newsService', () => {
  test('getNews retorna un arreglo limpio por defecto', () => {
    const list = getNews()
    expect(Array.isArray(list)).toBe(true)
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
    expect(Array.isArray(urgentNews)).toBe(true)
    urgentNews.forEach(n => {
      expect(n.isUrgent).toBe(true)
    })
  })

  test('wipeNews ejecuta barrido limpio de noticias', async () => {
    const res = await wipeNews()
    expect(res).toBeDefined()
    expect(getNews()).toEqual([])
  })
})
