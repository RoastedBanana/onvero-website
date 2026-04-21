'use client';

import { useState } from 'react';
import { TOKENS } from '../_tokens';
import { fmt } from '../_lib/formatters';
import {
  sanitizeForDisplay,
  sanitizeArrayForDisplay,
  PLACEHOLDER_LANG,
  PLACEHOLDER_EMPTY,
} from '../_lib/language-guard';
import EmptyInline from './EmptyInline';
import type { Company } from '../_types';

// ─── SECTION HEADER ─────────────────────────────────────────────────────────

function SectionHeader({ label, dotColor, count }: { label: string; dotColor: string; count?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.06em',
          color: TOKENS.color.textMuted,
          textTransform: 'uppercase' as const,
        }}
      >
        {label}
      </span>
      {count !== undefined && count > 0 && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            padding: '1px 6px',
            borderRadius: 4,
            background: TOKENS.color.indigoBgSubtle,
            color: TOKENS.color.indigoLight,
            fontFamily: TOKENS.font.mono,
          }}
        >
          {count}
        </span>
      )}
    </div>
  );
}

// ─── EMPTY DASHED ───────────────────────────────────────────────────────────

function EmptyDashed({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: '20px 16px',
        borderRadius: TOKENS.radius.card,
        textAlign: 'center',
        border: `1.5px dashed ${TOKENS.color.indigoBorderSoft}`,
        background: TOKENS.color.indigoBgSubtle,
      }}
    >
      <span style={{ fontSize: 12, color: TOKENS.color.textMuted, fontStyle: 'italic' }}>{text}</span>
    </div>
  );
}

// ─── CARD SHELL ─────────────────────────────────────────────────────────────

function CardShell({ children, borderLeft }: { children: React.ReactNode; borderLeft?: string }) {
  return (
    <div
      style={{
        background: TOKENS.color.bgCard,
        border: `1px solid ${TOKENS.color.borderSubtle}`,
        borderLeft: borderLeft ? `3px solid ${borderLeft}` : undefined,
        borderRadius: TOKENS.radius.card,
        padding: '14px 16px',
        fontFamily: TOKENS.font.family,
      }}
    >
      {children}
    </div>
  );
}

// ─── COMPONENT ──────────────────────────────────────────────────────────────

export default function AnalyseTab({ company }: { company: Company }) {
  const [keywordsOpen, setKeywordsOpen] = useState(false);
  const industry = fmt.industry(company.apollo_industry ?? company.industry);
  const painPoints = sanitizeArrayForDisplay(company.pain_points);
  const hooks = sanitizeArrayForDisplay(company.personalization_hooks);
  const coreServices = sanitizeArrayForDisplay(company.core_services);
  const keywords = company.apollo_keywords ?? [];
  const partnerUrls = company.partner_customer_urls ?? [];
  const cleanUsp = sanitizeForDisplay(company.usp);
  const cleanTone = sanitizeForDisplay(company.tone_of_voice);
  const cleanTargetCustomers = sanitizeForDisplay(company.target_customers);
  const cleanWebHighlights = sanitizeForDisplay(company.website_highlights);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: TOKENS.font.family }}>
      {/* Industry Hero */}
      {industry && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '16px 20px',
            borderRadius: TOKENS.radius.card,
            background: TOKENS.color.indigoBgSubtle,
            border: `1px solid ${TOKENS.color.indigoBorderSoft}`,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: TOKENS.radius.button,
              background: TOKENS.color.indigoBgSoft,
              border: `1px solid ${TOKENS.color.indigoBorderSoft}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke={TOKENS.color.indigo}
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" />
            </svg>
          </div>
          <div>
            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: '0.06em',
                color: TOKENS.color.textMuted,
                display: 'block',
              }}
            >
              BRANCHE
            </span>
            <span style={{ fontSize: 16, fontWeight: 500, color: TOKENS.color.textPrimary, letterSpacing: '-0.01em' }}>
              {industry}
            </span>
          </div>
        </div>
      )}

      {/* Pain Points + Hooks (2-col) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Pain Points */}
        <div>
          <SectionHeader label="Pain Points" dotColor={TOKENS.color.amber} count={painPoints.length} />
          {painPoints.length === 0 ? (
            <EmptyInline label={PLACEHOLDER_LANG} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {painPoints.map((p, i) => (
                <CardShell key={i} borderLeft={TOKENS.color.amber}>
                  <span style={{ fontSize: 14, color: TOKENS.color.textSecondary, lineHeight: 1.5 }}>{p}</span>
                </CardShell>
              ))}
            </div>
          )}
        </div>

        {/* Personalization Hooks */}
        <div>
          <SectionHeader label="Personalisierungs-Hooks" dotColor={TOKENS.color.indigo} count={hooks.length} />
          {hooks.length === 0 ? (
            <EmptyInline label={PLACEHOLDER_LANG} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {hooks.map((h, i) => (
                <CardShell key={i} borderLeft={TOKENS.color.indigo}>
                  <span style={{ fontSize: 14, color: TOKENS.color.textSecondary, lineHeight: 1.5 }}>{h}</span>
                </CardShell>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* USP Hero */}
      {cleanUsp ? (
        <div
          style={{
            padding: '24px 28px',
            borderRadius: TOKENS.radius.cardLarge,
            background: 'rgba(107,122,255,0.04)',
            border: `1px solid ${TOKENS.color.indigoBorderSoft}`,
          }}
        >
          <span
            style={{
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '0.06em',
              color: TOKENS.color.indigoLight,
              display: 'block',
              marginBottom: 10,
            }}
          >
            UNIQUE SELLING PROPOSITION
          </span>
          <p
            style={{
              fontSize: 18,
              fontWeight: 500,
              color: TOKENS.color.textPrimary,
              lineHeight: 1.5,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            {cleanUsp}
          </p>
        </div>
      ) : company.usp ? (
        <EmptyInline label={PLACEHOLDER_LANG} />
      ) : null}

      {/* Tone of Voice */}
      {cleanTone ? (
        <div
          style={{
            background: TOKENS.color.bgCard,
            border: `1px solid ${TOKENS.color.borderSubtle}`,
            borderRadius: TOKENS.radius.card,
            padding: '18px 20px',
          }}
        >
          <span
            style={{
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '0.06em',
              color: TOKENS.color.textMuted,
              display: 'block',
              marginBottom: 8,
              fontStyle: 'italic',
            }}
          >
            TONE OF VOICE
          </span>
          <div
            style={{
              paddingLeft: 14,
              borderLeft: `2px solid ${TOKENS.color.indigo}`,
              fontSize: 14.5,
              color: TOKENS.color.textSecondary,
              lineHeight: 1.6,
            }}
          >
            {cleanTone}
          </div>
        </div>
      ) : company.tone_of_voice ? (
        <EmptyInline label={PLACEHOLDER_LANG} />
      ) : null}

      {/* Core Services */}
      {coreServices.length > 0 && (
        <div>
          <SectionHeader label="Leistungen" dotColor={TOKENS.color.green} count={coreServices.length} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {coreServices.map((s, i) => (
              <span
                key={i}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 13,
                  padding: '5px 12px',
                  borderRadius: TOKENS.radius.pill,
                  background: TOKENS.color.indigoBgSubtle,
                  border: `1px solid ${TOKENS.color.indigoBorderSoft}`,
                  color: TOKENS.color.indigoLight,
                  fontWeight: 500,
                }}
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={TOKENS.color.green}
                  strokeWidth="3"
                  strokeLinecap="round"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Target Customers */}
      {cleanTargetCustomers ? (
        <div
          style={{
            background: TOKENS.color.bgCard,
            border: `1px solid ${TOKENS.color.borderSubtle}`,
            borderRadius: TOKENS.radius.card,
            padding: '18px 20px',
          }}
        >
          <SectionHeader label="Zielkunden" dotColor={TOKENS.color.textTertiary} />
          <p style={{ fontSize: 14.5, color: TOKENS.color.textSecondary, lineHeight: 1.6, margin: 0 }}>
            {cleanTargetCustomers}
          </p>
        </div>
      ) : company.target_customers ? (
        <EmptyInline label={PLACEHOLDER_LANG} />
      ) : null}

      {/* Website Highlights + Partner URLs */}
      {(cleanWebHighlights || partnerUrls.length > 0) && (
        <div
          style={{
            background: TOKENS.color.bgCard,
            border: `1px solid ${TOKENS.color.borderSubtle}`,
            borderRadius: TOKENS.radius.card,
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {cleanWebHighlights && (
            <>
              <SectionHeader label="Website-Highlights" dotColor={TOKENS.color.green} />
              <p style={{ fontSize: 14, color: TOKENS.color.textSecondary, lineHeight: 1.6, margin: 0 }}>
                {cleanWebHighlights}
              </p>
            </>
          )}
          {partnerUrls.length > 0 && (
            <div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  color: TOKENS.color.textMuted,
                  display: 'block',
                  marginBottom: 8,
                }}
              >
                PARTNER & KUNDEN
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {partnerUrls.map((url, i) => {
                  const domain = url
                    .replace(/^https?:\/\//, '')
                    .replace(/^www\./, '')
                    .replace(/\/$/, '');
                  return (
                    <a
                      key={i}
                      href={url.startsWith('http') ? url : `https://${url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: 12,
                        padding: '3px 10px',
                        borderRadius: TOKENS.radius.pill,
                        background: TOKENS.color.bgSubtle,
                        border: `1px solid ${TOKENS.color.borderSubtle}`,
                        color: TOKENS.color.textTertiary,
                        textDecoration: 'none',
                        transition: 'border-color 0.15s',
                      }}
                    >
                      {domain}
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Apollo Keywords (collapsible) */}
      {keywords.length > 0 && (
        <div
          style={{
            background: TOKENS.color.bgCard,
            border: `1px solid ${TOKENS.color.borderSubtle}`,
            borderRadius: TOKENS.radius.card,
            overflow: 'hidden',
          }}
        >
          <button
            onClick={() => setKeywordsOpen(!keywordsOpen)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontFamily: TOKENS.font.family,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', color: TOKENS.color.textMuted }}>
              APOLLO KEYWORDS ({keywords.length})
            </span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke={TOKENS.color.textMuted}
              strokeWidth="2"
              strokeLinecap="round"
              style={{ transform: keywordsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {keywordsOpen && (
            <div style={{ padding: '0 18px 14px', display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {keywords.map((kw, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 12,
                    padding: '3px 9px',
                    borderRadius: TOKENS.radius.chip,
                    background: TOKENS.color.bgSubtle,
                    border: `1px solid ${TOKENS.color.borderSubtle}`,
                    color: TOKENS.color.textTertiary,
                  }}
                >
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Responsive */}
      <style>{`
        @media (max-width: 720px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
