'use client';

import {
  C,
  SvgIcon,
  ICONS,
  StatusBadge,
  ScoreBar,
  ProgressRing,
  Sparkline,
  GlowButton,
  GhostButton,
  showToast,
} from './_shared';

// ─── LEAD DETAIL SLIDE-OVER ──────────────────────────────────────────────────

type LeadDetail = {
  name: string;
  company: string;
  city: string;
  score: number;
  status: string;
  industry: string;
  employees: string;
  email?: string;
  phone?: string;
  website?: string;
  aiSummary?: string;
  scoreHistory?: number[];
  timeline?: { action: string; time: string; color: string }[];
  emailDraft?: string;
};

export function SlideOver({ lead, onClose }: { lead: LeadDetail | null; onClose: () => void }) {
  if (!lead) return null;

  const timeline = lead.timeline ?? [
    { action: 'Lead erstellt via Google Maps', time: 'vor 5 Tagen', color: '#818CF8' },
    { action: 'KI-Score berechnet: ' + lead.score, time: 'vor 5 Tagen', color: '#38BDF8' },
    { action: 'Status → ' + lead.status, time: 'vor 3 Tagen', color: '#34D399' },
    { action: 'Outreach-E-Mail generiert', time: 'vor 2 Tagen', color: '#A78BFA' },
    { action: 'Letzte Interaktion', time: 'vor 2h', color: '#FBBF24' },
  ];

  const aiSummary =
    lead.aiSummary ??
    `${lead.company} ist ein ${lead.industry}-Unternehmen aus ${lead.city} mit ${lead.employees} Mitarbeitern. Der KI-Score von ${lead.score} deutet auf hohes Potenzial hin. Empfehlung: Direkter Outreach über LinkedIn, da ${lead.name} aktiv auf der Plattform ist.`;

  const scoreHistory = lead.scoreHistory ?? [65, 68, 72, 75, 78, 82, lead.score];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 1100,
          animation: 'fadeIn 0.2s ease both',
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 480,
          background: C.bg,
          borderLeft: `1px solid ${C.border}`,
          zIndex: 1101,
          overflowY: 'auto',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.4)',
          animation: 'slideInRight 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            background: C.bg,
            zIndex: 1,
            backdropFilter: 'blur(12px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 11,
                background: 'linear-gradient(135deg, #6366F1, #818CF8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 15,
                fontWeight: 600,
                color: '#fff',
                boxShadow: '0 4px 16px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}
            >
              {lead.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: C.text1, letterSpacing: '-0.02em' }}>{lead.name}</div>
              <div style={{ fontSize: 12, color: C.text3, marginTop: 2 }}>
                {lead.company} · {lead.city}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${C.border}`,
              borderRadius: 7,
              width: 32,
              height: 32,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SvgIcon d={ICONS.x} size={14} color={C.text3} />
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Score + Status Row */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div
              style={{
                flex: 1,
                padding: '16px',
                borderRadius: 10,
                background: C.surface,
                border: `1px solid ${C.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <ProgressRing value={lead.score} size={48} strokeWidth={3.5} color={C.accent} label={`${lead.score}`} />
              <div>
                <div style={{ fontSize: 10, color: C.text3, letterSpacing: '0.06em', fontWeight: 500 }}>KI-SCORE</div>
                <Sparkline data={scoreHistory} width={80} height={20} color={C.accent} />
              </div>
            </div>
            <div
              style={{
                padding: '16px',
                borderRadius: 10,
                background: C.surface,
                border: `1px solid ${C.border}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <StatusBadge status={lead.status} />
            </div>
          </div>

          {/* Details Grid */}
          <div
            style={{
              padding: '16px',
              borderRadius: 10,
              background: C.surface,
              border: `1px solid ${C.border}`,
            }}
          >
            <div style={{ fontSize: 10, color: C.text3, letterSpacing: '0.06em', fontWeight: 500, marginBottom: 12 }}>
              DETAILS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12 }}>
              {[
                { label: 'Branche', value: lead.industry },
                { label: 'Mitarbeiter', value: lead.employees },
                { label: 'Stadt', value: lead.city },
                {
                  label: 'E-Mail',
                  value:
                    lead.email ??
                    `${lead.name.toLowerCase().replace(' ', '.')}@${lead.company.toLowerCase().replace(/\s|gmbh|ag/gi, '')}.de`,
                },
              ].map((d) => (
                <div key={d.label}>
                  <div style={{ fontSize: 10, color: C.text3, marginBottom: 3 }}>{d.label}</div>
                  <div style={{ color: C.text2 }}>{d.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Summary */}
          <div
            style={{
              padding: '16px',
              borderRadius: 10,
              background: 'rgba(99,102,241,0.04)',
              border: '1px solid rgba(99,102,241,0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <SvgIcon d={ICONS.spark} size={12} color={C.accent} />
              <span style={{ fontSize: 10, color: C.accent, letterSpacing: '0.06em', fontWeight: 600 }}>
                KI-ANALYSE
              </span>
            </div>
            <div style={{ fontSize: 12.5, color: C.text2, lineHeight: 1.7 }}>{aiSummary}</div>
          </div>

          {/* Timeline */}
          <div
            style={{
              padding: '16px',
              borderRadius: 10,
              background: C.surface,
              border: `1px solid ${C.border}`,
            }}
          >
            <div style={{ fontSize: 10, color: C.text3, letterSpacing: '0.06em', fontWeight: 500, marginBottom: 12 }}>
              TIMELINE
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: 5,
                  top: 8,
                  bottom: 8,
                  width: 1,
                  background: `linear-gradient(180deg, ${C.border}, transparent)`,
                }}
              />
              {timeline.map((t, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 14,
                    padding: '8px 0',
                    paddingLeft: 0,
                  }}
                >
                  <div
                    style={{
                      width: 11,
                      height: 11,
                      borderRadius: '50%',
                      background: C.bg,
                      border: `2px solid ${t.color}`,
                      boxShadow: `0 0 6px ${t.color}40`,
                      flexShrink: 0,
                      marginTop: 2,
                      zIndex: 1,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: C.text1, lineHeight: 1.4 }}>{t.action}</div>
                    <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>{t.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            <GlowButton
              onClick={() => {
                showToast('Outreach wird generiert...', 'info');
              }}
            >
              Outreach generieren
            </GlowButton>
            <GhostButton
              onClick={() => {
                showToast('Meeting geplant', 'success');
              }}
            >
              Meeting planen
            </GhostButton>
            <GhostButton
              onClick={() => {
                showToast('E-Mail-Draft erstellt', 'info');
              }}
            >
              E-Mail Draft
            </GhostButton>
          </div>
        </div>
      </div>
    </>
  );
}
