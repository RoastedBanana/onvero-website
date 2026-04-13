'use client';

import { useState, useEffect, useRef } from 'react';
import { C, SvgIcon, ICONS, showToast } from '../_shared';
import { ACCOUNT } from '../_lead-data';
import { updateMeeting } from './_meeting-store';
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
  const noteTexts = notes.map((n) => n.text).join('; ');
  if (notes.length > 0) {
    return `Gespräch mit ${meeting.contact} von ${meeting.company} zum Thema "${meeting.title}". Wichtigste Punkte: ${noteTexts}. Das Meeting dauerte ${meeting.duration} Minuten. Starte die Transkription für eine detaillierte KI-Analyse.`;
  }
  return `Gespräch mit ${meeting.contact} von ${meeting.company} zum Thema "${meeting.title}". Dauer: ${meeting.duration} Minuten, ${meeting.phases.length} Phasen. Starte die Transkription für eine detaillierte KI-Analyse.`;
}

function generateMockActions(meeting: Meeting): ActionItem[] {
  return [
    { id: 'a1', text: `Follow-Up E-Mail an ${meeting.contact} (${meeting.company}) senden`, done: false },
    {
      id: 'a2',
      text: `Angebot für ${meeting.company} erstellen${meeting.product ? ` — ${meeting.product}` : ''}`,
      done: false,
    },
    { id: 'a3', text: 'Besprochene Punkte intern dokumentieren', done: false },
    { id: 'a4', text: `Nächsten Termin mit ${meeting.contact} vorschlagen`, done: false },
  ];
}

function humanize(companyName: string): string {
  return companyName
    .replace(/\s*(GmbH|UG|AG|SE|KG|OHG|e\.?K\.?|mbH|GbR|Inc\.?|Ltd\.?|LLC|Co\.?\s*KG)\s*(\(.*?\))?\s*/gi, '')
    .trim();
}

function generateFollowUpDraft(
  meeting: Meeting,
  lead: Lead | null,
  aiSummaryText?: string | null,
  actionItems?: { text: string }[]
): string {
  const name = lead?.firstName ?? meeting.contact.split(' ')[0] ?? meeting.contact;
  const company = humanize(lead?.company ?? meeting.company);
  const sender = ACCOUNT.senderName.split(' ')[0];

  if (aiSummaryText) {
    const actionsBlock =
      actionItems && actionItems.length > 0
        ? `\nNächste Schritte:\n${actionItems.map((a) => `- ${a.text}`).join('\n')}\n`
        : '';

    return `Hallo ${name},

danke nochmal für das gute Gespräch heute! Hier eine kurze Zusammenfassung:

${aiSummaryText}
${actionsBlock}
Falls dir noch was einfällt oder Fragen aufkommen — meld dich jederzeit bei mir.

Beste Grüße
${sender}

${ACCOUNT.senderName}
${ACCOUNT.senderRole} — ${humanize(ACCOUNT.companyName)}`;
  }

  return `Hallo ${name},

danke für das gute Gespräch heute! Hat mich gefreut, mehr über ${company} zu erfahren.

Wie besprochen hier die nächsten Schritte:

- Ich stelle euch ein konkretes Angebot zusammen
- Darin berücksichtige ich die Punkte, die wir heute besprochen haben
- Geplanter Zeitraum: bis Ende der Woche

Falls dir noch was einfällt oder du Fragen hast — meld dich jederzeit.

Beste Grüße
${sender}

${ACCOUNT.senderName}
${ACCOUNT.senderRole} — ${humanize(ACCOUNT.companyName)}`;
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
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const autoStarted = useRef(false);

  // Auto-start transcription when component mounts with audio
  useEffect(() => {
    if (audioBlob && !autoStarted.current) {
      autoStarted.current = true;
      handleTranscribe();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    const txt = transcriptText ?? transcript;
    if (!txt) {
      showToast('Kein Transkript vorhanden', 'error');
      return;
    }
    setAnalyzing(true);
    try {
      const isRealId = meeting.id && !meeting.id.startsWith('mtg-');
      let data: Record<string, unknown>;

      if (isRealId) {
        // Use the dedicated meeting analyze endpoint
        const res = await fetch(`/api/meetings/${meeting.id}/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: txt }),
        });
        data = await res.json();
      } else {
        // Fallback: call n8n proxy directly if we don't have a real DB ID
        const res = await fetch('/api/proxy/n8n', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'meeting-analyzer',
            meeting_id: meeting.id,
            tenant_id: '',
            transcript: txt,
            meeting_title: meeting.title,
            meeting_type: meeting.type,
            contact_name: meeting.contact,
            company: meeting.company,
            product: meeting.product,
            notes: notes.map((n) => ({ text: n.text, timestamp: n.timestamp, phaseName: n.phaseName })),
            phases: meeting.phases,
          }),
        });
        data = await res.json();
      }

      if (data.summary) setAiSummary(data.summary as string);
      if (data.ai_insights) setAiInsights(data.ai_insights as string[]);
      if (data.action_items) {
        setActions(
          (data.action_items as { text: string }[]).map((a, i) => ({
            id: `ai-${i}`,
            text: a.text,
            done: false,
          }))
        );
      }

      // Regenerate follow-up email with AI summary + action items
      if (data.follow_up_draft) {
        setFollowUpText(data.follow_up_draft as string);
      } else if (data.summary) {
        setFollowUpText(
          generateFollowUpDraft(
            meeting,
            lead,
            data.summary as string,
            data.action_items as { text: string }[] | undefined
          )
        );
      }

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
                onClick={() => {
                  const newVal = active ? null : opt.value;
                  setWinLoss(newVal);
                  updateMeeting(meeting.id, { status: 'Abgeschlossen' } as Partial<Meeting>);
                  // Persist win_loss via API
                  if (!meeting.id.startsWith('mtg-')) {
                    fetch(`/api/meetings/${meeting.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ win_loss: newVal, status: 'Abgeschlossen' }),
                    }).catch(() => {});
                  }
                }}
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
            {/* Status indicators */}
            {(transcribing || analyzing) && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 14,
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: `${C.accent}06`,
                  border: `1px solid ${C.accent}12`,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: C.accent,
                    animation: 'pulse-live 1.5s ease-in-out infinite',
                  }}
                />
                <span style={{ fontSize: 12, color: C.accentBright }}>
                  {transcribing ? 'Transkription läuft…' : 'KI-Analyse läuft…'}
                </span>
              </div>
            )}

            <p style={{ fontSize: 13, color: C.text1, lineHeight: 1.7, margin: '0 0 14px' }}>{summary}</p>

            {/* AI Insights */}
            {aiInsights.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
                {aiInsights.map((insight) => (
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

            {/* Manual analyze button if no auto-transcription happened */}
            {!aiSummary && !analyzing && !transcribing && (
              <button
                onClick={() => (audioBlob ? handleTranscribe() : triggerAnalysis())}
                className="s-primary"
                style={{
                  display: 'inline-flex',
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
                  marginBottom: 18,
                }}
              >
                <SvgIcon d={ICONS.spark} size={13} color="#fff" />
                {audioBlob ? 'Transkription + KI-Analyse starten' : 'KI-Analyse starten'}
              </button>
            )}

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
            {/* Send actions + scheduling */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                marginTop: 14,
                paddingTop: 14,
                borderTop: `1px solid ${C.border}`,
              }}
            >
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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
                  onClick={() => showToast('E-Mail wird gesendet…', 'info')}
                >
                  <SvgIcon d={ICONS.mail} size={13} color="#fff" />
                  Jetzt senden
                </button>
                <button
                  className="s-ghost"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '9px 14px',
                    borderRadius: 9,
                    background: 'transparent',
                    border: `1px solid ${C.border}`,
                    color: C.text2,
                    fontSize: 12,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                  onClick={() => setScheduleOpen(!scheduleOpen)}
                >
                  <SvgIcon d={ICONS.clock} size={12} color={C.text3} />
                  Timer
                </button>
                <button
                  className="s-ghost"
                  style={{
                    padding: '9px 14px',
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

              {/* Schedule picker */}
              {scheduleOpen && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 14px',
                    borderRadius: 9,
                    background: C.surface2,
                    border: `1px solid ${C.border}`,
                    animation: 'fadeInUp 0.2s ease both',
                  }}
                >
                  <SvgIcon d={ICONS.clock} size={12} color={C.accent} />
                  <span style={{ fontSize: 12, color: C.text2 }}>Senden am:</span>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 7,
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                      color: C.text1,
                      fontSize: 12,
                      fontFamily: 'inherit',
                      outline: 'none',
                      colorScheme: 'dark',
                    }}
                  />
                  <span style={{ fontSize: 12, color: C.text2 }}>um</span>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 7,
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                      color: C.text1,
                      fontSize: 12,
                      fontFamily: 'inherit',
                      outline: 'none',
                      colorScheme: 'dark',
                    }}
                  />
                  <button
                    className="s-primary"
                    style={{
                      padding: '7px 14px',
                      borderRadius: 7,
                      background: 'linear-gradient(135deg, #4F46E5, #6366F1)',
                      border: 'none',
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                    onClick={() => {
                      showToast(`E-Mail geplant für ${scheduleDate} ${scheduleTime}`, 'success');
                      setScheduleOpen(false);
                    }}
                  >
                    Planen
                  </button>
                </div>
              )}
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
