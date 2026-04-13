'use client';

import { useState, useMemo } from 'react';
import { C, SvgIcon, ICONS, StatusBadge, showToast } from '../_shared';
import { deleteMeeting } from './_meeting-store';
import type { Meeting } from './_meeting-store';

// ─── TYPES ──────────────────────────────────────────────────────────────────

type SortKey = 'date' | 'duration' | 'company';
type FilterType = 'all' | 'Video' | 'Telefon' | 'Vor Ort';

const TYPE_STYLES: Record<string, { color: string; icon: string }> = {
  Video: { color: '#818CF8', icon: ICONS.play },
  'Vor Ort': { color: '#34D399', icon: ICONS.globe },
  Telefon: { color: '#FBBF24', icon: ICONS.mic },
};

// ─── MOCK ARCHIVED MEETINGS ────────────────────────────────────────────────

const MOCK_ARCHIVE: Meeting[] = [
  {
    id: 'arch-1',
    leadId: '',
    leadName: 'Clara Wolff',
    company: 'Silo Labs',
    contact: 'Clara Wolff',
    title: 'Erstgespräch',
    type: 'Video',
    status: 'Abgeschlossen',
    date: '2026-04-07',
    time: '11:00',
    duration: 32,
    phases: [],
    notes: '',
    product: '',
    createdAt: '2026-04-07T11:00:00Z',
    summary:
      'Clara sucht eine Lösung für Lead-Qualifizierung. Aktuell nutzen sie nur Excel. Budget vorhanden, Entscheidung Q2.',
    aiInsights: ['Hohe Kaufbereitschaft erkannt', 'Budget-Signal: Q2 Entscheidung', 'Nächster Schritt: Demo anbieten'],
  },
  {
    id: 'arch-2',
    leadId: '',
    leadName: 'Jonas Braun',
    company: 'Deepmark',
    contact: 'Jonas Braun',
    title: 'Produktdemo',
    type: 'Video',
    status: 'Abgeschlossen',
    date: '2026-04-05',
    time: '14:30',
    duration: 48,
    phases: [],
    notes: '',
    product: '',
    createdAt: '2026-04-05T14:30:00Z',
    summary:
      'Jonas war beeindruckt von der KI-Scoring-Funktion. Bedenken: Datenschutz und DSGVO-Konformität. Will intern abstimmen.',
    aiInsights: ['Bedenken: DSGVO-Konformität', 'Champion identifiziert: Jonas', 'Blocker: Interne Abstimmung nötig'],
  },
  {
    id: 'arch-3',
    leadId: '',
    leadName: 'Elena Hartmann',
    company: 'Kairon Medical',
    contact: 'Elena Hartmann',
    title: 'Quarterly Review',
    type: 'Vor Ort',
    status: 'Abgeschlossen',
    date: '2026-04-02',
    time: '10:00',
    duration: 55,
    phases: [],
    notes: '',
    product: '',
    createdAt: '2026-04-02T10:00:00Z',
    summary: 'Bestandskunde. Zufrieden mit der Plattform, möchte Outreach-Modul testen. Upsell-Potenzial €3.000/Monat.',
    aiInsights: ['Upsell-Potenzial: €3.000/Mo', 'Stimmung: Sehr positiv', 'Action: Outreach-Modul Demo planen'],
  },
  {
    id: 'arch-4',
    leadId: '',
    leadName: 'Marcus Weber',
    company: 'Stackbase GmbH',
    contact: 'Marcus Weber',
    title: 'Discovery Call',
    type: 'Telefon',
    status: 'Abgeschlossen',
    date: '2026-03-28',
    time: '09:00',
    duration: 22,
    phases: [],
    notes: '',
    product: '',
    createdAt: '2026-03-28T09:00:00Z',
    summary:
      'Marcus interessiert sich für Automatisierung seiner Outbound-Prozesse. Aktuell manuell per Excel. Team von 5 Sales-Mitarbeitern.',
    aiInsights: ['Pain Point: Manuelle Prozesse', 'Team-Größe: 5 Sales', 'Budget: Noch unklar'],
  },
];

// ─── COMPONENT ──────────────────────────────────────────────────────────────

export default function ArchiveView({ meetings }: { meetings: Meeting[] }) {
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Combine real completed meetings with mock archive
  const allArchived = useMemo(() => {
    const completed = meetings.filter((m) => m.status === 'Abgeschlossen');
    return [...completed, ...MOCK_ARCHIVE];
  }, [meetings]);

  const filtered = useMemo(() => {
    let result = allArchived;

    // Search
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.company.toLowerCase().includes(q) ||
          m.contact.toLowerCase().includes(q) ||
          (m.summary?.toLowerCase().includes(q) ?? false) ||
          (m.aiInsights?.some((i) => i.toLowerCase().includes(q)) ?? false)
      );
    }

    // Filter
    if (filterType !== 'all') {
      result = result.filter((m) => m.type === filterType);
    }

    // Sort
    result.sort((a, b) => {
      if (sortKey === 'date') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortKey === 'duration') return b.duration - a.duration;
      return a.company.localeCompare(b.company);
    });

    return result;
  }, [allArchived, query, filterType, sortKey]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Search & Filters */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          animation: 'fadeInUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
        }}
      >
        {/* Search */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '9px 14px',
            borderRadius: 9,
            background: C.surface,
            border: `1px solid ${C.border}`,
          }}
        >
          <SvgIcon d={ICONS.search} size={14} color={C.text3} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Meetings durchsuchen…"
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
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}
            >
              <SvgIcon d={ICONS.x} size={12} color={C.text3} />
            </button>
          )}
        </div>

        {/* Type Filter */}
        <div
          style={{
            display: 'flex',
            gap: 2,
            padding: 2,
            borderRadius: 8,
            background: 'rgba(255,255,255,0.02)',
            border: `1px solid ${C.border}`,
          }}
        >
          {(['all', 'Video', 'Telefon', 'Vor Ort'] as FilterType[]).map((t) => {
            const active = filterType === t;
            return (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className="s-tab"
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: 'none',
                  background: active ? C.accentGhost : 'transparent',
                  color: active ? C.accentBright : C.text3,
                  fontSize: 11,
                  fontWeight: active ? 500 : 400,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {t === 'all' ? 'Alle' : t}
              </button>
            );
          })}
        </div>

        {/* Sort */}
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            background: C.surface,
            border: `1px solid ${C.border}`,
            color: C.text2,
            fontSize: 11,
            fontFamily: 'inherit',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="date">Neueste zuerst</option>
          <option value="duration">Längste zuerst</option>
          <option value="company">Firma A–Z</option>
        </select>
      </div>

      {/* Results count */}
      <div style={{ fontSize: 11, color: C.text3, paddingLeft: 2 }}>
        {filtered.length} Meeting{filtered.length !== 1 ? 's' : ''} im Archiv
        {query && ` für "${query}"`}
      </div>

      {/* Meeting Cards */}
      {filtered.length === 0 ? (
        <div
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            borderRadius: 12,
            background: C.surface,
            border: `1px solid ${C.border}`,
          }}
        >
          <SvgIcon d={ICONS.search} size={24} color={C.text3} />
          <p style={{ fontSize: 13, color: C.text3, marginTop: 12 }}>Keine Meetings gefunden.</p>
        </div>
      ) : (
        filtered.map((m, i) => {
          const ts = TYPE_STYLES[m.type] ?? TYPE_STYLES.Video;
          const isExpanded = expandedId === m.id;
          const dateLabel = new Date(m.date).toLocaleDateString('de-DE', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });

          return (
            <div
              key={m.id}
              className="s-bento"
              onClick={() => setExpandedId(isExpanded ? null : m.id)}
              style={{
                background: C.surface,
                border: `1px solid ${isExpanded ? C.borderAccent : C.border}`,
                borderRadius: 12,
                padding: '22px 24px',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                boxShadow: '0 2px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
                animation: 'fadeInUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
                animationDelay: `${0.05 + i * 0.04}s`,
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: `${ts.color}08`,
                      border: `1px solid ${ts.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <SvgIcon d={ts.icon} size={16} color={ts.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: C.text1 }}>{m.title}</div>
                    <div
                      style={{
                        fontSize: 11.5,
                        color: C.text3,
                        marginTop: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      <span>{m.contact}</span>
                      <span style={{ opacity: 0.25, fontSize: 8 }}>●</span>
                      <span>{m.company}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, color: C.text3, fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>
                    {m.duration} min
                  </span>
                  <span style={{ fontSize: 11, color: C.text3 }}>{dateLabel}</span>
                  <div
                    style={{
                      padding: '3px 8px',
                      borderRadius: 5,
                      background: `${ts.color}08`,
                      border: `1px solid ${ts.color}15`,
                    }}
                  >
                    <span style={{ fontSize: 10, fontWeight: 500, color: ts.color }}>{m.type}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMeeting(m.id);
                      showToast('Meeting gelöscht', 'info');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 4,
                      display: 'flex',
                      opacity: 0.25,
                      transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '0.25';
                    }}
                    title="Meeting löschen"
                  >
                    <SvgIcon d={ICONS.x} size={13} color={C.danger} />
                  </button>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div
                  style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.border}` }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Summary */}
                  {m.summary && (
                    <div
                      style={{
                        padding: '14px 16px',
                        borderRadius: 9,
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        marginBottom: 14,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 500,
                          color: C.text3,
                          letterSpacing: '0.06em',
                          marginBottom: 6,
                        }}
                      >
                        ZUSAMMENFASSUNG
                      </div>
                      <div style={{ fontSize: 12.5, color: C.text2, lineHeight: 1.65 }}>{m.summary}</div>
                    </div>
                  )}

                  {/* AI Insights */}
                  {m.aiInsights && m.aiInsights.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {m.aiInsights.map((insight) => (
                        <div
                          key={insight}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '5px 12px',
                            borderRadius: 7,
                            background: 'rgba(99,102,241,0.05)',
                            border: '1px solid rgba(99,102,241,0.1)',
                          }}
                        >
                          <SvgIcon d={ICONS.spark} size={10} color={C.accent} />
                          <span style={{ fontSize: 11, color: C.accentBright }}>{insight}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Notes */}
                  {m.notes && (
                    <div
                      style={{
                        marginTop: 12,
                        padding: '12px 14px',
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.02)',
                        border: `1px solid ${C.border}`,
                      }}
                    >
                      <div style={{ fontSize: 10, color: C.text3, letterSpacing: '0.04em', marginBottom: 6 }}>
                        NOTIZEN
                      </div>
                      <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {m.notes}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
