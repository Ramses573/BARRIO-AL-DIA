/**
 * Paleta de colores e identidad visual institucional: Barrio al Día
 */

export const colors = {
  primary: '#0284c7',        // Azul institucional
  primaryDark: '#0369a1',    // Azul oscuro hover/pressed
  primaryLight: '#38bdf8',   // Azul claro de acento
  primarySubtle: '#e0f2fe',  // Fondo sutil azul

  darkHeader: '#0f172a',     // Slate profundo
  darkCard: '#1e293b',

  bgPage: '#f8fafc',         // Fondo general de pantalla
  bgCard: '#ffffff',         // Fondo de tarjetas y listas
  bgSubtle: '#f1f5f9',       // Fondo de inputs y chips deshabilitados

  textMain: '#0f172a',       // Texto primario
  textMuted: '#64748b',      // Texto secundario
  textLight: '#94a3b8',      // Texto deshabilitado o fechas
  textInverse: '#ffffff',    // Texto blanco

  border: '#e2e8f0',         // Bordes generales
  borderFocused: '#0284c7',

  // Colores de Urgencia y Estados Cantonales
  urgencyLow: '#10b981',     // Baja / Resuelto (Verde esmeralda)
  urgencyLowBg: '#d1fae5',

  urgencyMedium: '#f59e0b',  // Media / En Proceso (Ámbar)
  urgencyMediumBg: '#fef3c7',

  urgencyHigh: '#ef4444',    // Alta / Crítica / Pendiente (Rojo vibrante)
  urgencyHighBg: '#fee2e2',

  // Colores Temáticos
  vial: '#d97706',           // Obras viales
  water: '#0284c7',          // Acueductos
  cne: '#dc2626',            // Emergencias CNE
  electric: '#7c3aed',       // Alumbrado
  community: '#059669',      // Comunal
}

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
}
