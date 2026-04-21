'use client';

import { TOKENS } from '../_tokens';
import { PLACEHOLDER_LANG } from '../_lib/language-guard';
import EmptyInline from './EmptyInline';

const KNOWN_TOOLS = new Set([
  'Shopify',
  'WooCommerce',
  'JTL',
  'Salesforce',
  'HubSpot',
  'Magento',
  'SAP',
  'Zendesk',
  'Slack',
  'Stripe',
]);

function CardShell({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div
      style={{
        background: TOKENS.color.bgCard,
        border: `1px solid ${TOKENS.color.borderSubtle}`,
        borderRadius: TOKENS.radius.card,
        padding: '20px 22px',
        fontFamily: TOKENS.font.family,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
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
      {children}
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <span style={{ fontSize: 12, color: TOKENS.color.textMuted, fontStyle: 'italic' }}>{text}</span>;
}

// ─── AUTOMATION ─────────────────────────────────────────────────────────────

function AutomationCard({ items }: { items: string[] | null }) {
  return (
    <CardShell label="Verkaufsansätze">
      {!items || items.length === 0 ? (
        <EmptyInline label={PLACEHOLDER_LANG} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                padding: '10px 12px',
                borderRadius: 8,
                background: TOKENS.color.indigoBgSubtle,
                border: `0.5px solid ${TOKENS.color.indigoBorderSoft}`,
              }}
            >
              <span
                style={{
                  minWidth: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: TOKENS.color.indigoBgSoft,
                  border: `1px solid ${TOKENS.color.indigoBorderSoft}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 700,
                  color: TOKENS.color.indigoLight,
                  fontFamily: TOKENS.font.mono,
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                {i + 1}
              </span>
              <span style={{ fontSize: 13.5, color: TOKENS.color.textSecondary, lineHeight: 1.55 }}>{item}</span>
            </div>
          ))}
        </div>
      )}
    </CardShell>
  );
}

// ─── GROWTH SIGNALS ─────────────────────────────────────────────────────────

function GrowthCard({ items }: { items: string[] | null }) {
  return (
    <CardShell label="Wachstums-Signale">
      {!items || items.length === 0 ? (
        <EmptyInline label={PLACEHOLDER_LANG} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
                padding: '9px 12px',
                borderRadius: 8,
                background: 'rgba(52,211,153,0.04)',
                border: `0.5px solid rgba(52,211,153,0.15)`,
                borderLeft: `2px solid ${TOKENS.color.green}`,
              }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke={TOKENS.color.green}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0, marginTop: 2 }}
              >
                <path d="M18 20V10M12 20V4M6 20v-6" />
              </svg>
              <span style={{ fontSize: 13.5, color: TOKENS.color.textSecondary, lineHeight: 1.55 }}>{item}</span>
            </div>
          ))}
        </div>
      )}
    </CardShell>
  );
}

// ─── TECH + HOOKS ───────────────────────────────────────────────────────────

function TechCard({ techStack, hooks }: { techStack: string[] | null; hooks: string[] | null }) {
  return (
    <CardShell label="Tech-Stack">
      {!techStack || techStack.length === 0 ? (
        <EmptyInline label={PLACEHOLDER_LANG} />
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {techStack.map((t) => {
            const known = KNOWN_TOOLS.has(t);
            return (
              <span
                key={t}
                style={{
                  fontSize: 12,
                  padding: '3px 8px',
                  borderRadius: TOKENS.radius.chip,
                  background: known ? TOKENS.color.indigoBgSubtle : TOKENS.color.bgSubtle,
                  border: `1px solid ${known ? TOKENS.color.indigoBorderSoft : TOKENS.color.borderSubtle}`,
                  color: known ? TOKENS.color.indigoLight : TOKENS.color.textTertiary,
                  fontWeight: known ? 500 : 400,
                }}
              >
                {t}
              </span>
            );
          })}
        </div>
      )}

      {/* Separator + Personalization hooks */}
      {hooks && hooks.length > 0 && (
        <>
          <div style={{ height: 0, borderTop: `0.5px solid ${TOKENS.color.borderSubtle}`, marginTop: 4 }} />
          <div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.06em',
                color: TOKENS.color.textMuted,
                textTransform: 'uppercase' as const,
                display: 'block',
                marginBottom: 6,
              }}
            >
              PERSONALISIERUNGS-HOOKS
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {hooks.map((h, i) => (
                <div
                  key={i}
                  style={{
                    padding: '8px 12px',
                    background: TOKENS.color.indigoBgSubtle,
                    border: `0.5px solid ${TOKENS.color.indigoBorderSoft}`,
                    borderLeft: `2px solid ${TOKENS.color.indigo}`,
                    borderRadius: '0 8px 8px 0',
                    fontSize: 13.5,
                    lineHeight: 1.5,
                    color: TOKENS.color.textSecondary,
                  }}
                >
                  {h}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </CardShell>
  );
}

// ─── COMBINED ───────────────────────────────────────────────────────────────

export default function InsightsTripleCard({
  automationOpportunities,
  growthSignals,
  techStack,
  personalizationHooks,
}: {
  automationOpportunities: string[] | null;
  growthSignals: string[] | null;
  techStack: string[] | null;
  personalizationHooks: string[] | null;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12,
        alignItems: 'start',
      }}
    >
      <AutomationCard items={automationOpportunities} />
      <GrowthCard items={growthSignals} />
      <TechCard techStack={techStack} hooks={personalizationHooks} />
    </div>
  );
}
