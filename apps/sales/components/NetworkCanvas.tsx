'use client';

import { useEffect, useRef } from 'react';

interface NetworkCanvasProps {
  className?: string;
  /** How many curves to draw between the left and right columns. */
  curveCount?: number;
}

type Vec2 = { x: number; y: number };

type Curve = {
  start: Vec2;
  end: Vec2;
  cp1Rest: Vec2;
  cp2Rest: Vec2;
  cp1: Vec2;
  cp2: Vec2;
  cp1Vel: Vec2;
  cp2Vel: Vec2;
  pulsePhase: number;
  pulseSpeed: number;
};

function rand(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function bezierPoint(c: Curve, t: number, out: Vec2): void {
  const omt = 1 - t;
  const omt2 = omt * omt;
  const omt3 = omt2 * omt;
  const t2 = t * t;
  const t3 = t2 * t;
  out.x =
    omt3 * c.start.x +
    3 * omt2 * t * c.cp1.x +
    3 * omt * t2 * c.cp2.x +
    t3 * c.end.x;
  out.y =
    omt3 * c.start.y +
    3 * omt2 * t * c.cp1.y +
    3 * omt * t2 * c.cp2.y +
    t3 * c.end.y;
}

const STROKE_COLOR = 'rgba(79, 70, 229, 0.22)';
const DOT_COLOR = 'rgba(79, 70, 229, 0.55)';
const PULSE_CORE = 'rgba(79, 70, 229, ';
const PULSE_HALO = 'rgba(124, 58, 237, ';

export default function NetworkCanvas({
  className,
  curveCount = 50,
}: NetworkCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const isTouch =
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || navigator.maxTouchPoints > 0);

    const MOUSE_RADIUS = 120;
    const MOUSE_FORCE = 80;
    const SPRING_K = 0.08;
    const SPRING_DAMPING = 0.9;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let curves: Curve[] = [];
    let leftDots: Vec2[] = [];
    let rightDots: Vec2[] = [];

    let mouseX: number | null = null;
    let mouseY: number | null = null;

    const rebuild = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      if (!width || !height) return;
      dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const leftX = width * 0.06;
      const rightX = width * 0.94;
      const topY = height * 0.06;
      const bottomY = height * 0.94;
      const cx = width * 0.5;
      const cy = height * 0.5;

      leftDots = [];
      rightDots = [];
      curves = [];

      for (let i = 0; i < curveCount; i++) {
        const t = curveCount > 1 ? i / (curveCount - 1) : 0.5;
        const y = topY + t * (bottomY - topY);
        const left: Vec2 = { x: leftX, y };
        const right: Vec2 = { x: rightX, y };
        leftDots.push(left);
        rightDots.push(right);

        const jitter = (rand(i + 11) - 0.5) * 4;
        const cp1Rest: Vec2 = {
          x: leftX + (cx - leftX) * 0.92,
          y: cy + (y - cy) * 0.06 + jitter,
        };
        const cp2Rest: Vec2 = {
          x: rightX - (rightX - cx) * 0.92,
          y: cy + (y - cy) * 0.06 + jitter,
        };

        curves.push({
          start: left,
          end: right,
          cp1Rest: { ...cp1Rest },
          cp2Rest: { ...cp2Rest },
          cp1: { ...cp1Rest },
          cp2: { ...cp2Rest },
          cp1Vel: { x: 0, y: 0 },
          cp2Vel: { x: 0, y: 0 },
          pulsePhase: rand(i + 1),
          pulseSpeed: 1 / (2.4 + rand(i + 200) * 1.6),
        });
      }
    };

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };
    const onLeave = () => {
      mouseX = null;
      mouseY = null;
    };

    const ro = new ResizeObserver(() => rebuild());
    ro.observe(canvas);
    rebuild();

    const parent = canvas.parentElement;
    if (!isTouch && parent) {
      parent.addEventListener('mousemove', onMove);
      parent.addEventListener('mouseleave', onLeave);
    }

    const out: Vec2 = { x: 0, y: 0 };
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      for (const c of curves) {
        for (const which of ['cp1', 'cp2'] as const) {
          const cp = c[which];
          const cpVel = c[`${which}Vel` as 'cp1Vel' | 'cp2Vel'];
          const cpRest = c[`${which}Rest` as 'cp1Rest' | 'cp2Rest'];

          let restX = cpRest.x;
          let restY = cpRest.y;

          if (mouseX !== null && mouseY !== null) {
            const ddx = cp.x - mouseX;
            const ddy = cp.y - mouseY;
            const dist = Math.hypot(ddx, ddy);
            if (dist < MOUSE_RADIUS && dist > 0.001) {
              const force = (1 - dist / MOUSE_RADIUS) * MOUSE_FORCE;
              restX += (ddx / dist) * force;
              restY += (ddy / dist) * force;
            }
          }

          cpVel.x += (restX - cp.x) * SPRING_K;
          cpVel.y += (restY - cp.y) * SPRING_K;
          cpVel.x *= SPRING_DAMPING;
          cpVel.y *= SPRING_DAMPING;
          cp.x += cpVel.x;
          cp.y += cpVel.y;
        }

        c.pulsePhase += c.pulseSpeed * dt;
        if (c.pulsePhase > 1) c.pulsePhase -= 1;
      }

      ctx.clearRect(0, 0, width, height);

      ctx.lineCap = 'round';
      ctx.lineWidth = 1;
      ctx.strokeStyle = STROKE_COLOR;
      for (const c of curves) {
        ctx.beginPath();
        ctx.moveTo(c.start.x, c.start.y);
        ctx.bezierCurveTo(c.cp1.x, c.cp1.y, c.cp2.x, c.cp2.y, c.end.x, c.end.y);
        ctx.stroke();
      }

      ctx.fillStyle = DOT_COLOR;
      for (const dot of leftDots) {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
      for (const dot of rightDots) {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const c of curves) {
        const t = c.pulsePhase;
        let opacity = 1;
        if (t < 0.12) opacity = t / 0.12;
        else if (t > 0.88) opacity = (1 - t) / 0.12;
        if (opacity <= 0) continue;

        bezierPoint(c, t, out);

        const grad = ctx.createRadialGradient(out.x, out.y, 0, out.x, out.y, 14);
        grad.addColorStop(0, `${PULSE_HALO}${0.55 * opacity})`);
        grad.addColorStop(0.45, `${PULSE_HALO}${0.18 * opacity})`);
        grad.addColorStop(1, `${PULSE_HALO}0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(out.x, out.y, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `${PULSE_CORE}${0.95 * opacity})`;
        ctx.beginPath();
        ctx.arc(out.x, out.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (!isTouch && parent) {
        parent.removeEventListener('mousemove', onMove);
        parent.removeEventListener('mouseleave', onLeave);
      }
    };
  }, [curveCount]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
}
