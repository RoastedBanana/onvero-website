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

// No mock data — suggestions come from the API (n8n auto-suggest workflow)

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
  // Don't load from localStorage — always start empty and fetch from API.
  // localStorage is per-domain, not per-user, so cached data from a previous
  // user session would leak across accounts.
  _state = { meetings: [], suggestions: [] };
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

export async function addMeeting(meeting: Omit<Meeting, 'id' | 'createdAt' | 'status'>): Promise<Meeting> {
  const tempId = `mtg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const newMeeting: Meeting = {
    ...meeting,
    id: tempId,
    status: 'Geplant',
    createdAt: new Date().toISOString(),
  };

  // Show immediately in UI
  _state = { ..._state, meetings: [newMeeting, ..._state.meetings] };
  persist();
  emit();

  // Save to Supabase and get real DB ID
  try {
    const res = await fetch('/api/meetings', {
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
    });
    const data = await res.json();
    if (data.meeting?.id) {
      // Replace temp ID with real DB ID
      newMeeting.id = data.meeting.id;
      _state = {
        ..._state,
        meetings: _state.meetings.map((m) => (m.id === tempId ? { ...m, id: data.meeting.id } : m)),
      };
      persist();
      emit();
    }
  } catch {}

  return newMeeting;
}

export function dismissSuggestion(id: string) {
  _state = {
    ..._state,
    suggestions: _state.suggestions.map((s) => (s.id === id ? { ...s, dismissed: true } : s)),
  };
  persist();
  emit();

  // Persist to DB
  fetch('/api/meetings/suggestions', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, action: 'dismiss' }),
  }).catch(() => {});
}

export function acceptSuggestion(id: string): SmartSuggestion | null {
  const sug = _state.suggestions.find((s) => s.id === id);
  if (!sug) return null;
  dismissSuggestion(id);
  return sug;
}

export function deleteMeeting(id: string) {
  _state = { ..._state, meetings: _state.meetings.filter((m) => m.id !== id) };
  persist();
  emit();
  // Also delete from API
  if (!id.startsWith('mtg-')) {
    fetch(`/api/meetings/${id}`, { method: 'DELETE' }).catch(() => {});
  }
}

export function updateMeeting(id: string, patch: Partial<Meeting>) {
  _state = {
    ..._state,
    meetings: _state.meetings.map((m) => (m.id === id ? { ...m, ...patch } : m)),
  };
  persist();
  emit();
  // Also update in API
  if (!id.startsWith('mtg-')) {
    const apiPatch: Record<string, unknown> = {};
    if (patch.title !== undefined) apiPatch.title = patch.title;
    if (patch.type !== undefined) apiPatch.type = patch.type;
    if (patch.status !== undefined) apiPatch.status = patch.status;
    if (patch.date !== undefined) apiPatch.date = patch.date;
    if (patch.time !== undefined) apiPatch.time = patch.time;
    if (patch.duration !== undefined) apiPatch.duration = patch.duration;
    if (patch.notes !== undefined) apiPatch.notes = patch.notes;
    if (patch.product !== undefined) apiPatch.product = patch.product;
    if ((patch as Record<string, unknown>).win_loss !== undefined)
      apiPatch.win_loss = (patch as Record<string, unknown>).win_loss;
    if (Object.keys(apiPatch).length > 0) {
      fetch(`/api/meetings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPatch),
      }).catch(() => {});
    }
  }
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
