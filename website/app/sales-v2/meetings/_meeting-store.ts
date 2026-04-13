'use client';

import { useSyncExternalStore } from 'react';

// ─── TYPES ──────────────────────────────────────────────────────────────────

export type MeetingType = 'Video' | 'Telefon' | 'Vor Ort';
export type MeetingStatus = 'Geplant' | 'Aktiv' | 'Abgeschlossen';

export interface MeetingPhase {
  id: string;
  name: string;
  duration: number; // minutes
}

export interface SmartSuggestion {
  id: string;
  leadId: string;
  leadName: string;
  company: string;
  emailSnippet: string;
  suggestedType: MeetingType;
  suggestedDuration: number;
  reason: string;
  createdAt: string;
  dismissed: boolean;
}

export interface Meeting {
  id: string;
  leadId: string;
  leadName: string;
  company: string;
  contact: string;
  title: string;
  type: MeetingType;
  status: MeetingStatus;
  date: string; // ISO date
  time: string; // HH:mm
  duration: number; // minutes
  phases: MeetingPhase[];
  notes: string;
  product: string;
  summary?: string;
  aiInsights?: string[];
  createdAt: string;
  fromSuggestion?: boolean;
}

// ─── PHASE TEMPLATES ────────────────────────────────────────────────────────

export const PHASE_TEMPLATES: Record<string, MeetingPhase[]> = {
  'Discovery Call': [
    { id: '1', name: 'Begrüßung', duration: 2 },
    { id: '2', name: 'Bedarfsanalyse', duration: 10 },
    { id: '3', name: 'Kurzpitch', duration: 5 },
    { id: '4', name: 'Fragen & Antworten', duration: 5 },
    { id: '5', name: 'Nächste Schritte', duration: 3 },
  ],
  Demo: [
    { id: '1', name: 'Begrüßung', duration: 2 },
    { id: '2', name: 'Pain Points', duration: 5 },
    { id: '3', name: 'Live-Demo', duration: 15 },
    { id: '4', name: 'Q&A', duration: 8 },
    { id: '5', name: 'Close', duration: 5 },
  ],
  'Follow-Up': [
    { id: '1', name: 'Recap', duration: 3 },
    { id: '2', name: 'Offene Punkte', duration: 10 },
    { id: '3', name: 'Entscheidung', duration: 5 },
    { id: '4', name: 'Close', duration: 2 },
  ],
};

// ─── MOCK SMART SUGGESTIONS ─────────────────────────────────────────────────

const MOCK_SUGGESTIONS: SmartSuggestion[] = [
  {
    id: 'sug-1',
    leadId: '',
    leadName: 'Clara Wolff',
    company: 'Silo Labs',
    emailSnippet:
      'Vielen Dank für die ausführliche Info! Ich hätte Interesse an einem kurzen Gespräch, um Details zu klären…',
    suggestedType: 'Video',
    suggestedDuration: 25,
    reason: 'Positive Antwort auf E-Mail erkannt — Interesse an Gespräch signalisiert',
    createdAt: new Date().toISOString(),
    dismissed: false,
  },
  {
    id: 'sug-2',
    leadId: '',
    leadName: 'Jonas Braun',
    company: 'Deepmark',
    emailSnippet: 'Klingt spannend. Können wir nächste Woche einen Termin finden? Am besten Dienstag oder Mittwoch.',
    suggestedType: 'Video',
    suggestedDuration: 30,
    reason: 'Lead schlägt aktiv Termin vor — hohe Kaufbereitschaft',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    dismissed: false,
  },
];

// ─── STORAGE KEY ────────────────────────────────────────────────────────────

const STORAGE_KEY = 'onvero_meetings';
const SUGGESTIONS_KEY = 'onvero_meeting_suggestions';

// ─── STORE ──────────────────────────────────────────────────────────────────

type MeetingsState = {
  meetings: Meeting[];
  suggestions: SmartSuggestion[];
};

let _state: MeetingsState = { meetings: [], suggestions: [] };
let _listeners = new Set<() => void>();
let _initialized = false;

function emit() {
  _listeners.forEach((fn) => fn());
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_state.meetings));
    localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(_state.suggestions));
  } catch {}
}

function load() {
  if (_initialized) return;
  _initialized = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const meetings: Meeting[] = raw ? JSON.parse(raw) : [];
    const rawSug = localStorage.getItem(SUGGESTIONS_KEY);
    const suggestions: SmartSuggestion[] = rawSug ? JSON.parse(rawSug) : MOCK_SUGGESTIONS;
    _state = { meetings, suggestions };
  } catch {
    _state = { meetings: [], suggestions: MOCK_SUGGESTIONS };
  }
  // Fetch real data from API (non-blocking)
  fetchMeetingsFromApi();
  fetchSuggestionsFromApi();
}

async function fetchMeetingsFromApi() {
  try {
    const res = await fetch('/api/meetings');
    if (!res.ok) return;
    const data = await res.json();
    if (data.meetings && data.meetings.length > 0) {
      const apiMeetings: Meeting[] = data.meetings.map((m: Record<string, unknown>) => {
        const leadName = (m.lead_name as string) ?? '';
        const leadCompany = (m.lead_company as string) ?? '';
        const titleParts = ((m.title as string) ?? '').split('—');
        return {
          id: m.id as string,
          leadId: (m.lead_id as string) ?? '',
          leadName,
          company: leadCompany || titleParts[1]?.trim() || '',
          contact: leadName || titleParts[1]?.trim() || '',
          title: m.title as string,
          type: m.type as MeetingType,
          status: m.status as MeetingStatus,
          date: (m.date as string) ?? '',
          time: ((m.time as string) ?? '').slice(0, 5),
          duration: (m.duration as number) ?? 25,
          phases: (m.phases as MeetingPhase[]) ?? [],
          notes: (m.notes as string) ?? '',
          product: (m.product as string) ?? '',
          summary: (m.summary as string) ?? undefined,
          aiInsights: (m.ai_insights as string[]) ?? undefined,
          createdAt: m.created_at as string,
          fromSuggestion: (m.from_suggestion as boolean) ?? false,
        };
      });
      // Merge: API meetings take priority, keep local-only meetings
      const apiIds = new Set(apiMeetings.map((m) => m.id));
      const localOnly = _state.meetings.filter((m) => !apiIds.has(m.id));
      _state = { ..._state, meetings: [...apiMeetings, ...localOnly] };
      persist();
      emit();
    }
  } catch {}
}

async function fetchSuggestionsFromApi() {
  try {
    const res = await fetch('/api/meetings/suggestions');
    if (!res.ok) return;
    const data = await res.json();
    if (data.suggestions && data.suggestions.length > 0) {
      const apiSuggestions: SmartSuggestion[] = data.suggestions.map((s: Record<string, unknown>) => ({
        id: s.id as string,
        leadId: (s.lead_id as string) ?? '',
        leadName: s.lead_name as string,
        company: s.company as string,
        emailSnippet: (s.email_snippet as string) ?? '',
        suggestedType: (s.suggested_type as string as SmartSuggestion['suggestedType']) ?? 'Video',
        suggestedDuration: (s.suggested_duration as number) ?? 25,
        reason: (s.reason as string) ?? '',
        createdAt: s.created_at as string,
        dismissed: false,
      }));
      // Merge with local — API takes priority, remove duplicates
      const localIds = new Set(_state.suggestions.map((s) => s.id));
      const merged = [...apiSuggestions.filter((s) => !localIds.has(s.id)), ..._state.suggestions];
      _state = { ..._state, suggestions: merged };
      persist();
      emit();
    }
  } catch {}
}

function subscribe(fn: () => void) {
  _listeners.add(fn);
  if (typeof window !== 'undefined') load();
  return () => {
    _listeners.delete(fn);
  };
}

function getSnapshot(): MeetingsState {
  return _state;
}

// ─── ACTIONS ────────────────────────────────────────────────────────────────

export function addMeeting(meeting: Omit<Meeting, 'id' | 'createdAt' | 'status'>): Meeting {
  const newMeeting: Meeting = {
    ...meeting,
    id: `mtg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    status: 'Geplant',
    createdAt: new Date().toISOString(),
  };
  _state = { ..._state, meetings: [newMeeting, ..._state.meetings] };
  persist();
  emit();

  // Also save to Supabase API (non-blocking)
  fetch('/api/meetings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lead_id: meeting.leadId || null,
      title: meeting.title,
      type: meeting.type,
      date: meeting.date,
      time: meeting.time,
      duration: meeting.duration,
      phases: meeting.phases,
      product: meeting.product,
      notes: meeting.notes,
      from_suggestion: meeting.fromSuggestion ?? false,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.meeting?.id) {
        // Replace the temp ID with the real DB ID
        _state = {
          ..._state,
          meetings: _state.meetings.map((m) => (m.id === newMeeting.id ? { ...m, id: data.meeting.id } : m)),
        };
        persist();
        emit();
      }
    })
    .catch(() => {});

  return newMeeting;
}

export function dismissSuggestion(id: string) {
  _state = {
    ..._state,
    suggestions: _state.suggestions.map((s) => (s.id === id ? { ...s, dismissed: true } : s)),
  };
  persist();
  emit();
}

export function acceptSuggestion(id: string): SmartSuggestion | null {
  const sug = _state.suggestions.find((s) => s.id === id);
  if (!sug) return null;
  dismissSuggestion(id);
  return sug;
}

// ─── HOOK ───────────────────────────────────────────────────────────────────

const SERVER_SNAPSHOT: MeetingsState = { meetings: [], suggestions: [] };

export function useMeetings() {
  const state = useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT);
  return {
    meetings: state.meetings,
    suggestions: state.suggestions.filter((s) => !s.dismissed),
  };
}

// ─── HELPERS ────────────────────────────────────────────────────────────────

let _idCounter = 100;
export function nextPhaseId(): string {
  return `p-${++_idCounter}`;
}

export function totalPhaseDuration(phases: MeetingPhase[]): number {
  return phases.reduce((sum, p) => sum + p.duration, 0);
}
