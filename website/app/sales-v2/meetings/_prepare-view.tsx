'use client';

import { useState } from 'react';
import { C, SvgIcon, ICONS } from '../_shared';
import PrepareDossier from './_prepare-dossier';
import PrepareScript from './_prepare-script';
import PrepareObjections from './_prepare-objections';
import type { Meeting } from './_meeting-store';
import type { Lead } from '../_lead-data';
import { useLeads } from '../_use-leads';

// ─── SUB-TABS ───────────────────────────────────────────────────────────────

type PrepTab = 'dossier' | 'script' | 'objections';

const PREP_TABS: { id: PrepTab; label: string; icon: string }[] = [
  { id: 'dossier', label: 'Lead-Dossier', icon: ICONS.users },
  { id: 'script', label: 'Gesprächsleitfaden', icon: ICONS.chat },
  { id: 'objections', label: 'Einwand-Cheatsheet', icon: ICONS.zap },
];

// ─── MEETING SELECTOR ───────────────────────────────────────────────────────

function MeetingSelector({
  meetings,
  selectedId,
  onSelect,
}: {
  meetings: Meeting[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (meetings.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
      {meetings.map((m) => {
        const active = m.id === selectedId;
        return (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            className="s-chip"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              borderRadius: 9,
              background: active ? C.accentGhost : 'rgba(255,255,255,0.02)',
              border: `1px solid ${active ? C.borderAccent : C.border}`,
              color: active ? C.accentBright : C.text2,
              fontSize: 12,
              fontWeight: active ? 500 : 400,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ fontWeight: 500 }}>{m.title}</span>
            <span style={{ opacity: 0.5, fontSize: 10 }}>·</span>
            <span style={{ fontSize: 11, fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>{m.time}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── MAIN VIEW ──────────────────────────────────────────────────────────────

export default function PrepareView({ meetings }: { meetings: Meeting[] }) {
  const planned = meetings.filter((m) => m.status === 'Geplant');
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(planned[0]?.id ?? null);
  const [activeTab, setActiveTab] = useState<PrepTab>('dossier');
  const { leads } = useLeads();

  const selectedMeeting = planned.find((m) => m.id === selectedMeetingId) ?? null;
  const lead: Lead | null = selectedMeeting ? (leads.find((l) => l.id === selectedMeeting.leadId) ?? null) : null;

  if (planned.length === 0) {
    return (
      <div
        style={{
          padding: '48px 20px',
          textAlign: 'center',
          borderRadius: 12,
          background: C.surface,
          border: `1px solid ${C.border}`,
          animation: 'fadeInUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: C.accentGhost,
            border: `1px solid ${C.borderAccent}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <SvgIcon d={ICONS.calendar} size={24} color={C.accent} />
        </div>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text1, margin: '0 0 8px' }}>Keine anstehenden Meetings</h3>
        <p style={{ fontSize: 13, color: C.text3, margin: 0, lineHeight: 1.6 }}>
          Erstelle zuerst ein Meeting, um die Vorbereitung zu starten.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Meeting Selector */}
      <MeetingSelector meetings={planned} selectedId={selectedMeetingId} onSelect={setSelectedMeetingId} />

      {/* Selected Meeting Info Bar */}
      {selectedMeeting && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '12px 18px',
            borderRadius: 10,
            background: C.surface,
            border: `1px solid ${C.border}`,
            animation: 'fadeInUp 0.25s cubic-bezier(0.22, 1, 0.36, 1) both',
          }}
        >
          <SvgIcon d={ICONS.calendar} size={14} color={C.accent} />
          <span style={{ fontSize: 13, fontWeight: 500, color: C.text1 }}>{selectedMeeting.title}</span>
          <span style={{ fontSize: 11, color: C.text3 }}>
            {selectedMeeting.contact} · {selectedMeeting.company}
          </span>
          <div style={{ flex: 1 }} />
          <span
            style={{
              fontSize: 11,
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              color: C.text3,
              padding: '3px 10px',
              borderRadius: 6,
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${C.border}`,
            }}
          >
            {selectedMeeting.time} · {selectedMeeting.duration} min
          </span>
        </div>
      )}

      {/* Sub-Tabs */}
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
        {PREP_TABS.map((t) => {
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

      {/* Content */}
      {selectedMeeting && (
        <div key={activeTab} className="tab-content-enter">
          {activeTab === 'dossier' && <PrepareDossier meeting={selectedMeeting} lead={lead} />}
          {activeTab === 'script' && <PrepareScript meeting={selectedMeeting} lead={lead} />}
          {activeTab === 'objections' && <PrepareObjections lead={lead} />}
        </div>
      )}
    </div>
  );
}
