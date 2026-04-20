// ─── DESIGN TOKENS — Unternehmen v2 ─────────────────────────────────────────
// Single source of truth for colors, radii, fonts, and tier styles.
// Import as: import { TOKENS } from './_tokens';

export const TOKENS = {
  color: {
    bgOuter: '#080808',
    bgCard: '#0f0f0f',
    bgSubtle: '#1a1a1a',
    bgHover: '#161616',
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255,255,255,0.7)',
    textTertiary: 'rgba(255,255,255,0.5)',
    textMuted: 'rgba(255,255,255,0.4)',
    borderSubtle: 'rgba(255,255,255,0.08)',
    borderDefault: 'rgba(255,255,255,0.12)',
    borderHover: 'rgba(255,255,255,0.2)',
    indigo: '#6B7AFF',
    indigoLight: '#b9c2ff',
    indigoLighter: '#c4cdff',
    indigoBgSubtle: 'rgba(107,122,255,0.06)',
    indigoBgSoft: 'rgba(107,122,255,0.12)',
    indigoBgMedium: 'rgba(107,122,255,0.18)',
    indigoBorderSoft: 'rgba(107,122,255,0.25)',
    indigoBorderMedium: 'rgba(107,122,255,0.35)',
    green: '#7FD1A8',
    greenBg: 'rgba(127,209,168,0.08)',
    greenBorder: 'rgba(127,209,168,0.18)',
    amber: '#FFB48A',
    amberBg: 'rgba(255,180,138,0.06)',
    amberBorder: 'rgba(255,180,138,0.15)',
  },
  radius: {
    chip: '5px',
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
    HOT: { bg: '#6B7AFF', text: '#0a0a0a', borderStrength: 0.35 },
    WARM: { bg: 'rgba(255,255,255,0.08)', text: 'rgba(255,255,255,0.8)', borderStrength: 0.15 },
    COLD: { bg: 'transparent', text: 'rgba(255,255,255,0.55)', borderStrength: 0.1 },
    UNRATED: { bg: 'transparent', text: 'rgba(255,255,255,0.4)', borderStrength: 0.08 },
  },
} as const;

export type TierKey = keyof typeof TOKENS.tierColors;
