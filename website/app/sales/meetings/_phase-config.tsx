'use client';

import { C, SvgIcon, ICONS, GhostButton } from '../_shared';
import { PHASE_TEMPLATES, totalPhaseDuration, nextPhaseId } from './_meeting-store';
import type { MeetingPhase } from './_meeting-store';

// ─── PHASE CONFIGURATOR ─────────────────────────────────────────────────────

export default function PhaseConfig({
  phases,
  onChange,
}: {
  phases: MeetingPhase[];
  onChange: (phases: MeetingPhase[]) => void;
}) {
  const total = totalPhaseDuration(phases);

  const updatePhase = (id: string, patch: Partial<MeetingPhase>) => {
    onChange(phases.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const removePhase = (id: string) => {
    onChange(phases.filter((p) => p.id !== id));
  };

  const addPhase = () => {
    onChange([...phases, { id: nextPhaseId(), name: 'Neue Phase', duration: 5 }]);
  };

  const applyTemplate = (key: string) => {
    const template = PHASE_TEMPLATES[key];
    if (template) {
      onChange(template.map((p) => ({ ...p, id: nextPhaseId() })));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label style={{ fontSize: 11, fontWeight: 500, color: C.text3, letterSpacing: '0.06em' }}>
          GESPRÄCHSPHASEN
        </label>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            color: C.accent,
          }}
        >
          {total} min gesamt
        </div>
      </div>

      {/* Templates */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {Object.keys(PHASE_TEMPLATES).map((key) => (
          <button
            key={key}
            onClick={() => applyTemplate(key)}
            className="s-chip"
            style={{
              padding: '5px 12px',
              borderRadius: 7,
              background: 'rgba(255,255,255,0.02)',
              border: `1px solid ${C.border}`,
              color: C.text2,
              fontSize: 11,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {key}
          </button>
        ))}
      </div>

      {/* Phase List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {phases.map((phase, i) => {
          const pct = total > 0 ? (phase.duration / total) * 100 : 0;
          return (
            <div
              key={phase.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                borderRadius: 9,
                background: C.surface,
                border: `1px solid ${C.border}`,
                animation: 'fadeInUp 0.25s cubic-bezier(0.22, 1, 0.36, 1) both',
                animationDelay: `${i * 0.04}s`,
              }}
            >
              {/* Number */}
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: C.accentGhost,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 600,
                  color: C.accent,
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </div>

              {/* Name Input */}
              <input
                value={phase.name}
                onChange={(e) => updatePhase(phase.id, { name: e.target.value })}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: C.text1,
                  fontSize: 13,
                  fontFamily: 'inherit',
                  fontWeight: 500,
                  minWidth: 0,
                }}
              />

              {/* Duration Bar (visual) */}
              <div
                style={{
                  width: 60,
                  height: 4,
                  borderRadius: 2,
                  background: 'rgba(255,255,255,0.04)',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    borderRadius: 2,
                    background: `linear-gradient(90deg, ${C.accentDim}, ${C.accent})`,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>

              {/* Duration Input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={phase.duration}
                  onChange={(e) => updatePhase(phase.id, { duration: Math.max(1, parseInt(e.target.value) || 1) })}
                  style={{
                    width: 36,
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${C.border}`,
                    borderRadius: 5,
                    padding: '3px 6px',
                    color: C.text1,
                    fontSize: 12,
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    textAlign: 'center',
                    outline: 'none',
                  }}
                />
                <span style={{ fontSize: 11, color: C.text3 }}>min</span>
              </div>

              {/* Remove */}
              {phases.length > 1 && (
                <button
                  onClick={() => removePhase(phase.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex',
                    opacity: 0.4,
                    transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLElement).style.opacity = '1';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.opacity = '0.4';
                  }}
                >
                  <SvgIcon d={ICONS.x} size={12} color={C.danger} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Phase */}
      <button
        onClick={addPhase}
        className="s-ghost"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          padding: '9px 14px',
          borderRadius: 9,
          background: 'transparent',
          border: `1px dashed ${C.border}`,
          color: C.text3,
          fontSize: 12,
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'all 0.15s ease',
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 300 }}>+</span>
        Phase hinzufügen
      </button>
    </div>
  );
}
