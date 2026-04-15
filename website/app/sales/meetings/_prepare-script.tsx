'use client';

import { useState } from 'react';
import { C, SvgIcon, ICONS } from '../_shared';
import { ACCOUNT } from '../_lead-data';
import type { Meeting, MeetingPhase } from './_meeting-store';
import type { Lead } from '../_lead-data';

// ─── HUMANIZE ───────────────────────────────────────────────────────────────
// Strip legal suffixes, make company names conversational

function humanize(companyName: string): string {
  return companyName
    .replace(/\s*(GmbH|UG|AG|SE|KG|OHG|e\.?K\.?|mbH|GbR|Inc\.?|Ltd\.?|LLC|Co\.?\s*KG)\s*(\(.*?\))?\s*/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function senderFirst(): string {
  return ACCOUNT.senderName.split(' ')[0];
}

// ─── INDIVIDUALIZED SCRIPT GENERATION ───────────────────────────────────────

function generatePhaseScript(phase: MeetingPhase, lead: Lead | null, meeting: Meeting): string {
  const name = lead?.firstName ?? 'den Kunden';
  const company = humanize(lead?.company ?? '');
  const product = meeting.product || ACCOUNT.description;
  const industry = lead?.industry && lead.industry !== 'Sonstige' ? lead.industry : null;
  const city = lead?.city || null;
  const emailSent = !!lead?.emailDraftSubject;
  const aiSummary = lead?.aiSummary;
  const nextAction = lead?.nextAction;
  const sender = senderFirst();
  const senderCompany = humanize(ACCOUNT.companyName);

  const scripts: Record<string, string> = {
    Begrüßung: [
      `Hallo ${name}, freut mich dass es klappt!`,
      `Ich bin ${sender} von ${senderCompany}.`,
      emailSent
        ? `Wir hatten ja schon per Mail Kontakt — schön, dass wir jetzt direkt sprechen können.`
        : company
          ? `Ich hab mir ${company} mal angeschaut und finde, da gibt es spannende Ansätze.`
          : '',
      city ? `Ihr sitzt in ${city}, oder?` : '',
    ]
      .filter(Boolean)
      .join(' '),

    Bedarfsanalyse: [
      `${name}, erzähl mir erstmal kurz:`,
      company
        ? `Was sind gerade eure größten Baustellen bei ${company}?`
        : 'Was sind gerade eure größten Herausforderungen?',
      aiSummary
        ? `Ich hab gelesen, dass ${aiSummary
            .split('.')[0]
            .toLowerCase()
            .replace(/^(das |die |der )/, '')} — stimmt das noch so?`
        : 'Was nutzt ihr momentan und wo hakt es?',
      'Und was wäre so euer Idealzustand?',
    ]
      .filter(Boolean)
      .join('\n'),

    Kurzpitch: [
      `Okay, basierend auf dem was du mir erzählt hast:`,
      `Wir machen Folgendes — ${product}`,
      industry ? `Wir arbeiten schon mit einigen Unternehmen aus dem Bereich ${industry}.` : '',
      company ? `Für ${company} heißt das konkret:` : 'Für euch heißt das konkret:',
      `• [Vorteil 1 — aus dem Gespräch ableiten]`,
      `• [Vorteil 2 — spezifisch für deren Situation]`,
      `• [Vorteil 3 — was am meisten resoniert hat]`,
    ]
      .filter(Boolean)
      .join('\n'),

    'Fragen & Antworten': [
      `So, das war der grobe Überblick.`,
      `${name}, was denkst du? Was spricht dich an, was nicht?`,
      `Gibt es Punkte, wo du sagst: "Das müsste ich nochmal genauer verstehen"?`,
    ].join('\n'),

    'Nächste Schritte': [
      `Cool, dann lass mich mal kurz zusammenfassen:`,
      `[Die 2-3 wichtigsten Punkte aus dem Gespräch]`,
      nextAction ? `Nächster Schritt: ${nextAction}` : 'Ich stell euch ein konkretes Angebot zusammen.',
      `Wann passt dir ein kurzes Follow-Up? Nächste Woche?`,
    ].join('\n'),

    'Pain Points': [
      `${name}, lass uns mal konkret werden:`,
      `Welche Prozesse kosten euch am meisten Zeit?`,
      `Und was passiert, wenn sich da nichts ändert?`,
      industry ? `Im Bereich ${industry} sehen wir oft: [typisches Problem]. Kennt ihr das?` : '',
    ]
      .filter(Boolean)
      .join('\n'),

    'Live-Demo': [
      `Okay, ich teil jetzt mal meinen Bildschirm.`,
      company
        ? `Ich hab das Beispiel an ${company} angelehnt, damit du siehst wie es bei euch aussehen würde.`
        : 'Ich zeig euch das an einem echten Beispiel.',
      `Frag jederzeit, wenn was unklar ist.`,
    ].join('\n'),

    'Q&A': [
      `Danke fürs Zuschauen, ${name}.`,
      `Was hat dich am meisten angesprochen?`,
      `Und gibt es Punkte, wo du sagst: Das passt bei uns nicht?`,
    ].join('\n'),

    Close: [
      `${name}, Hand aufs Herz — siehst du den Mehrwert${company ? ` für ${company}` : ''}?`,
      `Wie läuft bei euch die Entscheidung? Wer muss noch mit ins Boot?`,
      `Ich kann dir bis Ende der Woche ein konkretes Angebot schicken.`,
    ].join('\n'),

    Recap: [
      `${name}, schön dass wir wieder sprechen.`,
      emailSent ? `Seit unserer letzten Mail hat sich einiges getan.` : '',
      `Kurzer Recap vom letzten Mal:`,
      `[Wichtigste Punkte zusammenfassen]`,
    ]
      .filter(Boolean)
      .join('\n'),

    'Offene Punkte': [
      `Du hattest beim letzten Mal ein paar Fragen — lass uns die durchgehen:`,
      `1. [Offener Punkt]`,
      `2. [Offener Punkt]`,
      `Ist seitdem noch was Neues dazugekommen?`,
    ].join('\n'),

    Entscheidung: [
      `${name}, konntet ihr intern schon abstimmen?`,
      `Wie stehen die Chancen? Was braucht ihr noch von uns?`,
    ].join('\n'),
  };

  return scripts[phase.name] ?? `Phase: ${phase.name}\n\n[Eigene Gesprächspunkte hier eintragen]`;
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export default function PrepareScript({ meeting, lead }: { meeting: Meeting; lead: Lead | null }) {
  const [editedScripts, setEditedScripts] = useState<Record<string, string>>({});

  const getScript = (phase: MeetingPhase) => editedScripts[phase.id] ?? generatePhaseScript(phase, lead, meeting);

  const updateScript = (phaseId: string, text: string) => {
    setEditedScripts((prev) => ({ ...prev, [phaseId]: text }));
  };

  const totalDuration = meeting.phases.reduce((s, p) => s + p.duration, 0);

  // Key facts for the header bar
  const facts = [
    lead?.name && { icon: ICONS.users, value: lead.name, color: C.accent },
    lead?.jobTitle && { icon: ICONS.chart, value: lead.jobTitle, color: '#38BDF8' },
    lead?.company && { icon: ICONS.globe, value: humanize(lead.company), color: '#34D399' },
    lead?.city && { icon: ICONS.target, value: lead.city, color: '#A78BFA' },
    lead?.phone && { icon: ICONS.mic, value: lead.phone, color: '#F87171' },
    lead?.email && { icon: ICONS.mail, value: lead.email, color: '#FBBF24' },
    lead?.googleRating && {
      icon: ICONS.trending,
      value: `${lead.googleRating} ★ (${lead.googleReviews})`,
      color: '#22D3EE',
    },
    meeting.product && { icon: ICONS.zap, value: meeting.product, color: C.accent },
  ].filter(Boolean) as { icon: string; value: string; color: string }[];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Key Facts Bar — horizontal, scannable */}
      {facts.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 6,
            flexWrap: 'wrap',
            padding: '14px 18px',
            borderRadius: 12,
            background: C.surface,
            border: `1px solid ${C.border}`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
            animation: 'fadeInUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 8 }}>
            <SvgIcon d={ICONS.eye} size={12} color={C.accent} />
            <span style={{ fontSize: 10, fontWeight: 600, color: C.text3, letterSpacing: '0.08em' }}>KEY FACTS</span>
          </div>
          {facts.map((f, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 12px',
                borderRadius: 7,
                background: `${f.color}06`,
                border: `1px solid ${f.color}12`,
              }}
            >
              <SvgIcon d={f.icon} size={11} color={f.color} />
              <span style={{ fontSize: 12, color: C.text1, fontWeight: 500 }}>{f.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* AI Context — if available */}
      {lead?.aiSummary && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: 12,
            background: C.surface,
            border: `1px solid ${C.accent}10`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            gap: 10,
            animation: 'fadeInUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) 0.05s both',
          }}
        >
          <SvgIcon d={ICONS.spark} size={13} color={C.accent} />
          <div>
            <span style={{ fontSize: 10, fontWeight: 600, color: C.accent, letterSpacing: '0.06em' }}>KI-KONTEXT </span>
            <span style={{ fontSize: 12.5, color: C.text2, lineHeight: 1.6 }}>{lead.aiSummary}</span>
          </div>
        </div>
      )}

      {/* Script — all phases visible */}
      <div
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 2px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
          animation: 'fadeInUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both',
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

                <textarea
                  value={getScript(phase)}
                  onChange={(e) => updateScript(phase.id, e.target.value)}
                  rows={getScript(phase).split('\n').length + 1}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: '1px solid transparent',
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

      {/* Meeting Notes */}
      {meeting.notes && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: 12,
            background: C.surface,
            border: `1px solid ${C.border}`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            gap: 10,
          }}
        >
          <SvgIcon d={ICONS.chat} size={12} color={C.text3} />
          <div>
            <span style={{ fontSize: 10, fontWeight: 600, color: C.text3, letterSpacing: '0.06em' }}>NOTIZEN </span>
            <span style={{ fontSize: 12, color: C.text2, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {meeting.notes}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
