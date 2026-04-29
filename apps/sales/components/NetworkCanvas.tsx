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
  throat: Vec2;
  /** Left-half cubic: start → cpL1 → cpL2 → throat. */
  cpL1Rest: Vec2;
  cpL1: Vec2;
  cpL1Vel: Vec2;
  cpL2: Vec2;
  /** Right-half cubic: throat → cpR1 → cpR2 → end. */
  cpR1: Vec2;
  cpR2Rest: Vec2;
  cpR2: Vec2;
  cpR2Vel: Vec2;
  opacityPhase: number;
  opacitySpeed: number;
  /** 0..1 — alpha multiplier on the right half of the stroke. */
  rightAlpha: number;
  driftL: DriftParams;
  driftR: DriftParams;
};

function rand(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function makeDrift(seed: number): DriftParams {
  return {
    ampX: 0.6 + rand(seed) * 1.4,
    freqX: 0.25 + rand(seed + 1) * 0.45,
    phaseX: rand(seed + 2) * Math.PI * 2,
    ampY: 0.6 + rand(seed + 3) * 1.4,
    freqY: 0.25 + rand(seed + 4) * 0.45,
    phaseY: rand(seed + 5) * Math.PI * 2,
  };
}

const STROKE_BASE_ALPHA = 0.28;
const STROKE_AMP_ALPHA = 0.18;
const THROAT_ALPHA_FACTOR = 0.4;
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
      const cx = width * 0.5;
      const cy = height * 0.5;

      // Endpoint-side cps (mouse-interactive) sit ~8% inside each edge.
      // Throat-side cps sit ~8% before/after the centre — close enough
      // that the joint reads as a single point, far enough that the bow
      // approaching the throat stays a smooth convex arc instead of
      // kinking.
      const cpL1X = leftX + width * 0.08;
      const cpL2X = cx - width * 0.08;
      const cpR1X = cx + width * 0.08;
      const cpR2X = rightX - width * 0.08;

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
      // shifted by ±~18 % of count, so the right half emerges at a
      // different y than the left started — "auf der Rückseite eine
      // andere Linie".
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
        const throat: Vec2 = { x: cx, y: cy };

        // cpL1 sits at the start's y → curve leaves the left endpoint
        // tangent-horizontal. cpL2 sits at cy → curve arrives at the
        // throat tangent-horizontal. Same logic mirrored on the right.
        const cpL1Rest: Vec2 = { x: cpL1X, y: start.y };
        const cpL2: Vec2 = { x: cpL2X, y: cy };
        const cpR1: Vec2 = { x: cpR1X, y: cy };
        const cpR2Rest: Vec2 = { x: cpR2X, y: end.y };

        // 35 % full / 35 % partial / 30 % near-invisible — the right
        // column emerges visibly thinner than the left column.
        const r = rand(i + 333);
        let rightAlpha: number;
        if (r < 0.35) rightAlpha = 1.0;
        else if (r < 0.7) rightAlpha = 0.22 + rand(i + 444) * 0.32;
        else rightAlpha = 0.03 + rand(i + 555) * 0.12;

        curves.push({
          start,
          end,
          throat,
          cpL1Rest: { ...cpL1Rest },
          cpL1: { ...cpL1Rest },
          cpL1Vel: { x: 0, y: 0 },
          cpL2,
          cpR1,
          cpR2Rest: { ...cpR2Rest },
          cpR2: { ...cpR2Rest },
          cpR2Vel: { x: 0, y: 0 },
          opacityPhase: rand(i + 7) * Math.PI * 2,
          opacitySpeed: 0.32 + rand(i + 71) * 0.55,
          rightAlpha,
          driftL: makeDrift(i * 17 + 800),
          driftR: makeDrift(i * 17 + 900),
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

    const updateCp = (
      cp: Vec2,
      cpVel: Vec2,
      cpRest: Vec2,
      drift: DriftParams,
      time: number,
    ) => {
      let restX = cpRest.x + Math.sin(time * drift.freqX + drift.phaseX) * drift.ampX;
      let restY = cpRest.y + Math.cos(time * drift.freqY + drift.phaseY) * drift.ampY;

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
    };

    const tick = (now: number) => {
      const time = (now - startTime) / 1000;

      for (const c of curves) {
        updateCp(c.cpL1, c.cpL1Vel, c.cpL1Rest, c.driftL, time);
        updateCp(c.cpR2, c.cpR2Vel, c.cpR2Rest, c.driftR, time);
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
        ctx.bezierCurveTo(
          c.cpL1.x,
          c.cpL1.y,
          c.cpL2.x,
          c.cpL2.y,
          c.throat.x,
          c.throat.y,
        );
        ctx.bezierCurveTo(
          c.cpR1.x,
          c.cpR1.y,
          c.cpR2.x,
          c.cpR2.y,
          c.end.x,
          c.end.y,
        );
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
