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

type DotState = {
  base: Vec2;
  pos: Vec2;
  vel: Vec2;
  drift: DriftParams;
};

type Curve = {
  startIdx: number;
  endIdx: number;
  cpL1: Vec2;
  cpL1Vel: Vec2;
  cpL1Drift: DriftParams;
  cpR2: Vec2;
  cpR2Vel: Vec2;
  cpR2Drift: DriftParams;
  opacityPhase: number;
  opacitySpeed: number;
  /** 0..1 — alpha multiplier on the right half of the stroke. 0 means
   *  the curve fades to nothing past the throat and the right dot is
   *  hidden entirely. */
  rightAlpha: number;
};

function rand(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function makeDrift(seed: number, ampScale = 1): DriftParams {
  return {
    ampX: (0.5 + rand(seed) * 1.3) * ampScale,
    freqX: 0.25 + rand(seed + 1) * 0.45,
    phaseX: rand(seed + 2) * Math.PI * 2,
    ampY: (0.5 + rand(seed + 3) * 1.3) * ampScale,
    freqY: 0.25 + rand(seed + 4) * 0.45,
    phaseY: rand(seed + 5) * Math.PI * 2,
  };
}

const STROKE_BASE_ALPHA = 0.28;
const STROKE_AMP_ALPHA = 0.18;
const THROAT_ALPHA_FACTOR = 0.4;
const DOT_BASE_ALPHA = 0.55;
const HIDDEN_THRESHOLD = 0.06;

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
    let leftDots: DotState[] = [];
    let rightDots: DotState[] = [];

    let cpL1X = 0;
    let cpL2X = 0;
    let cpR1X = 0;
    let cpR2X = 0;
    let cx = 0;
    let cy = 0;

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
      const leftTopY = height * 0.06;
      const leftBottomY = height * 0.94;
      // Right column is compressed vertically — fewer punctation points
      // bunched closer together behind the throat.
      const rightTopY = height * 0.24;
      const rightBottomY = height * 0.76;
      cx = width * 0.5;
      cy = height * 0.5;

      // CPs near endpoints (mouse-interactive). The throat-side cps sit
      // ~5% before/after the centre — closer than before so the bow
      // approaching the throat reads more pronounced.
      cpL1X = leftX + width * 0.08;
      cpL2X = cx - width * 0.05;
      cpR1X = cx + width * 0.05;
      cpR2X = rightX - width * 0.08;

      leftDots = [];
      rightDots = [];
      for (let i = 0; i < curveCount; i++) {
        const t = curveCount > 1 ? i / (curveCount - 1) : 0.5;
        const yLeft = leftTopY + t * (leftBottomY - leftTopY);
        const yRight = rightTopY + t * (rightBottomY - rightTopY);
        const jitterLeftX = (rand(i + 100) - 0.5) * 22;
        const jitterRightX = (rand(i + 200) - 0.5) * 14;
        const jitterLeftY = (rand(i + 300) - 0.5) * 6;
        const jitterRightY = (rand(i + 400) - 0.5) * 4;
        const leftBase = { x: leftX + jitterLeftX, y: yLeft + jitterLeftY };
        const rightBase = { x: rightX + jitterRightX, y: yRight + jitterRightY };
        leftDots.push({
          base: leftBase,
          pos: { ...leftBase },
          vel: { x: 0, y: 0 },
          drift: makeDrift(i * 31 + 600, 0.55),
        });
        rightDots.push({
          base: rightBase,
          pos: { ...rightBase },
          vel: { x: 0, y: 0 },
          drift: makeDrift(i * 31 + 700, 0.55),
        });
      }

      // Cross-mapping: each left endpoint connects to a right endpoint
      // shifted by ±~18% of count.
      const swing = Math.max(2, Math.floor(curveCount * 0.18));
      const mapping = new Array<number>(curveCount);
      for (let i = 0; i < curveCount; i++) {
        const offset = Math.round((rand(i + 999) - 0.5) * 2 * swing);
        mapping[i] = ((i + offset) % curveCount + curveCount) % curveCount;
      }

      curves = [];
      for (let i = 0; i < curveCount; i++) {
        const startDot = leftDots[i];
        const endDot = rightDots[mapping[i]];

        // Initial cp positions match the dot ys for a horizontal start
        // tangent. They'll be re-anchored each frame against the live
        // dot position so the dot and the curve move together.
        const cpL1: Vec2 = { x: cpL1X, y: startDot.pos.y };
        const cpR2: Vec2 = { x: cpR2X, y: endDot.pos.y };

        // 30 % full / 30 % partial / 40 % hidden — the right column
        // emerges with markedly fewer visible strands than the left.
        const r = rand(i + 333);
        let rightAlpha: number;
        if (r < 0.3) rightAlpha = 1.0;
        else if (r < 0.6) rightAlpha = 0.22 + rand(i + 444) * 0.32;
        else rightAlpha = 0;

        curves.push({
          startIdx: i,
          endIdx: mapping[i],
          cpL1: { ...cpL1 },
          cpL1Vel: { x: 0, y: 0 },
          cpL1Drift: makeDrift(i * 17 + 800),
          cpR2: { ...cpR2 },
          cpR2Vel: { x: 0, y: 0 },
          cpR2Drift: makeDrift(i * 17 + 900),
          opacityPhase: rand(i + 7) * Math.PI * 2,
          opacitySpeed: 0.32 + rand(i + 71) * 0.55,
          rightAlpha,
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

    const applyMouse = (
      pos: Vec2,
      restX: { v: number },
      restY: { v: number },
    ) => {
      if (mouseX === null || mouseY === null) return;
      const ddx = pos.x - mouseX;
      const ddy = pos.y - mouseY;
      const dist = Math.hypot(ddx, ddy);
      if (dist < MOUSE_RADIUS && dist > 0.001) {
        const force = (1 - dist / MOUSE_RADIUS) * MOUSE_FORCE;
        restX.v += (ddx / dist) * force;
        restY.v += (ddy / dist) * force;
      }
    };

    const stepDot = (dot: DotState, time: number) => {
      const restX = {
        v:
          dot.base.x +
          Math.sin(time * dot.drift.freqX + dot.drift.phaseX) * dot.drift.ampX,
      };
      const restY = {
        v:
          dot.base.y +
          Math.cos(time * dot.drift.freqY + dot.drift.phaseY) * dot.drift.ampY,
      };
      applyMouse(dot.pos, restX, restY);
      dot.vel.x += (restX.v - dot.pos.x) * SPRING_K;
      dot.vel.y += (restY.v - dot.pos.y) * SPRING_K;
      dot.vel.x *= SPRING_DAMPING;
      dot.vel.y *= SPRING_DAMPING;
      dot.pos.x += dot.vel.x;
      dot.pos.y += dot.vel.y;
    };

    const stepCp = (
      cp: Vec2,
      cpVel: Vec2,
      anchorRestX: number,
      anchorRestY: number,
      drift: DriftParams,
      time: number,
    ) => {
      const restX = {
        v: anchorRestX + Math.sin(time * drift.freqX + drift.phaseX) * drift.ampX,
      };
      const restY = {
        v: anchorRestY + Math.cos(time * drift.freqY + drift.phaseY) * drift.ampY,
      };
      applyMouse(cp, restX, restY);
      cpVel.x += (restX.v - cp.x) * SPRING_K;
      cpVel.y += (restY.v - cp.y) * SPRING_K;
      cpVel.x *= SPRING_DAMPING;
      cpVel.y *= SPRING_DAMPING;
      cp.x += cpVel.x;
      cp.y += cpVel.y;
    };

    const tick = (now: number) => {
      const time = (now - startTime) / 1000;

      for (const dot of leftDots) stepDot(dot, time);
      for (const dot of rightDots) stepDot(dot, time);

      for (const c of curves) {
        const startDot = leftDots[c.startIdx];
        const endDot = rightDots[c.endIdx];
        // cpL1Rest follows the live left dot y so the curve stays
        // attached as the dot deflects.
        stepCp(c.cpL1, c.cpL1Vel, cpL1X, startDot.pos.y, c.cpL1Drift, time);
        stepCp(c.cpR2, c.cpR2Vel, cpR2X, endDot.pos.y, c.cpR2Drift, time);
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

        const startDot = leftDots[c.startIdx];
        const endDot = rightDots[c.endIdx];

        const grad = ctx.createLinearGradient(
          startDot.pos.x,
          0,
          endDot.pos.x,
          0,
        );
        grad.addColorStop(0, `rgba(79, 70, 229, ${aLeft})`);
        grad.addColorStop(0.5, `rgba(79, 70, 229, ${aThroat})`);
        grad.addColorStop(1, `rgba(79, 70, 229, ${aRight})`);
        ctx.strokeStyle = grad;

        ctx.beginPath();
        ctx.moveTo(startDot.pos.x, startDot.pos.y);
        ctx.bezierCurveTo(c.cpL1.x, c.cpL1.y, cpL2X, cy, cx, cy);
        ctx.bezierCurveTo(cpR1X, cy, c.cpR2.x, c.cpR2.y, endDot.pos.x, endDot.pos.y);
        ctx.stroke();
      }

      for (let i = 0; i < curves.length; i++) {
        const c = curves[i];
        const startDot = leftDots[c.startIdx];
        ctx.fillStyle = `rgba(79, 70, 229, ${DOT_BASE_ALPHA})`;
        ctx.beginPath();
        ctx.arc(startDot.pos.x, startDot.pos.y, 2.4, 0, Math.PI * 2);
        ctx.fill();

        if (c.rightAlpha >= HIDDEN_THRESHOLD) {
          const endDot = rightDots[c.endIdx];
          const rightDotAlpha = (DOT_BASE_ALPHA * c.rightAlpha).toFixed(3);
          ctx.fillStyle = `rgba(79, 70, 229, ${rightDotAlpha})`;
          ctx.beginPath();
          ctx.arc(endDot.pos.x, endDot.pos.y, 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
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
