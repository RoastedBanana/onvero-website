'use client';

import { useEffect, useRef } from 'react';

interface ConfettiProps {
  active: boolean;
}

const COLORS = [
  '#ffffff',
  '#e0e0e0',
  '#4fc3f7',
  '#81d4fa',
  '#ffd54f',
  '#fff176',
  '#a5d6a7',
  '#ce93d8',
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  w: number;
  h: number;
  shape: 'rect' | 'circle';
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function Confetti({ active }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    // Spawn cannons: center + slight left/right spread
    const origins = [
      { x: W * 0.3, y: H * 0.45 },
      { x: W * 0.5, y: H * 0.45 },
      { x: W * 0.7, y: H * 0.45 },
    ];

    const particles: Particle[] = [];
    for (const origin of origins) {
      for (let i = 0; i < 90; i++) {
        const angle = rand(-Math.PI * 0.9, -Math.PI * 0.1); // upward arc
        const speed = rand(6, 18);
        particles.push({
          x: origin.x + rand(-20, 20),
          y: origin.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          rotation: rand(0, Math.PI * 2),
          rotationSpeed: rand(-0.25, 0.25),
          w: rand(5, 11),
          h: rand(3, 7),
          shape: Math.random() < 0.2 ? 'circle' : 'rect',
        });
      }
    }

    const DURATION = 4200;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / DURATION);
      ctx.clearRect(0, 0, W, H);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // gravity
        p.vx *= 0.995; // air resistance
        p.rotation += p.rotationSpeed;

        // Fade out in the last 40 %
        const alpha = t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4;

        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }

        ctx.restore();
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, W, H);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
}
