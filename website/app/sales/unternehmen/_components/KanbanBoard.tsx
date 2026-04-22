'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { TOKENS } from '../_tokens';
import { fmt } from '../_lib/formatters';
import type { CompanyWithContacts } from '../_hooks/useCompanies';
import type { CompanyStatus } from '../_types';

// ─── COLUMN CONFIG ───────────────────────────────────────────────────────────

const COLUMNS: { key: CompanyStatus; label: string; dotColor: string; activeBorder: string }[] = [
  {
    key: 'new',
    label: 'Neu',
    dotColor: TOKENS.color.textMuted,
    activeBorder: TOKENS.color.borderSubtle,
  },
  {
    key: 'contacted',
    label: 'In Kontakt',
    dotColor: TOKENS.color.indigo,
    activeBorder: 'rgba(107,122,255,0.5)',
  },
  {
    key: 'qualified',
    label: 'Qualifiziert',
    dotColor: TOKENS.color.warm,
    activeBorder: 'rgba(245,169,127,0.5)',
  },
  {
    key: 'lost',
    label: 'Verloren',
    dotColor: 'rgba(239,68,68,0.55)',
    activeBorder: 'rgba(239,68,68,0.3)',
  },
];

// ─── MINI SCORE RING ─────────────────────────────────────────────────────────

function MiniRing({ score }: { score: number | null }) {
  const s = fmt.score(score);
  const size = 42;
  const stroke = 3.5;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - s.value / 100);
  const ringColor =
    s.value >= 70 ? TOKENS.color.indigo : s.value >= 40 ? 'rgba(107,122,255,0.55)' : TOKENS.color.borderSubtle;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={TOKENS.color.bgSubtle} strokeWidth={stroke} />
        {s.value > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={ringColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
          />
        )}
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 600,
          fontFamily: TOKENS.font.mono,
          color: s.value > 0 ? TOKENS.color.textPrimary : TOKENS.color.textMuted,
        }}
      >
        {s.display}
      </div>
    </div>
  );
}

// ─── TIER PILL ───────────────────────────────────────────────────────────────

function TierPill({ tier }: { tier: string }) {
  const styles: React.CSSProperties =
    tier === 'HOT'
      ? { background: 'rgba(107,122,255,0.14)', color: '#c4cdff', border: '0.5px solid rgba(107,122,255,0.4)' }
      : tier === 'WARM'
        ? {
            background: 'rgba(245,169,127,0.10)',
            color: TOKENS.color.warm,
            border: '0.5px solid rgba(245,169,127,0.30)',
          }
        : {
            background: 'rgba(147,197,253,0.06)',
            color: 'rgba(147,197,253,0.75)',
            border: '0.5px solid rgba(147,197,253,0.20)',
          };
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.04em',
        padding: '2px 7px',
        borderRadius: TOKENS.radius.chip,
        ...styles,
      }}
    >
      {tier}
    </span>
  );
}

// ─── KANBAN CARD ─────────────────────────────────────────────────────────────

function KanbanCard({
  company: c,
  isDragging,
  onDragStart,
  onDragEnd,
  onClick,
  selected,
  onToggle,
}: {
  company: CompanyWithContacts;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onClick: () => void;
  selected?: boolean;
  onToggle?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const tier = fmt.tier(c.tier);
  const domain = fmt.domain(c.website, c.primary_domain);
  const location = fmt.countryCity(c.country, c.city);
  const employees = c.estimated_num_employees ? fmt.employees(c.estimated_num_employees) : null;
  const summary = c.summary ?? c.apollo_short_description ?? null;

  const borderColor = selected
    ? 'rgba(107,122,255,0.45)'
    : tier === 'HOT'
      ? 'rgba(107,122,255,0.35)'
      : TOKENS.color.borderSubtle;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        backgroundColor: isDragging
          ? 'transparent'
          : selected
            ? TOKENS.color.indigoBgSubtle
            : hovered
              ? TOKENS.color.bgSubtle
              : TOKENS.color.bgCard,
        border: `0.5px solid ${borderColor}`,
        borderRadius: TOKENS.radius.card,
        padding: '14px 16px',
        cursor: isDragging ? 'grabbing' : 'grab',
        fontFamily: TOKENS.font.family,
        opacity: isDragging ? 0.35 : 1,
        transition: 'background 0.15s, transform 0.15s, opacity 0.15s',
        transform: hovered && !isDragging ? 'translateY(-1px)' : 'none',
        boxShadow: hovered && !isDragging ? '0 4px 14px rgba(0,0,0,0.18)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 11,
      }}
    >
      {/* Checkbox — visible when selected or when hovered with onToggle provided */}
      {(selected || (hovered && onToggle)) && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onToggle?.();
          }}
          style={{ position: 'absolute', top: 12, left: 12, zIndex: 2 }}
        >
          <input
            type="checkbox"
            checked={!!selected}
            onChange={() => {}}
            style={{ accentColor: TOKENS.color.indigo, cursor: 'pointer', width: 14, height: 14 }}
          />
        </div>
      )}

      {/* Header: logo + name + ring */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
        {c.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={c.logo_url}
            alt=""
            style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              objectFit: 'contain',
              background: '#fff',
              flexShrink: 0,
              border: `1px solid ${TOKENS.color.borderSubtle}`,
            }}
          />
        ) : (
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              background: TOKENS.color.indigoBgSoft,
              border: `1px solid ${TOKENS.color.indigoBorderSoft}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 600,
              color: TOKENS.color.indigoLight,
              flexShrink: 0,
            }}
          >
            {fmt.initials(c.company_name)}
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: TOKENS.color.textPrimary,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.2,
            }}
          >
            {fmt.text(c.company_name, 'Unbenannt')}
          </div>
          {domain !== '\u2014' && (
            <div
              style={{
                fontSize: 12,
                color: TOKENS.color.textMuted,
                marginTop: 3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {domain}
            </div>
          )}
        </div>

        <MiniRing score={c.fit_score} />
      </div>

      {/* Summary snippet */}
      {summary && (
        <div
          style={{
            fontSize: 12.5,
            color: TOKENS.color.textTertiary,
            lineHeight: 1.55,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as const,
            overflow: 'hidden',
          }}
        >
          {summary}
        </div>
      )}

      {/* Meta row: employees · location · revenue */}
      {(employees || location !== '\u2014' || c.annual_revenue_printed) && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '3px 14px',
            paddingTop: 8,
            borderTop: `0.5px solid ${TOKENS.color.borderSubtle}`,
          }}
        >
          {employees && (
            <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 10, color: TOKENS.color.textMuted, fontWeight: 500, letterSpacing: '0.03em' }}>
                MA
              </span>
              <span style={{ fontSize: 12, color: TOKENS.color.textSecondary, fontFamily: TOKENS.font.mono }}>
                {employees}
              </span>
            </span>
          )}
          {location !== '\u2014' && (
            <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 10, color: TOKENS.color.textMuted, fontWeight: 500, letterSpacing: '0.03em' }}>
                ORT
              </span>
              <span style={{ fontSize: 12, color: TOKENS.color.textSecondary }}>{location}</span>
            </span>
          )}
          {c.annual_revenue_printed && (
            <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 10, color: TOKENS.color.textMuted, fontWeight: 500, letterSpacing: '0.03em' }}>
                UMSATZ
              </span>
              <span style={{ fontSize: 12, color: TOKENS.color.warm, fontFamily: TOKENS.font.mono }}>
                {c.annual_revenue_printed}
              </span>
            </span>
          )}
          {c.enriched_contacts_count > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 10, color: TOKENS.color.textMuted, fontWeight: 500, letterSpacing: '0.03em' }}>
                KONTAKTE
              </span>
              <span style={{ fontSize: 12, color: TOKENS.color.indigoLight, fontFamily: TOKENS.font.mono }}>
                {c.enriched_contacts_count}
              </span>
            </span>
          )}
        </div>
      )}

      {/* Chips: tier + industry */}
      {(tier !== 'UNRATED' || c.industry) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {tier !== 'UNRATED' && <TierPill tier={tier} />}
          {c.industry && (
            <span
              style={{
                fontSize: 11,
                padding: '3px 8px',
                borderRadius: TOKENS.radius.chip,
                background: TOKENS.color.bgSubtle,
                border: `1px solid ${TOKENS.color.borderSubtle}`,
                color: TOKENS.color.textMuted,
              }}
            >
              {fmt.industry(c.industry)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── KANBAN BOARD ────────────────────────────────────────────────────────────

export default function KanbanBoard({
  companies,
  onStatusChange,
  selected,
  onToggle,
}: {
  companies: CompanyWithContacts[];
  onStatusChange: (id: string, status: CompanyStatus) => void;
  selected?: Set<string>;
  onToggle?: (id: string) => void;
}) {
  const router = useRouter();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<CompanyStatus | null>(null);
  const dragCounters = useRef<Partial<Record<CompanyStatus, number>>>({});

  const byStatus = (status: CompanyStatus) => companies.filter((c) => (c.status ?? 'new') === status);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12,
        alignItems: 'flex-start',
        fontFamily: TOKENS.font.family,
      }}
    >
      {COLUMNS.map((col) => {
        const items = byStatus(col.key);
        const isOver = overCol === col.key && dragId !== null;

        return (
          <div
            key={col.key}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={(e) => {
              e.preventDefault();
              dragCounters.current[col.key] = (dragCounters.current[col.key] ?? 0) + 1;
              setOverCol(col.key);
            }}
            onDragLeave={() => {
              const c = Math.max(0, (dragCounters.current[col.key] ?? 1) - 1);
              dragCounters.current[col.key] = c;
              if (c === 0) setOverCol(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              dragCounters.current[col.key] = 0;
              setOverCol(null);
              if (dragId) {
                onStatusChange(dragId, col.key);
                setDragId(null);
              }
            }}
            style={{
              minWidth: 0,
              background: isOver ? TOKENS.color.indigoBgSubtle : TOKENS.color.bgSubtle,
              border: `1px solid ${isOver ? col.activeBorder : TOKENS.color.borderSubtle}`,
              borderRadius: TOKENS.radius.cardLarge,
              padding: '14px 12px',
              transition: 'background 0.15s, border-color 0.15s',
              minHeight: 120,
            }}
          >
            {/* Column header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: isOver ? col.activeBorder : col.dotColor,
                  flexShrink: 0,
                  transition: 'background 0.15s',
                }}
              />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: TOKENS.color.textSecondary,
                  letterSpacing: '0.01em',
                }}
              >
                {col.label}
              </span>
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: 11,
                  fontWeight: 500,
                  fontFamily: TOKENS.font.mono,
                  padding: '1px 7px',
                  borderRadius: 4,
                  background: TOKENS.color.bgCard,
                  color: TOKENS.color.textMuted,
                }}
              >
                {items.length}
              </span>
            </div>

            {/* Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map((c) => (
                <KanbanCard
                  key={c.id}
                  company={c}
                  isDragging={dragId === c.id}
                  onDragStart={() => setDragId(c.id)}
                  onDragEnd={() => setDragId(null)}
                  onClick={() => router.push(`/sales/unternehmen/${c.id}?tab=uebersicht`)}
                  selected={selected?.has(c.id)}
                  onToggle={onToggle ? () => onToggle(c.id) : undefined}
                />
              ))}

              {/* Drop hint when dragging over empty column */}
              {isOver && items.length === 0 && (
                <div
                  style={{
                    padding: '20px 0',
                    textAlign: 'center',
                    fontSize: 12,
                    color: col.dotColor,
                    border: `1.5px dashed ${col.activeBorder}`,
                    borderRadius: TOKENS.radius.card,
                  }}
                >
                  Hier ablegen
                </div>
              )}

              {!isOver && items.length === 0 && (
                <div
                  style={{
                    padding: '24px 0',
                    textAlign: 'center',
                    fontSize: 12,
                    color: TOKENS.color.textMuted,
                    fontStyle: 'italic',
                  }}
                >
                  Keine Einträge
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
