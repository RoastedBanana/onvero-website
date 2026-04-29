'use client';

import { useEffect, useMemo, useRef } from 'react';

interface NetworkCanvasProps {
  className?: string;
  /** Override the default agent positions (0..1 fractions of canvas size). */
  agentPositions?: Record<string, { x: number; y: number }>;
}

type Vec2 = { x: number; y: number };

const DEFAULT_AGENTS: Record<
  string,
  { x: number; y: number; toolCircles: number }
> = {
  'lead-scout':      { x: 0.05, y: 0.38, toolCircles: 3 },
  'score-engine':    { x: 0.38, y: 0.12, toolCircles: 3 },
  'outreach-writer': { x: 0.74, y: 0.38, toolCircles: 2 },
  'business-agent':  { x: 0.38, y: 0.60, toolCircles: 3 },
};

const CONNECTIONS: { from: string; to: string; curves: number }[] = [
  { from: 'lead-scout',      to: 'score-engine',    curves: 6 },
  { from: 'score-engine',    to: 'outreach-writer', curves: 5 },
  { from: 'score-engine',    to: 'business-agent',  curves: 5 },
  { from: 'lead-scout',      to: 'business-agent',  curves: 4 },
  { from: 'outreach-writer', to: 'business-agent',  curves: 5 },
];

/** Stable pseudo-random in [0, 1) so curves don't reshuffle on every rebuild. */
function rand(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

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
  isTool: boolean;
};

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

export default function NetworkCanvas({
  className,
  agentPositions,
}: NetworkCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Re-effect only when overrides actually change values (not reference).
  const positionsKey = useMemo(
    () =>
      agentPositions
        ? JSON.stringify(
            Object.entries(agentPositions)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([id, p]) => [id, +p.x.toFixed(4), +p.y.toFixed(4)]),
          )
        : '',
    [agentPositions],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const SPREAD = 70;
    const TOOL_SPACING = 56;
    const TOOL_DROP = 92;
    const TOOL_RADIUS = 15;
    const MOUSE_RADIUS = 120;
    const MOUSE_FORCE = 80;
    const SPRING_K = 0.08;
    const SPRING_DAMPING = 0.9;

    const isTouch =
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || navigator.maxTouchPoints > 0);

    let width = 0;
    let height = 0;
    let dpr = 1;
    let curves: Curve[] = [];
    type AgentResolved = {
      x: number;
      y: number;
      tools: { x: number; y: number }[];
    };
    let agents: Record<string, AgentResolved> = {};

    let mouseX: number | null = null;
    let mouseY: number | null = null;

    const resolveAgentPos = (id: string): Vec2 => {
      const def = DEFAULT_AGENTS[id];
      const override = agentPositions?.[id];
      if (override) return { x: override.x * width, y: override.y * height };
      return { x: def.x * width, y: def.y * height };
    };

    const rebuild = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      if (width === 0 || height === 0) return;
      dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      agents = {};
      for (const [id, def] of Object.entries(DEFAULT_AGENTS)) {
        const pos = resolveAgentPos(id);
        const tools: Vec2[] = [];
        const N = def.toolCircles;
        const startX = pos.x - ((N - 1) * TOOL_SPACING) / 2;
        for (let i = 0; i < N; i++) {
          tools.push({ x: startX + i * TOOL_SPACING, y: pos.y + TOOL_DROP });
        }
        agents[id] = { x: pos.x, y: pos.y, tools };
      }

      curves = [];
      let seed = 0;

      for (const conn of CONNECTIONS) {
        const a = agents[conn.from];
        const b = agents[conn.to];
        if (!a || !b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        const px = -dy / len;
        const py = dx / len;

        for (let i = 0; i < conn.curves; i++) {
          seed++;
          const denom = conn.curves > 1 ? conn.curves - 1 : 1;
          const spread = (i / denom - 0.5) * SPREAD;
          const jitter1 = (rand(seed) - 0.5) * 18;
          const jitter2 = (rand(seed + 999) - 0.5) * 18;
          const t1 = 0.28 + rand(seed + 13) * 0.08;
          const t2 = 0.66 + rand(seed + 29) * 0.08;
          const cp1Rest: Vec2 = {
            x: a.x + dx * t1 + px * (spread + jitter1),
            y: a.y + dy * t1 + py * (spread + jitter1),
          };
          const cp2Rest: Vec2 = {
            x: a.x + dx * t2 + px * (spread + jitter2),
            y: a.y + dy * t2 + py * (spread + jitter2),
          };
          curves.push({
            start: { x: a.x, y: a.y },
            end: { x: b.x, y: b.y },
            cp1Rest,
            cp2Rest,
            cp1: { ...cp1Rest },
            cp2: { ...cp2Rest },
            cp1Vel: { x: 0, y: 0 },
            cp2Vel: { x: 0, y: 0 },
            pulsePhase: rand(seed + 7),
            pulseSpeed: 1 / (2 + rand(seed + 41) * 2),
            isTool: false,
          });
        }
      }

      for (const [, agent] of Object.entries(agents)) {
        for (const tc of agent.tools) {
          seed++;
          const dx = tc.x - agent.x;
          const dy = tc.y - agent.y;
          const len = Math.hypot(dx, dy) || 1;
          const px = -dy / len;
          const py = dx / len;
          const sideJitter = (rand(seed) - 0.5) * 14;
          const cp1Rest: Vec2 = {
            x: agent.x + dx * 0.4 + px * sideJitter,
            y: agent.y + dy * 0.4 + py * sideJitter,
          };
          const cp2Rest: Vec2 = {
            x: agent.x + dx * 0.75 + px * sideJitter * 0.5,
            y: agent.y + dy * 0.75 + py * sideJitter * 0.5,
          };
          curves.push({
            start: { x: agent.x, y: agent.y },
            end: { x: tc.x, y: tc.y },
            cp1Rest,
            cp2Rest,
            cp1: { ...cp1Rest },
            cp2: { ...cp2Rest },
            cp1Vel: { x: 0, y: 0 },
            cp2Vel: { x: 0, y: 0 },
            pulsePhase: rand(seed + 17),
            pulseSpeed: 1 / (1.6 + rand(seed + 53) * 1.4),
            isTool: true,
          });
        }
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
              const nx = ddx / dist;
              const ny = ddy / dist;
              restX += nx * force;
              restY += ny * force;
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
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 1.1;
      for (const c of curves) {
        ctx.beginPath();
        ctx.moveTo(c.start.x, c.start.y);
        ctx.bezierCurveTo(c.cp1.x, c.cp1.y, c.cp2.x, c.cp2.y, c.end.x, c.end.y);
        ctx.stroke();
      }

      for (const [, agent] of Object.entries(agents)) {
        for (const tc of agent.tools) {
          ctx.fillStyle = 'rgba(160,190,210,0.35)';
          ctx.beginPath();
          ctx.arc(tc.x, tc.y, TOOL_RADIUS, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.3)';
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,0.45)';
          ctx.beginPath();
          ctx.ellipse(
            tc.x,
            tc.y - TOOL_RADIUS * 0.42,
            TOOL_RADIUS * 0.5,
            TOOL_RADIUS * 0.18,
            0,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
      }

      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      for (const agent of Object.values(agents)) {
        ctx.beginPath();
        ctx.arc(agent.x, agent.y, 3, 0, Math.PI * 2);
        ctx.fill();
        for (const tc of agent.tools) {
          ctx.beginPath();
          ctx.arc(tc.x, tc.y, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalCompositeOperation = 'lighter';
      for (const c of curves) {
        const t = c.pulsePhase;
        let opacity = 1;
        if (t < 0.12) opacity = t / 0.12;
        else if (t > 0.88) opacity = (1 - t) / 0.12;
        if (opacity <= 0) continue;

        bezierPoint(c, t, out);

        const grad = ctx.createRadialGradient(out.x, out.y, 0, out.x, out.y, 10);
        grad.addColorStop(0, `rgba(255,255,255,${0.55 * opacity})`);
        grad.addColorStop(0.45, `rgba(255,255,255,${0.18 * opacity})`);
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(out.x, out.y, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255,255,255,${0.85 * opacity})`;
        ctx.beginPath();
        ctx.arc(out.x, out.y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';

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
    // positionsKey forces a rebuild when overrides change values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positionsKey]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
}
