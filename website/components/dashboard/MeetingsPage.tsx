'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic, Upload, X, FileAudio, Loader2, ChevronRight, ChevronDown,
  Sparkles, ListChecks,
} from 'lucide-react';
import { tokens } from '@/lib/design-tokens';
import { useTenant } from '@/hooks/useTenant';

// ── Types ────────────────────────────────────────────────────────────────────

interface MeetingSummary {
  id: string;
  tenant_id: string;
  title: string;
  transcript: string;
  summary: string;
  todos: string;
  participants: string[];
  created_at: string;
}

type RecordingState = 'idle' | 'recording' | 'processing' | 'done';

const ACCEPTED_TYPES = '.mp3,.mp4,.m4a,.webm,.wav,.ogg';
const ACCEPTED_MIME = [
  'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/webm',
  'audio/wav', 'audio/ogg', 'video/mp4', 'video/webm',
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('de-DE', {
    day: 'numeric', month: 'long', year: 'numeric',
  }) + ', ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '...' : text;
}

// ── Card wrapper ─────────────────────────────────────────────────────────────

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: tokens.bg.surface,
      border: `1px solid ${tokens.bg.border}`,
      borderRadius: tokens.radius.lg,
      padding: '2rem',
      flex: 1,
      minWidth: 0,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Collapsible Section ──────────────────────────────────────────────────────

function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderTop: `1px solid ${tokens.bg.border}` }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '0.85rem 0', background: 'none', border: 'none',
          cursor: 'pointer', color: tokens.text.primary,
        }}
      >
        <span style={{ fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {title}
        </span>
        <ChevronDown
          size={14}
          style={{
            color: tokens.text.muted,
            transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'transform 0.15s',
          }}
        />
      </button>
      {open && <div style={{ paddingBottom: '1rem' }}>{children}</div>}
    </div>
  );
}

// ── Participant Tag Input ────────────────────────────────────────────────────

function ParticipantInput({
  participants,
  onChange,
}: {
  participants: string[];
  onChange: (p: string[]) => void;
}) {
  const [input, setInput] = useState('');

  const add = () => {
    const v = input.trim();
    if (v && !participants.includes(v)) onChange([...participants, v]);
    setInput('');
  };

  return (
    <div>
      <label style={{
        display: 'block', fontSize: '0.72rem', fontWeight: 500, color: tokens.text.muted,
        textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem',
      }}>
        Teilnehmer
      </label>
      {participants.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.5rem' }}>
          {participants.map((p) => (
            <span
              key={p}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                background: 'rgba(255,255,255,0.08)', borderRadius: 6,
                padding: '0.25rem 0.6rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)',
              }}
            >
              {p}
              <button
                type="button"
                onClick={() => onChange(participants.filter((x) => x !== p))}
                style={{
                  background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
                  cursor: 'pointer', fontSize: '0.85rem', lineHeight: 1, padding: 0,
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); add(); }
          }}
          placeholder="E-Mail oder Name hinzufügen…"
          style={{
            flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8, color: '#fff', fontSize: '0.85rem', padding: '0.55rem 0.75rem', outline: 'none',
          }}
        />
        <button
          type="button"
          onClick={add}
          style={{
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.7)', borderRadius: 8, padding: '0 0.9rem',
            cursor: 'pointer', fontSize: '0.85rem',
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}

// ── Meeting Result Popup ─────────────────────────────────────────────────────

const SUMMARY_TYPES = [
  { id: 'standard', label: 'Standard' },
  { id: 'sales', label: 'Sales Call' },
  { id: 'one_on_one', label: '1:1 Gespräch' },
  { id: 'standup', label: 'Standup' },
  { id: 'board', label: 'Board Meeting' },
  { id: 'workshop', label: 'Workshop' },
  { id: 'custom', label: 'Custom' },
] as const;

function MeetingResultPopup({
  transcript,
  onClose,
  onSaved,
  tenantId,
  supabase,
}: {
  transcript: string;
  onClose: () => void;
  onSaved: () => void;
  tenantId: string;
  supabase: ReturnType<typeof import('@/hooks/useTenant').useTenant>['supabase'];
}) {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [todos, setTodos] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [summaryMenuPos, setSummaryMenuPos] = useState<{ x: number; y: number } | null>(null);
  const summaryBtnRef = useRef<HTMLDivElement>(null);

  // Close submenu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (summaryBtnRef.current && !summaryBtnRef.current.contains(e.target as Node)) {
        setSummaryMenuPos(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const callWebhook = async (action: 'summarize' | 'todos', summaryType?: string) => {
    setLoadingAction(action);
    setSummaryMenuPos(null);
    try {
      const res = await fetch('/api/meetings/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          summary_type: summaryType ?? 'standard',
          tenant_id: tenantId,
        }),
      });

      const text = await res.text();
      let json: Record<string, unknown> = {};
      try { json = JSON.parse(text); } catch { /* plain text */ }

      if (json.success && json.id) {
        // Webhook saved to Supabase — fetch the row
        const { data } = await supabase
          .from('meeting_summaries')
          .select('*')
          .eq('id', json.id)
          .single();

        if (data) {
          if (data.summary) setSummary(data.summary);
          if (data.todos) setTodos(data.todos);
          if (data.title) setTitle(data.title);
          if (data.participants?.length) setParticipants(data.participants);
        }
      } else {
        // Fallback: use response text directly
        const result = (json.summary ?? json.result ?? json.text ?? text) as string;
        if (action === 'summarize') setSummary(result);
        else if (action === 'todos') setTodos(result);
      }
    } catch (err) {
      console.error('Webhook error:', err);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('meeting_summaries').insert({
      tenant_id: tenantId,
      title: title.trim() || 'Meeting ' + new Date().toLocaleDateString('de-DE'),
      transcript,
      summary,
      todos,
      participants,
    });

    if (error) {
      console.error('Save failed:', error);
      alert('Fehler beim Speichern: ' + error.message);
    } else {
      onSaved();
      onClose();
    }
    setSaving(false);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, backdropFilter: 'blur(6px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: tokens.bg.raised, border: `1px solid ${tokens.bg.borderStrong}`,
          borderRadius: tokens.radius.xl, width: '100%', maxWidth: 520,
          maxHeight: '90vh', overflow: 'auto', padding: 0,
          animation: 'fadeSlideIn .25s ease',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* ── Header ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '1.25rem 1.5rem', borderBottom: `1px solid ${tokens.bg.border}`,
        }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: tokens.text.primary, margin: 0 }}>
            Meeting bearbeiten
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.text.muted, padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Content ── */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>

          {/* ── Action Buttons ── */}
          <div style={{
            display: 'flex', flexDirection: 'column',
            gap: '0.6rem', marginBottom: '1.5rem',
          }}>
            {/* Zusammenfassen with hover submenu */}
            <div
              ref={summaryBtnRef}
              style={{ position: 'relative' }}
            >
              <button
                onClick={(e) => {
                  if (!loadingAction) {
                    setSummaryMenuPos(summaryMenuPos ? null : { x: e.clientX, y: e.clientY });
                  }
                }}
                disabled={!!loadingAction}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                  padding: '0.85rem 1rem', borderRadius: 10, width: '100%',
                  border: `1px solid ${summary ? 'rgba(255,255,255,0.2)' : tokens.bg.border}`,
                  background: summary ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                  color: summary ? tokens.text.primary : tokens.text.secondary,
                  fontSize: '0.9rem', fontWeight: 600, cursor: loadingAction ? 'wait' : 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {loadingAction === 'summarize'
                  ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                  : <Sparkles size={16} style={{ flexShrink: 0 }} />
                }
                Zusammenfassen
              </button>

              {/* Submenu — fixed position next to cursor */}
              {summaryMenuPos && (
                <div
                  onMouseLeave={(e) => {
                    // Don't close if focus is inside (typing in custom input)
                    if (e.currentTarget.contains(document.activeElement)) return;
                    setSummaryMenuPos(null);
                  }}
                  style={{
                    position: 'fixed',
                    left: summaryMenuPos.x + 8,
                    top: summaryMenuPos.y - 10,
                    width: 170, background: '#1a1a1a',
                    border: `1px solid ${tokens.bg.borderStrong}`,
                    borderRadius: 10, padding: '0.35rem',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    zIndex: 9999,
                  }}
                >
                  <p style={{
                    fontSize: '0.65rem', fontWeight: 600, color: tokens.text.muted,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    padding: '0.4rem 0.6rem 0.25rem', margin: 0,
                  }}>
                    Meeting-Typ
                  </p>
                  {SUMMARY_TYPES.filter((t) => t.id !== 'custom').map((t) => (
                    <button
                      key={t.id}
                      onClick={() => callWebhook('summarize', t.id)}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '0.45rem 0.6rem', borderRadius: 6,
                        background: 'none', border: 'none',
                        color: tokens.text.secondary, fontSize: '0.82rem',
                        cursor: 'pointer', transition: 'all 0.1s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                        e.currentTarget.style.color = tokens.text.primary;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'none';
                        e.currentTarget.style.color = tokens.text.secondary;
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                  {/* Custom input */}
                  <div style={{
                    borderTop: `1px solid ${tokens.bg.border}`,
                    marginTop: '0.25rem', paddingTop: '0.35rem',
                  }}>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const input = e.currentTarget.querySelector('input') as HTMLInputElement;
                      const val = input?.value.trim();
                      if (val) callWebhook('summarize', val);
                    }}>
                      <input
                        placeholder="Custom Prompt…"
                        onMouseLeave={(e) => e.stopPropagation()}
                        style={{
                          width: '100%', background: 'rgba(255,255,255,0.04)',
                          border: `1px solid ${tokens.bg.border}`, borderRadius: 6,
                          color: '#fff', fontSize: '0.78rem', padding: '0.4rem 0.5rem',
                          outline: 'none',
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
                        onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </form>
                  </div>
                </div>
              )}
            </div>

            {/* To-Dos */}
            <button
              onClick={() => callWebhook('todos')}
              disabled={!!loadingAction}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                padding: '0.85rem 1rem', borderRadius: 10,
                border: `1px solid ${todos ? 'rgba(255,255,255,0.2)' : tokens.bg.border}`,
                background: todos ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                color: todos ? tokens.text.primary : tokens.text.secondary,
                fontSize: '0.9rem', fontWeight: 600, cursor: loadingAction ? 'wait' : 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {loadingAction === 'todos'
                ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                : <ListChecks size={16} style={{ flexShrink: 0 }} />
              }
              To-Dos erstellen
            </button>
          </div>

          {/* ── Title ── */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'block', fontSize: '0.72rem', fontWeight: 500, color: tokens.text.muted,
              textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem',
            }}>
              Titel
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Sprint Planning Q2"
              style={{
                width: '100%', background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${tokens.bg.border}`, borderRadius: 8,
                color: '#fff', fontSize: '0.9rem', fontWeight: 500,
                padding: '0.65rem 0.75rem', outline: 'none',
              }}
            />
          </div>

          {/* ── AI Summary (collapsible) ── */}
          {summary && (
            <CollapsibleSection title="KI-Zusammenfassung" defaultOpen={true}>
              <p style={{
                fontSize: '0.88rem', color: tokens.text.primary,
                lineHeight: 1.65, whiteSpace: 'pre-wrap', margin: 0,
                background: 'rgba(255,255,255,0.03)', borderRadius: 8,
                padding: '0.85rem', border: `1px solid ${tokens.bg.border}`,
              }}>
                {summary}
              </p>
            </CollapsibleSection>
          )}

          {/* ── Todos (collapsible) ── */}
          {todos && (
            <CollapsibleSection title="To-Dos" defaultOpen={true}>
              <p style={{
                fontSize: '0.88rem', color: tokens.text.primary,
                lineHeight: 1.65, whiteSpace: 'pre-wrap', margin: 0,
                background: 'rgba(255,255,255,0.03)', borderRadius: 8,
                padding: '0.85rem', border: `1px solid ${tokens.bg.border}`,
              }}>
                {todos}
              </p>
            </CollapsibleSection>
          )}

          {/* ── Transcript (collapsible) ── */}
          <CollapsibleSection title="Transkript" defaultOpen={true}>
            <p style={{
              fontSize: '0.85rem', color: tokens.text.secondary,
              lineHeight: 1.65, whiteSpace: 'pre-wrap', margin: 0,
              background: 'rgba(255,255,255,0.02)', borderRadius: 8,
              padding: '0.85rem', border: `1px solid ${tokens.bg.border}`,
              maxHeight: 300, overflowY: 'auto',
            }}>
              {transcript}
            </p>
          </CollapsibleSection>

          {/* ── Participants ── */}
          <div style={{ marginTop: '1rem' }}>
            <ParticipantInput participants={participants} onChange={setParticipants} />
          </div>
        </div>

        {/* ── Save Button ── */}
        <div style={{
          padding: '1rem 1.5rem', borderTop: `1px solid ${tokens.bg.border}`,
        }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%', padding: '0.7rem',
              background: saving ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.92)',
              color: '#0a0a0a', border: 'none', borderRadius: 8,
              fontWeight: 600, fontSize: '0.88rem',
              cursor: saving ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              transition: 'opacity 0.15s',
            }}
          >
            {saving && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
            {saving ? 'Wird gespeichert…' : 'Meeting speichern'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export function MeetingsPage() {
  const { tenantId, supabase, loading: tenantLoading } = useTenant();

  // Recording state
  const [recordState, setRecordState] = useState<RecordingState>('idle');
  const [recordError, setRecordError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [pendingTranscript, setPendingTranscript] = useState<string | null>(null);

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Meeting table
  const [meetings, setMeetings] = useState<MeetingSummary[]>([]);
  const [tableLoading, setTableLoading] = useState(true);

  // Detail modal
  const [detailMeeting, setDetailMeeting] = useState<MeetingSummary | null>(null);

  // ── Fetch meetings ───────────────────────────────────────────────────────

  const fetchMeetings = useCallback(async () => {
    if (!tenantId) return;
    setTableLoading(true);
    const { data, error } = await supabase
      .from('meeting_summaries')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (!error && data) setMeetings(data as MeetingSummary[]);
    setTableLoading(false);
  }, [tenantId, supabase]);

  useEffect(() => {
    if (!tenantLoading && tenantId) fetchMeetings();
  }, [tenantLoading, tenantId, fetchMeetings]);

  // ── Send audio to API ──────────────────────────────────────────────────

  const sendAudio = async (file: Blob, filename: string) => {
    const form = new FormData();
    form.append('audio', file, filename);

    const res = await fetch('/api/meetings/transcribe', {
      method: 'POST',
      body: form,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: 'Unbekannter Fehler' }));
      throw new Error(body.error ?? 'Transkription fehlgeschlagen');
    }

    return res.json() as Promise<{ transcript: string; summary: string }>;
  };

  // ── Recording logic ────────────────────────────────────────────────────

  const startRecording = async () => {
    setRecordError(null);
    setPendingTranscript(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setRecordError(`Mikrofon-API nicht verfügbar. Secure context: ${window.isSecureContext}, Protocol: ${location.protocol}`);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Pick a format Groq Whisper accepts reliably
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : undefined;
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        setRecordState('processing');
        try {
          const result = await sendAudio(blob, 'recording.webm');
          setPendingTranscript(result.transcript);
          setRecordState('done');
        } catch (err) {
          setRecordError(err instanceof Error ? err.message : 'Fehler bei der Verarbeitung');
          setRecordState('idle');
        }
        setElapsed(0);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
      setRecordState('recording');
    } catch (err) {
      const name = err instanceof DOMException ? err.name : '';
      const msg = err instanceof Error ? err.message : String(err);
      setRecordError(`[${name}] ${msg}`);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
  };

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // ── Upload logic ───────────────────────────────────────────────────────

  const handleFileSelect = (file: File) => {
    setUploadError(null);
    if (!ACCEPTED_MIME.some((m) => file.type.startsWith(m.split('/')[0]))) {
      setUploadError('Nicht unterstütztes Dateiformat.');
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploadError(null);
    setUploading(true);
    try {
      const result = await sendAudio(selectedFile, selectedFile.name);
      setSelectedFile(null);
      setPendingTranscript(result.transcript);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload fehlgeschlagen');
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div style={{ animation: 'fadeSlideIn .35s ease' }}>
      <h1 style={{ fontSize: '1.55rem', fontWeight: 600, marginBottom: '0.25rem', color: tokens.text.primary }}>
        Meetings
      </h1>
      <p style={{ color: tokens.text.secondary, fontSize: '0.9rem', marginBottom: '2rem' }}>
        Nimm Meetings auf oder lade Audiodateien hoch – KI erstellt Zusammenfassungen automatisch.
      </p>

      {/* ── Action Cards ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '2.5rem' }}>

        {/* Card 1 – Record */}
        <Card>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1.25rem', color: tokens.text.primary }}>
            Meeting aufnehmen
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {recordState === 'recording' && (
                <div style={{
                  position: 'absolute', width: 110, height: 110, borderRadius: '50%',
                  border: '2px solid rgba(239,68,68,0.4)',
                  animation: 'glowRing 2s ease-in-out infinite',
                }} />
              )}
              {recordState === 'recording' && (
                <div style={{
                  position: 'absolute', width: 96, height: 96, borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 70%)',
                  animation: 'glowPulse 2s ease-in-out infinite',
                }} />
              )}
              <button
                onClick={recordState === 'idle' || recordState === 'done' ? startRecording : undefined}
                disabled={recordState === 'processing' || recordState === 'recording'}
                style={{
                  position: 'relative', zIndex: 1,
                  width: 80, height: 80, borderRadius: '50%',
                  border: 'none', cursor: recordState === 'processing' ? 'not-allowed' : recordState === 'recording' ? 'default' : 'pointer',
                  background: recordState === 'recording' ? '#ef4444' : 'rgba(255,255,255,0.08)',
                  color: recordState === 'recording' ? '#fff' : tokens.text.secondary,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .2s',
                }}
              >
                {recordState === 'processing'
                  ? <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
                  : <Mic size={32} />}
              </button>
            </div>

            {recordState === 'recording' && (
              <span style={{
                fontSize: '1.6rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums',
                color: tokens.text.primary, letterSpacing: '0.05em',
              }}>
                {formatTimer(elapsed)}
              </span>
            )}

            <span style={{ fontSize: '0.85rem', color: tokens.text.secondary }}>
              {recordState === 'idle' && 'Klicke zum Starten'}
              {recordState === 'recording' && 'Aufnahme läuft...'}
              {recordState === 'processing' && 'Wird transkribiert...'}
              {recordState === 'done' && 'Fertig!'}
            </span>

            {recordState === 'recording' && (
              <button
                onClick={stopRecording}
                style={{
                  marginTop: '0.25rem', padding: '0.55rem 2rem',
                  background: 'rgba(255,255,255,0.9)', color: '#0a0a0a',
                  border: 'none', borderRadius: tokens.radius.sm,
                  fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer',
                }}
              >
                Fertig
              </button>
            )}

            {recordError && (
              <span style={{ fontSize: '0.82rem', color: '#f87171' }}>{recordError}</span>
            )}
          </div>
        </Card>

        {/* Card 2 – Upload */}
        <Card>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1.25rem', color: tokens.text.primary }}>
            MP3 hochladen
          </h2>

          {uploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '1.5rem 0' }}>
              <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: tokens.text.secondary }} />
              <span style={{ fontSize: '0.85rem', color: tokens.text.secondary }}>
                Wird transkribiert...
              </span>
            </div>
          ) : (
            <>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? 'rgba(255,255,255,0.3)' : tokens.bg.border}`,
                  borderRadius: tokens.radius.md,
                  padding: '1.5rem', textAlign: 'center', cursor: 'pointer',
                  transition: 'border-color .2s',
                  background: dragOver ? 'rgba(255,255,255,0.03)' : 'transparent',
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_TYPES}
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelect(f);
                    e.target.value = '';
                  }}
                />
                {selectedFile ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <FileAudio size={18} style={{ color: tokens.text.secondary }} />
                    <span style={{ fontSize: '0.88rem', color: tokens.text.primary }}>{selectedFile.name}</span>
                    <span style={{ fontSize: '0.78rem', color: tokens.text.muted }}>
                      ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.text.muted, padding: 2 }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload size={24} style={{ color: tokens.text.muted, marginBottom: '0.5rem' }} />
                    <p style={{ fontSize: '0.85rem', color: tokens.text.secondary, margin: 0 }}>
                      Datei hierher ziehen oder klicken
                    </p>
                    <p style={{ fontSize: '0.75rem', color: tokens.text.muted, margin: '0.25rem 0 0' }}>
                      MP3, MP4, M4A, WebM, WAV, OGG
                    </p>
                  </>
                )}
              </div>

              {selectedFile && (
                <button
                  onClick={handleUpload}
                  style={{
                    marginTop: '1rem', width: '100%', padding: '0.6rem',
                    background: 'rgba(255,255,255,0.9)', color: '#0a0a0a',
                    border: 'none', borderRadius: tokens.radius.sm,
                    fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer',
                  }}
                >
                  Hochladen & Transkribieren
                </button>
              )}

              {uploadError && (
                <span style={{ display: 'block', marginTop: '0.75rem', fontSize: '0.82rem', color: '#f87171' }}>
                  {uploadError}
                </span>
              )}
            </>
          )}
        </Card>
      </div>

      {/* ── Meetings Table ──────────────────────────────────────────────── */}
      <div style={{
        background: tokens.bg.surface,
        border: `1px solid ${tokens.bg.border}`,
        borderRadius: tokens.radius.lg,
        overflow: 'hidden',
      }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: `1px solid ${tokens.bg.border}` }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: tokens.text.primary, margin: 0 }}>
            Vergangene Meetings
          </h2>
        </div>

        {tableLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: tokens.text.muted }} />
          </div>
        ) : meetings.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: tokens.text.muted, fontSize: '0.88rem' }}>
            Noch keine Meetings vorhanden.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${tokens.bg.border}` }}>
                {['Datum', 'Titel', 'Zusammenfassung', ''].map((h) => (
                  <th key={h} style={{
                    padding: '0.75rem 1.5rem', textAlign: 'left',
                    fontSize: '0.78rem', fontWeight: 500,
                    color: tokens.text.muted, textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {meetings.map((m) => (
                <tr
                  key={m.id}
                  style={{ borderBottom: `1px solid ${tokens.bg.border}`, transition: 'background .15s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = tokens.bg.hover)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '0.85rem 1.5rem', fontSize: '0.88rem', color: tokens.text.secondary, whiteSpace: 'nowrap' }}>
                    {formatDate(m.created_at)}
                  </td>
                  <td style={{ padding: '0.85rem 1.5rem', fontSize: '0.88rem', color: tokens.text.primary, fontWeight: 500 }}>
                    {m.title || '–'}
                  </td>
                  <td style={{ padding: '0.85rem 1.5rem', fontSize: '0.88rem', color: tokens.text.secondary }}>
                    {truncate(m.summary || '–', 80)}
                  </td>
                  <td style={{ padding: '0.85rem 1.5rem', textAlign: 'right' }}>
                    <button
                      onClick={() => setDetailMeeting(m)}
                      style={{
                        background: 'rgba(255,255,255,0.06)', border: `1px solid ${tokens.bg.border}`,
                        borderRadius: tokens.radius.sm, padding: '0.35rem 0.85rem',
                        color: tokens.text.secondary, fontSize: '0.82rem',
                        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                      }}
                    >
                      Details <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Meeting Result Popup ──────────────────────────────────────── */}
      {pendingTranscript && tenantId && (
        <MeetingResultPopup
          transcript={pendingTranscript}
          onClose={() => { setPendingTranscript(null); setRecordState('idle'); }}
          onSaved={fetchMeetings}
          tenantId={tenantId}
          supabase={supabase}
        />
      )}

      {/* ── Detail Modal ────────────────────────────────────────────────── */}
      {detailMeeting && (
        <div
          onClick={() => setDetailMeeting(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, backdropFilter: 'blur(4px)',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: tokens.bg.raised, border: `1px solid ${tokens.bg.borderStrong}`,
              borderRadius: tokens.radius.xl, width: '100%', maxWidth: 720,
              maxHeight: '80vh', overflow: 'auto', padding: '2rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: tokens.text.primary, margin: 0 }}>
                  {detailMeeting.title || 'Meeting'}
                </h3>
                <p style={{ fontSize: '0.8rem', color: tokens.text.muted, margin: '0.25rem 0 0' }}>
                  {formatDate(detailMeeting.created_at)}
                </p>
              </div>
              <button
                onClick={() => setDetailMeeting(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.text.muted }}
              >
                <X size={20} />
              </button>
            </div>

            {detailMeeting.participants?.length > 0 && (
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                {detailMeeting.participants.map((p) => (
                  <span key={p} style={{
                    background: 'rgba(255,255,255,0.08)', borderRadius: 6,
                    padding: '0.2rem 0.6rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)',
                  }}>
                    {p}
                  </span>
                ))}
              </div>
            )}

            {detailMeeting.summary && (
              <CollapsibleSection title="Zusammenfassung" defaultOpen={true}>
                <p style={{ fontSize: '0.9rem', color: tokens.text.primary, lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>
                  {detailMeeting.summary}
                </p>
              </CollapsibleSection>
            )}

            {detailMeeting.todos && (
              <CollapsibleSection title="To-Dos" defaultOpen={true}>
                <p style={{ fontSize: '0.9rem', color: tokens.text.primary, lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>
                  {detailMeeting.todos}
                </p>
              </CollapsibleSection>
            )}

            <CollapsibleSection title="Transkript" defaultOpen={true}>
              <p style={{ fontSize: '0.85rem', color: tokens.text.secondary, lineHeight: 1.65, whiteSpace: 'pre-wrap', margin: 0 }}>
                {detailMeeting.transcript}
              </p>
            </CollapsibleSection>
          </div>
        </div>
      )}

      {/* ── Keyframes ───────────────────────────────────────────────────── */}
      <style>{`
        @keyframes glowRing {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.12); opacity: 1; }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.4; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
