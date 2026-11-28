import { login, getCurrentOfficial, logout, isAuthenticated } from './authService'

const mockStorage = {}
global.window = {
  localStorage: {
    getItem: (key) => mockStorage[key] || null,
    setItem: (key, val) => { mockStorage[key] = String(val) },
    removeItem: (key) => { delete mockStorage[key] },
    clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]) }
  }
}

describe('authService', () => {
  beforeEach(() => {
    global.window.localStorage.clear()
  })

  test('returns default official when not logged in', () => {
    const official = getCurrentOfficial()
    expect(official).toBeDefined()
    expect(official.entity).toBe('Municipalidad de Cartago')
  })

  test('successfully logs in with valid official credentials (fallback)', async () => {
    const result = await login('carlos.mendez', 'MuniCartago#2026!')
    expect(result.success).toBe(true)
    expect(result.official.fullName).toBe('Ing. Carlos Méndez Solís')
    expect(isAuthenticated()).toBe(true)
  })

  test('fails login with unknown username', async () => {
    const result = await login('usuario_desconocido', '1234')
    expect(result.success).toBe(false)
  })

  test('logs out correctly', async () => {
    await login('carlos.mendez', 'MuniCartago#2026!')
    expect(isAuthenticated()).toBe(true)
    logout()
    expect(isAuthenticated()).toBe(false)
  })
})
