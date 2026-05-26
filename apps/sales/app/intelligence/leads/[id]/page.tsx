'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { useParams, useRouter } from 'next/navigation';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Globe,
  Phone,
  ChevronDown,
  Mail,
  Linkedin,
  ExternalLink,
  Copy,
  Check,
  X,
  Zap,
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Info,
  FileText,
  BarChart2,
  Star,
} from 'lucide-react';
import { useTheme, colors } from '../../layout';

// ─── Types ────────────────────────────────────────────────────────────────────

type LeadStatus = 'hot' | 'warm' | 'cold';
type ActiveTab = 'info' | 'signale' | 'finanzen' | 'kontakte' | 'outbound' | 'alle';

interface Contact {
  name: string;
  role: string;
  linkedin?: string;
  email?: string;
  phone?: string;
  source: 'linkedin' | 'openregister' | 'salesnavigator' | 'manual' | 'website';
}

interface ReviewEntry {
  score: number;
  platform: string;
  count?: number;
}

interface LeadDetail {
  id: string;
  name: string;
  city: string;
  industry: string;
  initials: string;
  color: string;
  logo_url?: string;
  profile_image_url?: string;
  score: number;
  scoreReason: string;
  fit: number;
  volume: number;
  timing: number;
  status: LeadStatus;
  next_action?: string;
  email_draft_subject?: string;
  email_draft_body?: string;
  // Firmographics
  founded?: string;
  employees?: string;
  employeeTrend?: 'up' | 'down' | 'stable';
  employeeHistory?: string;
  revenue?: string;
  website?: string;
  shopSystem?: string;
  phone?: string;
  facebook?: string;
  instagramFollowers?: number;
  facebookFollowers?: number;
  instagramPosts?: number;
  companyType?: string[];
  branchCode?: string;
  branchDescription?: string;
  representative?: string;
  // Growth / Health
  greenflags: string[];
  redflags: string[];
  financials?: string;
  lastCEOChange?: string;
  // Reviews — new array format takes priority over legacy individual fields
  reviews?: ReviewEntry[];
  trustpilot?: number;
  google?: number;
  kununu?: number;
  openMentions?: number;
  // Updates
  lastPosted?: string;
  updatesList: { text: string; time: string; source: string }[];
  aiUpdateSummary?: string;
  // Operations (AI Layer 2)
  coreServices?: string[];
  targetCustomers?: string[];
  usp?: string[];
  partners?: string[];
  openPositions?: string[];
  personalizationHooks?: string[];
  customFields?: { key: string; value: string }[];
  // Shipping estimate
  shippingEstimate?: {
    disclaimer: string;
    lines: { label: string; value: string; note?: string }[];
    total: string;
    assessment: string;
    assessmentLevel: 'low' | 'medium' | 'high';
  };
  // Outbound
  contacts: Contact[];
  toneOfVoice?: string;
  companyCharacter?: string;
  pitch: string;
  proposedOffer?: string;
  enriched: { source: string; status: 'active' | 'partial' | 'missing' }[];
  // Extra enriched fields (set by mapDbLead)
  _empHistory?: { year: number; employees: number }[];
  _profitHistory?: {
    year: number;
    balance_sheet_total_eur?: number;
    equity_eur?: number;
    equity_ratio_pct?: number;
    cash_eur?: number;
    liabilities_eur?: number;
  }[];
  _financialsHistory?: {
    year: number;
    balance_sheet_total_eur?: number;
    equity_eur?: number;
    equity_ratio_pct?: number;
    cash_eur?: number;
    liabilities_eur?: number;
    employees?: number;
    revenue_eur?: number;
    net_income_eur?: number;
  }[];
  fin_health_score?: number;
  fin_health_label?: string;
  fin_risk_flags?: { flag: string; severity?: string; source?: string; evidence?: string }[];
  fin_opportunity_flags?: { flag: string; source?: string; evidence?: string }[];
  fin_analysis_summary?: string;
  fin_estimated_revenue_eur?: number;
  fin_balance_sheet_trend?: string;
  fin_equity_trend?: string;
  fin_revenue_trend?: string;
  fin_employee_trend?: string;
  fin_years_of_data?: number;
  fin_latest_date?: string;
  // Management & Führung
  mgmt_stability_score?: number;
  mgmt_stability_label?: string;
  mgmt_is_founder_led?: boolean;
  mgmt_has_prokura?: boolean;
  mgmt_current_director_count?: number;
  mgmt_total_changes?: number;
  mgmt_avg_tenure_months?: number;
  mgmt_last_change_type?: string;
  mgmt_analysis_summary?: string;
  mgmt_risk_flags?: { flag: string; severity?: string; source?: string; evidence?: string }[];
  mgmt_opportunity_flags?: { flag: string; source?: string; evidence?: string }[];
  mgmt_buying_signals?: { signal: string; evidence?: string; priority?: string }[];
  _rawGreenFlags?: { flag: string; source?: string }[];
  _rawRedFlags?: { flag: string; source?: string; severity?: string }[];
  lead_summary?: string;
  tech_stack?: string[];
  tech_maturity_label?: string;
  legal_form?: string;
  hrb_number?: string;
  court?: string;
  // URLs
  instagram_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  youtube_url?: string;
  tiktok_url?: string;
  xing_url?: string;
  // Review URLs
  google_reviews_url?: string;
  trustpilot_url?: string;
  kununu_url?: string;
  provenexpert_url?: string;
  provenexpert_rating?: number;
  provenexpert_review_count?: number;
  google_review_count?: number;
  trustpilot_review_count?: number;
  kununu_review_count?: number;
  // LinkedIn enriched
  li_followers?: number;
  li_company_size?: string;
  // Social aggregate
  social_total_followers?: number;
  social_primary_platform?: string;
  social_platforms_active?: string[];
  social_posting_frequency?: string;
  social_days_since_last_post?: number;
  social_avg_likes_per_post?: number;
  social_engagement_rate_pct?: number;
  social_total_posts_scraped?: number;
  social_hashtags_used?: string[];
  social_video_pct?: number;
  social_unique_commenters?: number;
  social_health_score?: number;
  social_health_label?: string;
  social_analysis_summary?: string;
  // Social intelligence (JSONB arrays)
  social_content_themes?: { theme: string; frequency: string; example_post_url?: string }[];
  social_personalization_hooks?: {
    hook: string;
    platform: string;
    recency_days?: number;
    source_post_url?: string;
    suggested_opener?: string;
  }[];
  social_buying_signals?: { signal: string; evidence?: string; priority?: string; detected_in_post_url?: string }[];
  social_risk_flags?: { flag: string; severity?: string; source?: string; evidence?: string }[];
  social_opportunity_flags?: { flag: string; source?: string; evidence?: string }[];
  social_communication_style?: {
    tone?: string;
    language?: string;
    formality?: string;
    style_note?: string;
    uses_emojis?: boolean;
  };
  social_warm_intro_candidates?: {
    name: string;
    reason?: string;
    linkedin_url?: string;
    relationship_signal?: string;
  }[];
  social_post_calendar?: {
    date: string;
    likes?: number;
    hashtags?: string[];
    platform: string;
    post_url?: string;
    content_type?: string;
    comments_count?: number;
    caption_preview?: string;
  }[];
  // Reviews module
  reviews_overall_score?: number;
  reviews_health_score?: number;
  reviews_health_label?: string;
  reviews_google_rating?: number;
  reviews_google_count?: number;
  reviews_google_distribution?: Record<string, number>;
  reviews_trustpilot_rating?: number;
  reviews_trustpilot_count?: number;
  reviews_trustpilot_claimed?: boolean;
  reviews_trustpilot_distribution?: Record<string, number>;
  reviews_kununu_rating?: number;
  reviews_kununu_count?: number;
  reviews_kununu_recommendation_pct?: number;
  reviews_kununu_culture_style?: string;
  reviews_kununu_best_factors?: string[];
  reviews_kununu_worst_factors?: string[];
  reviews_total_count?: number;
  reviews_owner_response_rate?: number;
  reviews_latest_date?: string;
  reviews_platforms_found?: string[];
  reviews_sentiment_trend?: string;
  reviews_analysis_summary?: string;
  reviews_top_complaints?: {
    topic: string;
    platform?: string;
    severity?: string;
    frequency?: string;
    example_quote?: string;
  }[];
  reviews_top_praise?: { topic: string; platform?: string; frequency?: string; example_quote?: string }[];
  reviews_shipping_complaints?: {
    topic: string;
    platform?: string;
    severity?: string;
    frequency?: string;
    example_quote?: string;
  }[];
  reviews_outreach_hooks?: {
    hook: string;
    pain_point?: string;
    source_platform?: string;
    suggested_opener?: string;
    based_on_review_count?: number;
  }[];
  reviews_competitor_mentions?: { name?: string; context?: string; platform?: string; url?: string }[];
  reviews_response_style?: {
    tone?: string;
    responds?: boolean;
    avg_response_time?: string;
    response_rate_pct?: number;
    outreach_implication?: string;
  };
  reviews_internal_signals?: { signal: string; evidence?: string; outreach_relevance?: string }[];
  reviews_best_contact_timing?: string;
  reviews_employer_brand_score?: number;
  reviews_risk_flags?: { flag: string; source?: string; evidence?: string; severity?: string; url?: string }[];
  reviews_opportunity_flags?: { flag: string; source?: string; evidence?: string; url?: string }[];
  reviews_analyzed_at?: string;
  // Finance flat columns (latest values)
  fin_salaries_eur?: number;
  fin_capital_eur?: number;
  fin_net_income_eur?: number;
  fin_estimated_revenue_method?: string;
  // OR raw data
  or_purpose?: string;
  or_prokuristen?: { name: string; role?: string; since?: string }[];
  or_former_directors?: { name: string; role?: string; since?: string; until?: string }[];
  // Social extras
  instagramFollowing?: number;
  social_top_commenters?: { name?: string; handle?: string; comment_count?: number; platform?: string }[];
  social_upcoming_events?: { title?: string; date?: string; platform?: string; source_url?: string }[];
  li_similar_companies?: { name?: string; url?: string; industry?: string; size?: string }[];
  // Address
  street?: string;
  zip?: string;
  registeredSeat?: string;
  businessModel?: string;
  // Web analysis
  web_analysis_summary?: string;
  web_value_proposition?: string;
  web_has_careers_page?: boolean;
  web_has_shop?: boolean;
  web_open_positions_count?: number;
  web_memberships?: string[];
  web_certifications?: string[];
  web_partnerships?: string[];
  web_target_market?: string;
  web_industry_position?: string;
  web_buying_signals?: { signal: string; evidence?: string; priority?: string; source_url?: string }[];
  web_outreach_hooks?: { hook: string; source_page?: string; suggested_opener?: string }[];
  web_recent_news?: { headline: string; source_url?: string; date_approx?: string; significance?: string }[];
}

// ─── DB mapper ───────────────────────────────────────────────────────────────

function mapDbLead(d: Record<string, unknown>): LeadDetail {
  const financialsHistory = Array.isArray(d.or_financials_history)
    ? (d.or_financials_history as Record<string, unknown>[])
        .map((p) => ({
          year: p.year as number,
          balance_sheet_total_eur: p.balance_sheet_total_eur as number | undefined,
          equity_eur: p.equity_eur as number | undefined,
          equity_ratio_pct: p.equity_ratio_pct as number | undefined,
          cash_eur: p.cash_eur as number | undefined,
          liabilities_eur: p.liabilities_eur as number | undefined,
          employees: p.employees as number | undefined,
          revenue_eur: p.revenue_eur as number | undefined,
          net_income_eur: p.net_income_eur as number | undefined,
        }))
        .sort((a, b) => a.year - b.year)
    : [];

  const profitHistory = Array.isArray(d.or_profit_history)
    ? (d.or_profit_history as Record<string, unknown>[])
        .map((p) => ({
          year: p.year as number,
          balance_sheet_total_eur: p.balance_sheet_total_eur as number | undefined,
          equity_eur: p.equity_eur as number | undefined,
          equity_ratio_pct: p.equity_ratio_pct as number | undefined,
          cash_eur: p.cash_eur as number | undefined,
          liabilities_eur: p.liabilities_eur as number | undefined,
        }))
        .sort((a, b) => a.year - b.year)
    : [];

  const empHistory = Array.isArray(d.or_employees_history)
    ? (d.or_employees_history as { year: number; employees: number }[])
    : [];
  const sorted = [...empHistory].sort((a, b) => b.year - a.year);
  const latest = sorted[0]?.employees;
  const prev = sorted[1]?.employees;
  const empTrend: 'up' | 'down' | 'stable' | undefined =
    latest != null && prev != null ? (latest > prev ? 'up' : latest < prev ? 'down' : 'stable') : undefined;
  const empHistoryStr =
    sorted.length >= 2
      ? sorted
          .slice(0, 5)
          .map((e) => `${e.year}: ${e.employees}`)
          .join(' · ')
      : undefined;

  const greenflags: string[] = Array.isArray(d.green_flags)
    ? (d.green_flags as { flag?: string }[]).map((g) => (typeof g === 'string' ? g : (g.flag ?? ''))).filter(Boolean)
    : Array.isArray(d.strengths)
      ? (d.strengths as string[])
      : [];

  const redflags: string[] = Array.isArray(d.red_flags)
    ? (d.red_flags as { flag?: string }[]).map((r) => (typeof r === 'string' ? r : (r.flag ?? ''))).filter(Boolean)
    : Array.isArray(d.concerns)
      ? (d.concerns as string[])
      : [];

  const reviewsArr: ReviewEntry[] = [];
  if (d.google_rating)
    reviewsArr.push({
      score: Number(d.google_rating),
      platform: 'Google',
      count: d.google_review_count as number | undefined,
    });
  if (d.kununu_rating) reviewsArr.push({ score: Number(d.kununu_rating), platform: 'Kununu' });
  if (d.trustpilot_rating) reviewsArr.push({ score: Number(d.trustpilot_rating), platform: 'Trustpilot' });
  if (d.provenexpert_rating) reviewsArr.push({ score: Number(d.provenexpert_rating), platform: 'ProvenExpert' });

  const contacts: Contact[] = [];
  const dirs = Array.isArray(d.managing_directors) ? (d.managing_directors as string[]) : [];
  dirs.forEach((name) => contacts.push({ name, role: 'Geschäftsführer', source: 'openregister' }));
  if (Array.isArray(d.decision_makers)) {
    (
      d.decision_makers as { name?: string; role?: string; title?: string; email?: string; linkedin_url?: string }[]
    ).forEach((dm) => {
      if (dm.name && !contacts.find((c) => c.name === dm.name)) {
        contacts.push({
          name: dm.name,
          role: dm.role ?? dm.title ?? 'Entscheider',
          email: dm.email,
          linkedin: dm.linkedin_url,
          source: 'salesnavigator',
        });
      }
    });
  }

  const enriched: LeadDetail['enriched'] = [];
  if (d.linkedin_url) enriched.push({ source: 'LinkedIn', status: 'active' });
  if (d.openregister_company_id) enriched.push({ source: 'Openregister', status: 'active' });
  if (d.instagram_url) enriched.push({ source: 'Instagram', status: 'active' });
  if (d.facebook_url) enriched.push({ source: 'Facebook', status: 'active' });
  if (d.website) enriched.push({ source: 'Website', status: 'active' });
  if (enriched.length === 0) enriched.push({ source: 'Apollo', status: 'missing' });

  const tierRaw = ((d.tier ?? d.status ?? 'warm') as string).toLowerCase();
  const status: LeadStatus = tierRaw === 'hot' ? 'hot' : tierRaw === 'cold' ? 'cold' : 'warm';

  const palette = ['#4F46E5', '#10B981', '#F97316', '#7C3AED', '#0EA5E9', '#EF4444'];
  const nameStr = (d.company_name as string) || '';
  const hash = nameStr.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const color = palette[hash % palette.length];
  const initials =
    nameStr
      .split(' ')
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || '??';

  const growthSignals = Array.isArray(d.growth_signals) ? (d.growth_signals as string[]) : [];
  const updatesList = growthSignals.map((text) => ({ text, time: '', source: '' }));

  return {
    id: d.id as string,
    name: nameStr,
    city: (d.city as string) ?? '',
    industry: (d.industry as string) ?? '',
    initials,
    color,
    logo_url: (d.logo_url as string | undefined) ?? undefined,
    profile_image_url: (d.profile_image_url as string | undefined) ?? undefined,
    score: (d.lead_score as number) ?? 0,
    fit: (d.fit_score as number) ?? 0,
    volume: 0,
    timing: 0,
    scoreReason: (d.lead_score_reasoning as string) ?? '',
    status,
    next_action: d.next_action as string | undefined,
    email_draft_subject: d.email_draft_subject as string | undefined,
    email_draft_body: d.email_draft_body as string | undefined,
    founded: d.founded_year != null ? String(d.founded_year) : undefined,
    employees:
      d.num_employees != null ? String(d.num_employees) : (d.estimated_employees_scraped as string | undefined),
    employeeTrend: empTrend,
    employeeHistory: empHistoryStr,
    revenue:
      d.annual_revenue != null
        ? `${(Number(d.annual_revenue) / 1_000_000).toFixed(1)} Mio. €`
        : (d.estimated_revenue_scraped as string | undefined),
    website: d.website as string | undefined,
    phone: d.phone as string | undefined,
    facebook: d.facebook_url as string | undefined,
    instagramFollowers: d.instagram_followers as number | undefined,
    facebookFollowers: d.facebook_followers as number | undefined,
    instagramPosts: d.instagram_posts_count as number | undefined,
    companyType: [],
    branchCode: d.industry_code as string | undefined,
    branchDescription: d.industry as string | undefined,
    representative: dirs.join(', ') || undefined,
    greenflags,
    redflags,
    financials: d.financials_summary as string | undefined,
    reviews: reviewsArr.length > 0 ? reviewsArr : undefined,
    trustpilot: d.trustpilot_rating != null ? Number(d.trustpilot_rating) : undefined,
    google: d.google_rating != null ? Number(d.google_rating) : undefined,
    kununu: d.kununu_rating != null ? Number(d.kununu_rating) : undefined,
    updatesList,
    aiUpdateSummary: d.recent_events_summary as string | undefined,
    coreServices: Array.isArray(d.core_services) ? (d.core_services as string[]) : [],
    targetCustomers: d.target_customers ? [d.target_customers as string] : [],
    usp: d.usp ? [d.usp as string] : [],
    partners: Array.isArray(d.partners)
      ? (d.partners as unknown[])
          .map((p) => (typeof p === 'string' ? p : ((p as { name?: string }).name ?? '')))
          .filter(Boolean)
      : [],
    personalizationHooks: Array.isArray(d.personalization_hooks) ? (d.personalization_hooks as string[]) : [],
    toneOfVoice: d.tone_of_voice as string | undefined,
    pitch: (d.one_min_pitch as string) ?? '',
    proposedOffer: d.suggested_offer as string | undefined,
    contacts,
    enriched,
    customFields: (() => {
      if (Array.isArray(d.custom_fields)) return d.custom_fields as { key: string; value: string }[];
      if (d.custom_fields && typeof d.custom_fields === 'object')
        return Object.entries(d.custom_fields).map(([key, val]) => ({ key, value: String(val) }));
      return [];
    })(),
    _empHistory: sorted,
    _profitHistory: profitHistory,
    _financialsHistory: financialsHistory,
    fin_health_score: d.fin_health_score as number | undefined,
    fin_health_label: d.fin_health_label as string | undefined,
    fin_risk_flags: Array.isArray(d.fin_risk_flags)
      ? (d.fin_risk_flags as { flag: string; severity?: string; source?: string; evidence?: string }[])
      : [],
    fin_opportunity_flags: Array.isArray(d.fin_opportunity_flags)
      ? (d.fin_opportunity_flags as { flag: string; source?: string; evidence?: string }[])
      : [],
    fin_analysis_summary: d.fin_analysis_summary as string | undefined,
    fin_estimated_revenue_eur: d.fin_estimated_revenue_eur as number | undefined,
    fin_balance_sheet_trend: d.fin_balance_sheet_trend as string | undefined,
    fin_equity_trend: d.fin_equity_trend as string | undefined,
    fin_revenue_trend: d.fin_revenue_trend as string | undefined,
    fin_employee_trend: d.fin_employee_trend as string | undefined,
    fin_years_of_data: d.fin_years_of_data as number | undefined,
    fin_latest_date: d.fin_latest_date as string | undefined,
    mgmt_stability_score: d.mgmt_stability_score as number | undefined,
    mgmt_stability_label: d.mgmt_stability_label as string | undefined,
    mgmt_is_founder_led: d.mgmt_is_founder_led as boolean | undefined,
    mgmt_has_prokura: d.mgmt_has_prokura as boolean | undefined,
    mgmt_current_director_count: d.mgmt_current_director_count as number | undefined,
    mgmt_total_changes: d.mgmt_total_changes as number | undefined,
    mgmt_avg_tenure_months: d.mgmt_avg_tenure_months as number | undefined,
    mgmt_last_change_type: d.mgmt_last_change_type as string | undefined,
    mgmt_analysis_summary: d.mgmt_analysis_summary as string | undefined,
    mgmt_risk_flags: Array.isArray(d.mgmt_risk_flags)
      ? (d.mgmt_risk_flags as { flag: string; severity?: string; source?: string; evidence?: string }[])
      : [],
    mgmt_opportunity_flags: Array.isArray(d.mgmt_opportunity_flags)
      ? (d.mgmt_opportunity_flags as { flag: string; source?: string; evidence?: string }[])
      : [],
    mgmt_buying_signals: Array.isArray(d.mgmt_buying_signals)
      ? (d.mgmt_buying_signals as { signal: string; evidence?: string; priority?: string }[])
      : [],
    _rawGreenFlags: Array.isArray(d.green_flags) ? (d.green_flags as { flag: string; source?: string }[]) : [],
    _rawRedFlags: Array.isArray(d.red_flags)
      ? (d.red_flags as { flag: string; source?: string; severity?: string }[])
      : [],
    lead_summary: d.lead_summary as string | undefined,
    tech_stack: Array.isArray(d.tech_stack) ? (d.tech_stack as string[]) : [],
    tech_maturity_label: d.tech_maturity_label as string | undefined,
    legal_form: d.legal_form as string | undefined,
    hrb_number: d.hrb_number as string | undefined,
    court: d.court as string | undefined,
    instagram_url: d.instagram_url as string | undefined,
    linkedin_url: d.linkedin_url as string | undefined,
    twitter_url: d.twitter_url as string | undefined,
    youtube_url: d.youtube_url as string | undefined,
    tiktok_url: d.tiktok_url as string | undefined,
    xing_url: d.xing_url as string | undefined,
    google_reviews_url: d.google_reviews_url as string | undefined,
    trustpilot_url: d.trustpilot_url as string | undefined,
    kununu_url: d.kununu_url as string | undefined,
    provenexpert_url: d.provenexpert_url as string | undefined,
    provenexpert_rating: d.provenexpert_rating != null ? Number(d.provenexpert_rating) : undefined,
    provenexpert_review_count: d.provenexpert_review_count as number | undefined,
    google_review_count: d.google_review_count as number | undefined,
    trustpilot_review_count: d.trustpilot_review_count as number | undefined,
    kununu_review_count: d.kununu_review_count as number | undefined,
    li_followers: d.li_followers as number | undefined,
    li_company_size: d.li_company_size as string | undefined,
    social_total_followers: d.social_total_followers as number | undefined,
    social_primary_platform: d.social_primary_platform as string | undefined,
    social_platforms_active: Array.isArray(d.social_platforms_active)
      ? (d.social_platforms_active as string[])
      : undefined,
    social_posting_frequency: d.social_posting_frequency as string | undefined,
    social_days_since_last_post: d.social_days_since_last_post as number | undefined,
    social_avg_likes_per_post: d.social_avg_likes_per_post != null ? Number(d.social_avg_likes_per_post) : undefined,
    social_engagement_rate_pct: d.social_engagement_rate_pct != null ? Number(d.social_engagement_rate_pct) : undefined,
    social_total_posts_scraped: d.social_total_posts_scraped as number | undefined,
    social_hashtags_used: Array.isArray(d.social_hashtags_used) ? (d.social_hashtags_used as string[]) : undefined,
    social_video_pct: d.social_video_pct as number | undefined,
    social_unique_commenters: d.social_unique_commenters as number | undefined,
    social_health_score: d.social_health_score as number | undefined,
    social_health_label: d.social_health_label as string | undefined,
    social_analysis_summary: d.social_analysis_summary as string | undefined,
    social_content_themes: Array.isArray(d.social_content_themes)
      ? (d.social_content_themes as { theme: string; frequency: string; example_post_url?: string }[])
      : undefined,
    social_personalization_hooks: Array.isArray(d.social_personalization_hooks)
      ? (d.social_personalization_hooks as LeadDetail['social_personalization_hooks'])
      : undefined,
    social_buying_signals: Array.isArray(d.social_buying_signals)
      ? (d.social_buying_signals as LeadDetail['social_buying_signals'])
      : undefined,
    social_risk_flags: Array.isArray(d.social_risk_flags)
      ? (d.social_risk_flags as { flag: string; severity?: string; source?: string; evidence?: string }[])
      : undefined,
    social_opportunity_flags: Array.isArray(d.social_opportunity_flags)
      ? (d.social_opportunity_flags as { flag: string; source?: string; evidence?: string }[])
      : undefined,
    social_communication_style: d.social_communication_style as LeadDetail['social_communication_style'] | undefined,
    social_warm_intro_candidates: Array.isArray(d.social_warm_intro_candidates)
      ? (d.social_warm_intro_candidates as LeadDetail['social_warm_intro_candidates'])
      : undefined,
    social_post_calendar: Array.isArray(d.social_post_calendar)
      ? (d.social_post_calendar as LeadDetail['social_post_calendar'])
      : undefined,
    fin_salaries_eur: d.fin_salaries_eur != null ? Number(d.fin_salaries_eur) : undefined,
    fin_capital_eur: d.fin_capital_eur != null ? Number(d.fin_capital_eur) : undefined,
    fin_net_income_eur: d.fin_net_income_eur != null ? Number(d.fin_net_income_eur) : undefined,
    fin_estimated_revenue_method: d.fin_estimated_revenue_method as string | undefined,
    or_purpose: d.or_purpose as string | undefined,
    or_prokuristen: Array.isArray(d.or_prokuristen)
      ? (d.or_prokuristen as { name: string; role?: string; since?: string }[])
      : undefined,
    or_former_directors: Array.isArray(d.or_former_directors)
      ? (d.or_former_directors as { name: string; role?: string; since?: string; until?: string }[])
      : undefined,
    instagramFollowing: d.instagram_following as number | undefined,
    social_top_commenters: Array.isArray(d.social_top_commenters)
      ? (d.social_top_commenters as LeadDetail['social_top_commenters'])
      : undefined,
    social_upcoming_events: Array.isArray(d.social_upcoming_events)
      ? (d.social_upcoming_events as LeadDetail['social_upcoming_events'])
      : undefined,
    li_similar_companies: Array.isArray(d.li_similar_companies)
      ? (d.li_similar_companies as LeadDetail['li_similar_companies'])
      : undefined,
    reviews_overall_score: d.reviews_overall_score != null ? Number(d.reviews_overall_score) : undefined,
    reviews_health_score: d.reviews_health_score as number | undefined,
    reviews_health_label: d.reviews_health_label as string | undefined,
    reviews_google_rating: d.reviews_google_rating != null ? Number(d.reviews_google_rating) : undefined,
    reviews_google_count: d.reviews_google_count as number | undefined,
    reviews_google_distribution:
      d.reviews_google_distribution != null ? (d.reviews_google_distribution as Record<string, number>) : undefined,
    reviews_trustpilot_rating: d.reviews_trustpilot_rating != null ? Number(d.reviews_trustpilot_rating) : undefined,
    reviews_trustpilot_count: d.reviews_trustpilot_count as number | undefined,
    reviews_trustpilot_claimed: d.reviews_trustpilot_claimed as boolean | undefined,
    reviews_trustpilot_distribution:
      d.reviews_trustpilot_distribution != null
        ? (d.reviews_trustpilot_distribution as Record<string, number>)
        : undefined,
    reviews_kununu_rating: d.reviews_kununu_rating != null ? Number(d.reviews_kununu_rating) : undefined,
    reviews_kununu_count: d.reviews_kununu_count as number | undefined,
    reviews_kununu_recommendation_pct: d.reviews_kununu_recommendation_pct as number | undefined,
    reviews_kununu_culture_style: d.reviews_kununu_culture_style as string | undefined,
    reviews_kununu_best_factors: Array.isArray(d.reviews_kununu_best_factors)
      ? (d.reviews_kununu_best_factors as string[])
      : undefined,
    reviews_kununu_worst_factors: Array.isArray(d.reviews_kununu_worst_factors)
      ? (d.reviews_kununu_worst_factors as string[])
      : undefined,
    reviews_total_count: d.reviews_total_count as number | undefined,
    reviews_owner_response_rate: d.reviews_owner_response_rate as number | undefined,
    reviews_latest_date: d.reviews_latest_date as string | undefined,
    reviews_platforms_found: Array.isArray(d.reviews_platforms_found)
      ? (d.reviews_platforms_found as string[])
      : undefined,
    reviews_sentiment_trend: d.reviews_sentiment_trend as string | undefined,
    reviews_analysis_summary: d.reviews_analysis_summary as string | undefined,
    reviews_top_complaints: Array.isArray(d.reviews_top_complaints)
      ? (d.reviews_top_complaints as LeadDetail['reviews_top_complaints'])
      : undefined,
    reviews_top_praise: Array.isArray(d.reviews_top_praise)
      ? (d.reviews_top_praise as LeadDetail['reviews_top_praise'])
      : undefined,
    reviews_shipping_complaints: Array.isArray(d.reviews_shipping_complaints)
      ? (d.reviews_shipping_complaints as LeadDetail['reviews_shipping_complaints'])
      : undefined,
    reviews_outreach_hooks: Array.isArray(d.reviews_outreach_hooks)
      ? (d.reviews_outreach_hooks as LeadDetail['reviews_outreach_hooks'])
      : undefined,
    reviews_competitor_mentions: Array.isArray(d.reviews_competitor_mentions)
      ? (d.reviews_competitor_mentions as LeadDetail['reviews_competitor_mentions'])
      : undefined,
    reviews_response_style:
      d.reviews_response_style != null ? (d.reviews_response_style as LeadDetail['reviews_response_style']) : undefined,
    reviews_internal_signals: Array.isArray(d.reviews_internal_signals)
      ? (d.reviews_internal_signals as LeadDetail['reviews_internal_signals'])
      : undefined,
    reviews_best_contact_timing: d.reviews_best_contact_timing as string | undefined,
    reviews_employer_brand_score: d.reviews_employer_brand_score as number | undefined,
    reviews_risk_flags: Array.isArray(d.reviews_risk_flags)
      ? (d.reviews_risk_flags as LeadDetail['reviews_risk_flags'])
      : undefined,
    reviews_opportunity_flags: Array.isArray(d.reviews_opportunity_flags)
      ? (d.reviews_opportunity_flags as LeadDetail['reviews_opportunity_flags'])
      : undefined,
    reviews_analyzed_at: d.reviews_analyzed_at as string | undefined,
    street: d.street as string | undefined,
    zip: d.zip as string | undefined,
    registeredSeat: d.registered_seat as string | undefined,
    businessModel: d.business_model as string | undefined,
    web_analysis_summary: d.web_analysis_summary as string | undefined,
    web_value_proposition: d.web_value_proposition as string | undefined,
    web_has_careers_page: d.web_has_careers_page as boolean | undefined,
    web_has_shop: d.web_has_shop as boolean | undefined,
    web_open_positions_count: d.web_open_positions_count as number | undefined,
    web_memberships: Array.isArray(d.web_memberships) ? (d.web_memberships as string[]) : undefined,
    web_certifications: Array.isArray(d.web_certifications) ? (d.web_certifications as string[]) : undefined,
    web_partnerships: Array.isArray(d.web_partnerships) ? (d.web_partnerships as string[]) : undefined,
    web_target_market: d.web_target_market as string | undefined,
    web_industry_position: d.web_industry_position as string | undefined,
    web_buying_signals: Array.isArray(d.web_buying_signals)
      ? (d.web_buying_signals as { signal: string; evidence?: string; priority?: string; source_url?: string }[])
      : undefined,
    web_outreach_hooks: Array.isArray(d.web_outreach_hooks)
      ? (d.web_outreach_hooks as { hook: string; source_page?: string; suggested_opener?: string }[])
      : undefined,
    web_recent_news: Array.isArray(d.web_recent_news)
      ? (d.web_recent_news as { headline: string; source_url?: string; date_approx?: string; significance?: string }[])
      : undefined,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtEur(n: number | undefined): string | null {
  if (n == null) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} Mio. €`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K €`;
  return `${n} €`;
}

function fmtNum(n: number | undefined): string | null {
  if (n == null) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} Mio.`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function scoreColor(score: number): string {
  if (score >= 70) return '#10B981';
  if (score >= 45) return '#F97316';
  return '#EF4444';
}

function statusLabel(s: LeadStatus) {
  return s === 'hot' ? 'Hot' : s === 'warm' ? 'Warm' : 'Cold';
}

function statusBg(s: LeadStatus) {
  return s === 'hot' ? '#EF444420' : s === 'warm' ? '#F9731620' : '#94A3B820';
}

function statusFg(s: LeadStatus) {
  return s === 'hot' ? '#EF4444' : s === 'warm' ? '#F97316' : '#64748B';
}

function glassCard(c: ReturnType<typeof colors>, extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: c.bgCard,
    border: `1px solid ${c.border}`,
    borderRadius: 14,
    ...extra,
  };
}

function CopyButton({ text, c }: { text: string; c: ReturnType<typeof colors> }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 4,
        color: c.textMuted,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {copied ? <Check size={13} color="#10B981" /> : <Copy size={13} color={c.textMuted} />}
    </button>
  );
}

// ─── Email Draft Modal ────────────────────────────────────────────────────────

function EmailDraftModal({
  lead,
  c,
  onClose,
}: {
  lead: LeadDetail;
  c: ReturnType<typeof colors>;
  onClose: () => void;
}) {
  const subject = lead.email_draft_subject ?? `Kurze Frage zu ${lead.name}`;
  const body = lead.email_draft_body ?? lead.pitch ?? '';
  const [copied, setCopied] = useState(false);

  function copyAll() {
    navigator.clipboard.writeText(`Betreff: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          ...glassCard(c),
          width: 560,
          maxWidth: '92vw',
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 20px 14px',
            borderBottom: `1px solid ${c.border}`,
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: c.text }}>E-Mail Entwurf</div>
            <div style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>{lead.name}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={copyAll}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 8,
                background: copied ? '#10B98120' : c.bgHover,
                border: `1px solid ${copied ? '#10B981' : c.border}`,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                color: copied ? '#10B981' : c.textSub,
                fontFamily: 'inherit',
              }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Kopiert' : 'Alles kopieren'}
            </button>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: c.textMuted }}
            >
              <X size={18} color={c.textMuted} />
            </button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: c.textMuted,
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              Betreff
            </div>
            <div
              style={{
                padding: '10px 14px',
                background: c.bg,
                border: `1px solid ${c.border}`,
                borderRadius: 8,
                fontSize: 14,
                color: c.text,
                fontWeight: 500,
              }}
            >
              {subject}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: c.textMuted,
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              Nachricht
            </div>
            <div
              style={{
                padding: '14px',
                background: c.bg,
                border: `1px solid ${c.border}`,
                borderRadius: 8,
                fontSize: 14,
                color: c.text,
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
              }}
            >
              {body || 'Kein Entwurf vorhanden.'}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── CRM Export Modal ─────────────────────────────────────────────────────────

function CRMExportModal({ lead, c, onClose }: { lead: LeadDetail; c: ReturnType<typeof colors>; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const fields = [
    ['Firmenname', lead.name],
    ['Stadt', lead.city],
    ['Branche', lead.industry],
    ['Website', lead.website ?? ''],
    ['Telefon', lead.phone ?? ''],
    ['Mitarbeiter', lead.employees ?? ''],
    ['Umsatz', lead.revenue ?? ''],
    ['Status', statusLabel(lead.status)],
    ['Lead Score', String(lead.score)],
    ['Fit Score', String(lead.fit)],
    ['Kontakt Name', lead.contacts[0]?.name ?? ''],
    ['Kontakt E-Mail', lead.contacts[0]?.email ?? ''],
    ['Kontakt LinkedIn', lead.contacts[0]?.linkedin ?? ''],
    ['LinkedIn Firma', lead.linkedin_url ?? ''],
    ['Rechtsform', lead.legal_form ?? ''],
    ['HRB', lead.hrb_number ?? ''],
    ['Gegründet', lead.founded ?? ''],
  ].filter(([, v]) => v);

  const csv = fields.map(([k, v]) => `${k},${v}`).join('\n');

  function copyCSV() {
    navigator.clipboard.writeText(csv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          ...glassCard(c),
          width: 480,
          maxWidth: '92vw',
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 20px 14px',
            borderBottom: `1px solid ${c.border}`,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, color: c.text }}>CRM Export</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={copyCSV}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 8,
                background: copied ? '#10B98120' : c.bgHover,
                border: `1px solid ${copied ? '#10B981' : c.border}`,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                color: copied ? '#10B981' : c.textSub,
                fontFamily: 'inherit',
              }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Kopiert' : 'CSV kopieren'}
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <X size={18} color={c.textMuted} />
            </button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {fields.map(([k, v]) => (
            <div
              key={k}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: `1px solid ${c.border}`,
                gap: 12,
              }}
            >
              <span style={{ fontSize: 12, color: c.textMuted, fontWeight: 500, flexShrink: 0 }}>{k}</span>
              <span
                style={{ fontSize: 13, color: c.text, fontWeight: 500, textAlign: 'right', wordBreak: 'break-word' }}
              >
                {v}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Signal Banner ────────────────────────────────────────────────────────────

function SignalBanner({ lead, c }: { lead: LeadDetail; c: ReturnType<typeof colors> }) {
  const signal =
    lead.updatesList[0]?.text ||
    lead.greenflags[0] ||
    lead.mgmt_buying_signals?.[0]?.signal ||
    lead.web_buying_signals?.[0]?.signal ||
    lead.social_buying_signals?.[0]?.signal;

  if (!signal) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '12px 16px',
        background: '#10B98112',
        border: '1px solid #10B98130',
        borderRadius: 10,
        marginBottom: 16,
      }}
    >
      <Zap size={15} color="#10B981" style={{ flexShrink: 0, marginTop: 1 }} />
      <div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#10B981',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginRight: 8,
          }}
        >
          Kaufsignal
        </span>
        <span style={{ fontSize: 13, color: c.text }}>{signal}</span>
      </div>
    </div>
  );
}

// ─── Hero Card ────────────────────────────────────────────────────────────────

function HeroCard({ lead, c }: { lead: LeadDetail; c: ReturnType<typeof colors> }) {
  return (
    <div style={{ ...glassCard(c), padding: '24px 24px 20px', marginBottom: 16 }}>
      {/* Top row: logo + meta + score */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* Logo */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            background: lead.logo_url ? 'transparent' : lead.color + '20',
            border: `1px solid ${c.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {lead.logo_url ? (
            <img
              src={lead.logo_url}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <span style={{ fontSize: 18, fontWeight: 800, color: lead.color }}>{lead.initials}</span>
          )}
        </div>

        {/* Name + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: c.text, margin: 0, letterSpacing: '-0.01em' }}>
              {lead.name}
            </h1>
            <span
              style={{
                padding: '2px 10px',
                borderRadius: 99,
                background: statusBg(lead.status),
                color: statusFg(lead.status),
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {statusLabel(lead.status)}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', fontSize: 13, color: c.textSub }}>
            {lead.city && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={12} color={c.textMuted} />
                {lead.city}
              </span>
            )}
            {lead.industry && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Building2 size={12} color={c.textMuted} />
                {lead.industry}
              </span>
            )}
            {lead.employees && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Users size={12} color={c.textMuted} />
                {lead.employees} MA
              </span>
            )}
            {lead.founded && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={12} color={c.textMuted} />
                Seit {lead.founded}
              </span>
            )}
          </div>
        </div>

        {/* Scores */}
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          {lead.score > 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '8px 14px',
                borderRadius: 10,
                background: scoreColor(lead.score) + '15',
                border: `1px solid ${scoreColor(lead.score)}30`,
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 800, color: scoreColor(lead.score), lineHeight: 1 }}>
                {lead.score}
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: c.textMuted,
                  marginTop: 2,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Score
              </div>
            </div>
          )}
          {lead.fit > 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '8px 14px',
                borderRadius: 10,
                background: scoreColor(lead.fit) + '15',
                border: `1px solid ${scoreColor(lead.fit)}30`,
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 800, color: scoreColor(lead.fit), lineHeight: 1 }}>
                {lead.fit}
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: c.textMuted,
                  marginTop: 2,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Fit
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      {lead.lead_summary && (
        <div
          style={{
            marginTop: 16,
            padding: '12px 14px',
            background: c.bg,
            border: `1px solid ${c.border}`,
            borderRadius: 8,
            fontSize: 13,
            color: c.textSub,
            lineHeight: 1.6,
          }}
        >
          {lead.lead_summary}
        </div>
      )}

      {/* Signal Banner */}
      <div style={{ marginTop: lead.lead_summary ? 12 : 16 }}>
        <SignalBanner lead={lead} c={c} />
      </div>
    </div>
  );
}

// ─── Action Bar ───────────────────────────────────────────────────────────────

function ActionBar({
  lead,
  c,
  onEmail,
  onCRM,
}: {
  lead: LeadDetail;
  c: ReturnType<typeof colors>;
  onEmail: () => void;
  onCRM: () => void;
}) {
  const btnStyle = (primary?: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    padding: '8px 14px',
    borderRadius: 9,
    background: primary ? c.text : c.bgCard,
    border: `1px solid ${primary ? c.text : c.border}`,
    color: primary ? c.bg : c.textSub,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap' as const,
    transition: 'opacity 120ms',
  });

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
      <button style={btnStyle(true)} onClick={onEmail}>
        <Mail size={14} color={c.bg} />
        E-Mail Entwurf
      </button>
      {lead.linkedin_url && (
        <a href={lead.linkedin_url} target="_blank" rel="noreferrer" style={{ ...btnStyle(), textDecoration: 'none' }}>
          <Linkedin size={14} color={c.textSub} />
          LinkedIn
        </a>
      )}
      {lead.website && (
        <a
          href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
          target="_blank"
          rel="noreferrer"
          style={{ ...btnStyle(), textDecoration: 'none' }}
        >
          <Globe size={14} color={c.textSub} />
          Website
        </a>
      )}
      <button style={btnStyle()} onClick={onCRM}>
        <FileText size={14} color={c.textSub} />
        CRM Export
      </button>
    </div>
  );
}

// ─── Tab Nav ──────────────────────────────────────────────────────────────────

const TAB_LABELS: { id: ActiveTab; label: string }[] = [
  { id: 'info', label: 'Info' },
  { id: 'signale', label: 'Signale' },
  { id: 'finanzen', label: 'Finanzen' },
  { id: 'kontakte', label: 'Kontakte' },
  { id: 'outbound', label: 'Outbound' },
  { id: 'alle', label: 'Alle Felder' },
];

function TabNav({
  active,
  onChange,
  counts,
  c,
}: {
  active: ActiveTab;
  onChange: (t: ActiveTab) => void;
  counts: Partial<Record<ActiveTab, number>>;
  c: ReturnType<typeof colors>;
}) {
  return (
    <div
      style={{ display: 'flex', borderBottom: `1px solid ${c.border}`, gap: 0, marginBottom: 20, overflowX: 'auto' }}
    >
      {TAB_LABELS.map(({ id, label }) => {
        const isActive = id === active;
        const count = counts[id];
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 16px',
              background: 'none',
              border: 'none',
              borderBottom: isActive ? `2px solid ${c.text}` : '2px solid transparent',
              marginBottom: -1,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? c.text : c.textSub,
              whiteSpace: 'nowrap',
              fontFamily: 'inherit',
              transition: 'color 120ms',
            }}
          >
            {label}
            {count != null && count > 0 && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 99,
                  background: isActive ? c.text : c.border,
                  color: isActive ? c.bg : c.textMuted,
                }}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Info Tab ─────────────────────────────────────────────────────────────────

function InfoTab({ lead, c }: { lead: LeadDetail; c: ReturnType<typeof colors> }) {
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: c.textMuted,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 10,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );

  const Chip = ({ text, accent }: { text: string; accent?: boolean }) => (
    <span
      style={{
        padding: '4px 10px',
        borderRadius: 99,
        background: accent ? '#4F46E510' : c.bgHover,
        border: `1px solid ${accent ? '#4F46E530' : c.border}`,
        fontSize: 12,
        color: accent ? '#4F46E5' : c.textSub,
        fontWeight: 500,
      }}
    >
      {text}
    </span>
  );

  const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
        padding: '8px 0',
        borderBottom: `1px solid ${c.border}`,
      }}
    >
      <span style={{ fontSize: 12, color: c.textMuted, fontWeight: 500, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: c.text, textAlign: 'right', lineHeight: 1.4 }}>{value}</span>
    </div>
  );

  const healthColor = (score?: number) => {
    if (!score) return c.textMuted;
    if (score >= 70) return '#10B981';
    if (score >= 40) return '#F97316';
    return '#EF4444';
  };

  return (
    <div>
      {/* AI Overview */}
      {lead.lead_summary && (
        <div
          style={{
            padding: '16px 18px',
            background: `linear-gradient(135deg, #4F46E508 0%, ${c.bgCard} 100%)`,
            border: `1px solid #4F46E520`,
            borderRadius: 12,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#4F46E5',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            KI-Zusammenfassung
          </div>
          <p style={{ fontSize: 14, color: c.text, lineHeight: 1.7, margin: 0 }}>{lead.lead_summary}</p>
        </div>
      )}

      {/* Health Indicators row */}
      {(lead.fin_health_score != null ||
        lead.mgmt_stability_score != null ||
        lead.social_health_score != null ||
        lead.reviews_health_score != null) && (
        <Section title="Gesundheits-Check">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8 }}>
            {lead.fin_health_score != null && (
              <div
                style={{
                  padding: '12px',
                  background: c.bgCard,
                  border: `1px solid ${c.border}`,
                  borderRadius: 10,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 800, color: healthColor(lead.fin_health_score) }}>
                  {lead.fin_health_score}
                </div>
                <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>Finanzen</div>
                {lead.fin_health_label && (
                  <div
                    style={{ fontSize: 11, color: healthColor(lead.fin_health_score), fontWeight: 600, marginTop: 2 }}
                  >
                    {lead.fin_health_label}
                  </div>
                )}
              </div>
            )}
            {lead.mgmt_stability_score != null && (
              <div
                style={{
                  padding: '12px',
                  background: c.bgCard,
                  border: `1px solid ${c.border}`,
                  borderRadius: 10,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 800, color: healthColor(lead.mgmt_stability_score) }}>
                  {lead.mgmt_stability_score}
                </div>
                <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>Führung</div>
                {lead.mgmt_stability_label && (
                  <div
                    style={{
                      fontSize: 11,
                      color: healthColor(lead.mgmt_stability_score),
                      fontWeight: 600,
                      marginTop: 2,
                    }}
                  >
                    {lead.mgmt_stability_label}
                  </div>
                )}
              </div>
            )}
            {lead.social_health_score != null && (
              <div
                style={{
                  padding: '12px',
                  background: c.bgCard,
                  border: `1px solid ${c.border}`,
                  borderRadius: 10,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 800, color: healthColor(lead.social_health_score) }}>
                  {lead.social_health_score}
                </div>
                <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>Social</div>
                {lead.social_health_label && (
                  <div
                    style={{
                      fontSize: 11,
                      color: healthColor(lead.social_health_score),
                      fontWeight: 600,
                      marginTop: 2,
                    }}
                  >
                    {lead.social_health_label}
                  </div>
                )}
              </div>
            )}
            {lead.reviews_health_score != null && (
              <div
                style={{
                  padding: '12px',
                  background: c.bgCard,
                  border: `1px solid ${c.border}`,
                  borderRadius: 10,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 800, color: healthColor(lead.reviews_health_score) }}>
                  {lead.reviews_health_score}
                </div>
                <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>Bewertungen</div>
                {lead.reviews_health_label && (
                  <div
                    style={{
                      fontSize: 11,
                      color: healthColor(lead.reviews_health_score),
                      fontWeight: 600,
                      marginTop: 2,
                    }}
                  >
                    {lead.reviews_health_label}
                  </div>
                )}
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Company vitals */}
      {(lead.web_value_proposition ||
        lead.web_target_market ||
        lead.web_industry_position ||
        lead.businessModel ||
        lead.industry) && (
        <Section title="Positionierung">
          <div
            style={{
              background: c.bgCard,
              border: `1px solid ${c.border}`,
              borderRadius: 10,
              overflow: 'hidden',
              padding: '0 14px',
            }}
          >
            {lead.industry && <InfoRow label="Branche" value={lead.industry} />}
            {lead.businessModel && <InfoRow label="Geschäftsmodell" value={lead.businessModel} />}
            {lead.web_industry_position && <InfoRow label="Marktposition" value={lead.web_industry_position} />}
            {lead.web_target_market && <InfoRow label="Zielmarkt" value={lead.web_target_market} />}
            {lead.web_value_proposition && (
              <InfoRow
                label="Value Prop."
                value={<span style={{ color: c.textSub, lineHeight: 1.5 }}>{lead.web_value_proposition}</span>}
              />
            )}
          </div>
        </Section>
      )}

      {/* Hiring / Open Positions */}
      {((lead.web_open_positions_count ?? 0) > 0 ||
        lead.web_has_careers_page ||
        (lead.openPositions?.length ?? 0) > 0) && (
        <Section title="Einstellungen & Wachstum">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(lead.web_open_positions_count ?? 0) > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  background: '#10B98110',
                  border: '1px solid #10B98130',
                  borderRadius: 8,
                }}
              >
                <TrendingUp size={14} color="#10B981" />
                <span style={{ fontSize: 13, color: c.text, fontWeight: 500 }}>
                  {lead.web_open_positions_count} offene Stellen
                </span>
                {lead.web_has_careers_page && (
                  <span style={{ fontSize: 11, color: '#10B981', marginLeft: 4 }}>· Karriereseite aktiv</span>
                )}
              </div>
            )}
            {(lead.openPositions?.length ?? 0) > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {lead.openPositions!.map((p, i) => (
                  <Chip key={i} text={p} />
                ))}
              </div>
            )}
          </div>
        </Section>
      )}

      {lead.or_purpose && (
        <Section title="Unternehmensgegenstand (Handelsregister)">
          <p
            style={{
              fontSize: 13,
              color: c.textSub,
              lineHeight: 1.7,
              margin: 0,
              padding: '12px 14px',
              background: c.bgCard,
              border: `1px solid ${c.border}`,
              borderRadius: 8,
            }}
          >
            {lead.or_purpose}
          </p>
        </Section>
      )}

      {lead.web_analysis_summary && (
        <Section title="Website-Analyse">
          <p style={{ fontSize: 13, color: c.textSub, lineHeight: 1.7, margin: 0 }}>{lead.web_analysis_summary}</p>
        </Section>
      )}

      {lead.mgmt_analysis_summary && (
        <Section title="Führung & Management">
          <div
            style={{
              padding: '12px 14px',
              background: c.bgCard,
              border: `1px solid ${c.border}`,
              borderRadius: 8,
              fontSize: 13,
              color: c.textSub,
              lineHeight: 1.7,
            }}
          >
            {lead.mgmt_analysis_summary}
          </div>
          {(lead.mgmt_is_founder_led || lead.mgmt_has_prokura) && (
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              {lead.mgmt_is_founder_led && <Chip text="Gründergeführt" accent />}
              {lead.mgmt_has_prokura && <Chip text="Prokura" accent />}
              {lead.mgmt_avg_tenure_months != null && (
                <Chip text={`Ø ${Math.round(lead.mgmt_avg_tenure_months / 12)} Jahre Amtszeit`} />
              )}
            </div>
          )}
        </Section>
      )}

      {(lead.coreServices?.length ?? 0) > 0 && (
        <Section title="Kernleistungen">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {lead.coreServices!.map((s, i) => (
              <Chip key={i} text={s} />
            ))}
          </div>
        </Section>
      )}

      {(lead.targetCustomers?.length ?? 0) > 0 && (
        <Section title="Zielkunden">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {lead.targetCustomers!.map((s, i) => (
              <Chip key={i} text={s} />
            ))}
          </div>
        </Section>
      )}

      {(lead.usp?.length ?? 0) > 0 && (
        <Section title="USPs">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {lead.usp!.map((s, i) => (
              <Chip key={i} text={s} accent />
            ))}
          </div>
        </Section>
      )}

      {(lead.tech_stack?.length ?? 0) > 0 && (
        <Section title="Tech-Stack">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {lead.tech_stack!.map((t, i) => (
              <Chip key={i} text={t} />
            ))}
          </div>
          {lead.tech_maturity_label && (
            <div style={{ marginTop: 8, fontSize: 12, color: c.textMuted }}>Reifegrad: {lead.tech_maturity_label}</div>
          )}
        </Section>
      )}

      {((lead.web_certifications?.length ?? 0) > 0 ||
        (lead.web_memberships?.length ?? 0) > 0 ||
        (lead.web_partnerships?.length ?? 0) > 0) && (
        <Section title="Zertifikate, Mitgliedschaften & Partner">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(lead.web_certifications ?? []).map((s, i) => (
              <Chip key={`cert-${i}`} text={s} />
            ))}
            {(lead.web_memberships ?? []).map((s, i) => (
              <Chip key={`mem-${i}`} text={s} />
            ))}
            {(lead.web_partnerships ?? []).map((s, i) => (
              <Chip key={`par-${i}`} text={s} />
            ))}
          </div>
        </Section>
      )}

      {(lead.social_platforms_active?.length ?? 0) > 0 && (
        <Section title="Social Media">
          <div
            style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: lead.social_analysis_summary ? 10 : 0 }}
          >
            {lead.social_platforms_active!.map((p, i) => (
              <div
                key={i}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  background: c.bgCard,
                  border: `1px solid ${c.border}`,
                  fontSize: 12,
                  color: c.textSub,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {p}
                {lead.social_total_followers != null && i === 0 && (
                  <span style={{ color: c.textMuted }}>{fmtNum(lead.social_total_followers)} Follower</span>
                )}
              </div>
            ))}
          </div>
          {lead.social_analysis_summary && (
            <p style={{ fontSize: 12, color: c.textMuted, margin: 0, lineHeight: 1.6 }}>
              {lead.social_analysis_summary}
            </p>
          )}
        </Section>
      )}

      {(lead.reviews?.length ?? 0) > 0 && (
        <Section title="Bewertungen">
          <div
            style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: lead.reviews_analysis_summary ? 10 : 0 }}
          >
            {lead.reviews!.map((r, i) => (
              <div
                key={i}
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: c.bgCard,
                  border: `1px solid ${c.border}`,
                  textAlign: 'center',
                  minWidth: 80,
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2, justifyContent: 'center' }}
                >
                  <Star size={13} color="#F59E0B" fill="#F59E0B" />
                  <span style={{ fontSize: 15, fontWeight: 700, color: c.text }}>{r.score.toFixed(1)}</span>
                </div>
                <div style={{ fontSize: 11, color: c.textMuted }}>
                  {r.platform}
                  {r.count ? ` · ${r.count}` : ''}
                </div>
              </div>
            ))}
          </div>
          {lead.reviews_analysis_summary && (
            <p style={{ fontSize: 12, color: c.textMuted, margin: 0, lineHeight: 1.6 }}>
              {lead.reviews_analysis_summary}
            </p>
          )}
        </Section>
      )}

      {lead.web_recent_news && lead.web_recent_news.length > 0 && (
        <Section title="Aktuelle Nachrichten">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {lead.web_recent_news.map((n, i) => (
              <div
                key={i}
                style={{ padding: '10px 14px', borderRadius: 8, background: c.bgCard, border: `1px solid ${c.border}` }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: c.text, lineHeight: 1.4 }}>
                    {n.source_url ? (
                      <a
                        href={n.source_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: c.text, textDecoration: 'none' }}
                      >
                        {n.headline} <ExternalLink size={11} style={{ verticalAlign: 'middle' }} />
                      </a>
                    ) : (
                      n.headline
                    )}
                  </div>
                  {n.date_approx && (
                    <span style={{ fontSize: 11, color: c.textMuted, flexShrink: 0 }}>{n.date_approx}</span>
                  )}
                </div>
                {n.significance && <div style={{ fontSize: 12, color: c.textSub, marginTop: 4 }}>{n.significance}</div>}
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

// ─── Kontakte Tab ─────────────────────────────────────────────────────────────

function KontakteTab({ lead, c }: { lead: LeadDetail; c: ReturnType<typeof colors> }) {
  const sourceLabel: Record<Contact['source'], string> = {
    linkedin: 'LinkedIn',
    openregister: 'Handelsregister',
    salesnavigator: 'Sales Navigator',
    manual: 'Manuell',
    website: 'Website',
  };

  if (lead.contacts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: c.textMuted, fontSize: 14 }}>
        Keine Kontakte gefunden
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {lead.contacts.map((contact, i) => (
        <div key={i} style={{ ...glassCard(c), padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: '#4F46E520',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#4F46E5',
                    flexShrink: 0,
                  }}
                >
                  {contact.name
                    .split(' ')
                    .map((w) => w[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join('')}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: c.text }}>{contact.name}</div>
                  <div style={{ fontSize: 12, color: c.textSub }}>{contact.role}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {contact.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: c.textSub }}>
                    <Mail size={12} color={c.textMuted} />
                    <span>{contact.email}</span>
                    <CopyButton text={contact.email} c={c} />
                  </div>
                )}
                {contact.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: c.textSub }}>
                    <Phone size={12} color={c.textMuted} />
                    <span>{contact.phone}</span>
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              {contact.linkedin && (
                <a
                  href={contact.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '5px 10px',
                    borderRadius: 7,
                    background: '#0077B620',
                    border: '1px solid #0077B640',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#0077B6',
                    textDecoration: 'none',
                  }}
                >
                  <Linkedin size={12} />
                  LinkedIn
                </a>
              )}
              <span
                style={{
                  padding: '5px 10px',
                  borderRadius: 7,
                  background: c.bgHover,
                  border: `1px solid ${c.border}`,
                  fontSize: 11,
                  color: c.textMuted,
                  fontWeight: 500,
                }}
              >
                {sourceLabel[contact.source]}
              </span>
            </div>
          </div>
        </div>
      ))}

      {lead.or_prokuristen && lead.or_prokuristen.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: c.textMuted,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            Prokuristen
          </div>
          {lead.or_prokuristen.map((p, i) => (
            <div key={i} style={{ ...glassCard(c), padding: '12px 16px', marginBottom: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{p.name}</div>
              {(p.role || p.since) && (
                <div style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>
                  {[p.role, p.since && `seit ${p.since}`].filter(Boolean).join(' · ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Signale Tab ──────────────────────────────────────────────────────────────

function SignaleTab({ lead, c }: { lead: LeadDetail; c: ReturnType<typeof colors> }) {
  type SignalEntry = {
    text: string;
    type: 'green' | 'red' | 'buying' | 'update';
    source?: string;
    sourceLabel?: string;
    url?: string;
    evidence?: string;
    priority?: string;
  };

  const signals: SignalEntry[] = [
    ...lead.greenflags.map((f, i) => ({
      text: f,
      type: 'green' as const,
      sourceLabel: lead._rawGreenFlags?.[i]?.source ? lead._rawGreenFlags[i].source : undefined,
    })),
    ...(lead.mgmt_buying_signals ?? []).map((s) => ({
      text: s.signal,
      type: 'buying' as const,
      sourceLabel: 'Führung',
      evidence: s.evidence,
      priority: s.priority,
    })),
    ...(lead.web_buying_signals ?? []).map((s) => ({
      text: s.signal,
      type: 'buying' as const,
      sourceLabel: 'Website',
      url: s.source_url,
      evidence: s.evidence,
      priority: s.priority,
    })),
    ...(lead.social_buying_signals ?? []).map((s) => ({
      text: s.signal,
      type: 'buying' as const,
      sourceLabel: 'Social',
      url: s.detected_in_post_url,
      evidence: s.evidence,
      priority: s.priority,
    })),
    ...(lead.mgmt_opportunity_flags ?? []).map((f) => ({
      text: f.flag,
      type: 'green' as const,
      sourceLabel: 'Führung',
      evidence: f.evidence,
    })),
    ...(lead.fin_opportunity_flags ?? []).map((f) => ({
      text: f.flag,
      type: 'green' as const,
      sourceLabel: 'Finanzen',
      evidence: f.evidence,
    })),
    ...lead.updatesList.map((u) => ({ text: u.text, type: 'update' as const, sourceLabel: u.source || undefined })),
    ...lead.redflags.map((f, i) => ({
      text: f,
      type: 'red' as const,
      sourceLabel: lead._rawRedFlags?.[i]?.source ? lead._rawRedFlags[i].source : undefined,
    })),
    ...(lead.fin_risk_flags ?? []).map((f) => ({
      text: f.flag,
      type: 'red' as const,
      sourceLabel: 'Finanzen',
      evidence: f.evidence,
    })),
    ...(lead.mgmt_risk_flags ?? []).map((f) => ({
      text: f.flag,
      type: 'red' as const,
      sourceLabel: 'Führung',
      evidence: f.evidence,
    })),
    ...(lead.social_risk_flags ?? []).map((f) => ({
      text: f.flag,
      type: 'red' as const,
      sourceLabel: 'Social',
      evidence: f.evidence,
    })),
    ...(lead.reviews_risk_flags ?? []).map((f) => ({
      text: f.flag,
      type: 'red' as const,
      sourceLabel: 'Bewertungen',
      url: f.url,
      evidence: f.evidence,
    })),
  ];

  if (signals.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: c.textMuted, fontSize: 14 }}>
        Keine Signale gefunden
      </div>
    );
  }

  const iconForType = (type: SignalEntry['type']) => {
    if (type === 'green')
      return { icon: <TrendingUp size={14} color="#10B981" />, bg: '#10B98115', border: '#10B98130' };
    if (type === 'buying') return { icon: <Zap size={14} color="#4F46E5" />, bg: '#4F46E515', border: '#4F46E530' };
    if (type === 'update') return { icon: <Info size={14} color="#F97316" />, bg: '#F9731615', border: '#F9731630' };
    return { icon: <AlertTriangle size={14} color="#EF4444" />, bg: '#EF444415', border: '#EF444430' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {signals.map((s, i) => {
        const { icon, bg, border } = iconForType(s.type);
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 10,
              padding: '12px 14px',
              borderRadius: 10,
              background: bg,
              border: `1px solid ${border}`,
            }}
          >
            <div style={{ flexShrink: 0, marginTop: 2 }}>{icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ fontSize: 13, color: c.text, lineHeight: 1.5 }}>{s.text}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  {s.priority && (
                    <span
                      style={{
                        fontSize: 10,
                        padding: '1px 6px',
                        borderRadius: 99,
                        background: s.priority === 'high' ? '#EF444420' : '#F9731620',
                        color: s.priority === 'high' ? '#EF4444' : '#F97316',
                        fontWeight: 700,
                        textTransform: 'uppercase' as const,
                      }}
                    >
                      {s.priority}
                    </span>
                  )}
                  {s.sourceLabel && (
                    <span
                      style={{
                        fontSize: 10,
                        padding: '1px 7px',
                        borderRadius: 99,
                        background: c.bgHover,
                        border: `1px solid ${c.border}`,
                        color: c.textMuted,
                        fontWeight: 600,
                      }}
                    >
                      {s.sourceLabel}
                    </span>
                  )}
                  {s.url && (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        fontSize: 11,
                        color: '#4F46E5',
                        textDecoration: 'none',
                        padding: '1px 7px',
                        borderRadius: 99,
                        background: '#4F46E510',
                        border: '1px solid #4F46E530',
                        fontWeight: 600,
                      }}
                    >
                      <ExternalLink size={10} />
                      Quelle
                    </a>
                  )}
                </div>
              </div>
              {s.evidence && (
                <div style={{ marginTop: 5, fontSize: 12, color: c.textSub, fontStyle: 'italic', lineHeight: 1.4 }}>
                  {s.evidence}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Outbound Tab ─────────────────────────────────────────────────────────────

function OutboundTab({ lead, c }: { lead: LeadDetail; c: ReturnType<typeof colors> }) {
  const Section = ({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 24 }}>
      <div style={{ marginBottom: 10 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: c.textMuted,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {title}
        </div>
        {sub && <div style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>{sub}</div>}
      </div>
      {children}
    </div>
  );

  const HookCard = ({ text, sub, url, opener }: { text: string; sub?: string; url?: string; opener?: string }) => (
    <div style={{ padding: '12px 14px', background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ fontSize: 13, color: c.text, fontWeight: 500, lineHeight: 1.5, flex: 1 }}>{text}</div>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              fontSize: 11,
              color: '#4F46E5',
              textDecoration: 'none',
              padding: '2px 7px',
              borderRadius: 99,
              background: '#4F46E510',
              border: '1px solid #4F46E530',
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            <ExternalLink size={10} />
            Quelle
          </a>
        )}
      </div>
      {sub && <div style={{ fontSize: 11, color: c.textMuted, marginTop: 4 }}>{sub}</div>}
      {opener && (
        <div style={{ fontSize: 12, color: c.textSub, marginTop: 6, fontStyle: 'italic', lineHeight: 1.5 }}>
          "{opener}"
        </div>
      )}
    </div>
  );

  return (
    <div>
      {/* E-Mail Entwurf inline preview — only when email_draft_body exists */}
      {lead.email_draft_body && (
        <Section title="E-Mail Entwurf">
          <div style={{ background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <div
              style={{
                padding: '10px 14px',
                borderBottom: `1px solid ${c.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: c.text }}>
                {lead.email_draft_subject ?? `Kurze Frage zu ${lead.name}`}
              </span>
              <CopyButton text={`Betreff: ${lead.email_draft_subject ?? ''}\n\n${lead.email_draft_body}`} c={c} />
            </div>
            <div
              style={{
                padding: '14px',
                fontSize: 13,
                color: c.textSub,
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
                maxHeight: 220,
                overflowY: 'auto',
              }}
            >
              {lead.email_draft_body}
            </div>
          </div>
        </Section>
      )}

      {lead.proposedOffer && (
        <Section title="Vorgeschlagenes Angebot">
          <div
            style={{
              padding: '14px',
              background: '#4F46E510',
              border: '1px solid #4F46E530',
              borderRadius: 10,
              fontSize: 13,
              color: c.text,
              lineHeight: 1.7,
            }}
          >
            {lead.proposedOffer}
          </div>
        </Section>
      )}

      {/* Warm Intro Candidates */}
      {(lead.social_warm_intro_candidates?.length ?? 0) > 0 && (
        <Section title="Warm Intro Möglichkeiten" sub="Personen mit Verbindung zum Unternehmen">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {lead.social_warm_intro_candidates!.map((c2, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  background: c.bgCard,
                  border: `1px solid ${c.border}`,
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: '#10B98120',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#10B981',
                    flexShrink: 0,
                  }}
                >
                  {c2.name
                    .split(' ')
                    .map((w) => w[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join('')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: c.text }}>{c2.name}</div>
                  {c2.reason && <div style={{ fontSize: 12, color: c.textSub, marginTop: 1 }}>{c2.reason}</div>}
                  {c2.relationship_signal && (
                    <div style={{ fontSize: 11, color: c.textMuted, marginTop: 1 }}>{c2.relationship_signal}</div>
                  )}
                </div>
                {c2.linkedin_url && (
                  <a
                    href={c2.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '5px 10px',
                      borderRadius: 7,
                      background: '#0077B620',
                      border: '1px solid #0077B640',
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#0077B6',
                      textDecoration: 'none',
                      flexShrink: 0,
                    }}
                  >
                    <Linkedin size={12} />
                    LinkedIn
                  </a>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Review-based hooks */}
      {(lead.reviews_outreach_hooks?.length ?? 0) > 0 && (
        <Section title="Bewertungs-Hooks" sub="Basierend auf Kundenbewertungen">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {lead.reviews_outreach_hooks!.map((h, i) => (
              <HookCard
                key={i}
                text={h.hook}
                sub={[
                  h.source_platform,
                  h.pain_point,
                  h.based_on_review_count ? `${h.based_on_review_count} Bewertungen` : undefined,
                ]
                  .filter(Boolean)
                  .join(' · ')}
                opener={h.suggested_opener}
              />
            ))}
          </div>
        </Section>
      )}

      {/* Social personalization hooks with links */}
      {(lead.social_personalization_hooks?.length ?? 0) > 0 && (
        <Section title="Social Hooks">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {lead.social_personalization_hooks!.map((h, i) => (
              <HookCard
                key={i}
                text={h.hook}
                sub={[h.platform, h.recency_days != null ? `vor ${h.recency_days}d` : undefined]
                  .filter(Boolean)
                  .join(' · ')}
                url={h.source_post_url}
                opener={h.suggested_opener}
              />
            ))}
          </div>
        </Section>
      )}

      {/* Website hooks with source page links */}
      {(lead.web_outreach_hooks?.length ?? 0) > 0 && (
        <Section title="Website Hooks">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {lead.web_outreach_hooks!.map((h, i) => (
              <HookCard key={i} text={h.hook} url={h.source_page} opener={h.suggested_opener} />
            ))}
          </div>
        </Section>
      )}

      {/* General personalization hooks */}
      {(lead.personalizationHooks?.length ?? 0) > 0 && (
        <Section title="Weitere Personalisierungs-Hooks">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {lead.personalizationHooks!.map((h, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  padding: '10px 14px',
                  background: c.bgCard,
                  border: `1px solid ${c.border}`,
                  borderRadius: 8,
                  fontSize: 13,
                  color: c.textSub,
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: '#4F46E520',
                    color: '#4F46E5',
                    fontSize: 10,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  {i + 1}
                </span>
                {h}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Communication style */}
      {(lead.toneOfVoice || lead.social_communication_style) && (
        <Section title="Kommunikationsstil">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
            {lead.toneOfVoice && (
              <div
                style={{ padding: '10px 14px', background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 8 }}
              >
                <div style={{ fontSize: 11, color: c.textMuted, fontWeight: 600, marginBottom: 3 }}>Tonalität</div>
                <div style={{ fontSize: 13, color: c.text }}>{lead.toneOfVoice}</div>
              </div>
            )}
            {lead.social_communication_style?.tone && (
              <div
                style={{ padding: '10px 14px', background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 8 }}
              >
                <div style={{ fontSize: 11, color: c.textMuted, fontWeight: 600, marginBottom: 3 }}>Social Ton</div>
                <div style={{ fontSize: 13, color: c.text }}>{lead.social_communication_style.tone}</div>
              </div>
            )}
            {lead.social_communication_style?.formality && (
              <div
                style={{ padding: '10px 14px', background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 8 }}
              >
                <div style={{ fontSize: 11, color: c.textMuted, fontWeight: 600, marginBottom: 3 }}>Formalität</div>
                <div style={{ fontSize: 13, color: c.text }}>{lead.social_communication_style.formality}</div>
              </div>
            )}
            {lead.social_communication_style?.style_note && (
              <div
                style={{
                  padding: '10px 14px',
                  background: c.bgCard,
                  border: `1px solid ${c.border}`,
                  borderRadius: 8,
                  gridColumn: '1 / -1',
                }}
              >
                <div style={{ fontSize: 11, color: c.textMuted, fontWeight: 600, marginBottom: 3 }}>Stil-Notiz</div>
                <div style={{ fontSize: 13, color: c.textSub }}>{lead.social_communication_style.style_note}</div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* USPs */}
      {(lead.usp?.length ?? 0) > 0 && (
        <Section title="USPs">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {lead.usp!.map((u, i) => (
              <span
                key={i}
                style={{
                  padding: '5px 11px',
                  borderRadius: 99,
                  background: '#4F46E510',
                  border: '1px solid #4F46E530',
                  fontSize: 12,
                  color: '#4F46E5',
                  fontWeight: 500,
                }}
              >
                {u}
              </span>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

// ─── Finanzen Tab ─────────────────────────────────────────────────────────────

function FinanzenTab({ lead, c }: { lead: LeadDetail; c: ReturnType<typeof colors> }) {
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: c.textMuted,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 10,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );

  const Metric = ({ label, value, sub }: { label: string; value: string | null; sub?: string }) => {
    if (!value) return null;
    return (
      <div style={{ padding: '12px 14px', background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 10 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: c.text }}>{value}</div>
        <div style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>{sub}</div>}
      </div>
    );
  };

  const TrendIcon = ({ trend }: { trend?: string }) => {
    if (!trend) return null;
    const t = trend.toLowerCase();
    if (t.includes('up') || t.includes('steig') || t.includes('positiv'))
      return <TrendingUp size={13} color="#10B981" />;
    if (t.includes('down') || t.includes('sink') || t.includes('negativ'))
      return <TrendingDown size={13} color="#EF4444" />;
    return <Minus size={13} color="#94A3B8" />;
  };

  const FlagRow = ({
    flag,
    evidence,
    severity,
    color,
  }: {
    flag: string;
    evidence?: string;
    severity?: string;
    color: string;
  }) => (
    <div
      style={{
        display: 'flex',
        gap: 8,
        padding: '10px 14px',
        background: color + '12',
        border: `1px solid ${color}30`,
        borderRadius: 8,
      }}
    >
      {color === '#10B981' ? (
        <TrendingUp size={14} color={color} style={{ flexShrink: 0, marginTop: 1 }} />
      ) : (
        <AlertTriangle size={14} color={color} style={{ flexShrink: 0, marginTop: 1 }} />
      )}
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 13, color: c.text }}>{flag}</span>
        {severity && (
          <span
            style={{
              marginLeft: 8,
              fontSize: 10,
              padding: '1px 5px',
              borderRadius: 99,
              background: color + '20',
              color,
              fontWeight: 700,
            }}
          >
            {severity}
          </span>
        )}
        {evidence && (
          <div style={{ fontSize: 12, color: c.textSub, marginTop: 4, fontStyle: 'italic' }}>{evidence}</div>
        )}
      </div>
    </div>
  );

  const hasFinData =
    lead.fin_health_score ||
    lead.fin_estimated_revenue_eur ||
    lead.fin_analysis_summary ||
    (lead._financialsHistory?.length ?? 0) > 0;

  if (!hasFinData) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <BarChart2 size={32} color={c.textMuted} style={{ marginBottom: 12 }} />
        <div style={{ color: c.textMuted, fontSize: 14 }}>Keine Finanzdaten vorhanden</div>
      </div>
    );
  }

  return (
    <div>
      {/* Health score */}
      {lead.fin_health_score != null && (
        <Section title="Finanzielle Gesundheit">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '16px 20px',
              background: scoreColor(lead.fin_health_score) + '12',
              border: `1px solid ${scoreColor(lead.fin_health_score)}30`,
              borderRadius: 12,
              marginBottom: 12,
            }}
          >
            <div style={{ fontSize: 36, fontWeight: 900, color: scoreColor(lead.fin_health_score), lineHeight: 1 }}>
              {lead.fin_health_score}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: c.text }}>
                {lead.fin_health_label ?? 'Finanz-Score'}
              </div>
              {lead.fin_years_of_data && (
                <div style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>
                  Basierend auf {lead.fin_years_of_data} Jahren Daten
                  {lead.fin_latest_date ? ` (bis ${lead.fin_latest_date})` : ''}
                </div>
              )}
            </div>
          </div>
        </Section>
      )}

      {/* Key metrics */}
      <Section title="Kennzahlen">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 10 }}>
          <Metric
            label="Umsatz (geschätzt)"
            value={fmtEur(lead.fin_estimated_revenue_eur)}
            sub={lead.fin_estimated_revenue_method}
          />
          <Metric label="Jahresüberschuss" value={fmtEur(lead.fin_net_income_eur)} />
          <Metric label="Stammkapital" value={fmtEur(lead.fin_capital_eur)} />
          <Metric label="Personalkosten" value={fmtEur(lead.fin_salaries_eur)} />
        </div>
      </Section>

      {/* Trends row */}
      {(lead.fin_balance_sheet_trend || lead.fin_equity_trend || lead.fin_revenue_trend || lead.fin_employee_trend) && (
        <Section title="Trends">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 6 }}>
            {(
              [
                ['Bilanzsumme', lead.fin_balance_sheet_trend],
                ['Eigenkapital', lead.fin_equity_trend],
                ['Umsatz', lead.fin_revenue_trend],
                ['Mitarbeiter', lead.fin_employee_trend],
              ] as [string, string | undefined][]
            )
              .filter(([, v]) => v)
              .map(([label, val]) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    background: c.bgCard,
                    border: `1px solid ${c.border}`,
                    borderRadius: 8,
                  }}
                >
                  <TrendIcon trend={val} />
                  <span style={{ fontSize: 12, color: c.textMuted, minWidth: 90 }}>{label}</span>
                  <span style={{ fontSize: 12, color: c.text }}>{val}</span>
                </div>
              ))}
          </div>
        </Section>
      )}

      {/* Financials history table */}
      {(lead._financialsHistory?.length ?? 0) > 0 && (
        <Section title="Jahresabschlüsse (Verlauf)">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${c.border}` }}>
                  {['Jahr', 'Bilanzsumme', 'Eigenkapital', 'EK-Quote', 'Umsatz', 'Gewinn', 'MA'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '6px 10px',
                        textAlign: 'right',
                        color: c.textMuted,
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...lead._financialsHistory!].reverse().map((row, i) => (
                  <tr
                    key={`${row.year}-${i}`}
                    style={{
                      borderBottom: `1px solid ${c.border}`,
                      background: i % 2 === 0 ? 'transparent' : c.bgCard + '80',
                    }}
                  >
                    <td style={{ padding: '7px 10px', fontWeight: 700, color: c.text }}>{row.year}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', color: c.textSub }}>
                      {fmtEur(row.balance_sheet_total_eur) ?? '—'}
                    </td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', color: c.textSub }}>
                      {fmtEur(row.equity_eur) ?? '—'}
                    </td>
                    <td
                      style={{
                        padding: '7px 10px',
                        textAlign: 'right',
                        color:
                          row.equity_ratio_pct != null
                            ? row.equity_ratio_pct >= 30
                              ? '#10B981'
                              : row.equity_ratio_pct >= 10
                                ? '#F97316'
                                : '#EF4444'
                            : c.textMuted,
                      }}
                    >
                      {row.equity_ratio_pct != null ? `${row.equity_ratio_pct.toFixed(1)} %` : '—'}
                    </td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', color: c.textSub }}>
                      {fmtEur(row.revenue_eur) ?? '—'}
                    </td>
                    <td
                      style={{
                        padding: '7px 10px',
                        textAlign: 'right',
                        color:
                          row.net_income_eur != null ? (row.net_income_eur >= 0 ? '#10B981' : '#EF4444') : c.textMuted,
                      }}
                    >
                      {fmtEur(row.net_income_eur) ?? '—'}
                    </td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', color: c.textSub }}>
                      {row.employees ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Analysis */}
      {lead.fin_analysis_summary && (
        <Section title="Analyse">
          <p style={{ fontSize: 13, color: c.textSub, lineHeight: 1.7, margin: 0 }}>{lead.fin_analysis_summary}</p>
        </Section>
      )}

      {/* Management section */}
      {(lead.mgmt_analysis_summary ||
        (lead.mgmt_buying_signals?.length ?? 0) > 0 ||
        (lead.mgmt_risk_flags?.length ?? 0) > 0) && (
        <Section title="Führung & Management">
          {lead.mgmt_analysis_summary && (
            <p style={{ fontSize: 13, color: c.textSub, lineHeight: 1.7, margin: '0 0 12px' }}>
              {lead.mgmt_analysis_summary}
            </p>
          )}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 8,
              marginBottom:
                (lead.mgmt_buying_signals?.length ?? 0) > 0 || (lead.mgmt_risk_flags?.length ?? 0) > 0 ? 12 : 0,
            }}
          >
            {lead.mgmt_stability_score != null && (
              <div
                style={{ padding: '10px 14px', background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 8 }}
              >
                <div style={{ fontSize: 18, fontWeight: 800, color: scoreColor(lead.mgmt_stability_score) }}>
                  {lead.mgmt_stability_score}
                </div>
                <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>
                  {lead.mgmt_stability_label ?? 'Stabilitäts-Score'}
                </div>
              </div>
            )}
            {lead.mgmt_current_director_count != null && (
              <div
                style={{ padding: '10px 14px', background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 8 }}
              >
                <div style={{ fontSize: 18, fontWeight: 800, color: c.text }}>{lead.mgmt_current_director_count}</div>
                <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>Aktuelle Geschäftsführer</div>
              </div>
            )}
            {lead.mgmt_avg_tenure_months != null && (
              <div
                style={{ padding: '10px 14px', background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 8 }}
              >
                <div style={{ fontSize: 18, fontWeight: 800, color: c.text }}>{lead.mgmt_avg_tenure_months}M</div>
                <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>Ø Amtszeit</div>
              </div>
            )}
            {lead.mgmt_total_changes != null && (
              <div
                style={{ padding: '10px 14px', background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 8 }}
              >
                <div style={{ fontSize: 18, fontWeight: 800, color: c.text }}>{lead.mgmt_total_changes}</div>
                <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>GF-Wechsel gesamt</div>
              </div>
            )}
          </div>
          <div
            style={{
              display: 'flex',
              gap: 6,
              flexWrap: 'wrap',
              marginBottom:
                (lead.mgmt_buying_signals?.length ?? 0) > 0 || (lead.mgmt_risk_flags?.length ?? 0) > 0 ? 12 : 0,
            }}
          >
            {lead.mgmt_is_founder_led != null && (
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: 99,
                  background: lead.mgmt_is_founder_led ? '#10B98115' : c.bgHover,
                  border: `1px solid ${lead.mgmt_is_founder_led ? '#10B98140' : c.border}`,
                  fontSize: 12,
                  color: lead.mgmt_is_founder_led ? '#10B981' : c.textMuted,
                }}
              >
                Gründergeführt: {lead.mgmt_is_founder_led ? 'Ja' : 'Nein'}
              </span>
            )}
            {lead.mgmt_has_prokura != null && (
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: 99,
                  background: c.bgHover,
                  border: `1px solid ${c.border}`,
                  fontSize: 12,
                  color: c.textMuted,
                }}
              >
                Prokura: {lead.mgmt_has_prokura ? 'Ja' : 'Nein'}
              </span>
            )}
            {lead.mgmt_last_change_type && (
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: 99,
                  background: '#F9731615',
                  border: '1px solid #F9731630',
                  fontSize: 12,
                  color: '#F97316',
                }}
              >
                Letzter Wechsel: {lead.mgmt_last_change_type}
              </span>
            )}
          </div>
          {(lead.mgmt_buying_signals?.length ?? 0) > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
              {lead.mgmt_buying_signals!.map((s, i) => (
                <FlagRow key={i} flag={s.signal} evidence={s.evidence} color="#4F46E5" />
              ))}
            </div>
          )}
          {(lead.mgmt_risk_flags?.length ?? 0) > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {lead.mgmt_risk_flags!.map((f, i) => (
                <FlagRow key={i} flag={f.flag} evidence={f.evidence} severity={f.severity} color="#EF4444" />
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Financial opportunities & risks */}
      {(lead.fin_opportunity_flags?.length ?? 0) > 0 && (
        <Section title="Finanzielle Chancen">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {lead.fin_opportunity_flags!.map((f, i) => (
              <FlagRow key={i} flag={f.flag} evidence={f.evidence} color="#10B981" />
            ))}
          </div>
        </Section>
      )}

      {(lead.fin_risk_flags?.length ?? 0) > 0 && (
        <Section title="Finanzielle Risiken">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {lead.fin_risk_flags!.map((f, i) => (
              <FlagRow key={i} flag={f.flag} evidence={f.evidence} severity={f.severity} color="#EF4444" />
            ))}
          </div>
        </Section>
      )}

      {/* Reviews summary (shipping/customer pain) */}
      {(lead.reviews_shipping_complaints?.length ?? 0) > 0 && (
        <Section title="Bekannte Versand-Beschwerden">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {lead.reviews_shipping_complaints!.map((r, i) => (
              <div
                key={i}
                style={{
                  padding: '10px 14px',
                  background: '#EF444410',
                  border: '1px solid #EF444425',
                  borderRadius: 8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, color: c.text, fontWeight: 500 }}>{r.topic}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {r.platform && (
                      <span
                        style={{
                          fontSize: 10,
                          padding: '1px 6px',
                          borderRadius: 99,
                          background: c.bgHover,
                          border: `1px solid ${c.border}`,
                          color: c.textMuted,
                        }}
                      >
                        {r.platform}
                      </span>
                    )}
                    {r.severity && (
                      <span
                        style={{
                          fontSize: 10,
                          padding: '1px 6px',
                          borderRadius: 99,
                          background: '#EF444420',
                          color: '#EF4444',
                          fontWeight: 700,
                        }}
                      >
                        {r.severity}
                      </span>
                    )}
                  </div>
                </div>
                {r.example_quote && (
                  <div style={{ fontSize: 12, color: c.textSub, marginTop: 5, fontStyle: 'italic' }}>
                    "{r.example_quote}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

// ─── Alle Felder Tab ──────────────────────────────────────────────────────────

function AlleFelder({ lead, c }: { lead: LeadDetail; c: ReturnType<typeof colors> }) {
  type Row = [string, string | number | boolean | undefined | null];
  const groups: { title: string; rows: Row[] }[] = [
    {
      title: 'Stammdaten',
      rows: [
        ['Name', lead.name],
        ['Stadt', lead.city],
        ['Branche', lead.industry],
        ['Branchencode', lead.branchCode],
        ['Gegründet', lead.founded],
        ['Rechtsform', lead.legal_form],
        ['HRB-Nummer', lead.hrb_number],
        ['Amtsgericht', lead.court],
        ['Adresse', [lead.street, lead.zip, lead.city].filter(Boolean).join(', ') || null],
        ['Registrierter Sitz', lead.registeredSeat],
        ['Mitarbeiter', lead.employees],
        ['MA-Entwicklung', lead.employeeHistory],
        ['Umsatz', lead.revenue],
        ['Website', lead.website],
        ['Telefon', lead.phone],
        ['Geschäftsmodell', lead.businessModel],
        ['Shop-System', lead.shopSystem],
      ],
    },
    {
      title: 'Scores & Status',
      rows: [
        ['Lead Score', lead.score],
        ['Score Begründung', lead.scoreReason],
        ['Fit Score', lead.fit],
        ['Status', statusLabel(lead.status)],
        ['Nächster Schritt', lead.next_action],
        ['Finanz-Score', lead.fin_health_score],
        ['Finanz-Label', lead.fin_health_label],
        ['Finanz-Jahre', lead.fin_years_of_data],
        ['Finanz-Stand', lead.fin_latest_date],
        ['Mgmt-Score', lead.mgmt_stability_score],
        ['Mgmt-Label', lead.mgmt_stability_label],
        ['Social Health Score', lead.social_health_score],
        ['Social Health Label', lead.social_health_label],
        ['Reviews Health Score', lead.reviews_health_score],
        ['Reviews Health Label', lead.reviews_health_label],
      ],
    },
    {
      title: 'Finanzen',
      rows: [
        ['Umsatz (geschätzt)', lead.fin_estimated_revenue_eur != null ? fmtEur(lead.fin_estimated_revenue_eur) : null],
        ['Schätzmethode', lead.fin_estimated_revenue_method],
        ['Jahresüberschuss', lead.fin_net_income_eur != null ? fmtEur(lead.fin_net_income_eur) : null],
        ['Stammkapital', lead.fin_capital_eur != null ? fmtEur(lead.fin_capital_eur) : null],
        ['Personalkosten', lead.fin_salaries_eur != null ? fmtEur(lead.fin_salaries_eur) : null],
        ['Bilanzsumme Trend', lead.fin_balance_sheet_trend],
        ['Eigenkapital Trend', lead.fin_equity_trend],
        ['Umsatz Trend', lead.fin_revenue_trend],
        ['MA Trend', lead.fin_employee_trend],
      ],
    },
    {
      title: 'Führung',
      rows: [
        ['Geschäftsführer', lead.representative],
        ['Gründergeführt', lead.mgmt_is_founder_led != null ? (lead.mgmt_is_founder_led ? 'Ja' : 'Nein') : undefined],
        ['Hat Prokura', lead.mgmt_has_prokura != null ? (lead.mgmt_has_prokura ? 'Ja' : 'Nein') : undefined],
        ['Anz. Geschäftsführer', lead.mgmt_current_director_count],
        ['GF-Wechsel gesamt', lead.mgmt_total_changes],
        ['Ø Amtszeit (Monate)', lead.mgmt_avg_tenure_months],
        ['Letzter Wechseltyp', lead.mgmt_last_change_type],
      ],
    },
    {
      title: 'Handelsregister',
      rows: [
        ['Unternehmensgegenstand', lead.or_purpose],
        ['Prokuristen', lead.or_prokuristen?.map((p) => p.name).join(', ')],
        ['Ehem. Geschäftsführer', lead.or_former_directors?.map((d) => d.name).join(', ')],
      ],
    },
    {
      title: 'Website & Web-Analyse',
      rows: [
        ['Value Proposition', lead.web_value_proposition],
        ['Zielmarkt', lead.web_target_market],
        ['Marktposition', lead.web_industry_position],
        [
          'Hat Karriereseite',
          lead.web_has_careers_page != null ? (lead.web_has_careers_page ? 'Ja' : 'Nein') : undefined,
        ],
        ['Hat Shop', lead.web_has_shop != null ? (lead.web_has_shop ? 'Ja' : 'Nein') : undefined],
        ['Offene Stellen', lead.web_open_positions_count],
        ['Tech-Reifegrad', lead.tech_maturity_label],
      ],
    },
    {
      title: 'Social Media',
      rows: [
        ['LinkedIn', lead.linkedin_url],
        ['Instagram', lead.instagram_url],
        ['Facebook', lead.facebook],
        ['Twitter/X', lead.twitter_url],
        ['YouTube', lead.youtube_url],
        ['TikTok', lead.tiktok_url],
        ['XING', lead.xing_url],
        ['LinkedIn Follower', lead.li_followers],
        ['LinkedIn Firmengröße', lead.li_company_size],
        ['Instagram Follower', lead.instagramFollowers],
        ['Instagram Following', lead.instagramFollowing],
        ['Instagram Posts', lead.instagramPosts],
        ['Facebook Follower', lead.facebookFollowers],
        ['Gesamt Follower', lead.social_total_followers],
        ['Primäre Plattform', lead.social_primary_platform],
        ['Posting Frequenz', lead.social_posting_frequency],
        ['Tage seit letztem Post', lead.social_days_since_last_post],
        ['Ø Likes/Post', lead.social_avg_likes_per_post],
        [
          'Engagement Rate',
          lead.social_engagement_rate_pct != null ? `${lead.social_engagement_rate_pct.toFixed(2)} %` : null,
        ],
        ['Posts analysiert', lead.social_total_posts_scraped],
        ['Video-Anteil', lead.social_video_pct != null ? `${lead.social_video_pct} %` : null],
        ['Unique Kommentatoren', lead.social_unique_commenters],
      ],
    },
    {
      title: 'Bewertungen',
      rows: [
        ['Google Rating', lead.reviews_google_rating ?? lead.google],
        ['Google Bewertungen', lead.reviews_google_count ?? lead.google_review_count],
        ['Google URL', lead.google_reviews_url],
        ['Trustpilot Rating', lead.reviews_trustpilot_rating ?? lead.trustpilot],
        ['Trustpilot Bewertungen', lead.reviews_trustpilot_count ?? lead.trustpilot_review_count],
        ['Trustpilot URL', lead.trustpilot_url],
        ['Kununu Rating', lead.reviews_kununu_rating ?? lead.kununu],
        ['Kununu Bewertungen', lead.reviews_kununu_count ?? lead.kununu_review_count],
        [
          'Kununu Empfehlung %',
          lead.reviews_kununu_recommendation_pct != null ? `${lead.reviews_kununu_recommendation_pct} %` : null,
        ],
        ['Kununu URL', lead.kununu_url],
        ['ProvenExpert Rating', lead.provenexpert_rating],
        ['ProvenExpert Bewertungen', lead.provenexpert_review_count],
        ['ProvenExpert URL', lead.provenexpert_url],
        ['Gesamtbewertungen', lead.reviews_total_count],
        ['Antwortrate', lead.reviews_owner_response_rate != null ? `${lead.reviews_owner_response_rate} %` : null],
        ['Sentiment Trend', lead.reviews_sentiment_trend],
        ['Zuletzt analysiert', lead.reviews_analyzed_at],
      ],
    },
  ];

  const FieldTable = ({ rows }: { rows: Row[] }) => {
    const visible = rows.filter(([, v]) => v != null && v !== '');
    if (visible.length === 0) return null;
    return (
      <div style={{ ...glassCard(c), overflow: 'hidden', padding: 0 }}>
        {visible.map(([label, value], i) => (
          <div
            key={String(label)}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 16,
              padding: '9px 16px',
              borderBottom: i < visible.length - 1 ? `1px solid ${c.border}` : 'none',
            }}
          >
            <span style={{ fontSize: 12, color: c.textMuted, fontWeight: 500, flexShrink: 0 }}>{label}</span>
            <span style={{ fontSize: 13, color: c.text, textAlign: 'right', wordBreak: 'break-word', maxWidth: '65%' }}>
              {String(value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {groups.map((group) => {
        const visible = group.rows.filter(([, v]) => v != null && v !== '');
        if (visible.length === 0) return null;
        return (
          <div key={group.title}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: c.textMuted,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: 10,
              }}
            >
              {group.title}
            </div>
            <FieldTable rows={group.rows} />
          </div>
        );
      })}
    </div>
  );
}

// ─── Nächster Schritt Card ────────────────────────────────────────────────────

function NaechsterSchrittCard({
  lead,
  c,
  onEmail,
}: {
  lead: LeadDetail;
  c: ReturnType<typeof colors>;
  onEmail: () => void;
}) {
  const action = lead.next_action || 'Erstkontakt per E-Mail senden';

  return (
    <div style={{ ...glassCard(c), padding: '18px 18px', marginBottom: 12, border: `1px solid ${c.borderStrong}` }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: c.textMuted,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 10,
        }}
      >
        Nächster Schritt
      </div>
      <p style={{ fontSize: 14, fontWeight: 600, color: c.text, margin: '0 0 14px', lineHeight: 1.5 }}>{action}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button
          onClick={onEmail}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
            padding: '9px 0',
            borderRadius: 9,
            background: c.text,
            border: 'none',
            color: c.bg,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <Mail size={14} color={c.bg} />
          E-Mail schreiben
        </button>
        {lead.linkedin_url && (
          <a
            href={lead.linkedin_url}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              padding: '9px 0',
              borderRadius: 9,
              background: c.bgHover,
              border: `1px solid ${c.border}`,
              color: c.textSub,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <Linkedin size={14} color={c.textSub} />
            LinkedIn öffnen
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Quick Facts Sidebar ──────────────────────────────────────────────────────

function QuickFacts({ lead, c }: { lead: LeadDetail; c: ReturnType<typeof colors> }) {
  const rows: [string, React.ReactNode][] = [];

  if (lead.employees) rows.push(['Mitarbeiter', lead.employees]);
  if (lead.founded) rows.push(['Gegründet', lead.founded]);
  if (lead.revenue) rows.push(['Umsatz', lead.revenue]);
  if (lead.legal_form) rows.push(['Rechtsform', lead.legal_form]);
  if (lead.hrb_number)
    rows.push([
      'HRB',
      <a
        key="hrb"
        href={`https://www.handelsregister.de/rp_web/mask.do?Typ=e&Registergericht=${encodeURIComponent(lead.court ?? '')}&Registerart=HRB&Registernummer=${encodeURIComponent(lead.hrb_number)}`}
        target="_blank"
        rel="noreferrer"
        style={{ color: '#4F46E5', textDecoration: 'none', fontSize: 13 }}
      >
        {lead.hrb_number} <ExternalLink size={10} style={{ verticalAlign: 'middle' }} />
      </a>,
    ]);
  if (lead.phone)
    rows.push([
      'Telefon',
      <a key="phone" href={`tel:${lead.phone}`} style={{ color: c.text, textDecoration: 'none' }}>
        {lead.phone}
      </a>,
    ]);
  if (lead.website)
    rows.push([
      'Website',
      <a
        key="web"
        href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
        target="_blank"
        rel="noreferrer"
        style={{ color: '#4F46E5', textDecoration: 'none', fontSize: 13, wordBreak: 'break-all' }}
      >
        {lead.website.replace(/^https?:\/\//, '')}
      </a>,
    ]);
  if (lead.shopSystem) rows.push(['Shop-System', lead.shopSystem]);
  if (lead.tech_maturity_label) rows.push(['Tech-Reife', lead.tech_maturity_label]);
  if (lead.social_total_followers) rows.push(['Follower', fmtNum(lead.social_total_followers) ?? '']);
  if (lead.employeeHistory) rows.push(['MA-Entwicklung', lead.employeeHistory]);

  if (rows.length === 0) return null;

  return (
    <div style={{ ...glassCard(c), padding: 0, overflow: 'hidden' }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: c.textMuted,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          padding: '14px 16px 10px',
        }}
      >
        Kurzübersicht
      </div>
      {rows.map(([label, value], i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 10,
            padding: '8px 16px',
            borderTop: `1px solid ${c.border}`,
          }}
        >
          <span style={{ fontSize: 12, color: c.textMuted, fontWeight: 500, flexShrink: 0 }}>{label}</span>
          <span style={{ fontSize: 13, color: c.text, textAlign: 'right' }}>{value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { theme } = useTheme();
  const c = colors(theme);

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('info');
  const [emailOpen, setEmailOpen] = useState(false);
  const [crmOpen, setCrmOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/leads/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error && !data.lead) {
          setError(data.error);
          return;
        }
        if (data.lead) setLead(mapDbLead(data.lead as Record<string, unknown>));
        else setError('Lead nicht gefunden');
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: c.textMuted,
          fontSize: 14,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: `3px solid ${c.border}`,
              borderTopColor: c.text,
              margin: '0 auto 12px',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          Lade Lead-Daten...
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );

  if (error || !lead)
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: 12,
        }}
      >
        <AlertTriangle size={32} color={c.textMuted} />
        <div style={{ fontSize: 14, color: c.textMuted }}>{error ?? 'Lead nicht gefunden'}</div>
        <button
          onClick={() => router.back()}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            background: c.bgCard,
            border: `1px solid ${c.border}`,
            cursor: 'pointer',
            fontSize: 13,
            color: c.textSub,
            fontFamily: 'inherit',
          }}
        >
          Zurück
        </button>
      </div>
    );

  const tabCounts: Partial<Record<ActiveTab, number>> = {
    kontakte: lead.contacts.length,
    signale:
      lead.greenflags.length +
      lead.redflags.length +
      lead.updatesList.length +
      (lead.mgmt_buying_signals?.length ?? 0) +
      (lead.web_buying_signals?.length ?? 0) +
      (lead.social_buying_signals?.length ?? 0),
  };

  return (
    <div style={{ minHeight: '100%', background: 'transparent' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={() => router.back()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '6px 10px',
            borderRadius: 8,
            background: 'none',
            border: `1px solid ${c.border}`,
            cursor: 'pointer',
            fontSize: 13,
            color: c.textSub,
            fontFamily: 'inherit',
          }}
        >
          <ArrowLeft size={14} color={c.textSub} />
          Zurück
        </button>
        <span style={{ fontSize: 13, color: c.textMuted }}>Leads</span>
        <span style={{ fontSize: 13, color: c.textMuted }}>/</span>
        <span style={{ fontSize: 13, color: c.text, fontWeight: 500 }}>{lead.name}</span>
      </div>

      {/* Main layout */}
      <div style={{ display: 'flex', gap: 20, padding: '20px 24px 40px', alignItems: 'flex-start' }}>
        {/* Left: main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <HeroCard lead={lead} c={c} />
          <ActionBar lead={lead} c={c} onEmail={() => setEmailOpen(true)} onCRM={() => setCrmOpen(true)} />
          <TabNav active={activeTab} onChange={setActiveTab} counts={tabCounts} c={c} />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'info' && <InfoTab lead={lead} c={c} />}
              {activeTab === 'signale' && <SignaleTab lead={lead} c={c} />}
              {activeTab === 'finanzen' && <FinanzenTab lead={lead} c={c} />}
              {activeTab === 'kontakte' && <KontakteTab lead={lead} c={c} />}
              {activeTab === 'outbound' && <OutboundTab lead={lead} c={c} />}
              {activeTab === 'alle' && <AlleFelder lead={lead} c={c} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right: sticky sidebar */}
        <div
          style={{
            width: 264,
            flexShrink: 0,
            position: 'sticky',
            top: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <NaechsterSchrittCard lead={lead} c={c} onEmail={() => setEmailOpen(true)} />
          <QuickFacts lead={lead} c={c} />
        </div>
      </div>

      {emailOpen && <EmailDraftModal lead={lead} c={c} onClose={() => setEmailOpen(false)} />}
      {crmOpen && <CRMExportModal lead={lead} c={c} onClose={() => setCrmOpen(false)} />}
    </div>
  );
}
