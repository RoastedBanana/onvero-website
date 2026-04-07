'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface StepData {
  title: string;
  link: string;
  done: boolean;
}

const LS_DISMISSED = 'onvero_onboarding_dismissed';
const LS_STEP3 = 'onvero_onboarding_step3';
const LS_STEP4 = 'onvero_onboarding_step4';

export function OnboardingProgress() {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(true); // start hidden until we check
  const [fadingOut, setFadingOut] = useState(false);
  const [steps, setSteps] = useState<StepData[]>([
    { title: 'Profil einrichten', link: '/dashboard/settings', done: false },
    { title: 'Erste Leads generieren', link: '/dashboard/generate', done: false },
    { title: 'Analytics prüfen', link: '/dashboard/analytics', done: false },
    { title: 'Business AI ausprobieren', link: '/dashboard/business-ai', done: false },
  ]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Check dismissed state
    if (typeof window !== 'undefined') {
      const wasDismissed = localStorage.getItem(LS_DISMISSED) === 'true';
      setDismissed(wasDismissed);

      // Load localStorage steps
      const s3 = localStorage.getItem(LS_STEP3) === 'true';
      const s4 = localStorage.getItem(LS_STEP4) === 'true';

      // Fetch API data
      Promise.all([
        fetch('/api/profile')
          .then((r) => r.json())
          .catch(() => ({})),
        fetch('/api/leads')
          .then((r) => r.json())
          .catch(() => ({ leads: [] })),
      ]).then(([profile, leadsData]) => {
        const step1Done = !!profile?.company_name;
        const step2Done = (leadsData?.leads?.length ?? 0) > 0;

        setSteps([
          { title: 'Profil einrichten', link: '/dashboard/settings', done: step1Done },
          { title: 'Erste Leads generieren', link: '/dashboard/generate', done: step2Done },
          { title: 'Analytics prüfen', link: '/dashboard/analytics', done: s3 },
          { title: 'Business AI ausprobieren', link: '/dashboard/business-ai', done: s4 },
        ]);
        setLoaded(true);
      });
    }
  }, []);

  // Auto-hide when all steps done
  useEffect(() => {
    if (!loaded) return;
    const allDone = steps.every((s) => s.done);
    if (allDone && !dismissed) {
      const timer = setTimeout(() => {
        setFadingOut(true);
        setTimeout(() => {
          localStorage.setItem(LS_DISMISSED, 'true');
          setDismissed(true);
        }, 500);
      }, 3000);
      return () => clearTimeout(timer);
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
      // Mark localStorage steps
      if (index === 2) localStorage.setItem(LS_STEP3, 'true');
      if (index === 3) localStorage.setItem(LS_STEP4, 'true');

      setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, done: true } : s)));
      router.push(steps[index].link);
    },
    [router, steps]
  );

  if (dismissed) return null;

  const doneCount = steps.filter((s) => s.done).length;
  const progressPercent = (doneCount / steps.length) * 100;

  return (
    <>
      <style>{`
        @keyframes onb-bar-fill { from { width: 0% } }
        @keyframes onb-fade-out { to { opacity: 0; transform: translateY(-8px) } }
      `}</style>
      <div
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
          padding: '16px 20px',
          fontFamily: 'var(--font-dm-sans)',
          opacity: fadingOut ? 0 : 1,
          transform: fadingOut ? 'translateY(-8px)' : 'translateY(0)',
          transition: 'opacity 0.4s ease, transform 0.4s ease',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>Einrichtung</span>
            <span
              style={{ fontSize: 11, fontFamily: 'var(--font-dm-mono, monospace)', color: 'rgba(255,255,255,0.3)' }}
            >
              {doneCount} von {steps.length}
            </span>
          </div>
          <button
            onClick={handleDismiss}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.2)',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.2)';
            }}
            aria-label="Dismiss onboarding"
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
            height: 4,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 2,
            marginBottom: 14,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              background: 'linear-gradient(90deg, #6B7AFF, #22C55E)',
              borderRadius: 2,
              transition: 'width 0.6s ease',
              animation: loaded ? 'onb-bar-fill 0.8s ease' : 'none',
            }}
          />
        </div>

        {/* Steps */}
        <div style={{ position: 'relative' }}>
          {steps.map((step, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                height: 36,
                position: 'relative',
              }}
            >
              {/* Connecting line */}
              {i < steps.length - 1 && (
                <div
                  style={{
                    position: 'absolute',
                    left: 9,
                    top: 28,
                    width: 1,
                    height: 8,
                    background: 'rgba(255,255,255,0.04)',
                  }}
                />
              )}

              {/* Circle */}
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  background: step.done ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.04)',
                }}
              >
                {step.done ? (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M2 5.5L4 7.5L8 3"
                      stroke="#22C55E"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>{i + 1}</span>
                )}
              </div>

              {/* Title */}
              <span
                style={{
                  flex: 1,
                  fontSize: 12,
                  marginLeft: 10,
                  color: step.done ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.6)',
                  textDecoration: step.done ? 'line-through' : 'none',
                  textDecorationColor: step.done ? 'rgba(255,255,255,0.15)' : undefined,
                }}
              >
                {step.title}
              </span>

              {/* Action link — only for pending steps */}
              {!step.done && (
                <button
                  onClick={() => handleStepClick(i)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.2)',
                    fontFamily: 'inherit',
                    padding: '2px 0',
                    transition: 'color 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'rgba(255,255,255,0.2)';
                  }}
                >
                  Öffnen →
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
