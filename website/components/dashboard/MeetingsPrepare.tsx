'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Plus,
  AlertTriangle,
  Clock,
  Users,
  Mail,
  Calendar as CalendarIcon,
  ChevronDown,
  CheckCircle2,
  Circle,
  Video,
  Phone,
  MessageSquare,
  X,
  Loader2,
  Copy,
  Send,
  FileDown,
  Search,
  Sparkles,
} from 'lucide-react';
import Markdown from 'react-markdown';
import { useTenant } from '@/hooks/useTenant';
import { Calendar } from '@/components/ui/calendar-rac';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CalendarDate } from '@internationalized/date';

// ── Styles ───────────────────────────────────────────────────────────────────

const S = {
  card: {
    background: '#111',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 10,
    padding: 20,
  } as React.CSSProperties,
  label: {
    fontSize: 9,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.09em',
    color: 'rgba(255,255,255,0.35)',
    fontWeight: 600,
    marginBottom: 6,
  } as React.CSSProperties,
  val: {
    fontSize: 26,
    fontWeight: 700,
    fontFamily: 'var(--font-dm-mono)',
    lineHeight: 1,
    marginBottom: 3,
  } as React.CSSProperties,
  chartTitle: { fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 2 } as React.CSSProperties,
  chartSub: { fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 12 } as React.CSSProperties,
  sectionLabel: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    color: 'rgba(255,255,255,0.25)',
    marginBottom: 12,
    marginTop: 4,
    paddingBottom: 8,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  } as React.CSSProperties,
};

// ── Types ────────────────────────────────────────────────────────────────────

interface Objective {
  text: string;
  done: boolean;
}

interface Participant {
  name: string;
  type: 'lead' | 'kunde' | 'mitarbeiter';
  initials: string;
}

interface MeetingEntry {
  id: string;
  title: string;
  time: string;
  date: string;
  type: 'video' | 'call' | 'inperson';
  meetingType: string;
  participants: Participant[];
  objectives: Objective[];
  couldBeEmail: boolean;
  duration: string;
}

// ── Helper: DB row → MeetingEntry ───────────────────────────────────────────

function dbToMeetingEntry(row: Record<string, unknown>): MeetingEntry {
  const scheduledAt = new Date(row.scheduled_at as string);
  const time = scheduledAt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const isToday = scheduledAt.toDateString() === today.toDateString();
  const isTomorrow = scheduledAt.toDateString() === tomorrow.toDateString();
  const date = isToday
    ? 'Heute'
    : isTomorrow
      ? 'Morgen'
      : scheduledAt.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });

  const allParticipants: Participant[] = [
    ...((row.internal_participants as Participant[]) ?? []),
    ...((row.external_participants as Participant[]) ?? []),
  ].map((p) => ({
    name: p.name ?? '',
    type: p.type ?? 'mitarbeiter',
    initials:
      p.initials ??
      (p.name ?? '')
        .split(' ')
        .map((w: string) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2),
  }));

  const objectives: Objective[] = ((row.objectives as string[] | Objective[]) ?? []).map((o) =>
    typeof o === 'string' ? { text: o, done: false } : { text: o.text ?? '', done: o.done ?? false }
  );

  return {
    id: row.id as string,
    title: (row.title as string) || 'Meeting',
    time,
    date,
    type: 'video',
    meetingType: (row.meeting_type as string) || 'standard',
    participants: allParticipants,
    objectives,
    couldBeEmail: (row.could_be_email as boolean) ?? false,
    duration: `${(row.duration_minutes as number) ?? 30} min`,
  };
}

// ── Helper Components ────────────────────────────────────────────────────────

function Avatar({ initials, type, size = 28 }: { initials: string; type: string; size?: number }) {
  const color = type === 'lead' ? '#FF5C2E' : type === 'kunde' ? '#F59E0B' : '#6B7AFF';
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `${color}18`,
        border: `1px solid ${color}35`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.36,
        fontWeight: 600,
        color,
        fontFamily: 'var(--font-dm-mono)',
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

function TypeIcon({ type }: { type: string }) {
  const Icon = type === 'video' ? Video : type === 'call' ? Phone : Users;
  return <Icon size={13} style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />;
}

function MeetingTypeBadge({ type }: { type: string }) {
  const labels: Record<string, string> = {
    standup: 'Standup',
    sales: 'Sales',
    board: 'Board',
    workshop: 'Workshop',
    one_on_one: '1:1',
    standard: 'Standard',
  };
  return (
    <span
      style={{
        fontSize: 9,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: 'rgba(255,255,255,0.5)',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 4,
        padding: '2px 7px',
      }}
    >
      {labels[type] ?? type}
    </span>
  );
}

function UtilizationRing({ pct }: { pct: number }) {
  const r = 34;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color = pct > 85 ? '#FF5C2E' : pct > 65 ? '#F59E0B' : 'rgba(255,255,255,0.7)';
  return (
    <div style={{ position: 'relative', width: 80, height: 80 }}>
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 40 40)"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          fontWeight: 700,
          fontFamily: 'var(--font-dm-mono)',
          color: '#fff',
        }}
      >
        {pct}%
      </div>
    </div>
  );
}

// ── Timeline Meeting Card ────────────────────────────────────────────────────

function TimelineMeeting({ meeting }: { meeting: MeetingEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ display: 'flex', gap: 16, position: 'relative' }}>
      {/* Timeline dot + line */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 12, flexShrink: 0 }}>
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: '#6B7AFF',
            border: '2px solid #111',
            zIndex: 1,
            marginTop: 16,
          }}
        />
        <div style={{ width: 1, flex: 1, background: 'rgba(255,255,255,0.06)' }} />
      </div>

      {/* Card */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          ...S.card,
          flex: 1,
          marginBottom: 8,
          cursor: 'pointer',
          transition: 'border-color 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
      >
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                fontFamily: 'var(--font-dm-mono)',
                color: '#fff',
              }}
            >
              {meeting.time}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{meeting.title}</span>
            <MeetingTypeBadge type={meeting.meetingType} />
            <TypeIcon type={meeting.type} />
            {meeting.couldBeEmail && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: '#F59E0B',
                  background: 'rgba(245,158,11,0.1)',
                  border: '1px solid rgba(245,158,11,0.2)',
                  borderRadius: 4,
                  padding: '2px 6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <Mail size={9} /> Könnte E-Mail sein
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{meeting.duration}</span>
            {/* Participants stacked */}
            <div style={{ display: 'flex' }}>
              {meeting.participants.slice(0, 4).map((p, i) => (
                <Avatar key={p.name} initials={p.initials} type={p.type} size={24} />
              ))}
              {meeting.participants.length > 4 && (
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 9,
                    color: 'rgba(255,255,255,0.4)',
                    marginLeft: -6,
                  }}
                >
                  +{meeting.participants.length - 4}
                </div>
              )}
            </div>
            <ChevronDown
              size={14}
              style={{
                color: 'rgba(255,255,255,0.3)',
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.15s',
              }}
            />
          </div>
        </div>

        {/* Expanded content */}
        {expanded && (
          <div
            style={{
              marginTop: 14,
              paddingTop: 14,
              borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 20,
            }}
          >
            {/* Objectives */}
            <div>
              <div style={{ ...S.label, marginBottom: 8 }}>Objectives</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {meeting.objectives.map((obj, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {obj.done ? (
                      <CheckCircle2 size={14} style={{ color: 'rgba(255,255,255,0.5)', flexShrink: 0 }} />
                    ) : (
                      <Circle size={14} style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
                    )}
                    <span
                      style={{
                        fontSize: 12,
                        color: obj.done ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.7)',
                        textDecoration: obj.done ? 'line-through' : 'none',
                      }}
                    >
                      {obj.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Teilnehmer */}
            <div>
              <div style={{ ...S.label, marginBottom: 8 }}>Teilnehmer</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {meeting.participants.map((p) => (
                  <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Avatar initials={p.initials} type={p.type} size={22} />
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{p.name}</span>
                    <span
                      style={{
                        fontSize: 9,
                        color: p.type === 'lead' ? '#FF5C2E' : p.type === 'kunde' ? '#F59E0B' : 'rgba(255,255,255,0.3)',
                        textTransform: 'uppercase',
                      }}
                    >
                      {p.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Details */}
            <div>
              <div style={{ ...S.label, marginBottom: 8 }}>Details</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.5)',
                  }}
                >
                  <TypeIcon type={meeting.type} />
                  {meeting.type === 'video' ? 'Video-Call' : meeting.type === 'call' ? 'Telefon' : 'Vor Ort'}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.5)',
                  }}
                >
                  <Clock size={13} style={{ color: 'rgba(255,255,255,0.35)' }} />
                  {meeting.duration}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.5)',
                  }}
                >
                  <CalendarIcon size={13} style={{ color: 'rgba(255,255,255,0.35)' }} />
                  {meeting.date}, {meeting.time}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Mock Participants for Dropdown ────────────────────────────────────────────

const ALL_PARTICIPANTS: Participant[] = [
  { name: 'Jan Fahlbusch', type: 'mitarbeiter', initials: 'JF' },
  { name: 'Lisa Müller', type: 'mitarbeiter', initials: 'LM' },
  { name: 'Tom Klein', type: 'mitarbeiter', initials: 'TK' },
  { name: 'Sara Becker', type: 'mitarbeiter', initials: 'SB' },
  { name: 'Hans Müller', type: 'kunde', initials: 'HM' },
  { name: 'Dr. Weber', type: 'kunde', initials: 'DW' },
  { name: 'Petra Schneider', type: 'kunde', initials: 'PS' },
  { name: 'M. Schmidt', type: 'lead', initials: 'MS' },
  { name: 'TechStart AG', type: 'lead', initials: 'TA' },
  { name: 'GreenEnergy GmbH', type: 'lead', initials: 'GE' },
];

const MEETING_TYPES_OPTIONS = [
  'Standup',
  'Sales Call',
  '1:1',
  'Board Meeting',
  'Workshop',
  'Brainstorming',
  'Kundengespräch',
  'Review',
];

// ── New Meeting Dialog ───────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  color: '#fff',
  fontSize: 13,
  padding: '9px 12px',
  outline: 'none',
  fontFamily: 'inherit',
};

const fieldLabel: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'rgba(255,255,255,0.35)',
  marginBottom: 6,
  display: 'block',
};

function NewMeetingDialog({ onClose, onCreated }: { onClose: () => void; onCreated?: () => void }) {
  const { tenantId, supabase } = useTenant();
  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [objectives, setObjectives] = useState<string[]>([]);
  const [objInput, setObjInput] = useState('');
  const [meetingDescription, setMeetingDescription] = useState('');
  const [meetingType, setMeetingType] = useState('');
  const [customType, setCustomType] = useState('');
  const [selectedDate, setSelectedDate] = useState<CalendarDate | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [timeFrom, setTimeFrom] = useState('10:00');
  const [timeTo, setTimeTo] = useState('11:00');
  const [selectedParticipants, setSelectedParticipants] = useState<Participant[]>([]);
  const [participantSearch, setParticipantSearch] = useState('');
  const [showParticipantDropdown, setShowParticipantDropdown] = useState(false);
  const [showNewParticipantForm, setShowNewParticipantForm] = useState(false);
  const [newPName, setNewPName] = useState('');
  const [newPType, setNewPType] = useState<'mitarbeiter' | 'kunde' | 'lead'>('kunde');
  const [newPWebsite, setNewPWebsite] = useState('');
  const [newPLinkedin, setNewPLinkedin] = useState('');
  const [newPCompany, setNewPCompany] = useState('');
  const [newPDescription, setNewPDescription] = useState('');
  const participantRef = useRef<HTMLDivElement>(null);

  // Create draft row in Supabase on mount
  React.useEffect(() => {
    if (!tenantId) return;
    (async () => {
      console.log('[NewMeeting] Creating draft for tenant:', tenantId);
      const { data, error } = await supabase
        .from('planned_meetings')
        .insert({ tenant_id: tenantId, status: 'draft', title: '', scheduled_at: new Date().toISOString() })
        .select('id')
        .single();
      if (error) {
        console.error(
          '[NewMeeting] Draft creation failed:',
          JSON.stringify(error),
          error.message,
          error.code,
          error.details,
          error.hint
        );
      } else if (data) {
        console.log('[NewMeeting] Draft created:', data.id);
        setMeetingId(data.id);
      }
    })();
  }, [tenantId, supabase]);

  // Close dropdown on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (participantRef.current && !participantRef.current.contains(e.target as Node)) {
        setShowParticipantDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Email check
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailResult, setEmailResult] = useState<{
    could_be_email: boolean;
    confidence: string;
    reason: string;
    email_draft?: { subject: string; to: string; body: string };
  } | null>(null);

  // Briefing
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [briefing, setBriefing] = useState<string | null>(null);

  const addObjective = () => {
    const v = objInput.trim();
    if (v && !objectives.includes(v)) setObjectives([...objectives, v]);
    setObjInput('');
  };

  const toggleParticipant = (p: Participant) => {
    if (selectedParticipants.find((s) => s.name === p.name)) {
      setSelectedParticipants(selectedParticipants.filter((s) => s.name !== p.name));
    } else {
      setSelectedParticipants([...selectedParticipants, p]);
    }
  };

  const addNewParticipant = () => {
    const name = newPName.trim();
    if (!name) return;
    const parts = name.split(' ');
    const initials = (parts[0]?.[0] ?? '' + (parts[1]?.[0] ?? '')).toUpperCase();
    const p: Participant = { name, type: newPType, initials };
    ALL_PARTICIPANTS.push(p);
    setSelectedParticipants([...selectedParticipants, p]);
    setNewPName('');
    setNewPWebsite('');
    setNewPLinkedin('');
    setNewPCompany('');
    setNewPDescription('');
    setShowNewParticipantForm(false);
  };

  const filteredParticipants = ALL_PARTICIPANTS.filter(
    (p) =>
      p.name.toLowerCase().includes(participantSearch.toLowerCase()) &&
      !selectedParticipants.find((s) => s.name === p.name)
  );

  const groupedFiltered = {
    mitarbeiter: filteredParticipants.filter((p) => p.type === 'mitarbeiter'),
    kunden: filteredParticipants.filter((p) => p.type === 'kunde'),
    leads: filteredParticipants.filter((p) => p.type === 'lead'),
  };

  const handleEmailCheck = async () => {
    setEmailLoading(true);
    try {
      const internal = selectedParticipants.filter((p) => p.type === 'mitarbeiter');
      const leads = selectedParticipants.filter((p) => p.type === 'lead');
      const customers = selectedParticipants.filter((p) => p.type === 'kunde');

      const res = await fetch('/api/meetings/email-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planned_meeting_id: meetingId,
          tenant_id: tenantId,
          meeting_title: title || 'Meeting',
          meeting_type: meetingType === 'custom' ? customType : meetingType || 'standard',
          meeting_time: timeFrom || undefined,
          objectives,
          internal_participants: internal.map((p) => ({ name: p.name, rolle: '' })),
          lead: leads.length > 0 ? { name: leads[0].name, firma: '', email: '', notizen: '' } : null,
          customer: customers.length > 0 ? { name: customers[0].name, firma: '', email: '', notizen: '' } : null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setEmailResult({
          could_be_email: json.could_be_email,
          confidence: json.confidence,
          reason: json.reason,
          email_draft: json.email_draft,
        });
      }
    } catch (err) {
      console.error('Email check error:', err);
    } finally {
      setEmailLoading(false);
    }
  };

  const handleBriefing = async () => {
    setBriefingLoading(true);
    try {
      const internal = selectedParticipants.filter((p) => p.type === 'mitarbeiter');
      const leads = selectedParticipants.filter((p) => p.type === 'lead');
      const customers = selectedParticipants.filter((p) => p.type === 'kunde');

      const res = await fetch('/api/meetings/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planned_meeting_id: meetingId,
          tenant_id: tenantId,
          meeting_title: title || 'Meeting',
          meeting_type: meetingType === 'custom' ? customType : meetingType || 'standard',
          meeting_time: timeFrom || undefined,
          objectives,
          internal_participants: internal.map((p) => ({
            name: p.name,
            rolle: '',
          })),
          lead:
            leads.length > 0
              ? {
                  name: leads[0].name,
                  firma: '',
                  email: '',
                  notizen: '',
                }
              : null,
          customer:
            customers.length > 0
              ? {
                  name: customers[0].name,
                  firma: '',
                  email: '',
                  notizen: '',
                }
              : null,
        }),
      });

      const text = await res.text();
      let result = '';
      try {
        const json = JSON.parse(text);
        // n8n may return an array like [{"text":"..."}]
        const data = Array.isArray(json) ? json[0] : json;
        result = data?.text ?? data?.briefing ?? data?.summary ?? data?.result ?? text;
      } catch {
        result = text;
      }
      setBriefing(result);
    } catch (err) {
      console.error('Briefing error:', err);
      setBriefing('Fehler beim Erstellen des Briefings.');
    } finally {
      setBriefingLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!briefing) return;
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const margin = 20;
    const maxW = doc.internal.pageSize.getWidth() - margin * 2;
    let y = 25;
    const addText = (
      text: string,
      size: number,
      style: 'normal' | 'bold' = 'normal',
      color = [30, 30, 30] as [number, number, number]
    ) => {
      doc.setFontSize(size);
      doc.setFont('helvetica', style);
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text, maxW);
      for (const line of lines) {
        if (y > 275) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, margin, y);
        y += size * 0.45;
      }
    };
    const plain = briefing
      .replace(/#{1,4}\s?/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '');
    addText(`Briefing: ${title || 'Meeting'}`, 18, 'bold');
    y += 6;
    addText(plain, 10);
    doc.save(`Briefing_${(title || 'Meeting').replace(/[^a-zA-Z0-9äöüÄÖÜß\- ]/g, '')}.pdf`);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(6px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1a1a1a',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 16,
          width: '100%',
          maxWidth: 620,
          maxHeight: '90vh',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeSlideIn .25s ease',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '18px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#fff', margin: 0 }}>Neues Meeting erstellen</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.4)',
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            padding: '20px 24px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          {/* Titel */}
          <div>
            <label style={fieldLabel}>Titel</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Sprint Review Q2"
              style={inputStyle}
            />
          </div>

          {/* Objectives */}
          <div>
            <label style={fieldLabel}>Objectives</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={objInput}
                onChange={(e) => setObjInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addObjective();
                  }
                }}
                placeholder="Objective hinzufügen…"
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                onClick={addObjective}
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.7)',
                  borderRadius: 8,
                  padding: '0 14px',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                +
              </button>
            </div>
            {objectives.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {objectives.map((o) => (
                  <span
                    key={o}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 6,
                      padding: '4px 10px',
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.8)',
                    }}
                  >
                    {o}
                    <button
                      onClick={() => setObjectives(objectives.filter((x) => x !== o))}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'rgba(255,255,255,0.3)',
                        cursor: 'pointer',
                        fontSize: 14,
                        padding: 0,
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Beschreibung */}
          <div>
            <label style={fieldLabel}>
              Beschreibung <span style={{ color: 'rgba(255,255,255,0.2)' }}>optional</span>
            </label>
            <textarea
              value={meetingDescription}
              onChange={(e) => setMeetingDescription(e.target.value)}
              placeholder="Worum geht es? Kontext, Hintergrund…"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {/* Art von Gespräch */}
          <div>
            <label style={fieldLabel}>Art von Gespräch</label>
            <select
              value={meetingType}
              onChange={(e) => setMeetingType(e.target.value)}
              style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
            >
              <option value="" style={{ background: '#1a1a1a' }}>
                Auswählen…
              </option>
              {MEETING_TYPES_OPTIONS.map((t) => (
                <option key={t} value={t.toLowerCase()} style={{ background: '#1a1a1a' }}>
                  {t}
                </option>
              ))}
              <option value="custom" style={{ background: '#1a1a1a' }}>
                Eigene…
              </option>
            </select>
            {meetingType === 'custom' && (
              <input
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                placeholder="Art beschreiben…"
                style={{ ...inputStyle, marginTop: 8 }}
              />
            )}
          </div>

          {/* Datum & Zeit — Custom Calendar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="meeting-date"
                className="px-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-white/35"
              >
                Datum
              </Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="meeting-date"
                    className="w-full justify-between font-normal bg-white/[0.04] border-white/[0.08] text-white hover:bg-white/[0.06] hover:text-white"
                  >
                    {selectedDate
                      ? new Date(selectedDate.year, selectedDate.month - 1, selectedDate.day).toLocaleDateString(
                          'de-DE',
                          { day: 'numeric', month: 'long', year: 'numeric' }
                        )
                      : 'Datum wählen…'}
                    <ChevronDown size={14} className="opacity-40" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto overflow-hidden p-0 bg-[#1a1a1a] border-white/10 z-[1100]"
                  align="start"
                >
                  <Calendar
                    value={selectedDate ?? null}
                    onChange={(d) => {
                      setSelectedDate(d as unknown as CalendarDate);
                      setCalendarOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex gap-3">
              <div className="flex flex-col gap-1.5 flex-1">
                <Label
                  htmlFor="time-from"
                  className="px-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-white/35"
                >
                  Von
                </Label>
                <Input
                  type="time"
                  id="time-from"
                  value={timeFrom}
                  onChange={(e) => setTimeFrom(e.target.value)}
                  className="bg-white/[0.04] border-white/[0.08] text-white appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                />
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <Label
                  htmlFor="time-to"
                  className="px-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-white/35"
                >
                  Bis
                </Label>
                <Input
                  type="time"
                  id="time-to"
                  value={timeTo}
                  onChange={(e) => setTimeTo(e.target.value)}
                  className="bg-white/[0.04] border-white/[0.08] text-white appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                />
              </div>
            </div>
          </div>

          {/* Teilnehmer */}
          <div ref={participantRef} style={{ position: 'relative' }}>
            <label style={fieldLabel}>Teilnehmer</label>
            {selectedParticipants.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {selectedParticipants.map((p) => (
                  <span
                    key={p.name}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 6,
                      padding: '3px 8px',
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.8)',
                    }}
                  >
                    <Avatar initials={p.initials} type={p.type} size={18} />
                    {p.name}
                    <button
                      onClick={() => toggleParticipant(p)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'rgba(255,255,255,0.3)',
                        cursor: 'pointer',
                        fontSize: 14,
                        padding: 0,
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div style={{ position: 'relative' }}>
              <Search
                size={13}
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255,255,255,0.25)',
                }}
              />
              <input
                value={participantSearch}
                onChange={(e) => setParticipantSearch(e.target.value)}
                onFocus={() => setShowParticipantDropdown(true)}
                placeholder="Teilnehmer suchen…"
                style={{ ...inputStyle, paddingLeft: 30 }}
              />
            </div>
            {showParticipantDropdown && (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: '100%',
                  marginTop: 4,
                  zIndex: 50,
                  background: '#1e1e1e',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 10,
                  maxHeight: 220,
                  overflowY: 'auto',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                }}
              >
                {(['mitarbeiter', 'kunden', 'leads'] as const).map((group) => {
                  const items = groupedFiltered[group];
                  if (items.length === 0) return null;
                  const labels = { mitarbeiter: 'Mitarbeiter', kunden: 'Kunden', leads: 'Leads' };
                  return (
                    <div key={group}>
                      <div
                        style={{
                          fontSize: 9,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: 'rgba(255,255,255,0.3)',
                          padding: '8px 12px 4px',
                        }}
                      >
                        {labels[group]}
                      </div>
                      {items.map((p) => (
                        <button
                          key={p.name}
                          onClick={() => {
                            toggleParticipant(p);
                            setParticipantSearch('');
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            width: '100%',
                            padding: '7px 12px',
                            background: 'none',
                            border: 'none',
                            color: 'rgba(255,255,255,0.7)',
                            fontSize: 12,
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                        >
                          <Avatar initials={p.initials} type={p.type} size={22} />
                          {p.name}
                        </button>
                      ))}
                    </div>
                  );
                })}
                {filteredParticipants.length === 0 && !showNewParticipantForm && (
                  <div style={{ padding: '12px', fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
                    Keine Ergebnisse
                  </div>
                )}

                {/* Sticky footer */}
                <div
                  style={{
                    position: 'sticky',
                    bottom: 0,
                    padding: '4px',
                    background: '#1e1e1e',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {!showNewParticipantForm && (
                    <button
                      onClick={() => setShowNewParticipantForm(true)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: 'none',
                        border: '1px dashed rgba(255,255,255,0.12)',
                        borderRadius: 6,
                        color: 'rgba(255,255,255,0.5)',
                        fontSize: 12,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 5,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'none';
                        e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                      }}
                    >
                      <Plus size={13} /> Neuen Teilnehmer anlegen
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* New Participant Modal */}
          {showNewParticipantForm && (
            <div
              onClick={() => setShowNewParticipantForm(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1200,
                backdropFilter: 'blur(4px)',
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: '#1a1a1a',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 14,
                  width: '100%',
                  maxWidth: 420,
                  padding: 0,
                  animation: 'fadeSlideIn .2s ease',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                    borderBottom: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: 0 }}>Neuen Teilnehmer anlegen</h4>
                  <button
                    onClick={() => setShowNewParticipantForm(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'rgba(255,255,255,0.4)',
                      padding: 4,
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={fieldLabel}>Name *</label>
                    <input
                      value={newPName}
                      onChange={(e) => setNewPName(e.target.value)}
                      placeholder="Vor- und Nachname"
                      style={inputStyle}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label style={fieldLabel}>Art</label>
                    <select
                      value={newPType}
                      onChange={(e) => setNewPType(e.target.value as 'mitarbeiter' | 'kunde' | 'lead')}
                      style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
                    >
                      <option value="mitarbeiter" style={{ background: '#1a1a1a' }}>
                        Mitarbeiter
                      </option>
                      <option value="kunde" style={{ background: '#1a1a1a' }}>
                        Kunde
                      </option>
                      <option value="lead" style={{ background: '#1a1a1a' }}>
                        Lead
                      </option>
                    </select>
                  </div>
                  <div>
                    <label style={fieldLabel}>Unternehmen</label>
                    <input
                      value={newPCompany}
                      onChange={(e) => setNewPCompany(e.target.value)}
                      placeholder="Firmenname"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={fieldLabel}>
                      Website <span style={{ color: 'rgba(255,255,255,0.2)' }}>optional, für Analyse</span>
                    </label>
                    <input
                      value={newPWebsite}
                      onChange={(e) => setNewPWebsite(e.target.value)}
                      placeholder="https://..."
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={fieldLabel}>
                      LinkedIn <span style={{ color: 'rgba(255,255,255,0.2)' }}>optional, für Analyse</span>
                    </label>
                    <input
                      value={newPLinkedin}
                      onChange={(e) => setNewPLinkedin(e.target.value)}
                      placeholder="https://linkedin.com/in/..."
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={fieldLabel}>Kurze Beschreibung</label>
                    <input
                      value={newPDescription}
                      onChange={(e) => setNewPDescription(e.target.value)}
                      placeholder="z.B. CEO, Ansprechpartner für Projekt X"
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div style={{ padding: '12px 20px 16px', display: 'flex', gap: 8 }}>
                  <button
                    onClick={addNewParticipant}
                    disabled={!newPName.trim()}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 8,
                      border: 'none',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: newPName.trim() ? 'pointer' : 'default',
                      background: newPName.trim() ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.06)',
                      color: newPName.trim() ? '#0a0a0a' : 'rgba(255,255,255,0.3)',
                    }}
                  >
                    Hinzufügen
                  </button>
                  <button
                    onClick={() => setShowNewParticipantForm(false)}
                    style={{
                      padding: '10px 16px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 8,
                      color: 'rgba(255,255,255,0.4)',
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Könnte E-Mail sein */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
            <button
              onClick={handleEmailCheck}
              disabled={emailLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
                padding: '10px',
                borderRadius: 8,
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.2)',
                color: '#F59E0B',
                fontSize: 13,
                fontWeight: 600,
                cursor: emailLoading ? 'wait' : 'pointer',
              }}
            >
              {emailLoading ? (
                <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Mail size={15} />
              )}
              Könnte das eine E-Mail sein?
            </button>

            {emailResult && (
              <div style={{ marginTop: 12 }}>
                {/* Verdict */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 14px',
                    background: emailResult.could_be_email ? 'rgba(245,158,11,0.06)' : 'rgba(107,122,255,0.06)',
                    border: `1px solid ${emailResult.could_be_email ? 'rgba(245,158,11,0.15)' : 'rgba(107,122,255,0.15)'}`,
                    borderRadius: 8,
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      flexShrink: 0,
                      background: emailResult.could_be_email ? 'rgba(245,158,11,0.15)' : 'rgba(107,122,255,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Mail size={14} style={{ color: emailResult.could_be_email ? '#F59E0B' : '#6B7AFF' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
                        {emailResult.could_be_email
                          ? 'Ja, das könnte eine E-Mail sein'
                          : 'Nein, ein Meeting ist sinnvoll'}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          padding: '2px 6px',
                          borderRadius: 4,
                          color: emailResult.confidence === 'hoch' ? '#F59E0B' : 'rgba(255,255,255,0.5)',
                          background:
                            emailResult.confidence === 'hoch' ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.06)',
                        }}
                      >
                        {emailResult.confidence}
                      </span>
                    </div>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', margin: '4px 0 0', lineHeight: 1.4 }}>
                      {emailResult.reason}
                    </p>
                  </div>
                </div>

                {/* Email Draft */}
                {emailResult.email_draft && (
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 8,
                      overflow: 'hidden',
                    }}
                  >
                    {/* Subject line */}
                    <div
                      style={{
                        padding: '10px 14px',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          color: 'rgba(255,255,255,0.3)',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                        }}
                      >
                        Betreff:
                      </span>
                      <span style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>
                        {emailResult.email_draft.subject}
                      </span>
                    </div>
                    {/* Body */}
                    <div
                      style={{
                        padding: 14,
                        fontSize: 12,
                        color: 'rgba(255,255,255,0.7)',
                        lineHeight: 1.7,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {emailResult.email_draft.body}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {emailResult.email_draft && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button
                      onClick={() => {
                        const draft = emailResult.email_draft;
                        if (draft) navigator.clipboard.writeText(`Betreff: ${draft.subject}\n\n${draft.body}`);
                      }}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        padding: '8px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 8,
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      <Copy size={13} /> Kopieren
                    </button>
                    <button
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        padding: '8px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 8,
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      <Send size={13} /> An Teilnehmer senden
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Briefing erstellen */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
            <button
              onClick={handleBriefing}
              disabled={briefingLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
                padding: '10px',
                borderRadius: 8,
                background: 'rgba(107,122,255,0.08)',
                border: '1px solid rgba(107,122,255,0.2)',
                color: '#6B7AFF',
                fontSize: 13,
                fontWeight: 600,
                cursor: briefingLoading ? 'wait' : 'pointer',
              }}
            >
              {briefingLoading ? (
                <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Sparkles size={15} />
              )}
              Briefing erstellen
            </button>

            {briefing && (
              <div style={{ marginTop: 12 }}>
                <div
                  className="meeting-md"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 8,
                    padding: 14,
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.7)',
                    lineHeight: 1.6,
                    maxHeight: 300,
                    overflowY: 'auto',
                  }}
                >
                  <Markdown>{briefing}</Markdown>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button
                    onClick={handleDownloadPdf}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      padding: '8px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 8,
                      color: 'rgba(255,255,255,0.6)',
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    <FileDown size={13} /> PDF herunterladen
                  </button>
                  <button
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      padding: '8px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 8,
                      color: 'rgba(255,255,255,0.6)',
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    <Send size={13} /> An Mitarbeiter schicken
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <button
            onClick={async () => {
              if (!meetingId || !tenantId) return;
              setSaving(true);
              const internal = selectedParticipants.filter((p) => p.type === 'mitarbeiter');
              const external = selectedParticipants.filter((p) => p.type === 'kunde' || p.type === 'lead');
              const scheduledAt = timeFrom
                ? new Date(`${new Date().toISOString().split('T')[0]}T${timeFrom}:00`).toISOString()
                : new Date().toISOString();
              const { error } = await supabase
                .from('planned_meetings')
                .update({
                  title: title.trim() || 'Meeting',
                  meeting_type: meetingType === 'custom' ? customType : meetingType || 'standard',
                  scheduled_at: scheduledAt,
                  objectives: objectives,
                  internal_participants: internal.map((p) => ({
                    name: p.name,
                    type: p.type,
                    initials: p.initials,
                  })),
                  external_participants: external.map((p) => ({
                    name: p.name,
                    type: p.type,
                    initials: p.initials,
                  })),
                  status: 'confirmed',
                })
                .eq('id', meetingId);
              setSaving(false);
              if (error) {
                console.error('Save failed:', error);
                alert('Fehler beim Speichern: ' + error.message);
              } else {
                onCreated?.();
                onClose();
              }
            }}
            disabled={saving}
            style={{
              width: '100%',
              padding: '10px',
              background: saving ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.92)',
              color: '#0a0a0a',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: saving ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {saving && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
            {saving ? 'Wird gespeichert…' : 'Meeting erstellen'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .meeting-md h1 { font-size: 18px; font-weight: 700; color: rgba(255,255,255,0.95); margin: 16px 0 8px; }
        .meeting-md h2 { font-size: 15px; font-weight: 600; color: rgba(255,255,255,0.9); margin: 14px 0 6px; }
        .meeting-md h3 { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.85); margin: 10px 0 4px; }
        .meeting-md h4 { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.8); margin: 8px 0 4px; }
        .meeting-md p { margin: 4px 0; }
        .meeting-md ul, .meeting-md ol { margin: 4px 0; padding-left: 18px; }
        .meeting-md table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 11px; }
        .meeting-md th, .meeting-md td { border: 1px solid rgba(255,255,255,0.1); padding: 6px 8px; text-align: left; }
        .meeting-md th { background: rgba(255,255,255,0.05); font-weight: 600; color: rgba(255,255,255,0.85); }
        .meeting-md hr { border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 12px 0; }
      `}</style>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export function MeetingsPrepare() {
  const { tenantId, supabase } = useTenant();
  const today = new Date();
  const dateStr = today.toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const [showNewMeeting, setShowNewMeeting] = useState(false);
  const [meetings, setMeetings] = useState<MeetingEntry[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(true);

  const fetchMeetings = useCallback(async () => {
    if (!tenantId) return;
    setLoadingMeetings(true);
    const { data, error } = await supabase
      .from('planned_meetings')
      .select('*')
      .eq('tenant_id', tenantId)
      .neq('status', 'draft')
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true });
    if (!error && data) {
      setMeetings(data.map(dbToMeetingEntry));
    }
    setLoadingMeetings(false);
  }, [tenantId, supabase]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const nextMeeting = meetings[0] ?? null;
  const upcomingMeetings = meetings.slice(1);
  const meetingsToday = meetings.filter((m) => m.date === 'Heute').length;
  const totalHours = meetings.filter((m) => m.date === 'Heute').reduce((sum, m) => sum + parseInt(m.duration) / 60, 0);

  // Warnings based on real data
  const warnings: { icon: typeof AlertTriangle; text: string; severity: string }[] = [];
  const emailMeetings = meetings.filter((m) => m.couldBeEmail);
  if (emailMeetings.length > 0) {
    emailMeetings.forEach((m) =>
      warnings.push({ icon: Mail, text: `"${m.title}" könnte eine E-Mail sein`, severity: 'info' })
    );
  }
  const noObjectives = meetings.filter((m) => m.objectives.length === 0);
  if (noObjectives.length > 0) {
    noObjectives.forEach((m) =>
      warnings.push({ icon: Clock, text: `${m.title} hat keine Agenda — Objectives hinzufügen`, severity: 'warn' })
    );
  }

  return (
    <div>
      {/* ── Top Row: CTA ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button
          onClick={() => setShowNewMeeting(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            background: 'rgba(255,255,255,0.92)',
            color: '#0a0a0a',
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Plus size={15} /> Neues Meeting
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 28 }}>
        {/* ── Left: Nächstes Meeting ── */}
        <div style={{ ...S.card, display: 'flex', flexDirection: 'column' }}>
          {loadingMeetings ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                color: 'rgba(255,255,255,0.3)',
                fontSize: 12,
              }}
            >
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', marginRight: 8 }} /> Laden…
            </div>
          ) : !nextMeeting ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                color: 'rgba(255,255,255,0.3)',
                fontSize: 12,
              }}
            >
              Keine anstehenden Meetings
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={S.label}>Nächstes Meeting</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{nextMeeting.title}</div>
                </div>
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    fontFamily: 'var(--font-dm-mono)',
                    color: '#6B7AFF',
                  }}
                >
                  {nextMeeting.time}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <MeetingTypeBadge type={nextMeeting.meetingType} />
                <TypeIcon type={nextMeeting.type} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{nextMeeting.duration}</span>
                <div style={{ display: 'flex', marginLeft: 'auto' }}>
                  {nextMeeting.participants.map((p) => (
                    <Avatar key={p.name} initials={p.initials} type={p.type} size={24} />
                  ))}
                </div>
              </div>

              {nextMeeting.objectives.length > 0 && (
                <>
                  <div style={{ ...S.label, marginBottom: 8 }}>Objectives</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                    {nextMeeting.objectives.map((obj, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {obj.done ? (
                          <CheckCircle2 size={14} style={{ color: 'rgba(255,255,255,0.5)', flexShrink: 0 }} />
                        ) : (
                          <Circle size={14} style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
                        )}
                        <span
                          style={{
                            fontSize: 12,
                            color: obj.done ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.7)',
                            textDecoration: obj.done ? 'line-through' : 'none',
                          }}
                        >
                          {obj.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* ── Right: Info + Datum + Auslastung ── */}
        <div style={{ ...S.card, display: 'flex', gap: 0 }}>
          {/* Left half: Infos & Warnungen */}
          <div style={{ flex: 1, borderRight: '1px solid rgba(255,255,255,0.07)', paddingRight: 20 }}>
            <div style={S.chartTitle}>Infos & Hinweise</div>
            <div style={S.chartSub}>Warnungen und Tipps für heute</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              {warnings.length === 0 && (
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Keine Hinweise</span>
              )}
              {warnings.map((w, i) => {
                const Icon = w.icon;
                const color = w.severity === 'warn' ? '#FF5C2E' : '#6B7AFF';
                return (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        flexShrink: 0,
                        background: `${color}15`,
                        border: `1px solid ${color}30`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon size={11} style={{ color }} />
                    </div>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{w.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right half: Datum + Auslastung */}
          <div
            style={{
              flex: 1,
              paddingLeft: 24,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <UtilizationRing pct={80} />
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 8, textAlign: 'center' }}>
              Auslastung heute
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4, textAlign: 'center' }}>
              {meetingsToday} Meetings · {totalHours}h geblockt
            </div>
          </div>
        </div>
      </div>

      {/* ── Timeline: Anstehende Meetings ── */}
      <div style={S.sectionLabel}>Anstehende Meetings</div>

      <div style={{ paddingLeft: 4 }}>
        {loadingMeetings ? (
          <div
            style={{ display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12, padding: 16 }}
          >
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', marginRight: 8 }} /> Laden…
          </div>
        ) : upcomingMeetings.length === 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, padding: 16 }}>
            Keine weiteren Meetings geplant
          </div>
        ) : (
          (() => {
            const groups = new Map<string, MeetingEntry[]>();
            for (const m of upcomingMeetings) {
              const existing = groups.get(m.date) ?? [];
              existing.push(m);
              groups.set(m.date, existing);
            }
            return Array.from(groups.entries()).map(([date, dateMeetings]) => (
              <div key={date}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.4)',
                    marginBottom: 8,
                    marginLeft: 28,
                  }}
                >
                  {date}
                </div>
                {dateMeetings.map((m) => (
                  <TimelineMeeting key={m.id} meeting={m} />
                ))}
              </div>
            ));
          })()
        )}
      </div>

      {showNewMeeting && <NewMeetingDialog onClose={() => setShowNewMeeting(false)} onCreated={fetchMeetings} />}
    </div>
  );
}
