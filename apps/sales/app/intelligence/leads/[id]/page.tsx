'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { useParams, useRouter } from 'next/navigation';
import { useState, useLayoutEffect, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpIcon, Users, Calendar, Globe, Phone, Info, ChevronDown, Trash2 } from 'lucide-react';
import { useTheme, colors } from '../../layout';
import { GlassPageFilters } from '@/components/ui/liquid-glass-card';
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { GlassButton } from '@/components/ui/glass-button';
import { TypingEffect } from '@/components/ui/typing-effect';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ─── Types ────────────────────────────────────────────────────────────────────

type LeadStatus = 'hot' | 'warm' | 'cold';
type ActiveTab = 'info' | 'outbound' | 'bot';

interface Contact {
  name: string;
  role: string;
  linkedin?: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  apolloPersonId?: string;
  emailDraftSubject?: string;
  emailDraftBody?: string;
  source: 'linkedin' | 'openregister' | 'salesnavigator' | 'manual' | 'website' | 'apollo';
}

interface ApolloPerson {
  id: string;
  first_name?: string;
  last_name_obfuscated?: string;
  title?: string | null;
  has_email?: boolean;
  has_direct_phone?: string;
  last_refreshed_at?: string;
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
  // Shipping (SPS-relevant)
  shipping_sps_fit_score?: number;
  shipping_sps_fit_reasoning?: string;
  shipping_carriers_detected?: string[];
  shipping_fulfillment_model?: string;
  shipping_estimated_volume?: string;
  shipping_logistics_complexity?: string;
  shipping_savings_potential?: string;
  shipping_has_own_warehouse?: boolean;
  shipping_international_pct?: number;
  shipping_countries?: string[];
  shipping_pain_signals?: {
    signal: string;
    summary?: string;
    severity?: string;
    evidence?: string;
    source?: string;
    source_url?: string;
  }[];
  shipping_carrier_complaints?: { carrier?: string; complaint?: string; frequency?: string }[];
  shipping_recommended_services?: { service: string; summary?: string; reason?: string }[];
  shipping_analysis_summary?: string;
  shipping_analysis_headline?: string;
  shipping_analysis_detail?: string;
  shipping_approach_headline?: string;
  shipping_savings_potential_summary?: string;
  shipping_savings_potential_reasoning?: string;
  shipping_key_facts?: { label: string; value: string }[];
  shipping_data_confidence?: number;
  shipping_data_confidence_reasoning?: string;
  shipping_approach_angle?: string;
  shipping_delivery_promise?: string;
  shipping_return_policy?: string;
  shipping_free_threshold_eur?: number;
  shipping_warehouse_m2?: number;
  shipping_tech_integration?: string;
  shipping_volume_method?: string;
  shipping_carriers_evidence?: Array<Record<string, unknown> | string>;
  shipping_analyzed_at?: string;
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
  web_company_pitch?: string;
  web_value_proposition?: string;
  web_target_market?: string;
  web_industry_position?: string;
  web_core_services?: string[];
  web_tech_stack?: string[];
  web_languages?: string[];
  web_certifications?: string[];
  web_memberships?: string[];
  web_partnerships?: string[];
  web_has_careers_page?: boolean;
  web_has_shop?: boolean;
  web_open_positions_count?: number;
  web_page_count?: number;
  web_data_confidence?: number;
  web_analyzed_at?: string;
  web_communication_style?: { tone?: string; language?: string; formality?: string; key_phrases?: string[] };
  web_buying_signals?: { signal: string; evidence?: string; priority?: string; source_url?: string }[];
  web_outreach_hooks?: { hook: string; source_page?: string; suggested_opener?: string }[];
  web_recent_news?: { headline: string; source_url?: string; date_approx?: string; significance?: string }[];
  web_opportunity_flags?: { flag: string; evidence?: string; source?: string; url?: string }[];
  web_risk_flags?: { flag: string; evidence?: string; source?: string; url?: string; severity?: string }[];
  web_sources_used?: { url?: string; source?: string; subtype?: string; raw_source_id?: string }[];
}

// ─── DB mapper ───────────────────────────────────────────────────────────────

type ApiLeadContact = {
  id: string;
  apollo_person_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  title?: string | null;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile_phone?: string | null;
  linkedin_url?: string | null;
  photo_url?: string | null;
  email_draft_subject?: string | null;
  email_draft_body?: string | null;
};

function mapApiContact(row: ApiLeadContact): Contact {
  const name = row.full_name?.trim() || [row.first_name, row.last_name].filter(Boolean).join(' ').trim() || 'Unbenannt';
  return {
    name,
    role: row.title || row.role || 'Ansprechpartner',
    email: row.email ?? undefined,
    phone: row.phone ?? row.mobile_phone ?? undefined,
    linkedin: row.linkedin_url ?? undefined,
    photoUrl: row.photo_url ?? undefined,
    apolloPersonId: row.apollo_person_id ?? undefined,
    emailDraftSubject: row.email_draft_subject ?? undefined,
    emailDraftBody: row.email_draft_body ?? undefined,
    source: 'apollo',
  };
}

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
    shipping_sps_fit_score:
      typeof d.shipping_sps_fit_score === 'number' ? (d.shipping_sps_fit_score as number) : undefined,
    shipping_sps_fit_reasoning: d.shipping_sps_fit_reasoning as string | undefined,
    shipping_carriers_detected: Array.isArray(d.shipping_carriers_detected)
      ? (d.shipping_carriers_detected as string[])
      : [],
    shipping_fulfillment_model: d.shipping_fulfillment_model as string | undefined,
    shipping_estimated_volume: d.shipping_estimated_volume as string | undefined,
    shipping_logistics_complexity: d.shipping_logistics_complexity as string | undefined,
    shipping_savings_potential: d.shipping_savings_potential as string | undefined,
    shipping_has_own_warehouse:
      typeof d.shipping_has_own_warehouse === 'boolean' ? (d.shipping_has_own_warehouse as boolean) : undefined,
    shipping_international_pct:
      typeof d.shipping_international_pct === 'number' ? (d.shipping_international_pct as number) : undefined,
    shipping_countries: Array.isArray(d.shipping_countries) ? (d.shipping_countries as string[]) : [],
    shipping_pain_signals: Array.isArray(d.shipping_pain_signals)
      ? (d.shipping_pain_signals as {
          signal: string;
          summary?: string;
          severity?: string;
          evidence?: string;
          source?: string;
          source_url?: string;
        }[])
      : [],
    shipping_carrier_complaints: Array.isArray(d.shipping_carrier_complaints)
      ? (d.shipping_carrier_complaints as {
          carrier?: string;
          complaint?: string;
          frequency?: string;
        }[])
      : [],
    shipping_recommended_services: Array.isArray(d.shipping_recommended_services)
      ? (d.shipping_recommended_services as { service: string; summary?: string; reason?: string }[])
      : [],
    shipping_analysis_summary: d.shipping_analysis_summary as string | undefined,
    shipping_analysis_headline: d.shipping_analysis_headline as string | undefined,
    shipping_analysis_detail: d.shipping_analysis_detail as string | undefined,
    shipping_approach_headline: d.shipping_approach_headline as string | undefined,
    shipping_savings_potential_summary: d.shipping_savings_potential_summary as string | undefined,
    shipping_savings_potential_reasoning: d.shipping_savings_potential_reasoning as string | undefined,
    shipping_key_facts: Array.isArray(d.shipping_key_facts)
      ? (d.shipping_key_facts as { label: string; value: string }[])
      : [],
    shipping_data_confidence:
      typeof d.shipping_data_confidence === 'number' ? (d.shipping_data_confidence as number) : undefined,
    shipping_data_confidence_reasoning: d.shipping_data_confidence_reasoning as string | undefined,
    shipping_approach_angle: d.shipping_approach_angle as string | undefined,
    shipping_delivery_promise: d.shipping_delivery_promise as string | undefined,
    shipping_return_policy: d.shipping_return_policy as string | undefined,
    shipping_free_threshold_eur:
      typeof d.shipping_free_threshold_eur === 'number' ? (d.shipping_free_threshold_eur as number) : undefined,
    shipping_warehouse_m2:
      typeof d.shipping_warehouse_m2 === 'number' ? (d.shipping_warehouse_m2 as number) : undefined,
    shipping_tech_integration: d.shipping_tech_integration as string | undefined,
    shipping_volume_method: d.shipping_volume_method as string | undefined,
    shipping_carriers_evidence: Array.isArray(d.shipping_carriers_evidence)
      ? (d.shipping_carriers_evidence as Array<Record<string, unknown> | string>)
      : [],
    shipping_analyzed_at: d.shipping_analyzed_at as string | undefined,
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
    web_company_pitch: d.web_company_pitch as string | undefined,
    web_value_proposition: d.web_value_proposition as string | undefined,
    web_target_market: d.web_target_market as string | undefined,
    web_industry_position: d.web_industry_position as string | undefined,
    web_core_services: Array.isArray(d.web_core_services) ? (d.web_core_services as string[]) : undefined,
    web_tech_stack: Array.isArray(d.web_tech_stack) ? (d.web_tech_stack as string[]) : undefined,
    web_languages: Array.isArray(d.web_languages) ? (d.web_languages as string[]) : undefined,
    web_certifications: Array.isArray(d.web_certifications) ? (d.web_certifications as string[]) : undefined,
    web_memberships: Array.isArray(d.web_memberships) ? (d.web_memberships as string[]) : undefined,
    web_partnerships: Array.isArray(d.web_partnerships) ? (d.web_partnerships as string[]) : undefined,
    web_has_careers_page: d.web_has_careers_page as boolean | undefined,
    web_has_shop: d.web_has_shop as boolean | undefined,
    web_open_positions_count: d.web_open_positions_count as number | undefined,
    web_page_count: d.web_page_count as number | undefined,
    web_data_confidence: d.web_data_confidence as number | undefined,
    web_analyzed_at: d.web_analyzed_at as string | undefined,
    web_communication_style:
      d.web_communication_style && typeof d.web_communication_style === 'object'
        ? (d.web_communication_style as {
            tone?: string;
            language?: string;
            formality?: string;
            key_phrases?: string[];
          })
        : undefined,
    web_buying_signals: Array.isArray(d.web_buying_signals)
      ? (d.web_buying_signals as { signal: string; evidence?: string; priority?: string; source_url?: string }[])
      : undefined,
    web_outreach_hooks: Array.isArray(d.web_outreach_hooks)
      ? (d.web_outreach_hooks as { hook: string; source_page?: string; suggested_opener?: string }[])
      : undefined,
    web_recent_news: Array.isArray(d.web_recent_news)
      ? (d.web_recent_news as { headline: string; source_url?: string; date_approx?: string; significance?: string }[])
      : undefined,
    web_opportunity_flags: Array.isArray(d.web_opportunity_flags)
      ? (d.web_opportunity_flags as { flag: string; evidence?: string; source?: string; url?: string }[])
      : undefined,
    web_risk_flags: Array.isArray(d.web_risk_flags)
      ? (d.web_risk_flags as { flag: string; evidence?: string; source?: string; url?: string; severity?: string }[])
      : undefined,
    web_sources_used: Array.isArray(d.web_sources_used)
      ? (d.web_sources_used as { url?: string; source?: string; subtype?: string; raw_source_id?: string }[])
      : undefined,
  };
}

// ─── (Demo data and getFallback removed — using live Supabase fetch) ─────────

// ─── Helpers ──────────────────────────────────────────────────────────────────

function glassCard(isDark: boolean): React.CSSProperties {
  const b = isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.7)';
  return {
    background: isDark ? 'rgba(10,12,24,0.46)' : 'rgba(255,255,255,0.22)',
    backdropFilter: 'blur(22px)',
    WebkitBackdropFilter: 'blur(22px)',
    borderTop: b,
    borderRight: b,
    borderBottom: b,
    borderLeft: b,
    boxShadow: isDark
      ? '0 4px 24px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.06)'
      : '0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
  };
}

function scoreColor(s: number) {
  return s >= 85 ? '#10B981' : s >= 70 ? '#F97316' : '#EF4444';
}

function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const col = scoreColor(score);
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(148,163,184,0.2)" strokeWidth={7} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={col}
        strokeWidth={7}
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - score / 100)}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill={col}
        fontSize={14}
        fontWeight={800}
        fontFamily="Inter,sans-serif"
      >
        {score}
      </text>
    </svg>
  );
}

function SectionBlock({
  title,
  badge,
  badgeColor,
  accent,
  children,
  isDark,
  c,
}: {
  title: string;
  badge?: string | number;
  badgeColor?: string;
  accent?: string;
  children: React.ReactNode;
  isDark: boolean;
  c: ReturnType<typeof colors>;
}) {
  const bc = badgeColor ?? '#10B981';
  return (
    <div
      style={{
        ...glassCard(isDark),
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
        ...(accent ? { borderTop: `2px solid ${accent}` } : {}),
      }}
    >
      <div
        style={{
          padding: '9px 14px',
          background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)',
          borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: c.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {title}
        </span>
        {badge !== undefined && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: bc,
              background: bc + '18',
              padding: '1px 8px',
              borderRadius: 99,
            }}
          >
            {badge}
          </span>
        )}
      </div>
      <div style={{ padding: '12px 14px' }}>{children}</div>
    </div>
  );
}

function DataRow({
  label,
  value,
  tag,
  trend,
  c,
  isDark,
}: {
  label: string;
  value?: string;
  tag?: string;
  trend?: 'up' | 'down' | 'stable';
  c: ReturnType<typeof colors>;
  isDark: boolean;
}) {
  const trendColor = trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : '#94A3B8';
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '6px 0',
        borderBottom: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.04)',
      }}
    >
      <span style={{ fontSize: 12, color: c.textMuted, flexShrink: 0, marginRight: 10 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {trend && (
          <span style={{ fontSize: 11, color: trendColor, fontWeight: 700 }}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </span>
        )}
        {tag && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#10B981',
              background: 'rgba(16,185,129,0.15)',
              padding: '1px 6px',
              borderRadius: 4,
            }}
          >
            {tag}
          </span>
        )}
        <span style={{ fontSize: 12, fontWeight: 600, color: value ? c.text : c.textMuted, textAlign: 'right' }}>
          {value || '—'}
        </span>
      </div>
    </div>
  );
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  'Was macht dieses Unternehmen?',
  'Wie ist die Online-Reputation?',
  'Gibt es Widersprüche im Außenauftritt?',
  'Zusammenfassung aller Quellen',
];

const RESEARCH_CHAT_ENDPOINT = '/api/leads/research-chat';

let _chatMsgSeq = 0;
function nextMsgId(suffix: string) {
  return `${++_chatMsgSeq}_${suffix}`;
}

function statusLabel(status: string | null, details: string | null): string {
  if (details && details.trim()) return details.trim();
  if (status === 'searching') return 'Durchsuche verfügbare Datenquellen…';
  if (status === 'fetching') return 'Lade detaillierte Quelldaten…';
  return 'Analysiere…';
}

// Markdown renderer themed with inline styles (this page uses inline styles, not Tailwind).
type CiteSource = { n: string; label: string; url: string };

// Split a "**Quellen:**" footnote section off the message body and parse its entries.
function splitSources(text: string): { body: string; sources: CiteSource[] } {
  const headerRe = /\n[ \t]*(?:-{3,}[ \t]*\n+)?[ \t]*\*{0,2}\s*Quellen\s*:?\s*\*{0,2}[ \t]*(?:\n|$)/i;
  const match = text.match(headerRe);
  if (!match || match.index === undefined) return { body: text, sources: [] };
  const body = text.slice(0, match.index).trimEnd();
  const tail = text.slice(match.index + match[0].length);
  const sources: CiteSource[] = [];
  for (const rawLine of tail.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    const m = line.match(/^\[(\d+)\]\s*(.+)$/);
    if (!m) continue;
    let rest = m[2].trim();
    let url = '';
    const mdLink = rest.match(/\[([^\]]*)\]\((https?:\/\/[^)]+)\)/);
    if (mdLink && mdLink.index !== undefined) {
      url = mdLink[2];
      rest = (rest.slice(0, mdLink.index) + ' ' + (mdLink[1] ?? '')).trim();
    } else {
      const urlM = rest.match(/(https?:\/\/\S+)/);
      if (urlM && urlM.index !== undefined) {
        url = urlM[1];
        rest = rest.slice(0, urlM.index).trim();
      }
    }
    const label = rest.replace(/[\s—–:-]+$/, '').trim();
    sources.push({ n: m[1], label, url });
  }
  return { body, sources };
}

function MarkdownMessage({
  text,
  c,
  isDark,
  msgId,
}: {
  text: string;
  c: ReturnType<typeof colors>;
  isDark: boolean;
  msgId: string;
}) {
  const link = isDark ? '#818CF8' : '#4F46E5';
  const codeBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
  const borderCol = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.12)';
  const badgeBg = isDark ? 'rgba(129,140,248,0.22)' : 'rgba(79,70,229,0.12)';
  const badgeColor = isDark ? '#a5b4fc' : '#4338ca';
  const anchorBase = msgId.replace(/[^a-zA-Z0-9_-]/g, '');
  const [flash, setFlash] = useState<string | null>(null);

  const { body, sources } = splitSources(text);
  const sourceByN = new Map(sources.map((s) => [s.n, s]));
  // Turn inline [n] footnotes into clickable anchors (skip [n](...) that are already links).
  const processed = body.replace(/\[(\d+)\](?!\()/g, (_m, n) => `[${n}](#__cite__${anchorBase}__${n})`);

  function goToSource(n: string) {
    const el = typeof document !== 'undefined' ? document.getElementById(`src-${anchorBase}-${n}`) : null;
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    setFlash(n);
    window.setTimeout(() => setFlash((cur) => (cur === n ? null : cur)), 1400);
  }

  return (
    <div style={{ fontSize: 14, lineHeight: 1.6, color: c.text }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p style={{ margin: '0 0 8px' }}>{children}</p>,
          strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
          em: ({ children }) => <em style={{ fontStyle: 'italic' }}>{children}</em>,
          ul: ({ children }) => (
            <ul style={{ margin: '4px 0 10px', paddingLeft: 20, listStyle: 'disc' }}>{children}</ul>
          ),
          ol: ({ children }) => (
            <ol style={{ margin: '4px 0 10px', paddingLeft: 20, listStyle: 'decimal' }}>{children}</ol>
          ),
          li: ({ children }) => <li style={{ margin: '2px 0' }}>{children}</li>,
          h1: ({ children }) => <h1 style={{ fontSize: 18, fontWeight: 800, margin: '10px 0 6px' }}>{children}</h1>,
          h2: ({ children }) => <h2 style={{ fontSize: 16, fontWeight: 800, margin: '10px 0 6px' }}>{children}</h2>,
          h3: ({ children }) => <h3 style={{ fontSize: 14, fontWeight: 700, margin: '8px 0 4px' }}>{children}</h3>,
          a: ({ children, href }) => {
            const cite = href?.match(/^#__cite__.+__(\d+)$/);
            if (cite) {
              const n = cite[1];
              const src = sourceByN.get(n);
              return (
                <sup style={{ lineHeight: 0 }}>
                  <button
                    type="button"
                    onClick={() => goToSource(n)}
                    title={src ? `[${n}] ${src.label}${src.url ? ` — ${src.url}` : ''}` : `Quelle ${n}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: 16,
                      height: 16,
                      padding: '0 4px',
                      margin: '0 1px',
                      borderRadius: 8,
                      border: 'none',
                      background: badgeBg,
                      color: badgeColor,
                      fontSize: 10,
                      fontWeight: 700,
                      lineHeight: 1,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      verticalAlign: 'super',
                    }}
                  >
                    {n}
                  </button>
                </sup>
              );
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: link, textDecoration: 'underline' }}
              >
                {children}
              </a>
            );
          },
          blockquote: ({ children }) => (
            <blockquote
              style={{ margin: '6px 0', paddingLeft: 12, borderLeft: `3px solid ${borderCol}`, color: c.textSub }}
            >
              {children}
            </blockquote>
          ),
          code: ({ children }) => {
            const isBlock = String(children).includes('\n');
            return isBlock ? (
              <code style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: 12.5 }}>{children}</code>
            ) : (
              <code
                style={{
                  background: codeBg,
                  padding: '1px 5px',
                  borderRadius: 4,
                  fontSize: 12.5,
                  fontFamily: 'var(--font-geist-mono), monospace',
                }}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre
              style={{
                background: codeBg,
                padding: 12,
                borderRadius: 8,
                overflowX: 'auto',
                margin: '6px 0',
                fontSize: 12.5,
              }}
            >
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div style={{ overflowX: 'auto', margin: '8px 0' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th
              style={{
                border: `1px solid ${borderCol}`,
                padding: '6px 9px',
                textAlign: 'left',
                fontWeight: 700,
                background: codeBg,
              }}
            >
              {children}
            </th>
          ),
          td: ({ children }) => <td style={{ border: `1px solid ${borderCol}`, padding: '6px 9px' }}>{children}</td>,
          hr: () => <hr style={{ border: 'none', borderTop: `1px solid ${borderCol}`, margin: '10px 0' }} />,
        }}
      >
        {processed}
      </ReactMarkdown>

      {sources.length > 0 && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: `1px solid ${borderCol}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: c.textMuted,
              marginBottom: 2,
            }}
          >
            Quellen
          </div>
          {sources.map((s) => (
            <div
              key={s.n}
              id={`src-${anchorBase}-${s.n}`}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 8,
                padding: '3px 6px',
                borderRadius: 6,
                background: flash === s.n ? badgeBg : 'transparent',
                transition: 'background 0.4s ease',
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  minWidth: 16,
                  height: 16,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  background: badgeBg,
                  color: badgeColor,
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                {s.n}
              </span>
              <span style={{ fontSize: 12.5, lineHeight: 1.45, minWidth: 0 }}>
                {s.label && <span style={{ fontWeight: 600, color: c.text }}>{s.label}</span>}
                {s.label && s.url && <span style={{ color: c.textMuted }}> — </span>}
                {s.url && (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: link, textDecoration: 'underline', wordBreak: 'break-all' }}
                  >
                    {s.url}
                  </a>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type ChatMsg = { id: string; role: 'user' | 'bot'; text: string; loading?: boolean; error?: boolean };

function ChatTypingDots({ c }: { c: ReturnType<typeof colors> }) {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '12px 16px' }}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          style={{ width: 6, height: 6, borderRadius: '50%', background: c.textMuted, display: 'block' }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.85, 1.1, 0.85] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

function ChatTab({ lead, c, isDark }: { lead: LeadDetail; c: ReturnType<typeof colors>; isDark: boolean }) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [focused, setFocused] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = '24px';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [input, adjustHeight]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [msgs, statusText]);

  // Load prior conversation for this lead (persisted per lead + user).
  // ChatTab is keyed by lead id, so this effect runs once per lead mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${RESEARCH_CHAT_ENDPOINT}?leadId=${encodeURIComponent(lead.id)}`);
        if (!res.ok) return;
        const data: { messages?: { role: string; content: string; created_at: string }[] } = await res.json();
        if (cancelled || !data.messages?.length) return;
        const loaded: ChatMsg[] = data.messages.map((m, i) => ({
          id: `h${i}_${m.created_at}_${m.role}`,
          role: m.role === 'user' ? 'user' : 'bot',
          text: m.content,
        }));
        // Don't clobber an in-progress conversation (fast send before history resolves).
        setMsgs((prev) => (prev.length ? prev : loaded));
      } catch {
        /* history is best-effort */
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lead.id]);

  // Stop polling + abort any in-flight request on unmount.
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setStatusText(null);
  }, []);

  const startPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${RESEARCH_CHAT_ENDPOINT}/status?leadId=${encodeURIComponent(lead.id)}`);
        if (!res.ok) return;
        const data: { status?: { status: string; details: string | null } | null } = await res.json();
        if (data.status) setStatusText(statusLabel(data.status.status, data.status.details));
      } catch {
        /* ignore transient poll errors */
      }
    }, 1100);
  }, [lead.id]);

  const runRequest = useCallback(
    async (msg: string, loadingId: string) => {
      setBusy(true);
      setStatusText(null);
      startPolling();

      const controller = new AbortController();
      abortRef.current = controller;
      const timeout = setTimeout(() => controller.abort(), 290_000);

      try {
        const res = await fetch(RESEARCH_CHAT_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leadId: lead.id, message: msg }),
          signal: controller.signal,
        });
        const data: { reply?: string; error?: string } = await res.json().catch(() => ({}));
        if (!res.ok || !data.reply) throw new Error(data.error || 'Die Anfrage ist fehlgeschlagen.');
        setMsgs((p) => [
          ...p.filter((m) => m.id !== loadingId && !m.loading),
          { id: nextMsgId('r'), role: 'bot', text: data.reply as string },
        ]);
      } catch (err) {
        const aborted = err instanceof DOMException && err.name === 'AbortError';
        const text = aborted
          ? 'Zeitüberschreitung — die Recherche hat zu lange gedauert. Bitte erneut versuchen.'
          : err instanceof Error
            ? err.message
            : 'Unbekannter Fehler.';
        setMsgs((p) => [
          ...p.filter((m) => m.id !== loadingId && !m.loading),
          { id: nextMsgId('e'), role: 'bot', text, error: true },
        ]);
      } finally {
        clearTimeout(timeout);
        abortRef.current = null;
        stopPolling();
        setBusy(false);
      }
    },
    [lead.id, startPolling, stopPolling]
  );

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || busy) return;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = '24px';
    const loadingId = nextMsgId('l');
    setMsgs((p) => [
      ...p.filter((m) => !m.error),
      { id: nextMsgId('u'), role: 'user', text: msg },
      { id: loadingId, role: 'bot', text: '', loading: true },
    ]);
    await runRequest(msg, loadingId);
  }

  function retry() {
    if (busy) return;
    const lastUser = [...msgs].reverse().find((m) => m.role === 'user' && !m.error);
    if (!lastUser) return;
    const loadingId = nextMsgId('l');
    setMsgs((p) => [...p.filter((m) => !m.error), { id: loadingId, role: 'bot', text: '', loading: true }]);
    void runRequest(lastUser.text, loadingId);
  }

  async function clearHistory() {
    if (clearing || busy) return;
    setClearing(true);
    try {
      const res = await fetch(`${RESEARCH_CHAT_ENDPOINT}?leadId=${encodeURIComponent(lead.id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Löschen fehlgeschlagen');
      setMsgs([]);
      setConfirmClear(false);
    } catch {
      /* keep the conversation on failure so nothing is silently lost */
    } finally {
      setClearing(false);
    }
  }

  const hasMessages = msgs.length > 0;

  const inputCard: React.CSSProperties = {
    background: isDark ? 'rgba(10,12,24,0.46)' : 'rgba(255,255,255,0.54)',
    backdropFilter: 'blur(22px)',
    WebkitBackdropFilter: 'blur(22px)',
    borderRadius: 24,
    border: focused
      ? `1px solid ${c.accent}60`
      : isDark
        ? '1px solid rgba(255,255,255,0.10)'
        : '1px solid rgba(255,255,255,0.72)',
    boxShadow: focused
      ? `0 0 0 3px ${c.accent}18, ${isDark ? 'inset 1px 1px 2px rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.32)' : 'inset 3px 3px 4px rgba(255,255,255,0.65), 0 4px 24px rgba(0,0,0,0.07)'}`
      : isDark
        ? 'inset 1px 1px 2px rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.32)'
        : 'inset 3px 3px 4px rgba(255,255,255,0.65), 0 4px 24px rgba(0,0,0,0.07)',
    transition: 'border-color 180ms ease-out, box-shadow 180ms ease-out',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header: clear history */}
      {hasMessages && !loadingHistory && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px 0',
            flexShrink: 0,
          }}
        >
          {confirmClear ? (
            <>
              <span style={{ fontSize: 12, color: c.textMuted }}>Verlauf wirklich löschen?</span>
              <button
                onClick={clearHistory}
                disabled={clearing}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: clearing ? 'default' : 'pointer',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#ef4444',
                  fontFamily: 'inherit',
                  padding: '4px 6px',
                }}
              >
                {clearing ? 'Lösche…' : 'Löschen'}
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                disabled={clearing}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  color: c.textMuted,
                  fontFamily: 'inherit',
                  padding: '4px 6px',
                }}
              >
                Abbrechen
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              disabled={busy}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: 'none',
                border: 'none',
                cursor: busy ? 'default' : 'pointer',
                fontSize: 12,
                fontWeight: 600,
                color: c.textMuted,
                fontFamily: 'inherit',
                padding: '4px 6px',
                opacity: busy ? 0.5 : 1,
              }}
            >
              <Trash2 size={13} />
              Verlauf löschen
            </button>
          )}
        </div>
      )}
      {/* Message area */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '0 0 8px', minHeight: 0 }}>
        {loadingHistory && !hasMessages && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              minHeight: 320,
              color: c.textMuted,
            }}
          >
            <motion.div
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                border: `2px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'}`,
                borderTopColor: isDark ? '#818CF8' : '#4F46E5',
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
            <span style={{ fontSize: 12.5 }}>Lade bisherige Unterhaltung…</span>
          </div>
        )}
        <AnimatePresence>
          {!hasMessages && !loadingHistory && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 320,
                padding: '40px 32px',
                textAlign: 'center',
              }}
            >
              <div style={{ marginBottom: 10 }}>
                <TypingEffect
                  texts={QUICK_PROMPTS}
                  typingSpeed={60}
                  rotationInterval={2200}
                  className="font-inter"
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    color: c.text,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2,
                    fontFamily: 'var(--font-inter), Inter, sans-serif',
                  }}
                />
              </div>
              <div style={{ fontSize: 13, color: c.textMuted, marginBottom: 28, maxWidth: 340 }}>
                Stell mir eine Frage zu {lead.name} — ich analysiere Daten, Signale und Potenzial.
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 440 }}>
                {QUICK_PROMPTS.map((p, i) => (
                  <motion.div
                    key={p}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.07 }}
                  >
                    <GlassButton
                      size="sm"
                      isDark={isDark}
                      onClick={() => send(p)}
                      style={{ fontSize: 12, fontWeight: 600, color: c.text, fontFamily: 'inherit' }}
                    >
                      {p}
                    </GlassButton>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {hasMessages && (
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <AnimatePresence initial={false}>
              {msgs.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, ease: 'easeOut' }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: m.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  {m.loading ? (
                    <div
                      style={{
                        background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.52)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        border: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(255,255,255,0.65)',
                        borderRadius: '16px 16px 16px 4px',
                        boxShadow: isDark
                          ? 'inset 1px 1px 2px rgba(255,255,255,0.06)'
                          : 'inset 2px 2px 3px rgba(255,255,255,0.55)',
                      }}
                    >
                      {statusText ? (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 9,
                            padding: '11px 16px',
                            fontSize: 13,
                            fontWeight: 500,
                            color: c.textSub,
                          }}
                        >
                          <motion.span
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: '50%',
                              background: isDark ? '#818CF8' : '#4F46E5',
                              display: 'block',
                              flexShrink: 0,
                            }}
                            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.15, 0.8] }}
                            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                          />
                          <span>{statusText}</span>
                        </div>
                      ) : (
                        <ChatTypingDots c={c} />
                      )}
                    </div>
                  ) : m.error ? (
                    <div
                      style={{
                        maxWidth: '88%',
                        padding: '11px 16px',
                        borderRadius: '16px 16px 16px 4px',
                        background: isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.08)',
                        border: '1px solid rgba(239,68,68,0.35)',
                        fontSize: 14,
                        lineHeight: 1.55,
                        color: isDark ? '#fca5a5' : '#b91c1c',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 9,
                        alignItems: 'flex-start',
                      }}
                    >
                      <span>{m.text}</span>
                      <GlassButton
                        size="sm"
                        isDark={isDark}
                        onClick={retry}
                        disabled={busy}
                        style={{ fontSize: 12, fontWeight: 700, fontFamily: 'inherit', color: c.text }}
                      >
                        Erneut versuchen
                      </GlassButton>
                    </div>
                  ) : m.role === 'user' ? (
                    <div
                      style={{
                        maxWidth: '80%',
                        padding: '11px 16px',
                        borderRadius: '16px 16px 4px 16px',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        fontSize: 14,
                        lineHeight: 1.55,
                        fontWeight: 600,
                        whiteSpace: 'pre-wrap',
                        background: isDark ? 'rgba(99,102,241,0.28)' : 'rgba(79,70,229,0.13)',
                        border: isDark ? '1px solid rgba(124,58,237,0.45)' : '1px solid rgba(79,70,229,0.28)',
                        boxShadow: isDark
                          ? 'inset 1px 1px 2px rgba(124,58,237,0.18)'
                          : 'inset 2px 2px 3px rgba(255,255,255,0.45)',
                        color: isDark ? '#c4b5fd' : '#3730a3',
                      }}
                    >
                      {m.text}
                    </div>
                  ) : (
                    <div
                      style={{
                        maxWidth: '92%',
                        padding: '10px 16px 4px',
                        borderRadius: '16px 16px 16px 4px',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.52)',
                        border: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(255,255,255,0.65)',
                        boxShadow: isDark
                          ? 'inset 1px 1px 2px rgba(255,255,255,0.06)'
                          : 'inset 2px 2px 3px rgba(255,255,255,0.55)',
                      }}
                    >
                      <MarkdownMessage text={m.text} c={c} isDark={isDark} msgId={m.id} />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Input area */}
      <div style={{ padding: '10px 20px 20px', flexShrink: 0 }}>
        <div style={{ maxWidth: 500, margin: '0 auto' }}>
          <div style={inputCard}>
            <div style={{ padding: '10px 16px 4px', position: 'relative' }}>
              {!input && !focused && (
                <div
                  style={{
                    position: 'absolute',
                    top: 10,
                    left: 16,
                    right: 16,
                    pointerEvents: 'none',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <TypingEffect
                    texts={QUICK_PROMPTS}
                    typingSpeed={55}
                    rotationInterval={2400}
                    style={{
                      fontSize: 15,
                      color: c.textMuted,
                      fontFamily: 'inherit',
                      lineHeight: 1.55,
                    }}
                  />
                </div>
              )}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  fontSize: 15,
                  color: c.text,
                  fontFamily: 'inherit',
                  lineHeight: 1.55,
                  height: 24,
                  minHeight: 24,
                  maxHeight: 140,
                  overflow: 'hidden',
                  boxSizing: 'border-box',
                  caretColor: c.accent,
                }}
              />
            </div>
            <div
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '6px 12px 12px' }}
            >
              <GlassButton
                size="sm"
                isDark={isDark}
                onClick={() => send()}
                disabled={!input.trim() || busy}
                contentClassName="flex items-center gap-1.5"
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: 'inherit',
                  background: input.trim() && !busy ? c.accent : undefined,
                  color: input.trim() && !busy ? '#fff' : c.textMuted,
                }}
              >
                <ArrowUpIcon size={13} />
                <span>Senden</span>
              </GlassButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SourceBadge ─────────────────────────────────────────────────────────────

function SourceBadge({ label, href }: { label: string; href?: string }) {
  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
    fontSize: 10,
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 5,
    background: 'rgba(79,70,229,0.10)',
    color: '#818CF8',
    border: '1px solid rgba(79,70,229,0.18)',
    textDecoration: 'none',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  };
  if (href)
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" style={style}>
        {label} ↗
      </a>
    );
  return <span style={style}>{label}</span>;
}

// ─── EmployeeAreaChart ───────────────────────────────────────────────────────

function EmployeeAreaChart({ history, isDark }: { history: { year: number; employees: number }[]; isDark: boolean }) {
  const sorted = [...history].sort((a, b) => a.year - b.year);
  if (sorted.length < 2) {
    // fallback: single bar
    return <div style={{ fontSize: 13, color: '#94A3B8' }}>{sorted[0]?.employees ?? '—'}</div>;
  }
  const W = 240;
  const H = 90;
  const PAD = 4;
  const max = Math.max(...sorted.map((e) => e.employees));
  const min = Math.min(...sorted.map((e) => e.employees));
  const range = max - min || 1;

  const pts = sorted.map((e, i) => ({
    x: PAD + (i / (sorted.length - 1)) * (W - PAD * 2),
    y: PAD + (1 - (e.employees - min) / range) * (H - PAD * 2 - 14),
    ...e,
  }));

  // Smooth bezier path
  const linePath = pts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    const prev = pts[i - 1];
    const cpx = ((prev.x + p.x) / 2).toFixed(1);
    return `${acc} C ${cpx} ${prev.y.toFixed(1)}, ${cpx} ${p.y.toFixed(1)}, ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }, '');

  const areaPath = `${linePath} L ${(W - PAD).toFixed(1)} ${H - 14} L ${PAD} ${H - 14} Z`;
  const gradId = `empGrad_${isDark ? 'd' : 'l'}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', width: '100%', maxWidth: W, height: 'auto' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10B981" stopOpacity={isDark ? 0.28 : 0.18} />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Gridlines */}
      {[0.33, 0.66, 1].map((t) => (
        <line
          key={t}
          x1={PAD}
          x2={W - PAD}
          y1={PAD + t * (H - PAD * 2 - 14)}
          y2={PAD + t * (H - PAD * 2 - 14)}
          stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}
          strokeDasharray="3 3"
        />
      ))}
      {/* Area fill */}
      <motion.path
        d={areaPath}
        fill={`url(#${gradId})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.1 }}
      />
      {/* Line */}
      <motion.path
        d={linePath}
        fill="none"
        stroke="#10B981"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.1, ease: 'easeInOut' }}
      />
      {/* Points + year labels */}
      {pts.map((p, i) => {
        const isLatest = i === pts.length - 1;
        return (
          <g key={p.year}>
            <circle
              cx={p.x}
              cy={p.y}
              r={isLatest ? 5 : 3}
              fill={isLatest ? '#10B981' : isDark ? 'rgba(16,185,129,0.45)' : 'rgba(16,185,129,0.55)'}
            />
            {isLatest && (
              <circle cx={p.x} cy={p.y} r={9} fill="none" stroke="#10B981" strokeWidth={1.5} strokeOpacity={0.3} />
            )}
            <text
              x={p.x}
              y={H - 1}
              textAnchor="middle"
              fontSize={9}
              fill={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.28)'}
              fontFamily="inherit"
            >
              {String(p.year).slice(2)}
            </text>
            {/* Value label for first, last, and local peaks */}
            {(isLatest || i === 0) && (
              <text
                x={p.x + (i === 0 ? 0 : 0)}
                y={p.y - 9}
                textAnchor="middle"
                fontSize={10}
                fontWeight="800"
                fill={isLatest ? '#10B981' : isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'}
                fontFamily="inherit"
              >
                {p.employees}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── TrendArrow ───────────────────────────────────────────────────────────────

function TrendArrow({ dir, color }: { dir: 'up' | 'down' | 'stable'; color: string }) {
  if (dir === 'stable')
    return (
      <svg width={20} height={20} viewBox="0 0 20 20" fill="none">
        <rect width="20" height="20" rx="10" fill={color} fillOpacity="0.15" />
        <path d="M6 10h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  const arrow = dir === 'up' ? 'M10 14V6M6.5 9.5L10 6l3.5 3.5' : 'M10 6v8M6.5 10.5L10 14l3.5-3.5';
  return (
    <svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <rect width="20" height="20" rx="10" fill={color} fillOpacity="0.18" />
      <path d={arrow} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Expandable ───────────────────────────────────────────────────────────────

function Expandable({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          key="body"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          style={{ overflow: 'hidden' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── RevenueBarChart ─────────────────────────────────────────────────────────

function RevenueBarChart({
  data,
  isDark,
  height = 80,
  compact = false,
  color = '#F97316',
}: {
  data: { year: number; value: number; label: string }[];
  isDark: boolean;
  height?: number;
  compact?: boolean;
  color?: string;
}) {
  const max = Math.max(...data.map((d) => d.value));
  const barW = compact ? 14 : 28;
  const gap = compact ? 4 : 8;
  const total = data.length * (barW + gap) - gap;
  const gradId = `revGrad_${compact ? 'c' : 'f'}_${isDark ? 'd' : 'l'}_${color.replace('#', '')}`;
  return (
    <svg
      viewBox={`0 0 ${total} ${height + (compact ? 14 : 24)}`}
      style={{ display: 'block', width: '100%', maxWidth: total, height: 'auto' }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={isDark ? 0.9 : 0.8} />
          <stop offset="100%" stopColor={color} stopOpacity={0.4} />
        </linearGradient>
      </defs>
      {data.map((d, i) => {
        const bh = max > 0 ? Math.max(3, (d.value / max) * height) : 3;
        const x = i * (barW + gap);
        const isLatest = i === data.length - 1;
        return (
          <g key={d.year}>
            <motion.rect
              x={x}
              y={height - bh}
              width={barW}
              rx={compact ? 3 : 5}
              fill={isLatest ? `url(#${gradId})` : `${color}28`}
              initial={{ height: 0, y: height }}
              animate={{ height: bh, y: height - bh }}
              transition={{ duration: 0.6, delay: i * 0.06, ease: 'easeOut' }}
            />
            {!compact && (
              <text
                x={x + barW / 2}
                y={height + 16}
                textAnchor="middle"
                fontSize={9}
                fill={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.28)'}
                fontFamily="inherit"
              >
                {String(d.year).slice(2)}
              </text>
            )}
            {isLatest && !compact && (
              <text
                x={x + barW / 2}
                y={height - bh - 6}
                textAnchor="middle"
                fontSize={10}
                fontWeight="800"
                fill={color}
                fontFamily="inherit"
              >
                {d.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── EquityTrendChart ────────────────────────────────────────────────────────

function EquityTrendChart({ history, isDark }: { history: { year: number; equity_eur?: number }[]; isDark: boolean }) {
  const W = 300;
  const H = 110;
  const PAD = { l: 10, r: 10, t: 22, b: 22 };
  const iW = W - PAD.l - PAD.r;
  const iH = H - PAD.t - PAD.b;
  const sorted = [...history].sort((a, b) => a.year - b.year);
  if (sorted.length < 2) return null;
  const maxVal = Math.max(...sorted.map((p) => p.equity_eur ?? 0), 1);
  const baseline = PAD.t + iH;

  const pts = sorted.map((p, i) => ({
    x: PAD.l + (i / (sorted.length - 1)) * iW,
    y: PAD.t + iH - (Math.max(0, p.equity_eur ?? 0) / maxVal) * iH,
    year: p.year,
    val: p.equity_eur ?? 0,
  }));

  const linePath = pts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    const prev = pts[i - 1];
    const cpx = ((prev.x + p.x) / 2).toFixed(1);
    return `${acc} C ${cpx} ${prev.y.toFixed(1)}, ${cpx} ${p.y.toFixed(1)}, ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }, '');

  const areaPath = `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${baseline} L ${pts[0].x.toFixed(1)} ${baseline} Z`;
  const gradId = `eqArea_${isDark ? 'd' : 'l'}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', width: '100%', height: 'auto' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10B981" stopOpacity={isDark ? 0.35 : 0.22} />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Zero baseline */}
      <line
        x1={PAD.l}
        x2={W - PAD.r}
        y1={baseline}
        y2={baseline}
        stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}
        strokeWidth={1}
      />
      {/* Subtle grid */}
      {[0.33, 0.66].map((t) => (
        <line
          key={t}
          x1={PAD.l}
          x2={W - PAD.r}
          y1={PAD.t + t * iH}
          y2={PAD.t + t * iH}
          stroke={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}
          strokeDasharray="4 4"
        />
      ))}
      {/* Area */}
      <motion.path
        d={areaPath}
        fill={`url(#${gradId})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.1 }}
      />
      {/* Line */}
      <motion.path
        d={linePath}
        fill="none"
        stroke="#10B981"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.3, ease: 'easeInOut' }}
      />
      {/* Points */}
      {pts.map((p, i) => {
        const isLast = i === pts.length - 1;
        const isFirst = i === 0;
        const isZero = p.val === 0;
        const showLabel = isFirst || isLast;
        return (
          <g key={p.year}>
            <circle
              cx={p.x}
              cy={p.y}
              r={isLast ? 5 : isZero ? 2.5 : 3}
              fill={isZero ? (isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)') : '#10B981'}
            />
            {isLast && (
              <circle cx={p.x} cy={p.y} r={9} fill="none" stroke="#10B981" strokeWidth={1.5} strokeOpacity={0.3} />
            )}
            <text
              x={p.x}
              y={H - 2}
              textAnchor="middle"
              fontSize={9}
              fill={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.28)'}
              fontFamily="inherit"
            >
              {String(p.year).slice(2)}
            </text>
            {showLabel && p.val > 0 && (
              <text
                x={p.x}
                y={p.y - 10}
                textAnchor={isFirst ? 'start' : 'end'}
                fontSize={10}
                fontWeight="800"
                fill="#10B981"
                fontFamily="inherit"
              >
                {p.val >= 1_000_000 ? `${(p.val / 1_000_000).toFixed(2)}M` : `${Math.round(p.val / 1000)}k`}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── DonutGauge ───────────────────────────────────────────────────────────────

function DonutGauge({
  pct,
  isDark,
  c,
  centerLabel = 'Eigenkapital',
  statusLabel,
  colorOverride,
}: {
  pct: number;
  isDark: boolean;
  c: ReturnType<typeof colors>;
  centerLabel?: string;
  statusLabel?: string;
  colorOverride?: string;
}) {
  const R = 40;
  const circumference = 2 * Math.PI * R;
  const dash = (Math.min(100, Math.max(0, pct)) / 100) * circumference;
  const gaugeColor = colorOverride ?? (pct >= 30 ? '#10B981' : pct >= 15 ? '#F97316' : '#EF4444');
  const gaugeLabel = statusLabel ?? (pct >= 30 ? 'Solide' : pct >= 15 ? 'Mittel' : 'Schwach');

  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 6 }}>
      <svg width={110} height={110} viewBox="0 0 110 110">
        {/* Track */}
        <circle
          cx={55}
          cy={55}
          r={R}
          fill="none"
          stroke={isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}
          strokeWidth={10}
        />
        {/* Arc */}
        <motion.circle
          cx={55}
          cy={55}
          r={R}
          fill="none"
          stroke={gaugeColor}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - dash }}
          transition={{ duration: 1.3, ease: 'easeOut' }}
          transform="rotate(-90 55 55)"
        />
        {/* Center */}
        <text x={55} y={50} textAnchor="middle" fontSize={22} fontWeight="800" fill={gaugeColor} fontFamily="inherit">
          {pct}%
        </text>
        <text
          x={55}
          y={66}
          textAnchor="middle"
          fontSize={9}
          fill={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'}
          fontFamily="inherit"
        >
          {centerLabel}
        </text>
      </svg>
      <div style={{ fontSize: 11, fontWeight: 700, color: gaugeColor }}>{gaugeLabel}</div>
    </div>
  );
}

// ─── HealthGauge ─────────────────────────────────────────────────────────────

function HealthGauge({ score, isDark, c }: { score: number; isDark: boolean; c: ReturnType<typeof colors> }) {
  const color = score >= 70 ? '#10B981' : score >= 45 ? '#F97316' : '#EF4444';
  const label = score >= 70 ? 'Gesund' : score >= 45 ? 'Mittel' : 'Risiko';
  const r = 44;
  const circ = Math.PI * r; // half circle
  const dash = circ * (score / 100);
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center' }}>
      <div style={{ position: 'relative', width: 110, height: 60, overflow: 'visible' }}>
        <svg width={110} height={60} viewBox="0 0 110 60" style={{ overflow: 'visible' }}>
          <path
            d="M 11 55 A 44 44 0 0 1 99 55"
            fill="none"
            stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}
            strokeWidth={10}
            strokeLinecap="round"
          />
          <motion.path
            d="M 11 55 A 44 44 0 0 1 99 55"
            fill="none"
            stroke={color}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={`${circ}`}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - dash }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
          />
        </svg>
        <div
          style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}
        >
          <div style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1 }}>{score}</div>
        </div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color, marginTop: 4 }}>{label}</div>
      <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>Finanzielle Gesundheit</div>
    </div>
  );
}

// ─── InfoTip ─────────────────────────────────────────────────────────────────

function InfoTip({ text, isDark }: { text: string; isDark: boolean }) {
  const btnRef = useRef<HTMLSpanElement>(null);
  const [tipPos, setTipPos] = useState<{ x: number; y: number } | null>(null);

  const handleEnter = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setTipPos({ x: r.left + r.width / 2, y: r.top });
  };

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle' }}>
      <span
        ref={btnRef}
        onMouseEnter={handleEnter}
        onMouseLeave={() => setTipPos(null)}
        style={{
          cursor: 'help',
          width: 13,
          height: 13,
          borderRadius: '50%',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.22)'}`,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 8,
          color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
          marginLeft: 4,
          flexShrink: 0,
          lineHeight: 1,
          userSelect: 'none' as const,
        }}
      >
        i
      </span>
      {tipPos != null &&
        createPortal(
          <span
            style={{
              position: 'fixed',
              left: tipPos.x,
              top: tipPos.y - 6,
              transform: 'translateX(-50%) translateY(-100%)',
              background: isDark ? 'rgba(8,8,16,0.97)' : '#fff',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.09)'}`,
              borderRadius: 9,
              padding: '8px 11px',
              fontSize: 11,
              color: isDark ? 'rgba(255,255,255,0.78)' : 'rgba(0,0,0,0.72)',
              lineHeight: 1.55,
              width: 220,
              zIndex: 9999,
              boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.5)' : '0 4px 16px rgba(0,0,0,0.1)',
              pointerEvents: 'none',
              whiteSpace: 'normal' as const,
            }}
          >
            {text}
          </span>,
          document.body
        )}
    </span>
  );
}

// ─── DualLineChart ────────────────────────────────────────────────────────────

function DualLineChart({
  history,
  isDark,
}: {
  history: {
    year: number;
    balance_sheet_total_eur?: number | null;
    equity_eur?: number | null;
    revenue_eur?: number | null;
  }[];
  isDark: boolean;
}) {
  const data = history
    .filter((d) => d.balance_sheet_total_eur != null)
    .map((d) => ({
      year: String(d.year),
      bilanz: d.balance_sheet_total_eur != null ? +(d.balance_sheet_total_eur / 1_000_000).toFixed(3) : null,
      eigenkapital: d.equity_eur != null ? +Math.max(0, d.equity_eur / 1_000_000).toFixed(3) : null,
      umsatz: d.revenue_eur != null && d.revenue_eur > 0 ? +Math.max(0, d.revenue_eur / 1_000_000).toFixed(3) : null,
    }));

  if (data.length < 2) return null;

  const hasRevenue = data.some((d) => d.umsatz != null && d.umsatz > 0);

  const fmtM = (v: number) => (v >= 10 ? `${v.toFixed(1)}M` : `${v.toFixed(2)}M`);

  const grid = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const tickFill = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: { dataKey: string; value: number; color: string }[];
    label?: string;
  }) => {
    if (!active || !payload?.length) return null;
    const rows: { key: string; label: string; color: string }[] = [
      { key: 'bilanz', label: 'Bilanzsumme', color: '#818CF8' },
      { key: 'eigenkapital', label: 'Eigenkapital', color: '#34D399' },
      ...(hasRevenue ? [{ key: 'umsatz', label: 'Umsatz (Schätz.)', color: '#F97316' }] : []),
    ];
    return (
      <div
        style={{
          background: isDark ? 'rgba(10,10,20,0.96)' : 'rgba(255,255,255,0.98)',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          borderRadius: 10,
          padding: '10px 14px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          minWidth: 160,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)',
            letterSpacing: '0.06em',
            marginBottom: 8,
            paddingBottom: 6,
            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
          }}
        >
          {label}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {rows.map((row) => {
            const point = payload.find((p) => p.dataKey === row.key);
            if (!point || point.value == null) return null;
            return (
              <div
                key={row.key}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      background: row.color,
                      boxShadow: `0 0 4px ${row.color}80`,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 11, color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)' }}>
                    {row.label}
                  </span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: row.color }}>{fmtM(point.value)}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{ width: '100%', height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 16, right: 24, bottom: 4, left: 8 }}>
          <defs>
            <linearGradient id="gradBilanz" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#818CF8" stopOpacity={isDark ? 0.25 : 0.15} />
              <stop offset="95%" stopColor="#818CF8" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradEigenkapital" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#34D399" stopOpacity={isDark ? 0.2 : 0.12} />
              <stop offset="95%" stopColor="#34D399" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradUmsatz" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F97316" stopOpacity={isDark ? 0.2 : 0.12} />
              <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid vertical={false} stroke={grid} strokeDasharray="0" />

          <XAxis
            dataKey="year"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fill: tickFill, fontSize: 10, fontFamily: 'ui-monospace, monospace' }}
          />

          <YAxis hide />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{
              stroke: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
              strokeWidth: 1,
              strokeDasharray: '4 4',
            }}
          />

          <Area
            type="natural"
            dataKey="bilanz"
            stroke="#818CF8"
            strokeWidth={2}
            fill="url(#gradBilanz)"
            dot={false}
            activeDot={{ r: 4, fill: '#818CF8', stroke: isDark ? '#1a1a2e' : '#fff', strokeWidth: 2 }}
          />
          <Area
            type="natural"
            dataKey="eigenkapital"
            stroke="#34D399"
            strokeWidth={2}
            fill="url(#gradEigenkapital)"
            dot={false}
            activeDot={{ r: 4, fill: '#34D399', stroke: isDark ? '#1a1a2e' : '#fff', strokeWidth: 2 }}
          />
          {hasRevenue && (
            <Area
              type="natural"
              dataKey="umsatz"
              stroke="#F97316"
              strokeWidth={2}
              fill="url(#gradUmsatz)"
              dot={false}
              activeDot={{ r: 4, fill: '#F97316', stroke: isDark ? '#1a1a2e' : '#fff', strokeWidth: 2 }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function deLabel(raw?: string | null): string | null {
  if (!raw) return null;
  const map: Record<string, string> = {
    stagnating: 'Stagnierend',
    stagnant: 'Stagnierend',
    growing: 'Wachsend',
    growth: 'Wachsend',
    declining: 'Rückläufig',
    declining_growth: 'Rückläufig',
    stable: 'Stabil',
    improving: 'Aufsteigend',
    critical: 'Kritisch',
    strong: 'Stark',
    good: 'Gut',
    solid: 'Solide',
    medium: 'Mittel',
    weak: 'Schwach',
    inactive: 'Inaktiv',
    // Management stability
    very_stable: 'Sehr Stabil',
    moderate: 'Solide',
    unstable: 'Wechselnd',
    high_turnover: 'Hohe Fluktuation',
    new_leadership: 'Neue Führung',
    founder_led: 'Gründergeführt',
  };
  return map[raw.toLowerCase()] ?? raw;
}

// ─── FinanzenTab ──────────────────────────────────────────────────────────────

function FinanzenTab({ lead, c, isDark }: { lead: LeadDetail; c: ReturnType<typeof colors>; isDark: boolean }) {
  const ph = ((lead._financialsHistory ?? []).length > 0 ? lead._financialsHistory! : (lead._profitHistory ?? [])).sort(
    (a, b) => a.year - b.year
  );
  const latest = ph[ph.length - 1];

  const fmtEur = (v: number) =>
    v >= 1_000_000
      ? `${(v / 1_000_000).toFixed(2).replace('.', ',')} Mio. €`
      : `${Math.round(v).toLocaleString('de-DE')} €`;

  const balanceData = ph
    .filter((p) => p.balance_sheet_total_eur != null)
    .map((p) => ({
      year: p.year,
      value: p.balance_sheet_total_eur! / 1_000_000,
      label: `${(p.balance_sheet_total_eur! / 1_000_000).toFixed(2)}M`,
    }));

  const equityData = ph
    .filter((p) => p.equity_eur != null)
    .map((p) => ({
      year: p.year,
      value: Math.max(0, p.equity_eur! / 1_000_000),
      label: `${(Math.max(0, p.equity_eur!) / 1_000_000).toFixed(2)}M`,
    }));

  const ekQuote = latest?.equity_ratio_pct ?? null;
  const cashVal = latest?.cash_eur ?? null;
  const liabVal = latest?.liabilities_eur ?? null;
  const bsTotal = latest?.balance_sheet_total_eur ?? null;
  const salariesVal = lead.fin_salaries_eur ?? null;
  const capitalVal = lead.fin_capital_eur ?? null;
  const netIncomeVal =
    lead.fin_net_income_eur ?? (latest as { net_income_eur?: number } | undefined)?.net_income_eur ?? null;

  const healthScore = lead.fin_health_score ?? null;
  const healthLabel = deLabel(lead.fin_health_label) ?? null;
  const riskFlags = lead.fin_risk_flags ?? [];
  const opportunityFlags = lead.fin_opportunity_flags ?? [];
  const analysisText = lead.fin_analysis_summary ?? lead.financials;
  const estimatedRevenue = lead.fin_estimated_revenue_eur ?? null;

  const trendBadge = (trend: string | undefined, label: string) => {
    if (!trend || trend === 'unknown') return null;
    const isGood = trend === 'growing' || trend === 'stable' || trend === 'improving';
    const isBad = trend === 'declining' || trend === 'critical';
    const color = isGood ? '#10B981' : isBad ? '#EF4444' : '#F97316';
    const icon = isGood ? '↑' : isBad ? '↓' : '~';
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 3,
          fontSize: 10,
          fontWeight: 700,
          color,
          background: `${color}18`,
          borderRadius: 99,
          padding: '2px 8px',
        }}
      >
        {icon} {label}
      </span>
    );
  };

  const severityColor = (s?: string) => (s === 'high' ? '#EF4444' : s === 'medium' ? '#F97316' : '#94A3B8');

  const gridLine = isDark ? 'rgba(255,255,255,0.028)' : 'rgba(0,0,0,0.028)';
  const chartCard = (accentColor: string): React.CSSProperties => ({
    ...glassCard(isDark),
    borderRadius: 16,
    padding: '20px 22px',
    borderTop: `2px solid ${accentColor}`,
    position: 'relative',
    overflow: 'hidden',
    backgroundImage: `linear-gradient(${gridLine} 1px, transparent 1px), linear-gradient(90deg, ${gridLine} 1px, transparent 1px)`,
    backgroundSize: '24px 24px',
  });

  const Glow = ({ color }: { color: string }) => (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '55%',
        background: `radial-gradient(ellipse at 50% 110%, ${color}1a 0%, transparent 65%)`,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );

  const Inner = ({ children }: { children: React.ReactNode }) => (
    <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
  );

  const LABEL: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 800,
    color: c.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.09em',
    marginBottom: 6,
  };

  const compositionSegments =
    bsTotal != null && bsTotal > 0
      ? [
          { label: 'Eigenkapital', val: latest?.equity_eur ?? 0, color: '#10B981' },
          { label: 'Cash', val: cashVal ?? 0, color: '#06B6D4' },
          { label: 'Verbindlichkeiten', val: liabVal ?? 0, color: '#EF4444' },
        ]
      : [];

  if (ph.length === 0) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center' as const, color: c.textMuted, fontSize: 14 }}>
        Keine Bilanzdaten aus dem Bundesanzeiger verfügbar.
      </div>
    );
  }

  const healthColor =
    healthScore == null ? c.textMuted : healthScore >= 65 ? '#10B981' : healthScore >= 40 ? '#F97316' : '#EF4444';
  const SEGS = ['#EF4444', '#F97316', '#FB923C', '#FBBF24', '#FDE047', '#A3E635', '#4ADE80', '#22C55E', '#16A34A'];

  const card = (accent?: string): React.CSSProperties => ({
    borderRadius: 13,
    padding: '14px 16px',
    background: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.022)',
    border: `1px solid ${accent ? `${accent}28` : isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  });

  const LBL: React.CSSProperties = {
    fontSize: 9,
    fontWeight: 700,
    color: c.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.09em',
    marginBottom: 4,
  };

  const computedLabel =
    healthScore == null
      ? null
      : healthScore >= 80
        ? 'Stark'
        : healthScore >= 65
          ? 'Gut'
          : healthScore >= 50
            ? 'Solide'
            : healthScore >= 35
              ? 'Mittel'
              : healthScore >= 20
                ? 'Schwach'
                : 'Kritisch';

  const sep = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const hasRevenueData = ph.some((p) => (p as { revenue_eur?: number }).revenue_eur != null);

  return (
    <div
      style={{
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 14,
        overflowY: 'auto' as const,
      }}
    >
      {/* ── KPI bar ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
        {[
          {
            label: 'Bilanzsumme',
            val: bsTotal != null ? fmtEur(bsTotal) : '—',
            color: '#818CF8',
            sub: bsTotal != null ? `${balanceData.length} Jahresabschlüsse` : 'Keine Daten',
            muted: false,
          },
          {
            label: 'Eigenkapital',
            val: latest?.equity_eur != null ? fmtEur(latest.equity_eur) : '—',
            color: '#34D399',
            sub: latest?.year != null ? `Stand ${latest.year}` : '—',
            muted: false,
          },
          {
            label: 'Umsatz (Schätzung)',
            val: estimatedRevenue != null ? fmtEur(estimatedRevenue) : '—',
            color: '#F97316',
            sub: lead.fin_estimated_revenue_method ?? 'KI-Schätzung · nicht offiziell',
            muted: true,
          },
          {
            label: 'Verbindlichkeiten',
            val: liabVal != null ? fmtEur(liabVal) : '—',
            color: '#F87171',
            sub: latest?.year != null ? `Stand ${latest.year}` : '—',
            muted: false,
          },
        ].map((m) => (
          <div
            key={m.label}
            style={{
              ...card(),
              display: 'flex',
              flexDirection: 'column' as const,
              gap: 5,
              padding: '16px 18px',
            }}
          >
            <span style={LBL}>{m.label}</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: m.color, lineHeight: 1 }}>{m.val}</span>
            <span style={{ fontSize: 10, color: m.muted ? `${m.color}88` : c.textMuted }}>{m.sub}</span>
          </div>
        ))}
      </div>

      {/* ── Header: 3-col layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {/* Left — Finanzielle Gesundheit + KI-Analyse */}
        <div
          style={{
            ...card('#F97316'),
            display: 'flex',
            flexDirection: 'column' as const,
            gap: 5,
            borderLeft: `3px solid ${healthColor}`,
          }}
        >
          <span style={LBL}>Finanzielle Gesundheit</span>
          <span style={{ fontSize: 26, fontWeight: 800, color: healthColor, lineHeight: 1 }}>
            {computedLabel ?? healthLabel ?? '—'}
          </span>
          {healthScore != null && <span style={{ fontSize: 10, color: c.textMuted }}>{healthScore} / 100</span>}
          <div style={{ position: 'relative', marginTop: 2 }}>
            <div style={{ display: 'flex', gap: 2 }}>
              {SEGS.map((seg, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: 5,
                    borderRadius: 99,
                    background: seg,
                    opacity: healthScore != null ? 1 : 0.2,
                  }}
                />
              ))}
            </div>
            {healthScore != null && (
              <div
                style={{
                  position: 'absolute',
                  top: -3,
                  left: `calc(${Math.min(96, Math.max(2, healthScore))}% - 1px)`,
                  width: 2,
                  height: 11,
                  background: isDark ? '#fff' : '#111',
                  borderRadius: 1,
                }}
              />
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: c.textMuted }}>
            <span>Kritisch</span>
            <span>Stark</span>
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const, marginTop: 2 }}>
            {trendBadge(lead.fin_balance_sheet_trend, 'Bilanz')}
            {trendBadge(lead.fin_equity_trend, 'Kapital')}
            {trendBadge(lead.fin_revenue_trend, 'Umsatz')}
          </div>
          {analysisText && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column' as const,
                justifyContent: 'space-evenly',
              }}
            >
              <div
                style={{
                  height: 1,
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                }}
              />
              <p style={{ fontSize: 13, color: c.text, lineHeight: 1.75, margin: 0 }}>{analysisText}</p>
            </div>
          )}
        </div>

        {/* Middle — compact area chart */}
        {ph.length >= 2 &&
          (() => {
            const miniData = ph
              .filter((d) => d.balance_sheet_total_eur != null)
              .map((d) => ({
                year: String(d.year),
                bilanz: d.balance_sheet_total_eur != null ? +(d.balance_sheet_total_eur / 1_000_000).toFixed(3) : null,
                eigenkapital: d.equity_eur != null ? +Math.max(0, d.equity_eur / 1_000_000).toFixed(3) : null,
              }));
            if (miniData.length < 2) return null;
            const fmtM = (v: number) => (v >= 10 ? `${v.toFixed(1)}M` : `${v.toFixed(2)}M`);
            const miniGrid = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
            const miniTick = isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.28)';
            const MiniTooltip = ({
              active,
              payload,
              label,
            }: {
              active?: boolean;
              payload?: { dataKey: string; value: number; color: string }[];
              label?: string;
            }) => {
              if (!active || !payload?.length) return null;
              return (
                <div
                  style={{
                    background: isDark ? 'rgba(10,10,20,0.96)' : 'rgba(255,255,255,0.98)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                    borderRadius: 8,
                    padding: '8px 12px',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.16)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                      letterSpacing: '0.06em',
                      marginBottom: 6,
                      paddingBottom: 4,
                      borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
                    }}
                  >
                    {label}
                  </div>
                  {[
                    { key: 'bilanz', label: 'Bilanzsumme', color: '#818CF8' },
                    { key: 'eigenkapital', label: 'Eigenkapital', color: '#34D399' },
                  ].map((row) => {
                    const point = payload.find((p) => p.dataKey === row.key);
                    if (!point || point.value == null) return null;
                    return (
                      <div
                        key={row.key}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <div style={{ width: 7, height: 7, borderRadius: 2, background: row.color }} />
                          <span style={{ fontSize: 10, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                            {row.label}
                          </span>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: row.color }}>{fmtM(point.value)}</span>
                      </div>
                    );
                  })}
                </div>
              );
            };
            return (
              <div
                style={{
                  ...card(),
                  padding: 0,
                  overflow: 'hidden' as const,
                  display: 'flex',
                  flexDirection: 'column' as const,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px 6px',
                  }}
                >
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: c.text }}>Bilanzverlauf</span>
                    <span style={{ fontSize: 9, color: c.textMuted, marginLeft: 6 }}>
                      {ph[0]?.year}–{ph[ph.length - 1]?.year}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {trendBadge(lead.fin_balance_sheet_trend, 'Bilanz')}
                    {[
                      { color: '#818CF8', label: 'Bilanz' },
                      { color: '#34D399', label: 'EK' },
                    ].map((l) => (
                      <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <svg width={12} height={2} style={{ flexShrink: 0 }}>
                          <line x1={0} y1={1} x2={12} y2={1} stroke={l.color} strokeWidth={2} />
                        </svg>
                        <span style={{ fontSize: 9, color: l.color, fontWeight: 600 }}>{l.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ flex: 1, position: 'relative' as const, minHeight: 155, overflow: 'hidden' as const }}>
                  <div style={{ position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: -2 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={miniData} margin={{ top: 20, right: 16, bottom: 2, left: 8 }}>
                        <defs>
                          <linearGradient id="gradMBilanz" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#818CF8" stopOpacity={isDark ? 0.3 : 0.18} />
                            <stop offset="95%" stopColor="#818CF8" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gradMEigenkapital" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#34D399" stopOpacity={isDark ? 0.25 : 0.14} />
                            <stop offset="95%" stopColor="#34D399" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke={miniGrid} strokeDasharray="0" />
                        <XAxis
                          dataKey="year"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={6}
                          tick={{ fill: miniTick, fontSize: 9, fontFamily: 'ui-monospace, monospace' }}
                        />
                        <YAxis hide />
                        <Tooltip
                          content={<MiniTooltip />}
                          cursor={{
                            stroke: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                            strokeWidth: 1,
                            strokeDasharray: '4 4',
                          }}
                        />
                        <Area
                          type="natural"
                          dataKey="bilanz"
                          stroke="#818CF8"
                          strokeWidth={1.5}
                          fill="url(#gradMBilanz)"
                          dot={false}
                          activeDot={{ r: 3, fill: '#818CF8', stroke: isDark ? '#1a1a2e' : '#fff', strokeWidth: 2 }}
                        />
                        <Area
                          type="natural"
                          dataKey="eigenkapital"
                          stroke="#34D399"
                          strokeWidth={1.5}
                          fill="url(#gradMEigenkapital)"
                          dot={false}
                          activeDot={{ r: 3, fill: '#34D399', stroke: isDark ? '#1a1a2e' : '#fff', strokeWidth: 2 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            );
          })()}

        {/* Right — Bilanzstruktur + Bilanzkennzahlen */}
        <div style={{ ...card(), display: 'flex', flexDirection: 'column' as const }}>
          {/* Bilanzstruktur */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <span style={LBL}>Bilanzstruktur {latest?.year ?? ''}</span>
            {bsTotal != null && (
              <span style={{ fontSize: 10, fontWeight: 700, color: c.textMuted }}>{fmtEur(bsTotal)}</span>
            )}
          </div>
          {compositionSegments.length > 0 ? (
            <>
              <div style={{ height: 5, borderRadius: 99, overflow: 'hidden', display: 'flex', marginBottom: 12 }}>
                {compositionSegments.map((seg, i) => {
                  const pct = bsTotal! > 0 ? (seg.val / bsTotal!) * 100 : 0;
                  return (
                    <motion.div
                      key={seg.label}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.75, delay: i * 0.06 }}
                      style={{ height: '100%', background: seg.color }}
                    />
                  );
                })}
              </div>
              {compositionSegments.map((seg) => {
                const pct = bsTotal! > 0 ? Math.round((seg.val / bsTotal!) * 100) : 0;
                return (
                  <div
                    key={seg.label}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '5px 0',
                      borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: seg.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: c.text }}>{seg.label}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 10, color: c.textMuted }}>{fmtEur(seg.val)}</span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: seg.color,
                          minWidth: 32,
                          textAlign: 'right' as const,
                        }}
                      >
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <span style={{ fontSize: 11, color: c.textMuted }}>Keine Strukturdaten verfügbar.</span>
          )}
          {/* Separator */}
          <div
            style={{
              height: 1,
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
              margin: '14px 0 12px',
            }}
          />
          {/* Bilanzkennzahlen */}
          <div style={LBL}>Bilanzkennzahlen</div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 11, marginTop: 10 }}>
            {(
              [
                ekQuote != null
                  ? {
                      label: 'EK-Quote',
                      val: `${ekQuote.toFixed(1)}%`,
                      pct: Math.min(100, ekQuote),
                      color: ekQuote >= 30 ? '#34D399' : ekQuote >= 15 ? '#F97316' : '#EF4444',
                      tip: 'Eigenkapitalquote — Anteil des Eigenkapitals an der Bilanzsumme. Ab 30 % gilt ein Unternehmen als finanzstark, unter 15 % als schwach.',
                    }
                  : null,
                cashVal != null && bsTotal != null && bsTotal > 0
                  ? {
                      label: 'Cash-Quote',
                      val: `${Math.round((cashVal / bsTotal) * 100)}%`,
                      pct: Math.min(100, (cashVal / bsTotal) * 100),
                      color: '#06B6D4',
                      tip: `Cash-Quote — Anteil der liquiden Mittel an der Bilanzsumme (${fmtEur(cashVal)}). Zeigt, wie viel Kapital kurzfristig verfügbar ist.`,
                    }
                  : null,
                liabVal != null && bsTotal != null && bsTotal > 0
                  ? {
                      label: 'Verbindl.-Quote',
                      val: `${Math.round((liabVal / bsTotal) * 100)}%`,
                      pct: Math.min(100, (liabVal / bsTotal) * 100),
                      color: '#F87171',
                      tip: `Verbindlichkeitsquote — Anteil der Schulden an der Bilanzsumme (${fmtEur(liabVal)}). Je niedriger, desto stabiler die Finanzstruktur.`,
                    }
                  : null,
              ].filter(Boolean) as { label: string; val: string; pct: number; color: string; tip: string }[]
            ).map((row) => (
              <div key={row.label}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 4,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: c.text }}>{row.label}</span>
                    <InfoTip text={row.tip} isDark={isDark} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: row.color }}>{row.val}</span>
                </div>
                <div
                  style={{
                    height: 3,
                    borderRadius: 99,
                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                    overflow: 'hidden',
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${row.pct}%` }}
                    transition={{ duration: 0.8 }}
                    style={{ height: '100%', borderRadius: 99, background: row.color }}
                  />
                </div>
              </div>
            ))}
            {ekQuote == null && cashVal == null && liabVal == null && (
              <span style={{ fontSize: 11, color: c.textMuted }}>Keine Kennzahlen verfügbar.</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Flags ── */}
      {(riskFlags.length > 0 || opportunityFlags.length > 0) && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: riskFlags.length > 0 && opportunityFlags.length > 0 ? '1fr 1fr' : '1fr',
            gap: 12,
          }}
        >
          {riskFlags.length > 0 && (
            <div
              style={{
                borderRadius: 13,
                padding: '16px 18px',
                background: isDark ? 'rgba(239,68,68,0.05)' : 'rgba(239,68,68,0.03)',
                border: '1px solid rgba(239,68,68,0.15)',
                borderLeft: '3px solid #EF4444',
                display: 'flex',
                flexDirection: 'column' as const,
                gap: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ ...LBL, color: '#EF4444', marginBottom: 0 }}>Risiken</span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#EF4444',
                    background: 'rgba(239,68,68,0.12)',
                    borderRadius: 99,
                    padding: '2px 7px',
                  }}
                >
                  {riskFlags.length}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column' as const,
                  flex: 1,
                  justifyContent: 'space-between' as const,
                }}
              >
                {riskFlags.map((f, i) => {
                  const dotColor = severityColor(f.severity);
                  return (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        gap: 11,
                        paddingBottom: i < riskFlags.length - 1 ? 12 : 0,
                        borderBottom: i < riskFlags.length - 1 ? `1px solid ${sep}` : 'none',
                        marginBottom: i < riskFlags.length - 1 ? 12 : 0,
                      }}
                    >
                      <div style={{ flexShrink: 0, marginTop: 4 }}>
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: dotColor,
                            boxShadow: `0 0 6px ${dotColor}80`,
                          }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: c.text, lineHeight: 1.4 }}>{f.flag}</div>
                        {f.evidence && (
                          <div style={{ fontSize: 11, color: c.textMuted, marginTop: 3, lineHeight: 1.55 }}>
                            {f.evidence}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {opportunityFlags.length > 0 && (
            <div
              style={{
                borderRadius: 13,
                padding: '16px 18px',
                background: isDark ? 'rgba(16,185,129,0.05)' : 'rgba(16,185,129,0.03)',
                border: '1px solid rgba(16,185,129,0.15)',
                borderLeft: '3px solid #10B981',
                display: 'flex',
                flexDirection: 'column' as const,
                gap: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ ...LBL, color: '#10B981', marginBottom: 0 }}>Chancen</span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#10B981',
                    background: 'rgba(16,185,129,0.12)',
                    borderRadius: 99,
                    padding: '2px 7px',
                  }}
                >
                  {opportunityFlags.length}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column' as const,
                  flex: 1,
                  justifyContent: 'space-between' as const,
                }}
              >
                {opportunityFlags.map((f, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: 11,
                      paddingBottom: i < opportunityFlags.length - 1 ? 12 : 0,
                      borderBottom: i < opportunityFlags.length - 1 ? `1px solid ${sep}` : 'none',
                      marginBottom: i < opportunityFlags.length - 1 ? 12 : 0,
                    }}
                  >
                    <div style={{ flexShrink: 0, marginTop: 4 }}>
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: '#10B981',
                          boxShadow: '0 0 6px #10B98180',
                        }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: c.text, lineHeight: 1.4 }}>{f.flag}</div>
                      {f.evidence && (
                        <div style={{ fontSize: 11, color: c.textMuted, marginTop: 3, lineHeight: 1.55 }}>
                          {f.evidence}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Detail Components ────────────────────────────────────────────────────────

function FirmaDetail({ lead, c, isDark }: { lead: LeadDetail; c: ReturnType<typeof colors>; isDark: boolean }) {
  const label: React.CSSProperties = { fontSize: 12, color: c.textMuted, marginBottom: 3 };
  const value: React.CSSProperties = { fontSize: 15, fontWeight: 700, color: c.text };
  return (
    <div style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 0 }}>
        {[
          { l: 'Gründung', v: lead.founded },
          { l: 'Rechtsform', v: lead.legal_form },
          { l: 'HRB', v: lead.hrb_number },
          { l: 'Amtsgericht', v: lead.court },
          { l: 'Branche', v: lead.industry },
          { l: 'Geschäftsführung', v: lead.representative },
        ]
          .filter((r) => r.v)
          .map((row) => (
            <div key={row.l} style={{ marginBottom: 16 }}>
              <div style={label}>{row.l}</div>
              <div style={value}>{row.v}</div>
            </div>
          ))}
        {lead.website && (
          <div style={{ marginBottom: 16 }}>
            <div style={label}>Website</div>
            <a
              href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 15, fontWeight: 700, color: '#818CF8', textDecoration: 'none' }}
            >
              {lead.website.replace(/^https?:\/\//, '')} &#8599;
            </a>
          </div>
        )}
        {lead.phone && (
          <div style={{ marginBottom: 16 }}>
            <div style={label}>Telefon</div>
            <div style={value}>{lead.phone}</div>
          </div>
        )}
        <SourceBadge label="Handelsregister" href="https://www.handelsregister.de" />
      </div>
    </div>
  );
}

function WebsiteDetail({ lead, c, isDark }: { lead: LeadDetail; c: ReturnType<typeof colors>; isDark: boolean }) {
  const ACCENT = '#14B8A6';
  const softBg = isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.022)';
  const softBorder = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';

  const hasAny = !!(
    lead.web_analyzed_at ||
    lead.web_analysis_summary ||
    lead.web_company_pitch ||
    lead.web_value_proposition ||
    lead.web_target_market ||
    lead.web_industry_position ||
    lead.web_core_services?.length ||
    lead.web_tech_stack?.length ||
    lead.web_languages?.length ||
    lead.web_certifications?.length ||
    lead.web_memberships?.length ||
    lead.web_partnerships?.length ||
    lead.web_communication_style ||
    lead.web_buying_signals?.length ||
    lead.web_outreach_hooks?.length ||
    lead.web_recent_news?.length ||
    lead.web_opportunity_flags?.length ||
    lead.web_risk_flags?.length ||
    lead.web_sources_used?.length
  );

  if (!hasAny) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center' as const }}>
        <div style={{ fontSize: 14, color: c.textMuted }}>Noch keine Website-Analyse vorhanden.</div>
        {lead.website && (
          <a
            href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 12, color: ACCENT, textDecoration: 'none', marginTop: 8, display: 'inline-block' }}
          >
            {lead.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')} ↗
          </a>
        )}
      </div>
    );
  }

  const analyzedDate = lead.web_analyzed_at
    ? new Date(lead.web_analyzed_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;
  const confidencePct =
    lead.web_data_confidence != null
      ? Math.round(lead.web_data_confidence <= 1 ? lead.web_data_confidence * 100 : lead.web_data_confidence)
      : null;

  const SECTION: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 800,
    color: c.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    marginBottom: 10,
  };
  const block: React.CSSProperties = { marginBottom: 24 };
  const sub: React.CSSProperties = { fontSize: 11, color: c.textMuted, marginBottom: 4 };
  const para: React.CSSProperties = { fontSize: 14, color: c.text, lineHeight: 1.6 };

  const chip = (text: string, color = ACCENT, key?: React.Key) => (
    <span
      key={key}
      style={{
        fontSize: 11,
        fontWeight: 600,
        color,
        background: `${color}1a`,
        border: `1px solid ${color}40`,
        borderRadius: 99,
        padding: '3px 10px',
      }}
    >
      {text}
    </span>
  );

  const chipSection = (title: string, items: string[] | undefined, color = ACCENT) =>
    items?.length ? (
      <div style={block}>
        <div style={SECTION}>{title}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
          {items.map((t, i) => chip(t, color, i))}
        </div>
      </div>
    ) : null;

  const priorityColor = (p?: string) => (p === 'high' ? '#EF4444' : p === 'medium' ? '#F97316' : '#10B981');
  const severityColor = (s?: string) => (s === 'high' ? '#EF4444' : s === 'medium' ? '#F97316' : '#FBBF24');

  const flagItem = (key: React.Key, title: string, evidence: string | undefined, color: string, href?: string) => (
    <div key={key} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 5, background: color }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: c.text, fontWeight: 600 }}>{title}</div>
        {evidence && <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2, lineHeight: 1.5 }}>{evidence}</div>}
        {href && href.startsWith('http') && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 10, color: ACCENT, textDecoration: 'none', marginTop: 3, display: 'inline-block' }}
          >
            Quelle ↗
          </a>
        )}
      </div>
    </div>
  );

  const stat = (label: string, value: React.ReactNode, color = c.text) => (
    <div
      style={{
        borderRadius: 12,
        padding: '12px 14px',
        background: softBg,
        border: `1px solid ${softBorder}`,
        minWidth: 110,
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: c.textMuted,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.07em',
          marginBottom: 5,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color }}>{value}</div>
    </div>
  );

  const cs = lead.web_communication_style;
  const showSummarySection =
    !!lead.web_analysis_summary && !!lead.web_company_pitch && lead.web_analysis_summary !== lead.web_company_pitch;

  return (
    <div style={{ padding: '20px 24px' }}>
      {/* Hero: pitch / summary */}
      {(lead.web_company_pitch || lead.web_analysis_summary) && (
        <div style={{ ...para, marginBottom: 16 }}>{lead.web_company_pitch || lead.web_analysis_summary}</div>
      )}

      {/* Meta chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginBottom: 24 }}>
        {lead.website &&
          (() => {
            const href = lead.website!.startsWith('http') ? lead.website! : `https://${lead.website}`;
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: ACCENT,
                  background: `${ACCENT}1a`,
                  border: `1px solid ${ACCENT}40`,
                  borderRadius: 99,
                  padding: '3px 10px',
                  textDecoration: 'none',
                }}
              >
                {lead.website!.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')} ↗
              </a>
            );
          })()}
        {analyzedDate && chip(`Analysiert ${analyzedDate}`, '#94A3B8')}
        {lead.web_page_count != null && chip(`${lead.web_page_count} Seiten`, '#94A3B8')}
        {confidencePct != null && chip(`Konfidenz ${confidencePct}%`, '#94A3B8')}
      </div>

      {/* Fact tiles */}
      {(lead.web_has_shop != null || lead.web_has_careers_page != null || lead.web_open_positions_count != null) && (
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginBottom: 24 }}>
          {lead.web_has_shop != null &&
            stat('Online-Shop', lead.web_has_shop ? 'Ja' : 'Nein', lead.web_has_shop ? '#10B981' : c.textMuted)}
          {lead.web_has_careers_page != null &&
            stat(
              'Karriere-Seite',
              lead.web_has_careers_page ? 'Ja' : 'Nein',
              lead.web_has_careers_page ? '#10B981' : c.textMuted
            )}
          {lead.web_open_positions_count != null &&
            stat(
              'Offene Stellen',
              lead.web_open_positions_count,
              lead.web_open_positions_count > 0 ? ACCENT : c.textMuted
            )}
        </div>
      )}

      {/* Positionierung */}
      {(lead.web_value_proposition || lead.web_target_market || lead.web_industry_position) && (
        <div style={block}>
          <div style={SECTION}>Positionierung</div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
            {lead.web_value_proposition && (
              <div>
                <div style={sub}>Value Proposition</div>
                <div style={para}>{lead.web_value_proposition}</div>
              </div>
            )}
            {lead.web_target_market && (
              <div>
                <div style={sub}>Zielmarkt</div>
                <div style={para}>{lead.web_target_market}</div>
              </div>
            )}
            {lead.web_industry_position && (
              <div>
                <div style={sub}>Marktposition</div>
                <div style={para}>{lead.web_industry_position}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {chipSection('Leistungen', lead.web_core_services)}
      {chipSection('Tech-Stack', lead.web_tech_stack, '#6366F1')}
      {chipSection('Sprachen', lead.web_languages, '#94A3B8')}

      {/* Kommunikationsstil */}
      {cs && (cs.tone || cs.formality || cs.language || cs.key_phrases?.length) && (
        <div style={block}>
          <div style={SECTION}>Kommunikationsstil</div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap' as const,
              gap: 6,
              marginBottom: cs.key_phrases?.length ? 10 : 0,
            }}
          >
            {cs.tone && chip(`Ton: ${cs.tone}`, '#0EA5E9')}
            {cs.formality && chip(`Ansprache: ${cs.formality}`, '#0EA5E9')}
            {cs.language && chip(cs.language, '#0EA5E9')}
          </div>
          {!!cs.key_phrases?.length && (
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
              {cs.key_phrases.map((p, i) => chip(`„${p}“`, '#94A3B8', i))}
            </div>
          )}
        </div>
      )}

      {/* Kaufsignale */}
      {!!lead.web_buying_signals?.length && (
        <div style={block}>
          <div style={SECTION}>Kaufsignale</div>
          {lead.web_buying_signals.map((s, i) =>
            flagItem(i, s.signal, s.evidence, priorityColor(s.priority), s.source_url)
          )}
        </div>
      )}

      {/* Chancen */}
      {!!lead.web_opportunity_flags?.length && (
        <div style={block}>
          <div style={SECTION}>Chancen</div>
          {lead.web_opportunity_flags.map((f, i) => flagItem(i, f.flag, f.evidence, '#10B981', f.url ?? f.source))}
        </div>
      )}

      {/* Risiken */}
      {!!lead.web_risk_flags?.length && (
        <div style={block}>
          <div style={SECTION}>Risiken</div>
          {lead.web_risk_flags.map((f, i) =>
            flagItem(i, f.flag, f.evidence, severityColor(f.severity), f.url ?? f.source)
          )}
        </div>
      )}

      {/* Outreach-Hooks */}
      {!!lead.web_outreach_hooks?.length && (
        <div style={block}>
          <div style={SECTION}>Outreach-Hooks</div>
          {lead.web_outreach_hooks.map((h, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 3 }}>{h.hook}</div>
              {h.suggested_opener && (
                <div style={{ fontSize: 12, color: c.textMuted, fontStyle: 'italic' as const, lineHeight: 1.5 }}>
                  „{h.suggested_opener}“
                </div>
              )}
              {h.source_page && h.source_page.startsWith('http') && (
                <a
                  href={h.source_page}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 10, color: ACCENT, textDecoration: 'none', marginTop: 3, display: 'inline-block' }}
                >
                  Quelle ↗
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Aktuelle News */}
      {!!lead.web_recent_news?.length && (
        <div style={block}>
          <div style={SECTION}>Aktuelle News</div>
          {lead.web_recent_news.map((n, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                {n.source_url && n.source_url.startsWith('http') ? (
                  <a
                    href={n.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: c.text,
                      textDecoration: 'none',
                      flex: 1,
                      lineHeight: 1.4,
                    }}
                  >
                    {n.headline} ↗
                  </a>
                ) : (
                  <div style={{ fontSize: 13, fontWeight: 600, color: c.text, flex: 1, lineHeight: 1.4 }}>
                    {n.headline}
                  </div>
                )}
                {n.date_approx && (
                  <div style={{ fontSize: 10, color: c.textMuted, flexShrink: 0 }}>{n.date_approx}</div>
                )}
              </div>
              {n.significance && (
                <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2, lineHeight: 1.5 }}>{n.significance}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {chipSection('Zertifizierungen', lead.web_certifications, '#10B981')}
      {chipSection('Mitgliedschaften', lead.web_memberships, '#6366F1')}
      {chipSection('Partnerschaften', lead.web_partnerships, '#F59E0B')}

      {/* Zusammenfassung (falls separat zum Pitch) */}
      {showSummarySection && (
        <div style={block}>
          <div style={SECTION}>Sales-Einschätzung</div>
          <div style={para}>{lead.web_analysis_summary}</div>
        </div>
      )}

      {/* Quellen */}
      {!!lead.web_sources_used?.length && (
        <div style={block}>
          <div style={SECTION}>Quellen ({lead.web_sources_used.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
            {lead.web_sources_used
              .filter((s) => s.url)
              .map((s, i) => (
                <a
                  key={i}
                  href={s.url!.startsWith('http') ? s.url! : `https://${s.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 11,
                    color: c.textMuted,
                    textDecoration: 'none',
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                  }}
                >
                  {s.subtype && chip(s.subtype, '#94A3B8')}
                  <span
                    style={{
                      color: ACCENT,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap' as const,
                    }}
                  >
                    {s.url!.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')} ↗
                  </span>
                </a>
              ))}
          </div>
        </div>
      )}

      <SourceBadge label="Website-Analyse-Agent" />
    </div>
  );
}

function MitarbeiterDetail({ lead, c, isDark }: { lead: LeadDetail; c: ReturnType<typeof colors>; isDark: boolean }) {
  const rawHistory: { year: number; employees: number }[] = lead._empHistory ?? [];
  const sep = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  const stabilityScore = lead.mgmt_stability_score ?? null;
  const stabilityLabel = deLabel(lead.mgmt_stability_label) ?? null;
  const hasMgmt =
    stabilityScore != null ||
    stabilityLabel != null ||
    (lead.mgmt_risk_flags?.length ?? 0) > 0 ||
    (lead.mgmt_opportunity_flags?.length ?? 0) > 0 ||
    (lead.mgmt_buying_signals?.length ?? 0) > 0 ||
    lead.mgmt_analysis_summary != null ||
    lead.mgmt_is_founder_led != null;

  const stabilityColor =
    stabilityScore == null
      ? c.textMuted
      : stabilityScore >= 65
        ? '#10B981'
        : stabilityScore >= 40
          ? '#F97316'
          : '#EF4444';

  const SEGS = ['#EF4444', '#F97316', '#FB923C', '#FBBF24', '#A3E635', '#10B981'];

  const computedStabilityLabel =
    stabilityScore == null
      ? null
      : stabilityScore >= 80
        ? 'Sehr Stabil'
        : stabilityScore >= 65
          ? 'Stabil'
          : stabilityScore >= 50
            ? 'Solide'
            : stabilityScore >= 35
              ? 'Wechselnd'
              : stabilityScore >= 20
                ? 'Instabil'
                : 'Kritisch';

  const LBL: React.CSSProperties = {
    fontSize: 9,
    fontWeight: 700,
    color: c.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.09em',
    marginBottom: 4,
  };

  const card = (accent?: string): React.CSSProperties => ({
    borderRadius: 13,
    padding: '14px 16px',
    background: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.022)',
    border: `1px solid ${accent ? `${accent}28` : isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
    position: 'relative' as const,
  });

  const severityColor = (s?: string) => (s === 'high' ? '#EF4444' : s === 'medium' ? '#F97316' : '#94A3B8');
  const priorityColor = (p?: string) => (p === 'high' ? '#10B981' : p === 'medium' ? '#F97316' : '#94A3B8');

  const empTrendColor =
    lead.fin_employee_trend === 'growing' || lead.fin_employee_trend === 'stable'
      ? '#10B981'
      : lead.fin_employee_trend === 'declining' || lead.fin_employee_trend === 'critical'
        ? '#EF4444'
        : '#F97316';

  const changeTypeLabel = (t?: string) => {
    const map: Record<string, string> = {
      new_appointment: 'Neue Ernennung',
      resignation: 'Abgang',
      replacement: 'Nachfolge',
      expansion: 'Erweiterung',
    };
    return t ? (map[t] ?? t) : null;
  };

  return (
    <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
      {/* ── Mitarbeiter-Entwicklung ── */}
      <div style={{ ...card(), padding: 0, overflow: 'hidden' as const }}>
        <div
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px 10px' }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: c.text }}>Mitarbeiter-Entwicklung</span>
            {rawHistory.length > 1 && (
              <span style={{ fontSize: 10, color: c.textMuted }}>
                {rawHistory[0]?.year}–{rawHistory[rawHistory.length - 1]?.year}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {lead.fin_employee_trend && lead.fin_employee_trend !== 'unknown' && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: empTrendColor,
                  background: `${empTrendColor}18`,
                  borderRadius: 99,
                  padding: '2px 8px',
                }}
              >
                {lead.fin_employee_trend === 'growing' || lead.fin_employee_trend === 'stable' ? '↑' : '↓'}{' '}
                {deLabel(lead.fin_employee_trend)}
              </span>
            )}
            {lead.employees && (
              <span style={{ fontSize: 10, fontWeight: 700, color: c.textMuted }}>{lead.employees} Mitarbeiter</span>
            )}
          </div>
        </div>
        {rawHistory.length > 1 ? (
          <EmployeeAreaChart history={rawHistory} isDark={isDark} />
        ) : (
          <div style={{ padding: '0 16px 16px', display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 40, fontWeight: 800, color: '#10B981', lineHeight: 1 }}>
              {lead.employees ?? '—'}
            </span>
            <span style={{ fontSize: 12, color: c.textMuted }}>Mitarbeiter</span>
          </div>
        )}
      </div>

      {/* ── Führungsanalyse ── */}
      {hasMgmt ? (
        <>
          {/* Header: 2-col hero */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
            {/* Stability score hero */}
            <div
              style={{
                ...card('#818CF8'),
                borderLeft: `3px solid ${stabilityColor}`,
                display: 'flex',
                flexDirection: 'column' as const,
                gap: 6,
              }}
            >
              <span style={LBL}>Führungsstabilität</span>
              <span style={{ fontSize: 32, fontWeight: 800, color: stabilityColor, lineHeight: 1 }}>
                {computedStabilityLabel ?? stabilityLabel ?? '—'}
              </span>
              {stabilityScore != null && (
                <span style={{ fontSize: 11, color: c.textMuted }}>{stabilityScore} / 100</span>
              )}
              <div style={{ position: 'relative', marginTop: 4 }}>
                <div style={{ display: 'flex', gap: 2 }}>
                  {SEGS.map((seg, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: 6,
                        borderRadius: 99,
                        background: seg,
                        opacity: stabilityScore != null ? 1 : 0.2,
                      }}
                    />
                  ))}
                </div>
                {stabilityScore != null && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -3,
                      left: `calc(${Math.min(96, Math.max(2, stabilityScore))}% - 1px)`,
                      width: 2,
                      height: 12,
                      background: isDark ? '#fff' : '#111',
                      borderRadius: 1,
                    }}
                  />
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: c.textMuted }}>
                <span>Kritisch</span>
                <span>Sehr Stabil</span>
              </div>
            </div>

            {/* Metrics grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {(
                [
                  lead.mgmt_current_director_count != null && {
                    label: 'Aktive Geschäftsführer',
                    val: String(lead.mgmt_current_director_count),
                    color: '#818CF8',
                    sub: lead.mgmt_has_prokura ? 'Mit Prokura' : 'Ohne Prokura',
                  },
                  lead.mgmt_total_changes != null && {
                    label: 'Führungswechsel',
                    val: String(lead.mgmt_total_changes),
                    color:
                      lead.mgmt_total_changes >= 3 ? '#EF4444' : lead.mgmt_total_changes >= 1 ? '#F97316' : '#10B981',
                    sub: lead.mgmt_last_change_type
                      ? (changeTypeLabel(lead.mgmt_last_change_type) ?? lead.mgmt_last_change_type)
                      : 'Gesamt',
                  },
                  lead.mgmt_avg_tenure_months != null && {
                    label: 'Ø Amtszeit',
                    val:
                      lead.mgmt_avg_tenure_months >= 12
                        ? `${Math.round(lead.mgmt_avg_tenure_months / 12)} J.`
                        : `${lead.mgmt_avg_tenure_months} Mo.`,
                    color:
                      lead.mgmt_avg_tenure_months >= 36
                        ? '#10B981'
                        : lead.mgmt_avg_tenure_months >= 12
                          ? '#F97316'
                          : '#EF4444',
                    sub: 'Durchschnitt',
                  },
                  lead.mgmt_is_founder_led != null && {
                    label: 'Gründergeführt',
                    val: lead.mgmt_is_founder_led ? 'Ja' : 'Nein',
                    color: lead.mgmt_is_founder_led ? '#10B981' : c.textMuted,
                    sub: lead.mgmt_is_founder_led ? 'Gründer aktiv' : 'Externes Management',
                  },
                ].filter(Boolean) as { label: string; val: string; color: string; sub: string }[]
              ).map((m) => (
                <div key={m.label} style={{ ...card(), display: 'flex', flexDirection: 'column' as const, gap: 3 }}>
                  <span style={LBL}>{m.label}</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: m.color, lineHeight: 1 }}>{m.val}</span>
                  <span style={{ fontSize: 10, color: c.textMuted }}>{m.sub}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Analysis + Buying Signals */}
          {(lead.mgmt_analysis_summary || (lead.mgmt_buying_signals?.length ?? 0) > 0) && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  lead.mgmt_analysis_summary && (lead.mgmt_buying_signals?.length ?? 0) > 0 ? '1fr 1fr' : '1fr',
                gap: 12,
              }}
            >
              {lead.mgmt_analysis_summary && (
                <div
                  style={{
                    ...card(),
                    borderLeft: `3px solid ${stabilityColor}`,
                    display: 'flex',
                    flexDirection: 'column' as const,
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ ...LBL, marginBottom: 0 }}>KI-Analyse</span>
                    {stabilityScore != null && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: stabilityColor,
                          background: `${stabilityColor}18`,
                          borderRadius: 99,
                          padding: '2px 8px',
                        }}
                      >
                        {stabilityScore}/100
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: c.text, lineHeight: 1.75, margin: 0 }}>
                    {lead.mgmt_analysis_summary}
                  </p>
                  <SourceBadge label="KI-Analyse" />
                </div>
              )}
              {(lead.mgmt_buying_signals?.length ?? 0) > 0 && (
                <div style={{ ...card('#10B981'), display: 'flex', flexDirection: 'column' as const }}>
                  <div
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}
                  >
                    <span style={{ ...LBL, marginBottom: 0 }}>Kaufsignale Führung</span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: '#10B981',
                        background: 'rgba(16,185,129,0.12)',
                        borderRadius: 99,
                        padding: '2px 7px',
                      }}
                    >
                      {lead.mgmt_buying_signals!.length}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column' as const,
                      flex: 1,
                      justifyContent: 'space-between' as const,
                    }}
                  >
                    {lead.mgmt_buying_signals!.map((s, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          gap: 10,
                          paddingBottom: i < lead.mgmt_buying_signals!.length - 1 ? 10 : 0,
                          borderBottom: i < lead.mgmt_buying_signals!.length - 1 ? `1px solid ${sep}` : 'none',
                          marginBottom: i < lead.mgmt_buying_signals!.length - 1 ? 10 : 0,
                        }}
                      >
                        <div style={{ flexShrink: 0, marginTop: 4 }}>
                          <div
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              background: priorityColor(s.priority),
                              boxShadow: `0 0 6px ${priorityColor(s.priority)}80`,
                            }}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: c.text, lineHeight: 1.4 }}>
                            {s.signal}
                          </div>
                          {s.evidence && (
                            <div style={{ fontSize: 11, color: c.textMuted, marginTop: 3, lineHeight: 1.55 }}>
                              {s.evidence}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Flags */}
          {((lead.mgmt_risk_flags?.length ?? 0) > 0 || (lead.mgmt_opportunity_flags?.length ?? 0) > 0) && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  (lead.mgmt_risk_flags?.length ?? 0) > 0 && (lead.mgmt_opportunity_flags?.length ?? 0) > 0
                    ? '1fr 1fr'
                    : '1fr',
                gap: 12,
              }}
            >
              {(lead.mgmt_risk_flags?.length ?? 0) > 0 && (
                <div
                  style={{
                    borderRadius: 13,
                    padding: '16px 18px',
                    background: isDark ? 'rgba(239,68,68,0.05)' : 'rgba(239,68,68,0.03)',
                    border: '1px solid rgba(239,68,68,0.15)',
                    borderLeft: '3px solid #EF4444' as const,
                  }}
                >
                  <div
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}
                  >
                    <span style={{ ...LBL, color: '#EF4444', marginBottom: 0 }}>Risiken</span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: '#EF4444',
                        background: 'rgba(239,68,68,0.12)',
                        borderRadius: 99,
                        padding: '2px 7px',
                      }}
                    >
                      {lead.mgmt_risk_flags!.length}
                    </span>
                  </div>
                  {lead.mgmt_risk_flags!.map((f, i) => (
                    <div
                      key={i}
                      style={{ display: 'flex', gap: 10, marginBottom: i < lead.mgmt_risk_flags!.length - 1 ? 12 : 0 }}
                    >
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: severityColor(f.severity),
                          boxShadow: `0 0 6px ${severityColor(f.severity)}80`,
                          flexShrink: 0,
                          marginTop: 4,
                        }}
                      />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: c.text, lineHeight: 1.4 }}>{f.flag}</div>
                        {f.evidence && (
                          <div style={{ fontSize: 11, color: c.textMuted, marginTop: 3, lineHeight: 1.55 }}>
                            {f.evidence}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {(lead.mgmt_opportunity_flags?.length ?? 0) > 0 && (
                <div
                  style={{
                    borderRadius: 13,
                    padding: '16px 18px',
                    background: isDark ? 'rgba(16,185,129,0.05)' : 'rgba(16,185,129,0.03)',
                    border: '1px solid rgba(16,185,129,0.15)',
                    borderLeft: '3px solid #10B981' as const,
                  }}
                >
                  <div
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}
                  >
                    <span style={{ ...LBL, color: '#10B981', marginBottom: 0 }}>Chancen</span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: '#10B981',
                        background: 'rgba(16,185,129,0.12)',
                        borderRadius: 99,
                        padding: '2px 7px',
                      }}
                    >
                      {lead.mgmt_opportunity_flags!.length}
                    </span>
                  </div>
                  {lead.mgmt_opportunity_flags!.map((f, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        gap: 10,
                        marginBottom: i < lead.mgmt_opportunity_flags!.length - 1 ? 12 : 0,
                      }}
                    >
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: '#10B981',
                          boxShadow: '0 0 6px #10B98180',
                          flexShrink: 0,
                          marginTop: 4,
                        }}
                      />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: c.text, lineHeight: 1.4 }}>{f.flag}</div>
                        {f.evidence && (
                          <div style={{ fontSize: 11, color: c.textMuted, marginTop: 3, lineHeight: 1.55 }}>
                            {f.evidence}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        /* Placeholder — scraper hasn't run management analysis yet */
        <div style={{ ...card(), padding: '20px 18px', display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: c.textMuted,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.08em',
            }}
          >
            Führungsanalyse
          </span>
          <p style={{ fontSize: 12, color: c.textMuted, lineHeight: 1.65, margin: 0 }}>
            Noch keine Führungsanalyse verfügbar. Stabilitätsscore, Kaufsignale, Risiken und Chancen werden automatisch
            ergänzt, sobald die Analyse abgeschlossen ist.
          </p>
        </div>
      )}

      {/* ── Unternehmenszweck ── */}
      {lead.or_purpose && (
        <div style={{ ...card(), borderLeft: '3px solid #818CF8' }}>
          <div style={{ ...LBL, marginBottom: 6 }}>Unternehmenszweck</div>
          <p style={{ fontSize: 12, color: c.textSub, lineHeight: 1.65, margin: 0 }}>{lead.or_purpose}</p>
        </div>
      )}

      {/* ── Prokuristen ── */}
      {(lead.or_prokuristen?.length ?? 0) > 0 && (
        <div style={{ ...card() }}>
          <div style={{ ...LBL, marginBottom: 8 }}>Prokuristen ({lead.or_prokuristen!.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 0 }}>
            {lead.or_prokuristen!.map((p, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: i < lead.or_prokuristen!.length - 1 ? `1px solid ${sep}` : 'none',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{p.name}</span>
                {p.since && <span style={{ fontSize: 11, color: c.textMuted }}>seit {p.since}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Ehemalige Führung ── */}
      {(lead.or_former_directors?.length ?? 0) > 0 && (
        <div style={{ ...card() }}>
          <div style={{ ...LBL, marginBottom: 8 }}>Ehemalige Führung ({lead.or_former_directors!.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 0 }}>
            {lead.or_former_directors!.map((d, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: i < lead.or_former_directors!.length - 1 ? `1px solid ${sep}` : 'none',
                }}
              >
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{d.name}</span>
                  {d.role && <span style={{ fontSize: 11, color: c.textMuted, marginLeft: 8 }}>{d.role}</span>}
                </div>
                {(d.since || d.until) && (
                  <span style={{ fontSize: 11, color: c.textMuted }}>
                    {d.since ?? '?'} – {d.until ?? 'heute'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <SourceBadge label="Handelsregister" />
    </div>
  );
}

// ─── ContributionGraph (Post-Aktivität) ───────────────────────────────────────

function ContributionGraph({
  calendar,
  isDark,
  c,
}: {
  calendar: NonNullable<LeadDetail['social_post_calendar']>;
  isDark: boolean;
  c: ReturnType<typeof colors>;
}) {
  // All data comes from Supabase — no hardcoding, renders whatever the DB provides
  const [hovered, setHovered] = React.useState<{
    date: string;
    count: number;
    totalLikes: number;
    platforms: string[];
    x: number;
    y: number;
  } | null>(null);
  const [activePlatforms, setActivePlatforms] = React.useState<Set<string>>(new Set());

  const togglePlatform = (plat: string) => {
    setActivePlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(plat)) next.delete(plat);
      else next.add(plat);
      return next;
    });
  };

  const mono = 'ui-monospace, SFMono-Regular, monospace';

  const PLAT_COLOR: Record<string, string> = {
    instagram: '#E1306C',
    linkedin: '#0A66C2',
    facebook: '#1877F2',
    youtube: '#FF0000',
    tiktok: '#FF0050',
  };

  const LEVEL_COLORS = [
    isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    'rgba(79,70,229,0.18)',
    'rgba(79,70,229,0.38)',
    'rgba(79,70,229,0.62)',
    'rgba(79,70,229,0.90)',
  ];

  // Build day map — group calendar entries by date key
  const dayMap = React.useMemo(() => {
    const map = new Map<string, { count: number; totalLikes: number; platforms: string[] }>();
    calendar.forEach((post) => {
      const d = new Date(post.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const ex = map.get(key) ?? { count: 0, totalLikes: 0, platforms: [] };
      map.set(key, {
        count: ex.count + 1,
        totalLikes: ex.totalLikes + (post.likes ?? 0),
        platforms: Array.from(new Set([...ex.platforms, post.platform])),
      });
    });
    return map;
  }, [calendar]);

  // Filtered day map — only include days that match active platform filter
  const filteredMap = React.useMemo(() => {
    if (activePlatforms.size === 0) return dayMap;
    const out = new Map<string, { count: number; totalLikes: number; platforms: string[] }>();
    dayMap.forEach((val, key) => {
      if (val.platforms.some((p) => activePlatforms.has(p))) {
        out.set(key, val);
      }
    });
    return out;
  }, [dayMap, activePlatforms]);

  const NUM_WEEKS = 26;
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const weeks = React.useMemo(() => {
    const startSunday = new Date(today);
    startSunday.setDate(today.getDate() - today.getDay() - (NUM_WEEKS - 1) * 7);
    const result: { key: string }[][] = [];
    const cursor = new Date(startSunday);
    for (let w = 0; w < NUM_WEEKS; w++) {
      const week: { key: string }[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(cursor);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        week.push({ key });
        cursor.setDate(cursor.getDate() + 1);
      }
      result.push(week);
    }
    return result;
  }, []);

  const maxCount = Math.max(...Array.from(filteredMap.values()).map((v) => v.count), 1);
  const getLevel = (count: number) => {
    if (count === 0) return 0;
    const r = count / maxCount;
    return r < 0.25 ? 1 : r < 0.5 ? 2 : r < 0.75 ? 3 : 4;
  };

  // Month headers
  const MONTHS_DE = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  const monthHeaders = React.useMemo(() => {
    const headers: { month: string; startWeek: number }[] = [];
    let curMonth = -1;
    weeks.forEach((week, wi) => {
      const parts = week[0].key.split('-').map(Number);
      const month = parts[1] - 1;
      if (month !== curMonth) {
        headers.push({ month: MONTHS_DE[month], startWeek: wi });
        curMonth = month;
      }
    });
    return headers;
  }, [weeks]);

  // Platform totals for filter buttons
  const platformCounts: Record<string, number> = {};
  calendar.forEach((post) => {
    platformCounts[post.platform] = (platformCounts[post.platform] ?? 0) + 1;
  });

  const DAY_LABELS_DE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const CELL_H = 10; // fixed cell height — keeps grid compact
  const GAP = 3;
  const DAY_COL_W = 18;

  const LBL: React.CSSProperties = {
    fontSize: 9,
    fontWeight: 700,
    color: c.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.09em',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, height: '100%', gap: 8 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span style={LBL}>Post-Aktivität</span>
        <span style={{ fontSize: 9, color: c.textMuted, fontFamily: mono }}>{calendar.length} Posts · 26 Wo.</span>
      </div>

      {/* Platform filter buttons */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const }}>
        {Object.entries(platformCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([plat, cnt]) => {
            const color = PLAT_COLOR[plat] ?? '#818CF8';
            const active = activePlatforms.size === 0 || activePlatforms.has(plat);
            return (
              <button
                key={plat}
                onClick={() => togglePlatform(plat)}
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: active ? color : c.textMuted,
                  background: active ? `${color}20` : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                  border: `1px solid ${active ? `${color}40` : 'transparent'}`,
                  borderRadius: 99,
                  padding: '2px 8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  outline: 'none',
                }}
              >
                {plat.charAt(0).toUpperCase() + plat.slice(1)} · {cnt}
              </button>
            );
          })}
        {activePlatforms.size > 0 && (
          <button
            onClick={() => setActivePlatforms(new Set())}
            style={{
              fontSize: 9,
              fontWeight: 600,
              color: c.textMuted,
              background: 'transparent',
              border: 'none',
              padding: '2px 6px',
              cursor: 'pointer',
              textDecoration: 'underline',
              outline: 'none',
            }}
          >
            Alle
          </button>
        )}
      </div>

      {/* Graph — flex column so month header is fixed, grid rows fill the rest */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const }}>
        {/* Month labels */}
        <div
          style={{
            position: 'relative' as const,
            height: 13,
            marginLeft: DAY_COL_W + GAP,
            marginBottom: 2,
            flexShrink: 0,
          }}
        >
          {monthHeaders.map((h, i) => (
            <span
              key={i}
              style={{
                position: 'absolute' as const,
                left: `${(h.startWeek / NUM_WEEKS) * 100}%`,
                fontSize: 8,
                fontWeight: 600,
                color: c.textMuted,
                fontFamily: mono,
                whiteSpace: 'nowrap' as const,
              }}
            >
              {h.month}
            </span>
          ))}
        </div>

        {/* Day labels + week columns — flex: 1 so they fill remaining height */}
        <div style={{ display: 'flex', flex: 1 }}>
          {/* Day label column — 1fr rows grow to fill height */}
          <div
            style={{
              display: 'grid',
              gridTemplateRows: `repeat(7, 1fr)`,
              gap: GAP,
              width: DAY_COL_W,
              marginRight: GAP,
              flexShrink: 0,
            }}
          >
            {DAY_LABELS_DE.map((d, i) => (
              <div
                key={i}
                style={{
                  fontSize: 8,
                  fontWeight: 600,
                  color: i % 2 === 0 ? c.textMuted : 'transparent',
                  fontFamily: mono,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingRight: 2,
                  userSelect: 'none' as const,
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Week grid — fills remaining width, rows grow to fill height */}
          <div
            style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: `repeat(${NUM_WEEKS}, 1fr)`,
              gap: GAP,
            }}
          >
            {weeks.map((week, wi) => (
              <div
                key={wi}
                style={{
                  display: 'grid',
                  gridTemplateRows: `repeat(7, 1fr)`,
                  gap: GAP,
                }}
              >
                {week.map(({ key }, di) => {
                  const data = filteredMap.get(key);
                  const rawData = dayMap.get(key);
                  const count = data?.count ?? 0;
                  const level = getLevel(count);
                  const isToday = key === todayKey;
                  return (
                    <div
                      key={di}
                      style={{
                        borderRadius: 2,
                        background: LEVEL_COLORS[level],
                        border: isToday ? '1.5px solid rgba(79,70,229,0.7)' : '1.5px solid transparent',
                        boxSizing: 'border-box' as const,
                        cursor: rawData ? 'pointer' : 'default',
                      }}
                      onMouseEnter={(e) => {
                        if (rawData) {
                          setHovered({
                            date: key,
                            count: rawData.count,
                            totalLikes: rawData.totalLikes,
                            platforms: rawData.platforms,
                            x: e.clientX,
                            y: e.clientY,
                          });
                        }
                      }}
                      onMouseMove={(e) => {
                        if (hovered?.date === key) {
                          setHovered((h) => (h ? { ...h, x: e.clientX, y: e.clientY } : h));
                        }
                      }}
                      onMouseLeave={() => setHovered(null)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ fontSize: 8, color: c.textMuted }}>Weniger</span>
        {[0, 1, 2, 3, 4].map((lvl) => (
          <div
            key={lvl}
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              background: LEVEL_COLORS[lvl],
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
              flexShrink: 0,
            }}
          />
        ))}
        <span style={{ fontSize: 8, color: c.textMuted }}>Mehr</span>
      </div>

      {/* Hover tooltip via portal */}
      {hovered &&
        typeof window !== 'undefined' &&
        createPortal(
          <div
            style={{
              position: 'fixed' as const,
              left: hovered.x + 12,
              top: hovered.y - 52,
              zIndex: 9999,
              background: isDark ? '#1a1a2e' : '#0A2540',
              color: '#fff',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 11,
              pointerEvents: 'none' as const,
              boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
              minWidth: 148,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 2 }}>
              {hovered.count} Post{hovered.count > 1 ? 's' : ''}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10, marginBottom: 5 }}>
              {new Date(hovered.date).toLocaleDateString('de-DE', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const }}>
              {hovered.platforms.map((p) => (
                <span
                  key={p}
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: PLAT_COLOR[p] ?? '#818CF8',
                    background: `${PLAT_COLOR[p] ?? '#818CF8'}28`,
                    borderRadius: 99,
                    padding: '1px 7px',
                  }}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </span>
              ))}
            </div>
            {hovered.totalLikes > 0 && (
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                {hovered.totalLikes} Likes gesamt
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}

// ─── PlatformLogo ─────────────────────────────────────────────────────────────

function PlatformLogo({ platform, color, size = 18 }: { platform: string; color: string; size?: number }) {
  const s = size;
  switch (platform) {
    case 'instagram':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
          <rect x="2" y="2" width="20" height="20" rx="6" stroke={color} strokeWidth="2" />
          <circle cx="12" cy="12" r="4.5" stroke={color} strokeWidth="2" />
          <circle cx="17.5" cy="6.5" r="1.2" fill={color} />
        </svg>
      );
    case 'linkedin':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
          <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z" />
          <rect x="2" y="9" width="4" height="12" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      );
    case 'facebook':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
          <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
        </svg>
      );
    case 'youtube':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
          <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.17a8.16 8.16 0 004.77 1.52V7.25a4.85 4.85 0 01-1-.56z" />
        </svg>
      );
    case 'twitter':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case 'xing':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
          <path d="M6.182 5H3.5l3.318 5.773L4 15h2.682l2.818-4.227L6.182 5zm9.636 0l-6.5 11.5L12.5 22H15l-2.682-5.5L21.5 5h-5.682z" />
        </svg>
      );
    default:
      return (
        <div
          style={{
            width: s,
            height: s,
            borderRadius: '50%',
            background: color,
            flexShrink: 0,
          }}
        />
      );
  }
}

// ─── SocialDetail ─────────────────────────────────────────────────────────────

function SocialDetail({ lead, c, isDark }: { lead: LeadDetail; c: ReturnType<typeof colors>; isDark: boolean }) {
  const sep = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  const card = (accent?: string): React.CSSProperties => ({
    borderRadius: 13,
    padding: '14px 16px',
    background: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.022)',
    border: `1px solid ${accent ? `${accent}28` : isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
    position: 'relative' as const,
  });

  const LBL: React.CSSProperties = {
    fontSize: 9,
    fontWeight: 700,
    color: c.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.09em',
    marginBottom: 4,
  };

  const SEGS = ['#EF4444', '#F97316', '#FB923C', '#FBBF24', '#FDE047', '#A3E635', '#4ADE80', '#22C55E', '#16A34A'];
  const score = lead.social_health_score ?? null;
  const healthColor = score == null ? c.textMuted : score >= 65 ? '#10B981' : score >= 40 ? '#F97316' : '#EF4444';
  const computedLabel =
    score == null
      ? null
      : score >= 80
        ? 'Sehr Aktiv'
        : score >= 65
          ? 'Aktiv'
          : score >= 50
            ? 'Solide'
            : score >= 35
              ? 'Mittel'
              : score >= 20
                ? 'Schwach'
                : 'Inaktiv';

  const platformMeta: Record<string, { label: string; color: string }> = {
    instagram: { label: 'Instagram', color: '#E1306C' },
    linkedin: { label: 'LinkedIn', color: '#0A66C2' },
    facebook: { label: 'Facebook', color: '#1877F2' },
    youtube: { label: 'YouTube', color: '#FF0000' },
    tiktok: { label: 'TikTok', color: '#FF0050' },
    twitter: { label: 'X / Twitter', color: isDark ? '#e1e1e1' : '#111' },
    xing: { label: 'Xing', color: '#026466' },
  };

  const fmtFreq = (f?: string) => {
    const map: Record<string, string> = {
      daily: 'Täglich',
      several_per_week: 'Mehrmals/Woche',
      weekly: 'Wöchentlich',
      biweekly: 'Alle 2 Wochen',
      monthly: 'Monatlich',
      rarely: 'Selten',
    };
    return f ? (map[f] ?? f) : null;
  };

  const platforms = [
    {
      key: 'instagram',
      label: 'Instagram',
      color: '#E1306C',
      url: lead.instagram_url,
      followers: lead.instagramFollowers,
      following: lead.instagramFollowing,
      posts: lead.instagramPosts,
    },
    {
      key: 'linkedin',
      label: 'LinkedIn',
      color: '#0A66C2',
      url: lead.linkedin_url,
      followers: lead.li_followers,
      sub: lead.li_company_size,
    },
    { key: 'facebook', label: 'Facebook', color: '#1877F2', url: lead.facebook, followers: lead.facebookFollowers },
    { key: 'youtube', label: 'YouTube', color: '#FF0000', url: lead.youtube_url },
    { key: 'tiktok', label: 'TikTok', color: '#FF0050', url: lead.tiktok_url },
    { key: 'twitter', label: 'X / Twitter', color: isDark ? '#e1e1e1' : '#111', url: lead.twitter_url },
    { key: 'xing', label: 'Xing', color: '#026466', url: lead.xing_url },
  ].filter((p) => p.url || (p as { followers?: number }).followers != null) as {
    key: string;
    label: string;
    color: string;
    url?: string;
    followers?: number;
    following?: number;
    posts?: number;
    sub?: string;
  }[];

  // Count posts per platform from social_post_calendar — shown as fallback until instagram_posts_count etc. is populated
  const calendarPostCounts: Record<string, number> = {};
  (lead.social_post_calendar ?? []).forEach((entry) => {
    calendarPostCounts[entry.platform] = (calendarPostCounts[entry.platform] ?? 0) + 1;
  });

  const hasAnyData = platforms.length > 0 || score != null || lead.social_total_followers != null;
  if (!hasAnyData) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center' as const, color: c.textMuted, fontSize: 14 }}>
        Keine Social-Media-Daten verfügbar.
      </div>
    );
  }

  const freqLabel = fmtFreq(lead.social_posting_frequency);
  const priorityColor = (p?: string) => (p === 'high' ? '#10B981' : p === 'medium' ? '#F97316' : '#94A3B8');
  const severityColor = (s?: string) => (s === 'high' ? '#EF4444' : s === 'medium' ? '#F97316' : '#94A3B8');

  // Top hashtags (max 6, no fading)
  const topTags = lead.social_hashtags_used?.slice(0, 12) ?? [];

  const headerMetrics = [
    lead.social_total_followers != null
      ? {
          label: 'Gesamt-Follower',
          val: lead.social_total_followers.toLocaleString('de-DE'),
          color: '#818CF8',
          sub: lead.social_primary_platform
            ? `Primär: ${platformMeta[lead.social_primary_platform]?.label ?? lead.social_primary_platform}`
            : `${platforms.length} Plattformen`,
        }
      : null,
    lead.social_engagement_rate_pct != null
      ? {
          label: 'Engagement',
          val: `${lead.social_engagement_rate_pct.toFixed(1)}%`,
          color:
            lead.social_engagement_rate_pct >= 3
              ? '#10B981'
              : lead.social_engagement_rate_pct >= 1
                ? '#F97316'
                : '#EF4444',
          sub: 'Engagement-Rate',
        }
      : null,
    lead.social_avg_likes_per_post != null
      ? {
          label: 'Ø Likes / Post',
          val: lead.social_avg_likes_per_post.toFixed(1),
          color: '#34D399',
          sub: `${lead.social_total_posts_scraped ?? '?'} Posts`,
        }
      : null,
    freqLabel != null || lead.social_days_since_last_post != null
      ? {
          label: 'Posting',
          val: freqLabel ?? '—',
          color: c.text,
          sub: lead.social_days_since_last_post != null ? `Vor ${lead.social_days_since_last_post} Tagen` : 'Aktiv',
        }
      : null,
  ].filter(Boolean) as { label: string; val: string; color: string; sub: string }[];

  // Link arrow SVG — thick, clean
  const ArrowOut = ({ color, size = 15 }: { color: string; size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" style={{ display: 'block', flexShrink: 0 }}>
      <path
        d="M2 10L10 2M10 2H4M10 2V8"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <div
      style={{
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 14,
        overflowY: 'auto' as const,
      }}
    >
      {/* ── Header strip ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          paddingBottom: 14,
          borderBottom: `1px solid ${sep}`,
          flexWrap: 'wrap' as const,
          rowGap: 10,
        }}
      >
        {/* Health block */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4, paddingRight: 18 }}>
          <span style={LBL}>Social Präsenz</span>
          <span style={{ fontSize: 20, fontWeight: 700, color: healthColor, lineHeight: 1 }}>
            {computedLabel ?? deLabel(lead.social_health_label) ?? '—'}
          </span>
          <div style={{ position: 'relative', width: 110, marginTop: 3 }}>
            <div style={{ display: 'flex', gap: 2 }}>
              {SEGS.map((seg, i) => (
                <div
                  key={i}
                  style={{ flex: 1, height: 4, borderRadius: 99, background: seg, opacity: score != null ? 1 : 0.2 }}
                />
              ))}
            </div>
            {score != null && (
              <div
                style={{
                  position: 'absolute',
                  top: -2,
                  left: `calc(${Math.min(96, Math.max(2, score))}% - 1px)`,
                  width: 2,
                  height: 8,
                  background: isDark ? '#fff' : '#111',
                  borderRadius: 1,
                }}
              />
            )}
          </div>
        </div>

        <div
          style={{
            width: 1,
            height: 42,
            background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
            margin: '0 18px',
            flexShrink: 0,
          }}
        />

        {headerMetrics.map((m, i, arr) => (
          <React.Fragment key={m.label}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column' as const,
                gap: 2,
                paddingRight: i < arr.length - 1 ? 18 : 0,
              }}
            >
              <span style={LBL}>{m.label}</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: m.color, lineHeight: 1 }}>{m.val}</span>
              <span style={{ fontSize: 10, color: c.textMuted, marginTop: 1 }}>{m.sub}</span>
            </div>
            {i < arr.length - 1 && (
              <div
                style={{
                  width: 1,
                  height: 42,
                  background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                  margin: '0 18px',
                  flexShrink: 0,
                }}
              />
            )}
          </React.Fragment>
        ))}

        {/* Top hashtags pinned right */}
        {topTags.length > 0 && (
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              gap: 5,
              flexWrap: 'wrap' as const,
              justifyContent: 'flex-end',
            }}
          >
            {topTags.map((tag, i) => (
              <span
                key={i}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#818CF8',
                  background: '#818CF820',
                  borderRadius: 99,
                  padding: '3px 10px',
                }}
              >
                #{tag.replace(/^#/, '')}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Platform cards ── */}
      {platforms.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(platforms.length, 4)}, 1fr)`,
            gap: 10,
          }}
        >
          {platforms.map((p) => (
            <div
              key={p.key}
              style={{
                ...card(p.color),
                display: 'flex',
                flexDirection: 'column' as const,
                justifyContent: 'space-between',
                minHeight: 110,
                padding: '14px 16px',
              }}
            >
              {/* TOP ROW — logo+name (left) · link (right) */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  {/* Platform logo SVG */}
                  <PlatformLogo platform={p.key} color={p.color} size={18} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: p.color }}>{p.label}</span>
                </div>
                {p.url && (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
                  >
                    <ArrowOut color={p.color} size={16} />
                  </a>
                )}
              </div>

              {/* BOTTOM — follower count + optional following + post count */}
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  {p.followers != null ? (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                      <span style={{ fontSize: 28, fontWeight: 800, color: c.text, lineHeight: 1 }}>
                        {p.followers >= 1000
                          ? `${(p.followers / 1000).toFixed(p.followers >= 10000 ? 0 : 1)}k`
                          : p.followers.toLocaleString('de-DE')}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 500, color: c.textMuted }}>Follower</span>
                    </div>
                  ) : (
                    <span style={{ fontSize: 11, color: c.textMuted }}>Profil verfügbar</span>
                  )}
                  {(() => {
                    const postCount = p.posts ?? calendarPostCounts[p.key] ?? null;
                    return postCount != null ? (
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <span style={{ fontSize: 18, fontWeight: 700, color: c.textMuted, lineHeight: 1 }}>
                          {postCount}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 500, color: c.textMuted }}>
                          {p.posts != null ? 'Posts' : 'analysiert'}
                        </span>
                      </div>
                    ) : null;
                  })()}
                </div>
                {p.following != null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 11, color: c.textMuted }}>
                      {p.following >= 1000
                        ? `${(p.following / 1000).toFixed(1)}k`
                        : p.following.toLocaleString('de-DE')}
                    </span>
                    <span style={{ fontSize: 10, color: c.textMuted, opacity: 0.7 }}>folgt</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Score legend — above engagement/communication/content ── */}
      {score != null && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            borderRadius: 10,
            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
            border: `1px solid ${sep}`,
            flexWrap: 'wrap' as const,
            rowGap: 6,
          }}
        >
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: c.textMuted,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.08em',
              flexShrink: 0,
            }}
          >
            Präsenz-Score
          </span>
          {[
            { label: 'Inaktiv', range: '0–19', color: '#EF4444' },
            { label: 'Schwach', range: '20–34', color: '#F97316' },
            { label: 'Mittel', range: '35–49', color: '#FBBF24' },
            { label: 'Solide', range: '50–64', color: '#A3E635' },
            { label: 'Aktiv', range: '65–79', color: '#22C55E' },
            { label: 'Sehr Aktiv', range: '80–100', color: '#10B981' },
          ].map((s) => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: s.color,
                  flexShrink: 0,
                  opacity: computedLabel === s.label ? 1 : 0.3,
                  outline: computedLabel === s.label ? `2px solid ${s.color}` : 'none',
                  outlineOffset: 1,
                }}
              />
              <span
                style={{
                  fontSize: 9,
                  fontWeight: computedLabel === s.label ? 700 : 500,
                  color: computedLabel === s.label ? s.color : c.textMuted,
                }}
              >
                {s.label}
              </span>
              <span style={{ fontSize: 8, color: c.textMuted, opacity: 0.6 }}>{s.range}</span>
            </div>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: healthColor }}>{score}/100</span>
        </div>
      )}

      {/* ── Compact 3-col: Engagement · Kommunikation · Content Themen ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, alignItems: 'stretch' }}>
        {/* Engagement */}
        <div style={{ ...card(), display: 'flex', flexDirection: 'column' as const }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <span style={LBL}>Engagement</span>
            <InfoTip
              isDark={isDark}
              text="Wie aktiv das Unternehmen auf Social Media ist — basierend auf Likes, Kommentaren und Reichweite im Verhältnis zu den Followern."
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
            {lead.social_engagement_rate_pct != null && (
              <div>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 11, color: c.textMuted }}>Engagement-Rate</span>
                    <InfoTip
                      isDark={isDark}
                      text="Anteil der Follower, die mit einem Post interagieren. Unter 1% = schwach, 1–3% = gut, über 3% = sehr gut."
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color:
                        lead.social_engagement_rate_pct >= 3
                          ? '#10B981'
                          : lead.social_engagement_rate_pct >= 1
                            ? '#F97316'
                            : '#EF4444',
                    }}
                  >
                    {lead.social_engagement_rate_pct.toFixed(1)}%
                  </span>
                </div>
                <div
                  style={{
                    height: 4,
                    borderRadius: 99,
                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                    overflow: 'hidden',
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, lead.social_engagement_rate_pct * 20)}%` }}
                    transition={{ duration: 0.8 }}
                    style={{
                      height: '100%',
                      borderRadius: 99,
                      background:
                        lead.social_engagement_rate_pct >= 3
                          ? '#10B981'
                          : lead.social_engagement_rate_pct >= 1
                            ? '#F97316'
                            : '#EF4444',
                    }}
                  />
                </div>
              </div>
            )}
            {lead.social_avg_likes_per_post != null && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 11, color: c.textMuted }}>Ø Likes / Post</span>
                  <InfoTip
                    isDark={isDark}
                    text="Durchschnittliche Anzahl Likes pro Beitrag — zeigt wie gut die Inhalte ankommen."
                  />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#34D399' }}>
                  {lead.social_avg_likes_per_post.toFixed(1)}
                </span>
              </div>
            )}
            {lead.social_total_posts_scraped != null && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 11, color: c.textMuted }}>Analysierte Posts</span>
                  <InfoTip
                    isDark={isDark}
                    text="Anzahl der Beiträge, die wir ausgewertet haben. Je mehr, desto verlässlicher die Daten."
                  />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: c.text }}>{lead.social_total_posts_scraped}</span>
              </div>
            )}
            {lead.social_video_pct != null && (
              <div>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 11, color: c.textMuted }}>Video-Anteil</span>
                    <InfoTip
                      isDark={isDark}
                      text="Wie viel Prozent der Beiträge Videos sind. Videos erzielen meist höhere Reichweite."
                    />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#A78BFA' }}>{lead.social_video_pct}%</span>
                </div>
                <div
                  style={{
                    height: 3,
                    borderRadius: 99,
                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                    overflow: 'hidden',
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${lead.social_video_pct}%` }}
                    transition={{ duration: 0.8 }}
                    style={{ height: '100%', borderRadius: 99, background: '#A78BFA' }}
                  />
                </div>
              </div>
            )}
            {lead.social_unique_commenters != null && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 11, color: c.textMuted }}>Kommentatoren</span>
                  <InfoTip
                    isDark={isDark}
                    text="Anzahl verschiedener Nutzer, die auf Posts kommentiert haben. Viele einzigartige Kommentatoren = echte Community."
                  />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: c.text }}>{lead.social_unique_commenters}</span>
              </div>
            )}
          </div>
        </div>

        {/* Kommunikationsstil */}
        <div style={{ ...card(), display: 'flex', flexDirection: 'column' as const }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <span style={LBL}>Kommunikation</span>
            <InfoTip
              isDark={isDark}
              text="Wie das Unternehmen auf Social Media kommuniziert — Ton, Anredeform und Sprache der Beiträge."
            />
          </div>
          {lead.social_communication_style ? (
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
              {(
                [
                  lead.social_communication_style.tone
                    ? {
                        label: 'Ton',
                        val: lead.social_communication_style.tone,
                        tip: 'Grundstimmung der Beiträge — z. B. professionell, locker, inspirierend.',
                      }
                    : null,
                  lead.social_communication_style.formality
                    ? {
                        label: 'Anrede',
                        val:
                          lead.social_communication_style.formality === 'sie'
                            ? 'Sie'
                            : lead.social_communication_style.formality === 'du'
                              ? 'Du'
                              : lead.social_communication_style.formality,
                        tip: 'Wie das Unternehmen seine Zielgruppe anspricht.',
                      }
                    : null,
                  lead.social_communication_style.language
                    ? {
                        label: 'Sprache',
                        val: lead.social_communication_style.language.toUpperCase(),
                        tip: 'Hauptsprache der Posts.',
                      }
                    : null,
                  lead.social_communication_style.uses_emojis != null
                    ? {
                        label: 'Emojis',
                        val: lead.social_communication_style.uses_emojis ? 'Ja' : 'Nein',
                        tip: 'Ob in Beiträgen Emojis verwendet werden.',
                      }
                    : null,
                ].filter(Boolean) as { label: string; val: string; tip: string }[]
              ).map((row) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 11, color: c.textMuted }}>{row.label}</span>
                    <InfoTip isDark={isDark} text={row.tip} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: c.text }}>{row.val}</span>
                </div>
              ))}
              {lead.social_communication_style.style_note && (
                <p
                  style={{
                    fontSize: 10,
                    color: c.textMuted,
                    lineHeight: 1.55,
                    margin: 0,
                    marginTop: 4,
                    borderTop: `1px solid ${sep}`,
                    paddingTop: 8,
                  }}
                >
                  {lead.social_communication_style.style_note}
                </p>
              )}
            </div>
          ) : (
            <p style={{ fontSize: 11, color: c.textMuted, marginTop: 8 }}>Keine Daten.</p>
          )}
        </div>

        {/* Content Themen */}
        {(lead.social_content_themes?.length ?? 0) > 0 ? (
          <div
            style={{
              ...card(),
              display: 'flex',
              flexDirection: 'column' as const,
              height: '100%',
              boxSizing: 'border-box' as const,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <span style={LBL}>Content-Themen</span>
              <InfoTip
                isDark={isDark}
                text="Die häufigsten Themen in den Posts. 'Oft' = sehr regelmäßig, 'Manchmal' = gelegentlich, 'Selten' = selten."
              />
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column' as const,
                flex: 1,
                justifyContent: 'space-between' as const,
              }}
            >
              {lead.social_content_themes!.map((t, i) => {
                const freqColor =
                  t.frequency === 'often' ? '#4F46E5' : t.frequency === 'sometimes' ? '#818CF8' : c.textMuted;
                const freqLabel =
                  t.frequency === 'often' ? 'Häufig' : t.frequency === 'sometimes' ? 'Manchmal' : 'Selten';
                return (
                  <div
                    key={i}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: freqColor,
                          flexShrink: 0,
                          marginTop: 4,
                        }}
                      />
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 500, color: c.text, lineHeight: 1.4 }}>{t.theme}</span>
                        {t.example_post_url && (
                          <a
                            href={t.example_post_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                              fontSize: 9,
                              color: '#818CF8',
                              textDecoration: 'none',
                              marginTop: 3,
                            }}
                          >
                            Beispiel
                            <svg width={9} height={9} viewBox="0 0 12 12" fill="none">
                              <path
                                d="M2.5 9.5L9.5 2.5M9.5 2.5H4.5M9.5 2.5V7.5"
                                stroke="#818CF8"
                                strokeWidth={1.8}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: freqColor,
                        background: `${freqColor}18`,
                        borderRadius: 99,
                        padding: '2px 8px',
                        whiteSpace: 'nowrap' as const,
                        flexShrink: 0,
                      }}
                    >
                      {freqLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div />
        )}
      </div>

      {/* ── Analysis summary ── */}
      {lead.social_analysis_summary && (
        <div style={{ ...card() }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: healthColor, flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: healthColor }}>
              {computedLabel ?? lead.social_health_label ?? 'Analyse'}
            </span>
            {score != null && (
              <span style={{ fontSize: 10, color: c.textMuted, marginLeft: 'auto' }}>Score {score}/100</span>
            )}
          </div>
          <p style={{ fontSize: 12, color: c.text, lineHeight: 1.7, margin: 0 }}>{lead.social_analysis_summary}</p>
        </div>
      )}

      {/* ── 3-col: Post Activity | Hooks | Buying Signals ── */}
      {((lead.social_post_calendar?.length ?? 0) > 0 ||
        (lead.social_personalization_hooks?.length ?? 0) > 0 ||
        (lead.social_buying_signals?.length ?? 0) > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, alignItems: 'stretch' }}>
          {/* Col 1: Post Activity Calendar */}
          <div
            style={{
              borderRadius: 13,
              padding: '14px 16px',
              background: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.022)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
              height: '100%',
              boxSizing: 'border-box' as const,
            }}
          >
            {(lead.social_post_calendar?.length ?? 0) > 0 ? (
              <ContributionGraph calendar={lead.social_post_calendar!} isDark={isDark} c={c} />
            ) : (
              <span style={{ fontSize: 11, color: c.textMuted }}>Keine Aktivitätsdaten</span>
            )}
          </div>

          {/* Col 2: Personalization Hooks */}
          <div
            style={{
              borderRadius: 13,
              padding: '14px 16px',
              background: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.022)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
              height: '100%',
              boxSizing: 'border-box' as const,
              display: 'flex',
              flexDirection: 'column' as const,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <span style={LBL}>
                Personalisierungs-Hooks
                {(lead.social_personalization_hooks?.length ?? 0) > 0
                  ? ` (${lead.social_personalization_hooks!.length})`
                  : ''}
              </span>
              <InfoTip
                isDark={isDark}
                text="Konkrete Gesprächseinstiege basierend auf öffentlichen Posts. Jeder Hook ist ein Aufhänger, den du im ersten Kontakt nutzen kannst."
              />
            </div>
            {(lead.social_personalization_hooks?.length ?? 0) > 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column' as const,
                  flex: 1,
                  justifyContent: 'space-between' as const,
                }}
              >
                {lead.social_personalization_hooks!.map((h, i) => {
                  const platColor = platformMeta[h.platform]?.color ?? '#818CF8';
                  return (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        flexDirection: 'column' as const,
                        gap: 5,
                        padding: '10px 0',
                        borderBottom: i < lead.social_personalization_hooks!.length - 1 ? `1px solid ${sep}` : 'none',
                        flex: 1,
                      }}
                    >
                      {/* Top: colored bar + hook title + meta */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                        <div
                          style={{
                            width: 3,
                            height: 32,
                            borderRadius: 99,
                            background: platColor,
                            flexShrink: 0,
                            marginTop: 2,
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{ fontSize: 12, fontWeight: 700, color: c.text, lineHeight: 1.4, marginBottom: 3 }}
                          >
                            {h.hook}
                          </div>
                          {/* Opener quote — the actual suggested message */}
                          {h.suggested_opener && (
                            <div
                              style={{
                                fontSize: 11,
                                color: c.textMuted,
                                lineHeight: 1.55,
                                fontStyle: 'italic' as const,
                                borderLeft: `2px solid ${platColor}40`,
                                paddingLeft: 8,
                                marginTop: 4,
                              }}
                            >
                              "{h.suggested_opener}"
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Meta row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 12 }}>
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            color: platColor,
                            background: `${platColor}18`,
                            borderRadius: 99,
                            padding: '2px 8px',
                          }}
                        >
                          {platformMeta[h.platform]?.label ?? h.platform}
                        </span>
                        {h.recency_days != null && (
                          <span style={{ fontSize: 9, color: c.textMuted }}>vor {h.recency_days}d</span>
                        )}
                        {h.source_post_url && (
                          <a
                            href={h.source_post_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto' }}
                          >
                            <svg width={11} height={11} viewBox="0 0 12 12" fill="none">
                              <path
                                d="M2.5 9.5L9.5 2.5M9.5 2.5H4.5M9.5 2.5V7.5"
                                stroke={platColor}
                                strokeWidth={1.8}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <span style={{ fontSize: 11, color: c.textMuted }}>Keine Hooks verfügbar</span>
            )}
          </div>

          {/* Col 3: Buying Signals */}
          <div
            style={{
              borderRadius: 13,
              padding: '14px 16px',
              background: isDark ? 'rgba(16,185,129,0.05)' : 'rgba(16,185,129,0.03)',
              border: '1px solid rgba(16,185,129,0.15)',
              height: '100%',
              boxSizing: 'border-box' as const,
              display: 'flex',
              flexDirection: 'column' as const,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <span style={{ ...LBL, color: '#10B981' }}>
                Kauf-Signale
                {(lead.social_buying_signals?.length ?? 0) > 0 ? ` (${lead.social_buying_signals!.length})` : ''}
              </span>
              <InfoTip
                isDark={isDark}
                text="Hinweise aus Posts, dass das Unternehmen kaufbereit ist — z.B. Expansion, Hiring, Tool-Suche. Hoch = sofort ansprechen."
              />
            </div>
            {(lead.social_buying_signals?.length ?? 0) > 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column' as const,
                  flex: 1,
                  justifyContent: 'space-between' as const,
                }}
              >
                {lead.social_buying_signals!.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: 10,
                      alignItems: 'flex-start',
                      padding: '10px 0',
                      borderBottom:
                        i < lead.social_buying_signals!.length - 1 ? `1px solid rgba(16,185,129,0.12)` : 'none',
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: priorityColor(s.priority),
                        flexShrink: 0,
                        marginTop: 4,
                        boxShadow: `0 0 0 3px ${priorityColor(s.priority)}20`,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: c.text, lineHeight: 1.35 }}>
                          {s.signal}
                        </span>
                        {s.priority && (
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              color: priorityColor(s.priority),
                              background: `${priorityColor(s.priority)}18`,
                              borderRadius: 99,
                              padding: '2px 8px',
                              flexShrink: 0,
                            }}
                          >
                            {s.priority === 'high' ? 'Hoch' : s.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                          </span>
                        )}
                        {s.detected_in_post_url && (
                          <a
                            href={s.detected_in_post_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto' }}
                          >
                            <svg width={11} height={11} viewBox="0 0 12 12" fill="none">
                              <path
                                d="M2.5 9.5L9.5 2.5M9.5 2.5H4.5M9.5 2.5V7.5"
                                stroke="#10B981"
                                strokeWidth={1.8}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </a>
                        )}
                      </div>
                      {s.evidence && (
                        <div style={{ fontSize: 11, color: c.textMuted, lineHeight: 1.55 }}>{s.evidence}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <span style={{ fontSize: 11, color: c.textMuted }}>Keine Signale</span>
            )}
          </div>
        </div>
      )}

      {/* ── Flags ── */}
      {((lead.social_risk_flags?.length ?? 0) > 0 || (lead.social_opportunity_flags?.length ?? 0) > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {(lead.social_risk_flags?.length ?? 0) > 0 && (
            <div
              style={{
                borderRadius: 13,
                padding: '16px 18px',
                background: isDark ? 'rgba(239,68,68,0.06)' : 'rgba(239,68,68,0.04)',
                border: '1px solid rgba(239,68,68,0.18)',
              }}
            >
              <div style={{ ...LBL, color: '#EF4444', marginBottom: 12 }}>
                Risiken ({lead.social_risk_flags!.length})
              </div>
              {lead.social_risk_flags!.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: severityColor(f.severity),
                      flexShrink: 0,
                      marginTop: 4,
                    }}
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: c.text, lineHeight: 1.4 }}>{f.flag}</div>
                    {f.evidence && (
                      <div style={{ fontSize: 11, color: c.textMuted, marginTop: 3, lineHeight: 1.55 }}>
                        {f.evidence}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {(lead.social_opportunity_flags?.length ?? 0) > 0 && (
            <div
              style={{
                borderRadius: 13,
                padding: '16px 18px',
                background: isDark ? 'rgba(16,185,129,0.06)' : 'rgba(16,185,129,0.04)',
                border: '1px solid rgba(16,185,129,0.18)',
              }}
            >
              <div style={{ ...LBL, color: '#10B981', marginBottom: 12 }}>
                Chancen ({lead.social_opportunity_flags!.length})
              </div>
              {lead.social_opportunity_flags!.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#10B981',
                      flexShrink: 0,
                      marginTop: 4,
                    }}
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: c.text, lineHeight: 1.4 }}>{f.flag}</div>
                    {f.evidence && (
                      <div style={{ fontSize: 11, color: c.textMuted, marginTop: 3, lineHeight: 1.55 }}>
                        {f.evidence}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Top Kommentatoren ── */}
      {(lead.social_top_commenters?.length ?? 0) > 0 && (
        <div style={{ ...card() }}>
          <div style={{ ...LBL, marginBottom: 8 }}>Top Kommentatoren</div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 0 }}>
            {lead.social_top_commenters!.map((tc, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: i < lead.social_top_commenters!.length - 1 ? `1px solid ${sep}` : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: 10, fontWeight: 700, color: c.textMuted }}>
                      {(tc.name ?? tc.handle ?? '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{tc.name ?? tc.handle ?? '—'}</span>
                    {tc.platform && (
                      <span style={{ fontSize: 10, color: c.textMuted, marginLeft: 6 }}>
                        {platformMeta[tc.platform]?.label ?? tc.platform}
                      </span>
                    )}
                  </div>
                </div>
                {tc.comment_count != null && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: c.textMuted }}>
                    {tc.comment_count} Kommentare
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Anstehende Events ── */}
      {(lead.social_upcoming_events?.length ?? 0) > 0 && (
        <div style={{ ...card(), borderLeft: '3px solid #818CF8' }}>
          <div style={{ ...LBL, color: '#818CF8', marginBottom: 8 }}>Anstehende Events</div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 0 }}>
            {lead.social_upcoming_events!.map((ev, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: i < lead.social_upcoming_events!.length - 1 ? `1px solid ${sep}` : 'none',
                }}
              >
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{ev.title ?? 'Event'}</span>
                  {ev.platform && (
                    <span style={{ fontSize: 10, color: c.textMuted, marginLeft: 8 }}>
                      {platformMeta[ev.platform]?.label ?? ev.platform}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {ev.date && <span style={{ fontSize: 11, color: c.textMuted }}>{ev.date}</span>}
                  {ev.source_url && (
                    <a
                      href={ev.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#818CF8', fontSize: 11, textDecoration: 'none' }}
                    >
                      ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Ähnliche Unternehmen (LinkedIn) ── */}
      {(lead.li_similar_companies?.length ?? 0) > 0 && (
        <div style={{ ...card() }}>
          <div style={{ ...LBL, marginBottom: 8 }}>Ähnliche Unternehmen</div>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
            {lead.li_similar_companies!.map((co, i) => (
              <div
                key={i}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '5px 10px',
                  borderRadius: 8,
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`,
                }}
              >
                {co.url ? (
                  <a
                    href={co.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 12, fontWeight: 600, color: '#0A66C2', textDecoration: 'none' }}
                  >
                    {co.name ?? co.url}
                  </a>
                ) : (
                  <span style={{ fontSize: 12, fontWeight: 600, color: c.text }}>{co.name}</span>
                )}
                {co.size && <span style={{ fontSize: 10, color: c.textMuted }}>{co.size}</span>}
              </div>
            ))}
          </div>
          {lead.li_similar_companies!.some((co) => co.industry) && (
            <div style={{ marginTop: 8, fontSize: 10, color: c.textMuted }}>
              {[...new Set(lead.li_similar_companies!.map((co) => co.industry).filter(Boolean))].join(' · ')}
            </div>
          )}
        </div>
      )}

      {/* ── Warm Intro Kandidaten ── */}
      {(lead.social_warm_intro_candidates?.length ?? 0) > 0 && (
        <div style={{ ...card() }}>
          <div style={{ ...LBL, marginBottom: 10 }}>Warm Intro Möglichkeiten</div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 0 }}>
            {lead.social_warm_intro_candidates!.map((p, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: '10px 0',
                  borderBottom: i < lead.social_warm_intro_candidates!.length - 1 ? `1px solid ${sep}` : 'none',
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 700, color: c.textMuted }}>
                    {p.name
                      .split(' ')
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: c.text }}>{p.name}</span>
                    {p.linkedin_url && (
                      <a
                        href={p.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 10, color: '#0A66C2', textDecoration: 'none', fontWeight: 600 }}
                      >
                        LinkedIn ↗
                      </a>
                    )}
                  </div>
                  {p.relationship_signal && (
                    <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 2, lineHeight: 1.45 }}>
                      {p.relationship_signal}
                    </div>
                  )}
                  {p.reason && <div style={{ fontSize: 11, color: c.text, lineHeight: 1.5 }}>{p.reason}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BewertungenDetail({ lead, c, isDark }: { lead: LeadDetail; c: ReturnType<typeof colors>; isDark: boolean }) {
  const sep = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  const card = (accent?: string): React.CSSProperties => ({
    borderRadius: 13,
    padding: '14px 16px',
    background: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.022)',
    border: `1px solid ${accent ? `${accent}28` : isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  });

  const LBL: React.CSSProperties = {
    fontSize: 9,
    fontWeight: 700,
    color: c.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.09em',
    marginBottom: 4,
  };

  const healthScore = lead.reviews_health_score ?? null;
  const healthColor =
    healthScore == null ? c.textMuted : healthScore >= 65 ? '#10B981' : healthScore >= 40 ? '#F97316' : '#EF4444';
  const SEGS = ['#EF4444', '#F97316', '#FB923C', '#FBBF24', '#FDE047', '#A3E635', '#4ADE80', '#22C55E', '#16A34A'];

  const computedLabel =
    healthScore == null
      ? null
      : healthScore >= 80
        ? 'Sehr Gut'
        : healthScore >= 65
          ? 'Gut'
          : healthScore >= 50
            ? 'Solide'
            : healthScore >= 35
              ? 'Mittel'
              : healthScore >= 20
                ? 'Schwach'
                : 'Kritisch';

  const ratingColor = (r: number) => (r >= 4 ? '#10B981' : r >= 3 ? '#F97316' : '#EF4444');

  const fmtDate = (d?: string) => {
    if (!d) return null;
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? null : dt.toLocaleDateString('de-DE', { month: 'short', year: 'numeric' });
  };

  const freqLabel = (f?: string) => {
    const map: Record<string, string> = { often: 'Oft', sometimes: 'Manchmal', rare: 'Selten' };
    return f ? (map[f] ?? f) : null;
  };

  const toneLabel = (t?: string) => {
    const map: Record<string, string> = {
      professional: 'Professionell',
      friendly: 'Freundlich',
      formal: 'Formell',
      casual: 'Locker',
      defensive: 'Defensiv',
    };
    return t ? (map[t] ?? t) : null;
  };

  const cultureLabel = (s?: string) => {
    const map: Record<string, string> = {
      modern: 'Modern',
      traditional: 'Traditionell',
      startup: 'Startup',
      corporate: 'Konzern',
      family: 'Familienunternehmen',
    };
    return s ? (map[s] ?? s) : null;
  };

  const timeLabel = (t?: string) => {
    const map: Record<string, string> = { fast: 'Schnell', medium: 'Mittel', slow: 'Langsam' };
    return t ? (map[t] ?? t) : null;
  };

  const severityColor = (s?: string) => (s === 'high' ? '#EF4444' : s === 'medium' ? '#F97316' : '#94A3B8');

  // Star distribution bar chart for a platform
  const StarBars = ({ dist, count }: { dist?: Record<string, number>; count?: number }) => {
    if (!dist) return null;
    const total = count ?? Object.values(dist).reduce((s, v) => s + v, 0);
    if (total === 0) return null;
    return (
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 3, marginTop: 8 }}>
        {[5, 4, 3, 2, 1].map((star) => {
          const n = dist[String(star)] ?? 0;
          const pct = total > 0 ? (n / total) * 100 : 0;
          const col = star >= 4 ? '#10B981' : star === 3 ? '#F97316' : '#EF4444';
          return (
            <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 9, color: c.textMuted, width: 8, flexShrink: 0, textAlign: 'right' as const }}>
                {star}
              </span>
              <div
                style={{
                  flex: 1,
                  height: 5,
                  borderRadius: 99,
                  background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    borderRadius: 99,
                    background: col,
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
              <span style={{ fontSize: 9, color: c.textMuted, width: 12, flexShrink: 0 }}>{n}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const platforms = [
    {
      key: 'google',
      label: 'Google',
      color: '#34A853',
      rating: lead.reviews_google_rating,
      count: lead.reviews_google_count,
      dist: lead.reviews_google_distribution,
      url: lead.google_reviews_url,
      extra: null,
    },
    {
      key: 'trustpilot',
      label: 'Trustpilot',
      color: '#00B67A',
      rating: lead.reviews_trustpilot_rating,
      count: lead.reviews_trustpilot_count,
      dist: lead.reviews_trustpilot_distribution,
      url: lead.trustpilot_url,
      extra: lead.reviews_trustpilot_claimed === false ? 'Nicht beansprucht' : null,
    },
    {
      key: 'kununu',
      label: 'Kununu',
      color: '#FFB800',
      rating: lead.reviews_kununu_rating,
      count: lead.reviews_kununu_count,
      dist: null,
      url: lead.kununu_url,
      extra:
        lead.reviews_kununu_recommendation_pct != null ? `${lead.reviews_kununu_recommendation_pct}% Empfehlung` : null,
    },
  ].filter((p) => p.rating != null || p.count != null);

  const hasAnyData =
    healthScore != null ||
    platforms.length > 0 ||
    (lead.reviews_outreach_hooks?.length ?? 0) > 0 ||
    lead.reviews_analysis_summary != null;

  if (!hasAnyData) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center' as const, color: c.textMuted, fontSize: 14 }}>
        Noch keine Bewertungsdaten verfügbar.
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 14,
        overflowY: 'auto' as const,
      }}
    >
      {/* ── Header: health hero + platform cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: platforms.length > 0 ? '1fr 2fr' : '1fr', gap: 12 }}>
        {/* Left — health hero */}
        <div
          style={{
            ...card(),
            borderLeft: `3px solid ${healthColor}`,
            display: 'flex',
            flexDirection: 'column' as const,
            gap: 6,
          }}
        >
          <span style={LBL}>Bewertungs-Gesundheit</span>
          <span style={{ fontSize: 32, fontWeight: 800, color: healthColor, lineHeight: 1 }}>
            {computedLabel ?? deLabel(lead.reviews_health_label) ?? '—'}
          </span>
          {healthScore != null && <span style={{ fontSize: 11, color: c.textMuted }}>{healthScore} / 100</span>}
          <div style={{ position: 'relative', marginTop: 4 }}>
            <div style={{ display: 'flex', gap: 2 }}>
              {SEGS.map((seg, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: 6,
                    borderRadius: 99,
                    background: seg,
                    opacity: healthScore != null ? 1 : 0.2,
                  }}
                />
              ))}
            </div>
            {healthScore != null && (
              <div
                style={{
                  position: 'absolute',
                  top: -3,
                  left: `calc(${Math.min(96, Math.max(2, healthScore))}% - 1px)`,
                  width: 2,
                  height: 12,
                  background: isDark ? '#fff' : '#111',
                  borderRadius: 1,
                }}
              />
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: c.textMuted }}>
            <span>Kritisch</span>
            <span>Sehr Gut</span>
          </div>
          {/* Aggregate metrics */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column' as const,
              gap: 5,
              marginTop: 6,
              paddingTop: 10,
              borderTop: `1px solid ${sep}`,
            }}
          >
            {lead.reviews_overall_score != null && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: c.textMuted }}>Ø Alle Plattformen</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: ratingColor(lead.reviews_overall_score) }}>
                  {lead.reviews_overall_score.toFixed(1)} / 5
                </span>
              </div>
            )}
            {lead.reviews_total_count != null && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: c.textMuted }}>Gesamt Bewertungen</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: c.text }}>{lead.reviews_total_count}</span>
              </div>
            )}
            {lead.reviews_employer_brand_score != null && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: c.textMuted }}>Employer Brand</span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color:
                      lead.reviews_employer_brand_score >= 70
                        ? '#10B981'
                        : lead.reviews_employer_brand_score >= 50
                          ? '#F97316'
                          : '#EF4444',
                  }}
                >
                  {lead.reviews_employer_brand_score} / 100
                </span>
              </div>
            )}
            {lead.reviews_sentiment_trend && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: c.textMuted }}>Trend</span>
                {(() => {
                  const t = lead.reviews_sentiment_trend!;
                  const isGood = t === 'improving' || t === 'growing';
                  const isBad = t === 'declining';
                  const col = isGood ? '#10B981' : isBad ? '#EF4444' : '#F97316';
                  return (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: col,
                        background: `${col}18`,
                        borderRadius: 99,
                        padding: '2px 7px',
                      }}
                    >
                      {isGood ? '↑' : isBad ? '↓' : '~'} {deLabel(t)}
                    </span>
                  );
                })()}
              </div>
            )}
            {lead.reviews_latest_date && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: c.textMuted }}>Letzte Bewertung</span>
                <span style={{ fontSize: 10, color: c.textMuted }}>{fmtDate(lead.reviews_latest_date)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right — platform cards */}
        {platforms.length > 0 && (
          <div
            style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(platforms.length, 3)}, 1fr)`, gap: 10 }}
          >
            {platforms.map((p) => (
              <div key={p.key} style={{ ...card(p.color), display: 'flex', flexDirection: 'column' as const, gap: 0 }}>
                {/* Header */}
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}
                >
                  <span style={{ fontSize: 12, fontWeight: 700, color: p.color }}>{p.label}</span>
                  {p.url && (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 10, color: p.color, textDecoration: 'none', opacity: 0.8 }}
                    >
                      ↗
                    </a>
                  )}
                </div>
                {/* Rating */}
                {p.rating != null && (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                    <span style={{ fontSize: 34, fontWeight: 800, color: ratingColor(p.rating), lineHeight: 1 }}>
                      {p.rating.toFixed(1)}
                    </span>
                    <span style={{ fontSize: 11, color: c.textMuted }}>/ 5</span>
                  </div>
                )}
                {p.count != null && (
                  <span style={{ fontSize: 10, color: c.textMuted, marginTop: 2 }}>{p.count} Bewertungen</span>
                )}
                {p.extra && (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: '#F97316',
                      marginTop: 3,
                      background: '#F9731618',
                      borderRadius: 99,
                      padding: '1px 6px',
                      alignSelf: 'flex-start' as const,
                    }}
                  >
                    {p.extra}
                  </span>
                )}
                {/* Star distribution bars */}
                <StarBars dist={p.dist ?? undefined} count={p.count} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Kununu details ── */}
      {lead.reviews_kununu_rating != null &&
        (lead.reviews_kununu_culture_style != null ||
          (lead.reviews_kununu_best_factors?.length ?? 0) > 0 ||
          (lead.reviews_kununu_worst_factors?.length ?? 0) > 0 ||
          lead.reviews_kununu_recommendation_pct != null) && (
          <div style={{ ...card('#FFB800'), borderLeft: '3px solid #FFB800' }}>
            <div style={{ ...LBL, color: '#FFB800', marginBottom: 10 }}>Kununu Details</div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
              {/* Recommendation + culture */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
                {lead.reviews_kununu_recommendation_pct != null && (
                  <div style={{ flex: 1, minWidth: 120 }}>
                    <div style={{ fontSize: 10, color: c.textMuted, marginBottom: 4 }}>Weiterempfehlung</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div
                        style={{
                          flex: 1,
                          height: 6,
                          borderRadius: 99,
                          background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${lead.reviews_kununu_recommendation_pct}%`,
                            height: '100%',
                            borderRadius: 99,
                            background:
                              lead.reviews_kununu_recommendation_pct >= 70
                                ? '#10B981'
                                : lead.reviews_kununu_recommendation_pct >= 50
                                  ? '#F97316'
                                  : '#EF4444',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: c.text, flexShrink: 0 }}>
                        {lead.reviews_kununu_recommendation_pct}%
                      </span>
                    </div>
                  </div>
                )}
                {lead.reviews_kununu_culture_style != null && (
                  <div>
                    <div style={{ fontSize: 10, color: c.textMuted, marginBottom: 4 }}>Unternehmenskultur</div>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#FFB800',
                        background: '#FFB80018',
                        borderRadius: 99,
                        padding: '3px 10px',
                      }}
                    >
                      {cultureLabel(lead.reviews_kununu_culture_style)}
                    </span>
                  </div>
                )}
              </div>
              {/* Best factors */}
              {(lead.reviews_kununu_best_factors?.length ?? 0) > 0 && (
                <div>
                  <div style={{ fontSize: 10, color: '#10B981', fontWeight: 700, marginBottom: 5 }}>Top-Faktoren</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5 }}>
                    {lead.reviews_kununu_best_factors!.map((f, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#10B981',
                          background: '#10B98118',
                          borderRadius: 7,
                          padding: '3px 9px',
                        }}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {/* Worst factors */}
              {(lead.reviews_kununu_worst_factors?.length ?? 0) > 0 && (
                <div>
                  <div style={{ fontSize: 10, color: '#EF4444', fontWeight: 700, marginBottom: 5 }}>
                    Verbesserungsbedarf
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5 }}>
                    {lead.reviews_kununu_worst_factors!.map((f, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#EF4444',
                          background: '#EF444418',
                          borderRadius: 7,
                          padding: '3px 9px',
                        }}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      {/* ── Lob & Kritik ── */}
      {((lead.reviews_top_praise?.length ?? 0) > 0 || (lead.reviews_top_complaints?.length ?? 0) > 0) && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              (lead.reviews_top_praise?.length ?? 0) > 0 && (lead.reviews_top_complaints?.length ?? 0) > 0
                ? '1fr 1fr'
                : '1fr',
            gap: 12,
          }}
        >
          {/* Praise */}
          {(lead.reviews_top_praise?.length ?? 0) > 0 && (
            <div
              style={{
                borderRadius: 13,
                padding: '16px 18px',
                background: isDark ? 'rgba(16,185,129,0.05)' : 'rgba(16,185,129,0.03)',
                border: '1px solid rgba(16,185,129,0.15)',
                borderLeft: '3px solid #10B981' as const,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ ...LBL, color: '#10B981', marginBottom: 0 }}>Lob</span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#10B981',
                    background: 'rgba(16,185,129,0.12)',
                    borderRadius: 99,
                    padding: '2px 7px',
                  }}
                >
                  {lead.reviews_top_praise!.length}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                {lead.reviews_top_praise!.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      paddingBottom: i < lead.reviews_top_praise!.length - 1 ? 12 : 0,
                      borderBottom: i < lead.reviews_top_praise!.length - 1 ? `1px solid ${sep}` : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: '#10B981',
                          boxShadow: '0 0 5px #10B98170',
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: 13, fontWeight: 700, color: c.text }}>{p.topic}</span>
                      {p.platform && (
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            color: c.textMuted,
                            background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
                            borderRadius: 4,
                            padding: '1px 5px',
                            textTransform: 'capitalize' as const,
                          }}
                        >
                          {p.platform}
                        </span>
                      )}
                      {p.frequency && (
                        <span style={{ fontSize: 9, color: '#10B981', opacity: 0.8 }}>{freqLabel(p.frequency)}</span>
                      )}
                    </div>
                    {p.example_quote && (
                      <div
                        style={{
                          fontSize: 11,
                          color: c.textMuted,
                          fontStyle: 'italic',
                          lineHeight: 1.55,
                          paddingLeft: 15,
                        }}
                      >
                        „{p.example_quote}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Complaints */}
          {(lead.reviews_top_complaints?.length ?? 0) > 0 && (
            <div
              style={{
                borderRadius: 13,
                padding: '16px 18px',
                background: isDark ? 'rgba(239,68,68,0.05)' : 'rgba(239,68,68,0.03)',
                border: '1px solid rgba(239,68,68,0.15)',
                borderLeft: '3px solid #EF4444' as const,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ ...LBL, color: '#EF4444', marginBottom: 0 }}>Kritik</span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#EF4444',
                    background: 'rgba(239,68,68,0.12)',
                    borderRadius: 99,
                    padding: '2px 7px',
                  }}
                >
                  {lead.reviews_top_complaints!.length}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                {lead.reviews_top_complaints!.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      paddingBottom: i < lead.reviews_top_complaints!.length - 1 ? 12 : 0,
                      borderBottom: i < lead.reviews_top_complaints!.length - 1 ? `1px solid ${sep}` : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: severityColor(p.severity),
                          boxShadow: `0 0 5px ${severityColor(p.severity)}70`,
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: 13, fontWeight: 700, color: c.text }}>{p.topic}</span>
                      {p.platform && (
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            color: c.textMuted,
                            background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
                            borderRadius: 4,
                            padding: '1px 5px',
                            textTransform: 'capitalize' as const,
                          }}
                        >
                          {p.platform}
                        </span>
                      )}
                      {p.frequency && (
                        <span style={{ fontSize: 9, color: severityColor(p.severity), opacity: 0.8 }}>
                          {freqLabel(p.frequency)}
                        </span>
                      )}
                    </div>
                    {p.example_quote && (
                      <div
                        style={{
                          fontSize: 11,
                          color: c.textMuted,
                          fontStyle: 'italic',
                          lineHeight: 1.55,
                          paddingLeft: 15,
                        }}
                      >
                        „{p.example_quote}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Shipping complaints (if any) ── */}
      {(lead.reviews_shipping_complaints?.length ?? 0) > 0 && (
        <div style={{ ...card('#F97316'), borderLeft: '3px solid #F97316' }}>
          <div style={{ ...LBL, color: '#F97316', marginBottom: 10 }}>
            Versand-Beschwerden ({lead.reviews_shipping_complaints!.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
            {lead.reviews_shipping_complaints!.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 10 }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: severityColor(p.severity),
                    marginTop: 4,
                    flexShrink: 0,
                  }}
                />
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: c.text }}>{p.topic}</span>
                  {p.example_quote && (
                    <div style={{ fontSize: 11, color: c.textMuted, fontStyle: 'italic', marginTop: 2 }}>
                      „{p.example_quote}"
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Outreach Hooks — most actionable ── */}
      {(lead.reviews_outreach_hooks?.length ?? 0) > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
          <div style={{ ...LBL, marginBottom: 0 }}>Outreach-Hooks aus Bewertungen</div>
          {lead.reviews_outreach_hooks!.map((h, i) => (
            <div
              key={i}
              style={{
                borderRadius: 13,
                padding: '16px 18px',
                background: isDark ? 'rgba(129,140,248,0.06)' : 'rgba(79,70,229,0.04)',
                border: '1px solid rgba(129,140,248,0.2)',
                borderLeft: '3px solid #818CF8' as const,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#818CF8' }}>{h.hook}</span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {h.source_platform && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: c.textMuted,
                        background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
                        borderRadius: 4,
                        padding: '1px 5px',
                        textTransform: 'capitalize' as const,
                      }}
                    >
                      {h.source_platform}
                    </span>
                  )}
                  {h.based_on_review_count != null && (
                    <span style={{ fontSize: 9, color: c.textMuted }}>
                      {h.based_on_review_count} Bewertung{h.based_on_review_count !== 1 ? 'en' : ''}
                    </span>
                  )}
                </div>
              </div>
              {h.pain_point && (
                <p style={{ fontSize: 12, color: c.textSub, margin: '0 0 10px', lineHeight: 1.55 }}>{h.pain_point}</p>
              )}
              {h.suggested_opener && (
                <div
                  style={{
                    borderRadius: 8,
                    padding: '10px 14px',
                    background: isDark ? 'rgba(129,140,248,0.1)' : 'rgba(79,70,229,0.07)',
                    borderLeft: '2px solid #818CF8',
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: '#818CF8',
                      textTransform: 'uppercase' as const,
                      letterSpacing: '0.08em',
                      marginBottom: 5,
                    }}
                  >
                    Gesprächseinstieg
                  </div>
                  <p style={{ fontSize: 12, color: c.text, margin: 0, lineHeight: 1.6, fontStyle: 'italic' }}>
                    „{h.suggested_opener}"
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Internal Signals ── */}
      {(lead.reviews_internal_signals?.length ?? 0) > 0 && (
        <div style={{ ...card() }}>
          <div style={{ ...LBL, marginBottom: 10 }}>Interne Signale</div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 0 }}>
            {lead.reviews_internal_signals!.map((s, i) => (
              <div
                key={i}
                style={{
                  paddingBottom: i < lead.reviews_internal_signals!.length - 1 ? 14 : 0,
                  borderBottom: i < lead.reviews_internal_signals!.length - 1 ? `1px solid ${sep}` : 'none',
                  marginBottom: i < lead.reviews_internal_signals!.length - 1 ? 14 : 0,
                }}
              >
                <div style={{ display: 'flex', gap: 10 }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: '#818CF8',
                      boxShadow: '0 0 6px #818CF880',
                      flexShrink: 0,
                      marginTop: 3,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: c.text, lineHeight: 1.4, marginBottom: 3 }}>
                      {s.signal}
                    </div>
                    {s.evidence && (
                      <div
                        style={{
                          fontSize: 11,
                          color: c.textMuted,
                          lineHeight: 1.55,
                          marginBottom: s.outreach_relevance ? 5 : 0,
                        }}
                      >
                        {s.evidence}
                      </div>
                    )}
                    {s.outreach_relevance && (
                      <div
                        style={{
                          fontSize: 11,
                          color: '#818CF8',
                          lineHeight: 1.5,
                          background: isDark ? 'rgba(129,140,248,0.08)' : 'rgba(79,70,229,0.06)',
                          borderRadius: 6,
                          padding: '5px 8px',
                          marginTop: 4,
                        }}
                      >
                        {s.outreach_relevance}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Competitor Mentions ── */}
      {(lead.reviews_competitor_mentions?.length ?? 0) > 0 && (
        <div style={{ ...card() }}>
          <div style={{ ...LBL, marginBottom: 8 }}>Wettbewerber-Nennungen</div>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
            {lead.reviews_competitor_mentions!.map((comp, i) => (
              <div
                key={i}
                style={{
                  borderRadius: 8,
                  padding: '6px 12px',
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                  border: `1px solid ${sep}`,
                }}
              >
                {comp.url ? (
                  <a
                    href={comp.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 12, fontWeight: 700, color: '#818CF8', textDecoration: 'none' }}
                  >
                    {comp.name ?? comp.url}
                  </a>
                ) : (
                  <span style={{ fontSize: 12, fontWeight: 700, color: c.text }}>{comp.name}</span>
                )}
                {comp.context && <div style={{ fontSize: 10, color: c.textMuted, marginTop: 2 }}>{comp.context}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Response Style ── */}
      {lead.reviews_response_style && (
        <div style={{ ...card() }}>
          <div style={{ ...LBL, marginBottom: 10 }}>Antwortverhalten</div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
              marginBottom: lead.reviews_response_style.outreach_implication ? 12 : 0,
            }}
          >
            {lead.reviews_response_style.tone && (
              <div>
                <div style={{ fontSize: 10, color: c.textMuted, marginBottom: 4 }}>Ton</div>
                <span style={{ fontSize: 12, fontWeight: 700, color: c.text }}>
                  {toneLabel(lead.reviews_response_style.tone)}
                </span>
              </div>
            )}
            {lead.reviews_response_style.avg_response_time && (
              <div>
                <div style={{ fontSize: 10, color: c.textMuted, marginBottom: 4 }}>Reaktionszeit</div>
                <span style={{ fontSize: 12, fontWeight: 700, color: c.text }}>
                  {timeLabel(lead.reviews_response_style.avg_response_time)}
                </span>
              </div>
            )}
            {lead.reviews_response_style.response_rate_pct != null && (
              <div style={{ gridColumn: '1 / -1' as const }}>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}
                >
                  <span style={{ fontSize: 10, color: c.textMuted }}>Antwortrate</span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color:
                        lead.reviews_response_style.response_rate_pct >= 70
                          ? '#10B981'
                          : lead.reviews_response_style.response_rate_pct >= 40
                            ? '#F97316'
                            : '#EF4444',
                    }}
                  >
                    {lead.reviews_response_style.response_rate_pct}%
                  </span>
                </div>
                <div
                  style={{
                    height: 5,
                    borderRadius: 99,
                    background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${lead.reviews_response_style.response_rate_pct}%`,
                      height: '100%',
                      borderRadius: 99,
                      background:
                        lead.reviews_response_style.response_rate_pct >= 70
                          ? '#10B981'
                          : lead.reviews_response_style.response_rate_pct >= 40
                            ? '#F97316'
                            : '#EF4444',
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          {lead.reviews_response_style.outreach_implication && (
            <div
              style={{
                borderRadius: 8,
                padding: '8px 12px',
                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                borderLeft: '2px solid #818CF8',
                marginTop: 2,
              }}
            >
              <div style={{ fontSize: 11, color: c.textSub, lineHeight: 1.55 }}>
                {lead.reviews_response_style.outreach_implication}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Best Contact Timing ── */}
      {lead.reviews_best_contact_timing && (
        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
            borderRadius: 10,
            padding: '10px 14px',
            background: isDark ? 'rgba(251,191,36,0.06)' : 'rgba(251,191,36,0.06)',
            border: '1px solid rgba(251,191,36,0.2)',
          }}
        >
          <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>⏱</span>
          <div>
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: '#FBBF24',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.08em',
                marginBottom: 3,
              }}
            >
              Bester Kontaktzeitpunkt
            </div>
            <div style={{ fontSize: 12, color: c.textSub, lineHeight: 1.55 }}>{lead.reviews_best_contact_timing}</div>
          </div>
        </div>
      )}

      {/* ── Risk / Opportunity Flags ── */}
      {((lead.reviews_risk_flags?.length ?? 0) > 0 || (lead.reviews_opportunity_flags?.length ?? 0) > 0) && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              (lead.reviews_risk_flags?.length ?? 0) > 0 && (lead.reviews_opportunity_flags?.length ?? 0) > 0
                ? '1fr 1fr'
                : '1fr',
            gap: 12,
          }}
        >
          {(lead.reviews_risk_flags?.length ?? 0) > 0 && (
            <div
              style={{
                borderRadius: 13,
                padding: '16px 18px',
                background: isDark ? 'rgba(239,68,68,0.05)' : 'rgba(239,68,68,0.03)',
                border: '1px solid rgba(239,68,68,0.15)',
                borderLeft: '3px solid #EF4444' as const,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ ...LBL, color: '#EF4444', marginBottom: 0 }}>Risiken</span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#EF4444',
                    background: 'rgba(239,68,68,0.12)',
                    borderRadius: 99,
                    padding: '2px 7px',
                  }}
                >
                  {lead.reviews_risk_flags!.length}
                </span>
              </div>
              {lead.reviews_risk_flags!.map((f, i) => (
                <div
                  key={i}
                  style={{ display: 'flex', gap: 10, marginBottom: i < lead.reviews_risk_flags!.length - 1 ? 12 : 0 }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: severityColor(f.severity),
                      boxShadow: `0 0 6px ${severityColor(f.severity)}80`,
                      flexShrink: 0,
                      marginTop: 4,
                    }}
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: c.text, lineHeight: 1.4 }}>{f.flag}</div>
                    {f.source && (
                      <div
                        style={{
                          fontSize: 9,
                          color: c.textMuted,
                          fontWeight: 700,
                          textTransform: 'capitalize' as const,
                          marginTop: 1,
                        }}
                      >
                        {f.source}
                      </div>
                    )}
                    {f.evidence && (
                      <div style={{ fontSize: 11, color: c.textMuted, marginTop: 3, lineHeight: 1.55 }}>
                        {f.evidence}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {(lead.reviews_opportunity_flags?.length ?? 0) > 0 && (
            <div
              style={{
                borderRadius: 13,
                padding: '16px 18px',
                background: isDark ? 'rgba(16,185,129,0.05)' : 'rgba(16,185,129,0.03)',
                border: '1px solid rgba(16,185,129,0.15)',
                borderLeft: '3px solid #10B981' as const,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ ...LBL, color: '#10B981', marginBottom: 0 }}>Chancen</span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#10B981',
                    background: 'rgba(16,185,129,0.12)',
                    borderRadius: 99,
                    padding: '2px 7px',
                  }}
                >
                  {lead.reviews_opportunity_flags!.length}
                </span>
              </div>
              {lead.reviews_opportunity_flags!.map((f, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 10,
                    marginBottom: i < lead.reviews_opportunity_flags!.length - 1 ? 12 : 0,
                  }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: '#10B981',
                      boxShadow: '0 0 6px #10B98180',
                      flexShrink: 0,
                      marginTop: 4,
                    }}
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: c.text, lineHeight: 1.4 }}>{f.flag}</div>
                    {f.source && (
                      <div
                        style={{
                          fontSize: 9,
                          color: c.textMuted,
                          fontWeight: 700,
                          textTransform: 'capitalize' as const,
                          marginTop: 1,
                        }}
                      >
                        {f.source}
                      </div>
                    )}
                    {f.evidence && (
                      <div style={{ fontSize: 11, color: c.textMuted, marginTop: 3, lineHeight: 1.55 }}>
                        {f.evidence}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── KI-Analyse ── */}
      {lead.reviews_analysis_summary && (
        <div style={{ ...card(), borderLeft: `3px solid ${healthColor}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ ...LBL, marginBottom: 0 }}>KI-Analyse</span>
            {healthScore != null && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: healthColor,
                  background: `${healthColor}18`,
                  borderRadius: 99,
                  padding: '2px 7px',
                }}
              >
                {healthScore} / 100
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: c.textSub, lineHeight: 1.7, margin: 0 }}>{lead.reviews_analysis_summary}</p>
          {lead.reviews_analyzed_at && (
            <div style={{ fontSize: 9, color: c.textMuted, marginTop: 8 }}>
              Analysiert {fmtDate(lead.reviews_analyzed_at)}
            </div>
          )}
        </div>
      )}

      <SourceBadge label="Google · Trustpilot · Kununu" />
    </div>
  );
}

// Extracts all [https://...] URLs from a text block, deduplicated, preserving
// first-seen order. Used to aggregate evidence URLs for the "Quellen" section.
function extractCitationUrls(text: string | undefined): string[] {
  if (!text) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  const re = /\[(https?:\/\/[^\]\s]+)\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (!seen.has(m[1])) {
      seen.add(m[1]);
      out.push(m[1]);
    }
  }
  return out;
}

// Maps a pain-signal `source` tag to whatever review/maps URL is available on
// the lead so a "reviews" pain becomes clickable.
function reviewUrlFor(source: string | undefined, lead: LeadDetail): string | null {
  if (!source) return null;
  const s = source.toLowerCase();
  if (s === 'reviews' || s.includes('google')) {
    return lead.google_reviews_url ?? lead.trustpilot_url ?? lead.kununu_url ?? lead.provenexpert_url ?? null;
  }
  if (s.includes('trustpilot')) return lead.trustpilot_url ?? null;
  if (s.includes('kununu')) return lead.kununu_url ?? null;
  if (s.includes('provenexpert')) return lead.provenexpert_url ?? null;
  if (s.includes('linkedin')) return lead.linkedin_url ?? null;
  return null;
}

// Parses inline [https://...] citations in agent-written text and renders
// them as small clickable ↗ badges. Returns an array of React nodes.
function renderWithCitations(text: string | undefined): React.ReactNode {
  if (!text) return null;
  const seen = new Map<string, number>();
  const parts = text.split(/(\[https?:\/\/[^\]\s]+\])/g);
  return parts.map((part, idx) => {
    const m = part.match(/^\[(https?:\/\/[^\]\s]+)\]$/);
    if (m) {
      const url = m[1];
      if (!seen.has(url)) seen.set(url, seen.size + 1);
      const n = seen.get(url)!;
      return (
        <a
          key={`c-${idx}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          title={url}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
            padding: '0 5px',
            marginLeft: 3,
            marginRight: 1,
            fontSize: 10,
            fontWeight: 700,
            color: '#0EA5E9',
            background: 'rgba(14,165,233,0.1)',
            border: '1px solid rgba(14,165,233,0.22)',
            borderRadius: 4,
            textDecoration: 'none',
            verticalAlign: 'baseline',
            cursor: 'pointer',
          }}
        >
          [{n}]
        </a>
      );
    }
    return <span key={`t-${idx}`}>{part}</span>;
  });
}

// Inline-highlights numbers, EUR amounts, percentages and metric units inside
// agent-written text, while still rendering [https://...] citations as badges.
// Citations are split out first so URLs never get caught by the metric regexes.
const SHIP_HL_PATTERNS: { regex: RegExp; kind: 'money' | 'percent' | 'metric' }[] = [
  { regex: /[~≈]?\d[\d.,]*[-–]?\d*[\d.,]*\s*EUR(?:\/\w+)?/g, kind: 'money' },
  { regex: /\d[\d.,]*[-–]?\d*[\d.,]*\s*%/g, kind: 'percent' },
  {
    regex:
      /\d[\d.,]*[-–]?\d*[\d.,]*\s*(?:Sendungen|Stück|Pakete?|Fahrzeug\w*|Standort\w*|Mitarbeiter\w*|m²|FTE|Tausend\w*)/g,
    kind: 'metric',
  },
];

function shipHighlightStyle(kind: 'money' | 'percent' | 'metric', isDark: boolean): React.CSSProperties {
  const map = {
    money: { bg: isDark ? 'rgba(186,117,23,0.15)' : 'rgba(250,238,218,0.8)', fg: isDark ? '#FAC775' : '#633806' },
    percent: { bg: isDark ? 'rgba(99,153,34,0.15)' : 'rgba(234,243,222,0.8)', fg: isDark ? '#C0DD97' : '#173404' },
    metric: { bg: isDark ? 'rgba(55,138,221,0.15)' : 'rgba(230,241,251,0.8)', fg: isDark ? '#B5D4F4' : '#042C53' },
  }[kind];
  return {
    background: map.bg,
    color: map.fg,
    padding: '1px 4px',
    borderRadius: 3,
    fontWeight: 500,
  };
}

function HighlightedText({ text, isDark }: { text: string | null | undefined; isDark: boolean }) {
  if (!text) return null;
  // 1. Split off citation markers so they stay clickable and untouched.
  const citationParts = text.split(/(\[https?:\/\/[^\]\s]+\])/g);
  const seen = new Map<string, number>();
  return (
    <>
      {citationParts.map((part, ci) => {
        const cm = part.match(/^\[(https?:\/\/[^\]\s]+)\]$/);
        if (cm) {
          const url = cm[1];
          if (!seen.has(url)) seen.set(url, seen.size + 1);
          const n = seen.get(url)!;
          return (
            <a
              key={`hc-${ci}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              title={url}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 2,
                padding: '0 5px',
                marginLeft: 3,
                marginRight: 1,
                fontSize: 10,
                fontWeight: 700,
                color: '#0EA5E9',
                background: 'rgba(14,165,233,0.1)',
                border: '1px solid rgba(14,165,233,0.22)',
                borderRadius: 4,
                textDecoration: 'none',
                verticalAlign: 'baseline',
              }}
            >
              [{n}]
            </a>
          );
        }
        // 2. Highlight metrics inside the plain-text segment.
        let segments: { text: string; kind?: 'money' | 'percent' | 'metric' }[] = [{ text: part }];
        for (const { regex, kind } of SHIP_HL_PATTERNS) {
          const next: typeof segments = [];
          for (const seg of segments) {
            if (seg.kind) {
              next.push(seg);
              continue;
            }
            let last = 0;
            const matches = [...seg.text.matchAll(new RegExp(regex.source, 'g'))];
            for (const mm of matches) {
              const idx = mm.index ?? 0;
              if (idx > last) next.push({ text: seg.text.slice(last, idx) });
              next.push({ text: mm[0], kind });
              last = idx + mm[0].length;
            }
            if (last < seg.text.length) next.push({ text: seg.text.slice(last) });
          }
          segments = next;
        }
        return (
          <span key={`ht-${ci}`}>
            {segments.map((seg, si) =>
              seg.kind ? (
                <mark key={si} style={shipHighlightStyle(seg.kind, isDark)}>
                  {seg.text}
                </mark>
              ) : (
                <span key={si}>{seg.text}</span>
              )
            )}
          </span>
        );
      })}
    </>
  );
}

// Progressive-disclosure block: headline + optional always-on summary +
// optional detail behind a toggle. Used for Analyse, Einspar-Potenzial, Outreach.
function ShipProgressiveSection({
  c,
  isDark,
  accent,
  eyebrow,
  headline,
  headlineNode,
  summary,
  detail,
  moreLabel,
  lessLabel,
}: {
  c: ReturnType<typeof colors>;
  isDark: boolean;
  accent: string;
  eyebrow?: string;
  headline?: string | null;
  headlineNode?: React.ReactNode;
  summary?: string | null;
  detail?: string | null;
  moreLabel: string;
  lessLabel: string;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      style={{
        borderLeft: `3px solid ${accent}`,
        paddingLeft: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      {eyebrow && (
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: accent,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 2,
          }}
        >
          {eyebrow}
        </div>
      )}
      {headlineNode
        ? headlineNode
        : headline && (
            <h3 style={{ fontSize: 15, fontWeight: 700, color: c.text, margin: 0, lineHeight: 1.4 }}>{headline}</h3>
          )}
      {summary && (
        <p style={{ fontSize: 13, lineHeight: 1.6, color: c.textSub, margin: 0 }}>
          <HighlightedText text={summary} isDark={isDark} />
        </p>
      )}
      {detail && (
        <>
          <button
            onClick={() => setExpanded((v) => !v)}
            style={{
              alignSelf: 'flex-start',
              marginTop: 4,
              fontSize: 12,
              fontWeight: 600,
              color: '#0EA5E9',
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
            }}
          >
            {expanded ? `${lessLabel} ▲` : `${moreLabel} ▼`}
          </button>
          {expanded && (
            <div
              style={{
                marginTop: 8,
                paddingTop: 10,
                borderTop: `1px dashed ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
                fontSize: 13,
                lineHeight: 1.65,
                color: c.textSub,
                whiteSpace: 'pre-wrap',
              }}
            >
              <HighlightedText text={detail} isDark={isDark} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Generic single-open accordion. Parent precomputes header/body nodes per item.
function ShipAccordion({
  items,
  c,
  isDark,
}: {
  items: { header: React.ReactNode; body: React.ReactNode }[];
  c: ReturnType<typeof colors>;
  isDark: boolean;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const divider = isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.06)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {items.map((it, i) => (
        <div key={i} style={{ borderTop: i === 0 ? 'none' : divider }}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              padding: '11px 2px',
              background: 'transparent',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              color: c.text,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minWidth: 0 }}>
              {it.header}
            </span>
            <ChevronDown
              size={16}
              style={{
                flexShrink: 0,
                color: c.textMuted,
                transform: open === i ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.18s ease',
              }}
            />
          </button>
          {open === i && <div style={{ padding: '0 2px 12px' }}>{it.body}</div>}
        </div>
      ))}
    </div>
  );
}

function ShippingDetail({ lead, c, isDark }: { lead: LeadDetail; c: ReturnType<typeof colors>; isDark: boolean }) {
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)';
  const cardBorder = isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)';

  const score = lead.shipping_sps_fit_score;
  const scoreColor =
    typeof score === 'number' ? (score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444') : c.textMuted;

  const carriers = lead.shipping_carriers_detected ?? [];
  const countries = lead.shipping_countries ?? [];
  const pains = lead.shipping_pain_signals ?? [];
  const carrierComplaints = lead.shipping_carrier_complaints ?? [];
  const recommendedServices = lead.shipping_recommended_services ?? [];

  const hasAny =
    typeof score === 'number' ||
    carriers.length > 0 ||
    countries.length > 0 ||
    pains.length > 0 ||
    carrierComplaints.length > 0 ||
    recommendedServices.length > 0 ||
    (lead.shipping_key_facts?.length ?? 0) > 0 ||
    lead.shipping_analysis_summary ||
    lead.shipping_analysis_headline ||
    lead.shipping_analysis_detail ||
    lead.shipping_approach_angle ||
    lead.shipping_approach_headline ||
    lead.shipping_fulfillment_model ||
    lead.shipping_estimated_volume ||
    lead.shipping_logistics_complexity ||
    lead.shipping_savings_potential ||
    lead.shipping_savings_potential_summary ||
    lead.shipping_delivery_promise ||
    lead.shipping_return_policy ||
    typeof lead.shipping_data_confidence === 'number' ||
    typeof lead.shipping_has_own_warehouse === 'boolean' ||
    typeof lead.shipping_international_pct === 'number';

  if (!hasAny) {
    return (
      <div style={{ padding: '24px' }}>
        <p style={{ fontSize: 14, color: c.textMuted }}>Noch keine Shipping-Analyse vorhanden.</p>
      </div>
    );
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    color: c.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 6,
  };
  const cardStyle: React.CSSProperties = {
    background: cardBg,
    border: cardBorder,
    borderRadius: 12,
    padding: '16px 18px',
  };

  // Progressive-disclosure derivations with fallbacks for leads analysed before
  // the headline/summary/detail split — older rows only carry the long fields.
  const keyFacts = lead.shipping_key_facts ?? [];

  const analysisHeadline =
    lead.shipping_analysis_headline ?? lead.shipping_analysis_summary?.split('. ')[0]?.trim() ?? null;
  const analysisSummary = lead.shipping_analysis_headline ? (lead.shipping_analysis_summary ?? null) : null;
  const analysisDetail =
    lead.shipping_analysis_detail ??
    (lead.shipping_analysis_headline ? null : (lead.shipping_analysis_summary ?? null));

  const savingsHeadline = lead.shipping_savings_potential ?? null;
  const savingsSummary = lead.shipping_savings_potential_summary ?? null;
  const savingsDetail = lead.shipping_savings_potential_reasoning ?? null;
  const hasSavings = !!(savingsHeadline || savingsSummary || savingsDetail);

  const approachHeadline =
    lead.shipping_approach_headline ?? lead.shipping_approach_angle?.split('. ')[0]?.trim() ?? null;
  const approachDetail = lead.shipping_approach_angle ?? null;

  const confidence = lead.shipping_data_confidence;
  const confidenceColor =
    typeof confidence === 'number'
      ? confidence >= 70
        ? '#10B981'
        : confidence >= 40
          ? '#F59E0B'
          : '#EF4444'
      : c.textMuted;

  return (
    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Key-Fact pills — always-visible at-a-glance facts */}
      {keyFacts.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {keyFacts.map((fact, i) => (
            <span
              key={i}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 11px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                background: isDark ? 'rgba(186,117,23,0.15)' : 'rgba(250,238,218,0.8)',
                color: isDark ? '#FAC775' : '#633806',
              }}
            >
              {fact.label && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    opacity: 0.75,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {fact.label}
                </span>
              )}
              {fact.value}
            </span>
          ))}
        </div>
      )}

      {/* Top row: SPS-Fit Score + summary */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(180px, 220px) 1fr',
          gap: 16,
        }}
      >
        <div
          style={{
            ...cardStyle,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '20px 16px',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: c.textMuted,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            SPS-Fit Score
          </div>
          {typeof score === 'number' ? (
            <>
              <div style={{ fontSize: 56, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{score}</div>
              <div style={{ fontSize: 11, color: c.textMuted, marginTop: 4 }}>von 100</div>
            </>
          ) : (
            <div style={{ fontSize: 13, color: c.textMuted, padding: '20px 0' }}>n/a</div>
          )}
        </div>
        <div style={cardStyle}>
          <div style={labelStyle}>Reasoning</div>
          {lead.shipping_sps_fit_reasoning ? (
            <p style={{ fontSize: 13, lineHeight: 1.6, color: c.text, margin: 0, whiteSpace: 'pre-wrap' as const }}>
              {renderWithCitations(lead.shipping_sps_fit_reasoning)}
            </p>
          ) : (
            <p style={{ fontSize: 13, color: c.textMuted, margin: 0 }}>—</p>
          )}
        </div>
      </div>

      {/* Carriers + Countries */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={cardStyle}>
          <div style={labelStyle}>Carrier ({carriers.length})</div>
          {carriers.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
              {carriers.map((carrier, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '5px 11px',
                    borderRadius: 7,
                    background: 'rgba(14,165,233,0.1)',
                    border: '1px solid rgba(14,165,233,0.22)',
                    color: '#0EA5E9',
                  }}
                >
                  {carrier}
                </span>
              ))}
            </div>
          ) : (
            <span style={{ fontSize: 13, color: c.textMuted }}>—</span>
          )}
        </div>
        <div style={cardStyle}>
          <div style={labelStyle}>Länder ({countries.length})</div>
          {countries.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
              {countries.map((country, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '5px 11px',
                    borderRadius: 7,
                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.045)',
                    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                    color: c.text,
                  }}
                >
                  {country}
                </span>
              ))}
            </div>
          ) : (
            <span style={{ fontSize: 13, color: c.textMuted }}>—</span>
          )}
        </div>
      </div>

      {/* Operations grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
        }}
      >
        {[
          { label: 'Fulfillment-Modell', value: lead.shipping_fulfillment_model },
          {
            label: 'Geschätztes Volumen',
            value: lead.shipping_estimated_volume,
            hint: lead.shipping_volume_method,
          },
          { label: 'Logistik-Komplexität', value: lead.shipping_logistics_complexity },
          {
            label: 'Eigenes Lager',
            value:
              typeof lead.shipping_has_own_warehouse === 'boolean'
                ? lead.shipping_has_own_warehouse
                  ? 'Ja'
                  : 'Nein'
                : undefined,
            hint:
              typeof lead.shipping_warehouse_m2 === 'number'
                ? `${lead.shipping_warehouse_m2.toLocaleString('de-DE')} m²`
                : undefined,
          },
          {
            label: 'International',
            value:
              typeof lead.shipping_international_pct === 'number' ? `${lead.shipping_international_pct}%` : undefined,
          },
          { label: 'Tech-Integration', value: lead.shipping_tech_integration },
          {
            label: 'Gratis-Versand ab',
            value:
              typeof lead.shipping_free_threshold_eur === 'number'
                ? `${lead.shipping_free_threshold_eur.toLocaleString('de-DE')} €`
                : undefined,
          },
        ].map((kv, i) =>
          kv.value ? (
            <div key={i} style={cardStyle}>
              <div style={labelStyle}>{kv.label}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>{kv.value}</div>
              {kv.hint && <div style={{ fontSize: 11, color: c.textMuted, marginTop: 4 }}>{kv.hint}</div>}
            </div>
          ) : null
        )}
      </div>

      {/* Analyse — progressive disclosure */}
      {(analysisHeadline || analysisSummary || analysisDetail) && (
        <ShipProgressiveSection
          c={c}
          isDark={isDark}
          accent={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.16)'}
          eyebrow="Analyse"
          headline={analysisHeadline}
          summary={analysisSummary}
          detail={analysisDetail}
          moreLabel="Vollständige Analyse"
          lessLabel="Weniger"
        />
      )}

      {/* Einspar-Potenzial — progressive disclosure */}
      {hasSavings && (
        <ShipProgressiveSection
          c={c}
          isDark={isDark}
          accent="#10B981"
          eyebrow="Einspar-Potenzial"
          headlineNode={
            savingsHeadline ? (
              <div style={{ fontSize: 19, fontWeight: 800, color: '#10B981', lineHeight: 1.25 }}>
                <HighlightedText text={savingsHeadline} isDark={isDark} />
              </div>
            ) : undefined
          }
          summary={savingsSummary}
          detail={savingsDetail}
          moreLabel="Berechnung anzeigen"
          lessLabel="Weniger"
        />
      )}

      {/* Recommended SPS services — accordion */}
      {recommendedServices.length > 0 && (
        <div style={cardStyle}>
          <div style={{ ...labelStyle, color: '#10B981' }}>Empfohlene SPS-Services ({recommendedServices.length})</div>
          <ShipAccordion
            c={c}
            isDark={isDark}
            items={recommendedServices.map((rs) => {
              const summary = rs.summary ?? (rs.reason ? rs.reason.split(' ').slice(0, 6).join(' ') + '…' : '');
              return {
                header: (
                  <>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#10B981' }}>{rs.service}</span>
                    {summary && <span style={{ fontSize: 12, color: c.textMuted }}>· {summary}</span>}
                  </>
                ),
                body: rs.reason ? (
                  <div style={{ fontSize: 13, lineHeight: 1.6, color: c.textSub }}>
                    <HighlightedText text={rs.reason} isDark={isDark} />
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: c.textMuted }}>—</div>
                ),
              };
            })}
          />
        </div>
      )}

      {/* Schmerzpunkte — accordion with severity badge */}
      {pains.length > 0 && (
        <div style={cardStyle}>
          <div style={{ ...labelStyle, color: '#EF4444' }}>Schmerzpunkte ({pains.length})</div>
          <ShipAccordion
            c={c}
            isDark={isDark}
            items={pains.map((p) => {
              const sevKey = p.severity?.toLowerCase();
              const sevColor =
                sevKey === 'high'
                  ? '#EF4444'
                  : sevKey === 'medium'
                    ? '#F59E0B'
                    : sevKey === 'low'
                      ? '#0EA5E9'
                      : '#EF4444';
              const summary = p.summary ?? (p.evidence ? p.evidence.split(' ').slice(0, 6).join(' ') + '…' : '');
              const linkUrl = p.source_url ?? reviewUrlFor(p.source, lead);
              return {
                header: (
                  <>
                    {p.severity && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: 5,
                          background: sevColor + '22',
                          color: sevColor,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          flexShrink: 0,
                        }}
                      >
                        {p.severity}
                      </span>
                    )}
                    <span style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{p.signal}</span>
                    {summary && <span style={{ fontSize: 12, color: c.textMuted }}>· {summary}</span>}
                  </>
                ),
                body: (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {p.evidence && (
                      <div style={{ fontSize: 13, lineHeight: 1.6, color: c.textSub }}>
                        <HighlightedText text={p.evidence} isDark={isDark} />
                      </div>
                    )}
                    {linkUrl && (
                      <a
                        href={linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={linkUrl}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          alignSelf: 'flex-start',
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#0EA5E9',
                          background: 'rgba(14,165,233,0.1)',
                          border: '1px solid rgba(14,165,233,0.22)',
                          borderRadius: 6,
                          padding: '3px 8px',
                          textDecoration: 'none',
                          maxWidth: 360,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M14 3h7v7" />
                          <path d="M21 3l-9 9" />
                          <path d="M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6" />
                        </svg>
                        {(() => {
                          try {
                            return new URL(linkUrl).hostname.replace(/^www\./, '');
                          } catch {
                            return 'Quelle';
                          }
                        })()}
                        {p.source && !p.source_url ? ` · ${p.source}` : ''}
                      </a>
                    )}
                  </div>
                ),
              };
            })}
          />
        </div>
      )}

      {/* Carrier complaints */}
      {carrierComplaints.length > 0 && (
        <div style={cardStyle}>
          <div style={labelStyle}>Carrier-Beschwerden ({carrierComplaints.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
            {carrierComplaints.map((cc, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '9px 12px',
                  background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  borderRadius: 8,
                  border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.04)',
                }}
              >
                {cc.carrier && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 6,
                      background: 'rgba(14,165,233,0.1)',
                      color: '#0EA5E9',
                      flexShrink: 0,
                    }}
                  >
                    {cc.carrier}
                  </span>
                )}
                <div style={{ flex: 1, minWidth: 0, fontSize: 12, color: c.text, lineHeight: 1.5 }}>
                  {cc.complaint ?? '—'}
                </div>
                {cc.frequency && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: c.textMuted,
                      flexShrink: 0,
                    }}
                  >
                    {cc.frequency}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outreach-Aufhänger — progressive disclosure */}
      {(approachHeadline || approachDetail) && (
        <ShipProgressiveSection
          c={c}
          isDark={isDark}
          accent="#0EA5E9"
          eyebrow="Outreach-Aufhänger"
          headline={approachHeadline}
          detail={approachDetail}
          moreLabel="Pitch-Details"
          lessLabel="Weniger"
        />
      )}

      {/* Delivery & Returns */}
      {(lead.shipping_delivery_promise || lead.shipping_return_policy) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {lead.shipping_delivery_promise && (
            <div style={cardStyle}>
              <div style={labelStyle}>Lieferversprechen</div>
              <p style={{ fontSize: 13, lineHeight: 1.5, color: c.text, margin: 0 }}>
                {renderWithCitations(lead.shipping_delivery_promise)}
              </p>
            </div>
          )}
          {lead.shipping_return_policy && (
            <div style={cardStyle}>
              <div style={labelStyle}>Retourenpolitik</div>
              <p style={{ fontSize: 13, lineHeight: 1.5, color: c.text, margin: 0 }}>
                {renderWithCitations(lead.shipping_return_policy)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Daten-Confidence */}
      {typeof confidence === 'number' && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={labelStyle}>Daten-Confidence</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: confidenceColor }}>{confidence} / 100</span>
          </div>
          <div
            style={{
              height: 6,
              borderRadius: 99,
              overflow: 'hidden',
              background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
              marginBottom: lead.shipping_data_confidence_reasoning ? 8 : 0,
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.max(0, Math.min(100, confidence))}%`,
                background: confidenceColor,
                borderRadius: 99,
              }}
            />
          </div>
          {lead.shipping_data_confidence_reasoning && (
            <p style={{ fontSize: 12, color: c.textSub, lineHeight: 1.55, margin: 0 }}>
              <HighlightedText text={lead.shipping_data_confidence_reasoning} isDark={isDark} />
            </p>
          )}
        </div>
      )}

      {(() => {
        // Aggregate every link-evidence we have for this lead's shipping
        // analysis: inline citations across all text fields, pain-signal
        // source_urls, plus the lead's own review/maps profiles so the rep
        // can verify any claim with one click.
        const seen = new Set<string>();
        const sources: { url: string; label: string }[] = [];
        const add = (url: string | null | undefined, label?: string) => {
          if (!url) return;
          if (seen.has(url)) return;
          seen.add(url);
          let host = label;
          if (!host) {
            try {
              host = new URL(url).hostname.replace(/^www\./, '');
            } catch {
              host = 'Quelle';
            }
          }
          sources.push({ url, label: host });
        };

        for (const txt of [
          lead.shipping_sps_fit_reasoning,
          lead.shipping_analysis_summary,
          lead.shipping_analysis_detail,
          lead.shipping_approach_angle,
          lead.shipping_savings_potential_reasoning,
          lead.shipping_data_confidence_reasoning,
          lead.shipping_delivery_promise,
          lead.shipping_return_policy,
        ]) {
          extractCitationUrls(txt).forEach((u) => add(u));
        }
        for (const p of pains) {
          if (p.source_url) add(p.source_url);
        }
        // Lead-level review / map profiles — high-value verification points
        // the agent often relies on but doesn't always cite explicitly.
        add(lead.google_reviews_url, 'Google Maps');
        add(lead.trustpilot_url, 'Trustpilot');
        add(lead.kununu_url, 'Kununu');
        add(lead.provenexpert_url, 'ProvenExpert');

        if (sources.length === 0) return null;
        return (
          <div style={cardStyle}>
            <div style={labelStyle}>Quellen &amp; Belege ({sources.length})</div>
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
              {sources.map((s, i) => (
                <a
                  key={i}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={s.url}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '5px 10px',
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#0EA5E9',
                    background: 'rgba(14,165,233,0.08)',
                    border: '1px solid rgba(14,165,233,0.2)',
                    borderRadius: 7,
                    textDecoration: 'none',
                    maxWidth: 280,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap' as const,
                  }}
                >
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      background: 'rgba(14,165,233,0.18)',
                      color: '#0EA5E9',
                      fontSize: 9,
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </span>
                  {s.label}
                  <svg
                    width="9"
                    height="9"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M14 3h7v7" />
                    <path d="M21 3l-9 9" />
                    <path d="M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        );
      })()}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
        <SourceBadge label="Shipping-Agent" />
        {lead.shipping_analyzed_at && (
          <span style={{ fontSize: 11, color: c.textMuted }}>
            analysiert {new Date(lead.shipping_analyzed_at).toLocaleString('de-DE')}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Info Tab ─────────────────────────────────────────────────────────────────

function InfoTab({
  lead,
  c,
  isDark,
  onOpenDetail,
}: {
  lead: LeadDetail;
  c: ReturnType<typeof colors>;
  isDark: boolean;
  onOpenDetail: (
    view: 'website' | 'firma' | 'mitarbeiter' | 'finanzen' | 'social' | 'bewertungen' | 'shipping'
  ) => void;
}) {
  const [eventsOpen, setEventsOpen] = useState(false);

  const rawHistory: { year: number; employees: number }[] = lead._empHistory ?? [];

  const sourceMap: Record<string, string> = {
    openregister: 'Handelsregister',
    instagram: 'Instagram',
    website: 'Website',
    social: 'Social Media',
    linkedin: 'LinkedIn',
    openweb: 'OpenWeb',
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: c.textMuted,
    marginBottom: 16,
  };

  // Compact quick-view card with an expand button
  function QuickCard({
    title,
    accent,
    onExpand,
    children,
  }: {
    title: string;
    accent?: string;
    onExpand?: () => void;
    children: React.ReactNode;
  }) {
    return (
      <div
        onClick={onExpand}
        style={{
          ...glassCard(isDark),
          borderRadius: 16,
          padding: '22px 22px',
          minHeight: 200,
          ...(accent ? { borderTop: `3px solid ${accent}` } : {}),
          display: 'flex',
          flexDirection: 'column' as const,
          gap: 10,
          cursor: onExpand ? 'pointer' : 'default',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase' as const,
              color: accent ?? c.textMuted,
            }}
          >
            {title}
          </span>
          {onExpand && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: accent ?? c.textMuted,
                background: accent ? `${accent}26` : 'transparent',
                padding: '3px 9px',
                borderRadius: 99,
                letterSpacing: '0.02em',
              }}
            >
              Details →
            </span>
          )}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const }}>{children}</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 24px' }}>
      {/* ── 0. Identity header ────────────────────────────────────────────── */}
      <div
        style={{
          ...glassCard(isDark),
          borderRadius: 16,
          padding: '18px 22px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 18,
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            flexShrink: 0,
            overflow: 'hidden',
            background: lead.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            fontWeight: 800,
            color: '#fff',
            letterSpacing: '-0.02em',
            position: 'relative',
          }}
        >
          {lead.initials}
          {(lead.logo_url || lead.profile_image_url) && (
            <img
              src={lead.logo_url ?? lead.profile_image_url}
              alt={lead.name}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
        </div>

        {/* Company info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: c.text, marginBottom: 3, letterSpacing: '-0.01em' }}>
            {lead.name}
          </div>
          <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 6 }}>
            {[lead.city, lead.industry].filter(Boolean).join(' · ')}
          </div>
          {lead.lead_summary && (
            <div style={{ fontSize: 13, color: c.textSub, lineHeight: 1.4 }}>
              {lead.lead_summary.slice(0, 80)}
              {lead.lead_summary.length > 80 ? '…' : ''}
            </div>
          )}
        </div>

        {/* Fit score */}
        {lead.fit > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 32, fontWeight: 900, color: '#10B981', lineHeight: 1, letterSpacing: '-0.03em' }}>
              {lead.fit}
            </span>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', color: '#10B981', marginTop: 2 }}>
              FIT
            </span>
          </div>
        )}

        {/* Status pill */}
        <div style={{ flexShrink: 0 }}>
          {(() => {
            const statusColor = lead.status === 'hot' ? '#EF4444' : lead.status === 'warm' ? '#F97316' : '#94A3B8';
            const statusLabel = lead.status === 'hot' ? 'Hot' : lead.status === 'warm' ? 'Warm' : 'Kalt';
            return (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  borderRadius: 99,
                  background: `${statusColor}18`,
                  border: `1px solid ${statusColor}40`,
                }}
              >
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: statusColor }}>{statusLabel}</span>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ── 1. KI-Zusammenfassung ─────────────────────────────────────────── */}
      {lead.scoreReason || lead.lead_summary ? (
        <div
          style={{
            ...glassCard(isDark),
            borderRadius: 16,
            padding: '20px 24px',
            marginBottom: 16,
            borderLeft: '3px solid #818CF8',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
                color: '#818CF8',
              }}
            >
              KI-Zusammenfassung
            </span>
            <SourceBadge label="KI-Analyse" />
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: c.text, margin: 0 }}>
            {lead.lead_summary || lead.scoreReason}
          </p>
        </div>
      ) : null}

      {/* ── 1b. Web-Signale ───────────────────────────────────────────────── */}
      {lead.web_buying_signals?.length || lead.web_outreach_hooks?.length || lead.web_recent_news?.length ? (
        <div
          style={{
            ...glassCard(isDark),
            borderRadius: 16,
            padding: '20px 24px',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase' as const,
              color: '#0EA5E9',
              marginBottom: 14,
            }}
          >
            Web-Signale
          </div>

          {/* Buying signals */}
          {!!lead.web_buying_signals?.length && (
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: c.textMuted,
                  marginBottom: 6,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.06em',
                }}
              >
                Kaufsignale
              </div>
              {lead.web_buying_signals.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      flexShrink: 0,
                      marginTop: 4,
                      background: s.priority === 'high' ? '#EF4444' : s.priority === 'medium' ? '#F97316' : '#10B981',
                    }}
                  />
                  <div>
                    <div style={{ fontSize: 13, color: c.text, fontWeight: 600 }}>{s.signal}</div>
                    {s.evidence && <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>{s.evidence}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Outreach hooks */}
          {!!lead.web_outreach_hooks?.length && (
            <div>
              {!!lead.web_buying_signals?.length && (
                <div
                  style={{
                    height: 1,
                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                    margin: '12px 0',
                  }}
                />
              )}
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: c.textMuted,
                  marginBottom: 6,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.06em',
                }}
              >
                Outreach-Hooks
              </div>
              {lead.web_outreach_hooks.map((h, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: c.text, marginBottom: 3 }}>{h.hook}</div>
                  {h.suggested_opener && (
                    <div style={{ fontSize: 11, color: c.textMuted, fontStyle: 'italic' as const, lineHeight: 1.5 }}>
                      &bdquo;{h.suggested_opener}&ldquo;
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Recent news */}
          {!!lead.web_recent_news?.length && (
            <div>
              {(!!lead.web_buying_signals?.length || !!lead.web_outreach_hooks?.length) && (
                <div
                  style={{
                    height: 1,
                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                    margin: '12px 0',
                  }}
                />
              )}
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: c.textMuted,
                  marginBottom: 6,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.06em',
                }}
              >
                Aktuelle News
              </div>
              {lead.web_recent_news.map((n, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <div style={{ fontSize: 12, color: c.text, flex: 1, lineHeight: 1.4 }}>{n.headline}</div>
                  {n.date_approx && (
                    <div style={{ fontSize: 10, color: c.textMuted, flexShrink: 0 }}>{n.date_approx}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* ── 2. Compact quick-view cards ───────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
        {/* Website-Analyse */}
        <QuickCard title="Website-Analyse" accent="#14B8A6" onExpand={() => onOpenDetail('website')}>
          {(() => {
            const ACCENT = '#14B8A6';
            const hasWeb = !!(
              lead.web_analyzed_at ||
              lead.web_analysis_summary ||
              lead.web_company_pitch ||
              lead.web_value_proposition ||
              lead.web_core_services?.length ||
              lead.web_tech_stack?.length ||
              lead.web_buying_signals?.length ||
              lead.web_opportunity_flags?.length ||
              lead.web_risk_flags?.length
            );
            if (!hasWeb) return <div style={{ fontSize: 13, color: c.textMuted }}>Keine Website-Analyse</div>;

            const confidencePct =
              lead.web_data_confidence != null
                ? Math.round(lead.web_data_confidence <= 1 ? lead.web_data_confidence * 100 : lead.web_data_confidence)
                : null;
            const headline = lead.web_value_proposition || lead.web_company_pitch || lead.web_analysis_summary;
            const badge = (text: string) => (
              <span
                key={text}
                style={{
                  fontSize: 10,
                  padding: '2px 7px',
                  borderRadius: 5,
                  background: 'rgba(20,184,166,0.12)',
                  border: '1px solid rgba(20,184,166,0.28)',
                  color: ACCENT,
                }}
              >
                {text}
              </span>
            );
            const sigCount = lead.web_buying_signals?.length ?? 0;
            const oppCount = lead.web_opportunity_flags?.length ?? 0;
            const riskCount = lead.web_risk_flags?.length ?? 0;

            return (
              <>
                {headline && (
                  <div
                    style={{
                      fontSize: 13,
                      color: c.text,
                      fontWeight: 600,
                      lineHeight: 1.45,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical' as const,
                      overflow: 'hidden',
                      marginBottom: 10,
                    }}
                  >
                    {headline}
                  </div>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4, marginBottom: 10 }}>
                  {lead.web_has_shop && badge('Shop')}
                  {!!lead.web_tech_stack?.length && badge(lead.web_tech_stack[0])}
                  {lead.web_page_count != null && badge(`${lead.web_page_count} Seiten`)}
                  {confidencePct != null && badge(`Konfidenz ${confidencePct}%`)}
                </div>

                {!!lead.web_core_services?.length && (
                  <div
                    style={{
                      fontSize: 11,
                      color: c.textSub,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap' as const,
                      marginBottom: 10,
                    }}
                  >
                    {lead.web_core_services.slice(0, 3).join(' · ')}
                  </div>
                )}

                {(sigCount > 0 || oppCount > 0 || riskCount > 0) && (
                  <div style={{ display: 'flex', gap: 12, marginTop: 'auto', fontSize: 11 }}>
                    {sigCount > 0 && (
                      <span style={{ color: c.textMuted }}>
                        <span style={{ color: ACCENT, fontWeight: 800 }}>{sigCount}</span> Signale
                      </span>
                    )}
                    {oppCount > 0 && (
                      <span style={{ color: c.textMuted }}>
                        <span style={{ color: '#10B981', fontWeight: 800 }}>{oppCount}</span> Chancen
                      </span>
                    )}
                    {riskCount > 0 && (
                      <span style={{ color: c.textMuted }}>
                        <span style={{ color: '#EF4444', fontWeight: 800 }}>{riskCount}</span> Risiken
                      </span>
                    )}
                  </div>
                )}
              </>
            );
          })()}
        </QuickCard>

        {/* Führung */}
        <QuickCard title="Führung" accent="#0EA5E9" onExpand={() => onOpenDetail('mitarbeiter')}>
          {(() => {
            const stbScore = lead.mgmt_stability_score;
            const stbColor =
              stbScore != null ? (stbScore >= 65 ? '#10B981' : stbScore >= 40 ? '#F97316' : '#EF4444') : '#0EA5E9';
            const stbLabel = deLabel(lead.mgmt_stability_label);
            const tenureYears =
              lead.mgmt_avg_tenure_months != null
                ? lead.mgmt_avg_tenure_months >= 12
                  ? `Ø ${Math.round(lead.mgmt_avg_tenure_months / 12)} J. Amtszeit`
                  : `Ø ${lead.mgmt_avg_tenure_months} Mo. Amtszeit`
                : null;
            const changeLabel: Record<string, string> = {
              replacement: 'Neubesetzung',
              expansion: 'Erweiterung',
              resignation: 'Rücktritt',
              retirement: 'Ruhestand',
            };
            return (
              <>
                {/* Score */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 44, fontWeight: 900, color: stbColor, lineHeight: 1 }}>
                    {stbScore ?? lead.employees ?? '—'}
                  </span>
                  {stbScore != null && <span style={{ fontSize: 13, color: c.textMuted, marginBottom: 7 }}>/100</span>}
                </div>
                <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 8 }}>
                  {stbScore != null ? 'Führungsstabilität' : 'Mitarbeiter'}
                </div>

                {/* Stability badge */}
                {stbLabel && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: stbColor,
                      background: `${stbColor}18`,
                      borderRadius: 99,
                      padding: '3px 10px',
                      marginBottom: 12,
                      display: 'inline-block',
                    }}
                  >
                    {stbLabel}
                  </span>
                )}

                {/* Separator */}
                <div
                  style={{
                    height: 1,
                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                    margin: '6px 0 10px',
                  }}
                />

                {/* Detail rows */}
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 7, flex: 1 }}>
                  {lead.mgmt_current_director_count != null && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: c.text }}>
                        {lead.mgmt_current_director_count}{' '}
                        {lead.mgmt_current_director_count === 1 ? 'Geschäftsführer' : 'Geschäftsführer'}
                      </span>
                      {lead.mgmt_has_prokura != null && (
                        <span style={{ fontSize: 10, color: lead.mgmt_has_prokura ? '#10B981' : c.textMuted }}>
                          {lead.mgmt_has_prokura ? 'Mit Prokura' : 'Ohne Prokura'}
                        </span>
                      )}
                    </div>
                  )}
                  {tenureYears && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: c.text }}>{tenureYears}</span>
                      {lead.mgmt_is_founder_led && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: '#818CF8',
                            background: '#818CF818',
                            borderRadius: 99,
                            padding: '2px 8px',
                          }}
                        >
                          Gründergeführt
                        </span>
                      )}
                    </div>
                  )}
                  {lead.mgmt_total_changes != null && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: c.text }}>{lead.mgmt_total_changes} Führungswechsel</span>
                      {lead.mgmt_last_change_type && (
                        <span style={{ fontSize: 10, color: c.textMuted }}>
                          {changeLabel[lead.mgmt_last_change_type] ?? lead.mgmt_last_change_type}
                        </span>
                      )}
                    </div>
                  )}
                  {rawHistory.length > 1 && (
                    <div style={{ marginTop: 4 }}>
                      <EmployeeAreaChart history={rawHistory} isDark={isDark} />
                    </div>
                  )}
                  {lead.web_open_positions_count != null && lead.web_open_positions_count > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: c.text }}>
                        {lead.web_open_positions_count} offene Stellen
                      </span>
                      {lead.web_has_careers_page && (
                        <span style={{ fontSize: 10, color: '#10B981' }}>Karriereseite</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom: employee badge */}
                {lead.employees && stbScore != null && (
                  <div style={{ marginTop: 'auto', paddingTop: 10 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: '#0EA5E9',
                        background: '#0EA5E918',
                        borderRadius: 99,
                        padding: '3px 10px',
                      }}
                    >
                      {lead.employees} Mitarbeiter
                    </span>
                  </div>
                )}
              </>
            );
          })()}
        </QuickCard>

        {/* Finanzen */}
        <QuickCard title="Finanzen" accent="#F97316" onExpand={() => onOpenDetail('finanzen')}>
          {(() => {
            const score = lead.fin_health_score;
            const hasScore = score != null;
            const healthLabel =
              deLabel(lead.fin_health_label) ??
              (!hasScore
                ? null
                : score >= 80
                  ? 'Stark'
                  : score >= 65
                    ? 'Gut'
                    : score >= 50
                      ? 'Solide'
                      : score >= 35
                        ? 'Mittel'
                        : score >= 20
                          ? 'Schwach'
                          : 'Kritisch');
            const labelColor = !hasScore
              ? c.textMuted
              : score! >= 65
                ? '#10B981'
                : score! >= 40
                  ? '#F97316'
                  : '#EF4444';
            const SEGS = [
              '#EF4444',
              '#F97316',
              '#FB923C',
              '#FBBF24',
              '#FDE047',
              '#A3E635',
              '#4ADE80',
              '#22C55E',
              '#16A34A',
            ];
            const trendIcon = (t?: string) =>
              t === 'growing' || t === 'stable' ? '↑' : t === 'declining' || t === 'critical' ? '↓' : null;
            const trendColor = (t?: string) =>
              t === 'growing' || t === 'stable'
                ? '#10B981'
                : t === 'declining' || t === 'critical'
                  ? '#EF4444'
                  : '#94A3B8';
            return (
              <>
                <div style={{ fontSize: 30, fontWeight: 900, color: labelColor, lineHeight: 1, marginBottom: 4 }}>
                  {healthLabel ?? '—'}
                </div>
                {hasScore && <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 12 }}>{score}/100</div>}
                {/* Spectrum */}
                <div style={{ position: 'relative', marginBottom: 5 }}>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {SEGS.map((segColor, i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: 10,
                          borderRadius: 99,
                          background: segColor,
                          opacity: hasScore ? 1 : 0.2,
                        }}
                      />
                    ))}
                  </div>
                  {hasScore && (
                    <div
                      style={{
                        position: 'absolute',
                        top: -3,
                        left: `calc(${Math.min(97, Math.max(3, score!))}% - 1px)`,
                        width: 2,
                        height: 16,
                        background: isDark ? '#fff' : '#111',
                        borderRadius: 1,
                      }}
                    />
                  )}
                </div>
                {/* Scale labels */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 9,
                    color: c.textMuted,
                    marginBottom: 10,
                    letterSpacing: '0.02em',
                  }}
                >
                  <span>Kritisch</span>
                  <span>Mittel</span>
                  <span>Stark</span>
                </div>
                {/* Trend badges */}
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const, marginBottom: 12 }}>
                  {[
                    { trend: lead.fin_balance_sheet_trend, label: 'Bilanz' },
                    { trend: lead.fin_equity_trend, label: 'Kapital' },
                    { trend: lead.fin_revenue_trend, label: 'Umsatz' },
                  ]
                    .filter((t) => t.trend && t.trend !== 'unknown' && trendIcon(t.trend))
                    .map(({ trend, label: lbl }) => (
                      <span
                        key={lbl}
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: trendColor(trend),
                          background: `${trendColor(trend)}18`,
                          borderRadius: 99,
                          padding: '2px 7px',
                        }}
                      >
                        {trendIcon(trend)} {lbl}
                      </span>
                    ))}
                </div>

                {/* Separator */}
                <div
                  style={{
                    height: 1,
                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                    marginBottom: 10,
                  }}
                />

                {/* Estimated revenue */}
                {lead.fin_estimated_revenue_eur != null && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ fontSize: 11, color: c.textMuted }}>Umsatzschätzung</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#F97316' }}>
                      {lead.fin_estimated_revenue_eur >= 1_000_000
                        ? `~${(lead.fin_estimated_revenue_eur / 1_000_000).toFixed(1)}M €`
                        : `~${Math.round(lead.fin_estimated_revenue_eur / 1000)}k €`}
                    </span>
                  </div>
                )}

                {/* AI summary excerpt */}
                {lead.fin_analysis_summary && (
                  <p
                    style={{
                      fontSize: 11,
                      color: c.textSub,
                      lineHeight: 1.55,
                      margin: 0,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical' as const,
                      overflow: 'hidden',
                    }}
                  >
                    {lead.fin_analysis_summary}
                  </p>
                )}
              </>
            );
          })()}
        </QuickCard>
      </div>

      {/* ── 3. Signale ────────────────────────────────────────────────────── */}
      {(lead.greenflags.length > 0 || lead.redflags.length > 0) && (
        <div style={{ ...glassCard(isDark), borderRadius: 16, padding: '20px 24px', marginBottom: 16 }}>
          {lead.greenflags.length > 0 && (
            <div style={{ marginBottom: lead.redflags.length > 0 ? 20 : 0 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#10B981',
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.08em',
                  marginBottom: 12,
                }}
              >
                Positive Signale
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
                {lead.greenflags.map((flag, i) => {
                  const raw = lead._rawGreenFlags?.[i];
                  return (
                    <div
                      key={i}
                      title={raw?.source ? (sourceMap[raw.source] ?? raw.source) : undefined}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '7px 13px',
                        borderRadius: 999,
                        background: isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.08)',
                        border: '1px solid rgba(16,185,129,0.25)',
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#10B981',
                        lineHeight: 1.3,
                      }}
                    >
                      <span style={{ fontSize: 11, opacity: 0.85 }}>&#10003;</span>
                      {flag}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {lead.redflags.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#EF4444',
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.08em',
                  marginBottom: 12,
                }}
              >
                Risiken
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
                {lead.redflags.map((flag, i) => {
                  const raw = lead._rawRedFlags?.[i];
                  const sevColor =
                    raw?.severity === 'high' ? '#EF4444' : raw?.severity === 'medium' ? '#F97316' : '#94A3B8';
                  return (
                    <div
                      key={i}
                      title={raw?.source ? (sourceMap[raw.source] ?? raw.source) : undefined}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '7px 13px',
                        borderRadius: 999,
                        background: isDark ? sevColor + '14' : sevColor + '10',
                        border: `1px solid ${sevColor}35`,
                        fontSize: 13,
                        fontWeight: 600,
                        color: sevColor,
                        lineHeight: 1.3,
                      }}
                    >
                      <span style={{ fontSize: 11, opacity: 0.85 }}>&#10007;</span>
                      {flag}
                      {raw?.severity && raw.severity !== 'low' && (
                        <span style={{ fontSize: 10, fontWeight: 800, opacity: 0.75, marginLeft: 2 }}>
                          {raw.severity === 'high' ? '!' : '·'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 4. Aktuelle Ereignisse ────────────────────────────────────────── */}
      {lead.aiUpdateSummary && (
        <div style={{ ...glassCard(isDark), borderRadius: 16, padding: '20px 24px', marginBottom: 16 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}
          >
            <div style={sectionTitle}>Aktuelle Ereignisse</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <SourceBadge label="KI-Analyse" />
              <button
                onClick={() => setEventsOpen((v) => !v)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#818CF8',
                  fontFamily: 'inherit',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ChevronDown
                  size={16}
                  style={{
                    transform: eventsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                />
              </button>
            </div>
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: c.text, margin: 0 }}>
            {eventsOpen
              ? lead.aiUpdateSummary
              : lead.aiUpdateSummary.slice(0, 160) + (lead.aiUpdateSummary.length > 160 ? '…' : '')}
          </p>
          {lead.updatesList.length > 0 && (
            <Expandable open={eventsOpen}>
              <div
                style={{
                  marginTop: 16,
                  display: 'flex',
                  flexDirection: 'column' as const,
                  gap: 8,
                }}
              >
                {lead.updatesList.map((u, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: 10,
                      padding: '10px 14px',
                      background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                      borderRadius: 10,
                    }}
                  >
                    <span style={{ color: '#10B981', fontSize: 14, flexShrink: 0 }}>&#8594;</span>
                    <span style={{ fontSize: 14, color: c.text, lineHeight: 1.5 }}>{u.text}</span>
                  </div>
                ))}
              </div>
            </Expandable>
          )}
        </div>
      )}

      {/* ── 5. Online-Präsenz — compact expand cards ──────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
        {/* Social Media */}
        <QuickCard title="Social Media" accent="#E1306C" onExpand={() => onOpenDetail('social')}>
          {(() => {
            const socialScore = lead.social_health_score ?? null;
            const hasSocial =
              socialScore != null ||
              lead.instagramFollowers != null ||
              lead.facebookFollowers != null ||
              lead.social_total_followers != null ||
              lead.li_followers != null;
            if (!hasSocial) return <div style={{ fontSize: 13, color: c.textMuted }}>Keine Social-Daten</div>;
            const socialLabel =
              deLabel(lead.social_health_label) ??
              (socialScore == null
                ? null
                : socialScore >= 80
                  ? 'Sehr Aktiv'
                  : socialScore >= 65
                    ? 'Aktiv'
                    : socialScore >= 50
                      ? 'Solide'
                      : socialScore >= 35
                        ? 'Mittel'
                        : socialScore >= 20
                          ? 'Schwach'
                          : 'Inaktiv');
            const socialColor =
              socialScore == null
                ? c.textMuted
                : socialScore >= 65
                  ? '#10B981'
                  : socialScore >= 40
                    ? '#F97316'
                    : '#EF4444';
            const SOCIAL_SEGS = ['#EF4444', '#F97316', '#FB923C', '#FBBF24', '#A3E635', '#10B981'];
            const totalFollowers =
              lead.social_total_followers ?? lead.instagramFollowers ?? lead.facebookFollowers ?? null;
            return (
              <>
                <div style={{ fontSize: 28, fontWeight: 900, color: socialColor, lineHeight: 1, marginBottom: 4 }}>
                  {socialLabel ?? '—'}
                </div>
                {totalFollowers != null && (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 10 }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: c.text }}>
                      {totalFollowers >= 1000
                        ? `${(totalFollowers / 1000).toFixed(totalFollowers >= 10000 ? 0 : 1)}k`
                        : totalFollowers.toLocaleString('de-DE')}
                    </span>
                    <span style={{ fontSize: 10, color: c.textMuted }}>Follower</span>
                  </div>
                )}
                <div style={{ position: 'relative', marginBottom: 4 }}>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {SOCIAL_SEGS.map((col, i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: 8,
                          borderRadius: 99,
                          background: col,
                          opacity: socialScore != null ? 1 : 0.2,
                        }}
                      />
                    ))}
                  </div>
                  {socialScore != null && (
                    <div
                      style={{
                        position: 'absolute',
                        top: -3,
                        left: `calc(${Math.min(97, Math.max(3, socialScore))}% - 1px)`,
                        width: 2,
                        height: 14,
                        background: isDark ? '#fff' : '#111',
                        borderRadius: 1,
                      }}
                    />
                  )}
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 9,
                    color: c.textMuted,
                    marginBottom: 10,
                  }}
                >
                  <span>Inaktiv</span>
                  <span>Sehr Aktiv</span>
                </div>
                {/* Platform badges */}
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5, marginTop: 'auto' }}>
                  {lead.instagramFollowers != null && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 99,
                        background: 'rgba(225,48,108,0.12)',
                        border: '1px solid rgba(225,48,108,0.25)',
                        color: '#E1306C',
                      }}
                    >
                      Instagram
                    </span>
                  )}
                  {lead.facebookFollowers != null && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 99,
                        background: 'rgba(24,119,242,0.12)',
                        border: '1px solid rgba(24,119,242,0.25)',
                        color: '#1877F2',
                      }}
                    >
                      Facebook
                    </span>
                  )}
                  {lead.li_followers != null && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 99,
                        background: 'rgba(0,119,181,0.12)',
                        border: '1px solid rgba(0,119,181,0.25)',
                        color: '#0077B5',
                      }}
                    >
                      LinkedIn
                    </span>
                  )}
                </div>
              </>
            );
          })()}
        </QuickCard>

        {/* Bewertungen */}
        <QuickCard title="Bewertungen" accent="#F59E0B" onExpand={() => onOpenDetail('bewertungen')}>
          {(() => {
            const overallScore = lead.reviews_overall_score ?? lead.google ?? lead.trustpilot ?? null;
            if (overallScore == null) return <div style={{ fontSize: 13, color: c.textMuted }}>Keine Bewertungen</div>;
            const scoreColor = overallScore >= 4 ? '#10B981' : overallScore >= 3 ? '#F97316' : '#EF4444';
            const fullStars = Math.floor(overallScore);
            return (
              <>
                <div style={{ fontSize: 40, fontWeight: 900, color: scoreColor, lineHeight: 1, marginBottom: 4 }}>
                  {overallScore.toFixed(1)}
                </div>
                {/* Stars */}
                <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} style={{ fontSize: 14, color: s <= fullStars ? '#F59E0B' : c.textMuted }}>
                      &#9733;
                    </span>
                  ))}
                </div>
                {/* Platform rows */}
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 5, marginTop: 'auto' }}>
                  {lead.google != null && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: 12,
                        color: c.textSub,
                      }}
                    >
                      <span>Google</span>
                      <span
                        style={{
                          fontWeight: 700,
                          color: lead.google >= 4 ? '#10B981' : lead.google >= 3 ? '#F97316' : '#EF4444',
                        }}
                      >
                        {lead.google.toFixed(1)} &#9733;
                      </span>
                    </div>
                  )}
                  {lead.trustpilot != null && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: 12,
                        color: c.textSub,
                      }}
                    >
                      <span>Trustpilot</span>
                      <span
                        style={{
                          fontWeight: 700,
                          color: lead.trustpilot >= 4 ? '#10B981' : lead.trustpilot >= 3 ? '#F97316' : '#EF4444',
                        }}
                      >
                        {lead.trustpilot.toFixed(1)} &#9733;
                      </span>
                    </div>
                  )}
                  {lead.reviews_kununu_rating != null && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: 12,
                        color: c.textSub,
                      }}
                    >
                      <span>Kununu</span>
                      <span
                        style={{
                          fontWeight: 700,
                          color:
                            lead.reviews_kununu_rating >= 4
                              ? '#10B981'
                              : lead.reviews_kununu_rating >= 3
                                ? '#F97316'
                                : '#EF4444',
                        }}
                      >
                        {lead.reviews_kununu_rating.toFixed(1)} &#9733;
                      </span>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </QuickCard>

        {/* Shipping */}
        <QuickCard title="Shipping" accent="#0EA5E9" onExpand={() => onOpenDetail('shipping')}>
          {(() => {
            const hasAnalysis =
              typeof lead.shipping_sps_fit_score === 'number' ||
              (lead.shipping_carriers_detected && lead.shipping_carriers_detected.length > 0) ||
              lead.shipping_estimated_volume ||
              lead.shipping_fulfillment_model;
            if (!hasAnalysis) {
              return <div style={{ fontSize: 13, color: c.textMuted }}>Noch nicht analysiert</div>;
            }
            const score = lead.shipping_sps_fit_score;
            const carriers = lead.shipping_carriers_detected ?? [];
            const painCount = lead.shipping_pain_signals?.length ?? 0;
            const scoreColor =
              typeof score === 'number' ? (score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444') : '#0EA5E9';
            return (
              <>
                {typeof score === 'number' ? (
                  <>
                    <div
                      style={{
                        fontSize: 36,
                        fontWeight: 900,
                        color: scoreColor,
                        lineHeight: 1,
                        marginBottom: 4,
                      }}
                    >
                      {score}
                    </div>
                    <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 12 }}>SPS-Fit Score</div>
                  </>
                ) : (
                  <div style={{ marginBottom: 12 }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#0EA5E9',
                        background: 'rgba(14,165,233,0.1)',
                        border: '1px solid rgba(14,165,233,0.2)',
                        padding: '3px 9px',
                        borderRadius: 99,
                      }}
                    >
                      Analyse läuft
                    </span>
                  </div>
                )}

                {carriers.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5, marginBottom: 8 }}>
                    {carriers.slice(0, 4).map((carrier, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '4px 10px',
                          borderRadius: 6,
                          background: 'rgba(14,165,233,0.1)',
                          border: '1px solid rgba(14,165,233,0.2)',
                          color: '#0EA5E9',
                        }}
                      >
                        {carrier}
                      </span>
                    ))}
                    {carriers.length > 4 && (
                      <span style={{ fontSize: 11, color: c.textMuted, alignSelf: 'center' }}>
                        +{carriers.length - 4}
                      </span>
                    )}
                  </div>
                )}

                {lead.shipping_estimated_volume && (
                  <div
                    style={{
                      fontSize: 11,
                      color: c.textSub,
                      marginBottom: lead.shipping_fulfillment_model || painCount > 0 ? 4 : 0,
                    }}
                  >
                    <strong style={{ color: c.text }}>{lead.shipping_estimated_volume}</strong>
                  </div>
                )}
                {lead.shipping_fulfillment_model && (
                  <div style={{ fontSize: 11, color: c.textMuted, marginBottom: painCount > 0 ? 4 : 0 }}>
                    {lead.shipping_fulfillment_model}
                  </div>
                )}

                {painCount > 0 && (
                  <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: 10,
                        fontWeight: 700,
                        color: '#EF4444',
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        borderRadius: 99,
                        padding: '2px 8px',
                      }}
                    >
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#EF4444' }} />
                      {painCount} {painCount === 1 ? 'Painpoint' : 'Painpoints'}
                    </span>
                  </div>
                )}
              </>
            );
          })()}
        </QuickCard>
      </div>
    </div>
  );
}

// ─── Outbound Tab ─────────────────────────────────────────────────────────────

function ApolloLoader({ isDark, c }: { isDark: boolean; c: ReturnType<typeof colors> }) {
  const messages = [
    'Apollo wird kontaktiert…',
    'Unternehmen wird identifiziert…',
    'Profile werden abgerufen…',
    'Treffer werden gefiltert…',
    'Ergebnisse werden aufbereitet…',
  ];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % messages.length), 1800);
    return () => clearInterval(t);
  }, [messages.length]);

  const skelBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            border: `2px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'}`,
            borderTopColor: c.accent,
            boxSizing: 'border-box',
            flexShrink: 0,
          }}
        />
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            style={{ fontSize: 13, fontWeight: 700, color: c.text }}
          >
            {messages[idx]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Sliding scan bar */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 4,
          borderRadius: 2,
          background: skelBg,
          overflow: 'hidden',
        }}
      >
        <motion.div
          initial={{ x: '-40%' }}
          animate={{ x: '240%' }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: '40%',
            background: `linear-gradient(90deg, transparent, ${c.accent}, transparent)`,
            borderRadius: 2,
          }}
        />
      </div>

      {/* Skeleton person rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              borderRadius: 10,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
            }}
          >
            <motion.div
              animate={{ opacity: [0.45, 0.9, 0.45] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.18 }}
              style={{ width: 14, height: 14, borderRadius: '50%', background: skelBg, flexShrink: 0 }}
            />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <motion.div
                animate={{ opacity: [0.45, 0.9, 0.45] }}
                transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.18 }}
                style={{ width: `${52 + i * 8}%`, height: 10, borderRadius: 4, background: skelBg }}
              />
              <motion.div
                animate={{ opacity: [0.45, 0.9, 0.45] }}
                transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.18 + 0.15 }}
                style={{ width: `${28 + i * 7}%`, height: 8, borderRadius: 4, background: skelBg }}
              />
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, color: c.textMuted, textAlign: 'center' }}>
        Das kann einen Moment dauern — Apollo liefert in der Regel innerhalb von 30 Sekunden.
      </div>
    </div>
  );
}

function GenerateDone({ c }: { c: ReturnType<typeof colors> }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '12px 0 6px' }}>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 18 }}
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: '#10B98122',
          border: '2px solid #10B981',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <motion.svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <motion.path
            d="M5 12.5L10 17L19 7.5"
            stroke="#10B981"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.35, delay: 0.15, ease: 'easeOut' }}
          />
        </motion.svg>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.25 }}
        style={{ fontSize: 13, fontWeight: 700, color: c.text }}
      >
        Fertig — Kontakt gespeichert
      </motion.div>
    </div>
  );
}

function GenerateLoader({ isDark, c }: { isDark: boolean; c: ReturnType<typeof colors> }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 500);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 2px' }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          border: `2px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'}`,
          borderTopColor: c.accent,
          boxSizing: 'border-box',
          flexShrink: 0,
        }}
      />
      <div style={{ fontSize: 12, color: c.textMuted }}>
        Wird generiert… <span style={{ opacity: 0.6 }}>({elapsed}s, kann bis zu 2 Min. dauern)</span>
      </div>
    </div>
  );
}

type ProfileOption = { id: string; label: string };

function OutboundTab({
  lead,
  c,
  isDark,
  onLeadRefresh,
}: {
  lead: LeadDetail;
  c: ReturnType<typeof colors>;
  isDark: boolean;
  onLeadRefresh?: () => void | Promise<void>;
}) {
  // Apollo people loader (below Ansprechpartner list)
  const [apolloOpen, setApolloOpen] = useState(false);
  const [apolloLoading, setApolloLoading] = useState(false);
  const [apolloError, setApolloError] = useState<string | null>(null);
  const [apolloPersons, setApolloPersons] = useState<ApolloPerson[] | null>(null);
  const [apolloSelectedId, setApolloSelectedId] = useState<string | null>(null);

  // Generate options
  const [absenderProfiles, setAbsenderProfiles] = useState<ProfileOption[]>([]);
  const [angebotsProfiles, setAngebotsProfiles] = useState<ProfileOption[]>([]);
  const [absenderProfilId, setAbsenderProfilId] = useState<string>('');
  const [angebotsProfilId, setAngebotsProfilId] = useState<string>('');
  const [getEmail, setGetEmail] = useState(true);
  const [getTelephone, setGetTelephone] = useState(false);
  const [generateEmail, setGenerateEmail] = useState(true);

  // Outbound-generate state
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [genSuccess, setGenSuccess] = useState<string | null>(null);
  const [genDone, setGenDone] = useState(false);

  // Inline email-draft expander (one open at a time)
  const [expandedDraftIdx, setExpandedDraftIdx] = useState<number | null>(null);

  // Apollo IDs already enriched for this lead — those rows are shown disabled.
  const usedApolloIds = new Set(lead.contacts.map((c) => c.apolloPersonId).filter((v): v is string => Boolean(v)));

  // Search filter
  const [apolloSearch, setApolloSearch] = useState('');
  const filteredApolloPersons =
    apolloPersons?.filter((p) => {
      const q = apolloSearch.trim().toLowerCase();
      if (!q) return true;
      const haystack = [p.first_name, p.last_name_obfuscated, p.title].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    }) ?? null;

  async function loadApolloPersons() {
    setApolloOpen(true);
    if (apolloPersons || apolloLoading) return;
    setApolloLoading(true);
    setApolloError(null);
    try {
      const res = await fetch('/api/generate/apollo-people', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ lead_id: lead.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setApolloError(typeof data?.error === 'string' ? data.error : 'Anfrage fehlgeschlagen');
        return;
      }
      const persons = Array.isArray(data?.persons) ? (data.persons as ApolloPerson[]) : [];
      setApolloPersons(persons);
    } catch (err) {
      setApolloError(err instanceof Error ? err.message : 'Netzwerkfehler');
    } finally {
      setApolloLoading(false);
    }
  }

  // Lock body scroll + Escape to close while the modal is open.
  useEffect(() => {
    if (!apolloOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setApolloOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [apolloOpen]);

  // Load Absender + Angebots profiles the first time the popup opens.
  useEffect(() => {
    if (!apolloOpen) return;
    if (absenderProfiles.length || angebotsProfiles.length) return;
    type AbsenderRow = {
      id: string;
      profile_name?: string | null;
      sender_first_name?: string | null;
      sender_last_name?: string | null;
    };
    type AngebotsRow = { id: string; name?: string | null };
    void Promise.all([
      fetch('/api/absender-profile')
        .then((r) => (r.ok ? r.json() : { profiles: [] }))
        .catch(() => ({ profiles: [] })),
      fetch('/api/angebots-profile')
        .then((r) => (r.ok ? r.json() : { profiles: [] }))
        .catch(() => ({ profiles: [] })),
    ]).then(([a, b]: [{ profiles?: AbsenderRow[] }, { profiles?: AngebotsRow[] }]) => {
      const ab: ProfileOption[] = (a.profiles ?? []).map((p) => ({
        id: p.id,
        label:
          p.profile_name || [p.sender_first_name, p.sender_last_name].filter(Boolean).join(' ') || 'Absender-Profil',
      }));
      const an: ProfileOption[] = (b.profiles ?? []).map((p) => ({
        id: p.id,
        label: p.name || 'Angebots-Profil',
      }));
      setAbsenderProfiles(ab);
      setAngebotsProfiles(an);
      if (ab.length && !absenderProfilId) setAbsenderProfilId(ab[0].id);
      if (an.length && !angebotsProfilId) setAngebotsProfilId(an[0].id);
    });
  }, [apolloOpen, absenderProfiles.length, angebotsProfiles.length, absenderProfilId, angebotsProfilId]);

  async function generateOutbound() {
    if (!apolloSelectedId || genLoading) return;
    if (usedApolloIds.has(apolloSelectedId)) {
      setGenError('Diese Person wurde bereits zu diesem Lead hinzugefügt.');
      return;
    }
    setGenLoading(true);
    setGenError(null);
    setGenSuccess(null);
    try {
      const res = await fetch('/api/generate/person-enrich', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          lead_id: lead.id,
          apollo_person_id: apolloSelectedId,
          get_email: getEmail,
          get_telephone: getTelephone,
          generate_email: generateEmail,
          absender_profil_id: absenderProfilId || null,
          angebots_profil_id: angebotsProfilId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || data?.success === false) {
        setGenError(typeof data?.error === 'string' ? data.error : data?.message || 'Generierung fehlgeschlagen');
        return;
      }
      setGenSuccess(typeof data?.message === 'string' ? data.message : 'Outbound generiert.');
      // Reload the lead so the new contact + email draft appear in the Ansprechpartner list.
      await onLeadRefresh?.();
      // Play a brief "done" animation, then auto-close the modal.
      setGenDone(true);
      setTimeout(() => {
        setApolloOpen(false);
        setGenDone(false);
        setGenSuccess(null);
      }, 1400);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Netzwerkfehler');
    } finally {
      setGenLoading(false);
    }
  }

  const card: React.CSSProperties = {
    ...glassCard(isDark),
    borderRadius: 16,
    padding: '20px 24px',
    marginBottom: 16,
  };
  const sectionTitle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: c.textMuted,
    marginBottom: 16,
  };
  const SOURCE_BADGE_MAP: Record<Contact['source'], { label: string; color: string }> = {
    linkedin: { label: 'LinkedIn', color: '#0077B5' },
    openregister: { label: 'Handelsregister', color: '#10B981' },
    salesnavigator: { label: 'SalesNav', color: '#F97316' },
    manual: { label: 'Manuell', color: '#94A3B8' },
    website: { label: 'Website', color: '#818CF8' },
    apollo: { label: 'Apollo', color: '#A855F7' },
  };

  return (
    <div style={{ padding: '20px 24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* LEFT */}
        <div>
          {/* Contacts */}
          <div>
            <div style={{ ...sectionTitle, marginBottom: 14 }}>Ansprechpartner</div>
            {lead.contacts.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                {lead.contacts.map((ct, i) => {
                  const src = SOURCE_BADGE_MAP[ct.source];
                  const avatarColors = [
                    { bg: 'rgba(129,140,248,0.18)', color: '#818CF8' },
                    { bg: 'rgba(16,185,129,0.18)', color: '#10B981' },
                    { bg: 'rgba(249,115,22,0.18)', color: '#F97316' },
                    { bg: 'rgba(239,68,68,0.18)', color: '#EF4444' },
                  ];
                  const av = avatarColors[i % avatarColors.length];
                  return (
                    <div
                      key={i}
                      style={{
                        ...glassCard(isDark),
                        borderRadius: 14,
                        padding: '18px 20px',
                      }}
                    >
                      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                        {/* Avatar */}
                        {ct.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={ct.photoUrl}
                            alt={ct.name}
                            style={{
                              width: 56,
                              height: 56,
                              borderRadius: 16,
                              objectFit: 'cover',
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 56,
                              height: 56,
                              borderRadius: 16,
                              background: av.bg,
                              color: av.color,
                              fontWeight: 800,
                              fontSize: 18,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              letterSpacing: '-0.02em',
                            }}
                          >
                            {ct.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 16,
                              fontWeight: 800,
                              color: c.text,
                              marginBottom: 2,
                              letterSpacing: '-0.01em',
                            }}
                          >
                            {ct.name}
                          </div>
                          <div style={{ fontSize: 13, color: c.textMuted, marginBottom: 10 }}>{ct.role}</div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, alignItems: 'center' }}>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                color: src.color,
                                background: src.color + '18',
                                padding: '3px 8px',
                                borderRadius: 999,
                                border: `1px solid ${src.color}30`,
                              }}
                            >
                              {src.label}
                            </span>
                            {ct.linkedin && (
                              <a
                                href={/^https?:\/\//i.test(ct.linkedin) ? ct.linkedin : `https://${ct.linkedin}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  fontSize: 11,
                                  color: '#0077B5',
                                  fontWeight: 700,
                                  textDecoration: 'none',
                                  padding: '3px 10px',
                                  background: 'rgba(0,119,181,0.1)',
                                  borderRadius: 999,
                                  border: '1px solid rgba(0,119,181,0.2)',
                                }}
                              >
                                LinkedIn ↗
                              </a>
                            )}
                            {ct.email && (
                              <a
                                href={`mailto:${ct.email}`}
                                style={{
                                  fontSize: 11,
                                  color: '#818CF8',
                                  fontWeight: 700,
                                  textDecoration: 'none',
                                  padding: '3px 10px',
                                  background: 'rgba(129,140,248,0.1)',
                                  borderRadius: 999,
                                  border: '1px solid rgba(129,140,248,0.2)',
                                }}
                              >
                                {ct.email}
                              </a>
                            )}
                            {ct.phone && (
                              <a
                                href={`tel:${ct.phone}`}
                                style={{
                                  fontSize: 11,
                                  color: '#10B981',
                                  fontWeight: 700,
                                  textDecoration: 'none',
                                  padding: '3px 10px',
                                  background: 'rgba(16,185,129,0.1)',
                                  borderRadius: 999,
                                  border: '1px solid rgba(16,185,129,0.2)',
                                }}
                              >
                                {ct.phone}
                              </a>
                            )}
                          </div>

                          {ct.emailDraftBody && (
                            <div style={{ marginTop: 12 }}>
                              <button
                                type="button"
                                onClick={() => setExpandedDraftIdx(expandedDraftIdx === i ? null : i)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: c.accent,
                                  background: c.accent + '14',
                                  border: `1px solid ${c.accent}33`,
                                  borderRadius: 999,
                                  padding: '4px 10px',
                                  cursor: 'pointer',
                                  fontFamily: 'inherit',
                                }}
                              >
                                ✉ E-Mail-Entwurf {expandedDraftIdx === i ? 'verbergen' : 'anzeigen'}
                              </button>

                              {expandedDraftIdx === i && (
                                <div
                                  style={{
                                    marginTop: 10,
                                    padding: '12px 14px',
                                    borderRadius: 10,
                                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                                    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                  }}
                                >
                                  {ct.emailDraftSubject && (
                                    <div
                                      style={{
                                        fontSize: 13,
                                        fontWeight: 800,
                                        color: c.text,
                                        marginBottom: 8,
                                      }}
                                    >
                                      {ct.emailDraftSubject}
                                    </div>
                                  )}
                                  <div
                                    style={{
                                      fontSize: 13,
                                      color: c.text,
                                      lineHeight: 1.6,
                                    }}
                                    dangerouslySetInnerHTML={{ __html: ct.emailDraftBody }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const tmp = document.createElement('div');
                                      tmp.innerHTML = ct.emailDraftBody ?? '';
                                      void navigator.clipboard?.writeText(tmp.textContent || '');
                                    }}
                                    style={{
                                      marginTop: 10,
                                      fontSize: 11,
                                      fontWeight: 700,
                                      color: c.textMuted,
                                      background: 'transparent',
                                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
                                      borderRadius: 8,
                                      padding: '5px 10px',
                                      cursor: 'pointer',
                                      fontFamily: 'inherit',
                                    }}
                                  >
                                    Kopieren
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Mehr Ansprechpartner via Apollo */}
            <div style={{ marginTop: lead.contacts.length > 0 ? 12 : 0 }}>
              <button
                type="button"
                onClick={() => void loadApolloPersons()}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: `1px dashed ${isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)'}`,
                  background: 'transparent',
                  color: c.textMuted,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-inter), sans-serif',
                }}
              >
                Mehr Ansprechpartner laden
              </button>
              {apolloOpen &&
                typeof document !== 'undefined' &&
                createPortal(
                  <div
                    role="dialog"
                    aria-modal="true"
                    onClick={() => setApolloOpen(false)}
                    style={{
                      position: 'fixed',
                      inset: 0,
                      zIndex: 1000,
                      background: 'rgba(0,0,0,0.55)',
                      backdropFilter: 'blur(6px)',
                      WebkitBackdropFilter: 'blur(6px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 24,
                      fontFamily: 'var(--font-inter), sans-serif',
                    }}
                  >
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        width: 'min(560px, 100%)',
                        maxHeight: '85vh',
                        overflowY: 'auto',
                        borderRadius: 18,
                        padding: '20px 22px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 14,
                        background: isDark ? 'rgba(20,20,24,0.96)' : 'rgba(255,255,255,0.98)',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                        boxShadow: isDark
                          ? '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)'
                          : '0 30px 80px rgba(15,23,42,0.25)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: c.text }}>Apollo Ansprechpartner</div>
                        <button
                          type="button"
                          onClick={() => setApolloOpen(false)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: c.textMuted,
                            fontSize: 12,
                            cursor: 'pointer',
                            fontFamily: 'var(--font-inter), sans-serif',
                          }}
                        >
                          Schließen
                        </button>
                      </div>

                      {apolloLoading && <ApolloLoader isDark={isDark} c={c} />}
                      {apolloError && <div style={{ fontSize: 12, color: '#EF4444' }}>Fehler: {apolloError}</div>}
                      {!apolloLoading && !apolloError && apolloPersons && apolloPersons.length === 0 && (
                        <div style={{ fontSize: 12, color: c.textMuted }}>Keine Ansprechpartner gefunden.</div>
                      )}
                      {!apolloLoading && apolloPersons && apolloPersons.length > 0 && (
                        <input
                          type="text"
                          value={apolloSearch}
                          onChange={(e) => setApolloSearch(e.target.value)}
                          placeholder="Suche nach Name oder Rolle…"
                          style={{
                            padding: '9px 12px',
                            borderRadius: 10,
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
                            background: isDark ? 'rgba(0,0,0,0.3)' : '#fff',
                            color: c.text,
                            fontSize: 13,
                            fontFamily: 'var(--font-inter), sans-serif',
                            outline: 'none',
                          }}
                        />
                      )}
                      {!apolloLoading &&
                        filteredApolloPersons &&
                        apolloPersons &&
                        apolloPersons.length > 0 &&
                        filteredApolloPersons.length === 0 && (
                          <div style={{ fontSize: 12, color: c.textMuted }}>Kein Treffer für „{apolloSearch}".</div>
                        )}
                      {!apolloLoading && filteredApolloPersons && filteredApolloPersons.length > 0 && (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6,
                            maxHeight: 360,
                            overflowY: 'auto',
                          }}
                        >
                          {filteredApolloPersons.map((p) => {
                            const isUsed = usedApolloIds.has(p.id);
                            const checked = apolloSelectedId === p.id;
                            const fullName =
                              [p.first_name, p.last_name_obfuscated].filter(Boolean).join(' ') || 'Unbenannt';
                            const phoneYes = p.has_direct_phone === 'Yes';
                            return (
                              <label
                                key={p.id}
                                title={isUsed ? 'Bereits zu diesem Lead hinzugefügt' : undefined}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 12,
                                  padding: '10px 12px',
                                  borderRadius: 10,
                                  border: `1px solid ${checked ? c.accent : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                                  background: checked ? c.accent + '14' : 'transparent',
                                  cursor: isUsed ? 'not-allowed' : 'pointer',
                                  opacity: isUsed ? 0.45 : 1,
                                  transition: 'background 0.12s, border-color 0.12s, opacity 0.12s',
                                }}
                              >
                                <input
                                  type="radio"
                                  name={`apollo-person-${lead.id}`}
                                  checked={checked}
                                  disabled={isUsed}
                                  onChange={() => {
                                    if (!isUsed) setApolloSelectedId(p.id);
                                  }}
                                  style={{ accentColor: c.accent, cursor: isUsed ? 'not-allowed' : 'pointer' }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div
                                    style={{
                                      fontSize: 13,
                                      fontWeight: 700,
                                      color: c.text,
                                      textDecoration: isUsed ? 'line-through' : 'none',
                                    }}
                                  >
                                    {fullName}
                                  </div>
                                  {p.title && (
                                    <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>{p.title}</div>
                                  )}
                                </div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                  {isUsed ? (
                                    <span
                                      style={{
                                        fontSize: 10,
                                        fontWeight: 700,
                                        color: c.textMuted,
                                        background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                                        padding: '3px 8px',
                                        borderRadius: 999,
                                      }}
                                    >
                                      Hinzugefügt
                                    </span>
                                  ) : (
                                    <>
                                      {p.has_email && (
                                        <span
                                          style={{
                                            fontSize: 10,
                                            fontWeight: 700,
                                            color: '#10B981',
                                            background: 'rgba(16,185,129,0.12)',
                                            padding: '3px 8px',
                                            borderRadius: 999,
                                          }}
                                        >
                                          E-Mail
                                        </span>
                                      )}
                                      {phoneYes && (
                                        <span
                                          style={{
                                            fontSize: 10,
                                            fontWeight: 700,
                                            color: '#818CF8',
                                            background: 'rgba(129,140,248,0.12)',
                                            padding: '3px 8px',
                                            borderRadius: 999,
                                          }}
                                        >
                                          Telefon
                                        </span>
                                      )}
                                    </>
                                  )}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {/* Outbound-Generierung */}
                      {!apolloLoading && apolloPersons && apolloPersons.length > 0 && (
                        <div
                          style={{
                            marginTop: 4,
                            padding: '14px 14px 16px',
                            borderRadius: 12,
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              letterSpacing: '0.08em',
                              textTransform: 'uppercase',
                              color: c.textMuted,
                            }}
                          >
                            Outbound generieren
                          </div>

                          {genDone ? (
                            <GenerateDone c={c} />
                          ) : genLoading ? (
                            <GenerateLoader isDark={isDark} c={c} />
                          ) : (
                            <>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: c.textMuted }}>
                                    Absender-Profil
                                  </span>
                                  <select
                                    value={absenderProfilId}
                                    onChange={(e) => setAbsenderProfilId(e.target.value)}
                                    style={{
                                      padding: '8px 10px',
                                      borderRadius: 8,
                                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
                                      background: isDark ? 'rgba(0,0,0,0.3)' : '#fff',
                                      color: c.text,
                                      fontSize: 12,
                                      fontFamily: 'var(--font-inter), sans-serif',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    {absenderProfiles.length === 0 && <option value="">— keine Profile —</option>}
                                    {absenderProfiles.map((p) => (
                                      <option key={p.id} value={p.id}>
                                        {p.label}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: c.textMuted }}>
                                    Angebots-Profil
                                  </span>
                                  <select
                                    value={angebotsProfilId}
                                    onChange={(e) => setAngebotsProfilId(e.target.value)}
                                    style={{
                                      padding: '8px 10px',
                                      borderRadius: 8,
                                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
                                      background: isDark ? 'rgba(0,0,0,0.3)' : '#fff',
                                      color: c.text,
                                      fontSize: 12,
                                      fontFamily: 'var(--font-inter), sans-serif',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    {angebotsProfiles.length === 0 && <option value="">— keine Profile —</option>}
                                    {angebotsProfiles.map((p) => (
                                      <option key={p.id} value={p.id}>
                                        {p.label}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    fontSize: 12,
                                    color: c.text,
                                    cursor: 'pointer',
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={getEmail}
                                    onChange={(e) => setGetEmail(e.target.checked)}
                                    style={{ accentColor: c.accent, cursor: 'pointer' }}
                                  />
                                  E-Mail-Adresse abrufen
                                </label>
                                <label
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    fontSize: 12,
                                    color: c.text,
                                    cursor: 'pointer',
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={getTelephone}
                                    onChange={(e) => setGetTelephone(e.target.checked)}
                                    style={{ accentColor: c.accent, cursor: 'pointer' }}
                                  />
                                  Telefonnummer abrufen
                                </label>
                                <label
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    fontSize: 12,
                                    color: c.text,
                                    cursor: 'pointer',
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={generateEmail}
                                    onChange={(e) => setGenerateEmail(e.target.checked)}
                                    style={{ accentColor: c.accent, cursor: 'pointer' }}
                                  />
                                  E-Mail generieren
                                </label>
                              </div>

                              {genError && <div style={{ fontSize: 12, color: '#EF4444' }}>Fehler: {genError}</div>}
                              {genSuccess && <div style={{ fontSize: 12, color: '#10B981' }}>{genSuccess}</div>}

                              <button
                                type="button"
                                disabled={!apolloSelectedId || genLoading}
                                onClick={() => void generateOutbound()}
                                style={{
                                  alignSelf: 'flex-end',
                                  padding: '9px 16px',
                                  borderRadius: 10,
                                  border: 'none',
                                  background:
                                    !apolloSelectedId || genLoading
                                      ? isDark
                                        ? 'rgba(255,255,255,0.08)'
                                        : 'rgba(0,0,0,0.08)'
                                      : c.accent,
                                  color: !apolloSelectedId || genLoading ? c.textMuted : '#fff',
                                  fontSize: 13,
                                  fontWeight: 800,
                                  cursor: !apolloSelectedId || genLoading ? 'not-allowed' : 'pointer',
                                  fontFamily: 'var(--font-inter), sans-serif',
                                  transition: 'background 0.12s',
                                }}
                              >
                                Outbound generieren
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>,
                  document.body
                )}
            </div>
          </div>

          {/* Tone of Voice */}
          {lead.toneOfVoice && (
            <div style={card}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <div style={sectionTitle}>Tone of Voice</div>
                <SourceBadge label="KI-Analyse" />
              </div>
              <p style={{ fontSize: 14, color: c.text, lineHeight: 1.7, margin: 0 }}>{lead.toneOfVoice}</p>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div>
          {/* 1-Min Pitch */}
          <div
            style={{
              ...glassCard(isDark),
              borderRadius: 16,
              padding: '20px 24px',
              marginBottom: 16,
              borderLeft: '3px solid #10B981',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 14,
              }}
            >
              <div style={sectionTitle}>1-Minuten Pitch</div>
              <SourceBadge label="KI-Analyse" />
            </div>
            <p style={{ fontSize: 15, color: c.text, lineHeight: 1.75, margin: '0 0 14px' }}>{lead.pitch}</p>
            <button
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#10B981',
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: 8,
                padding: '7px 14px',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
              onClick={() => navigator.clipboard?.writeText(lead.pitch)}
            >
              Kopieren
            </button>
          </div>

          {/* Suggested Offer */}
          {lead.proposedOffer && (
            <div
              style={{
                ...glassCard(isDark),
                borderRadius: 16,
                padding: '20px 24px',
                marginBottom: 16,
                borderLeft: '3px solid #F97316',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 14,
                }}
              >
                <div style={sectionTitle}>Vorgeschlagenes Angebot</div>
                <SourceBadge label="KI-Analyse" />
              </div>
              <p style={{ fontSize: 15, color: c.text, lineHeight: 1.75, margin: '0 0 14px' }}>{lead.proposedOffer}</p>
              <button
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#F97316',
                  background: 'rgba(249,115,22,0.1)',
                  border: '1px solid rgba(249,115,22,0.2)',
                  borderRadius: 8,
                  padding: '7px 14px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
                onClick={() => navigator.clipboard?.writeText(lead.proposedOffer!)}
              >
                Kopieren
              </button>
            </div>
          )}

          {/* Personalisierungs-Hooks */}
          {lead.personalizationHooks && lead.personalizationHooks.length > 0 && (
            <div
              style={{
                ...glassCard(isDark),
                borderRadius: 16,
                padding: '20px 24px',
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <div style={sectionTitle}>Personalisierungs-Hooks</div>
                <SourceBadge label="KI-Analyse" />
              </div>
              {lead.personalizationHooks.map((hook, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 12,
                    padding: '12px 0',
                    borderBottom:
                      i < lead.personalizationHooks!.length - 1
                        ? `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}`
                        : 'none',
                  }}
                >
                  <span
                    style={{
                      fontSize: 18,
                      color: '#F97316',
                      fontWeight: 800,
                      flexShrink: 0,
                      lineHeight: 1.2,
                    }}
                  >
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 14, color: c.text, lineHeight: 1.6 }}>{hook}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG = {
  hot: { label: 'Hot', color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
  warm: { label: 'Warm', color: '#F97316', bg: 'rgba(249,115,22,0.15)' },
  cold: { label: 'Kalt', color: '#94A3B8', bg: 'rgba(148,163,184,0.15)' },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const c = colors(theme);
  const isDark = theme === 'dark';

  const LEAD_CACHE_PREFIX = 'lead_detail_';
  const LEAD_CACHE_TTL = 5 * 60_000; // 5 min

  const [lead, setLead] = useState<LeadDetail | null>(() => {
    if (typeof window === 'undefined' || !id) return null;
    try {
      const raw = localStorage.getItem(LEAD_CACHE_PREFIX + id);
      if (raw) {
        const { ts, data } = JSON.parse(raw) as { ts: number; data: Record<string, unknown> };
        if (Date.now() - ts < LEAD_CACHE_TTL) return mapDbLead(data);
      }
    } catch {}
    return null;
  });

  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !id) return true;
    try {
      const raw = localStorage.getItem(LEAD_CACHE_PREFIX + id);
      if (raw) {
        const { ts } = JSON.parse(raw) as { ts: number };
        return Date.now() - ts >= LEAD_CACHE_TTL;
      }
    } catch {}
    return true;
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>('info');
  const [detailView, setDetailView] = useState<
    'website' | 'firma' | 'mitarbeiter' | 'finanzen' | 'social' | 'bewertungen' | 'shipping' | null
  >(null);
  const DETAIL_TITLES = {
    website: 'Website-Analyse',
    firma: 'Firmendaten',
    mitarbeiter: 'Mitarbeiter-Entwicklung',
    finanzen: 'Finanzdaten — Vollständige Übersicht',
    social: 'Social Media',
    bewertungen: 'Bewertungen',
    shipping: 'Shipping & Logistik',
  };
  const [status, setStatus] = useState<LeadStatus>('warm');
  const [scoreHover, setScoreHover] = useState(false);

  const loadLead = useCallback(
    async (opts?: { showSpinner?: boolean }) => {
      if (!id) return;
      if (opts?.showSpinner !== false) setLoading(true);
      try {
        const r = await fetch(`/api/leads/${id}`);
        const data: { lead: Record<string, unknown>; contacts?: ApiLeadContact[] } = await r.json();
        const mapped = mapDbLead(data.lead);
        // Only show contacts that came in via the Apollo "Personen finden" workflow.
        mapped.contacts = (data.contacts ?? []).map(mapApiContact);
        setLead(mapped);
        setStatus(mapped.status);
        try {
          localStorage.setItem(LEAD_CACHE_PREFIX + id, JSON.stringify({ ts: Date.now(), data: data.lead }));
        } catch {}
      } catch {
        /* leave loading state, handle gracefully */
      } finally {
        if (opts?.showSpinner !== false) setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    void loadLead();
  }, [loadLead]);

  const sCfg = STATUS_CFG[status];
  const col = scoreColor(lead?.score ?? 0);

  useLayoutEffect(() => {
    const main = document.querySelector('main');
    if (main) main.scrollTop = 0;
  }, []);

  const TAB_LABELS: Record<ActiveTab, string> = { info: 'Info', outbound: 'Outbound', bot: 'KI-Assistent' };

  if (loading || !lead) {
    return (
      <div
        style={{
          position: 'relative',
          paddingTop: 84,
          paddingBottom: 32,
          fontFamily: 'var(--font-inter), sans-serif',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
        }}
      >
        <GlassPageFilters />
        <div
          style={{
            ...glassCard(isDark),
            margin: '0 20px',
            borderRadius: 16,
            padding: '48px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
          }}
        >
          <span style={{ fontSize: 14, color: c.textMuted }}>Lädt…</span>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        paddingTop: 84,
        paddingBottom: 32,
        fontFamily: 'var(--font-inter), sans-serif',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      <GlassPageFilters />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div
        style={{
          ...glassCard(isDark),
          margin: '0 20px 0',
          borderRadius: '16px 16px 0 0',
          padding: '18px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          borderBottom: 'none',
        }}
      >
        {/* Back */}
        <button
          onClick={() => router.push('/intelligence/leads')}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            color: c.textSub,
            flexShrink: 0,
          }}
        >
          ←
        </button>

        {/* Company avatar */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            overflow: 'hidden',
            flexShrink: 0,
            boxShadow: `0 8px 24px ${lead.color}55`,
            background: lead.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            fontWeight: 800,
            color: '#fff',
            position: 'relative',
          }}
        >
          {lead.initials}
          {(lead.logo_url || lead.profile_image_url) && (
            <img
              src={lead.logo_url ?? lead.profile_image_url}
              alt={lead.name}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
        </div>

        {/* Name + quick stats */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: c.text, marginBottom: 4 }}>{lead.name}</div>
          <div style={{ fontSize: 13, color: c.textMuted, marginBottom: 10 }}>
            {lead.city} · {lead.industry}
          </div>
          {/* Quick-stat pills (Screenshot 3 style) */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {lead.employees && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: 7,
                  background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  color: c.textSub,
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Users size={12} style={{ flexShrink: 0 }} /> {lead.employees} Mitarbeiter
              </span>
            )}
            {lead.founded && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: 7,
                  background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  color: c.textSub,
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Calendar size={12} style={{ flexShrink: 0 }} /> Seit {lead.founded}
              </span>
            )}
            {lead.website && (
              <a
                href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: 7,
                  background: 'rgba(79,70,229,0.10)',
                  color: '#818CF8',
                  border: '1px solid rgba(79,70,229,0.18)',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Globe size={12} style={{ flexShrink: 0 }} />{' '}
                {lead.website.replace(/^https?:\/\//, '').replace(/\/$/, '')} ↗
              </a>
            )}
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: 7,
                  background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  color: c.textSub,
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Phone size={12} style={{ flexShrink: 0 }} /> {lead.phone}
              </a>
            )}
          </div>
        </div>

        {/* Score — big badge (Screenshot 2 style) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            flexShrink: 0,
            position: 'relative',
          }}
          onMouseEnter={() => setScoreHover(true)}
          onMouseLeave={() => setScoreHover(false)}
        >
          <ScoreRing score={lead.score} size={64} />
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: c.textMuted,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            Score
          </span>
          {scoreHover && lead.scoreReason && (
            <div
              style={{
                position: 'absolute',
                bottom: '110%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 260,
                background: isDark ? 'rgba(10,12,24,0.95)' : 'rgba(255,255,255,0.98)',
                border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.1)',
                borderRadius: 10,
                padding: '10px 14px',
                fontSize: 12,
                color: c.text,
                lineHeight: 1.55,
                boxShadow: '0 8px 32px rgba(0,0,0,0.24)',
                zIndex: 100,
                pointerEvents: 'none',
              }}
            >
              {lead.scoreReason}
            </div>
          )}
        </div>

        {/* Fit score pill */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#10B981', lineHeight: 1 }}>{lead.fit}</div>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: c.textMuted,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            Fit
          </span>
        </div>

        {/* Status */}
        <div
          style={{
            padding: '6px 12px',
            borderRadius: 8,
            background: sCfg.bg,
            border: `1.5px solid ${sCfg.color}40`,
            color: sCfg.color,
            fontSize: 12,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: sCfg.color }} />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as LeadStatus)}
            style={{
              background: 'transparent',
              border: 'none',
              color: sCfg.color,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              outline: 'none',
              appearance: 'none',
              WebkitAppearance: 'none',
            }}
          >
            <option value="hot">Hot</option>
            <option value="warm">Warm</option>
            <option value="cold">Kalt</option>
          </select>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div
        style={{
          margin: '0 20px',
          background: isDark ? 'rgba(10,12,24,0.52)' : 'rgba(255,255,255,0.28)',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          borderLeft: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.7)',
          borderRight: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.7)',
          borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.05)',
          display: 'flex',
          padding: '0 8px',
          gap: 2,
        }}
      >
        {(['info', 'outbound', 'bot'] as ActiveTab[]).map((tab) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '11px 18px',
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                color: active ? col : c.textMuted,
                background: 'transparent',
                border: 'none',
                borderBottom: active ? `2px solid ${col}` : '2px solid transparent',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'color 0.15s',
                marginBottom: -1,
              }}
            >
              {TAB_LABELS[tab]}
            </button>
          );
        })}
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          margin: '0 20px',
          background: isDark ? 'rgba(10,12,24,0.36)' : 'rgba(255,255,255,0.16)',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          borderTop: 'none',
          borderRight: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.7)',
          borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.7)',
          borderLeft: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.7)',
          borderRadius: '0 0 16px 16px',
          ...(detailView === null && activeTab === 'bot'
            ? { display: 'flex', flexDirection: 'column' as const, flex: 1, minHeight: 0, overflow: 'hidden' }
            : {}),
        }}
      >
        {detailView !== null ? (
          <>
            {/* Back bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '14px 24px',
                borderBottom: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.06)',
                flexShrink: 0,
              }}
            >
              <button
                onClick={() => setDetailView(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  color: c.textMuted,
                  fontFamily: 'inherit',
                  padding: 0,
                }}
              >
                ← Zurück
              </button>
              <span style={{ fontSize: 13, fontWeight: 700, color: c.text }}>{DETAIL_TITLES[detailView]}</span>
            </div>
            {detailView === 'website' && <WebsiteDetail lead={lead!} c={c} isDark={isDark} />}
            {detailView === 'firma' && <FirmaDetail lead={lead!} c={c} isDark={isDark} />}
            {detailView === 'mitarbeiter' && <MitarbeiterDetail lead={lead!} c={c} isDark={isDark} />}
            {detailView === 'finanzen' && <FinanzenTab lead={lead!} c={c} isDark={isDark} />}
            {detailView === 'social' && <SocialDetail lead={lead!} c={c} isDark={isDark} />}
            {detailView === 'bewertungen' && <BewertungenDetail lead={lead!} c={c} isDark={isDark} />}
            {detailView === 'shipping' && <ShippingDetail lead={lead!} c={c} isDark={isDark} />}
          </>
        ) : (
          <>
            {activeTab === 'info' && (
              <InfoTab lead={lead!} c={c} isDark={isDark} onOpenDetail={(v) => setDetailView(v)} />
            )}
            {activeTab === 'outbound' && (
              <OutboundTab lead={lead!} c={c} isDark={isDark} onLeadRefresh={() => loadLead({ showSpinner: false })} />
            )}
            {activeTab === 'bot' && <ChatTab key={lead!.id} lead={lead!} c={c} isDark={isDark} />}
          </>
        )}
      </div>
    </div>
  );
}
