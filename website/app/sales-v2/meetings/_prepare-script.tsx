'use client';

import { useState } from 'react';
import { C, SvgIcon, ICONS } from '../_shared';
import { ACCOUNT } from '../_lead-data';
import type { Meeting, MeetingPhase } from './_meeting-store';
import type { Lead } from '../_lead-data';

// ─── SCRIPT GENERATION ──────────────────────────────────────────────────────
// Generates a structured call script based on meeting phases and lead data.

function generatePhaseScript(phase: MeetingPhase, lead: Lead | null, meeting: Meeting): string {
  const name = lead?.firstName ?? 'den Kunden';
  const company = lead?.company ?? 'das Unternehmen';
  const product = meeting.product || ACCOUNT.description || 'unser Angebot';
  const senderName = ACCOUNT.senderName;
  const senderCompany = ACCOUNT.companyName;

  const scripts: Record<string, string> = {
    Begrüßung: `Hallo ${name}, schön dass wir heute sprechen können. Mein Name ist ${senderName} von ${senderCompany}. Wie geht es Ihnen?`,
    Bedarfsanalyse: `${name}, bevor ich Ihnen etwas zeige — erzählen Sie mir kurz: Was sind aktuell Ihre größten Herausforderungen bei ${company}? Was nutzen Sie momentan dafür?`,
    Kurzpitch: `Basierend auf dem, was Sie mir erzählt haben, denke ich dass ${product} genau hier ansetzen kann. Lassen Sie mich kurz erklären, wie das funktioniert…`,
    'Fragen & Antworten': `Das war der grobe Überblick. Was sind Ihre ersten Gedanken dazu? Gibt es Bedenken oder Fragen?`,
    'Nächste Schritte': `Super, ${name}. Als nächstes würde ich vorschlagen: [konkreter nächster Schritt]. Passt das für Sie?`,
    'Pain Points': `${name}, welche konkreten Probleme möchten Sie lösen? Was kostet Sie das aktuell an Zeit/Geld/Nerven?`,
    'Live-Demo': `Lassen Sie mich Ihnen jetzt zeigen, wie ${product} in der Praxis aussieht. Ich teile meinen Bildschirm…`,
    'Q&A': `Vielen Dank fürs Zuschauen. Welche Fragen haben sich ergeben? Was hat Sie besonders angesprochen?`,
    Close: `${name}, basierend auf unserem Gespräch — wie möchten Sie weiter vorgehen? Ich kann Ihnen ein Angebot zusammenstellen.`,
    Recap: `${name}, schön dass wir wieder zusammenkommen. Lassen Sie mich kurz zusammenfassen, was wir beim letzten Mal besprochen haben…`,
    'Offene Punkte': `Beim letzten Gespräch hatten Sie einige offene Punkte. Lassen Sie uns die durchgehen: [Punkte auflisten]`,
    Entscheidung: `${name}, haben Sie intern bereits abstimmen können? Wie stehen die Chancen, dass wir zusammenkommen?`,
  };

  return scripts[phase.name] ?? `[Eigenen Text für "${phase.name}" einfügen]`;
}

// ─── KEY FACTS SIDEBAR ──────────────────────────────────────────────────────

function KeyFacts({ lead, meeting }: { lead: Lead | null; meeting: Meeting }) {
  const facts: { icon: string; label: string; value: string; color: string }[] = [];

  if (lead) {
    facts.push({ icon: ICONS.users, label: 'Ansprechpartner', value: lead.name, color: C.accent });
    if (lead.jobTitle) facts.push({ icon: ICONS.chart, label: 'Position', value: lead.jobTitle, color: '#38BDF8' });
    facts.push({ icon: ICONS.globe, label: 'Firma', value: lead.company, color: '#34D399' });
    if (lead.city) facts.push({ icon: ICONS.target, label: 'Standort', value: lead.city, color: '#A78BFA' });
    if (lead.email) facts.push({ icon: ICONS.mail, label: 'E-Mail', value: lead.email, color: '#FBBF24' });
    if (lead.phone) facts.push({ icon: ICONS.mic, label: 'Telefon', value: lead.phone, color: '#F87171' });
  }

  if (meeting.product) {
    facts.push({ icon: ICONS.zap, label: 'Dein Angebot', value: meeting.product, color: C.accent });
  }

  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: '18px 20px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <SvgIcon d={ICONS.eye} size={13} color={C.accent} />
        <span style={{ fontSize: 10, fontWeight: 600, color: C.text3, letterSpacing: '0.08em' }}>NICHT VERGESSEN</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {facts.map((f) => (
          <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: `${f.color}10`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <SvgIcon d={f.icon} size={11} color={f.color} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 9, color: C.text3, letterSpacing: '0.04em' }}>{f.label}</div>
              <div
                style={{
                  fontSize: 12,
                  color: C.text1,
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {f.value}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export default function PrepareScript({ meeting, lead }: { meeting: Meeting; lead: Lead | null }) {
  const [editedScripts, setEditedScripts] = useState<Record<string, string>>({});
  const [activePhase, setActivePhase] = useState<string | null>(meeting.phases[0]?.id ?? null);

  const getScript = (phase: MeetingPhase) => editedScripts[phase.id] ?? generatePhaseScript(phase, lead, meeting);

  const updateScript = (phaseId: string, text: string) => {
    setEditedScripts((prev) => ({ ...prev, [phaseId]: text }));
  };

  const totalDuration = meeting.phases.reduce((s, p) => s + p.duration, 0);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 14 }}>
      {/* Script */}
      <div
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 2px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
          animation: 'fadeInUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: C.accentGhost,
              border: `1px solid ${C.borderAccent}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SvgIcon d={ICONS.chat} size={13} color={C.accent} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text1, letterSpacing: '-0.01em' }}>
              Gesprächsleitfaden
            </div>
            <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>
              {meeting.phases.length} Phasen · {totalDuration} min · Texte anklicken zum Bearbeiten
            </div>
          </div>
        </div>

        {/* Phases */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {meeting.phases.map((phase, i) => {
            const isActive = activePhase === phase.id;
            const elapsed = meeting.phases.slice(0, i).reduce((s, p) => s + p.duration, 0);

            return (
              <div
                key={phase.id}
                onClick={() => setActivePhase(isActive ? null : phase.id)}
                style={{
                  borderRadius: 10,
                  border: `1px solid ${isActive ? C.borderAccent : C.border}`,
                  background: isActive ? `${C.accent}04` : 'transparent',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  animation: 'fadeInUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
                  animationDelay: `${i * 0.04}s`,
                }}
              >
                {/* Phase Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 7,
                      background: isActive ? C.accentGhost : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isActive ? C.borderAccent : C.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 600,
                      color: isActive ? C.accent : C.text3,
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </div>

                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: isActive ? C.text1 : C.text2 }}>
                      {phase.name}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: 10,
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                      color: C.text3,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: 'rgba(255,255,255,0.03)',
                    }}
                  >
                    {elapsed > 0 ? `${elapsed}–${elapsed + phase.duration}` : `0–${phase.duration}`} min
                  </span>

                  <SvgIcon d={ICONS.chevRight} size={12} color={C.text3} />
                </div>

                {/* Expanded Script */}
                {isActive && (
                  <div style={{ padding: '0 16px 14px 52px' }} onClick={(e) => e.stopPropagation()}>
                    <textarea
                      value={getScript(phase)}
                      onChange={(e) => updateScript(phase.id, e.target.value)}
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.02)',
                        border: `1px solid ${C.border}`,
                        borderRadius: 8,
                        padding: '12px 14px',
                        color: C.text1,
                        fontSize: 13,
                        fontFamily: 'inherit',
                        lineHeight: 1.7,
                        outline: 'none',
                        resize: 'vertical',
                        minHeight: 80,
                      }}
                    />
                    <div style={{ fontSize: 10, color: C.text3, marginTop: 6, fontStyle: 'italic' }}>
                      Klicke auf den Text um ihn anzupassen. Änderungen werden automatisch gespeichert.
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sidebar: Key Facts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <KeyFacts lead={lead} meeting={meeting} />

        {/* Meeting Notes */}
        {meeting.notes && (
          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: '18px 20px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <SvgIcon d={ICONS.chat} size={12} color={C.text3} />
              <span style={{ fontSize: 10, fontWeight: 600, color: C.text3, letterSpacing: '0.08em' }}>NOTIZEN</span>
            </div>
            <p style={{ fontSize: 12, color: C.text2, lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
              {meeting.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
