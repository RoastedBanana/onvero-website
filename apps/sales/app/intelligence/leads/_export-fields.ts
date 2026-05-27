// Field catalogue for the leads CSV/Excel export.
// Each entry maps a Supabase column on `leads` to a German label.
// Group order = order shown in the modal.

export type ExportField = {
  key: string; // Supabase column on `leads`
  label: string; // German label shown in the modal & as the column header
};

export type ExportFieldGroup = {
  id: string;
  label: string; // German group title
  fields: ExportField[];
};

export const EXPORT_FIELD_GROUPS: ExportFieldGroup[] = [
  {
    id: 'stammdaten',
    label: 'Stammdaten',
    fields: [
      { key: 'company_name', label: 'Firmenname' },
      { key: 'phone', label: 'Telefon' },
      { key: 'website', label: 'Website' },
      { key: 'street', label: 'Straße' },
      { key: 'zip', label: 'PLZ' },
      { key: 'city', label: 'Stadt' },
      { key: 'country', label: 'Land' },
      { key: 'registered_seat', label: 'Sitz' },
    ],
  },
  {
    id: 'firma',
    label: 'Firma',
    fields: [
      { key: 'industry', label: 'Branche' },
      { key: 'industry_code', label: 'Branchen-Code' },
      { key: 'business_model', label: 'Geschäftsmodell' },
      { key: 'founded_year', label: 'Gründungsjahr' },
      { key: 'legal_form', label: 'Rechtsform' },
      { key: 'hrb_number', label: 'HRB-Nummer' },
      { key: 'court', label: 'Registergericht' },
      { key: 'num_employees', label: 'Mitarbeiterzahl' },
      { key: 'estimated_employees_scraped', label: 'Mitarbeiterzahl (geschätzt)' },
      { key: 'logo_url', label: 'Logo-URL' },
      { key: 'openregister_company_id', label: 'OpenRegister-ID' },
      { key: 'or_purpose', label: 'Unternehmenszweck' },
    ],
  },
  {
    id: 'fuehrung',
    label: 'Führung',
    fields: [
      { key: 'managing_directors', label: 'Geschäftsführung' },
      { key: 'decision_makers', label: 'Entscheider' },
      { key: 'or_prokuristen', label: 'Prokuristen' },
      { key: 'or_former_directors', label: 'Ehemalige Geschäftsführer' },
      { key: 'mgmt_is_founder_led', label: 'Gründergeführt' },
      { key: 'mgmt_has_prokura', label: 'Prokura vorhanden' },
      { key: 'mgmt_current_director_count', label: 'Anzahl aktiver Geschäftsführer' },
      { key: 'mgmt_total_changes', label: 'Anzahl Führungswechsel' },
      { key: 'mgmt_avg_tenure_months', label: 'Ø Amtszeit (Monate)' },
      { key: 'mgmt_last_change_type', label: 'Letzter Wechsel (Typ)' },
      { key: 'mgmt_stability_score', label: 'Führungs-Stabilität (Score)' },
      { key: 'mgmt_stability_label', label: 'Führungs-Stabilität (Label)' },
      { key: 'mgmt_analysis_summary', label: 'Führungs-Analyse' },
      { key: 'mgmt_risk_flags', label: 'Führungs-Risiken' },
      { key: 'mgmt_opportunity_flags', label: 'Führungs-Chancen' },
      { key: 'mgmt_buying_signals', label: 'Führungs-Buying-Signale' },
    ],
  },
  {
    id: 'finanzen',
    label: 'Finanzen',
    fields: [
      { key: 'annual_revenue', label: 'Umsatz (€)' },
      { key: 'fin_estimated_revenue_eur', label: 'Umsatz geschätzt (€)' },
      { key: 'fin_estimated_revenue_method', label: 'Schätz-Methode' },
      { key: 'estimated_revenue_scraped', label: 'Umsatz (Scraped)' },
      { key: 'fin_salaries_eur', label: 'Personalkosten (€)' },
      { key: 'fin_capital_eur', label: 'Eigenkapital (€)' },
      { key: 'fin_net_income_eur', label: 'Jahresüberschuss (€)' },
      { key: 'fin_revenue_trend', label: 'Umsatz-Trend' },
      { key: 'fin_employee_trend', label: 'Mitarbeiter-Trend' },
      { key: 'fin_balance_sheet_trend', label: 'Bilanz-Trend' },
      { key: 'fin_equity_trend', label: 'Eigenkapital-Trend' },
      { key: 'fin_health_score', label: 'Finanz-Gesundheit (Score)' },
      { key: 'fin_health_label', label: 'Finanz-Gesundheit (Label)' },
      { key: 'fin_analysis_summary', label: 'Finanz-Analyse' },
      { key: 'fin_risk_flags', label: 'Finanz-Risiken' },
      { key: 'fin_opportunity_flags', label: 'Finanz-Chancen' },
      { key: 'fin_years_of_data', label: 'Jahre verfügbar' },
      { key: 'fin_latest_date', label: 'Letztes Geschäftsjahr' },
      { key: 'or_financials_history', label: 'Bilanz-Historie (JSON)' },
    ],
  },
  {
    id: 'social',
    label: 'Social Media',
    fields: [
      { key: 'linkedin_url', label: 'LinkedIn-URL' },
      { key: 'instagram_url', label: 'Instagram-URL' },
      { key: 'facebook_url', label: 'Facebook-URL' },
      { key: 'twitter_url', label: 'X / Twitter-URL' },
      { key: 'tiktok_url', label: 'TikTok-URL' },
      { key: 'youtube_url', label: 'YouTube-URL' },
      { key: 'xing_url', label: 'Xing-URL' },
      { key: 'li_followers', label: 'LinkedIn-Follower' },
      { key: 'li_company_size', label: 'LinkedIn-Größe' },
      { key: 'instagram_followers', label: 'Instagram-Follower' },
      { key: 'instagram_following', label: 'Instagram-Folgt' },
      { key: 'instagram_posts_count', label: 'Instagram-Posts' },
      { key: 'facebook_followers', label: 'Facebook-Follower' },
      { key: 'social_total_followers', label: 'Follower gesamt' },
      { key: 'social_primary_platform', label: 'Haupt-Plattform' },
      { key: 'social_posting_frequency', label: 'Posting-Frequenz' },
      { key: 'social_days_since_last_post', label: 'Tage seit letztem Post' },
      { key: 'social_engagement_rate_pct', label: 'Engagement-Rate (%)' },
      { key: 'social_avg_likes_per_post', label: 'Ø Likes/Post' },
      { key: 'social_health_score', label: 'Social-Gesundheit (Score)' },
      { key: 'social_health_label', label: 'Social-Gesundheit (Label)' },
      { key: 'social_analysis_summary', label: 'Social-Analyse' },
      { key: 'social_buying_signals', label: 'Social Buying-Signale' },
      { key: 'social_personalization_hooks', label: 'Personalisierungs-Hooks' },
    ],
  },
  {
    id: 'bewertungen',
    label: 'Bewertungen',
    fields: [
      { key: 'google_rating', label: 'Google-Rating' },
      { key: 'google_review_count', label: 'Google-Bewertungen' },
      { key: 'google_reviews_url', label: 'Google-URL' },
      { key: 'trustpilot_rating', label: 'Trustpilot-Rating' },
      { key: 'trustpilot_review_count', label: 'Trustpilot-Bewertungen' },
      { key: 'trustpilot_url', label: 'Trustpilot-URL' },
      { key: 'kununu_rating', label: 'Kununu-Rating' },
      { key: 'kununu_review_count', label: 'Kununu-Bewertungen' },
      { key: 'kununu_url', label: 'Kununu-URL' },
      { key: 'provenexpert_rating', label: 'ProvenExpert-Rating' },
      { key: 'provenexpert_review_count', label: 'ProvenExpert-Bewertungen' },
      { key: 'reviews_overall_score', label: 'Gesamtwertung' },
      { key: 'reviews_total_count', label: 'Bewertungen gesamt' },
      { key: 'reviews_health_score', label: 'Reputation (Score)' },
      { key: 'reviews_health_label', label: 'Reputation (Label)' },
      { key: 'reviews_sentiment_trend', label: 'Sentiment-Trend' },
      { key: 'reviews_owner_response_rate', label: 'Antwort-Quote (%)' },
      { key: 'reviews_top_complaints', label: 'Top-Beschwerden' },
      { key: 'reviews_top_praise', label: 'Top-Lob' },
      { key: 'reviews_shipping_complaints', label: 'Versand-Beschwerden' },
      { key: 'reviews_analysis_summary', label: 'Reviews-Analyse' },
    ],
  },
  {
    id: 'versand',
    label: 'Versand',
    fields: [
      { key: 'shipping_sps_fit_score', label: 'SmartParcel-Fit (Score)' },
      { key: 'shipping_sps_fit_reasoning', label: 'SmartParcel-Begründung' },
      { key: 'shipping_carriers_detected', label: 'Erkannte Carrier' },
      { key: 'shipping_fulfillment_model', label: 'Fulfillment-Modell' },
      { key: 'shipping_estimated_volume', label: 'Geschätztes Volumen' },
      { key: 'shipping_logistics_complexity', label: 'Logistik-Komplexität' },
      { key: 'shipping_has_own_warehouse', label: 'Eigenes Lager' },
      { key: 'shipping_warehouse_m2', label: 'Lagerfläche (m²)' },
      { key: 'shipping_international_pct', label: 'International (%)' },
      { key: 'shipping_countries', label: 'Versandländer' },
      { key: 'shipping_free_threshold_eur', label: 'Versandfrei ab (€)' },
      { key: 'shipping_delivery_promise', label: 'Lieferversprechen' },
      { key: 'shipping_return_policy', label: 'Retouren-Policy' },
      { key: 'shipping_pain_signals', label: 'Versand-Pain-Signale' },
      { key: 'shipping_carrier_complaints', label: 'Carrier-Beschwerden' },
      { key: 'shipping_savings_potential', label: 'Spar-Potenzial' },
      { key: 'shipping_approach_angle', label: 'Sales-Angle' },
      { key: 'shipping_analysis_summary', label: 'Versand-Analyse' },
    ],
  },
  {
    id: 'website',
    label: 'Website-Analyse',
    fields: [
      { key: 'primary_domain', label: 'Primary Domain' },
      { key: 'website_title', label: 'Website-Titel' },
      { key: 'website_description', label: 'Website-Beschreibung' },
      { key: 'website_summary', label: 'Website-Zusammenfassung' },
      { key: 'web_value_proposition', label: 'Value Proposition' },
      { key: 'web_target_market', label: 'Zielmarkt' },
      { key: 'web_industry_position', label: 'Marktposition' },
      { key: 'web_has_shop', label: 'Shop vorhanden' },
      { key: 'web_has_careers_page', label: 'Karriere-Seite' },
      { key: 'web_open_positions_count', label: 'Offene Stellen' },
      { key: 'web_memberships', label: 'Mitgliedschaften' },
      { key: 'web_certifications', label: 'Zertifizierungen' },
      { key: 'web_partnerships', label: 'Partnerschaften' },
      { key: 'web_buying_signals', label: 'Web Buying-Signale' },
      { key: 'web_outreach_hooks', label: 'Outreach-Hooks' },
      { key: 'web_recent_news', label: 'Aktuelle News' },
      { key: 'web_analysis_summary', label: 'Website-Analyse' },
    ],
  },
  {
    id: 'technologie',
    label: 'Technologie',
    fields: [
      { key: 'web_tech_stack', label: 'Tech-Stack' },
      { key: 'tech_maturity_label', label: 'Tech-Reife' },
    ],
  },
  {
    id: 'lead',
    label: 'Lead-Status',
    fields: [
      { key: 'lead_score', label: 'Lead-Score' },
      { key: 'fit_score', label: 'Fit-Score' },
      { key: 'tier', label: 'Tier' },
      { key: 'lead_score_reasoning', label: 'Score-Begründung' },
      { key: 'lead_summary', label: 'Lead-Zusammenfassung' },
      { key: 'one_min_pitch', label: '60-Sekunden-Pitch' },
      { key: 'suggested_offer', label: 'Vorgeschlagenes Angebot' },
      { key: 'growth_signals', label: 'Wachstums-Signale' },
      { key: 'green_flags', label: 'Green Flags' },
      { key: 'red_flags', label: 'Red Flags' },
      { key: 'strengths', label: 'Stärken' },
      { key: 'concerns', label: 'Bedenken' },
      { key: 'tags', label: 'Tags' },
      { key: 'source', label: 'Quelle' },
      { key: 'enrichment_status', label: 'Enrichment-Status' },
      { key: 'archived', label: 'Archiviert' },
      { key: 'created_at', label: 'Erstellt am' },
      { key: 'updated_at', label: 'Aktualisiert am' },
      { key: 'ai_scored_at', label: 'AI-Score-Datum' },
    ],
  },
];

// Default selection — the fields ticked when the modal opens.
export const DEFAULT_SELECTED_FIELDS: string[] = [
  'company_name',
  'phone',
  'website',
  'city',
  'industry',
  'num_employees',
  'lead_score',
  'tier',
];

export function getFieldLabel(key: string): string {
  for (const group of EXPORT_FIELD_GROUPS) {
    const f = group.fields.find((x) => x.key === key);
    if (f) return f.label;
  }
  return key;
}

// Format a raw Supabase value for a flat cell (CSV/XLSX).
// Arrays of primitives -> "a; b; c"
// Arrays of objects / objects -> JSON string
// null/undefined -> ''
export function formatExportCell(value: unknown): string | number | boolean {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '';
    const allPrim = value.every((v) => v === null || typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean');
    if (allPrim) return value.map((v) => (v == null ? '' : String(v))).join('; ');
    return JSON.stringify(value);
  }
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
