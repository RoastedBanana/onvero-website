'use client';

import { useEffect, useRef } from 'react';

interface NetworkCanvasProps {
  className?: string;
  /** How many curves to draw between the left and right columns. */
  curveCount?: number;
}

type Vec2 = { x: number; y: number };

type DriftParams = {
  ampX: number;
  freqX: number;
  phaseX: number;
  ampY: number;
  freqY: number;
  phaseY: number;
};

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
  /** 0..1 — alpha multiplier on the right half of the stroke. */
  rightAlpha: number;
  drift1: DriftParams;
  drift2: DriftParams;
};

function rand(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function makeDrift(seed: number): DriftParams {
  return {
    ampX: 0.7 + rand(seed) * 1.6,
    freqX: 0.25 + rand(seed + 1) * 0.45,
    phaseX: rand(seed + 2) * Math.PI * 2,
    ampY: 0.7 + rand(seed + 3) * 1.6,
    freqY: 0.25 + rand(seed + 4) * 0.45,
    phaseY: rand(seed + 5) * Math.PI * 2,
  };
}

const STROKE_BASE_ALPHA = 0.28;
const STROKE_AMP_ALPHA = 0.18;
const THROAT_ALPHA_FACTOR = 0.16;
const DOT_BASE_ALPHA = 0.55;

export default function NetworkCanvas({
  className,
  curveCount = 54,
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

      const leftX = width * 0.07;
      const rightX = width * 0.93;
      const topY = height * 0.06;
      const bottomY = height * 0.94;
      const cy = height * 0.5;

      // Control points anchored close to the endpoint columns. The cps
      // sit ~8% of width inside from each edge so the cursor can only
      // reach them when it's near the left or right column — never
      // from the centre throat.
      const cp1X = leftX + width * 0.08;
      const cp2X = rightX - width * 0.08;

      // Endpoints first — left and right columns get random x/y jitter
      // so they don't read as ruler-straight verticals.
      leftDots = [];
      rightDots = [];
      for (let i = 0; i < curveCount; i++) {
        const t = curveCount > 1 ? i / (curveCount - 1) : 0.5;
        const y = topY + t * (bottomY - topY);
        const jitterLeftX = (rand(i + 100) - 0.5) * 22;
        const jitterRightX = (rand(i + 200) - 0.5) * 22;
        const jitterLeftY = (rand(i + 300) - 0.5) * 6;
        const jitterRightY = (rand(i + 400) - 0.5) * 6;
        leftDots.push({ x: leftX + jitterLeftX, y: y + jitterLeftY });
        rightDots.push({ x: rightX + jitterRightX, y: y + jitterRightY });
      }

      // Cross-mapping: each left endpoint connects to a right endpoint
      // that is shifted by ±~15% of count. The right half of every
      // curve emerges at a different y than where its left half started,
      // so deforming a left strand causes the matched strand on the
      // right to deflect somewhere else along the column.
      const swing = Math.max(2, Math.floor(curveCount * 0.18));
      const mapping = new Array<number>(curveCount);
      for (let i = 0; i < curveCount; i++) {
        const offset = Math.round((rand(i + 999) - 0.5) * 2 * swing);
        mapping[i] = ((i + offset) % curveCount + curveCount) % curveCount;
      }

      curves = [];
      for (let i = 0; i < curveCount; i++) {
        const start = leftDots[i];
        const end = rightDots[mapping[i]];

        // Convex bow: both control points sit at the canvas centre so
        // each curve smoothly arcs toward cy in the middle without the
        // hard concave pinch that the knot formula produced. Curves
        // near cy stay almost straight; curves further out bow more.
        const cp1Rest: Vec2 = { x: cp1X, y: cy };
        const cp2Rest: Vec2 = { x: cp2X, y: cy };

        // Distribution of how visible each curve is on the right side.
        // 35% full, 35% partial, 30% near-invisible — the right column
        // emerges visibly thinner than the left column.
        const r = rand(i + 333);
        let rightAlpha: number;
        if (r < 0.35) rightAlpha = 1.0;
        else if (r < 0.7) rightAlpha = 0.22 + rand(i + 444) * 0.32;
        else rightAlpha = 0.03 + rand(i + 555) * 0.12;

        curves.push({
          start,
          end,
          cp1Rest: { ...cp1Rest },
          cp2Rest: { ...cp2Rest },
          cp1: { ...cp1Rest },
          cp2: { ...cp2Rest },
          cp1Vel: { x: 0, y: 0 },
          cp2Vel: { x: 0, y: 0 },
          opacityPhase: rand(i + 7) * Math.PI * 2,
          opacitySpeed: 0.32 + rand(i + 71) * 0.55,
          rightAlpha,
          drift1: makeDrift(i * 17 + 800),
          drift2: makeDrift(i * 17 + 900),
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
        // cp1
        {
          const cp = c.cp1;
          const cpVel = c.cp1Vel;
          const d = c.drift1;
          let restX = c.cp1Rest.x + Math.sin(time * d.freqX + d.phaseX) * d.ampX;
          let restY = c.cp1Rest.y + Math.cos(time * d.freqY + d.phaseY) * d.ampY;

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

        // cp2
        {
          const cp = c.cp2;
          const cpVel = c.cp2Vel;
          const d = c.drift2;
          let restX = c.cp2Rest.x + Math.sin(time * d.freqX + d.phaseX) * d.ampX;
          let restY = c.cp2Rest.y + Math.cos(time * d.freqY + d.phaseY) * d.ampY;

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
        const aLeft = alpha.toFixed(3);
        const aThroat = (alpha * THROAT_ALPHA_FACTOR).toFixed(3);
        const aRight = (alpha * c.rightAlpha).toFixed(3);

        const grad = ctx.createLinearGradient(c.start.x, 0, c.end.x, 0);
        grad.addColorStop(0, `rgba(79, 70, 229, ${aLeft})`);
        grad.addColorStop(0.5, `rgba(79, 70, 229, ${aThroat})`);
        grad.addColorStop(1, `rgba(79, 70, 229, ${aRight})`);
        ctx.strokeStyle = grad;

        ctx.beginPath();
        ctx.moveTo(c.start.x, c.start.y);
        ctx.bezierCurveTo(c.cp1.x, c.cp1.y, c.cp2.x, c.cp2.y, c.end.x, c.end.y);
        ctx.stroke();
      }

      for (let i = 0; i < curves.length; i++) {
        const c = curves[i];
        ctx.fillStyle = `rgba(79, 70, 229, ${DOT_BASE_ALPHA})`;
        ctx.beginPath();
        ctx.arc(leftDots[i].x, leftDots[i].y, 2.4, 0, Math.PI * 2);
        ctx.fill();

        const rightDotAlpha = (DOT_BASE_ALPHA * c.rightAlpha).toFixed(3);
        ctx.fillStyle = `rgba(79, 70, 229, ${rightDotAlpha})`;
        ctx.beginPath();
        ctx.arc(rightDots[i].x, rightDots[i].y, 2.4, 0, Math.PI * 2);
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
