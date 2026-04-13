'use client';

import { useState } from 'react';
import { C, SvgIcon, ICONS } from '../_shared';
import type { Lead } from '../_lead-data';

// ─── OBJECTION DATA ─────────────────────────────────────────────────────────

interface Objection {
  id: string;
  category: string;
  objection: string;
  response: string;
  tip: string;
}

const GENERAL_OBJECTIONS: Objection[] = [
  {
    id: 'price',
    category: 'Preis',
    objection: '„Das ist uns zu teuer."',
    response:
      'Ich verstehe, dass das Budget eine Rolle spielt. Lassen Sie uns mal anschauen, was Sie aktuell an Zeit und Ressourcen investieren. Oft zeigt sich, dass die Kosten des Nicht-Handelns höher sind als die Investition.',
    tip: 'Nie den Preis rechtfertigen — stattdessen den ROI aufzeigen. Frage: "Was kostet es Sie, wenn Sie nichts ändern?"',
  },
  {
    id: 'time',
    category: 'Zeitpunkt',
    objection: '„Wir haben gerade keine Zeit dafür."',
    response:
      'Das kann ich gut nachvollziehen. Genau deshalb ist unser Ansatz so aufgebaut, dass der Einstieg minimal ist. Wann wäre ein besserer Zeitpunkt? Ich kann Ihnen auch vorab schon Material schicken.',
    tip: '"Keine Zeit" heißt oft "keine Priorität". Finde heraus, was gerade Priorität hat, und verknüpfe dein Angebot damit.',
  },
  {
    id: 'competitor',
    category: 'Wettbewerb',
    objection: '„Wir nutzen bereits [Wettbewerber]."',
    response:
      'Gut, dann haben Sie schon Erfahrung in dem Bereich. Was gefällt Ihnen daran? Und gibt es Dinge, die Sie sich anders wünschen würden? Viele unserer Kunden sind genau aus diesem Grund gewechselt.',
    tip: 'Nie den Wettbewerber schlecht machen. Stattdessen fragen, was fehlt, und genau dort ansetzen.',
  },
  {
    id: 'decision',
    category: 'Entscheidung',
    objection: '„Ich muss das intern abstimmen."',
    response:
      'Natürlich, das verstehe ich. Wer wäre denn noch in die Entscheidung involviert? Ich kann Ihnen gerne Unterlagen zusammenstellen, die Sie intern teilen können. Soll ich vielleicht direkt an dem Gespräch teilnehmen?',
    tip: 'Finde den wahren Entscheider. Biete an, beim internen Pitch zu helfen — Material, Zahlen, kurze Demo.',
  },
  {
    id: 'need',
    category: 'Bedarf',
    objection: '„Brauchen wir aktuell nicht."',
    response:
      'Das höre ich öfter — bis man mal ausrechnet, wie viel Zeit für [spezifisches Problem] draufgeht. Darf ich Ihnen kurz zeigen, wie andere Unternehmen in Ihrer Branche das gelöst haben?',
    tip: 'Der Kunde kennt vielleicht das Problem noch nicht. Nutze Branchen-Beispiele und konkrete Zahlen.',
  },
  {
    id: 'trust',
    category: 'Vertrauen',
    objection: '„Ich kenne Ihr Unternehmen nicht."',
    response:
      'Verständlich — Vertrauen muss man sich verdienen. Wir arbeiten bereits mit [Referenzkunden] zusammen. Ich kann Ihnen gerne eine Referenz vermitteln oder wir starten mit einem unverbindlichen Pilotprojekt.',
    tip: 'Social Proof ist King. Referenzkunden, Case Studies, Testimonials — immer griffbereit haben.',
  },
];

function getIndustryObjections(lead: Lead | null): Objection[] {
  if (!lead) return [];
  const industry = lead.industry.toLowerCase();
  const objections: Objection[] = [];

  if (industry.includes('ecommerce') || industry.includes('fashion')) {
    objections.push({
      id: 'ind-1',
      category: 'Branche',
      objection: '„Unser Shop-System hat das schon integriert."',
      response:
        'Viele Shop-Systeme bieten Basisfunktionen, aber keine spezialisierte Lösung. Lassen Sie uns vergleichen, was Ihr System kann und wo wir darüber hinausgehen.',
      tip: 'Kenne die Limitationen von Shopify, WooCommerce, etc. und zeige den Mehrwert.',
    });
  }

  if (industry.includes('logistik') || industry.includes('industrie')) {
    objections.push({
      id: 'ind-2',
      category: 'Branche',
      objection: '„Unsere Prozesse sind zu komplex für eine Standardlösung."',
      response:
        'Genau für komplexe Prozesse sind wir gebaut. Lassen Sie mich Ihnen zeigen, wie wir bei [ähnlichem Kunden] die Komplexität abgebildet haben.',
      tip: 'Komplexität = höherer Deal-Wert. Zeige Flexibilität und Customizing-Optionen.',
    });
  }

  if (lead.employeeCount && lead.employeeCount < 20) {
    objections.push({
      id: 'ind-3',
      category: 'Unternehmensgröße',
      objection: '„Wir sind zu klein dafür."',
      response:
        'Gerade kleinere Teams profitieren am meisten von Automatisierung — weil jede eingesparte Stunde zählt. Wir haben Pakete speziell für Teams Ihrer Größe.',
      tip: 'Bei KMUs: ROI in Stunden pro Woche rechnen, nicht in Euro. "5 Stunden pro Woche zurückgewinnen" wirkt stärker.',
    });
  }

  return objections;
}

// ─── CATEGORY COLORS ────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  Preis: '#FBBF24',
  Zeitpunkt: '#38BDF8',
  Wettbewerb: '#F87171',
  Entscheidung: '#A78BFA',
  Bedarf: '#34D399',
  Vertrauen: '#818CF8',
  Branche: '#22D3EE',
  Unternehmensgröße: '#FB923C',
};

// ─── COMPONENT ──────────────────────────────────────────────────────────────

export default function PrepareObjections({ lead }: { lead: Lead | null }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const industryObjections = getIndustryObjections(lead);
  const allObjections = [...industryObjections, ...GENERAL_OBJECTIONS];

  return (
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
            background: 'rgba(251,191,36,0.1)',
            border: '1px solid rgba(251,191,36,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <SvgIcon d={ICONS.zap} size={13} color="#FBBF24" />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text1, letterSpacing: '-0.01em' }}>
            Einwand-Cheatsheet
          </div>
          <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>
            {allObjections.length} vorbereitete Antworten
            {industryObjections.length > 0 && ` · ${industryObjections.length} branchenspezifisch`}
          </div>
        </div>
      </div>

      {/* Objections List */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {allObjections.map((obj, i) => {
          const isExpanded = expandedId === obj.id;
          const color = CATEGORY_COLORS[obj.category] ?? C.accent;
          const isIndustry = obj.id.startsWith('ind-');

          return (
            <div
              key={obj.id}
              style={{
                borderRadius: 10,
                border: `1px solid ${isExpanded ? `${color}25` : C.border}`,
                background: isExpanded ? `${color}04` : 'transparent',
                overflow: 'hidden',
                transition: 'all 0.2s ease',
                animation: 'fadeInUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
                animationDelay: `${i * 0.03}s`,
              }}
            >
              {/* Objection Header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : obj.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                }}
              >
                {/* Category badge */}
                <div
                  style={{
                    padding: '3px 8px',
                    borderRadius: 5,
                    background: `${color}10`,
                    border: `1px solid ${color}20`,
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: 9, fontWeight: 600, color, letterSpacing: '0.06em' }}>
                    {obj.category.toUpperCase()}
                  </span>
                </div>

                {isIndustry && (
                  <div
                    style={{
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: C.successBg,
                      border: `1px solid ${C.successBorder}`,
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: 8, fontWeight: 600, color: C.success }}>BRANCHE</span>
                  </div>
                )}

                <span style={{ flex: 1, fontSize: 13, color: C.text1, fontWeight: 500 }}>{obj.objection}</span>

                <SvgIcon d={ICONS.chevRight} size={12} color={C.text3} />
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div style={{ padding: '0 16px 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Response */}
                  <div
                    style={{
                      padding: '14px 16px',
                      borderRadius: 9,
                      background: 'rgba(255,255,255,0.02)',
                      border: `1px solid ${C.border}`,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        marginBottom: 8,
                      }}
                    >
                      <SvgIcon d={ICONS.chat} size={11} color={C.success} />
                      <span style={{ fontSize: 10, fontWeight: 600, color: C.success, letterSpacing: '0.06em' }}>
                        DEINE ANTWORT
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: C.text1, lineHeight: 1.7, margin: 0 }}>{obj.response}</p>
                  </div>

                  {/* Tip */}
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: `${C.warning}06`,
                      border: `1px solid ${C.warningBorder}`,
                      display: 'flex',
                      gap: 8,
                    }}
                  >
                    <SvgIcon d={ICONS.spark} size={12} color={C.warning} />
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 500, color: C.warning }}>TIPP: </span>
                      <span style={{ fontSize: 12, color: C.text2, lineHeight: 1.6 }}>{obj.tip}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
