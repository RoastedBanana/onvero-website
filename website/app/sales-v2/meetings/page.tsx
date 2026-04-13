'use client';

import { useState } from 'react';
import { C, SvgIcon, PageHeader, PrimaryButton, GhostButton, ICONS, Breadcrumbs, GlowButton } from '../_shared';
import CreateMeetingModal from './_create-meeting';
import SmartSuggestionCard from './_smart-suggestion';
import PrepareView from './_prepare-view';
import LiveMeeting from './_live-meeting';
import PostMeeting from './_post-meeting';
import ArchiveViewComponent from './_archive-view';
import AnalyticsView from './_analytics-view';
import { useMeetings, acceptSuggestion, dismissSuggestion, deleteMeeting, updateMeeting } from './_meeting-store';
import { useLeads } from '../_use-leads';
import type { Meeting, SmartSuggestion } from './_meeting-store';

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Tab = 'upcoming' | 'prepare' | 'record' | 'archive' | 'analytics';

// ─── MEETING TYPE STYLES ─────────────────────────────────────────────────────

const TYPE_STYLES: Record<string, { color: string; icon: string }> = {
  Video: { color: '#818CF8', icon: ICONS.play },
  'Vor Ort': { color: '#34D399', icon: ICONS.globe },
  Telefon: { color: '#FBBF24', icon: ICONS.mic },
};

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function MeetingStats({ meetingCount }: { meetingCount: number }) {
  const stats = [
    {
      label: 'DIESE WOCHE',
      value: String(meetingCount),
      color: '#818CF8',
      gradient: 'radial-gradient(ellipse at 20% 0%, rgba(99,102,241,0.15) 0%, transparent 60%)',
    },
    {
      label: 'DURCHSCHN. DAUER',
      value: '38m',
      color: '#38BDF8',
      gradient: 'radial-gradient(ellipse at 50% 0%, rgba(56,189,248,0.12) 0%, transparent 60%)',
    },
    {
      label: 'TRANSKRIBIERT',
      value: '12',
      color: '#A78BFA',
      gradient: 'radial-gradient(ellipse at 80% 0%, rgba(167,139,250,0.12) 0%, transparent 60%)',
    },
    {
      label: 'KI-INSIGHTS',
      value: '34',
      color: '#34D399',
      gradient: 'radial-gradient(ellipse at 30% 0%, rgba(52,211,153,0.10) 0%, transparent 60%)',
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
      {stats.map((s, i) => (
        <div
          key={s.label}
          className="s-card"
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: '16px 18px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 2px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.03)',
            animation: 'scaleIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
            animationDelay: `${i * 0.06}s`,
          }}
        >
          <div style={{ position: 'absolute', inset: 0, background: s.gradient, pointerEvents: 'none' }} />
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 1,
              background: `linear-gradient(90deg, transparent, ${s.color}40, transparent)`,
            }}
          />
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 10, letterSpacing: '0.08em', color: C.text3, marginBottom: 8, fontWeight: 500 }}>
              {s.label}
            </div>
            <span
              style={{
                fontSize: 24,
                fontWeight: 600,
                color: s.color,
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                letterSpacing: '-0.03em',
                textShadow: `0 0 25px ${s.color}40`,
              }}
            >
              {s.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'upcoming', label: 'Anstehend', icon: ICONS.calendar },
    { id: 'prepare', label: 'Vorbereiten', icon: ICONS.eye },
    { id: 'record', label: 'Aufnehmen', icon: ICONS.mic },
    { id: 'archive', label: 'Archiv', icon: ICONS.folder },
    { id: 'analytics', label: 'Analytics', icon: ICONS.chart },
  ];

  return (
    <div
      style={{
        display: 'flex',
        gap: 2,
        padding: 3,
        borderRadius: 10,
        background: 'rgba(255,255,255,0.02)',
        border: `1px solid ${C.border}`,
        width: 'fit-content',
        animation: 'fadeInUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both',
      }}
    >
      {tabs.map((t) => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            className="s-tab"
            onClick={() => onChange(t.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: isActive ? C.accentGhost : 'transparent',
              color: isActive ? C.accentBright : C.text3,
              fontSize: 12,
              fontWeight: isActive ? 500 : 400,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s ease',
              boxShadow: isActive ? 'inset 0 0 0 0.5px rgba(99,102,241,0.2)' : 'none',
            }}
          >
            <SvgIcon d={t.icon} size={13} color={isActive ? C.accent : C.text3} />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function formatMeetingDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    if (d.toDateString() === today.toDateString()) return 'Heute';
    if (d.toDateString() === tomorrow.toDateString()) return 'Morgen';
    return d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });
  } catch {
    return dateStr;
  }
}

function UpcomingMeetings({
  meetings,
  suggestions,
  onAcceptSuggestion,
  onDismissSuggestion,
  onStartLive,
}: {
  meetings: Meeting[];
  suggestions: SmartSuggestion[];
  onAcceptSuggestion: (id: string) => void;
  onDismissSuggestion: (id: string) => void;
  onStartLive?: (meetingId: string) => void;
}) {
  const planned = meetings.filter((m) => m.status === 'Geplant');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Smart Suggestions */}
      {suggestions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 6 }}>
          {suggestions.map((s) => (
            <SmartSuggestionCard
              key={s.id}
              suggestion={s}
              onAccept={onAcceptSuggestion}
              onDismiss={onDismissSuggestion}
            />
          ))}
        </div>
      )}

      {/* Planned Meetings */}
      {planned.length === 0 && suggestions.length === 0 && (
        <div
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            borderRadius: 12,
            background: C.surface,
            border: `1px solid ${C.border}`,
          }}
        >
          <SvgIcon d={ICONS.calendar} size={28} color={C.text3} />
          <p style={{ fontSize: 13, color: C.text3, marginTop: 12 }}>
            Noch keine Meetings geplant. Erstelle dein erstes Meeting!
          </p>
        </div>
      )}

      {planned.map((m, i) => {
        const ts = TYPE_STYLES[m.type] ?? TYPE_STYLES.Video;
        const dateLabel = formatMeetingDate(m.date);
        const isToday = dateLabel === 'Heute';
        return (
          <div
            key={m.id}
            className="s-bento"
            style={{
              background: C.surface,
              border: `1px solid ${isToday ? `${ts.color}20` : C.border}`,
              borderRadius: 12,
              padding: '20px 22px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 2px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
              animation: 'fadeInUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
              animationDelay: `${0.15 + i * 0.06}s`,
            }}
          >
            {isToday && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 1,
                  background: `linear-gradient(90deg, transparent, ${ts.color}40, transparent)`,
                }}
              />
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
              {/* Time block */}
              <div
                style={{
                  minWidth: 64,
                  textAlign: 'center',
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: isToday ? `${ts.color}08` : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isToday ? `${ts.color}15` : C.border}`,
                }}
              >
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: isToday ? ts.color : C.text1,
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    letterSpacing: '-0.02em',
                    textShadow: isToday ? `0 0 20px ${ts.color}40` : 'none',
                  }}
                >
                  {m.time}
                </div>
                <div style={{ fontSize: 10, color: C.text3, marginTop: 2, fontWeight: 500 }}>{dateLabel}</div>
              </div>

              {/* Divider */}
              <div style={{ width: 1, height: 40, background: C.border }} />

              {/* Meeting info */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: C.text1, letterSpacing: '-0.01em' }}>{m.title}</div>
                <div
                  style={{
                    fontSize: 12,
                    color: C.text2,
                    marginTop: 4,
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

              {/* Duration */}
              <span
                style={{
                  fontSize: 11,
                  color: C.text3,
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                }}
              >
                {m.duration} min
              </span>

              {/* Type badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 12px',
                  borderRadius: 7,
                  background: `${ts.color}08`,
                  border: `1px solid ${ts.color}15`,
                }}
              >
                <SvgIcon d={ts.icon} size={12} color={ts.color} />
                <span style={{ fontSize: 11, fontWeight: 500, color: ts.color }}>{m.type}</span>
              </div>

              {/* From suggestion badge */}
              {m.fromSuggestion && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 8px',
                    borderRadius: 6,
                    background: C.successBg,
                    border: `1px solid ${C.successBorder}`,
                  }}
                >
                  <SvgIcon d={ICONS.spark} size={10} color={C.success} />
                  <span style={{ fontSize: 10, color: C.success }}>KI</span>
                </div>
              )}

              {/* Actions */}
              {isToday && <PrimaryButton onClick={() => onStartLive?.(m.id)}>Beitreten</PrimaryButton>}
              {!isToday && (
                <button
                  onClick={() => onStartLive?.(m.id)}
                  className="s-ghost"
                  style={{
                    padding: '6px 12px',
                    borderRadius: 7,
                    background: 'transparent',
                    border: `1px solid ${C.border}`,
                    color: C.text3,
                    fontSize: 11,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Starten
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteMeeting(m.id);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  opacity: 0.3,
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '0.3';
                }}
                title="Meeting löschen"
              >
                <SvgIcon d={ICONS.x} size={14} color={C.danger} />
              </button>
            </div>

            {/* Phases preview */}
            {m.phases.length > 0 && (
              <div
                style={{ display: 'flex', gap: 3, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.border}` }}
              >
                {m.phases.map((p, pi) => {
                  const totalDur = m.phases.reduce((s, ph) => s + ph.duration, 0);
                  const pct = totalDur > 0 ? (p.duration / totalDur) * 100 : 0;
                  return (
                    <div
                      key={p.id}
                      style={{
                        flex: `${pct} 0 0%`,
                        height: 4,
                        borderRadius: 2,
                        background: `linear-gradient(90deg, ${C.accentDim}${60 + pi * 20}, ${C.accent}${40 + pi * 15})`,
                        opacity: 0.4 + pi * 0.15,
                      }}
                      title={`${p.name} (${p.duration} min)`}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function RecordView({ onSelectMeeting, meetings }: { onSelectMeeting: (id: string) => void; meetings: Meeting[] }) {
  const planned = meetings.filter((m) => m.status === 'Geplant');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Meeting picker — select which meeting to record */}
      {planned.length > 0 && (
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: '18px 20px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
            animation: 'fadeInUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 600, color: C.text3, letterSpacing: '0.08em', marginBottom: 12 }}>
            GEPLANTES MEETING AUFNEHMEN
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {planned.map((m) => {
              const ts = TYPE_STYLES[m.type] ?? TYPE_STYLES.Video;
              return (
                <button
                  key={m.id}
                  onClick={() => onSelectMeeting(m.id)}
                  className="s-row"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 14px',
                    borderRadius: 9,
                    background: 'rgba(255,255,255,0.02)',
                    border: `1px solid ${C.border}`,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: `${ts.color}08`,
                      border: `1px solid ${ts.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <SvgIcon d={ts.icon} size={14} color={ts.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: C.text1 }}>{m.title}</div>
                    <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>
                      {m.contact} · {m.company}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                      color: C.text3,
                    }}
                  >
                    {m.duration} min
                  </span>
                  <SvgIcon d={ICONS.mic} size={14} color={C.accent} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Hero section */}
      <div
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: '40px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
          animation: 'scaleIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative' }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(99,102,241,0.05))',
              border: '1px solid rgba(99,102,241,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}
          >
            <SvgIcon d={ICONS.mic} size={28} color={C.accent} />
          </div>

          <h2 style={{ fontSize: 18, fontWeight: 600, color: C.text1, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            Meeting aufnehmen
          </h2>
          <p
            style={{
              fontSize: 13,
              color: C.text3,
              margin: '0 0 28px',
              maxWidth: 400,
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: 1.6,
            }}
          >
            {planned.length > 0
              ? 'Wähle oben ein geplantes Meeting aus, oder starte eine freie Aufnahme.'
              : 'Starte eine Aufnahme und Onvero transkribiert, analysiert und fasst dein Meeting automatisch zusammen.'}
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 14,
              marginTop: 36,
              paddingTop: 28,
              borderTop: `1px solid ${C.border}`,
            }}
          >
            {[
              {
                icon: ICONS.chat,
                label: 'Live-Transkription',
                desc: 'Echtzeit-Text während des Gesprächs',
                color: '#818CF8',
              },
              {
                icon: ICONS.spark,
                label: 'KI-Zusammenfassung',
                desc: 'Automatische Zusammenfassung + Action Items',
                color: '#34D399',
              },
              {
                icon: ICONS.trending,
                label: 'Stimmungsanalyse',
                desc: 'Erkennt Kaufsignale und Bedenken',
                color: '#FBBF24',
              },
            ].map((f) => (
              <div key={f.label} style={{ textAlign: 'center', padding: '16px 12px' }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    background: `${f.color}08`,
                    border: `1px solid ${f.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 10px',
                  }}
                >
                  <SvgIcon d={f.icon} size={15} color={f.color} />
                </div>
                <div style={{ fontSize: 12, fontWeight: 500, color: C.text1, marginBottom: 4 }}>{f.label}</div>
                <div style={{ fontSize: 11, color: C.text3, lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE ────────────────────────────────────────────────────────────────────

type LiveState = {
  meetingId: string;
  phase: 'live' | 'post';
  audioBlob: Blob | null;
  notes: { id: string; text: string; timestamp: number; phaseId: string; phaseName: string }[];
  durationSeconds: number;
};

export default function MeetingsPage() {
  const [tab, setTab] = useState<Tab>('upcoming');
  const [createOpen, setCreateOpen] = useState(false);
  const [prefill, setPrefill] = useState<SmartSuggestion | null>(null);
  const [liveState, setLiveState] = useState<LiveState | null>(null);
  const { meetings, suggestions } = useMeetings();
  const { leads } = useLeads();

  const handleAcceptSuggestion = (id: string) => {
    const sug = acceptSuggestion(id);
    if (sug) {
      setPrefill(sug);
      setCreateOpen(true);
    }
  };

  const handleDismissSuggestion = (id: string) => {
    dismissSuggestion(id);
  };

  const handleOpenCreate = () => {
    setPrefill(null);
    setCreateOpen(true);
  };

  const handleStartLive = (meetingId: string) => {
    setLiveState({ meetingId, phase: 'live', audioBlob: null, notes: [], durationSeconds: 0 });
    setTab('record');
  };

  const handleEndLive = (data: { audioBlob: Blob | null; notes: LiveState['notes']; durationSeconds: number }) => {
    if (liveState) {
      setLiveState({ ...liveState, phase: 'post', ...data });
    }
  };

  const handleBackToList = () => {
    setLiveState(null);
    setTab('upcoming');
  };

  // Find the live meeting + lead
  const liveMeeting = liveState ? (meetings.find((m) => m.id === liveState.meetingId) ?? null) : null;
  const liveLead = liveMeeting ? (leads.find((l) => l.id === liveMeeting.leadId) ?? null) : null;

  return (
    <>
      <Breadcrumbs items={[{ label: 'Onvero Sales', href: '/sales-v2' }, { label: 'Meetings' }]} />
      <PageHeader
        title="Meetings"
        subtitle="Aufnehmen, analysieren und nachbereiten — alles an einem Ort"
        actions={<GlowButton onClick={handleOpenCreate}>+ Meeting planen</GlowButton>}
      />

      <MeetingStats meetingCount={meetings.filter((m) => m.status === 'Geplant').length + suggestions.length} />
      <TabBar active={tab} onChange={setTab} />

      <div key={liveState ? `live-${liveState.phase}` : tab} className="tab-content-enter">
        {tab === 'upcoming' && (
          <UpcomingMeetings
            meetings={meetings}
            suggestions={suggestions}
            onAcceptSuggestion={handleAcceptSuggestion}
            onDismissSuggestion={handleDismissSuggestion}
            onStartLive={handleStartLive}
          />
        )}
        {tab === 'prepare' && <PrepareView meetings={meetings} />}
        {tab === 'record' && liveState?.phase === 'live' && liveMeeting && (
          <LiveMeeting meeting={liveMeeting} lead={liveLead} onEnd={handleEndLive} />
        )}
        {tab === 'record' && liveState?.phase === 'post' && liveMeeting && (
          <PostMeeting
            meeting={liveMeeting}
            lead={liveLead}
            notes={liveState.notes}
            durationSeconds={liveState.durationSeconds}
            audioBlob={liveState.audioBlob}
          />
        )}
        {tab === 'record' && !liveState && <RecordView onSelectMeeting={handleStartLive} meetings={meetings} />}
        {tab === 'archive' && <ArchiveViewComponent meetings={meetings} />}
        {tab === 'analytics' && <AnalyticsView meetings={meetings} />}
      </div>

      <CreateMeetingModal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setPrefill(null);
        }}
        prefill={prefill}
      />
    </>
  );
}
