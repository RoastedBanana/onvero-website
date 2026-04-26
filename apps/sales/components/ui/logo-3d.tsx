'use client';

import { useRef, useEffect } from 'react';
import { OnveroLogo } from '@/components/ui/onvero-logo';

/**
 * Logo3D — interactive Onvero logo on a dark pill background.
 *
 * Effects (vanilla JS + CSS only, fully GPU-accelerated):
 *  1. Mouse hover  → 3D tilt up to ±15° with specular highlight
 *  2. Scroll       → continuous Y-axis rotation (1 full turn per 600 px)
 *  3. Idle float   → subtle up/down bob (6 px, 3 s cycle) via CSS keyframe
 *  4. Entry        → scale 0.85 → 1 + fade in over 600 ms
 */
export function Logo3D() {
  const cardRef = useRef<HTMLDivElement>(null);
  const specRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    const spec = specRef.current;
    if (!card) return;

    let tiltX = 0, tiltY = 0;        // current (lerped) tilt
    let targetX = 0, targetY = 0;    // mouse target
    let scrollRot = 0;                // degrees from scroll
    let raf = 0;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    // ── rAF render loop — lerp tilt toward target, combine with scroll rotation ──
    const loop = () => {
      tiltX = lerp(tiltX, targetX, 0.1);
      tiltY = lerp(tiltY, targetY, 0.1);
      // perspective() inline keeps it self-contained (no parent context needed)
      card.style.transform =
        `perspective(700px) rotateX(${tiltX}deg) rotateY(${tiltY + scrollRot}deg)`;
      raf = requestAnimationFrame(loop);
    };

    // ── Mouse tilt ──
    const onMove = (e: MouseEvent) => {
      const r = card.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width  - 0.5; // −0.5 … 0.5
      const ny = (e.clientY - r.top)  / r.height - 0.5;
      targetX = -ny * 15;
      targetY =  nx * 15;
      // Specular: highlight appears opposite to tilt (as if light is fixed in space)
      if (spec) {
        spec.style.opacity = '1';
        spec.style.backgroundImage = `radial-gradient(circle at ${(nx + 0.5) * 100}% ${(ny + 0.5) * 100}%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 45%, transparent 70%)`;
      }
    };

    const onLeave = () => {
      targetX = 0;
      targetY = 0;
      if (spec) spec.style.opacity = '0';
    };

    // ── Scroll rotation ──
    const onScroll = () => {
      scrollRot = (window.scrollY / 600) * 360;
    };

    card.addEventListener('mousemove', onMove);
    card.addEventListener('mouseleave', onLeave);
    window.addEventListener('scroll', onScroll, { passive: true });
    raf = requestAnimationFrame(loop);

    return () => {
      card.removeEventListener('mousemove', onMove);
      card.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <style>{`
        @keyframes logo3d-entry {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1);    }
        }
        @keyframes logo3d-float {
          0%, 100% { transform: translateY(0px);  }
          50%       { transform: translateY(-6px); }
        }
      `}</style>

      {/*
        Three wrapper layers so animations never fight each other:
          1. entry  — opacity + scale (runs once, 600 ms)
          2. float  — translateY  (continuous, starts after entry)
          3. card   — perspective + rotateX/Y  (driven by JS every rAF)
      */}

      {/* 1. Entry */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          animation: 'logo3d-entry 600ms ease-out forwards',
          opacity: 0,
        }}
      >
        {/* 2. Float */}
        <div style={{ animation: 'logo3d-float 3s ease-in-out infinite 600ms' }}>

          {/* 3. 3D card — JS drives transform */}
          <div
            ref={cardRef}
            style={{ willChange: 'transform', cursor: 'grab', position: 'relative' }}
          >
            {/* Pill background */}
            <div
              style={{
                position: 'relative',
                backgroundColor: '#161616',
                borderRadius: '9999px',
                padding: '20px 52px',
                border: '1px solid rgba(255,255,255,0.09)',
                boxShadow:
                  '0 2px 0 rgba(255,255,255,0.06) inset, 0 16px 60px rgba(0,0,0,0.55)',
                overflow: 'hidden',
              }}
            >
              {/* Specular highlight overlay */}
              <div
                ref={specRef}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0,
                  pointerEvents: 'none',
                  transition: 'opacity 0.25s ease',
                  borderRadius: 'inherit',
                }}
              />

              {/* Logo — white on dark */}
              <div style={{ position: 'relative', zIndex: 1 }}>
                <OnveroLogo className="block w-52 h-auto" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
