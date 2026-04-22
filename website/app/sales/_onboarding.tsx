'use client';

import { useState, useEffect } from 'react';
import { C, SvgIcon, ICONS, GlowButton } from './_shared';

type Step = {
  title: string;
  description: string;
  icon: string;
  color: string;
  target?: string;
};

const STEPS: Step[] = [
  {
    title: 'Willkommen bei Onvero Sales',
    description: 'Dein KI-gestütztes Sales-Dashboard. Lass uns die wichtigsten Features durchgehen.',
    icon: ICONS.spark,
    color: '#818CF8',
  },
  {
    title: 'Leads verwalten',
    description: 'Alle deine Leads an einem Ort. Sortiere nach Score, Status oder Stadt. Nutze j/k zum Navigieren.',
    icon: ICONS.list,
    color: '#818CF8',
  },
  {
    title: 'Market Intent',
    description: 'KI erkennt automatisch Kaufsignale: Hiring, Funding, Tech-Stack-Änderungen und mehr.',
    icon: ICONS.zap,
    color: '#34D399',
  },
  {
    title: 'Meetings aufnehmen',
    description: 'Nimm Meetings auf und erhalte automatische Transkription, Zusammenfassung und Action Items.',
    icon: ICONS.mic,
    color: '#38BDF8',
  },
  {
    title: 'Drück ⌘K für alles',
    description: 'Die Command Palette ist dein schnellster Weg zu jeder Seite, jedem Lead und jeder Aktion.',
    icon: ICONS.search,
    color: '#FBBF24',
  },
];

export function OnboardingTour() {
  return null;

  const s = STEPS[step];

  return (
    <>
      {/* Backdrop with spotlight */}
      <div
        onClick={dismiss}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1200,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.3s ease both',
        }}
      />

      {/* Tour card */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 420,
          zIndex: 1201,
          background: C.surface,
          border: `1px solid ${C.borderLight}`,
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 16px 80px rgba(0,0,0,0.5), 0 0 40px rgba(99,102,241,0.1)',
          animation: 'scaleIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
        }}
      >
        {/* Top glow */}
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

        {/* Ambient orb */}
        <div
          style={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${s.color}08, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />

        <div style={{ padding: '32px 28px', position: 'relative' }}>
          {/* Icon */}
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 13,
              background: `${s.color}10`,
              border: `1px solid ${s.color}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}
          >
            <SvgIcon d={s.icon} size={20} color={s.color} />
          </div>

          {/* Step counter */}
          <div
            style={{
              display: 'flex',
              gap: 4,
              marginBottom: 14,
            }}
          >
            {STEPS.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === step ? 20 : 6,
                  height: 4,
                  borderRadius: 2,
                  background: i === step ? s.color : 'rgba(255,255,255,0.08)',
                  transition: 'all 0.3s ease',
                  boxShadow: i === step ? `0 0 6px ${s.color}40` : 'none',
                }}
              />
            ))}
          </div>

          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: C.text1,
              margin: '0 0 8px',
              letterSpacing: '-0.02em',
            }}
          >
            {s.title}
          </h2>
          <p
            style={{
              fontSize: 13,
              color: C.text2,
              margin: '0 0 24px',
              lineHeight: 1.7,
            }}
          >
            {s.description}
          </p>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={dismiss}
              style={{
                background: 'none',
                border: 'none',
                color: C.text3,
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'inherit',
                padding: '6px 0',
              }}
            >
              Tour überspringen
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              {step > 0 && (
                <button
                  onClick={() => setStep(step - 1)}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${C.border}`,
                    color: C.text2,
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontSize: 12,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Zurück
                </button>
              )}
              <GlowButton onClick={next}>{step < STEPS.length - 1 ? 'Weiter' : "Los geht's!"}</GlowButton>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
