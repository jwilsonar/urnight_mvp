/**
 * Tokens de diseño de la app móvil — port de los tokens CSS `--un-*` de
 * apps/web/app/globals.css (dark-first). Fuente única para colores, espaciado
 * y radios; las pantallas NUNCA usan hex sueltos.
 */

export const colors = {
  // Paleta base UrNight
  midnight: '#0B0B12',
  amethyst: '#6C4DFF',
  lavender: '#B8A8FF',
  silver: '#C9C9D4',

  // Escalera de fondos
  bgRoot: '#0B0B12',
  bgSurface: '#131320',
  bgElevated: '#1A1A2B',

  // Texto
  textPrimary: '#F4F2FF',
  textSecondary: '#C9C9D4',
  textMuted: '#8A8798',
  textAccent: '#B8A8FF',

  // Acento y bordes
  accent: '#6C4DFF',
  accentSoft: 'rgba(108, 77, 255, 0.16)',
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.16)',

  // Semánticos
  success: '#22C55E',
  successSoft: 'rgba(34, 197, 94, 0.16)',
  warning: '#F59E0B',
  warningSoft: 'rgba(245, 158, 11, 0.16)',
  error: '#EF4444',
  errorSoft: 'rgba(239, 68, 68, 0.16)',
  info: '#38BDF8',
  infoSoft: 'rgba(56, 189, 248, 0.16)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export const typography = {
  display: 28,
  title: 22,
  heading: 17,
  body: 15,
  caption: 13,
  micro: 11,
} as const;

/** Duraciones de animación (ms). UI corta, ease-out; nada > 350ms. */
export const motion = {
  fast: 120,
  base: 180,
  slow: 300,
} as const;

/** Relleno absoluto (RN 0.85 quitó StyleSheet.absoluteFillObject de los tipos). */
export const absoluteFill = {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
} as const;
