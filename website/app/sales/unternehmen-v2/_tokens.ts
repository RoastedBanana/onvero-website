// ─── DESIGN TOKENS — Unternehmen v2 — "Nachtblau" Palette ──────────────────
// Single source of truth. Import as: import { TOKENS } from './_tokens';

export const TOKENS = {
  color: {
    // Backgrounds — deep night-blue instead of pure black
    bgOuter: '#0a0d14',
    bgCard: '#11141d',
    bgSubtle: '#161a26',
    bgHover: '#161a26',
    bgInset: '#080a10',

    // Text — off-white for warmth
    textPrimary: '#F2F3F7',
    textSecondary: 'rgba(242,243,247,0.65)',
    textTertiary: 'rgba(242,243,247,0.45)',
    textMuted: 'rgba(242,243,247,0.30)',
    textPlaceholder: 'rgba(242,243,247,0.20)',
    textOnAccent: '#0a0d14',

    // Borders
    borderSubtle: 'rgba(242,243,247,0.06)',
    borderDefault: 'rgba(242,243,247,0.10)',
    borderHover: 'rgba(242,243,247,0.18)',

    // Accent — Indigo
    indigo: '#6B7AFF',
    indigoGlow: '#8B9AFF',
    indigoDeep: '#4A5AE8',
    indigoLight: '#b9c2ff',
    indigoLighter: '#c4cdff',
    indigoBgSubtle: 'rgba(107,122,255,0.04)',
    indigoBgSoft: 'rgba(107,122,255,0.08)',
    indigoBgMedium: 'rgba(107,122,255,0.12)',
    indigoBorderSoft: 'rgba(107,122,255,0.20)',
    indigoBorderMedium: 'rgba(107,122,255,0.40)',

    // Warm accent — Peach
    warm: '#F5A97F',
    warmDeep: '#E08A5F',
    warmBg: 'rgba(245,169,127,0.08)',
    warmBorder: 'rgba(245,169,127,0.20)',

    // Status — Success (soft green)
    green: '#8FE5B8',
    greenBg: 'rgba(143,229,184,0.08)',
    greenBorder: 'rgba(143,229,184,0.20)',

    // Status — Concern (same as warm, intentionally)
    amber: '#F5A97F',
    amberBg: 'rgba(245,169,127,0.08)',
    amberBorder: 'rgba(245,169,127,0.20)',

    // Status — Danger (rare)
    danger: '#FF8A7A',
    dangerBg: 'rgba(255,138,122,0.20)',
  },

  // Gradients
  gradient: {
    heroGlow: 'radial-gradient(ellipse at top, rgba(107,122,255,0.12) 0%, transparent 60%)',
    hotBadge: 'linear-gradient(135deg, #6B7AFF 0%, #8B9AFF 100%)',
    ctaButton: 'linear-gradient(135deg, #6B7AFF 0%, #7A89FF 100%)',
    rolePickerBg: 'linear-gradient(135deg, rgba(107,122,255,0.06) 0%, transparent 100%)',
    warmHighlight: 'radial-gradient(ellipse, rgba(245,169,127,0.10) 0%, transparent 70%)',
  },

  // Shadows
  shadow: {
    card: '0 4px 12px rgba(0,0,0,0.25)',
    cardHover: '0 8px 24px rgba(0,0,0,0.35)',
    hotGlow: '0 0 20px rgba(107,122,255,0.25)',
    insetTop: 'inset 0 1px 0 0 rgba(107,122,255,0.08)',
    insetTopWarm: 'inset 0 1px 0 0 rgba(245,169,127,0.12)',
  },

  radius: {
    chip: '6px',
    pill: '7px',
    button: '8px',
    card: '10px',
    cardLarge: '12px',
    hero: '14px',
  },

  font: {
    family: "'DM Sans', ui-sans-serif, system-ui, sans-serif",
    mono: "'DM Mono', ui-monospace, 'SF Mono', monospace",
  },

  tierColors: {
    HOT: { bg: '#6B7AFF', text: '#0a0d14', borderStrength: 0.4 },
    WARM: { bg: 'rgba(242,243,247,0.08)', text: 'rgba(242,243,247,0.8)', borderStrength: 0.15 },
    COLD: { bg: 'transparent', text: 'rgba(242,243,247,0.55)', borderStrength: 0.1 },
    UNRATED: { bg: 'transparent', text: 'rgba(242,243,247,0.30)', borderStrength: 0.08 },
  },
} as const;

export type TierKey = keyof typeof TOKENS.tierColors;
