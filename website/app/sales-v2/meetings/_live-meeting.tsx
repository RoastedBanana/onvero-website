'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { C, SvgIcon, ICONS, showToast } from '../_shared';
import type { Meeting, MeetingPhase } from './_meeting-store';

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

// ─── AUDIO RECORDER HOOK ────────────────────────────────────────────────────

function useAudioRecorder() {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const onStopResolve = useRef<((blob: Blob) => void) | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Pick a supported MIME type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : '';
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunks.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };

      recorder.onstop = () => {
        const type = recorder.mimeType || 'audio/webm';
        const blob = new Blob(chunks.current, { type });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
        // Resolve the promise so stopRecording can return the blob
        if (onStopResolve.current) {
          onStopResolve.current(blob);
          onStopResolve.current = null;
        }
      };

      mediaRecorder.current = recorder;
      recorder.start(1000); // collect chunks every second
      setRecording(true);
      showToast('Aufnahme gestartet', 'success');
    } catch {
      showToast('Mikrofon-Zugriff verweigert', 'error');
    }
  }, []);

  // Returns a promise that resolves with the Blob once recording fully stops
  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
        onStopResolve.current = resolve;
        mediaRecorder.current.stop();
        setRecording(false);
      } else {
        resolve(audioBlob);
      }
    });
  }, [audioBlob]);

  return { recording, audioUrl, audioBlob, startRecording, stopRecording };
}

// ─── PHASE TRACKER ──────────────────────────────────────────────────────────

function PhaseTracker({ phases, elapsedSeconds }: { phases: MeetingPhase[]; elapsedSeconds: number }) {
  const totalDuration = phases.reduce((s, p) => s + p.duration, 0);
  const elapsedMinutes = elapsedSeconds / 60;

  let accumulated = 0;
  let currentPhaseIndex = 0;
  for (let i = 0; i < phases.length; i++) {
    if (elapsedMinutes < accumulated + phases[i].duration) {
      currentPhaseIndex = i;
      break;
    }
    accumulated += phases[i].duration;
    if (i === phases.length - 1) currentPhaseIndex = i;
  }

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
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {phases.map((phase, i) => {
          const phaseStart = phases.slice(0, i).reduce((s, p) => s + p.duration, 0);
          const phaseEnd = phaseStart + phase.duration;
          const isCurrent = i === currentPhaseIndex;
          const isDone = elapsedMinutes >= phaseEnd;
          const progress = isCurrent ? Math.min(1, (elapsedMinutes - phaseStart) / phase.duration) : isDone ? 1 : 0;

          return (
            <div
              key={phase.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 8,
                background: isCurrent ? `${C.accent}08` : 'transparent',
                border: `1px solid ${isCurrent ? C.borderAccent : 'transparent'}`,
                transition: 'all 0.3s ease',
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
                {/* Progress bar for current phase */}
                {isCurrent && (
                  <div
                    style={{
                      height: 2,
                      borderRadius: 1,
                      background: 'rgba(255,255,255,0.04)',
                      marginTop: 4,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${progress * 100}%`,
                        borderRadius: 1,
                        background: `linear-gradient(90deg, ${C.accentDim}, ${C.accent})`,
                        transition: 'width 1s linear',
                      }}
                    />
                  </div>
                )}
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
            </div>
          );
        })}
      </div>
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

// ─── MAIN LIVE MEETING VIEW ─────────────────────────────────────────────────

export default function LiveMeeting({
  meeting,
  onEnd,
}: {
  meeting: Meeting;
  onEnd: (data: { audioBlob: Blob | null; notes: TimestampedNote[]; durationSeconds: number }) => void;
}) {
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [notes, setNotes] = useState<TimestampedNote[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { recording, audioUrl, audioBlob, startRecording, stopRecording } = useAudioRecorder();

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

  // Current phase
  const elapsedMinutes = elapsed / 60;
  let accumulated = 0;
  let currentPhaseIndex = 0;
  for (let i = 0; i < meeting.phases.length; i++) {
    if (elapsedMinutes < accumulated + meeting.phases[i].duration) {
      currentPhaseIndex = i;
      break;
    }
    accumulated += meeting.phases[i].duration;
    if (i === meeting.phases.length - 1) currentPhaseIndex = i;
  }
  const currentPhase = meeting.phases[currentPhaseIndex];
  const totalDuration = meeting.phases.reduce((s, p) => s + p.duration, 0);
  const overallProgress = Math.min(1, elapsedMinutes / totalDuration);

  const handleStart = async () => {
    setStarted(true);
    await startRecording();
  };

  const handlePause = () => {
    setPaused(!paused);
  };

  const handleEnd = async () => {
    const blob = await stopRecording();
    setStarted(false);
    onEnd({ audioBlob: blob, notes, durationSeconds: elapsed });
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

        {/* Live dot */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: recording && !paused ? '#F87171' : C.text3,
              animation: recording && !paused ? 'pulse-live 1.5s ease-in-out infinite' : 'none',
              boxShadow: recording && !paused ? '0 0 12px rgba(248,113,113,0.4)' : 'none',
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: recording && !paused ? '#F87171' : C.text3,
              letterSpacing: '0.08em',
            }}
          >
            {paused ? 'PAUSIERT' : recording ? 'AUFNAHME' : 'GESTOPPT'}
          </span>
        </div>

        {/* Timer */}
        <div
          style={{
            fontSize: 32,
            fontWeight: 700,
            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            color: C.text1,
            letterSpacing: '-0.02em',
            textShadow: `0 0 30px ${C.accent}20`,
          }}
        >
          {formatTime(elapsed)}
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
          <div style={{ fontSize: 9, color: C.text3, letterSpacing: '0.06em' }}>AKTUELLE PHASE</div>
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

      {/* Main Content — Phase Tracker + Notes */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 14 }}>
        <PhaseTracker phases={meeting.phases} elapsedSeconds={elapsed} />
        <LiveNotes
          notes={notes}
          onAddNote={addNote}
          elapsedSeconds={elapsed}
          currentPhaseName={currentPhase?.name ?? ''}
          currentPhaseId={currentPhase?.id ?? ''}
        />
      </div>

      {/* Audio recorded indicator */}
      {audioUrl && !recording && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: 10,
            background: C.successBg,
            border: `1px solid ${C.successBorder}`,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            animation: 'fadeInUp 0.3s ease both',
          }}
        >
          <SvgIcon d={ICONS.check} size={14} color={C.success} />
          <span style={{ fontSize: 13, color: C.success, fontWeight: 500 }}>Aufnahme gespeichert</span>
          <audio src={audioUrl} controls style={{ marginLeft: 'auto', height: 32 }} />
        </div>
      )}
    </div>
  );
}
