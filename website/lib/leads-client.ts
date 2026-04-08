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
  employmentHistory?: EmploymentEntry[];
  organisation?: Organisation | null;
  isExcluded?: boolean;
  exclusionReason?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  websiteData?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  followUpContext?: any;
};

export type Organisation = {
  name?: string | null;
  websiteUrl?: string | null;
  primaryDomain?: string | null;
  logoUrl?: string | null;
  industry?: string | null;
  estimatedNumEmployees?: number | null;
  foundedYear?: number | null;
  shortDescription?: string | null;
  seoDescription?: string | null;
  annualRevenue?: number | null;
  annualRevenuePrinted?: string | null;
  totalFunding?: number | null;
  totalFundingPrinted?: string | null;
  latestFundingStage?: string | null;
  latestFundingRoundDate?: string | null;
  publiclyTradedSymbol?: string | null;
  publiclyTradedExchange?: string | null;
  marketCap?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  street?: string | null;
  postalCode?: string | null;
  phone?: string | null;
  linkedinUrl?: string | null;
  twitterUrl?: string | null;
  facebookUrl?: string | null;
  blogUrl?: string | null;
  alexaRanking?: number | null;
  technologies?: string[];
  keywords?: string[];
  industries?: string[];
  secondaryIndustries?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw?: any;
};

export type EmploymentEntry = {
  name: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
  current: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeOrganisation(raw: any): Organisation | null {
  if (!raw) return null;
  let o = raw;
  if (typeof raw === 'string') {
    try {
      o = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (typeof o !== 'object') return null;
  const tech = Array.isArray(o.technologies)
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      o.technologies.map((t: any) => (typeof t === 'string' ? t : (t?.name ?? t?.uid ?? ''))).filter(Boolean)
    : Array.isArray(o.current_technologies)
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        o.current_technologies.map((t: any) => t?.name ?? '').filter(Boolean)
      : [];
  return {
    name: o.name ?? null,
    websiteUrl: o.website_url ?? o.websiteUrl ?? null,
    primaryDomain: o.primary_domain ?? o.domain ?? null,
    logoUrl: o.logo_url ?? o.logoUrl ?? null,
    industry: o.industry ?? null,
    estimatedNumEmployees: o.estimated_num_employees ?? o.num_employees ?? null,
    foundedYear: o.founded_year ?? null,
    shortDescription: o.short_description ?? null,
    seoDescription: o.seo_description ?? null,
    annualRevenue: o.annual_revenue ?? null,
    annualRevenuePrinted: o.annual_revenue_printed ?? null,
    totalFunding: o.total_funding ?? null,
    totalFundingPrinted: o.total_funding_printed ?? null,
    latestFundingStage: o.latest_funding_stage ?? null,
    latestFundingRoundDate: o.latest_funding_round_date ?? null,
    publiclyTradedSymbol: o.publicly_traded_symbol ?? null,
    publiclyTradedExchange: o.publicly_traded_exchange ?? null,
    marketCap: o.market_cap ?? null,
    city: o.city ?? null,
    state: o.state ?? null,
    country: o.country ?? null,
    street: o.street_address ?? o.raw_address ?? null,
    postalCode: o.postal_code ?? null,
    phone: o.phone ?? o.sanitized_phone ?? null,
    linkedinUrl: o.linkedin_url ?? null,
    twitterUrl: o.twitter_url ?? null,
    facebookUrl: o.facebook_url ?? null,
    blogUrl: o.blog_url ?? null,
    alexaRanking: o.alexa_ranking ?? null,
    technologies: tech,
    keywords: Array.isArray(o.keywords) ? o.keywords : [],
    industries: Array.isArray(o.industries) ? o.industries : [],
    secondaryIndustries: Array.isArray(o.secondary_industries) ? o.secondary_industries : [],
    raw: o,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeEmployment(raw: any): EmploymentEntry[] {
  if (!raw) return [];
  let arr = raw;
  if (typeof raw === 'string') {
    try {
      arr = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(arr)) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return arr.map((e: any) => {
    const current = e.current === true || e.current === 'true' || !!e.is_current;
    return {
      name: e.name ?? e.organization_name ?? e.company ?? e.organization ?? '',
      title: e.title ?? e.position ?? e.role ?? '',
      startDate: e.start_date ?? e.startDate ?? e.from ?? null,
      endDate: e.end_date ?? e.endDate ?? e.to ?? null,
      current,
    };
  });
}

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
    strengths: raw.strengths ?? cf.strengths ?? [],
    redFlags: raw.red_flags ?? cf.red_flags ?? [],
    concerns: raw.weaknesses ?? raw.concerns ?? cf.weaknesses ?? cf.concerns ?? [],
    scoreBreakdown: cf.score_breakdown,
    nextAction: raw.ai_next_action ?? cf.next_action,
    aiSources: raw.ai_sources ?? [],
    googleRating: raw.google_rating ?? cf.google_rating ?? null,
    googleReviews: raw.google_reviews ?? cf.google_reviews ?? null,
    googleBusinessStatus: cf.google_business_status ?? null,
    googleMapsUrl: raw.google_maps_url ?? cf.google_maps_url ?? null,
    googleMapsMatchedName: cf.google_maps_matched_name ?? null,
    googleMapsSignals: cf.google_maps_signals ?? [],
    newsSignals: cf.news_signals ?? [],
    newsArticles: cf.news_articles ?? [],
    hasNewsSignal: cf.has_news_signal ?? false,
    emailStatus: cf.email_status ?? null,
    buyingSignals: cf.buying_signals ?? [],
    tier: cf.tier ?? (score >= 70 ? 'HOT' : score >= 45 ? 'WARM' : 'COLD'),
    googleMapsMatchScore: cf.google_maps?.match_score ?? null,
    source: raw.source ?? null,
    employmentHistory: normalizeEmployment(raw.employment_history ?? cf.employment_history),
    organisation: normalizeOrganisation(raw.organisation ?? raw.organization ?? cf.organisation),
    isExcluded: raw.is_excluded ?? false,
    exclusionReason: raw.exclusion_reason ?? null,
    websiteData: raw.website_data ?? null,
    followUpContext: raw.follow_up_context ?? null,
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
