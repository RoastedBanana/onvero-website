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
  opacityPhase: number;
  opacitySpeed: number;
};

function rand(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

const STROKE_BASE_ALPHA = 0.24;
const STROKE_AMP_ALPHA = 0.18;
const DOT_COLOR = 'rgba(79, 70, 229, 0.55)';

export default function NetworkCanvas({
  className,
  curveCount = 56,
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
      const cy = height * 0.5;

      // Control points sit roughly 18% of width inside from each edge.
      // That places them entirely outside the centre region, so the cursor
      // can only deflect a curve when it's near the left or right column.
      const cp1X = leftX + width * 0.18;
      const cp2X = rightX - width * 0.18;

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

        // Tiny vertical jitter on the cps so the throat reads organic
        // without spreading vertically.
        const jitter1 = (rand(i + 11) - 0.5) * 5;
        const jitter2 = (rand(i + 31) - 0.5) * 5;

        // The throat collapses to a point: cp y stays at the canvas
        // centre regardless of where the curve enters/exits.
        const cp1Rest: Vec2 = { x: cp1X, y: cy + jitter1 };
        const cp2Rest: Vec2 = { x: cp2X, y: cy + jitter2 };

        curves.push({
          start: left,
          end: right,
          cp1Rest: { ...cp1Rest },
          cp2Rest: { ...cp2Rest },
          cp1: { ...cp1Rest },
          cp2: { ...cp2Rest },
          cp1Vel: { x: 0, y: 0 },
          cp2Vel: { x: 0, y: 0 },
          opacityPhase: rand(i + 7) * Math.PI * 2,
          opacitySpeed: 0.35 + rand(i + 71) * 0.55,
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

    let raf = 0;
    const startTime = performance.now();

    const tick = (now: number) => {
      const time = (now - startTime) / 1000;

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
      }

      ctx.clearRect(0, 0, width, height);

      ctx.lineCap = 'round';
      ctx.lineWidth = 1;
      for (const c of curves) {
        const wave = Math.sin(time * c.opacitySpeed + c.opacityPhase);
        const alpha = Math.max(
          0.03,
          STROKE_BASE_ALPHA + wave * STROKE_AMP_ALPHA,
        );
        ctx.strokeStyle = `rgba(79, 70, 229, ${alpha.toFixed(3)})`;
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
