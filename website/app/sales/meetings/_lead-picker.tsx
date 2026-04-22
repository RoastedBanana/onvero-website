'use client';

import { useState, useRef, useEffect } from 'react';
import { C, SvgIcon, ICONS, StatusBadge, ScoreBar } from '../_shared';
import { useCompanies } from '../unternehmen/_hooks/useCompanies';
import type { Company } from '../unternehmen/_types';
import type { Lead } from '../_lead-data';

// ─── MAP v2 Company → legacy Lead shape (keeps _create-meeting unchanged) ───

function mapStatus(s: string | null): Lead['status'] {
  if (s === 'contacted') return 'In Kontakt';
  if (s === 'qualified') return 'Qualifiziert';
  if (s === 'lost') return 'Verloren';
  return 'Neu';
}

function companyToLead(c: Company): Lead {
  const name = c.company_name ?? '';
  return {
    id: c.id,
    company: name,
    name,
    city: c.city ?? '',
    country: c.country ?? null,
    status: mapStatus(c.status),
    lastActivity: c.updated_at ?? c.created_at,
    industry: c.industry ?? c.apollo_industry ?? '',
    employees: c.estimated_num_employees ? String(c.estimated_num_employees) : '',
    website: c.website,
    linkedinUrl: c.linkedin_url,
    logoUrl: c.logo_url,
    primaryDomain: c.primary_domain,
    foundedYear: c.founded_year,
    annualRevenuePrinted: c.annual_revenue_printed,
    companySize: null,
    companyType: null,
    tier: c.tier,
    summary: c.summary,
    strengths: c.strengths ?? [],
    concerns: c.concerns ?? [],
    nextAction: c.next_action,
    tags: c.tags ?? [],
    technologyNames: c.technology_names ?? [],
    source: c.source ?? '',
    createdAt: c.created_at,
    phone: c.phone,
    companyDescription: c.company_description,
    usp: c.usp,
    coreServices: c.core_services,
    targetCustomers: c.target_customers,
    painPoints: c.pain_points,
    automationPotential: c.automation_potential,
    automationOpportunities: c.automation_opportunities,
    growthSignals: c.growth_signals,
    companySizeSignals: c.company_size_signals,
    toneOfVoice: c.tone_of_voice,
    personalizationHooks: c.personalization_hooks,
    websiteHighlights: c.website_highlights,
    techStack: c.tech_stack,
    partnerCustomerUrls: c.partner_customer_urls,
    websiteScrapedAt: c.website_scraped_at,
    followUpContext: c.follow_up_context,
    twitterUrl: c.twitter_url,
    facebookUrl: c.facebook_url,
    score: c.fit_score,
    fitScore: c.fit_score,
    contactQualityScore: null,
    decisionMakerScore: null,
    scoreBreakdown: [],
    industryApollo: c.apollo_industry,
    apolloOrganizationId: c.apollo_organization_id,
    aiSummary: c.summary,
    aiTags: c.tags ?? [],
    isExcluded: c.is_excluded ?? false,
  } as Lead;
}

// ─── LEAD PREVIEW CARD ──────────────────────────────────────────────────────

function LeadPreview({ lead }: { lead: Lead }) {
  const hasEmail = !!lead.emailDraftSubject;

  return (
    <div
      style={{
        background: C.surface2,
        border: `1px solid ${C.borderLight}`,
        borderRadius: 12,
        padding: '18px 20px',
        animation: 'scaleIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: `linear-gradient(135deg, ${C.accentGhost}, ${C.accentGlow})`,
            border: `1px solid ${C.borderAccent}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 600,
            color: C.accent,
          }}
        >
          {lead.firstName?.charAt(0)}
          {lead.lastName?.charAt(0)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: C.text1 }}>{lead.name}</div>
          <div style={{ fontSize: 12, color: C.text2, marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
            {lead.jobTitle && <span>{lead.jobTitle}</span>}
            {lead.jobTitle && <span style={{ opacity: 0.3, fontSize: 8 }}>●</span>}
            <span>{lead.company}</span>
          </div>
        </div>
        <StatusBadge status={lead.status} />
      </div>

      {/* Score */}
      {lead.score !== null && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 500, color: C.text3, letterSpacing: '0.06em' }}>LEAD SCORE</span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: lead.score >= 70 ? C.success : lead.score >= 45 ? C.warning : C.text3,
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              }}
            >
              {lead.score}
            </span>
          </div>
          <ScoreBar score={lead.score} />
        </div>
      )}

      {/* Info Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          padding: '14px 0',
          borderTop: `1px solid ${C.border}`,
        }}
      >
        {[
          { label: 'E-Mail', value: lead.email, icon: ICONS.mail },
          { label: 'Telefon', value: lead.phone, icon: ICONS.mic },
          { label: 'Stadt', value: lead.city, icon: ICONS.globe },
          { label: 'Branche', value: lead.industry, icon: ICONS.target },
          {
            label: 'Website',
            value: lead.website ? lead.website.replace(/^https?:\/\//, '') : null,
            icon: ICONS.globe,
          },
          {
            label: 'Google',
            value: lead.googleRating ? `${lead.googleRating} ★ (${lead.googleReviews})` : null,
            icon: ICONS.trending,
          },
        ]
          .filter((f) => f.value)
          .map((f) => (
            <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <SvgIcon d={f.icon} size={12} color={C.text3} />
              <div>
                <div style={{ fontSize: 10, color: C.text3, letterSpacing: '0.04em' }}>{f.label}</div>
                <div
                  style={{
                    fontSize: 12,
                    color: C.text2,
                    marginTop: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: 160,
                  }}
                >
                  {f.value}
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Interaction Status */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          paddingTop: 12,
          borderTop: `1px solid ${C.border}`,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 10px',
            borderRadius: 6,
            background: hasEmail ? C.successBg : 'rgba(255,255,255,0.02)',
            border: `1px solid ${hasEmail ? C.successBorder : C.border}`,
          }}
        >
          <SvgIcon d={ICONS.mail} size={11} color={hasEmail ? C.success : C.text3} />
          <span style={{ fontSize: 11, color: hasEmail ? C.success : C.text3 }}>
            {hasEmail ? 'E-Mail gesendet' : 'Keine E-Mail'}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 10px',
            borderRadius: 6,
            background: 'rgba(255,255,255,0.02)',
            border: `1px solid ${C.border}`,
          }}
        >
          <SvgIcon d={ICONS.clock} size={11} color={C.text3} />
          <span style={{ fontSize: 11, color: C.text3 }}>{lead.lastActivity}</span>
        </div>
      </div>

      {/* AI Summary */}
      {lead.aiSummary && (
        <div
          style={{
            marginTop: 12,
            padding: '12px 14px',
            borderRadius: 8,
            background: `${C.accent}06`,
            border: `1px solid ${C.accent}10`,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 6,
            }}
          >
            <SvgIcon d={ICONS.spark} size={11} color={C.accent} />
            <span style={{ fontSize: 10, fontWeight: 500, color: C.accent, letterSpacing: '0.06em' }}>ANALYSE</span>
          </div>
          <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.6 }}>{lead.aiSummary}</div>
        </div>
      )}
    </div>
  );
}

// ─── LEAD PICKER ────────────────────────────────────────────────────────────

export default function LeadPicker({
  selectedLeadId,
  onSelect,
}: {
  selectedLeadId: string | null;
  onSelect: (lead: Lead | null) => void;
}) {
  const { companies, loading } = useCompanies();
  const leads = companies.map(companyToLead);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedLead = leads.find((l) => l.id === selectedLeadId) ?? null;

  const filtered = query.trim()
    ? leads.filter((l) => {
        const q = query.toLowerCase();
        return (
          l.name.toLowerCase().includes(q) ||
          l.company.toLowerCase().includes(q) ||
          (l.email?.toLowerCase().includes(q) ?? false)
        );
      })
    : leads;

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <label style={{ fontSize: 11, fontWeight: 500, color: C.text3, letterSpacing: '0.06em' }}>LEAD AUSWÄHLEN</label>

      <div ref={dropdownRef} style={{ position: 'relative' }}>
        {/* Search Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            borderRadius: 10,
            background: C.surface,
            border: `1px solid ${open ? C.borderAccent : C.border}`,
            transition: 'border-color 0.15s ease',
          }}
        >
          <SvgIcon d={ICONS.search} size={14} color={C.text3} />
          <input
            ref={inputRef}
            value={selectedLead && !open ? selectedLead.name + ' — ' + selectedLead.company : query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!open) setOpen(true);
            }}
            onFocus={() => {
              setOpen(true);
              if (selectedLead) setQuery('');
            }}
            placeholder={loading ? 'Leads werden geladen…' : 'Name, Firma oder E-Mail suchen…'}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: C.text1,
              fontSize: 13,
              fontFamily: 'inherit',
            }}
          />
          {selectedLead && (
            <button
              onClick={() => {
                onSelect(null);
                setQuery('');
                inputRef.current?.focus();
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 2,
                display: 'flex',
              }}
            >
              <SvgIcon d={ICONS.x} size={14} color={C.text3} />
            </button>
          )}
        </div>

        {/* Dropdown */}
        {open && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              maxHeight: 280,
              overflowY: 'auto',
              background: C.surface2,
              border: `1px solid ${C.borderLight}`,
              borderRadius: 10,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              zIndex: 50,
              animation: 'fadeInUp 0.2s cubic-bezier(0.22, 1, 0.36, 1) both',
            }}
          >
            {filtered.length === 0 ? (
              <div style={{ padding: '20px 16px', textAlign: 'center', color: C.text3, fontSize: 12 }}>
                {loading ? 'Laden…' : 'Keine Leads gefunden'}
              </div>
            ) : (
              filtered.slice(0, 20).map((lead) => (
                <button
                  key={lead.id}
                  onClick={() => {
                    onSelect(lead);
                    setQuery('');
                    setOpen(false);
                  }}
                  className="s-row"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    border: 'none',
                    background: lead.id === selectedLeadId ? C.accentGhost : 'transparent',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                    borderBottom: `1px solid ${C.border}`,
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: C.accentGhost,
                      border: `1px solid ${C.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 600,
                      color: C.accent,
                      flexShrink: 0,
                    }}
                  >
                    {lead.firstName?.charAt(0)}
                    {lead.lastName?.charAt(0)}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: C.text1 }}>{lead.name}</div>
                    <div
                      style={{
                        fontSize: 11,
                        color: C.text3,
                        marginTop: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {lead.company}
                      {lead.city ? ` · ${lead.city}` : ''}
                    </div>
                  </div>

                  {/* Score */}
                  {lead.score !== null && (
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                        color: lead.score >= 70 ? C.success : lead.score >= 45 ? C.warning : C.text3,
                      }}
                    >
                      {lead.score}
                    </span>
                  )}

                  <StatusBadge status={lead.status} />
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Lead Preview Card */}
      {selectedLead && <LeadPreview lead={selectedLead} />}
    </div>
  );
}
