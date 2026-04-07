'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface StepData {
  title: string;
  description: string;
  link: string;
  done: boolean;
  accent: string;
}

const LS_DISMISSED = 'onvero_onboarding_dismissed';
const LS_STEP3 = 'onvero_onboarding_step3';
const LS_STEP4 = 'onvero_onboarding_step4';

export function OnboardingProgress() {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);
  const [steps, setSteps] = useState<StepData[]>([
    {
      title: 'Profil einrichten',
      description: 'Beschreibe dein Unternehmen und deine Zielkunden in den Einstellungen',
      link: '/dashboard/settings',
      done: false,
      accent: '#6B7AFF',
    },
    {
      title: 'Erste Kampagne starten',
      description: 'Generiere Kontakte mit der KI-gestützten Suche',
      link: '/dashboard/generate',
      done: false,
      accent: '#F59E0B',
    },
    {
      title: 'Analytics erkunden',
      description: 'Prüfe Kennzahlen und Performance deines BusinessOS',
      link: '/dashboard/analytics',
      done: false,
      accent: '#22C55E',
    },
    {
      title: 'KI-Assistent testen',
      description: 'Stelle eine Frage an deine Business AI',
      link: '/dashboard/business-ai',
      done: false,
      accent: '#a78bfa',
    },
  ]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(LS_DISMISSED) === 'true') {
      setDismissed(true);
      return;
    }
    setDismissed(false);

    const s3 = localStorage.getItem(LS_STEP3) === 'true';
    const s4 = localStorage.getItem(LS_STEP4) === 'true';

    Promise.all([
      fetch('/api/profile')
        .then((r) => r.json())
        .catch(() => ({})),
      fetch('/api/leads')
        .then((r) => r.json())
        .catch(() => ({ leads: [] })),
    ]).then(([profile, leadsData]) => {
      const profileDone = !!profile?.profile?.company_name;
      const leadsDone = (leadsData?.leads?.length ?? 0) > 0;
      setSteps((prev) =>
        prev.map((s, i) => {
          if (i === 0) return { ...s, done: profileDone };
          if (i === 1) return { ...s, done: leadsDone };
          if (i === 2) return { ...s, done: s3 };
          if (i === 3) return { ...s, done: s4 };
          return s;
        })
      );
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (steps.every((s) => s.done) && !dismissed) {
      const t = setTimeout(() => {
        setFadingOut(true);
        setTimeout(() => {
          localStorage.setItem(LS_DISMISSED, 'true');
          setDismissed(true);
        }, 500);
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [steps, loaded, dismissed]);

  const handleDismiss = useCallback(() => {
    setFadingOut(true);
    setTimeout(() => {
      localStorage.setItem(LS_DISMISSED, 'true');
      setDismissed(true);
    }, 300);
  }, []);

  const handleStepClick = useCallback(
    (index: number) => {
      if (index === 2) localStorage.setItem(LS_STEP3, 'true');
      if (index === 3) localStorage.setItem(LS_STEP4, 'true');
      setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, done: true } : s)));
      router.push(steps[index].link);
    },
    [router, steps]
  );

  if (dismissed) return null;

  const doneCount = steps.filter((s) => s.done).length;
  const pct = (doneCount / steps.length) * 100;

  return (
    <>
      <style>{`@keyframes onb-fill{from{width:0%}}@keyframes onb-fade{to{opacity:0;transform:translateY(-8px)}}`}</style>
      <div
        style={{
          background: '#111',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 14,
          padding: '20px 24px',
          fontFamily: 'var(--font-dm-sans)',
          opacity: fadingOut ? 0 : 1,
          transform: fadingOut ? 'translateY(-8px)' : 'none',
          transition: 'opacity 0.4s, transform 0.4s',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 2 }}>Willkommen bei Onvero</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
              {doneCount === steps.length
                ? 'Alles eingerichtet'
                : `${doneCount} von ${steps.length} Schritten erledigt`}
            </div>
          </div>
          <button
            onClick={handleDismiss}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              color: 'rgba(255,255,255,0.15)',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.15)')}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        <div
          style={{
            height: 3,
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 2,
            marginBottom: 18,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              background: 'linear-gradient(90deg, #6B7AFF, #22C55E)',
              borderRadius: 2,
              transition: 'width 0.6s ease',
              animation: loaded ? 'onb-fill 0.8s ease' : 'none',
            }}
          />
        </div>

        {/* Steps */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
          {steps.map((step, i) => (
            <div
              key={i}
              onClick={() => !step.done && handleStepClick(i)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 10,
                border: `1px solid ${step.done ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.05)'}`,
                background: step.done ? 'rgba(34,197,94,0.03)' : 'rgba(255,255,255,0.02)',
                cursor: step.done ? 'default' : 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!step.done) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.borderColor = `${step.accent}25`;
                }
              }}
              onMouseLeave={(e) => {
                if (!step.done) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                }
              }}
            >
              {/* Circle */}
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  flexShrink: 0,
                  marginTop: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: step.done ? 'rgba(34,197,94,0.15)' : `${step.accent}12`,
                  border: `1px solid ${step.done ? 'rgba(34,197,94,0.25)' : `${step.accent}20`}`,
                }}
              >
                {step.done ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2.5 6.5L4.5 8.5L9.5 3.5"
                      stroke="#22C55E"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <span
                    style={{ fontSize: 10, fontWeight: 700, color: step.accent, fontFamily: 'var(--font-dm-mono)' }}
                  >
                    {i + 1}
                  </span>
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: step.done ? 'rgba(255,255,255,0.35)' : '#fff',
                    marginBottom: 2,
                    textDecoration: step.done ? 'line-through' : 'none',
                    textDecorationColor: 'rgba(255,255,255,0.15)',
                  }}
                >
                  {step.title}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: step.done ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.35)',
                    lineHeight: 1.4,
                  }}
                >
                  {step.done ? 'Erledigt' : step.description}
                </div>
              </div>

              {/* Arrow for pending */}
              {!step.done && (
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)', alignSelf: 'center', flexShrink: 0 }}>
                  →
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
