'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic, Upload, X, FileAudio, Loader2, ChevronRight, ChevronDown,
  Sparkles, ListChecks,
} from 'lucide-react';
import { tokens } from '@/lib/design-tokens';
import { useTenant } from '@/hooks/useTenant';
import Markdown from 'react-markdown';
import { Download } from 'lucide-react';
import { MeetingSummaryCard, type MeetingSummaryResult } from '@/components/dashboard/MeetingSummaryCard';

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
      background: '#111',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 10,
      padding: 20,
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

interface PlannedMeetingOption {
  id: string;
  title: string;
  scheduled_at: string;
  label: string;
}

function MeetingResultPopup({
  transcript,
  onClose,
  onSaved,
  tenantId,
  supabase,
}: {
  transcript: string;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
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

  // Planned meetings dropdown
  const [plannedOptions, setPlannedOptions] = useState<PlannedMeetingOption[]>([]);
  const [selectedPlannedId, setSelectedPlannedId] = useState<string>('');

  useEffect(() => {
    (async () => {
      // Fetch recent and upcoming planned meetings (last 24h to next 7 days)
      const dayAgo = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
      const { data } = await supabase
        .from('planned_meetings')
        .select('id, title, scheduled_at')
        .eq('tenant_id', tenantId)
        .in('status', ['confirmed', 'planned'])
        .gte('scheduled_at', dayAgo)
        .order('scheduled_at', { ascending: true });
      if (data && data.length > 0) {
        const now = new Date();
        const options: PlannedMeetingOption[] = data.map((r: Record<string, unknown>) => {
          const sa = new Date(r.scheduled_at as string);
          const isToday = sa.toDateString() === now.toDateString();
          const time = sa.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
          const dateLabel = isToday ? 'Heute' : sa.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });
          return {
            id: r.id as string,
            title: (r.title as string) || 'Meeting',
            scheduled_at: r.scheduled_at as string,
            label: `${r.title || 'Meeting'} — ${dateLabel}, ${time}`,
          };
        });
        setPlannedOptions(options);
        // Default: closest meeting to now
        let closest = options[0];
        let minDiff = Infinity;
        for (const o of options) {
          const diff = Math.abs(new Date(o.scheduled_at).getTime() - now.getTime());
          if (diff < minDiff) { minDiff = diff; closest = o; }
        }
        setSelectedPlannedId(closest.id);
        setTitle(closest.title);
      }
    })();
  }, [tenantId, supabase]);

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

  const [processing, setProcessing] = useState(false);
  const [summaryResult, setSummaryResult] = useState<MeetingSummaryResult | null>(null);

  const handleWeiter = async () => {
    setProcessing(true);
    try {
      // Get planned meeting details if assigned
      let meetingDetails: Record<string, unknown> = {};
      if (selectedPlannedId) {
        const { data } = await supabase
          .from('planned_meetings')
          .select('*')
          .eq('id', selectedPlannedId)
          .single();
        if (data) meetingDetails = data as Record<string, unknown>;
      }

      // Send to webhook
      const res = await fetch('https://n8n.srv1223027.hstgr.cloud/webhook/meeting-summarizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          tenant_id: tenantId,
          planned_meeting_id: selectedPlannedId || null,
          title: title || meetingDetails.title || 'Meeting',
          meeting_type: meetingDetails.meeting_type || null,
          scheduled_at: meetingDetails.scheduled_at || null,
          duration_minutes: meetingDetails.duration_minutes || null,
          objectives: meetingDetails.objectives || [],
          internal_participants: meetingDetails.internal_participants || [],
          external_participants: meetingDetails.external_participants || [],
        }),
      });

      const text = await res.text();
      let webhookResult: Record<string, unknown> = {};
      try { webhookResult = JSON.parse(text); } catch { /* plain text */ }

      // Handle array response from n8n
      const data = (Array.isArray(webhookResult) ? webhookResult[0] : webhookResult) as Record<string, unknown>;

      // Save to meeting_summaries
      const summaryRow = {
        tenant_id: tenantId,
        title: title.trim() || (data?.title as string) || 'Meeting ' + new Date().toLocaleDateString('de-DE'),
        transcript,
        summary: (data?.summary ?? data?.text ?? '') as string,
        todos: data?.todos ?? null,
        participants: Array.isArray(data?.participants) ? (data.participants as { name: string }[]).map(p => typeof p === 'string' ? p : p.name) : [],
        score: typeof data?.score === 'number' ? data.score : null,
        score_breakdown: data?.score_breakdown ?? null,
        improvements: data?.improvements ?? null,
        objectives_evaluation: data?.objectives_evaluation ?? null,
        participant_scores: data?.participants ?? null,
        duration_minutes: (data?.duration_minutes as number) ?? (meetingDetails.duration_minutes as number) ?? null,
        summary_type: (data?.summary_type as string) ?? null,
        planned_meeting_id: selectedPlannedId || null,
      };

      const { data: inserted, error } = await supabase
        .from('meeting_summaries')
        .insert(summaryRow)
        .select('id')
        .single();

      if (error) {
        console.error('Save failed:', error);
        alert('Fehler beim Speichern: ' + error.message);
      } else {
        if (selectedPlannedId && inserted?.id) {
          await supabase
            .from('planned_meetings')
            .update({ meeting_summary_id: inserted.id })
            .eq('id', selectedPlannedId);
        }
        await onSaved();

        // Build summary result for card
        setSummaryResult({
          id: inserted?.id ?? '',
          summary: summaryRow.summary,
          score: (summaryRow.score as number) ?? 0,
          score_breakdown: (data?.score_breakdown as MeetingSummaryResult['score_breakdown']) ?? { struktur: 0, effizienz: 0, klarheit: 0, beschluesse: 0, beteiligung: 0 },
          improvements: (data?.improvements as MeetingSummaryResult['improvements']) ?? { kritisch: [], wichtig: [], positiv: [] },
          objectives_evaluation: (data?.objectives_evaluation as MeetingSummaryResult['objectives_evaluation']) ?? [],
          todos: (data?.todos as MeetingSummaryResult['todos']) ?? [],
          participants: (data?.participants as MeetingSummaryResult['participants']) ?? [],
          could_have_been_email: (data?.could_have_been_email as boolean) ?? false,
          duration_minutes: summaryRow.duration_minutes ?? undefined,
          title: summaryRow.title,
          summary_type: summaryRow.summary_type ?? undefined,
        });
      }
    } catch (err) {
      console.error('Webhook error:', err);
      alert('Fehler bei der Verarbeitung');
    } finally {
      setProcessing(false);
    }
  };

  // Show summary card after webhook response
  if (summaryResult) {
    return (
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, backdropFilter: 'blur(6px)',
        }}
      >
        <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto' }}>
          <MeetingSummaryCard
            result={summaryResult}
            onClose={onClose}
            onTodosUpdated={onSaved}
          />
        </div>
      </div>
    );
  }

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
          borderRadius: tokens.radius.xl, width: '100%', maxWidth: 420,
          maxHeight: '60vh', overflow: 'auto', padding: 0,
          animation: 'fadeSlideIn .25s ease',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* ── Header ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0.85rem 1.25rem', borderBottom: `1px solid ${tokens.bg.border}`,
        }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: tokens.text.primary, margin: 0 }}>
            Aufnahme zuordnen
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.text.muted, padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Content ── */}
        <div style={{ padding: '1rem 1.25rem', overflowY: 'auto', flex: 1 }}>

          {/* ── Meeting zuordnen ── */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block', fontSize: '0.72rem', fontWeight: 500, color: tokens.text.muted,
              textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem',
            }}>
              Meeting zuordnen
            </label>
            <select
              value={selectedPlannedId}
              onChange={(e) => {
                setSelectedPlannedId(e.target.value);
                const opt = plannedOptions.find((o) => o.id === e.target.value);
                if (opt) setTitle(opt.title);
              }}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${tokens.bg.border}`, borderRadius: 8,
                color: '#fff', fontSize: '0.9rem', fontWeight: 500,
                padding: '0.65rem 0.75rem', outline: 'none',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
              }}
            >
              <option value="" style={{ background: '#1a1a1a' }}>— Kein Meeting zuordnen —</option>
              {plannedOptions.map((o) => (
                <option key={o.id} value={o.id} style={{ background: '#1a1a1a' }}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* ── Transcript ── */}
          <div>
            <label style={{
              display: 'block', fontSize: '0.72rem', fontWeight: 500, color: tokens.text.muted,
              textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem',
            }}>
              Transkript
            </label>
            <div style={{
              fontSize: '0.8rem', color: tokens.text.secondary,
              lineHeight: 1.55, whiteSpace: 'pre-wrap',
              background: 'rgba(255,255,255,0.02)', borderRadius: 8,
              padding: '0.75rem', border: `1px solid ${tokens.bg.border}`,
              maxHeight: 150, overflowY: 'auto',
            }}>
              {transcript}
            </div>
          </div>
        </div>

        {/* ── Save Button ── */}
        <div style={{
          padding: '0.85rem 1.25rem', borderTop: `1px solid ${tokens.bg.border}`,
        }}>
          <button
            onClick={handleWeiter}
            disabled={processing}
            style={{
              width: '100%', padding: '0.6rem',
              background: processing ? 'rgba(107,122,255,0.15)' : 'rgba(255,255,255,0.92)',
              color: processing ? '#6B7AFF' : '#0a0a0a',
              border: processing ? '1px solid rgba(107,122,255,0.3)' : 'none',
              borderRadius: 8,
              fontWeight: 600, fontSize: '0.88rem',
              cursor: processing ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              transition: 'all 0.2s',
            }}
          >
            {processing && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />}
            {processing ? 'Wird verarbeitet…' : 'Weiter'}
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

  // Next planned meeting
  const [nextPlanned, setNextPlanned] = useState<{
    title: string; time: string; date: string; duration: number; participantCount: number; isLive: boolean;
  } | null>(null);

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

  const fetchNextPlanned = useCallback(async () => {
    if (!tenantId) return;
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60_000).toISOString();
    const { data } = await supabase
      .from('planned_meetings')
      .select('title, scheduled_at, duration_minutes, internal_participants, external_participants')
      .eq('tenant_id', tenantId)
      .neq('status', 'draft')
      .gte('scheduled_at', fourHoursAgo)
      .order('scheduled_at', { ascending: true })
      .limit(5);
    if (data && data.length > 0) {
      const now = new Date();
      const row = data.find((r: Record<string, unknown>) => {
        const start = new Date(r.scheduled_at as string);
        const end = new Date(start.getTime() + ((r.duration_minutes as number) ?? 30) * 60_000);
        return end > now;
      });
      if (row) {
        const scheduledAt = new Date(row.scheduled_at as string);
        const dur = (row.duration_minutes as number) ?? 30;
        const end = new Date(scheduledAt.getTime() + dur * 60_000);
        const isToday = scheduledAt.toDateString() === now.toDateString();
        const isTomorrow = scheduledAt.toDateString() === new Date(now.getTime() + 86400_000).toDateString();
        const dateLabel = isToday ? 'Heute' : isTomorrow ? 'Morgen' : scheduledAt.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });
        const pCount = ((row.internal_participants as unknown[]) ?? []).length + ((row.external_participants as unknown[]) ?? []).length;
        setNextPlanned({
          title: (row.title as string) || 'Meeting',
          time: scheduledAt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
          date: dateLabel,
          duration: dur,
          participantCount: pCount,
          isLive: now >= scheduledAt && now <= end,
        });
      } else {
        setNextPlanned(null);
      }
    } else {
      setNextPlanned(null);
    }
  }, [tenantId, supabase]);

  useEffect(() => {
    if (!tenantLoading && tenantId) {
      fetchMeetings();
      fetchNextPlanned();
    }
  }, [tenantLoading, tenantId, fetchMeetings, fetchNextPlanned]);

  // Re-check live status every 30s
  useEffect(() => {
    const iv = setInterval(fetchNextPlanned, 30_000);
    return () => clearInterval(iv);
  }, [fetchNextPlanned]);

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
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)' }}>
      {/* ── Next Meeting Card ─────────────────────────────────────────── */}
      <div className={nextPlanned?.isLive && recordState !== 'recording' ? 'record-card-live' : ''} style={{
        background: '#111',
        border: `1px solid ${nextPlanned?.isLive && recordState !== 'recording' ? 'rgba(107,122,255,0.4)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 10, padding: 20, marginBottom: 20,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: recordState === 'recording' ? 'rgba(239,68,68,0.15)' : 'rgba(107,122,255,0.12)',
            border: `1px solid ${recordState === 'recording' ? 'rgba(239,68,68,0.3)' : 'rgba(107,122,255,0.25)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {recordState === 'recording'
              ? <Mic size={22} style={{ color: '#ef4444', animation: 'glowPulse 2s ease-in-out infinite' }} />
              : <ChevronRight size={22} style={{ color: '#6B7AFF' }} />
            }
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.09em', color: recordState === 'recording' ? 'rgba(255,255,255,0.35)' : nextPlanned?.isLive ? '#6B7AFF' : 'rgba(255,255,255,0.35)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              {recordState === 'recording' ? 'Aufnahme läuft' : nextPlanned?.isLive ? (
                <>
                  <span className="record-live-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#6B7AFF', display: 'inline-block' }} />
                  Jetzt Live
                </>
              ) : 'Nächstes Meeting'}
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>
              {recordState === 'recording'
                ? 'Aufnahme läuft...'
                : nextPlanned ? nextPlanned.title : 'Kein Meeting geplant'
              }
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
              {recordState === 'recording'
                ? `${formatTimer(elapsed)} aufgenommen`
                : nextPlanned
                  ? `${nextPlanned.date}, ${nextPlanned.time} · ${nextPlanned.duration} min${nextPlanned.participantCount > 0 ? ` · ${nextPlanned.participantCount} Teilnehmer` : ''}`
                  : 'Erstelle ein Meeting im Prepare-Tab'
              }
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {recordState === 'recording' ? (
            <>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'glowPulse 2s ease-in-out infinite' }} />
              <span style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-dm-mono)', color: '#fff' }}>
                {formatTimer(elapsed)}
              </span>
            </>
          ) : nextPlanned ? (
            <span style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-dm-mono)', color: '#6B7AFF' }}>
              {nextPlanned.time}
            </span>
          ) : null}
        </div>
      </div>

      {/* ── Action Cards ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1 }}>

        {/* Card 1 – Record */}
        <Card style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          ...(nextPlanned?.isLive && recordState !== 'recording' ? { borderColor: 'rgba(107,122,255,0.35)', boxShadow: '0 0 20px rgba(107,122,255,0.08)' } : {}),
        }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '1.5rem', color: tokens.text.primary }}>
            Meeting aufnehmen
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {recordState === 'recording' && (
                <div style={{
                  position: 'absolute', width: 140, height: 140, borderRadius: '50%',
                  border: '2px solid rgba(239,68,68,0.4)',
                  animation: 'glowRing 2s ease-in-out infinite',
                }} />
              )}
              {recordState === 'recording' && (
                <div style={{
                  position: 'absolute', width: 120, height: 120, borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 70%)',
                  animation: 'glowPulse 2s ease-in-out infinite',
                }} />
              )}
              <button
                onClick={recordState === 'idle' || recordState === 'done' ? startRecording : undefined}
                disabled={recordState === 'processing' || recordState === 'recording'}
                style={{
                  position: 'relative', zIndex: 1,
                  width: 100, height: 100, borderRadius: '50%',
                  border: 'none', cursor: recordState === 'processing' ? 'not-allowed' : recordState === 'recording' ? 'default' : 'pointer',
                  background: recordState === 'recording' ? '#ef4444' : 'rgba(255,255,255,0.08)',
                  color: recordState === 'recording' ? '#fff' : tokens.text.secondary,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .2s',
                }}
              >
                {recordState === 'processing'
                  ? <Loader2 size={40} style={{ animation: 'spin 1s linear infinite' }} />
                  : <Mic size={40} />}
              </button>
            </div>

            {recordState === 'recording' && (
              <span style={{
                fontSize: '2rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums',
                color: tokens.text.primary, letterSpacing: '0.05em',
              }}>
                {formatTimer(elapsed)}
              </span>
            )}

            <span style={{ fontSize: '0.95rem', color: tokens.text.secondary }}>
              {recordState === 'idle' && 'Klicke zum Starten'}
              {recordState === 'recording' && 'Aufnahme läuft...'}
              {recordState === 'processing' && 'Wird transkribiert...'}
              {recordState === 'done' && 'Fertig!'}
            </span>

            {nextPlanned?.isLive && recordState === 'idle' && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: '0.75rem',
                fontSize: 12, fontWeight: 600, color: '#6B7AFF',
              }}>
                <span className="record-live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#6B7AFF', display: 'inline-block' }} />
                „{nextPlanned.title}" kann jetzt aufgenommen werden
              </div>
            )}

            {recordState === 'recording' && (
              <button
                onClick={stopRecording}
                style={{
                  marginTop: '0.5rem', padding: '0.65rem 2.5rem',
                  background: 'rgba(255,255,255,0.9)', color: '#0a0a0a',
                  border: 'none', borderRadius: tokens.radius.sm,
                  fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer',
                }}
              >
                Fertig
              </button>
            )}

            {recordError && (
              <span style={{ fontSize: '0.85rem', color: '#f87171' }}>{recordError}</span>
            )}
          </div>
        </Card>

        {/* Card 2 – Upload */}
        <Card style={{
          display: 'flex', flexDirection: 'column', padding: 12,
          ...(nextPlanned?.isLive && recordState !== 'recording' ? { borderColor: 'rgba(107,122,255,0.35)', boxShadow: '0 0 20px rgba(107,122,255,0.08)' } : {}),
        }}>
          {uploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', flex: 1 }}>
              <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: tokens.text.secondary }} />
              <span style={{ fontSize: '0.95rem', color: tokens.text.secondary }}>
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
                  border: `2px dashed ${dragOver ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 10,
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  textAlign: 'center', cursor: 'pointer',
                  transition: 'border-color .2s, background .2s',
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
                    <Upload size={36} style={{ color: 'rgba(255,255,255,0.25)', marginBottom: '0.75rem' }} />
                    <p style={{ fontSize: '1.05rem', fontWeight: 600, color: tokens.text.secondary, margin: 0 }}>
                      Datei hierher ziehen oder klicken
                    </p>
                    <p style={{ fontSize: '0.82rem', color: tokens.text.muted, margin: '0.4rem 0 0' }}>
                      MP3, MP4, M4A, WebM, WAV, OGG
                    </p>
                    {nextPlanned?.isLive && recordState !== 'recording' && (
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: '0.75rem',
                        fontSize: 12, fontWeight: 600, color: '#6B7AFF',
                      }}>
                        <span className="record-live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#6B7AFF', display: 'inline-block' }} />
                        „{nextPlanned.title}" kann jetzt hochgeladen werden
                      </div>
                    )}
                  </>
                )}
              </div>

              {selectedFile && (
                <button
                  onClick={handleUpload}
                  style={{
                    marginTop: 12, width: '100%', padding: '0.7rem',
                    background: 'rgba(255,255,255,0.9)', color: '#0a0a0a',
                    border: 'none', borderRadius: 8,
                    fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer',
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


      {/* ── Keyframes ───────────────────────────────────────────────────── */}
      <style>{`
        .meeting-md h1, .meeting-md h2, .meeting-md h3, .meeting-md h4 {
          margin: 0.8rem 0 0.4rem; font-weight: 600; color: #f5f5f5;
        }
        .meeting-md h1 { font-size: 1.1rem; }
        .meeting-md h2 { font-size: 1rem; }
        .meeting-md h3 { font-size: 0.92rem; }
        .meeting-md h4 { font-size: 0.88rem; color: rgba(255,255,255,0.7); }
        .meeting-md p { margin: 0.4rem 0; }
        .meeting-md ul, .meeting-md ol { margin: 0.4rem 0; padding-left: 1.4rem; }
        .meeting-md li { margin: 0.2rem 0; }
        .meeting-md li::marker { color: rgba(255,255,255,0.3); }
        .meeting-md strong { color: #fff; font-weight: 600; }
        .meeting-md hr { border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 0.75rem 0; }
        .meeting-md > *:first-child { margin-top: 0; }
        .meeting-md > *:last-child { margin-bottom: 0; }
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
        @keyframes recordCardPulse {
          0% { box-shadow: 0 0 0 0 rgba(107,122,255,0.4); }
          70% { box-shadow: 0 0 0 8px rgba(107,122,255,0); }
          100% { box-shadow: 0 0 0 0 rgba(107,122,255,0); }
        }
        @keyframes recordLiveDot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .record-card-live {
          animation: recordCardPulse 2s ease-in-out infinite;
        }
        .record-live-dot {
          animation: recordLiveDot 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

// ── Storage Component (meetings table + detail modal) ────────────────────────

export function MeetingsStorage() {
  const { tenantId, supabase, loading: tenantLoading } = useTenant();
  const [meetings, setMeetings] = useState<MeetingSummary[]>([]);
  const [tableLoading, setTableLoading] = useState(true);
  const [detailMeeting, setDetailMeeting] = useState<MeetingSummary | null>(null);

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

  return (
    <div>
      <div style={{
        background: '#111', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 10, overflow: 'hidden',
      }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 style={{ fontSize: 12, fontWeight: 600, color: '#fff', margin: 0 }}>Alle Meetings</h2>
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
                  }}>{h}</th>
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

      {/* Detail Modal */}
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
              <button onClick={() => setDetailMeeting(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.text.muted }}>
                <X size={20} />
              </button>
            </div>

            {detailMeeting.participants?.length > 0 && (
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                {detailMeeting.participants.map((p) => (
                  <span key={p} style={{
                    background: 'rgba(255,255,255,0.08)', borderRadius: 6,
                    padding: '0.2rem 0.6rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)',
                  }}>{p}</span>
                ))}
              </div>
            )}

            {detailMeeting.summary && (
              <CollapsibleSection title="Zusammenfassung" defaultOpen={true}>
                <div className="meeting-md" style={{ fontSize: '0.9rem', color: tokens.text.primary, lineHeight: 1.6 }}>
                  <Markdown>{detailMeeting.summary}</Markdown>
                </div>
              </CollapsibleSection>
            )}

            {detailMeeting.todos && (
              <CollapsibleSection title="To-Dos" defaultOpen={true}>
                <div className="meeting-md" style={{ fontSize: '0.9rem', color: tokens.text.primary, lineHeight: 1.6 }}>
                  <Markdown>{detailMeeting.todos}</Markdown>
                </div>
              </CollapsibleSection>
            )}

            <CollapsibleSection title="Transkript" defaultOpen={true}>
              <div style={{ fontSize: '0.85rem', color: tokens.text.secondary, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                {detailMeeting.transcript}
              </div>
            </CollapsibleSection>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
