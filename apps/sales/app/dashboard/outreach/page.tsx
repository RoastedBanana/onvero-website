'use client';

import { useState } from 'react';
import {
  C,
  SvgIcon,
  PageHeader,
  PrimaryButton,
  GhostButton,
  StatusBadge,
  ICONS,
  Breadcrumbs,
  GlowButton,
  showToast,
} from '../_shared';

// ─── TYPES ───────────────────────────────────────────────────────────────────

type OutreachIdea = {
  id: number;
  company: string;
  contact: string;
  role: string;
  channel: 'email' | 'linkedin' | 'phone' | 'video';
  hook: string;
  preview: string;
  reasoning: string;
  score: number;
  status: 'Neu' | 'Gesendet' | 'Geöffnet' | 'Beantwortet';
  basedOn: string;
  generatedAt: string;
};

// ─── MOCK DATA ───────────────────────────────────────────────────────────────

const IDEAS: OutreachIdea[] = [
  {
    id: 1,
    company: 'Stackbase GmbH',
    contact: 'Marcus Weber',
    role: 'CTO',
    channel: 'email',
    score: 96,
    hook: 'Euer neues Developer-Tool braucht Sales-Intelligence',
    preview:
      'Hi Marcus,\n\nich habe gesehen, dass Stackbase gerade ein neues DevTool gelauncht hat — Glückwunsch! Bei der Skalierung von B2B-Sales für Developer-Tools sehen wir oft, dass klassische CRMs nicht reichen.\n\nOnvero hilft Teams wie euch, die richtigen Leads automatisch zu finden und zu qualifizieren...',
    reasoning:
      'Stackbase hat letzte Woche ein Produkt-Launch auf ProductHunt gehabt. Marcus ist als CTO der technische Entscheider. Timing ist optimal: Post-Launch brauchen sie Sales-Prozesse.',
    basedOn: 'ProductHunt Launch + LinkedIn Activity',
    status: 'Neu',
    generatedAt: 'vor 1h',
  },
  {
    id: 2,
    company: 'Nexlayer GmbH',
    contact: 'Laura Engel',
    role: 'VP Sales',
    channel: 'linkedin',
    score: 92,
    hook: 'CRM-Evaluation: Warum dynamisches Scoring den Unterschied macht',
    preview:
      'Hi Laura,\n\nich habe euren LinkedIn-Post über die CRM-Evaluation gesehen. Spannend! Die meisten Tools bewerten Leads statisch — wir machen das anders.\n\nOnvero scored Leads in Echtzeit basierend auf 40+ Signalen...',
    reasoning:
      'Laura hat öffentlich über CRM-Suche gepostet. Als VP Sales ist sie die Hauptentscheiderin. Direct Intent-Signal, hohe Relevanz.',
    basedOn: 'Market Intent Signal: CRM-Suche',
    status: 'Neu',
    generatedAt: 'vor 2h',
  },
  {
    id: 3,
    company: 'Axflow AG',
    contact: 'Tom Schreiber',
    role: 'Head of Sales',
    channel: 'email',
    score: 89,
    hook: 'Follow-up: Unsere Demo letzte Woche',
    preview:
      'Hi Tom,\n\ndanke nochmal für die Demo letzte Woche! Du hattest nach der Integration mit eurem bestehenden Pipedrive gefragt.\n\nKurzes Update: Wir haben einen nativen Pipedrive-Connector, der bidirektional synct...',
    reasoning:
      'Tom hatte eine Demo und konkrete Fragen zur Integration. Follow-up innerhalb von 5 Tagen ist ideal. Sein Hauptblocker war Pipedrive-Kompatibilität.',
    basedOn: 'Meeting-Transkript vom 4. April',
    status: 'Gesendet',
    generatedAt: 'vor 5h',
  },
  {
    id: 4,
    company: 'Greenfield AG',
    contact: 'Henrik Paulsen',
    role: 'CEO',
    channel: 'phone',
    score: 85,
    hook: 'Euer wachsendes Sales-Team braucht Struktur',
    preview:
      'Talking Points:\n• Greenfield stellt gerade 4 Sales-Leute ein → perfekter Zeitpunkt für Tool-Einführung\n• Pain Point: Onboarding neuer SDRs dauert zu lang\n• Onvero kann Ramp-up-Zeit um 40% reduzieren durch automatische Lead-Priorisierung',
    reasoning:
      '4 offene Sales-Stellen auf LinkedIn. CEO ist bei <100 MA oft direkt im Buying Process. Telefon-Outreach passt zu seiner LinkedIn-Aktivität (wenig digital, viel Networking).',
    basedOn: 'Hiring Signal + Company Size',
    status: 'Neu',
    generatedAt: 'vor 3h',
  },
  {
    id: 5,
    company: 'Dataweave',
    contact: 'Sarah Kim',
    role: 'Revenue Operations',
    channel: 'linkedin',
    score: 83,
    hook: 'Series B + DACH-Expansion: Sales-Stack aufbauen',
    preview:
      'Hi Sarah,\n\nGratulation zur Series B! DACH-Expansion ist ein großer Schritt — besonders im B2B-Bereich braucht man lokale Sales-Intelligence.\n\nOnvero ist speziell für den deutschsprachigen Markt gebaut...',
    reasoning:
      'Series B Funding = Budget vorhanden. DACH-Expansion angekündigt = brauchen lokale Tools. RevOps ist der ideale Champion für Tool-Evaluierung.',
    basedOn: 'Funding Signal + Expansion News',
    status: 'Geöffnet',
    generatedAt: 'vor 8h',
  },
  {
    id: 6,
    company: 'Motionlab',
    contact: 'Felix Drescher',
    role: 'VP Sales (neu)',
    channel: 'email',
    score: 78,
    hook: 'Willkommen bei Motionlab — dein Sales-Stack wartet',
    preview:
      'Hi Felix,\n\nwillkommen bei Motionlab! Als neuer VP Sales baust du sicher gerade den Stack auf.\n\nViele VP Sales in deiner Situation starten mit Lead-Qualifizierung als ersten Quick Win...',
    reasoning:
      'Felix ist neu als VP Sales (von Salesforce gewechselt). Neue Führungskräfte evaluieren Tools in den ersten 90 Tagen. Hohes Zeitfenster.',
    basedOn: 'Hiring Signal: Neuer VP Sales',
    status: 'Neu',
    generatedAt: 'vor 6h',
  },
];

const CHANNEL_STYLES: Record<string, { label: string; color: string; icon: string }> = {
  email: { label: 'E-Mail', color: '#818CF8', icon: ICONS.mail },
  linkedin: { label: 'LinkedIn', color: '#38BDF8', icon: ICONS.globe },
  phone: { label: 'Telefon', color: '#FBBF24', icon: ICONS.mic },
  video: { label: 'Video', color: '#A78BFA', icon: ICONS.play },
};

const STATUS_MAP: Record<string, { bg: string; color: string; border: string }> = {
  Neu: { bg: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.35)', border: 'rgba(255,255,255,0.06)' },
  Gesendet: { bg: 'rgba(99,102,241,0.06)', color: '#A5B4FC', border: 'rgba(99,102,241,0.15)' },
  Geöffnet: { bg: 'rgba(251,191,36,0.06)', color: '#FBBF24', border: 'rgba(251,191,36,0.15)' },
  Beantwortet: { bg: 'rgba(52,211,153,0.06)', color: '#34D399', border: 'rgba(52,211,153,0.15)' },
};

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function OutreachStats() {
  const stats = [
    {
      label: 'GENERIERT',
      value: '24',
      color: '#818CF8',
      gradient: 'radial-gradient(ellipse at 20% 0%, rgba(99,102,241,0.15) 0%, transparent 60%)',
    },
    {
      label: 'GESENDET',
      value: '14',
      color: '#38BDF8',
      gradient: 'radial-gradient(ellipse at 50% 0%, rgba(56,189,248,0.12) 0%, transparent 60%)',
    },
    {
      label: 'GEÖFFNET',
      value: '9',
      color: '#FBBF24',
      gradient: 'radial-gradient(ellipse at 80% 0%, rgba(251,191,36,0.10) 0%, transparent 60%)',
    },
    {
      label: 'BEANTWORTET',
      value: '4',
      color: '#34D399',
      gradient: 'radial-gradient(ellipse at 30% 0%, rgba(52,211,153,0.12) 0%, transparent 60%)',
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
      {stats.map((s, i) => (
        <div
          key={s.label}
          className="s-card"
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: '16px 18px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 2px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.03)',
            animation: 'scaleIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
            animationDelay: `${i * 0.06}s`,
          }}
        >
          <div style={{ position: 'absolute', inset: 0, background: s.gradient, pointerEvents: 'none' }} />
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 1,
              background: `linear-gradient(90deg, transparent, ${s.color}40, transparent)`,
            }}
          />
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 10, letterSpacing: '0.08em', color: C.text3, marginBottom: 8, fontWeight: 500 }}>
              {s.label}
            </div>
            <span
              style={{
                fontSize: 24,
                fontWeight: 600,
                color: s.color,
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                letterSpacing: '-0.03em',
                textShadow: `0 0 25px ${s.color}40`,
              }}
            >
              {s.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function IdeaCard({ idea, index }: { idea: OutreachIdea; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const ch = CHANNEL_STYLES[idea.channel];
  const st = STATUS_MAP[idea.status];

  return (
    <div
      className="s-bento"
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: '22px 24px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 2px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
        animation: 'fadeInUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        animationDelay: `${0.1 + index * 0.05}s`,
      }}
    >
      {/* Score-based top glow */}
      {idea.score >= 90 && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${ch.color}40, transparent)`,
          }}
        />
      )}

      <div style={{ position: 'relative' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Channel icon */}
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: `${ch.color}08`,
                border: `1px solid ${ch.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <SvgIcon d={ch.icon} size={16} color={ch.color} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: C.text1, letterSpacing: '-0.01em' }}>
                {idea.contact}
              </div>
              <div
                style={{ fontSize: 11, color: C.text3, marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}
              >
                <span>{idea.role}</span>
                <span style={{ opacity: 0.25, fontSize: 8 }}>●</span>
                <span>{idea.company}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Relevance score */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 10px',
                borderRadius: 6,
                background: idea.score >= 90 ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${idea.score >= 90 ? 'rgba(99,102,241,0.15)' : C.border}`,
              }}
            >
              <SvgIcon d={ICONS.spark} size={10} color={idea.score >= 90 ? C.accent : C.text3} />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  color: idea.score >= 90 ? C.accent : C.text2,
                }}
              >
                {idea.score}
              </span>
            </div>
            {/* Status */}
            <span
              style={{
                display: 'inline-block',
                padding: '3px 10px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 500,
                background: st.bg,
                color: st.color,
                border: `1px solid ${st.border}`,
              }}
            >
              {idea.status}
            </span>
          </div>
        </div>

        {/* Hook / Subject line */}
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 9,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.04)',
            marginBottom: 10,
            cursor: 'pointer',
          }}
          onClick={() => setExpanded(!expanded)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: '0.06em',
                color: ch.color,
                padding: '1px 6px',
                borderRadius: 3,
                background: `${ch.color}10`,
              }}
            >
              {ch.label.toUpperCase()}
            </div>
            <span style={{ fontSize: 10, color: C.text3 }}>{idea.generatedAt}</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, color: C.text1, lineHeight: 1.4 }}>{idea.hook}</div>
          <div style={{ fontSize: 10, color: C.text3, marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
            <SvgIcon d={ICONS.zap} size={9} color={C.text3} />
            Basierend auf: {idea.basedOn}
          </div>
        </div>

        {/* Expanded: full preview + reasoning */}
        {expanded && (
          <div style={{ animation: 'fadeInUp 0.25s ease both' }}>
            {/* Message preview */}
            <div
              style={{
                padding: '16px 18px',
                borderRadius: 9,
                background: `${ch.color}04`,
                border: `1px solid ${ch.color}10`,
                marginBottom: 12,
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 500, color: C.text3, letterSpacing: '0.06em', marginBottom: 8 }}>
                NACHRICHT
              </div>
              <pre
                style={{
                  fontSize: 12,
                  color: C.text2,
                  lineHeight: 1.7,
                  fontFamily: 'inherit',
                  whiteSpace: 'pre-wrap',
                  margin: 0,
                }}
              >
                {idea.preview}
              </pre>
            </div>

            {/* AI reasoning */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 9,
                background: 'rgba(99,102,241,0.03)',
                border: '1px solid rgba(99,102,241,0.06)',
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 6,
                }}
              >
                <SvgIcon d={ICONS.spark} size={11} color={C.accent} />
                <span style={{ fontSize: 10, fontWeight: 500, color: C.accent, letterSpacing: '0.06em' }}>
                  BEGRÜNDUNG
                </span>
              </div>
              <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.65 }}>{idea.reasoning}</div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8 }}>
              <PrimaryButton>{idea.channel === 'phone' ? 'Talking Points kopieren' : 'Nachricht senden'}</PrimaryButton>
              <GhostButton>Bearbeiten</GhostButton>
              <GhostButton>Neu generieren</GhostButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PAGE ────────────────────────────────────────────────────────────────────

export default function OutreachPage() {
  const [channelFilter, setChannelFilter] = useState('Alle');
  const [statusFilter, setStatusFilter] = useState('Alle');

  const filtered = IDEAS.filter((idea) => {
    if (channelFilter !== 'Alle' && idea.channel !== channelFilter) return false;
    if (statusFilter !== 'Alle' && idea.status !== statusFilter) return false;
    return true;
  });

  return (
    <>
      <Breadcrumbs
        items={[{ label: 'Onvero Sales', href: '/dashboard' }, { label: 'Prospects' }, { label: 'Outreach-Ideen' }]}
      />
      <PageHeader
        title="Outreach-Ideen"
        subtitle="Generierte Nachrichten basierend auf echten Signalen"
        actions={
          <>
            <GhostButton>Einstellungen</GhostButton>
            <GlowButton onClick={() => showToast('Batch-Generierung gestartet...', 'info')}>
              Batch generieren
            </GlowButton>
          </>
        }
      />

      <OutreachStats />

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          animation: 'fadeInUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both',
        }}
      >
        {/* Channel */}
        <div style={{ display: 'flex', gap: 4 }}>
          {['Alle', 'email', 'linkedin', 'phone'].map((f) => {
            const isActive = channelFilter === f;
            const ch = f !== 'Alle' ? CHANNEL_STYLES[f] : null;
            return (
              <button
                key={f}
                className="s-chip"
                onClick={() => setChannelFilter(f)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  border: `1px solid ${isActive ? C.borderAccent : C.border}`,
                  borderRadius: 8,
                  padding: '6px 14px',
                  fontSize: 11,
                  fontWeight: isActive ? 500 : 400,
                  background: isActive ? C.accentGhost : 'transparent',
                  color: isActive ? C.accentBright : C.text3,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {ch && <SvgIcon d={ch.icon} size={11} color={isActive ? ch.color : C.text3} />}
                {f === 'Alle' ? 'Alle Kanäle' : ch?.label}
              </button>
            );
          })}
        </div>

        <div style={{ width: 1, height: 20, background: C.border }} />

        {/* Status */}
        <div style={{ display: 'flex', gap: 4 }}>
          {['Alle', 'Neu', 'Gesendet', 'Geöffnet', 'Beantwortet'].map((f) => {
            const isActive = statusFilter === f;
            return (
              <button
                key={f}
                className="s-chip"
                onClick={() => setStatusFilter(f)}
                style={{
                  border: `1px solid ${isActive ? C.borderAccent : C.border}`,
                  borderRadius: 8,
                  padding: '6px 12px',
                  fontSize: 11,
                  fontWeight: isActive ? 500 : 400,
                  background: isActive ? C.accentGhost : 'transparent',
                  color: isActive ? C.accentBright : C.text3,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {f}
              </button>
            );
          })}
        </div>
      </div>

      {/* Ideas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map((idea, i) => (
          <IdeaCard key={idea.id} idea={idea} index={i} />
        ))}
        {filtered.length === 0 && (
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
            }}
          >
            <SvgIcon d={ICONS.mail} size={24} color={C.text3} />
            <div style={{ fontSize: 13, color: C.text3, marginTop: 12 }}>Keine Outreach-Ideen für diesen Filter</div>
          </div>
        )}
      </div>
    </>
  );
}
