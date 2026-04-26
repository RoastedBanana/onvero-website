'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Mail, FileText, ChevronRight } from 'lucide-react';
import { tokens } from '@/lib/design-tokens';
import { useTenant } from '@/hooks/useTenant';
import Markdown from 'react-markdown';

// ── Types ────────────────────────────────────────────────────────────────────

interface ScoreBreakdown {
  struktur: number;
  effizienz: number;
  klarheit: number;
  beschluesse: number;
  beteiligung: number;
}

interface ObjectiveEval {
  objective: string;
  status: 'erreicht' | 'teilweise' | 'nicht_erreicht';
  begruendung: string;
}

interface TodoItem {
  id?: string;
  person: string | null;
  person_initials: string | null;
  task: string;
  due_date: string | null;
  priority: 'hoch' | 'mittel' | 'niedrig';
  completed: boolean;
  completed_at?: string | null;
}

interface ParticipantScore {
  name: string;
  speaking_share: number;
  score: number;
  improvements: string[];
  staerken: string[];
}

export interface MeetingSummaryResult {
  id: string;
  summary: string;
  score: number;
  score_breakdown: ScoreBreakdown;
  improvements: {
    kritisch: string[];
    wichtig: string[];
    positiv: string[];
  };
  objectives_evaluation: ObjectiveEval[];
  todos: TodoItem[];
  participants: ParticipantScore[];
  could_have_been_email: boolean;
  duration_minutes?: number;
  title?: string;
  summary_type?: string;
}

interface MeetingSummaryCardProps {
  result: MeetingSummaryResult;
  onClose: () => void;
  onTodosUpdated?: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}

function barColor(score: number): string {
  if (score >= 75) return '#22c55e';
  if (score >= 55) return '#f59e0b';
  return '#ef4444';
}

const INITIALS_COLORS = ['#6B7AFF', '#F59E0B', '#22c55e', '#ef4444', '#a855f7'];
function initialsColor(initials: string | null): string {
  if (!initials) return INITIALS_COLORS[0];
  let hash = 0;
  for (let i = 0; i < initials.length; i++) hash = initials.charCodeAt(i) + ((hash << 5) - hash);
  return INITIALS_COLORS[Math.abs(hash) % INITIALS_COLORS.length];
}

function statusDot(status: string): string {
  if (status === 'erreicht') return '#22c55e';
  if (status === 'teilweise') return '#f59e0b';
  return '#ef4444';
}

function statusLabel(status: string): string {
  if (status === 'erreicht') return 'Erreicht';
  if (status === 'teilweise') return 'Teilweise';
  return 'Nicht erreicht';
}

// ── Component ────────────────────────────────────────────────────────────────

export function MeetingSummaryCard({ result, onClose, onTodosUpdated }: MeetingSummaryCardProps) {
  const { tenantId, supabase } = useTenant();
  const [todos, setTodos] = useState<TodoItem[]>(result.todos ?? []);
  const [closing, setClosing] = useState(false);
  const [showAddTodo, setShowAddTodo] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [newPerson, setNewPerson] = useState('');
  const [newDue, setNewDue] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);

  // Load todos from Supabase for correct checkbox states
  useEffect(() => {
    if (!result.id) return;
    (async () => {
      const { data } = await supabase
        .from('meeting_todos')
        .select('*')
        .eq('meeting_id', result.id)
        .order('created_at', { ascending: true });
      if (data && data.length > 0) setTodos(data as TodoItem[]);
    })();
  }, [result.id, supabase]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 200);
  };

  const toggleTodo = async (index: number) => {
    const todo = todos[index];
    const newCompleted = !todo.completed;
    const updated = [...todos];
    updated[index] = { ...todo, completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null };
    setTodos(updated);

    if (todo.id) {
      await supabase
        .from('meeting_todos')
        .update({ completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null })
        .eq('id', todo.id);
    }
    onTodosUpdated?.();
  };

  const addTodo = async () => {
    const task = newTask.trim();
    if (!task || !tenantId) return;
    const initials = newPerson.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const newTodo: TodoItem = {
      person: newPerson.trim() || null,
      person_initials: initials || null,
      task,
      due_date: newDue || null,
      priority: 'mittel',
      completed: false,
    };

    const { data } = await supabase
      .from('meeting_todos')
      .insert({ ...newTodo, meeting_id: result.id, tenant_id: tenantId })
      .select('*')
      .single();

    if (data) setTodos([...todos, data as TodoItem]);
    setNewTask(''); setNewPerson(''); setNewDue('');
    setShowAddTodo(false);
    onTodosUpdated?.();
  };

  const objectivesReached = result.objectives_evaluation?.filter(o => o.status === 'erreicht').length ?? 0;
  const objectivesTotal = result.objectives_evaluation?.length ?? 0;

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)', border: `1px solid ${tokens.bg.border}`,
    borderRadius: 6, color: '#fff', fontSize: '0.78rem', padding: '6px 8px', outline: 'none', flex: 1,
  };

  return (
    <div
      ref={cardRef}
      style={{
        background: tokens.bg.raised, border: `2px solid ${tokens.bg.borderStrong}`,
        borderRadius: tokens.radius.xl, overflow: 'hidden',
        animation: closing ? 'summarySlideOut 0.2s ease forwards' : 'summarySlideIn 0.3s ease',
      }}
    >
      {/* ── Header ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 20px', borderBottom: `1px solid ${tokens.bg.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: tokens.text.primary }}>
            {result.title || 'Meeting-Analyse'}
          </span>
          {result.summary_type && (
            <span style={{
              fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
              color: tokens.text.muted, background: tokens.bg.hover, border: `1px solid ${tokens.bg.border}`,
              borderRadius: 4, padding: '2px 7px',
            }}>
              {result.summary_type}
            </span>
          )}
          <span style={{ fontSize: 11, color: tokens.text.muted }}>
            {new Date().toLocaleString('de-DE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontSize: 13, fontWeight: 700, color: scoreColor(result.score),
            background: `${scoreColor(result.score)}15`, border: `1px solid ${scoreColor(result.score)}30`,
            borderRadius: 6, padding: '3px 10px',
          }}>
            {result.score}/100
          </span>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.text.muted, padding: 2 }}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ── Metriken ── */}
      <div style={{
        display: 'flex', gap: 8, padding: '10px 20px',
        borderBottom: `1px solid ${tokens.bg.border}`,
      }}>
        {[
          { label: 'Score', value: `${result.score}/100`, color: scoreColor(result.score) },
          { label: 'Dauer', value: result.duration_minutes ? `${result.duration_minutes} min` : '–' },
          { label: 'Action Items', value: `${todos.length}` },
          { label: 'Objectives', value: objectivesTotal > 0 ? `${objectivesReached}/${objectivesTotal}` : '–' },
        ].map((m) => (
          <div key={m.label} style={{
            background: tokens.bg.hover, borderRadius: 6, padding: '5px 12px',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ fontSize: 10, color: tokens.text.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{m.label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: m.color ?? tokens.text.primary, fontFamily: 'var(--font-dm-mono)' }}>{m.value}</span>
          </div>
        ))}
      </div>

      {/* ── Hauptbereich ── */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* 2-spaltig: Summary + Objectives */}
        <div style={{ display: 'grid', gridTemplateColumns: objectivesTotal > 0 ? '1fr 1fr' : '1fr', gap: 16 }}>
          {/* Zusammenfassung */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: tokens.text.muted, marginBottom: 8 }}>
              Zusammenfassung
            </div>
            <div className="meeting-md" style={{ fontSize: '0.82rem', color: tokens.text.secondary, lineHeight: 1.6 }}>
              <Markdown>{result.summary}</Markdown>
            </div>
          </div>

          {/* Objectives */}
          {objectivesTotal > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: tokens.text.muted, marginBottom: 8 }}>
                Objectives
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {result.objectives_evaluation.map((obj, i) => (
                  <div key={i} title={obj.begruendung} style={{
                    display: 'flex', alignItems: 'center', gap: 8, cursor: 'default',
                    padding: '5px 8px', borderRadius: 6, background: tokens.bg.hover,
                  }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: statusDot(obj.status), flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: tokens.text.secondary, flex: 1 }}>{obj.objective}</span>
                    <span style={{
                      fontSize: 9, fontWeight: 600, color: statusDot(obj.status),
                      background: `${statusDot(obj.status)}15`, borderRadius: 4, padding: '1px 6px',
                    }}>
                      {statusLabel(obj.status)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Todos ── */}
        {todos.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: tokens.text.muted, marginBottom: 8 }}>
              Action Items
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {todos.map((todo, i) => {
                const overdue = todo.due_date && !todo.completed && new Date(todo.due_date) < new Date();
                return (
                  <div key={todo.id ?? i} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px',
                    borderRadius: 6, background: tokens.bg.hover,
                  }}>
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => toggleTodo(i)}
                      style={{ accentColor: '#6B7AFF', cursor: 'pointer', flexShrink: 0 }}
                    />
                    {todo.person_initials && (
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                        background: `${initialsColor(todo.person_initials)}18`,
                        border: `1px solid ${initialsColor(todo.person_initials)}35`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 8, fontWeight: 600, color: initialsColor(todo.person_initials),
                      }}>
                        {todo.person_initials}
                      </div>
                    )}
                    <span style={{
                      fontSize: 12, flex: 1,
                      color: todo.completed ? tokens.text.muted : tokens.text.secondary,
                      textDecoration: todo.completed ? 'line-through' : 'none',
                      transition: 'all 0.15s',
                    }}>
                      {todo.task}
                    </span>
                    {todo.priority === 'hoch' && (
                      <span style={{
                        fontSize: 9, fontWeight: 600, color: '#ef4444',
                        background: 'rgba(239,68,68,0.1)', borderRadius: 4, padding: '1px 6px',
                      }}>
                        Hoch
                      </span>
                    )}
                    {todo.due_date && (
                      <span style={{
                        fontSize: 11, color: overdue ? '#ef4444' : tokens.text.muted,
                        fontFamily: 'var(--font-dm-mono)',
                      }}>
                        {new Date(todo.due_date).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add Todo */}
            {showAddTodo ? (
              <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center' }}>
                <input value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="Aufgabe…" style={inputStyle} onKeyDown={e => e.key === 'Enter' && addTodo()} />
                <input value={newPerson} onChange={e => setNewPerson(e.target.value)} placeholder="Person" style={{ ...inputStyle, maxWidth: 100 }} />
                <input type="date" value={newDue} onChange={e => setNewDue(e.target.value)} style={{ ...inputStyle, maxWidth: 130 }} />
                <button onClick={addTodo} style={{
                  background: 'rgba(107,122,255,0.12)', border: '1px solid rgba(107,122,255,0.25)',
                  borderRadius: 6, color: '#6B7AFF', fontSize: 11, fontWeight: 600, padding: '6px 10px',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}>
                  Hinzufügen
                </button>
              </div>
            ) : (
              <button onClick={() => setShowAddTodo(true)} style={{
                background: 'none', border: 'none', color: tokens.text.muted, fontSize: 11,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, padding: 0,
              }}>
                <Plus size={12} /> Todo hinzufügen
              </button>
            )}
          </div>
        )}

        {/* ── Score-Aufschlüsselung + Verbesserungen ── */}
        {result.score_breakdown && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Score-Dimensionen */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: tokens.text.muted, marginBottom: 8 }}>
                Score-Aufschlüsselung
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {Object.entries(result.score_breakdown).map(([key, val]) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: tokens.text.muted, width: 75, textTransform: 'capitalize' }}>{key}</span>
                    <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${val}%`, height: '100%', background: barColor(val), borderRadius: 3, transition: 'width 0.5s ease' }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: barColor(val), fontFamily: 'var(--font-dm-mono)', width: 24, textAlign: 'right' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Verbesserungen */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: tokens.text.muted, marginBottom: 8 }}>
                Verbesserungen
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {result.improvements?.kritisch?.map((t, i) => (
                  <div key={`k${i}`} style={{ fontSize: 11, padding: '4px 8px', borderRadius: 5, background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}>
                    {t}
                  </div>
                ))}
                {result.improvements?.wichtig?.map((t, i) => (
                  <div key={`w${i}`} style={{ fontSize: 11, padding: '4px 8px', borderRadius: 5, background: 'rgba(245,158,11,0.08)', color: '#f59e0b' }}>
                    {t}
                  </div>
                ))}
                {result.improvements?.positiv?.map((t, i) => (
                  <div key={`p${i}`} style={{ fontSize: 11, padding: '4px 8px', borderRadius: 5, background: 'rgba(34,197,94,0.08)', color: '#22c55e' }}>
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Könnte-Email-Banner ── */}
        {result.could_have_been_email && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 8, fontSize: 12, color: '#f59e0b', fontWeight: 500,
          }}>
            <Mail size={14} />
            Dieses Meeting hätte auch eine Email sein können.
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div style={{
        display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 20px',
        borderTop: `1px solid ${tokens.bg.border}`,
      }}>
        <button
          onClick={() => console.log('export PDF')}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
            background: tokens.bg.hover, border: `1px solid ${tokens.bg.border}`,
            borderRadius: 6, color: tokens.text.secondary, fontSize: 12, fontWeight: 500, cursor: 'pointer',
          }}
        >
          <FileText size={13} /> Als PDF exportieren
        </button>
        <button
          onClick={() => {
            const subject = encodeURIComponent(`Follow-up: ${result.title || 'Meeting'}`);
            window.open(`mailto:?subject=${subject}`, '_blank');
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
            background: tokens.bg.hover, border: `1px solid ${tokens.bg.border}`,
            borderRadius: 6, color: tokens.text.secondary, fontSize: 12, fontWeight: 500, cursor: 'pointer',
          }}
        >
          <Mail size={13} /> Follow-up Email
        </button>
      </div>

      <style>{`
        @keyframes summarySlideIn {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes summarySlideOut {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(-12px); }
        }
      `}</style>
    </div>
  );
}
