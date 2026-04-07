'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lead: {
    company: string;
    score: number;
    scoreBreakdown?: {
      unternehmensfit?: number;
      kontaktqualitaet?: number;
      entscheidungsposition?: number;
      kaufsignale?: number;
      abzuege?: number;
    };
    aiSummary?: string;
    strengths: string[];
    concerns: string[];
  };
}

const CATEGORIES = [
  { key: 'unternehmensfit', label: 'Unternehmensfit', max: 35 },
  { key: 'kontaktqualitaet', label: 'Kontaktqualitaet', max: 25 },
  { key: 'entscheidungsposition', label: 'Entscheiderpos.', max: 25 },
  { key: 'kaufsignale', label: 'Kaufsignale', max: 15 },
] as const;

function getTierColor(score: number): string {
  if (score >= 70) return '#FF5C2E';
  if (score >= 45) return '#F59E0B';
  return '#6B7AFF';
}

function getTierLabel(score: number): string {
  if (score >= 70) return 'HOT';
  if (score >= 45) return 'WARM';
  return 'COLD';
}

export default function ScoreExplanation({ isOpen, onClose, lead }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => setMounted(true), 50);
      return () => clearTimeout(t);
    }
    setMounted(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const tierColor = getTierColor(lead.score);
  const tierLabel = getTierLabel(lead.score);
  const bd = lead.scoreBreakdown;
  const abzuege = bd?.abzuege ?? 0;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#111',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14,
          padding: 24,
          width: '100%',
          maxWidth: 480,
          margin: '0 16px',
          maxHeight: '90vh',
          overflowY: 'auto',
          fontFamily: 'var(--font-dm-sans)',
          color: '#fff',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
            Score-Analyse — {lead.company}
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.4)',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Big score + tier badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 24,
          }}
        >
          <span
            style={{
              fontSize: 48,
              fontWeight: 900,
              color: tierColor,
              fontFamily: 'var(--font-dm-mono)',
              lineHeight: 1,
            }}
          >
            {lead.score}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: tierColor,
              letterSpacing: '0.1em',
              background: `${tierColor}15`,
              border: `1px solid ${tierColor}30`,
              borderRadius: 20,
              padding: '3px 10px',
            }}
          >
            {tierLabel}
          </span>
        </div>

        {/* Score breakdown bars */}
        {bd && (
          <div style={{ marginBottom: 20 }}>
            {CATEGORIES.map((cat) => {
              const value = (bd[cat.key] as number) ?? 0;
              const pct = Math.min((value / cat.max) * 100, 100);
              return (
                <div
                  key={cat.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.5)',
                      width: 130,
                      flexShrink: 0,
                    }}
                  >
                    {cat.label}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 8,
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: mounted ? `${pct}%` : '0%',
                        background: tierColor,
                        borderRadius: 4,
                        transition: 'width 0.8s ease',
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontFamily: 'var(--font-dm-mono)',
                      color: 'rgba(255,255,255,0.6)',
                      width: 50,
                      textAlign: 'right',
                      flexShrink: 0,
                    }}
                  >
                    {value}/{cat.max}
                  </span>
                </div>
              );
            })}

            {abzuege !== 0 && (
              <div
                style={{
                  fontSize: 11,
                  color: 'rgba(239,68,68,0.7)',
                  marginTop: 6,
                  paddingLeft: 138,
                }}
              >
                Abzuege: -{Math.abs(abzuege)} Pkt
              </div>
            )}
          </div>
        )}

        {/* Separator */}
        <div
          style={{
            height: 1,
            background: 'rgba(255,255,255,0.06)',
            marginBottom: 16,
          }}
        />

        {/* AI Summary */}
        {lead.aiSummary && (
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.25)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase' as const,
                marginBottom: 8,
              }}
            >
              KI-Einschaetzung
            </div>
            <p
              style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.5)',
                lineHeight: 1.6,
                margin: 0,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical' as const,
                overflow: 'hidden',
              }}
            >
              {lead.aiSummary}
            </p>
          </div>
        )}

        {/* Strengths */}
        {lead.strengths.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            {lead.strengths.map((s, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 6,
                  marginBottom: 4,
                }}
              >
                <span style={{ fontSize: 11, color: '#22C55E', flexShrink: 0, marginTop: 1 }}>&#10003;</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{s}</span>
              </div>
            ))}
          </div>
        )}

        {/* Concerns */}
        {lead.concerns.length > 0 && (
          <div>
            {lead.concerns.map((c, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 6,
                  marginBottom: 4,
                }}
              >
                <span style={{ fontSize: 11, color: '#F59E0B', flexShrink: 0, marginTop: 1 }}>&#9650;</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{c}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
