'use client';

import { useState } from 'react';
import { C, SvgIcon, ICONS } from './_shared';
import { useActivities, formatActivityTime, getActivityStyle } from './_activities';
import type { Lead } from './_lead-data';

// ─── COLLAPSIBLE WRAPPER ─────────────────────────────────────────────────────

function Collapsible({
  title,
  icon,
  color,
  count,
  children,
}: {
  title: string;
  icon: string;
  color: string;
  count?: number;
  children: (animKey: number) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  function toggle() {
    if (!open) setAnimKey((k) => k + 1); // re-trigger animations each time we open
    setOpen(!open);
  }

  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: '0 2px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      <button
        onClick={toggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 22px',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: `${color}12`,
              border: `1px solid ${color}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SvgIcon d={icon} size={13} color={color} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: C.text1 }}>{title}</span>
          {count !== undefined && (
            <span
              style={{
                fontSize: 10,
                color: C.text3,
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                padding: '1px 7px',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.04)',
              }}
            >
              {count}
            </span>
          )}
        </div>
        <svg
          width={12}
          height={12}
          viewBox="0 0 24 24"
          fill="none"
          stroke={C.text3}
          strokeWidth={2}
          strokeLinecap="round"
          style={{
            transition: 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div
          style={{
            padding: '20px 22px',
            borderTop: `1px solid ${C.border}`,
          }}
        >
          {children(animKey)}
        </div>
      )}
    </div>
  );
}

// ─── CAREER SECTION ──────────────────────────────────────────────────────────

export function CareerSection({ entries }: { entries: Lead['employmentHistory'] }) {
  const sorted = [...entries].sort((a, b) => {
    if (a.current && !b.current) return -1;
    if (!a.current && b.current) return 1;
    if (!a.startDate && !b.startDate) return 0;
    if (!a.startDate) return 1;
    if (!b.startDate) return -1;
    return b.startDate.localeCompare(a.startDate);
  });

  const durations = sorted.map((e) => {
    if (!e.startDate) return 0;
    const start = new Date(e.startDate);
    const end = e.current ? new Date() : e.endDate ? new Date(e.endDate) : new Date();
    return Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  });
  const maxDuration = Math.max(...durations, 1);
  const total = sorted.length;

  return (
    <Collapsible title="Berufsverlauf" icon={ICONS.trending} color="#A78BFA" count={total}>
      {(animKey) => (
        <div key={animKey} style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }}>
          {/* Vertical connector — glows from top, animated */}
          <div
            style={{
              position: 'absolute',
              left: 11,
              top: 20,
              bottom: 20,
              width: 2,
              borderRadius: 1,
              background: `linear-gradient(180deg, ${C.accent}50, ${C.accent}15, ${C.border}, transparent)`,
              animation: `fadeIn 0.6s ease both`,
            }}
          />

          {sorted.map((entry, i) => {
            const startStr = entry.startDate
              ? new Date(entry.startDate).toLocaleDateString('de-DE', { month: 'short', year: 'numeric' })
              : null;
            const endStr = entry.current
              ? 'Heute'
              : entry.endDate
                ? new Date(entry.endDate).toLocaleDateString('de-DE', { month: 'short', year: 'numeric' })
                : null;
            const months = durations[i];
            const years = Math.floor(months / 12);
            const rm = months % 12;
            const durationStr = months > 0 ? (years > 0 ? `${years} J.${rm > 0 ? ` ${rm} M.` : ''}` : `${rm} M.`) : '';
            const barPct = (months / maxDuration) * 100;
            const isFirst = i === 0;

            // Animation: dots light up from BOTTOM to TOP
            // So last item animates first, first item last
            const reverseI = total - 1 - i;
            const dotDelay = reverseI * 0.08;
            const cardDelay = reverseI * 0.08 + 0.05;

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 14,
                  padding: '2px 0',
                }}
              >
                {/* Dot — animates from bottom up */}
                <div
                  style={{
                    width: 24,
                    display: 'flex',
                    justifyContent: 'center',
                    flexShrink: 0,
                    paddingTop: 14,
                  }}
                >
                  <div
                    style={{
                      width: isFirst ? 14 : 8,
                      height: isFirst ? 14 : 8,
                      borderRadius: '50%',
                      background: isFirst ? C.accent : entry.current ? C.accentDim : C.surface3,
                      border: isFirst ? 'none' : `2px solid ${entry.current ? C.accent : C.text3}`,
                      boxShadow: isFirst
                        ? `0 0 14px ${C.accent}, 0 0 28px ${C.accent}40`
                        : entry.current
                          ? `0 0 6px ${C.accent}40`
                          : 'none',
                      zIndex: 1,
                      animation: `dotPulseUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both`,
                      animationDelay: `${dotDelay}s`,
                    }}
                  />
                </div>

                {/* Card */}
                <div
                  className={isFirst ? 'career-card-current' : 'career-card'}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: 10,
                    background: isFirst ? 'rgba(99,102,241,0.05)' : 'rgba(255,255,255,0.01)',
                    border: `1px solid ${isFirst ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)'}`,
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'default',
                    opacity: 0,
                    animation: `fadeInUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both`,
                    animationDelay: `${cardDelay}s`,
                  }}
                >
                  {/* Duration bar */}
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${barPct}%`,
                      background: isFirst
                        ? 'linear-gradient(90deg, rgba(99,102,241,0.08), transparent)'
                        : 'linear-gradient(90deg, rgba(255,255,255,0.015), transparent)',
                      pointerEvents: 'none',
                    }}
                  />

                  {/* Top shimmer for first */}
                  {isFirst && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 1,
                        background: `linear-gradient(90deg, transparent, ${C.accent}35, transparent)`,
                      }}
                    />
                  )}

                  <div style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: isFirst ? 600 : 500,
                          color: isFirst ? C.text1 : C.text2,
                        }}
                      >
                        {entry.title}
                      </span>
                      {entry.current && (
                        <span
                          style={{
                            fontSize: 8,
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            color: C.accent,
                            padding: '1px 6px',
                            borderRadius: 3,
                            background: 'rgba(99,102,241,0.12)',
                          }}
                        >
                          AKTUELL
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11.5, color: C.text3, marginBottom: 5 }}>{entry.company}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span
                        style={{
                          fontSize: 10,
                          color: C.text3,
                          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                        }}
                      >
                        {startStr ?? '—'} – {endStr ?? '—'}
                      </span>
                      {durationStr && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: isFirst ? C.accent : C.text3,
                          }}
                        >
                          {durationStr}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Collapsible>
  );
}

// ─── COLLAPSIBLE TIMELINE ────────────────────────────────────────────────────

export function CollapsibleTimeline({ leadId }: { leadId: string }) {
  const { activities, loading } = useActivities(leadId);

  return (
    <Collapsible title="Aktivitäts-Timeline" icon={ICONS.clock} color="#38BDF8" count={activities.length}>
      {(animKey) => (
        <div key={animKey} style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              left: 5,
              top: 8,
              bottom: 8,
              width: 1,
              background: `linear-gradient(180deg, ${C.border}, transparent)`,
            }}
          />

          {loading && (
            <div style={{ padding: '12px 0', textAlign: 'center' }}>
              <span style={{ fontSize: 11, color: C.text3 }}>Laden...</span>
            </div>
          )}

          {!loading && activities.length === 0 && (
            <div style={{ padding: '16px 0', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: C.text3 }}>Noch keine Aktivität</div>
              <div style={{ fontSize: 10, color: C.text3, marginTop: 4 }}>Aktionen werden hier live angezeigt</div>
            </div>
          )}

          {activities.map((a, i) => {
            const st = getActivityStyle(a.type);
            return (
              <div
                key={a.id}
                style={{
                  display: 'flex',
                  gap: 14,
                  padding: '10px 0',
                  animation: 'fadeInUp 0.3s ease both',
                  animationDelay: `${0.05 + i * 0.04}s`,
                }}
              >
                <div
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: '50%',
                    background: C.bg,
                    border: `2px solid ${st.color}`,
                    boxShadow: `0 0 6px ${st.color}40`,
                    flexShrink: 0,
                    marginTop: 3,
                    zIndex: 1,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, color: C.text1, lineHeight: 1.4 }}>{a.title}</div>
                  {a.content && <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>{a.content}</div>}
                  <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>{formatActivityTime(a.created_at)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Collapsible>
  );
}
