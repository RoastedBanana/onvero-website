// ── Onvero Design Tokens ─────────────────────────────────────────────────────
// Single source of truth for all dashboard styling.
// Matches onvero.de visual language: monochrome, white accent, deep black.

export const tokens = {
  bg: {
    base: '#080808',
    surface: '#111111',
    raised: '#1a1a1a',
    hover: 'rgba(255,255,255,0.04)',
    border: 'rgba(255,255,255,0.08)',
    borderStrong: 'rgba(255,255,255,0.14)',
  },
  text: {
    primary: '#f5f5f5',
    secondary: '#a1a1aa',
    muted: '#52525b',
    inverse: '#080808',
  },
  brand: {
    primary: '#ffffff',
    primaryBg: 'rgba(255,255,255,0.06)',
  },
  status: {
    new: { bg: 'rgba(255,255,255,0.06)', text: '#a1a1aa', border: 'rgba(255,255,255,0.1)' },
    contacted: { bg: 'rgba(255,255,255,0.1)', text: '#e4e4e7', border: 'rgba(255,255,255,0.2)' },
    qualified: { bg: 'rgba(255,255,255,0.15)', text: '#f5f5f5', border: 'rgba(255,255,255,0.3)' },
    won: { bg: 'rgba(255,255,255,0.15)', text: '#f5f5f5', border: 'rgba(255,255,255,0.3)' },
    lost: { bg: 'rgba(255,255,255,0.03)', text: '#52525b', border: 'rgba(255,255,255,0.06)' },
    archived: { bg: 'rgba(255,255,255,0.03)', text: '#52525b', border: 'rgba(255,255,255,0.06)' },
    proposal: { bg: 'rgba(255,255,255,0.12)', text: '#e4e4e7', border: 'rgba(255,255,255,0.2)' },
  } as Record<string, { bg: string; text: string; border: string }>,
  score: {
    high: { color: '#f5f5f5', bar: 'rgba(255,255,255,0.9)' },
    mid: { color: '#a1a1aa', bar: 'rgba(255,255,255,0.5)' },
    low: { color: '#52525b', bar: 'rgba(255,255,255,0.2)' },
  },
  font: {
    sans: 'var(--font-geist-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif)',
  },
  radius: {
    sm: '6px',
    md: '10px',
    lg: '14px',
    xl: '20px',
  },
} as const;

export function getScoreStyle(score: number | null) {
  if (score === null) return tokens.score.low;
  if (score >= 70) return tokens.score.high;
  if (score >= 45) return tokens.score.mid;
  return tokens.score.low;
}

export function getStatusStyle(status: string) {
  return tokens.status[status] ?? tokens.status.new;
}
