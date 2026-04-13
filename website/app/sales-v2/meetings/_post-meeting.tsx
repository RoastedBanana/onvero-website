'use client';

import { useState } from 'react';
import { C, SvgIcon, ICONS, showToast } from '../_shared';
import type { Meeting } from './_meeting-store';
import type { Lead } from '../_lead-data';

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface TimestampedNote {
  id: string;
  text: string;
  timestamp: number;
  phaseId: string;
  phaseName: string;
}

interface ActionItem {
  id: string;
  text: string;
  done: boolean;
}

type WinLoss = 'won' | 'lost' | 'pending' | null;

// ─── HELPERS ────────────────────────────────────────────────────────────────

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m} min ${s > 0 ? `${s} sek` : ''}`.trim();
}

// ─── MOCK AI SUMMARY ────────────────────────────────────────────────────────

function generateMockSummary(meeting: Meeting, notes: TimestampedNote[]): string {
  const notesSummary = notes.length > 0 ? `Während des Gesprächs wurden ${notes.length} Notizen festgehalten.` : '';
  return `Gespräch mit ${meeting.contact} (${meeting.company}) zum Thema "${meeting.title}". ${notesSummary} Das Meeting dauerte ${meeting.duration} Minuten und umfasste ${meeting.phases.length} Phasen. Eine detaillierte KI-Analyse wird erstellt, sobald die Transkription abgeschlossen ist.`;
}

function generateMockActions(meeting: Meeting): ActionItem[] {
  return [
    { id: 'a1', text: `Follow-Up E-Mail an ${meeting.contact} senden`, done: false },
    { id: 'a2', text: `Angebot für ${meeting.company} erstellen`, done: false },
    { id: 'a3', text: 'Interne Abstimmung zu besprochenen Punkten', done: false },
    { id: 'a4', text: 'Nächsten Termin vorschlagen', done: false },
  ];
}

function generateFollowUpDraft(meeting: Meeting, lead: Lead | null): string {
  const name = lead?.firstName ?? meeting.contact;
  return `Hallo ${name},

vielen Dank für das angenehme Gespräch heute. Hier eine kurze Zusammenfassung der besprochenen Punkte:

- [Punkt 1]
- [Punkt 2]
- [Punkt 3]

Als nächsten Schritt würde ich vorschlagen: [nächster Schritt]

Ich freue mich auf die weitere Zusammenarbeit!

Beste Grüße
[Dein Name]`;
}

// ─── WIN/LOSS TAG ───────────────────────────────────────────────────────────

const WIN_LOSS_OPTIONS: { value: WinLoss; label: string; color: string; icon: string }[] = [
  { value: 'won', label: 'Deal gewonnen', color: '#34D399', icon: ICONS.trending },
  { value: 'lost', label: 'Deal verloren', color: '#F87171', icon: ICONS.x },
  { value: 'pending', label: 'Noch offen', color: '#FBBF24', icon: ICONS.clock },
];

// ─── SUB-TABS ───────────────────────────────────────────────────────────────

type PostTab = 'summary' | 'actions' | 'followup' | 'transcript';

// ─── COMPONENT ──────────────────────────────────────────────────────────────

export default function PostMeeting({
  meeting,
  lead,
  notes,
  durationSeconds,
  audioBlob,
}: {
  meeting: Meeting;
  lead: Lead | null;
  notes: TimestampedNote[];
  durationSeconds: number;
  audioBlob: Blob | null;
}) {
  const [activeTab, setActiveTab] = useState<PostTab>('summary');
  const [winLoss, setWinLoss] = useState<WinLoss>(null);
  const [actions, setActions] = useState<ActionItem[]>(generateMockActions(meeting));
  const [followUpText, setFollowUpText] = useState(generateFollowUpDraft(meeting, lead));
  const [transcribing, setTranscribing] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiInsights, setAiInsights] = useState<string[]>([]);

  const summary = aiSummary ?? generateMockSummary(meeting, notes);

  const toggleAction = (id: string) => {
    setActions((prev) => prev.map((a) => (a.id === id ? { ...a, done: !a.done } : a)));
  };

  const handleTranscribe = async () => {
    if (!audioBlob) {
      showToast('Keine Aufnahme vorhanden', 'error');
      return;
    }
    setTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const res = await fetch('/api/meetings/transcribe', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.transcript) {
        setTranscript(data.transcript);
        showToast('Transkription erstellt', 'success');
        // Auto-trigger KI-Analyse
        triggerAnalysis(data.transcript);
      } else {
        showToast(data.error || 'Transkription fehlgeschlagen', 'error');
      }
    } catch {
      showToast('Transkription fehlgeschlagen', 'error');
    } finally {
      setTranscribing(false);
    }
  };

  const triggerAnalysis = async (transcriptText?: string) => {
    setAnalyzing(true);
    try {
      const res = await fetch(`/api/meetings/${meeting.id}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: transcriptText ?? transcript }),
      });
      const data = await res.json();

      if (data.summary) setAiSummary(data.summary);
      if (data.ai_insights) setAiInsights(data.ai_insights);
      if (data.action_items) {
        setActions(
          data.action_items.map((a: { text: string }, i: number) => ({
            id: `ai-${i}`,
            text: a.text,
            done: false,
          }))
        );
      }
      if (data.follow_up_draft) setFollowUpText(data.follow_up_draft);

      showToast('KI-Analyse abgeschlossen', 'success');
    } catch {
      showToast('KI-Analyse fehlgeschlagen', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const tabs: { id: PostTab; label: string; icon: string }[] = [
    { id: 'summary', label: 'Zusammenfassung', icon: ICONS.spark },
    { id: 'actions', label: 'Action Items', icon: ICONS.check },
    { id: 'followup', label: 'Follow-Up E-Mail', icon: ICONS.mail },
    { id: 'transcript', label: 'Transkript', icon: ICONS.chat },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: '20px 22px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
          animation: 'fadeInUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: C.successBg,
              border: `1px solid ${C.successBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SvgIcon d={ICONS.check} size={20} color={C.success} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: C.text1, letterSpacing: '-0.02em' }}>
              Meeting abgeschlossen
            </div>
            <div style={{ fontSize: 12, color: C.text2, marginTop: 2 }}>
              {meeting.title} · {meeting.contact} · {formatDuration(durationSeconds)}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { label: 'Dauer', value: formatDuration(durationSeconds), color: C.accent },
              { label: 'Notizen', value: String(notes.length), color: '#38BDF8' },
              { label: 'Phasen', value: String(meeting.phases.length), color: '#A78BFA' },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  textAlign: 'center',
                  padding: '8px 14px',
                  borderRadius: 8,
                  background: `${s.color}08`,
                  border: `1px solid ${s.color}15`,
                }}
              >
                <div style={{ fontSize: 10, color: C.text3, letterSpacing: '0.04em' }}>{s.label}</div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: s.color,
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    marginTop: 2,
                  }}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Win/Loss Tagging */}
        <div
          style={{
            marginTop: 16,
            paddingTop: 14,
            borderTop: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 500, color: C.text3, letterSpacing: '0.06em' }}>ERGEBNIS:</span>
          {WIN_LOSS_OPTIONS.map((opt) => {
            const active = winLoss === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setWinLoss(active ? null : opt.value)}
                className="s-chip"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 7,
                  background: active ? `${opt.color}10` : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${active ? `${opt.color}30` : C.border}`,
                  color: active ? opt.color : C.text3,
                  fontSize: 12,
                  fontWeight: active ? 500 : 400,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <SvgIcon d={opt.icon} size={11} color={active ? opt.color : C.text3} />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 2,
          padding: 3,
          borderRadius: 10,
          background: 'rgba(255,255,255,0.02)',
          border: `1px solid ${C.border}`,
          width: 'fit-content',
        }}
      >
        {tabs.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              className="s-tab"
              onClick={() => setActiveTab(t.id)}
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

      {/* Tab Content */}
      <div key={activeTab} className="tab-content-enter">
        {/* SUMMARY */}
        {activeTab === 'summary' && (
          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: '22px 24px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <SvgIcon d={ICONS.spark} size={13} color={C.accent} />
              <span style={{ fontSize: 10, fontWeight: 600, color: C.text3, letterSpacing: '0.08em' }}>
                KI-ZUSAMMENFASSUNG
              </span>
            </div>
            <p style={{ fontSize: 13, color: C.text1, lineHeight: 1.7, margin: '0 0 18px' }}>{summary}</p>

            {/* Notes recap */}
            {notes.length > 0 && (
              <>
                <div
                  style={{ fontSize: 10, fontWeight: 600, color: C.text3, letterSpacing: '0.08em', marginBottom: 10 }}
                >
                  DEINE NOTIZEN
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      style={{
                        display: 'flex',
                        gap: 10,
                        padding: '8px 12px',
                        borderRadius: 7,
                        background: 'rgba(255,255,255,0.02)',
                        border: `1px solid ${C.border}`,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                          color: C.accent,
                          fontWeight: 600,
                          flexShrink: 0,
                          minWidth: 36,
                        }}
                      >
                        {formatTimestamp(note.timestamp)}
                      </span>
                      <span style={{ fontSize: 12, color: C.text2 }}>{note.text}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ACTION ITEMS */}
        {activeTab === 'actions' && (
          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: '22px 24px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <SvgIcon d={ICONS.check} size={13} color={C.success} />
              <span style={{ fontSize: 10, fontWeight: 600, color: C.text3, letterSpacing: '0.08em' }}>
                ACTION ITEMS
              </span>
              <span style={{ fontSize: 10, color: C.text3, marginLeft: 'auto' }}>
                {actions.filter((a) => a.done).length}/{actions.length} erledigt
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {actions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => toggleAction(action.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 14px',
                    borderRadius: 9,
                    background: action.done ? C.successBg : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${action.done ? C.successBorder : C.border}`,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      background: action.done ? C.success : 'transparent',
                      border: `1.5px solid ${action.done ? C.success : C.text3}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {action.done && <SvgIcon d={ICONS.check} size={12} color="#fff" />}
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      color: action.done ? C.text3 : C.text1,
                      textDecoration: action.done ? 'line-through' : 'none',
                      opacity: action.done ? 0.6 : 1,
                    }}
                  >
                    {action.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* FOLLOW-UP EMAIL */}
        {activeTab === 'followup' && (
          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: '22px 24px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <SvgIcon d={ICONS.mail} size={13} color={C.accent} />
              <span style={{ fontSize: 10, fontWeight: 600, color: C.text3, letterSpacing: '0.08em' }}>
                FOLLOW-UP E-MAIL ENTWURF
              </span>
            </div>
            <textarea
              value={followUpText}
              onChange={(e) => setFollowUpText(e.target.value)}
              style={{
                width: '100%',
                minHeight: 260,
                padding: '14px 16px',
                borderRadius: 10,
                background: C.surface2,
                border: `1px solid ${C.border}`,
                color: C.text1,
                fontSize: 13,
                fontFamily: 'inherit',
                lineHeight: 1.7,
                outline: 'none',
                resize: 'vertical',
              }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button
                className="s-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '9px 18px',
                  borderRadius: 9,
                  background: 'linear-gradient(135deg, #4F46E5, #6366F1)',
                  border: 'none',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: '0 2px 12px rgba(99,102,241,0.3)',
                }}
                onClick={() => showToast('E-Mail wird gesendet… (Backend noch nicht verbunden)', 'info')}
              >
                <SvgIcon d={ICONS.mail} size={13} color="#fff" />
                E-Mail senden
              </button>
              <button
                className="s-ghost"
                style={{
                  padding: '9px 16px',
                  borderRadius: 9,
                  background: 'transparent',
                  border: `1px solid ${C.border}`,
                  color: C.text2,
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
                onClick={() => {
                  navigator.clipboard.writeText(followUpText);
                  showToast('In Zwischenablage kopiert', 'success');
                }}
              >
                Kopieren
              </button>
            </div>
          </div>
        )}

        {/* TRANSCRIPT */}
        {activeTab === 'transcript' && (
          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: '22px 24px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <SvgIcon d={ICONS.chat} size={13} color={C.accent} />
              <span style={{ fontSize: 10, fontWeight: 600, color: C.text3, letterSpacing: '0.08em' }}>TRANSKRIPT</span>
            </div>

            {!transcript ? (
              <div style={{ textAlign: 'center', padding: '28px 0' }}>
                <p style={{ fontSize: 13, color: C.text3, marginBottom: 16 }}>
                  {audioBlob
                    ? 'Aufnahme vorhanden. Starte die Transkription, um den Text zu generieren.'
                    : 'Keine Aufnahme vorhanden. Transkription nicht möglich.'}
                </p>
                {audioBlob && (
                  <button
                    onClick={handleTranscribe}
                    disabled={transcribing}
                    className="s-primary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 7,
                      padding: '10px 20px',
                      borderRadius: 9,
                      background: transcribing ? C.surface2 : 'linear-gradient(135deg, #4F46E5, #6366F1)',
                      border: 'none',
                      color: transcribing ? C.text3 : '#fff',
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: transcribing ? 'wait' : 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    <SvgIcon d={ICONS.mic} size={13} color={transcribing ? C.text3 : '#fff'} />
                    {transcribing ? 'Transkribiere…' : 'Transkription starten'}
                  </button>
                )}
              </div>
            ) : (
              <pre
                style={{
                  fontSize: 13,
                  color: C.text1,
                  lineHeight: 1.7,
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'inherit',
                }}
              >
                {transcript}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
