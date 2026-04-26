// ── Centralized Onvero Dashboard Color Palette ──────────────────────────────

export const COLORS = {
  // Brand
  primary: '#6B7AFF',
  primaryLight: '#818cf8',
  primaryBg: 'rgba(107,122,255,0.15)',

  // Score tiers
  hot: '#FF6B35',
  hotBg: 'rgba(255,107,53,0.15)',
  warm: '#FFD700',
  warmBg: 'rgba(255,215,0,0.12)',
  cold: '#6B7AFF',
  coldBg: 'rgba(107,122,255,0.15)',

  // Status
  success: '#4ade80',
  successBg: 'rgba(74,222,128,0.12)',
  error: '#f87171',
  errorBg: 'rgba(239,68,68,0.12)',
  warning: '#fde047',
  warningBg: 'rgba(234,179,8,0.12)',
  info: '#60a5fa',
  infoBg: 'rgba(59,130,246,0.15)',

  // Surfaces
  bg: '#000',
  surface: '#0a0a0a',
  surfaceElevated: '#111',
  surfaceCard: '#1a1a1a',
  border: '#1f1f1f',
  borderLight: '#2a2a2a',

  // Text
  textPrimary: '#fff',
  textSecondary: '#ccc',
  textMuted: '#888',
  textDim: '#555',
  textFaint: '#444',
  textGhost: '#333',
} as const;
