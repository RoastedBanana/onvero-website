'use client';

import { C, SvgIcon, ICONS } from '../_shared';
import type { SmartSuggestion } from './_meeting-store';

// ─── TYPE STYLES ────────────────────────────────────────────────────────────

const TYPE_ICON: Record<string, { color: string; icon: string }> = {
  Video: { color: '#818CF8', icon: ICONS.play },
  'Vor Ort': { color: '#34D399', icon: ICONS.globe },
  Telefon: { color: '#FBBF24', icon: ICONS.mic },
};

// ─── SMART SUGGESTION CARD ──────────────────────────────────────────────────

export default function SmartSuggestionCard({
  suggestion,
  onAccept,
  onDismiss,
}: {
  suggestion: SmartSuggestion;
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const ts = TYPE_ICON[suggestion.suggestedType] ?? TYPE_ICON.Video;

  return (
    <div
      className="s-bento"
      style={{
        background: C.surface,
        border: `1px solid ${C.successBorder}`,
        borderRadius: 12,
        padding: '20px 22px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 2px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
        animation: 'fadeInUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
      }}
    >
      {/* Top accent line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${C.success}50, transparent)`,
        }}
      />

      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${C.success}08 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14, position: 'relative' }}>
        {/* Spark icon */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            background: C.successBg,
            border: `1px solid ${C.successBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <SvgIcon d={ICONS.spark} size={16} color={C.success} />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: C.success, letterSpacing: '0.08em' }}>
              POSITIVE ANTWORT ERKANNT
            </span>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: C.success,
                animation: 'pulse-live 2s ease-in-out infinite',
              }}
            />
          </div>
          <div style={{ fontSize: 14, fontWeight: 500, color: C.text1 }}>
            {suggestion.leadName}
            <span style={{ color: C.text3, fontWeight: 400 }}> · {suggestion.company}</span>
          </div>
        </div>

        {/* Dismiss */}
        <button
          onClick={() => onDismiss(suggestion.id)}
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
            (e.currentTarget as HTMLElement).style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.opacity = '0.4';
          }}
        >
          <SvgIcon d={ICONS.x} size={14} color={C.text3} />
        </button>
      </div>

      {/* Email Snippet */}
      <div
        style={{
          padding: '12px 14px',
          borderRadius: 8,
          background: 'rgba(255,255,255,0.02)',
          border: `1px solid ${C.border}`,
          marginBottom: 14,
        }}
      >
        <div style={{ fontSize: 10, color: C.text3, letterSpacing: '0.04em', marginBottom: 6 }}>E-MAIL ANTWORT</div>
        <div style={{ fontSize: 12.5, color: C.text2, lineHeight: 1.6, fontStyle: 'italic' }}>
          &ldquo;{suggestion.emailSnippet}&rdquo;
        </div>
      </div>

      {/* Suggestion Details */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 10px',
            borderRadius: 6,
            background: `${ts.color}08`,
            border: `1px solid ${ts.color}15`,
          }}
        >
          <SvgIcon d={ts.icon} size={11} color={ts.color} />
          <span style={{ fontSize: 11, fontWeight: 500, color: ts.color }}>{suggestion.suggestedType}</span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 10px',
            borderRadius: 6,
            background: 'rgba(255,255,255,0.02)',
            border: `1px solid ${C.border}`,
          }}
        >
          <SvgIcon d={ICONS.clock} size={11} color={C.text3} />
          <span style={{ fontSize: 11, color: C.text2 }}>{suggestion.suggestedDuration} min</span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 10px',
            borderRadius: 6,
            background: `${C.accent}06`,
            border: `1px solid ${C.accent}12`,
          }}
        >
          <SvgIcon d={ICONS.spark} size={11} color={C.accent} />
          <span style={{ fontSize: 11, color: C.accentBright }}>{suggestion.reason}</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => onAccept(suggestion.id)}
          className="s-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '9px 18px',
            borderRadius: 9,
            background: 'linear-gradient(135deg, #4F46E5, #6366F1)',
            border: 'none',
            color: '#fff',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit',
            boxShadow: '0 2px 12px rgba(99,102,241,0.3)',
          }}
        >
          <SvgIcon d={ICONS.check} size={13} color="#fff" />
          Meeting planen
        </button>
        <button
          onClick={() => onDismiss(suggestion.id)}
          className="s-ghost"
          style={{
            padding: '9px 16px',
            borderRadius: 9,
            background: 'transparent',
            border: `1px solid ${C.border}`,
            color: C.text3,
            fontSize: 12,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Ignorieren
        </button>
      </div>
    </div>
  );
}
