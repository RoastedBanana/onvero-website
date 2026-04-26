import { createClient } from './supabase';

export type Lead = {
  id: string;
  tenantId: string;
  company: string;
  companyDescription?: string;
  phone?: string;
  website?: string;
  street?: string;
  city?: string;
  zip?: string;
  country?: string;
  state?: string;
  status: string;
  source?: string;
  fitScore: number;
  tier?: string | null;
  isExcluded?: boolean;
  exclusionReason?: string | null;
  tags: string[];
  industry?: string;
  companySize?: string;
  companyType?: string;
  summary?: string;
  strengths: string[];
  concerns: string[];
  nextAction?: string;
  coreServices: string[];
  targetCustomers?: string;
  painPoints: string[];
  automationPotential?: string;
  techStack: string[];
  growthSignals: string[];
  companySizeSignals?: string;
  toneOfVoice?: string;
  usp?: string;
  personalizationHooks: string[];
  automationOpportunities: string[];
  websiteHighlights?: string;
  partnerCustomerUrls: string[];
  linkedinUrl?: string;
  twitterUrl?: string;
  facebookUrl?: string;
  logoUrl?: string;
  primaryDomain?: string;
  foundedYear?: number | null;
  estimatedNumEmployees?: number | null;
  annualRevenue?: number | null;
  annualRevenuePrinted?: string;
  apolloOrganizationId?: string;
  apolloIndustry?: string;
  apolloKeywords: string[];
  apolloShortDescription?: string;
  technologyNames: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawApolloOrganization?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  followUpContext?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _archive?: any;
  cloudflareBlocked?: boolean;
  websiteScrapedAt?: string;
  aiScoredAt?: string;
  createdAt: string;
  updatedAt: string;
  // Compat: mapped from fitScore for UI components
  score?: number;
  name?: string;
  scoreBreakdown?: { unternehmensfit?: number; kontaktqualitaet?: number; entscheidungsposition?: number; kaufsignale?: number; abzuege?: number };
  // Legacy fields — no longer in DB, kept for UI compat
  firstName?: string;
  lastName?: string;
  email?: string | null;
  jobTitle?: string | null;
  emailDraft?: string | null;
  emailDraftSubject?: string | null;
  emailDraftBody?: string | null;
  aiSummary?: string | null;
  aiTags?: string[];
  aiNextAction?: string | null;
  aiSources?: { label: string; url: string; info?: string }[];
  redFlags?: string[];
  buyingSignals?: string[];
  googleRating?: number | null;
  googleReviews?: number | null;
  googleMapsUrl?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  organisation?: any;
  employmentHistory?: unknown[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  websiteData?: any;
  websiteSummary?: string;
  websiteTitle?: string;
  lastContactedAt?: string;
  statusUpdatedAt?: string;
  emailStatus?: string | null;
  newsArticles?: { title: string; source: string; days_ago: number }[];
  newsSignals?: string[];
  googleBusinessStatus?: string | null;
  googleMapsSignals?: string[];
  googleMapsMatchedName?: string | null;
  googleMapsMatchScore?: number | null;
  hasNewsSignal?: boolean;
  employeeCount?: number | null;
  budgetEstimate?: string;
  apolloId?: string;
  technologies?: string[];
};

export type LeadStats = {
  total: number;
  scored: number;
  avgScore: number;
  premium: number;
  warm: number;
  cold: number;
  byStatus: { new: number; contacted: number; qualified: number; lost: number };
  leadsByDay: { date: string; count: number }[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapLead(raw: any): Lead {
  const fitScore = raw.fit_score ?? 0;
  return {
    id: raw.id,
    tenantId: raw.tenant_id ?? '',
    company: raw.company_name ?? '',
    companyDescription: raw.company_description ?? undefined,
    phone: raw.phone ?? undefined,
    website: raw.website ?? undefined,
    street: raw.street ?? undefined,
    city: raw.city ?? undefined,
    zip: raw.zip ?? undefined,
    country: raw.country ?? undefined,
    state: raw.state ?? undefined,
    status: raw.status ?? 'new',
    source: raw.source ?? undefined,
    fitScore,
    tier: raw.tier ?? (fitScore >= 70 ? 'HOT' : fitScore >= 45 ? 'WARM' : 'COLD'),
    isExcluded: raw.is_excluded ?? false,
    exclusionReason: raw.exclusion_reason ?? undefined,
    tags: raw.tags ?? [],
    industry: raw.industry ?? raw.apollo_industry ?? undefined,
    companySize: raw.company_size ?? undefined,
    companyType: raw.company_type ?? undefined,
    summary: raw.summary ?? undefined,
    strengths: raw.strengths ?? [],
    concerns: raw.concerns ?? [],
    nextAction: raw.next_action ?? undefined,
    coreServices: raw.core_services ?? [],
    targetCustomers: raw.target_customers ?? undefined,
    painPoints: raw.pain_points ?? [],
    automationPotential: raw.automation_potential ?? undefined,
    techStack: raw.tech_stack ?? [],
    growthSignals: raw.growth_signals ?? [],
    companySizeSignals: raw.company_size_signals ?? undefined,
    toneOfVoice: raw.tone_of_voice ?? undefined,
    usp: raw.usp ?? undefined,
    personalizationHooks: raw.personalization_hooks ?? [],
    automationOpportunities: raw.automation_opportunities ?? [],
    websiteHighlights: raw.website_highlights ?? undefined,
    partnerCustomerUrls: raw.partner_customer_urls ?? [],
    linkedinUrl: raw.linkedin_url ?? undefined,
    twitterUrl: raw.twitter_url ?? undefined,
    facebookUrl: raw.facebook_url ?? undefined,
    logoUrl: raw.logo_url ?? undefined,
    primaryDomain: raw.primary_domain ?? undefined,
    foundedYear: raw.founded_year ?? null,
    estimatedNumEmployees: raw.estimated_num_employees ?? null,
    annualRevenue: raw.annual_revenue ?? null,
    annualRevenuePrinted: raw.annual_revenue_printed ?? undefined,
    apolloOrganizationId: raw.apollo_organization_id ?? undefined,
    apolloIndustry: raw.apollo_industry ?? undefined,
    apolloKeywords: raw.apollo_keywords ?? [],
    apolloShortDescription: raw.apollo_short_description ?? undefined,
    technologyNames: raw.technology_names ?? [],
    rawApolloOrganization: raw.raw_apollo_organization ?? undefined,
    followUpContext: raw.follow_up_context ?? undefined,
    _archive: raw._archive ?? undefined,
    cloudflareBlocked: raw.cloudflare_blocked ?? false,
    websiteScrapedAt: raw.website_scraped_at ?? undefined,
    aiScoredAt: raw.ai_scored_at ?? undefined,
    createdAt: raw.created_at ?? '',
    updatedAt: raw.updated_at ?? '',
    // Compat fields
    score: fitScore,
    name: raw.company_name ?? '',
    firstName: '',
    lastName: '',
    email: null,
    jobTitle: null,
    emailDraft: null,
    emailDraftSubject: null,
    emailDraftBody: null,
    aiSummary: raw.summary ?? null,
    aiTags: raw.tags ?? [],
    aiNextAction: raw.next_action ?? null,
    aiSources: [],
    redFlags: [],
    buyingSignals: [],
    googleRating: null,
    googleReviews: null,
    googleMapsUrl: null,
    organisation: null,
    employmentHistory: [],
    websiteData: null,
    websiteSummary: undefined,
    websiteTitle: undefined,
    lastContactedAt: undefined,
  };
}

export function computeStats(leads: Lead[]): LeadStats {
  const total = leads.length;
  const scored = leads.filter((l) => l.fitScore > 0).length;
  const avgScore = total > 0 ? Math.round(leads.reduce((s, l) => s + l.fitScore, 0) / total) : 0;
  const premium = leads.filter((l) => l.fitScore >= 70).length;
  const warm = leads.filter((l) => l.fitScore >= 45 && l.fitScore < 70).length;
  const cold = leads.filter((l) => l.fitScore < 45).length;

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

  return { total, scored, avgScore, premium, warm, cold, byStatus, leadsByDay: days };
}

export async function updateLeadStatus(id: string, status: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('leads')
    .update({ status })
    .eq('id', id);
  if (error) throw error;
}
