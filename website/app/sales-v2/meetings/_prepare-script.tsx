'use client';

import { useState } from 'react';
import { C, SvgIcon, ICONS } from '../_shared';
import { ACCOUNT } from '../_lead-data';
import type { Meeting, MeetingPhase } from './_meeting-store';
import type { Lead } from '../_lead-data';

// ─── INDIVIDUALIZED SCRIPT GENERATION ───────────────────────────────────────

function generatePhaseScript(phase: MeetingPhase, lead: Lead | null, meeting: Meeting): string {
  const name = lead?.firstName ?? 'den Kunden';
  const lastName = lead?.lastName ?? '';
  const company = lead?.company ?? 'das Unternehmen';
  const product = meeting.product || ACCOUNT.description;
  const industry = lead?.industry && lead.industry !== 'Sonstige' ? lead.industry : null;
  const city = lead?.city || null;
  const googleRating = lead?.googleRating;
  const emailSent = !!lead?.emailDraftSubject;
  const emailSubject = lead?.emailDraftSubject;
  const aiSummary = lead?.aiSummary;
  const nextAction = lead?.nextAction;

  // Build context-aware scripts
  const scripts: Record<string, string> = {
    Begrüßung: [
      `Hallo ${name}${lastName ? ` ${lastName}` : ''}, schön dass wir heute sprechen können.`,
      `Mein Name ist ${ACCOUNT.senderName} von ${ACCOUNT.companyName}.`,
      emailSent
        ? `Wir hatten ja schon per E-Mail Kontakt${emailSubject ? ` zum Thema "${emailSubject}"` : ''} — freut mich, dass wir jetzt persönlich sprechen.`
        : `Ich habe mir ${company} mal genauer angeschaut und denke, da gibt es spannende Ansätze.`,
      city ? `Sie sitzen in ${city}, richtig?` : '',
    ]
      .filter(Boolean)
      .join(' '),

    Bedarfsanalyse: [
      `${name}, bevor ich Ihnen etwas zeige — erzählen Sie mir kurz:`,
      industry
        ? `Wie sieht es aktuell bei ${company} im Bereich ${industry} aus?`
        : `Was sind aktuell Ihre größten Herausforderungen bei ${company}?`,
      aiSummary
        ? `Ich habe gelesen, dass ${aiSummary
            .split('.')[0]
            .toLowerCase()
            .replace(/^(das |die |der )/, '')}. Stimmt das so?`
        : 'Was nutzen Sie momentan und wo hakt es?',
      'Was wäre Ihre ideale Lösung, wenn alles möglich wäre?',
    ]
      .filter(Boolean)
      .join('\n'),

    Kurzpitch: [
      `Basierend auf dem, was Sie mir erzählt haben:`,
      `${product}`,
      industry ? `Wir arbeiten bereits mit Unternehmen im Bereich ${industry} zusammen.` : '',
      `Konkret heißt das für ${company}:`,
      `• [Vorteil 1 basierend auf dem Gespräch]`,
      `• [Vorteil 2 basierend auf dem Gespräch]`,
      `• [Vorteil 3 basierend auf dem Gespräch]`,
    ]
      .filter(Boolean)
      .join('\n'),

    'Fragen & Antworten': [
      `Das war der grobe Überblick. ${name}, was sind Ihre ersten Gedanken?`,
      `Gibt es Punkte, die Sie besonders interessieren?`,
      `Oder Bedenken, die wir direkt klären können?`,
    ].join('\n'),

    'Nächste Schritte': [
      `${name}, ich fasse mal zusammen was wir besprochen haben:`,
      `[Zusammenfassung der Key Points]`,
      nextAction
        ? `Als nächstes: ${nextAction}`
        : 'Als nächstes würde ich vorschlagen, dass ich Ihnen ein konkretes Angebot zusammenstelle.',
      `Wann passt es Ihnen für ein Follow-Up? Nächste Woche?`,
    ].join('\n'),

    'Pain Points': [
      `${name}, lassen Sie uns mal konkret werden:`,
      `Welche Prozesse kosten Sie aktuell am meisten Zeit?`,
      `Was passiert, wenn das Problem ungelöst bleibt?`,
      industry ? `In der ${industry}-Branche sehen wir häufig: [typisches Problem]. Kennen Sie das?` : '',
    ]
      .filter(Boolean)
      .join('\n'),

    'Live-Demo': [
      `Ich teile jetzt meinen Bildschirm und zeige Ihnen ${product} live.`,
      `Ich habe das Beispiel an ${company} angepasst, damit Sie direkt sehen, wie es bei Ihnen aussehen würde.`,
      `Fragen Sie jederzeit, wenn etwas unklar ist.`,
    ].join('\n'),

    'Q&A': [
      `Vielen Dank fürs Zuschauen, ${name}.`,
      `Was hat Sie am meisten angesprochen?`,
      `Gibt es etwas, das für ${company} nicht passen würde?`,
    ].join('\n'),

    Close: [
      `${name}, basierend auf unserem Gespräch — sehen Sie den Mehrwert für ${company}?`,
      `Wie sieht Ihr Entscheidungsprozess aus? Sind noch andere Personen involviert?`,
      `Ich kann Ihnen bis [Datum] ein konkretes Angebot schicken.`,
    ].join('\n'),

    Recap: [
      `${name}, schön dass wir wieder zusammenkommen.`,
      emailSent ? `Seit unserer letzten E-Mail hat sich einiges getan.` : '',
      `Lassen Sie mich kurz zusammenfassen, was wir beim letzten Mal besprochen haben:`,
      `[Punkte vom letzten Gespräch]`,
    ]
      .filter(Boolean)
      .join('\n'),

    'Offene Punkte': [
      `Sie hatten beim letzten Mal einige offene Punkte — lassen Sie uns die durchgehen:`,
      `1. [Punkt aus dem letzten Meeting]`,
      `2. [Punkt aus dem letzten Meeting]`,
      `Gibt es noch weitere Fragen, die seitdem aufgekommen sind?`,
    ].join('\n'),

    Entscheidung: [
      `${name}, konnten Sie intern bereits abstimmen?`,
      `Wie stehen die Chancen, dass wir zusammenkommen?`,
      `Was brauchen Sie noch, um eine Entscheidung treffen zu können?`,
    ].join('\n'),
  };

  return scripts[phase.name] ?? `Phase: ${phase.name}\n\n[Eigene Gesprächspunkte hier eintragen]`;
}

// ─── KEY FACTS ──────────────────────────────────────────────────────────────

function KeyFacts({ lead, meeting }: { lead: Lead | null; meeting: Meeting }) {
  const facts: { icon: string; label: string; value: string; color: string }[] = [];

  if (lead) {
    facts.push({ icon: ICONS.users, label: 'Name', value: lead.name, color: C.accent });
    if (lead.jobTitle) facts.push({ icon: ICONS.chart, label: 'Position', value: lead.jobTitle, color: '#38BDF8' });
    facts.push({ icon: ICONS.globe, label: 'Firma', value: lead.company, color: '#34D399' });
    if (lead.city) facts.push({ icon: ICONS.target, label: 'Ort', value: lead.city, color: '#A78BFA' });
    if (lead.email) facts.push({ icon: ICONS.mail, label: 'E-Mail', value: lead.email, color: '#FBBF24' });
    if (lead.phone) facts.push({ icon: ICONS.mic, label: 'Telefon', value: lead.phone, color: '#F87171' });
    if (lead.googleRating)
      facts.push({
        icon: ICONS.trending,
        label: 'Google',
        value: `${lead.googleRating} ★ (${lead.googleReviews})`,
        color: '#22D3EE',
      });
  }
  if (meeting.product) facts.push({ icon: ICONS.zap, label: 'Angebot', value: meeting.product, color: C.accent });

  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: '14px 16px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 600, color: C.text3, letterSpacing: '0.08em', marginBottom: 10 }}>
        NICHT VERGESSEN
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {facts.map((f) => (
          <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SvgIcon d={f.icon} size={11} color={f.color} />
            <span style={{ fontSize: 9, color: C.text3, minWidth: 48 }}>{f.label}</span>
            <span
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
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export default function PrepareScript({ meeting, lead }: { meeting: Meeting; lead: Lead | null }) {
  const [editedScripts, setEditedScripts] = useState<Record<string, string>>({});

  const getScript = (phase: MeetingPhase) => editedScripts[phase.id] ?? generatePhaseScript(phase, lead, meeting);

  const updateScript = (phaseId: string, text: string) => {
    setEditedScripts((prev) => ({ ...prev, [phaseId]: text }));
  };

  const totalDuration = meeting.phases.reduce((s, p) => s + p.duration, 0);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 14 }}>
      {/* Script — all phases visible */}
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
        <div
          style={{
            padding: '14px 18px',
            borderBottom: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <SvgIcon d={ICONS.chat} size={13} color={C.accent} />
          <span style={{ fontSize: 13, fontWeight: 600, color: C.text1 }}>Gesprächsleitfaden</span>
          <span style={{ fontSize: 11, color: C.text3, marginLeft: 'auto' }}>
            {meeting.phases.length} Phasen · {totalDuration} min
          </span>
        </div>

        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {meeting.phases.map((phase, i) => {
            const elapsed = meeting.phases.slice(0, i).reduce((s, p) => s + p.duration, 0);

            return (
              <div
                key={phase.id}
                style={{
                  borderLeft: `2px solid ${C.accent}${30 + i * 12}`,
                  paddingLeft: 16,
                  paddingBottom: i < meeting.phases.length - 1 ? 20 : 0,
                  position: 'relative',
                  animation: 'fadeInUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
                  animationDelay: `${i * 0.04}s`,
                }}
              >
                {/* Phase dot */}
                <div
                  style={{
                    position: 'absolute',
                    left: -5,
                    top: 2,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: C.accent,
                    opacity: 0.5 + i * 0.1,
                  }}
                />

                {/* Phase header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text1 }}>{phase.name}</span>
                  <span
                    style={{
                      fontSize: 9,
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                      color: C.text3,
                      padding: '1px 6px',
                      borderRadius: 3,
                      background: 'rgba(255,255,255,0.03)',
                    }}
                  >
                    {elapsed}–{elapsed + phase.duration} min
                  </span>
                </div>

                {/* Script text — always visible, editable on click */}
                <textarea
                  value={getScript(phase)}
                  onChange={(e) => updateScript(phase.id, e.target.value)}
                  rows={getScript(phase).split('\n').length + 1}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: `1px solid transparent`,
                    borderRadius: 8,
                    padding: '8px 10px',
                    color: C.text2,
                    fontSize: 12.5,
                    fontFamily: 'inherit',
                    lineHeight: 1.7,
                    outline: 'none',
                    resize: 'none',
                    transition: 'border-color 0.15s ease, background 0.15s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = `${C.borderAccent}`;
                    e.currentTarget.style.background = `${C.accent}04`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'transparent';
                    e.currentTarget.style.background = 'transparent';
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <KeyFacts lead={lead} meeting={meeting} />

        {/* AI context */}
        {lead?.aiSummary && (
          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: '14px 16px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <SvgIcon d={ICONS.spark} size={11} color={C.accent} />
              <span style={{ fontSize: 10, fontWeight: 600, color: C.text3, letterSpacing: '0.08em' }}>KI-KONTEXT</span>
            </div>
            <p style={{ fontSize: 11.5, color: C.text2, lineHeight: 1.6, margin: 0 }}>{lead.aiSummary}</p>
          </div>
        )}

        {/* Meeting Notes */}
        {meeting.notes && (
          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: '14px 16px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <SvgIcon d={ICONS.chat} size={11} color={C.text3} />
              <span style={{ fontSize: 10, fontWeight: 600, color: C.text3, letterSpacing: '0.08em' }}>NOTIZEN</span>
            </div>
            <p style={{ fontSize: 11.5, color: C.text2, lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
              {meeting.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
