/**
 * RAVENUE Design System — tokens nativos (§7 canal móvil).
 * Copiados de `apps/web/app/globals.css` (fuente de verdad visual, dark-first).
 * Regla de composición: 70% oscuros / 20% blancos-grises / 10% carmín.
 */
export const color = {
  // Paleta cruda
  obsidian: '#0a0a0d',
  crimson: '#ea0526',
  crimsonHover: '#ff1f3d',
  wine: '#7a0f1f',
  moon: '#f5f5f7',
  smoke: '#a3a8b3',
  steel: '#2f3440',
  borderSoft: '#3a404d',

  // Escalera de fondos
  bgRoot: '#08080a',
  bgBase: '#0a0a0d',
  bgSurface: '#16181b',
  bgElevated: '#1d2127',

  // Texto
  textPrimary: '#f5f5f7',
  textSecondary: '#a3a8b3',
  textMuted: 'rgba(163, 168, 179, 0.72)',
  textFaint: 'rgba(163, 168, 179, 0.5)',
  textOnAccent: '#ffffff',
  actionLink: '#ff6b80',

  // Tintes carmín
  accentSoft: 'rgba(227, 23, 50, 0.14)',
  accentSoftStrong: 'rgba(227, 23, 50, 0.22)',
  accentBorder: 'rgba(227, 23, 50, 0.35)',
  accentBorderSubtle: 'rgba(227, 23, 50, 0.2)',

  // Estados semánticos
  success: '#22c55e',
  successFg: '#86efac',
  successSoft: 'rgba(34, 197, 94, 0.14)',
  warning: '#f59e0b',
  warningFg: '#fcd34d',
  warningSoft: 'rgba(245, 158, 11, 0.14)',
  error: '#ef4444',
  errorFg: '#fca5a5',
  errorSoft: 'rgba(239, 68, 68, 0.14)',

  borderFaint: 'rgba(255, 255, 255, 0.05)',
  fieldBg: 'rgba(255, 255, 255, 0.04)',
  secondaryFill: 'rgba(255, 255, 255, 0.06)',
} as const;

/** Escala de radios del DS: 8 / 12 / 16 / 20; pill solo chips y badges. */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

/** Base-4 spacing. */
export const space = {
  s1: 4,
  s2: 8,
  s3: 12,
  s4: 16,
  s6: 24,
  s8: 32,
  s12: 48,
  s16: 64,
} as const;

/** Escala tipográfica canónica (px del DS web → unidades RN). */
export const type = {
  display: { fontSize: 40, lineHeight: 46, fontWeight: '800', letterSpacing: -1 },
  h1: { fontSize: 32, lineHeight: 38, fontWeight: '700', letterSpacing: -0.6 },
  h2: { fontSize: 24, lineHeight: 30, fontWeight: '700', letterSpacing: -0.4 },
  h3: { fontSize: 20, lineHeight: 26, fontWeight: '600', letterSpacing: -0.3 },
  title: { fontSize: 18, lineHeight: 24, fontWeight: '600', letterSpacing: -0.2 },
  body: { fontSize: 16, lineHeight: 23, fontWeight: '400', letterSpacing: 0 },
  bodySm: { fontSize: 14, lineHeight: 20, fontWeight: '400', letterSpacing: 0 },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600', letterSpacing: 0 },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500', letterSpacing: 0 },
  /** Eyebrow: mayúsculas espaciadas en smoke (labels de sección). */
  eyebrow: { fontSize: 11.5, lineHeight: 15, fontWeight: '700', letterSpacing: 1.4 },
} as const;
