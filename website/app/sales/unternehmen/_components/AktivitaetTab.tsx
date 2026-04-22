'use client';

import { useMemo, useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { TOKENS } from '../_tokens';
import { buildActivityFeed } from '../_lib/activity-builder';
import type { ActivityEvent, LeadActivity } from '../_lib/activity-builder';
import { formatRelativeTime } from '../_lib/relative-time';
import type { Company, Contact } from '../_types';

const DOT_COLORS: Record<ActivityEvent['dotColor'], string> = {
  indigo: TOKENS.color.indigo,
  green: TOKENS.color.green,
  amber: TOKENS.color.amber,
  gray: TOKENS.color.textMuted,
};

const BADGE_STYLES: Record<string, { bg: string; border: string; color: string }> = {
  indigo: { bg: TOKENS.color.indigoBgSubtle, border: TOKENS.color.indigoBorderSoft, color: TOKENS.color.indigoLight },
  green: { bg: TOKENS.color.greenBg, border: TOKENS.color.greenBorder, color: TOKENS.color.green },
  amber: { bg: TOKENS.color.amberBg, border: TOKENS.color.amberBorder, color: TOKENS.color.amber },
  gray: { bg: TOKENS.color.bgSubtle, border: TOKENS.color.borderSubtle, color: TOKENS.color.textMuted },
};

function EventRow({ event, isLast }: { event: ActivityEvent; isLast: boolean }) {
  const dotColor = DOT_COLORS[event.dotColor];
  const badge = event.badge ? BADGE_STYLES[event.badge.color] : null;

  return (
    <div style={{ display: 'flex', gap: 14, position: 'relative' }}>
      {/* Vertical line + dot */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 14, flexShrink: 0 }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: dotColor,
            boxShadow: `0 0 0 3px ${dotColor}20, 0 0 8px ${dotColor}40`,
            flexShrink: 0,
            zIndex: 1,
            marginTop: 5,
          }}
        />
        {!isLast && (
          <div
            style={{
              width: 1.5,
              flex: 1,
              background: `linear-gradient(180deg, ${dotColor}40, ${TOKENS.color.borderSubtle})`,
              marginTop: 4,
            }}
          />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, paddingBottom: isLast ? 0 : 20, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: TOKENS.color.textPrimary }}>{event.title}</span>
          {event.badge && badge && (
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 500,
                padding: '2px 8px',
                borderRadius: TOKENS.radius.chip,
                background: badge.bg,
                border: `1px solid ${badge.border}`,
                color: badge.color,
                fontFamily: TOKENS.font.mono,
              }}
            >
              {event.badge.text}
            </span>
          )}
        </div>
        {event.subtitle && (
          <div style={{ fontSize: 12, color: TOKENS.color.textTertiary, marginBottom: 2 }}>{event.subtitle}</div>
        )}
        <div style={{ fontSize: 11.5, color: TOKENS.color.textMuted, fontFamily: TOKENS.font.mono }}>
          {formatRelativeTime(event.timestamp)}
        </div>
      </div>
    </div>
  );
}

export default function AktivitaetTab({ company, contacts }: { company: Company; contacts: Contact[] }) {
  const [dbActivities, setDbActivities] = useState<LeadActivity[]>([]);

  useEffect(() => {
    const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    sb.from('lead_activities')
      .select('id, type, title, content, created_at')
      .eq('lead_id', company.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setDbActivities(data as LeadActivity[]);
      });
  }, [company.id]);

  const events = useMemo(() => buildActivityFeed(company, contacts, dbActivities), [company, contacts, dbActivities]);

  if (events.length <= 1) {
    return (
      <div
        style={{
          padding: '48px 24px',
          borderRadius: TOKENS.radius.card,
          textAlign: 'center',
          border: `1.5px dashed ${TOKENS.color.indigoBorderSoft}`,
          background: TOKENS.color.indigoBgSubtle,
          fontFamily: TOKENS.font.family,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: TOKENS.radius.button,
            background: TOKENS.color.indigoBgSoft,
            border: `1px solid ${TOKENS.color.indigoBorderSoft}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
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
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        </div>
        <p style={{ fontSize: 14, fontWeight: 500, color: TOKENS.color.textPrimary, margin: '0 0 6px' }}>
          Noch wenig Aktivität
        </p>
        <p style={{ fontSize: 12.5, color: TOKENS.color.textTertiary, margin: 0, lineHeight: 1.5 }}>
          Nutze den Ansprechpartner-Tab um Kontakte anzureichern und Outreach zu starten.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: TOKENS.color.bgCard,
        border: `1px solid ${TOKENS.color.borderSubtle}`,
        borderRadius: TOKENS.radius.card,
        padding: '22px 24px',
        fontFamily: TOKENS.font.family,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: TOKENS.color.indigo }} />
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.06em',
            color: TOKENS.color.textMuted,
            textTransform: 'uppercase' as const,
          }}
        >
          TIMELINE
        </span>
        <span
          style={{
            fontSize: 9,
            fontWeight: 500,
            padding: '1px 6px',
            borderRadius: 4,
            background: TOKENS.color.indigoBgSubtle,
            color: TOKENS.color.indigoLight,
            fontFamily: TOKENS.font.mono,
          }}
        >
          {events.length}
        </span>
      </div>

      {events.map((event, i) => (
        <EventRow key={event.id} event={event} isLast={i === events.length - 1} />
      ))}
    </div>
  );
}
