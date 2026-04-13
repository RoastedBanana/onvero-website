'use client';

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
      'Schauen wir mal, was Sie aktuell an Zeit und Ressourcen investieren. Oft sind die Kosten des Nicht-Handelns höher als die Investition.',
    tip: 'ROI aufzeigen, nicht Preis rechtfertigen.',
  },
  {
    id: 'time',
    category: 'Zeitpunkt',
    objection: '„Wir haben gerade keine Zeit."',
    response:
      'Unser Einstieg ist minimal aufgebaut. Wann wäre ein besserer Zeitpunkt? Ich schicke Ihnen vorab Material.',
    tip: '"Keine Zeit" = "keine Priorität". Verknüpfe mit ihrer aktuellen Priorität.',
  },
  {
    id: 'competitor',
    category: 'Wettbewerb',
    objection: '„Wir nutzen bereits [Wettbewerber]."',
    response: 'Was gefällt Ihnen daran? Und was wünschen Sie sich anders? Viele Kunden sind genau deshalb gewechselt.',
    tip: 'Nie den Wettbewerber schlecht machen. Fragen was fehlt.',
  },
  {
    id: 'decision',
    category: 'Entscheidung',
    objection: '„Ich muss das intern abstimmen."',
    response:
      'Wer wäre noch involviert? Ich stelle Ihnen Unterlagen zusammen. Soll ich beim internen Pitch dabei sein?',
    tip: 'Finde den wahren Entscheider. Biete Material + Präsenz an.',
  },
  {
    id: 'need',
    category: 'Bedarf',
    objection: '„Brauchen wir aktuell nicht."',
    response:
      'Lassen Sie mich Ihnen zeigen, wie andere Unternehmen in Ihrer Branche das gelöst haben — oft kennt man das Problem erst, wenn man die Lösung sieht.',
    tip: 'Branchen-Beispiele und konkrete Zahlen nutzen.',
  },
  {
    id: 'trust',
    category: 'Vertrauen',
    objection: '„Ich kenne Ihr Unternehmen nicht."',
    response:
      'Verständlich. Wir arbeiten mit [Referenzkunden] zusammen. Ich vermittle gerne eine Referenz oder wir starten mit einem Pilotprojekt.',
    tip: 'Social Proof: Referenzen, Case Studies, Testimonials griffbereit haben.',
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
      objection: '„Unser Shop-System hat das integriert."',
      response: 'Shop-Systeme bieten Basisfunktionen. Lassen Sie uns vergleichen, wo wir darüber hinausgehen.',
      tip: 'Kenne die Limitationen von Shopify/WooCommerce und zeige Mehrwert.',
    });
  }

  if (industry.includes('logistik') || industry.includes('industrie')) {
    objections.push({
      id: 'ind-2',
      category: 'Branche',
      objection: '„Unsere Prozesse sind zu komplex."',
      response:
        'Genau für komplexe Prozesse gebaut. Lassen Sie mich zeigen, wie wir das bei ähnlichen Kunden gelöst haben.',
      tip: 'Komplexität = höherer Deal-Wert. Zeige Customizing-Optionen.',
    });
  }

  if (lead.employeeCount && lead.employeeCount < 20) {
    objections.push({
      id: 'ind-3',
      category: 'Größe',
      objection: '„Wir sind zu klein dafür."',
      response:
        'Gerade kleinere Teams profitieren am meisten — jede eingesparte Stunde zählt. Wir haben Pakete für Ihre Größe.',
      tip: 'ROI in Stunden/Woche rechnen. "5h pro Woche zurückgewinnen" wirkt stärker.',
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
  Größe: '#FB923C',
};

// ─── COMPONENT — everything visible, no expanding ───────────────────────────

export default function PrepareObjections({ lead }: { lead: Lead | null }) {
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
          padding: '14px 18px',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <SvgIcon d={ICONS.zap} size={13} color="#FBBF24" />
        <span style={{ fontSize: 13, fontWeight: 600, color: C.text1 }}>Einwand-Cheatsheet</span>
        <span style={{ fontSize: 11, color: C.text3, marginLeft: 'auto' }}>
          {allObjections.length} Antworten
          {industryObjections.length > 0 && ` · ${industryObjections.length} branchenspezifisch`}
        </span>
      </div>

      {/* All objections — inline, scannable */}
      <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {allObjections.map((obj, i) => {
          const color = CATEGORY_COLORS[obj.category] ?? C.accent;
          const isIndustry = obj.id.startsWith('ind-');

          return (
            <div
              key={obj.id}
              style={{
                borderRadius: 10,
                border: `1px solid ${isIndustry ? `${color}20` : C.border}`,
                background: isIndustry ? `${color}04` : 'transparent',
                padding: '14px 16px',
                animation: 'fadeInUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
                animationDelay: `${i * 0.03}s`,
              }}
            >
              {/* Top row: category + objection */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    color,
                    letterSpacing: '0.06em',
                    padding: '2px 7px',
                    borderRadius: 4,
                    background: `${color}10`,
                    border: `1px solid ${color}18`,
                    flexShrink: 0,
                  }}
                >
                  {obj.category.toUpperCase()}
                </span>
                {isIndustry && (
                  <span
                    style={{
                      fontSize: 8,
                      fontWeight: 600,
                      color: C.success,
                      padding: '2px 5px',
                      borderRadius: 3,
                      background: C.successBg,
                    }}
                  >
                    SPEZIFISCH
                  </span>
                )}
                <span style={{ fontSize: 13, fontWeight: 500, color: C.text1 }}>{obj.objection}</span>
              </div>

              {/* Two columns: response + tip */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
                {/* Response */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <SvgIcon d={ICONS.chat} size={11} color={C.success} />
                  <p style={{ fontSize: 12.5, color: C.text2, lineHeight: 1.6, margin: 0 }}>{obj.response}</p>
                </div>

                {/* Tip — compact */}
                <div
                  style={{
                    padding: '6px 10px',
                    borderRadius: 7,
                    background: `${C.warning}06`,
                    border: `1px solid ${C.warningBorder}`,
                    maxWidth: 220,
                    display: 'flex',
                    gap: 6,
                    alignSelf: 'start',
                  }}
                >
                  <SvgIcon d={ICONS.spark} size={10} color={C.warning} />
                  <span style={{ fontSize: 10.5, color: C.text3, lineHeight: 1.5 }}>{obj.tip}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
