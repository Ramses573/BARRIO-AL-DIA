import { THEMES, getDefaultTheme, getCurrentTheme, applyTheme } from './themeService'

describe('themeService', () => {
  beforeEach(() => {
    applyTheme(getDefaultTheme())
  })

  test('returns default theme ocean-depths when nothing is saved', () => {
    expect(getDefaultTheme()).toBe('ocean-depths')
    expect(getCurrentTheme()).toBe('ocean-depths')
  })

  test('applies theme and stores it', () => {
    const applied = applyTheme('tech-innovation')
    expect(applied).toBe('tech-innovation')
    expect(getCurrentTheme()).toBe('tech-innovation')
  })

  test('falls back to default if invalid theme name provided', () => {
    const applied = applyTheme('invented-invalid-theme')
    expect(applied).toBe('ocean-depths')
  })

  test('lists available themes with Ocean Depths and Tech Innovation', () => {
    expect(THEMES.length).toBeGreaterThanOrEqual(3)
    expect(THEMES.some(t => t.id === 'ocean-depths')).toBe(true)
    expect(THEMES.some(t => t.id === 'tech-innovation')).toBe(true)
  })
})
