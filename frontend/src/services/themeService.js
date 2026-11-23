// themeService.js - Gestor de temas visuales basados en theme-factory
const STORAGE_KEY = 'barrio_al_dia_theme'

export const THEMES = [
  {
    id: 'ocean-depths',
    name: 'Ocean Depths',
    badge: '🌊 Cívico Institucional',
    primaryColor: '#0284c7',
    deepColor: '#1a2332'
  },
  {
    id: 'tech-innovation',
    name: 'Tech Innovation',
    badge: '⚡ Civic Tech (Dark)',
    primaryColor: '#0066ff',
    deepColor: '#0f172a'
  },
  {
    id: 'modern-minimalist',
    name: 'Modern Minimalist',
    badge: '📐 Grayscale',
    primaryColor: '#36454f',
    deepColor: '#1a1a1a'
  }
]

let inMemoryTheme = 'ocean-depths'

export const getDefaultTheme = () => 'ocean-depths'

export const getCurrentTheme = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved && THEMES.some(t => t.id === saved)) {
        return saved
      }
    } catch {
      // Fallback
    }
  }
  return inMemoryTheme
}

export const applyTheme = (themeId) => {
  const validTheme = THEMES.some(t => t.id === themeId) ? themeId : getDefaultTheme()
  inMemoryTheme = validTheme

  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.setAttribute('data-theme', validTheme)
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, validTheme)
    } catch {
      // Fallback
    }
  }
  return validTheme
}
