const DEFAULT_BLUE = '#3b82f6'
const DEFAULT_GREEN = '#10b981'

export const DEFAULT_THEME_COLOR = DEFAULT_GREEN
export const FREE_THEME_COLORS = ['#10b981', '#3b82f6', '#ec4899']

export function normalizeHex(hex) {
  if (!hex || typeof hex !== 'string') return null
  let c = hex.trim().replace('#', '')
  if (c.length === 3) {
    c = c
      .split('')
      .map((x) => x + x)
      .join('')
  }
  if (!/^[0-9a-fA-F]{6}$/.test(c)) return null
  return `#${c.toLowerCase()}`
}

function hexToRgbTuple(hex) {
  const normalized = normalizeHex(hex) || DEFAULT_GREEN
  const num = parseInt(normalized.slice(1), 16)
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
}

export function hexToRgba(hex, alpha = 1) {
  const [r, g, b] = hexToRgbTuple(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function mixHex(a, b, weight = 0.5) {
  const [r1, g1, b1] = hexToRgbTuple(a)
  const [r2, g2, b2] = hexToRgbTuple(b)
  const t = Math.min(1, Math.max(0, weight))
  const toHex = (v) => Math.round(v).toString(16).padStart(2, '0')
  return `#${toHex(r1 + (r2 - r1) * t)}${toHex(g1 + (g2 - g1) * t)}${toHex(b1 + (b2 - b1) * t)}`
}

export function resolveBaseColor(isGreenMode, customColor) {
  const custom = normalizeHex(customColor)
  if (custom) return custom
  return isGreenMode ? DEFAULT_GREEN : DEFAULT_BLUE
}

export const PRIMARY_VAR_NAMES = [
  '--color-primary',
  '--color-primary-light',
  '--color-primary-lighter',
  '--color-primary-dark',
  '--color-primary-hover',
  '--color-primary-gradient-end',
  '--color-primary-shadow',
  '--color-synapse-zap',
  '--pc-filled-bg',
  '--pc-filled-border',
  '--pc-filled-eyebrow',
  '--pc-filled-badge-bg',
  '--pc-filled-badge-text',
  '--pc-filled-badge-border',
  '--pc-filled-shadow',
  '--pc-tribe-bg',
  '--pc-tribe-border',
  '--pc-tribe-eyebrow',
  '--pc-tribe-badge-bg',
  '--pc-tribe-badge-text',
  '--pc-tribe-badge-border',
  '--pc-tribe-shadow',
]

export function derivePrimaryVars(baseHex, isDark) {
  const base = normalizeHex(baseHex) || DEFAULT_GREEN
  const primaryLight = isDark ? mixHex(base, '#000000', 0.72) : mixHex(base, '#ffffff', 0.85)
  const primaryLighter = isDark ? mixHex(base, '#000000', 0.84) : mixHex(base, '#ffffff', 0.93)
  const primaryDark = isDark ? mixHex(base, '#ffffff', 0.55) : mixHex(base, '#000000', 0.28)
  const primaryHover = isDark ? mixHex(base, '#000000', 0.25) : mixHex(base, '#000000', 0.12)
  const gradientEnd = isDark ? mixHex(base, '#ffffff', 0.35) : mixHex(base, '#000000', 0.25)

  return {
    '--color-primary': base,
    '--color-primary-light': primaryLight,
    '--color-primary-lighter': primaryLighter,
    '--color-primary-dark': primaryDark,
    '--color-primary-hover': primaryHover,
    '--color-primary-gradient-end': gradientEnd,
    '--color-primary-shadow': hexToRgba(base, 0.3),
    '--color-synapse-zap': isDark ? primaryDark : base,
  }
}

export function applyCustomColorVars(baseHex, isDark) {
  const root = document.documentElement
  root.classList.remove('theme-green')
  const vars = {
    ...derivePrimaryVars(baseHex, isDark),
    ...derivePersonalityCardVars(baseHex, isDark),
  }
  Object.entries(vars).forEach(([name, value]) => root.style.setProperty(name, value))
}

export function clearCustomColorVars(isGreenMode) {
  const root = document.documentElement
  PRIMARY_VAR_NAMES.forEach((name) => root.style.removeProperty(name))
  if (isGreenMode) {
    root.classList.add('theme-green')
  } else {
    root.classList.remove('theme-green')
  }
}

export function derivePersonalityCardVars(baseHex, isDark) {
  const base = normalizeHex(baseHex) || DEFAULT_GREEN
  const filledBorder = isDark ? mixHex(base, '#ffffff', 0.25) : mixHex(base, '#000000', 0.28)
  const filledText = isDark ? mixHex(base, '#ffffff', 0.55) : mixHex(base, '#000000', 0.28)
  const tribeBorder = isDark ? mixHex(base, '#ffffff', 0.3) : mixHex(base, '#000000', 0.28)
  const tribeText = isDark ? mixHex(base, '#ffffff', 0.7) : mixHex(base, '#000000', 0.55)

  return {
    '--pc-filled-bg': isDark
      ? `linear-gradient(135deg, ${mixHex(base, '#000000', 0.72)} 0%, ${mixHex(base, '#000000', 0.88)} 100%)`
      : `linear-gradient(135deg, ${mixHex(base, '#ffffff', 0.5)} 0%, ${mixHex(base, '#ffffff', 0.88)} 100%)`,
    '--pc-filled-border': filledBorder,
    '--pc-filled-eyebrow': filledText,
    '--pc-filled-badge-bg': hexToRgba(base, 0.12),
    '--pc-filled-badge-text': filledText,
    '--pc-filled-badge-border': hexToRgba(base, 0.2),
    '--pc-filled-shadow': `0 4px 14px ${hexToRgba(base, isDark ? 0.22 : 0.16)}`,
    '--pc-tribe-bg': isDark
      ? `linear-gradient(135deg, ${mixHex(base, '#000000', 0.25)} 0%, ${mixHex(base, '#000000', 0.6)} 100%)`
      : `linear-gradient(135deg, ${base} 0%, ${mixHex(base, '#ffffff', 0.5)} 100%)`,
    '--pc-tribe-border': tribeBorder,
    '--pc-tribe-eyebrow': tribeText,
    '--pc-tribe-badge-bg': hexToRgba(tribeBorder, 0.15),
    '--pc-tribe-badge-text': tribeText,
    '--pc-tribe-badge-border': hexToRgba(tribeBorder, 0.25),
    '--pc-tribe-shadow': `0 4px 14px ${hexToRgba(base, isDark ? 0.16 : 0.16)}`,
  }
}

const GREEN_ACCENT = {
  base: '#10b981',
  activeCore: '#34d399',
  activeGlow: '#10b981',
  activeBorder: '#6ee7b7',
  light: '#a7f3d0',
  rootGlow: '#059669',
  darkBgStart: '#064e3b',
  darkBgEnd: '#065f46',
  lightBgStart: '#047857',
  lightBgEnd: '#059669',
  deepMid: '#059669',
  activeDashLight: '#10b981',
  trackDark: '#064e3b',
  trackLight: '#a7f3d0',
  shadowDark: 'rgba(52, 211, 153, 0.7)',
  shadowLight: 'rgba(5, 150, 105, 0.45)',
  pulseRgb: [0.2, 0.83, 0.6],
}

const BLUE_ACCENT = {
  base: '#3b82f6',
  activeCore: '#60a5fa',
  activeGlow: '#3b82f6',
  activeBorder: '#93c5fd',
  light: '#bfdbfe',
  rootGlow: '#1d4ed8',
  darkBgStart: '#1e3a8a',
  darkBgEnd: '#1d4ed8',
  lightBgStart: '#1d4ed8',
  lightBgEnd: '#2563eb',
  deepMid: '#2563eb',
  activeDashLight: '#2563eb',
  trackDark: '#1e293b',
  trackLight: '#cbd5e1',
  shadowDark: 'rgba(96, 165, 250, 0.7)',
  shadowLight: 'rgba(37, 99, 235, 0.45)',
  pulseRgb: [0.23, 0.51, 0.98],
}

export function deriveAccentPalette({ isGreenMode = true, customColor = null } = {}) {
  const custom = normalizeHex(customColor)
  if (!custom) {
    const palette = isGreenMode ? GREEN_ACCENT : BLUE_ACCENT
    return { ...palette, isCustom: false }
  }

  const base = custom
  const activeCore = mixHex(base, '#ffffff', 0.28)
  const activeBorder = mixHex(base, '#ffffff', 0.45)
  const deepMid = mixHex(base, '#000000', 0.15)
  const [r, g, b] = hexToRgbTuple(activeCore)

  return {
    base,
    activeCore,
    activeGlow: base,
    activeBorder,
    light: mixHex(base, '#ffffff', 0.72),
    rootGlow: mixHex(base, '#000000', 0.45),
    darkBgStart: mixHex(base, '#000000', 0.72),
    darkBgEnd: mixHex(base, '#000000', 0.5),
    lightBgStart: mixHex(base, '#000000', 0.3),
    lightBgEnd: deepMid,
    deepMid,
    activeDashLight: deepMid,
    trackDark: mixHex(base, '#000000', 0.72),
    trackLight: mixHex(base, '#ffffff', 0.72),
    shadowDark: hexToRgba(activeCore, 0.7),
    shadowLight: hexToRgba(deepMid, 0.45),
    pulseRgb: [r / 255, g / 255, b / 255],
    isCustom: true,
  }
}
