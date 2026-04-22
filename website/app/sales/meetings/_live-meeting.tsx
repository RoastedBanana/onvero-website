'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { C, SvgIcon, ICONS, showToast } from '../_shared';
import { ACCOUNT } from '../_lead-data';
import type { Meeting, MeetingPhase } from './_meeting-store';
import type { Lead } from '../_lead-data';

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface TimestampedNote {
  id: string;
  text: string;
  timestamp: number; // seconds since start
  phaseId: string;
  phaseName: string;
}

// ─── HELPERS ────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── DUAL-TRACK AUDIO RECORDER HOOK ────────────────────────────────────────
// Records mic (Du) and system audio (Gegenüber) as separate tracks.
// System audio is captured via getDisplayMedia — the user picks a tab/screen.

interface DualRecorderResult {
  micBlob: Blob | null;
  systemBlob: Blob | null;
}

function useDualAudioRecorder() {
  const [recording, setRecording] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [systemActive, setSystemActive] = useState(false);
  const [micBlob, setMicBlob] = useState<Blob | null>(null);
  const [systemBlob, setSystemBlob] = useState<Blob | null>(null);
  const [micUrl, setMicUrl] = useState<string | null>(null);
  const [systemUrl, setSystemUrl] = useState<string | null>(null);

  const micRecorder = useRef<MediaRecorder | null>(null);
  const systemRecorder = useRef<MediaRecorder | null>(null);
  const micChunks = useRef<Blob[]>([]);
  const systemChunks = useRef<Blob[]>([]);
  const micStream = useRef<MediaStream | null>(null);
  const systemStream = useRef<MediaStream | null>(null);
  const onStopResolve = useRef<((result: DualRecorderResult) => void) | null>(null);
  const stoppedCount = useRef(0);
  const expectedStops = useRef(0);
  const finalMicBlob = useRef<Blob | null>(null);
  const finalSystemBlob = useRef<Blob | null>(null);

  const pickMimeType = () =>
    MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : '';

  const handleRecorderStop = useCallback(() => {
    stoppedCount.current += 1;
    if (stoppedCount.current >= expectedStops.current && onStopResolve.current) {
      onStopResolve.current({ micBlob: finalMicBlob.current, systemBlob: finalSystemBlob.current });
      onStopResolve.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    const mimeType = pickMimeType();
    const opts = mimeType ? { mimeType } : undefined;

    // 1. Mic recording
    try {
      const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStream.current = mic;
      micChunks.current = [];
      const rec = new MediaRecorder(mic, opts);
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) micChunks.current.push(e.data);
      };
      rec.onstop = () => {
        const type = rec.mimeType || 'audio/webm';
        const blob = new Blob(micChunks.current, { type });
        finalMicBlob.current = blob;
        setMicBlob(blob);
        setMicUrl(URL.createObjectURL(blob));
        mic.getTracks().forEach((t) => t.stop());
        setMicActive(false);
        handleRecorderStop();
      };
      micRecorder.current = rec;
      rec.start(1000);
      setMicActive(true);
    } catch {
      showToast('Mikrofon-Zugriff verweigert', 'error');
      return;
    }

    // 2. System audio recording (optional — user can skip)
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({ audio: true, video: true });
      // We only need audio — stop video track immediately
      display.getVideoTracks().forEach((t) => t.stop());
      const audioTracks = display.getAudioTracks();
      if (audioTracks.length === 0) {
        showToast('Kein System-Audio ausgewählt — nur Mikrofon wird aufgenommen', 'info');
      } else {
        const audioOnly = new MediaStream(audioTracks);
        systemStream.current = audioOnly;
        systemChunks.current = [];
        const sysRec = new MediaRecorder(audioOnly, opts);
        sysRec.ondataavailable = (e) => {
          if (e.data.size > 0) systemChunks.current.push(e.data);
        };
        sysRec.onstop = () => {
          const type = sysRec.mimeType || 'audio/webm';
          const blob = new Blob(systemChunks.current, { type });
          finalSystemBlob.current = blob;
          setSystemBlob(blob);
          setSystemUrl(URL.createObjectURL(blob));
          audioOnly.getTracks().forEach((t) => t.stop());
          setSystemActive(false);
          handleRecorderStop();
        };
        // If the user stops sharing, auto-stop system recorder
        audioTracks[0].onended = () => {
          if (sysRec.state !== 'inactive') sysRec.stop();
        };
        systemRecorder.current = sysRec;
        sysRec.start(1000);
        setSystemActive(true);
      }
    } catch {
      // User cancelled display picker — that's fine, mic-only recording
      showToast('System-Audio übersprungen — nur Mikrofon aktiv', 'info');
    }

    setRecording(true);
    stoppedCount.current = 0;
    finalMicBlob.current = null;
    finalSystemBlob.current = null;
    showToast(
      systemRecorder.current ? 'Dual-Aufnahme gestartet (Mikro + System)' : 'Aufnahme gestartet (nur Mikro)',
      'success'
    );
  }, [handleRecorderStop]);

  const stopRecording = useCallback((): Promise<DualRecorderResult> => {
    return new Promise((resolve) => {
      const micActive = micRecorder.current && micRecorder.current.state !== 'inactive';
      const sysActive = systemRecorder.current && systemRecorder.current.state !== 'inactive';
      expectedStops.current = (micActive ? 1 : 0) + (sysActive ? 1 : 0);

      if (expectedStops.current === 0) {
        resolve({ micBlob, systemBlob });
        return;
      }

      onStopResolve.current = resolve;
      if (micActive) micRecorder.current!.stop();
      if (sysActive) systemRecorder.current!.stop();
      setRecording(false);
    });
  }, [micBlob, systemBlob]);

  return { recording, micActive, systemActive, micBlob, systemBlob, micUrl, systemUrl, startRecording, stopRecording };
}

// ─── PHASE TRACKER ──────────────────────────────────────────────────────────

function PhaseTracker({
  phases,
  currentPhaseIndex,
  onGoToPhase,
  onAdvance,
}: {
  phases: MeetingPhase[];
  currentPhaseIndex: number;
  onGoToPhase: (index: number) => void;
  onAdvance: () => void;
}) {
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: '16px 18px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <SvgIcon d={ICONS.list} size={12} color={C.accent} />
        <span style={{ fontSize: 10, fontWeight: 600, color: C.text3, letterSpacing: '0.08em' }}>PHASEN</span>
        <span style={{ fontSize: 10, color: C.text3, marginLeft: 'auto' }}>
          {currentPhaseIndex + 1}/{phases.length}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {phases.map((phase, i) => {
          const isCurrent = i === currentPhaseIndex;
          const isDone = i < currentPhaseIndex;

          return (
            <button
              key={phase.id}
              onClick={() => onGoToPhase(i)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 8,
                background: isCurrent ? `${C.accent}08` : 'transparent',
                border: `1px solid ${isCurrent ? C.borderAccent : 'transparent'}`,
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
                width: '100%',
              }}
            >
              {/* Status indicator */}
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 5,
                  background: isDone ? C.successBg : isCurrent ? C.accentGhost : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isDone ? C.successBorder : isCurrent ? C.borderAccent : C.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {isDone ? (
                  <SvgIcon d={ICONS.check} size={10} color={C.success} />
                ) : isCurrent ? (
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: C.accent,
                      animation: 'pulse-live 2s ease-in-out infinite',
                    }}
                  />
                ) : (
                  <span style={{ fontSize: 9, color: C.text3, fontWeight: 600 }}>{i + 1}</span>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: isCurrent ? 500 : 400,
                    color: isDone ? C.text3 : isCurrent ? C.text1 : C.text2,
                    textDecoration: isDone ? 'line-through' : 'none',
                    opacity: isDone ? 0.6 : 1,
                  }}
                >
                  {phase.name}
                </div>
              </div>

              <span
                style={{
                  fontSize: 10,
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  color: C.text3,
                  flexShrink: 0,
                }}
              >
                {phase.duration}m
              </span>
            </button>
          );
        })}
      </div>

      {/* Next phase button */}
      {currentPhaseIndex < phases.length - 1 && (
        <button
          onClick={onAdvance}
          className="s-primary"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '9px 14px',
            marginTop: 10,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #4F46E5, #6366F1)',
            border: 'none',
            color: '#fff',
            fontSize: 11,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit',
            boxShadow: '0 2px 10px rgba(99,102,241,0.25)',
          }}
        >
          <SvgIcon d={ICONS.chevRight} size={11} color="#fff" />
          Nächste Phase: {phases[currentPhaseIndex + 1]?.name}
        </button>
      )}
    </div>
  );
}

// ─── LIVE NOTES ─────────────────────────────────────────────────────────────

function LiveNotes({
  notes,
  onAddNote,
  elapsedSeconds,
  currentPhaseName,
  currentPhaseId,
}: {
  notes: TimestampedNote[];
  onAddNote: (note: TimestampedNote) => void;
  elapsedSeconds: number;
  currentPhaseName: string;
  currentPhaseId: string;
}) {
  const [text, setText] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  const handleSubmit = () => {
    if (!text.trim()) return;
    onAddNote({
      id: `note-${Date.now()}`,
      text: text.trim(),
      timestamp: elapsedSeconds,
      phaseId: currentPhaseId,
      phaseName: currentPhaseName,
    });
    setText('');
  };

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [notes.length]);

  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '14px 16px',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <SvgIcon d={ICONS.chat} size={12} color={C.accent} />
        <span style={{ fontSize: 10, fontWeight: 600, color: C.text3, letterSpacing: '0.08em' }}>LIVE-NOTIZEN</span>
        <span style={{ fontSize: 10, color: C.text3, marginLeft: 'auto' }}>{notes.length} Einträge</span>
      </div>

      {/* Notes list */}
      <div ref={listRef} style={{ flex: 1, maxHeight: 300, overflowY: 'auto', padding: '10px 14px' }}>
        {notes.length === 0 ? (
          <p style={{ fontSize: 12, color: C.text3, textAlign: 'center', padding: '20px 0' }}>
            Tippe Notizen während des Gesprächs — sie werden automatisch mit Zeitstempel gespeichert.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {notes.map((note) => (
              <div
                key={note.id}
                style={{
                  display: 'flex',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 7,
                  background: 'rgba(255,255,255,0.02)',
                  border: `1px solid ${C.border}`,
                  animation: 'fadeInUp 0.2s ease both',
                }}
              >
                <div style={{ flexShrink: 0, textAlign: 'right', minWidth: 40 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                      color: C.accent,
                      fontWeight: 600,
                    }}
                  >
                    {formatTimestamp(note.timestamp)}
                  </div>
                  <div style={{ fontSize: 9, color: C.text3, marginTop: 2 }}>{note.phaseName}</div>
                </div>
                <div style={{ width: 1, background: C.border, flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: C.text1, lineHeight: 1.5, margin: 0 }}>{note.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: '10px 14px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 8 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Notiz eingeben + Enter…"
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 8,
            background: C.surface2,
            border: `1px solid ${C.border}`,
            color: C.text1,
            fontSize: 12,
            fontFamily: 'inherit',
            outline: 'none',
          }}
        />
        <button
          onClick={handleSubmit}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            background: C.accentGhost,
            border: `1px solid ${C.borderAccent}`,
            color: C.accent,
            fontSize: 11,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Speichern
        </button>
      </div>
    </div>
  );
}

// ─── LIVE PREP PANEL — quick reference during call ──────────────────────────

type PrepTab = 'script' | 'facts' | 'objections';

function humanize(name: string): string {
  return name
    .replace(/\s*(GmbH|UG|AG|SE|KG|OHG|e\.?K\.?|mbH|GbR|Inc\.?|Ltd\.?|LLC|Co\.?\s*KG)\s*(\(.*?\))?\s*/gi, '')
    .trim();
}

function generateQuickScript(phase: MeetingPhase, lead: Lead | null, meeting: Meeting): string {
  const name = lead?.firstName ?? 'Kunde';
  const company = humanize(lead?.company ?? '');
  const product = meeting.product || ACCOUNT.description;
  const sender = ACCOUNT.senderName.split(' ')[0];

  const scripts: Record<string, string> = {
    Begrüßung: `Hey ${name}, ${sender} hier von ${humanize(ACCOUNT.companyName)}. Freut mich!`,
    Bedarfsanalyse: `Was sind gerade eure größten Baustellen${company ? ` bei ${company}` : ''}?`,
    Kurzpitch: `${product} — so helfen wir. Konkret für ${company || 'euch'}:`,
    'Fragen & Antworten': `Was denkst du? Was spricht dich an, was nicht?`,
    'Nächste Schritte': `Kurzes Recap + nächster Schritt. Wann passt ein Follow-Up?`,
    'Pain Points': `Was kostet euch am meisten Zeit? Was passiert wenn nichts passiert?`,
    'Live-Demo': `Bildschirm teilen. Beispiel für ${company || 'euch'} angepasst.`,
    'Q&A': `Was hat dich am meisten angesprochen? Was passt nicht?`,
    Close: `Siehst du den Mehrwert? Wer entscheidet noch mit?`,
    Recap: `Recap letztes Gespräch. Was hat sich seitdem getan?`,
    'Offene Punkte': `Offene Punkte durchgehen. Neue Fragen?`,
    Entscheidung: `Konntet ihr intern abstimmen? Was braucht ihr noch?`,
  };
  return scripts[phase.name] ?? phase.name;
}

const QUICK_OBJECTIONS = [
  { q: 'Zu teuer', a: 'ROI aufzeigen — was kostet Nicht-Handeln?' },
  { q: 'Keine Zeit', a: 'Minimaler Einstieg. Wann besser?' },
  { q: 'Haben schon was', a: 'Was fehlt? Wo gibt es Lücken?' },
  { q: 'Muss abstimmen', a: 'Wer noch? Material für intern?' },
  { q: 'Kein Bedarf', a: 'Branchen-Beispiel zeigen.' },
  { q: 'Kenne euch nicht', a: 'Referenzkunden nennen. Pilotprojekt.' },
];

function LivePrepPanel({
  meeting,
  lead,
  currentPhase,
}: {
  meeting: Meeting;
  lead: Lead | null;
  currentPhase: MeetingPhase | undefined;
}) {
  const [tab, setTab] = useState<PrepTab>('script');

  const tabs: { id: PrepTab; label: string; icon: string }[] = [
    { id: 'script', label: 'Script', icon: ICONS.chat },
    { id: 'facts', label: 'Facts', icon: ICONS.eye },
    { id: 'objections', label: 'Einwände', icon: ICONS.zap },
  ];

  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Tab switcher */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}` }}>
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                padding: '10px 6px',
                background: active ? C.accentGhost : 'transparent',
                border: 'none',
                borderBottom: active ? `2px solid ${C.accent}` : '2px solid transparent',
                color: active ? C.accentBright : C.text3,
                fontSize: 10,
                fontWeight: active ? 600 : 400,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.15s ease',
              }}
            >
              <SvgIcon d={t.icon} size={11} color={active ? C.accent : C.text3} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', maxHeight: 350, padding: '12px 14px' }}>
        {/* SCRIPT TAB — current phase highlighted */}
        {tab === 'script' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {meeting.phases.map((phase) => {
              const isCurrent = currentPhase?.id === phase.id;
              return (
                <div
                  key={phase.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: isCurrent ? `${C.accent}08` : 'transparent',
                    border: `1px solid ${isCurrent ? C.borderAccent : 'transparent'}`,
                    transition: 'all 0.3s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: isCurrent ? C.accentBright : C.text2 }}>
                      {phase.name}
                    </span>
                    {isCurrent && (
                      <span style={{ fontSize: 8, color: C.accent, fontWeight: 600, letterSpacing: '0.08em' }}>
                        JETZT
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: 11.5,
                      color: isCurrent ? C.text1 : C.text3,
                      lineHeight: 1.5,
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {generateQuickScript(phase, lead, meeting)}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* FACTS TAB */}
        {tab === 'facts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {lead && (
              <>
                {[
                  { l: 'Name', v: lead.name },
                  { l: 'Position', v: lead.jobTitle },
                  { l: 'Firma', v: lead.company },
                  { l: 'Ort', v: lead.city },
                  { l: 'E-Mail', v: lead.email },
                  { l: 'Telefon', v: lead.phone },
                  { l: 'Branche', v: lead.industry !== 'Sonstige' ? lead.industry : null },
                  { l: 'Score', v: lead.score !== null ? String(lead.score) : null },
                  { l: 'Google', v: lead.googleRating ? `${lead.googleRating} ★` : null },
                ]
                  .filter((f) => f.v)
                  .map((f) => (
                    <div key={f.l} style={{ display: 'flex', gap: 8 }}>
                      <span style={{ fontSize: 10, color: C.text3, minWidth: 50 }}>{f.l}</span>
                      <span style={{ fontSize: 12, color: C.text1, fontWeight: 500 }}>{f.v}</span>
                    </div>
                  ))}
                {lead.aiSummary && (
                  <div
                    style={{
                      marginTop: 6,
                      padding: '8px 10px',
                      borderRadius: 7,
                      background: `${C.accent}06`,
                      border: `1px solid ${C.accent}10`,
                    }}
                  >
                    <div style={{ fontSize: 9, color: C.accent, fontWeight: 600, marginBottom: 4 }}>ANALYSE</div>
                    <p style={{ fontSize: 11, color: C.text2, lineHeight: 1.5, margin: 0 }}>{lead.aiSummary}</p>
                  </div>
                )}
              </>
            )}
            {!lead && (
              <p style={{ fontSize: 12, color: C.text3, textAlign: 'center', padding: 10 }}>Kein Lead verknüpft.</p>
            )}
            {meeting.product && (
              <div
                style={{
                  marginTop: 4,
                  padding: '8px 10px',
                  borderRadius: 7,
                  background: 'rgba(255,255,255,0.02)',
                  border: `1px solid ${C.border}`,
                }}
              >
                <div style={{ fontSize: 9, color: C.text3, fontWeight: 600, marginBottom: 3 }}>DEIN ANGEBOT</div>
                <p style={{ fontSize: 11.5, color: C.text1, margin: 0, lineHeight: 1.5 }}>{meeting.product}</p>
              </div>
            )}
          </div>
        )}

        {/* OBJECTIONS TAB — quick reference */}
        {tab === 'objections' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {QUICK_OBJECTIONS.map((o) => (
              <div
                key={o.q}
                style={{
                  padding: '8px 10px',
                  borderRadius: 7,
                  background: 'rgba(255,255,255,0.02)',
                  border: `1px solid ${C.border}`,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 600, color: '#FBBF24', marginBottom: 3 }}>{o.q}</div>
                <div style={{ fontSize: 11.5, color: C.text2, lineHeight: 1.4 }}>{o.a}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN LIVE MEETING VIEW ─────────────────────────────────────────────────

export default function LiveMeeting({
  meeting,
  lead,
  onEnd,
}: {
  meeting: Meeting;
  lead?: Lead | null;
  onEnd: (data: {
    audioBlob: Blob | null;
    systemAudioBlob: Blob | null;
    notes: TimestampedNote[];
    durationSeconds: number;
  }) => void;
}) {
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [manualPhaseIndex, setManualPhaseIndex] = useState(0);
  const [notes, setNotes] = useState<TimestampedNote[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { recording, micActive, systemActive, micBlob, systemBlob, micUrl, systemUrl, startRecording, stopRecording } =
    useDualAudioRecorder();

  // Timer
  useEffect(() => {
    if (started && !paused) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [started, paused]);

  // Phase is manually controlled
  const currentPhaseIndex = manualPhaseIndex;
  const currentPhase = meeting.phases[currentPhaseIndex];
  const totalDuration = meeting.phases.reduce((s, p) => s + p.duration, 0);
  const plannedSeconds = totalDuration * 60;
  const overallProgress = Math.min(1, elapsed / plannedSeconds);
  const isOvertime = elapsed > plannedSeconds;

  const advancePhase = () => {
    if (manualPhaseIndex < meeting.phases.length - 1) {
      setManualPhaseIndex(manualPhaseIndex + 1);
    }
  };

  const goToPhase = (index: number) => {
    setManualPhaseIndex(index);
  };

  const handleStart = async () => {
    setStarted(true);
    await startRecording();
  };

  const handlePause = () => {
    setPaused(!paused);
  };

  const handleEnd = async () => {
    const result = await stopRecording();
    setStarted(false);
    onEnd({
      audioBlob: result.micBlob,
      systemAudioBlob: result.systemBlob,
      notes,
      durationSeconds: elapsed,
    });
  };

  const addNote = (note: TimestampedNote) => {
    setNotes((prev) => [...prev, note]);
  };

  // ─── NOT STARTED ────────────────────────────────────────────────────────

  if (!started) {
    return (
      <div
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: '48px 40px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
          animation: 'scaleIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        }}
      >
        {/* Ambient glow */}
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

          <h2 style={{ fontSize: 18, fontWeight: 600, color: C.text1, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            {meeting.title}
          </h2>
          <p style={{ fontSize: 13, color: C.text2, margin: '0 0 4px' }}>
            {meeting.contact} · {meeting.company}
          </p>
          <p style={{ fontSize: 12, color: C.text3, margin: '0 0 28px' }}>
            {meeting.phases.length} Phasen · {totalDuration} min geplant
          </p>

          <button
            onClick={handleStart}
            className="s-primary-glow"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 28px',
              borderRadius: 10,
              background: 'linear-gradient(135deg, #4F46E5, #6366F1)',
              border: 'none',
              color: '#fff',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
            }}
          >
            <SvgIcon d={ICONS.mic} size={16} color="#fff" />
            Aufnahme starten
          </button>
        </div>
      </div>
    );
  }

  // ─── RECORDING ────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Top Bar — Timer & Controls */}
      <div
        style={{
          background: C.surface,
          border: `1px solid ${recording ? 'rgba(248,113,113,0.2)' : C.border}`,
          borderRadius: 12,
          padding: '16px 22px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 2px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
        }}
      >
        {/* Recording indicator */}
        {recording && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(248,113,113,0.4), transparent)',
            }}
          />
        )}

        {/* Track indicators */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Mic track */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: micActive && !paused ? '#F87171' : C.text3,
                animation: micActive && !paused ? 'pulse-live 1.5s ease-in-out infinite' : 'none',
                boxShadow: micActive && !paused ? '0 0 8px rgba(248,113,113,0.4)' : 'none',
              }}
            />
            <span
              style={{ fontSize: 10, fontWeight: 600, color: micActive ? '#F87171' : C.text3, letterSpacing: '0.06em' }}
            >
              MIKRO
            </span>
          </div>
          {/* System audio track */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: systemActive && !paused ? '#38BDF8' : C.text3,
                animation: systemActive && !paused ? 'pulse-live 1.5s ease-in-out infinite' : 'none',
                boxShadow: systemActive && !paused ? '0 0 8px rgba(56,189,248,0.4)' : 'none',
              }}
            />
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: systemActive ? '#38BDF8' : C.text3,
                letterSpacing: '0.06em',
              }}
            >
              {systemActive ? 'SYSTEM' : 'SYSTEM —'}
            </span>
          </div>
        </div>

        {/* Timer: actual vs planned */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              color: isOvertime ? '#F87171' : C.text1,
              letterSpacing: '-0.02em',
              textShadow: isOvertime ? '0 0 20px rgba(248,113,113,0.3)' : `0 0 30px ${C.accent}20`,
            }}
          >
            {formatTime(elapsed)}
          </div>
          <div style={{ fontSize: 12, color: C.text3, fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>
            / {formatTime(plannedSeconds)}
          </div>
          {isOvertime && (
            <div
              style={{
                fontSize: 10,
                color: '#F87171',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 4,
                background: 'rgba(248,113,113,0.08)',
                border: '1px solid rgba(248,113,113,0.15)',
              }}
            >
              +{formatTime(elapsed - plannedSeconds)}
            </div>
          )}
        </div>

        {/* Current Phase */}
        <div
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            background: C.accentGhost,
            border: `1px solid ${C.borderAccent}`,
          }}
        >
          <div style={{ fontSize: 9, color: C.text3, letterSpacing: '0.06em' }}>
            PHASE {currentPhaseIndex + 1}/{meeting.phases.length}
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, color: C.accentBright, marginTop: 1 }}>
            {currentPhase?.name ?? '—'}
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Overall Progress */}
        <div style={{ width: 120, marginRight: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 9, color: C.text3 }}>Fortschritt</span>
            <span style={{ fontSize: 9, fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: C.text3 }}>
              {Math.round(overallProgress * 100)}%
            </span>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.04)' }}>
            <div
              style={{
                height: '100%',
                width: `${overallProgress * 100}%`,
                borderRadius: 2,
                background:
                  overallProgress > 1
                    ? `linear-gradient(90deg, ${C.warning}, ${C.danger})`
                    : `linear-gradient(90deg, ${C.accentDim}, ${C.accent})`,
                transition: 'width 1s linear',
              }}
            />
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={handlePause}
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${C.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            title={paused ? 'Fortsetzen' : 'Pausieren'}
          >
            <SvgIcon d={paused ? ICONS.play : ICONS.list} size={14} color={C.text2} />
          </button>
          <button
            onClick={handleEnd}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 9,
              background: 'rgba(248,113,113,0.1)',
              border: '1px solid rgba(248,113,113,0.2)',
              color: '#F87171',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: 2, background: '#F87171' }} />
            Beenden
          </button>
        </div>
      </div>

      {/* Main Content — Phase Tracker + Notes + Prep Reference */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 280px', gap: 14 }}>
        <PhaseTracker
          phases={meeting.phases}
          currentPhaseIndex={currentPhaseIndex}
          onGoToPhase={goToPhase}
          onAdvance={advancePhase}
        />
        <LiveNotes
          notes={notes}
          onAddNote={addNote}
          elapsedSeconds={elapsed}
          currentPhaseName={currentPhase?.name ?? ''}
          currentPhaseId={currentPhase?.id ?? ''}
        />
        <LivePrepPanel meeting={meeting} lead={lead ?? null} currentPhase={currentPhase} />
      </div>

      {/* Audio recorded indicator */}
      {(micUrl || systemUrl) && !recording && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: 10,
            background: C.successBg,
            border: `1px solid ${C.successBorder}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            animation: 'fadeInUp 0.3s ease both',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <SvgIcon d={ICONS.check} size={14} color={C.success} />
            <span style={{ fontSize: 13, color: C.success, fontWeight: 500 }}>
              {micUrl && systemUrl ? '2 Spuren aufgenommen' : 'Aufnahme gespeichert'}
            </span>
          </div>
          {micUrl && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: '#F87171', fontWeight: 600, minWidth: 60 }}>Mikro</span>
              <audio src={micUrl} controls style={{ flex: 1, height: 32 }} />
            </div>
          )}
          {systemUrl && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: '#38BDF8', fontWeight: 600, minWidth: 60 }}>System</span>
              <audio src={systemUrl} controls style={{ flex: 1, height: 32 }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
