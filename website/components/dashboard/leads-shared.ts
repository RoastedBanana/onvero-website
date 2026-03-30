// ── Leads Shared Types, Constants & Helpers ──────────────────────────────────
// Pure TypeScript — no React imports.

import type { CSSProperties } from 'react';

// ── Style objects ────────────────────────────────────────────────────────────

export const field: CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  color: '#fff',
  fontSize: '0.875rem',
  padding: '0.65rem 0.9rem',
  outline: 'none',
  transition: 'border-color 0.2s',
  resize: 'vertical' as const,
};

export const lbl: CSSProperties = {
  display: 'block',
  color: 'rgba(255,255,255,0.4)',
  fontSize: '0.72rem',
  marginBottom: '0.3rem',
  fontWeight: 500,
  letterSpacing: '0.04em',
  textTransform: 'uppercase' as const,
};

// ── Interfaces ───────────────────────────────────────────────────────────────

export interface Lead {
  id: string;
  company_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  city: string | null;
  status: string;
  score: number | null;
  source: string | null;
  estimated_value: number | null;
  ai_summary: string | null;
  ai_tags: string[] | null;
  ai_next_action: string | null;
  notes: string | null;
  custom_fields: Record<string, unknown> | null;
  website_summary: string | null;
  website_title: string | null;
  website_description: string | null;
  website_text: string | null;
  social_links: Record<string, string> | null;
  email_draft: string | null;
  created_at: string;
  activity_count?: number;
}

export interface LeadActivity {
  id: string;
  type: string;
  title: string | null;
  content: string | null;
  metadata?: Record<string, unknown> | null;
  is_pinned: boolean;
  created_at: string;
  user_id: string | null;
}

// ── Dummy Data ───────────────────────────────────────────────────────────────

export const DUMMY_CF = {
  company_type: 'B2B',
  industry: 'Design',
  company_size: 'Micro <10',
  budget_estimate: '8.000 EUR',
  annual_revenue: '—',
  employee_count: 5,
  lead_quality: 'durchschnittlich',
  linkedin_url: 'https://linkedin.com/in/anna-weber',
  score_breakdown: { kontakt_vertrauen: 26, kaufbereitschaft: 27, unternehmensfit: 9, abzuege: -19 },
  strengths: ['Budget von 8.000 EUR genannt', 'Firmen-E-Mail vorhanden', 'Gültige Telefonnummer'],
  concerns: ['Website nicht erreichbar', 'Nachricht nur 9 Wörter'],
  red_flags: [] as string[],
  is_company_email: true,
  has_valid_phone: true,
  website_loaded: false,
  message_quality: 'minimal',
  source_quality: 'mittel (Website-Besucher)',
  normalized_phone: '+49 30 9876543',
  contact_in_hours: 4,
  is_free_email: false,
  is_disposable_email: false,
  website_matches_email: false,
};

export const DUMMY_ACTIVITIES = [
  {
    id: '1',
    type: 'task',
    title: 'HOT LEAD — Sofort anrufen!',
    content: 'Website manuell prüfen, dann Telefonat führen um Projektdetails und Unternehmen zu validieren.',
    created_at: '2026-03-28T16:41:00Z',
    is_pinned: true,
    user_id: null,
  },
  {
    id: '2',
    type: 'ai_analysis',
    title: 'KI-Scoring abgeschlossen',
    content:
      'Score: 44/100. Website nicht erreichbar macht Unternehmensvalidierung unmöglich. Sehr kurze Nachricht deutet auf wenig Engagement hin.',
    created_at: '2026-03-28T16:41:00Z',
    is_pinned: false,
    user_id: null,
  },
  {
    id: '3',
    type: 'form_submit',
    title: 'Lead via Website eingegangen',
    content: 'Wir suchen KI-Automatisierung für unser CRM. Budget 8.000 EUR.',
    created_at: '2026-03-28T16:20:00Z',
    is_pinned: false,
    user_id: null,
  },
];

// ── Status constants ─────────────────────────────────────────────────────────

export const STATUS_LABELS: Record<string, string> = {
  new: 'Neu',
  contacted: 'Kontaktiert',
  qualified: 'Qualifiziert',
  proposal: 'Angebot',
  won: 'Gewonnen',
  lost: 'Verloren',
  archived: 'Archiviert',
};

export const STATUS_BG: Record<string, string> = {
  new: 'rgba(107,122,255,0.15)',
  contacted: 'rgba(59,130,246,0.15)',
  qualified: 'rgba(255,215,0,0.12)',
  proposal: 'rgba(255,107,53,0.15)',
  won: 'rgba(34,197,94,0.12)',
  lost: 'rgba(239,68,68,0.12)',
  archived: 'rgba(100,116,139,0.12)',
};

export const STATUS_FG: Record<string, string> = {
  new: '#6B7AFF',
  contacted: '#60a5fa',
  qualified: '#FFD700',
  proposal: '#FF6B35',
  won: '#22c55e',
  lost: '#ef4444',
  archived: '#888',
};

// ── Score helpers ─────────────────────────────────────────────────────────────

export function getScoreLabel(s: number | null) {
  if (s === null || s === undefined) return 'COLD';
  if (s >= 75) return 'HOT';
  if (s >= 45) return 'WARM';
  return 'COLD';
}

export function getScoreColor(s: number | null) {
  if (s === null || s === undefined) return { bg: 'rgba(107,122,255,0.15)', fg: '#6B7AFF' };
  if (s >= 75) return { bg: 'rgba(255,107,53,0.15)', fg: '#FF6B35' };
  if (s >= 45) return { bg: 'rgba(255,215,0,0.12)', fg: '#FFD700' };
  return { bg: 'rgba(107,122,255,0.15)', fg: '#6B7AFF' };
}

// ── Quality & activity style maps ────────────────────────────────────────────

export const LEAD_QUALITY_STYLE: Record<string, { bg: string; fg: string }> = {
  premium: { bg: 'rgba(245,158,11,0.15)', fg: '#f59e0b' },
  gut: { bg: 'rgba(34,197,94,0.12)', fg: '#22c55e' },
  durchschnittlich: { bg: 'rgba(107,114,128,0.15)', fg: '#9ca3af' },
  schwach: { bg: 'rgba(75,85,99,0.15)', fg: '#6b7280' },
  spam: { bg: 'rgba(239,68,68,0.12)', fg: '#ef4444' },
};

export const MSG_QUALITY_COLOR: Record<string, string> = {
  ausführlich: '#22c55e',
  gut: '#4ade80',
  minimal: '#FFD700',
  'zu kurz': '#FF6B35',
  leer: '#666',
  spam: '#ef4444',
};

export const ACTIVITY_ICON: Record<string, string> = {
  note: '✍',
  email: '✉',
  call: '☎',
  meeting: '◎',
  status_change: '↻',
  ai_analysis: '✦',
  score_update: '★',
  task: '✓',
  form_submit: '▸',
  default: '·',
};

export const ACTIVITY_ICONS: Record<string, string> = {
  note: '✍',
  email: '✉',
  call: '📞',
  meeting: '📅',
  task: '✓',
  form_submit: '📋',
  ai_analysis: '✦',
  status_change: '↻',
  score_update: '★',
  default: '·',
};

export const QUALITY_COLORS: Record<string, { bg: string; fg: string }> = {
  premium: { bg: 'rgba(74,222,128,0.15)', fg: '#4ade80' },
  gut: { bg: 'rgba(34,197,94,0.12)', fg: '#86efac' },
  durchschnittlich: { bg: 'rgba(234,179,8,0.12)', fg: '#fde047' },
  schwach: { bg: 'rgba(249,115,22,0.12)', fg: '#fb923c' },
  spam: { bg: 'rgba(239,68,68,0.15)', fg: '#f87171' },
};

export const MESSAGE_QUALITY_COLORS: Record<string, { bg: string; fg: string }> = {
  ausführlich: { bg: 'rgba(74,222,128,0.12)', fg: '#4ade80' },
  gut: { bg: 'rgba(34,197,94,0.10)', fg: '#86efac' },
  minimal: { bg: 'rgba(234,179,8,0.1)', fg: '#fde047' },
  'zu kurz': { bg: 'rgba(249,115,22,0.1)', fg: '#fb923c' },
  leer: { bg: 'rgba(100,116,139,0.12)', fg: '#94a3b8' },
  spam: { bg: 'rgba(239,68,68,0.12)', fg: '#f87171' },
};

export const SCORE_MAX: Record<string, number> = {
  kontakt_vertrauen: 30,
  kaufbereitschaft: 35,
  unternehmensfit: 25,
  abzuege: 45,
};

// ── Utility helpers ──────────────────────────────────────────────────────────

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'gerade eben';
  if (m < 60) return `vor ${m} Min.`;
  const h = Math.floor(m / 60);
  if (h < 24) return `vor ${h} Std.`;
  const d = Math.floor(h / 24);
  if (d < 7) return `vor ${d} Tag${d === 1 ? '' : 'en'}`;
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
}

export function copyToClipboard(text: string) {
  navigator.clipboard?.writeText(text).catch(() => {});
}
