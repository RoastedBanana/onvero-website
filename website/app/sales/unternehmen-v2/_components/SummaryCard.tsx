'use client';

import { TOKENS } from '../_tokens';
import { sanitizeForDisplay, PLACEHOLDER_LANG } from '../_lib/language-guard';
import EmptyInline from './EmptyInline';

function SectionLabel({ label, dotColor }: { label: string; dotColor: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
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
    </div>
  );
}

function ChipList({
  items,
  color,
  bgColor,
  borderColor,
}: {
  items: string[];
  color: string;
  bgColor: string;
  borderColor: string;
}) {
  if (items.length === 0) {
    return <span style={{ fontSize: 12, color: TOKENS.color.textMuted, fontStyle: 'italic' }}>Keine Einträge</span>;
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {items.map((item, i) => {
        const cleaned = item.replace(
          /^[\u2705\u26A0\uFE0F\uD83D\uDD25\u274C\u2714\u2716\u26A1\u2B50\uD83D\uDCA1\uD83D\uDCCA\uD83C\uDFAF]\s*/u,
          ''
        );
        return (
          <span
            key={i}
            style={{
              fontSize: 11.5,
              padding: '4px 10px',
              borderRadius: TOKENS.radius.pill,
              background: bgColor,
              border: `1px solid ${borderColor}`,
              color,
              lineHeight: 1.4,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
            {cleaned}
          </span>
        );
      })}
    </div>
  );
}

export default function SummaryCard({
  summary,
  apolloDescription,
  strengths,
  concerns,
}: {
  summary: string | null;
  apolloDescription: string | null;
  strengths: string[] | null;
  concerns: string[] | null;
}) {
  const cleanSummary = sanitizeForDisplay(summary);
  const cleanDesc = sanitizeForDisplay(apolloDescription);
  const text = cleanSummary ?? cleanDesc ?? null;
  const hasEnglishSource = !text && (summary || apolloDescription);

  return (
    <div
      style={{
        background: TOKENS.color.bgCard,
        border: `1px solid ${TOKENS.color.borderSubtle}`,
        borderRadius: TOKENS.radius.card,
        padding: '22px 24px',
        fontFamily: TOKENS.font.family,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      {/* Summary */}
      <div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.06em',
            color: TOKENS.color.textMuted,
            textTransform: 'uppercase' as const,
            display: 'block',
            marginBottom: 10,
          }}
        >
          ZUSAMMENFASSUNG
        </span>
        {text ? (
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.65,
              color: TOKENS.color.textSecondary,
              margin: 0,
            }}
          >
            {text}
          </p>
        ) : hasEnglishSource ? (
          <EmptyInline label={PLACEHOLDER_LANG} />
        ) : (
          <p style={{ fontSize: 13, color: TOKENS.color.textMuted, fontStyle: 'italic', margin: 0 }}>
            Noch nicht analysiert
          </p>
        )}
      </div>

      {/* Strengths / Concerns grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          <SectionLabel label="Stärken" dotColor={TOKENS.color.warm} />
          <ChipList
            items={strengths ?? []}
            color={TOKENS.color.warm}
            bgColor={TOKENS.color.warmBg}
            borderColor={TOKENS.color.warmBorder}
          />
        </div>
        <div>
          <SectionLabel label="Bedenken" dotColor={TOKENS.color.amberDot} />
          <ChipList
            items={concerns ?? []}
            color={TOKENS.color.amber}
            bgColor={TOKENS.color.amberBg}
            borderColor={TOKENS.color.amberBorder}
          />
        </div>
      </div>
    </div>
  );
}
