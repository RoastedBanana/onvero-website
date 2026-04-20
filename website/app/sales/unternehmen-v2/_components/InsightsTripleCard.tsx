'use client';

import { TOKENS } from '../_tokens';

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
          fontSize: 10,
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
    <CardShell label="Automatisierungs-Chancen">
      {!items || items.length === 0 ? (
        <EmptyHint text="Noch nicht analysiert" />
      ) : (
        <ol
          style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {items.map((item, i) => (
            <li
              key={i}
              style={{
                display: 'flex',
                gap: 10,
                fontSize: 12.5,
                color: TOKENS.color.textSecondary,
                lineHeight: 1.5,
                paddingLeft: 10,
                borderLeft: `2px solid ${TOKENS.color.indigoBorderSoft}`,
              }}
            >
              <span style={{ color: TOKENS.color.indigo, fontFamily: TOKENS.font.mono, fontSize: 11, flexShrink: 0 }}>
                {i + 1}.
              </span>
              {item}
            </li>
          ))}
        </ol>
      )}
    </CardShell>
  );
}

// ─── GROWTH SIGNALS ─────────────────────────────────────────────────────────

function GrowthCard({ items }: { items: string[] | null }) {
  return (
    <CardShell label="Wachstums-Signale">
      {!items || items.length === 0 ? (
        <EmptyHint text="Noch keine Signale erkannt" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: TOKENS.color.green,
                  marginTop: 6,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 12.5, color: TOKENS.color.textSecondary, lineHeight: 1.5 }}>{item}</span>
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
        <EmptyHint text="\u2014" />
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {techStack.map((t) => {
            const known = KNOWN_TOOLS.has(t);
            return (
              <span
                key={t}
                style={{
                  fontSize: 10.5,
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
                fontSize: 10,
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
            <p style={{ fontSize: 12, color: TOKENS.color.textTertiary, lineHeight: 1.55, margin: 0 }}>
              {hooks.join(', ')}
            </p>
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
      }}
    >
      <AutomationCard items={automationOpportunities} />
      <GrowthCard items={growthSignals} />
      <TechCard techStack={techStack} hooks={personalizationHooks} />
    </div>
  );
}
