// ─── TYPES — Unternehmen v2 ─────────────────────────────────────────────────
// Mirrors Supabase schema exactly. All nullable fields are `| null`.

export type CompanyStatus = 'new' | 'contacted' | 'qualified' | 'lost';

export interface Company {
  id: string;
  tenant_id: string;
  apollo_organization_id: string | null;
  company_name: string | null;
  logo_url: string | null;
  website: string | null;
  primary_domain: string | null;
  phone: string | null;
  street: string | null;
  city: string | null;
  zip: string | null;
  country: string | null;
  state: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  facebook_url: string | null;
  founded_year: number | null;
  estimated_num_employees: number | null;
  annual_revenue: number | null;
  annual_revenue_printed: string | null;
  apollo_industry: string | null;
  industry: string | null;
  apollo_keywords: string[] | null;
  apollo_short_description: string | null;
  technology_names: string[] | null;
  fit_score: number | null;
  tier: string | null;
  summary: string | null;
  strengths: string[] | null;
  concerns: string[] | null;
  next_action: string | null;
  tags: string[] | null;
  company_description: string | null;
  core_services: string[] | null;
  target_customers: string | null;
  pain_points: string[] | null;
  automation_potential: string | null;
  tech_stack: string[] | null;
  growth_signals: string[] | null;
  company_size_signals: string | null;
  tone_of_voice: string | null;
  usp: string | null;
  personalization_hooks: string[] | null;
  automation_opportunities: string[] | null;
  website_highlights: string | null;
  partner_customer_urls: string[] | null;
  cloudflare_blocked: boolean | null;
  website_scraped_at: string | null;
  ai_scored_at: string | null;
  follow_up_context: {
    target_customers?: string;
    tone_of_voice?: string;
    personalization_hooks?: string[];
    conversation_opener?: string;
  } | null;
  status: CompanyStatus | null;
  is_excluded: boolean | null;
  source: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface Contact {
  id: string;
  lead_id: string;
  tenant_id: string;
  apollo_person_id: string | null;
  apollo_contact_id: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  title: string | null;
  seniority: string | null;
  departments: string[] | null;
  functions: string[] | null;
  email: string | null;
  email_status: string | null;
  phone: string | null;
  mobile_phone: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  github_url: string | null;
  facebook_url: string | null;
  photo_url: string | null;
  headline: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  employment_history:
    | {
        title: string;
        company: string;
        start_date: string | null;
        end_date: string | null;
        current: boolean;
      }[]
    | null;
  decision_maker_score: number | null;
  contact_quality_score: number | null;
  is_primary: boolean | null;
  is_excluded: boolean | null;
  exclusion_reason: string | null;
  status: string | null;
  last_contacted_at: string | null;
  email_draft_subject: string | null;
  email_draft_body: string | null;
  raw_apollo_person: Record<string, unknown> | null;
  created_at: string;
  updated_at: string | null;
}
