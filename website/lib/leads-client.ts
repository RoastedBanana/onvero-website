import { createClient } from './supabase';

export type ScoreBreakdown = {
  unternehmensfit?: number;
  kontaktqualitaet?: number;
  entscheidungsposition?: number;
  kaufsignale?: number;
  abzuege?: number;
};

export type Lead = {
  id: string;
  company: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  city?: string;
  country?: string;
  status: string;
  score: number;
  industry?: string;
  notes?: string;
  aiSummary?: string;
  aiTags: string[];
  aiNextAction?: string;
  aiScoredAt?: string;
  emailDraft?: string;
  emailDraftSubject?: string;
  websiteSummary?: string;
  websiteTitle?: string;
  lastContactedAt?: string;
  statusUpdatedAt?: string;
  createdAt: string;
  apolloId?: string;
  jobTitle?: string;
  employeeCount?: number;
  budgetEstimate?: string;
  linkedinUrl?: string;
  technologies: string[];
  strengths: string[];
  redFlags: string[];
  concerns: string[];
  scoreBreakdown?: ScoreBreakdown;
  nextAction?: string;
  aiSources?: { label: string; url: string; info: string }[];
  googleRating?: number | null;
  googleReviews?: number | null;
  googleBusinessStatus?: string | null;
  googleMapsUrl?: string | null;
  googleMapsMatchedName?: string | null;
  googleMapsSignals?: string[];
  newsSignals?: string[];
  newsArticles?: { title: string; source: string; days_ago: number }[];
  hasNewsSignal?: boolean;
  emailStatus?: string | null;
  buyingSignals?: string[];
  tier?: string | null;
  googleMapsMatchScore?: number | null;
  source?: string | null;
};

export type LeadStats = {
  total: number;
  scored: number;
  avgScore: number;
  premium: number;
  warm: number;
  cold: number;
  withEmail: number;
  byStatus: { new: number; contacted: number; qualified: number; lost: number };
  leadsByDay: { date: string; count: number }[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapLead(raw: any): Lead {
  const cf = raw.custom_fields ?? {};
  const score = raw.score ?? 0;
  return {
    id: raw.id,
    company: raw.company_name ?? '',
    firstName: raw.first_name ?? '',
    lastName: raw.last_name ?? '',
    name: [raw.first_name, raw.last_name].filter(Boolean).join(' '),
    email: raw.email ?? '',
    phone: raw.phone ?? cf.normalized_phone,
    website: raw.website,
    city: raw.city,
    country: raw.country,
    status: raw.status ?? 'new',
    score,
    industry: cf.industry_de ?? cf.industry ?? raw.industry,
    notes: raw.notes,
    aiSummary: raw.ai_summary,
    aiTags: raw.ai_tags ?? [],
    aiNextAction: raw.ai_next_action ?? cf.next_action,
    aiScoredAt: raw.ai_scored_at,
    emailDraft: raw.email_draft_body ?? raw.email_draft,
    emailDraftSubject: raw.email_draft_subject ?? raw.email_subject ?? null,
    websiteSummary: raw.website_summary,
    websiteTitle: raw.website_title,
    lastContactedAt: raw.last_contacted_at,
    statusUpdatedAt: raw.status_updated_at,
    createdAt: raw.created_at,
    apolloId: raw.apollo_id,
    jobTitle: cf.job_title,
    employeeCount: cf.employee_count,
    budgetEstimate: cf.budget_estimate,
    linkedinUrl: cf.linkedin_url,
    technologies: cf.technologies ?? [],
    strengths: cf.strengths ?? [],
    redFlags: cf.red_flags ?? [],
    concerns: cf.concerns ?? [],
    scoreBreakdown: cf.score_breakdown,
    nextAction: raw.ai_next_action ?? cf.next_action,
    aiSources: raw.ai_sources ?? [],
    googleRating: cf.google_rating ?? null,
    googleReviews: cf.google_reviews ?? null,
    googleBusinessStatus: cf.google_business_status ?? null,
    googleMapsUrl: cf.google_maps_url ?? null,
    googleMapsMatchedName: cf.google_maps_matched_name ?? null,
    googleMapsSignals: cf.google_maps_signals ?? [],
    newsSignals: cf.news_signals ?? [],
    newsArticles: cf.news_articles ?? [],
    hasNewsSignal: cf.has_news_signal ?? false,
    emailStatus: cf.email_status ?? null,
    buyingSignals: cf.buying_signals ?? [],
    tier: cf.tier ?? null,
    googleMapsMatchScore: cf.google_maps?.match_score ?? null,
    source: raw.source ?? null,
  };
}

export function computeStats(leads: Lead[]): LeadStats {
  const total = leads.length;
  const scored = leads.filter((l) => l.score > 0).length;
  const avgScore = total > 0 ? Math.round(leads.reduce((s, l) => s + l.score, 0) / total) : 0;
  const premium = leads.filter((l) => l.score >= 70).length;
  const warm = leads.filter((l) => l.score >= 45 && l.score < 70).length;
  const cold = leads.filter((l) => l.score < 45).length;
  const withEmail = leads.filter((l) => l.email).length;

  const byStatus = { new: 0, contacted: 0, qualified: 0, lost: 0 };
  for (const l of leads) {
    if (l.status in byStatus) byStatus[l.status as keyof typeof byStatus]++;
  }

  const now = new Date();
  const days: { date: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const count = leads.filter((l) => l.createdAt?.startsWith(dateStr)).length;
    days.push({ date: dateStr, count });
  }

  return { total, scored, avgScore, premium, warm, cold, withEmail, byStatus, leadsByDay: days };
}

export async function updateLeadStatus(id: string, status: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('leads')
    .update({ status, last_contacted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}
