"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

// ── Meeting card ──────────────────────────────────────────────────────────────
// Bell-curve base heights for the waveform bars
const WAVE_BASE = [8, 14, 20, 26, 18, 30, 22, 38, 26, 38, 22, 30, 18, 26, 20, 14, 8];
// Each bar gets a slightly different animation duration for organic feel
const WAVE_DURATIONS = [380, 290, 420, 310, 360, 270, 400, 320, 350, 300, 410, 280, 370, 330, 390, 260, 340];

function MeetingCard({ delay }: { delay: number }) {
  const [hovered, setHovered] = useState(false);
  const [phase, setPhase]     = useState<'idle' | 'wave' | 'done'>('idle');
  const { t } = useTranslation();

  useEffect(() => {
    if (!hovered) { setPhase('idle'); return; }
    const t1 = setTimeout(() => setPhase('wave'), 380);
    const t2 = setTimeout(() => setPhase('done'),  2400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [hovered]);

  const iconStyle_: React.CSSProperties = {
    transform: hovered ? 'translateY(-60px)' : 'translateY(0)',
    opacity:   hovered ? 0 : 1,
    transition: hovered
      ? 'transform 220ms ease-in, opacity 220ms ease-in'
      : 'transform 220ms ease-out, opacity 220ms ease-out',
    transitionDelay: hovered ? '0ms' : '100ms',
  };
  const contentStyle: React.CSSProperties = {
    transform: hovered ? 'translateY(-56px)' : 'translateY(0)',
    transition: hovered ? 'transform 280ms ease-out' : 'transform 280ms ease-in-out',
    transitionDelay: hovered ? '80ms' : '0ms',
  };

  const waveVisible  = phase === 'wave';
  const checkVisible = phase === 'done';

  return (
    <BentoItem className="flex flex-col" delay={delay} onHoverStart={() => setHovered(true)} onHoverEnd={() => setHovered(false)}>
      {/* CSS keyframes injected once */}
      <style>{`
        @keyframes wave-bar {
          0%, 100% { transform: scaleY(0.25); }
          50%       { transform: scaleY(1); }
        }
        @keyframes bar-collapse {
          to { transform: scaleY(0.05); }
        }
      `}</style>

      <div style={iconStyle_}>
        <IconWrap><Mic style={iconStyle} /></IconWrap>
      </div>
      <div style={contentStyle}>
        <h3 className={titleStyle}>Meeting-Zusammenfassung</h3>
        <p className="text-sm leading-relaxed" style={descStyle}>
          {t(
            "Meetings automatisch transkribieren, zusammenfassen und Aufgaben direkt ins Projektmanagement übergeben.",
            "Automatically transcribe, summarise meetings, and push tasks directly into project management.",
          )}
        </p>
      </div>

      {/* Animation area */}
      <div style={{
        position: 'absolute', bottom: 20, left: 20, right: 20,
        pointerEvents: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: 52,
        opacity: hovered ? 1 : 0,
        transform: hovered ? 'translateY(0)' : 'translateY(10px)',
        transition: hovered
          ? 'opacity 250ms ease 380ms, transform 250ms ease 380ms'
          : 'opacity 150ms ease, transform 150ms ease',
      }}>
        {/* Waveform bars — pure CSS animation, no JS per frame */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', gap: 3,
          opacity: waveVisible ? 1 : 0,
          transition: 'opacity 400ms ease',
        }}>
          {WAVE_BASE.map((h, i) => (
            <div key={i} style={{
              flex: 1,
              height: `${h}px`,
              background: 'rgba(255,255,255,0.85)',
              borderRadius: 999,
              transformOrigin: 'center',
              willChange: 'transform',
              animation: waveVisible
                ? `wave-bar ${WAVE_DURATIONS[i]}ms ease-in-out ${i * 30}ms infinite`
                : undefined,
            }} />
          ))}
        </div>

        {/* Checkmark circle */}
        <div style={{
          position: 'absolute',
          width: 40, height: 40,
          borderRadius: '50%',
          border: '3px solid rgba(255,255,255,0.9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          willChange: 'transform, opacity',
          opacity: checkVisible ? 1 : 0,
          transform: checkVisible ? 'scale(1)' : 'scale(0.4)',
          transition: 'opacity 350ms cubic-bezier(0.34,1.56,0.64,1), transform 350ms cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
            <path
              d="M1.5 7L6.5 12L16.5 2"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="22"
              strokeDashoffset={checkVisible ? 0 : 22}
              style={{ transition: 'stroke-dashoffset 350ms ease 100ms' }}
            />
          </svg>
        </div>
      </div>
    </BentoItem>
  );
}

// ── Website-building mockup animation ─────────────────────────────────────────
const IDLE_H   = 94;
const EXPAND_H = 210;

function WebsiteMockup({ hovered }: { hovered: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef   = useRef<HTMLDivElement>(null);
  const timersRef    = useRef<ReturnType<typeof setTimeout>[]>([]);
  const animatingRef = useRef(false);

  useEffect(() => {
    if (hovered) {
      const t = setTimeout(() => play(), 380); // wait for icon+content to clear
      return () => clearTimeout(t);
    } else {
      reset();
    }
  }, [hovered]); // eslint-disable-line react-hooks/exhaustive-deps

  function schedule(fn: () => void, ms: number) {
    timersRef.current.push(setTimeout(fn, ms));
  }

  function clearTimers() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }

  function reset() {
    clearTimers();
    animatingRef.current = false;
    const c = containerRef.current;
    const content = contentRef.current;
    if (!c) return;
    const grid   = c.querySelector<SVGElement>('[data-grid]');
    const cursor = c.querySelector<SVGElement>('[data-cursor]');
    const flash  = c.querySelector<HTMLElement>('[data-flash]');
    const blocks = Array.from(c.querySelectorAll<HTMLElement>('[data-block]'));

    if (content) {
      content.style.transition = 'height 0.4s cubic-bezier(0.4,0,0.2,1)';
      content.style.height     = `${IDLE_H}px`;
    }
    if (grid)   { grid.style.transition   = 'opacity 0.3s'; grid.style.opacity   = '0'; }
    if (cursor) { cursor.style.transition = 'opacity 0.3s'; cursor.style.opacity = '0'; }
    if (flash)  { flash.style.opacity = '0'; }
    blocks.forEach(b => {
      b.style.transition = 'opacity 0.4s, transform 0.4s';
      b.style.opacity    = '1';
      b.style.transform  = 'translateX(0)';
    });
  }

  function play() {
    clearTimers();
    animatingRef.current = true;
    const c = containerRef.current;
    const content = contentRef.current;
    if (!c) return;
    const grid   = c.querySelector<SVGElement>('[data-grid]');
    const cursor = c.querySelector<SVGSVGElement>('[data-cursor]');
    const flash  = c.querySelector<HTMLElement>('[data-flash]');
    const blocks = Array.from(c.querySelectorAll<HTMLElement>('[data-block]'));

    // ── Step 0: expand height upward ────────────────────────────────────────
    if (content) {
      content.style.transition = 'height 0.45s cubic-bezier(0.4,0,0.2,1)';
      content.style.height     = `${EXPAND_H}px`;
    }

    // ── Step 1: instant clear ────────────────────────────────────────────────
    blocks.forEach(b => {
      b.style.transition = 'none';
      b.style.opacity    = '0';
      b.style.transform  = 'translateX(-10px)';
    });
    if (cursor) { cursor.style.transition = 'none'; cursor.style.opacity = '0'; }

    // ── Step 2: construction grid fades in ───────────────────────────────────
    schedule(() => {
      if (grid) { grid.style.transition = 'opacity 0.35s'; grid.style.opacity = '1'; }
    }, 100);

    // cursor positions (left, top) relative to the content div — scaled for EXPAND_H
    const cursorPositions = [
      { l: 14, t: 10 },
      { l: 14, t: 54 },
      { l: 14, t: 92 },
      { l: 14, t: 112 },
      { l: 14, t: 146 },
    ];

    // ── Step 3: blocks slide in with stagger + cursor follows ────────────────
    blocks.forEach((block, i) => {
      const t = 360 + i * 110;
      schedule(() => {
        block.style.transition = 'opacity 0.22s ease, transform 0.22s ease';
        block.style.opacity    = '1';
        block.style.transform  = 'translateX(0)';

        if (cursor) {
          const pos = cursorPositions[i] ?? cursorPositions[cursorPositions.length - 1];
          cursor.style.transition = i === 0
            ? 'opacity 0.15s'
            : 'opacity 0.15s, left 0.2s cubic-bezier(.4,0,.2,1), top 0.2s cubic-bezier(.4,0,.2,1)';
          cursor.style.left    = `${pos.l}px`;
          cursor.style.top     = `${pos.t}px`;
          cursor.style.opacity = '1';
        }
      }, t);
    });

    // ── Step 4: publish flash — grid fades out, cursor out, flash ────────────
    const doneAt = 360 + blocks.length * 110 + 160;
    schedule(() => {
      if (grid)   { grid.style.transition   = 'opacity 0.35s'; grid.style.opacity   = '0'; }
      if (cursor) { cursor.style.transition = 'opacity 0.25s'; cursor.style.opacity = '0'; }
      if (flash) {
        flash.style.transition = 'opacity 0.12s';
        flash.style.opacity    = '1';
        setTimeout(() => {
          flash.style.transition = 'opacity 0.5s';
          flash.style.opacity    = '0';
        }, 120);
      }
      animatingRef.current = false;
    }, doneAt);
  }

  return (
    <div
      ref={containerRef}
      className="mt-6 rounded-xl overflow-hidden"
      style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
    >
      {/* Chrome bar */}
      <div className="flex items-center gap-1.5 px-3 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.12)" }} />
        ))}
        <div
          className="ml-2 flex-1 h-4 rounded-sm text-[10px] flex items-center px-2"
          style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.25)" }}
        >
          www.ihrUnternehmen.de
        </div>
      </div>

      {/* Content area — height transitions between IDLE_H and EXPAND_H */}
      <div
        ref={contentRef}
        className="p-4 relative overflow-hidden"
        style={{ height: IDLE_H, transition: 'height 0.45s cubic-bezier(0.4,0,0.2,1)' }}
      >
        {/* Construction grid overlay */}
        <svg
          data-grid=""
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ opacity: 0 }}
          aria-hidden="true"
        >
          {[20, 40, 60, 80].map(y => (
            <line key={y} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`}
              stroke="rgba(99,179,237,0.3)" strokeWidth="0.5" strokeDasharray="4 3" />
          ))}
          {[33, 66].map(x => (
            <line key={x} x1={`${x}%`} y1="0" x2={`${x}%`} y2="100%"
              stroke="rgba(99,179,237,0.3)" strokeWidth="0.5" strokeDasharray="4 3" />
          ))}
        </svg>

        {/* SVG cursor */}
        <svg
          data-cursor=""
          className="absolute pointer-events-none z-20"
          style={{ opacity: 0, width: 12, height: 18, left: 14, top: 10 }}
          viewBox="0 0 12 18"
          aria-hidden="true"
        >
          <path
            d="M1 1 L1 15 L4 11 L6.5 17 L8.5 16 L6 10 L10.5 10 Z"
            fill="white"
            stroke="rgba(0,0,0,0.55)"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>

        {/* Flash overlay */}
        <div
          data-flash=""
          className="absolute inset-0 pointer-events-none z-10 rounded-b-xl"
          style={{ opacity: 0, background: "radial-gradient(ellipse at 40% 40%, rgba(255,255,255,0.22) 0%, transparent 65%)" }}
        />

        {/* Content blocks — nav bar */}
        <div data-block="" className="flex gap-2 mb-4">
          <div className="h-2 w-10 rounded-sm" style={{ backgroundColor: "rgba(255,255,255,0.18)" }} />
          <div className="h-2 w-8 rounded-sm ml-auto" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
          <div className="h-2 w-8 rounded-sm" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
          <div className="h-2 w-12 rounded-sm" style={{ backgroundColor: "rgba(255,255,255,0.1)" }} />
        </div>
        {/* Hero image placeholder */}
        <div data-block="" className="h-14 w-full rounded-md mb-4" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }} />
        {/* Headline */}
        <div data-block="" className="h-3 w-2/3 rounded-sm mb-2" style={{ backgroundColor: "rgba(255,255,255,0.1)" }} />
        {/* Text lines */}
        <div data-block="" className="space-y-1.5 mb-3">
          <div className="h-2 w-full rounded-sm" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
          <div className="h-2 w-4/5 rounded-sm" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
        </div>
        {/* Buttons */}
        <div data-block="" className="flex gap-2">
          <div className="h-6 w-20 rounded-md" style={{ backgroundColor: "rgba(255,255,255,0.12)" }} />
          <div className="h-6 w-16 rounded-md" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
        </div>
      </div>
    </div>
  );
}
import { useTranslation } from "@/lib/language-context";
import {
  Globe,
  GitBranch,
  BarChart3,
  MessageSquare,
  Target,
  Mic,
  GraduationCap,
  Sparkles,
} from "lucide-react";

// ── Shared animation preset ────────────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" } as const,
  transition: { duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] as const },
});

// ── BentoItem ─────────────────────────────────────────────────────────────────
const BentoItem = ({
  className = "",
  children,
  delay = 0,
  onHoverStart,
  onHoverEnd,
}: {
  className?: string;
  children: React.ReactNode;
  delay?: number;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
}) => {
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const item = itemRef.current;
    if (!item) return;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = item.getBoundingClientRect();
      item.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
      item.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
    };
    item.addEventListener("mousemove", handleMouseMove);
    return () => item.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <motion.div
      ref={itemRef}
      {...fadeUp(delay)}
      style={
        {
          "--mouse-x": "50%",
          "--mouse-y": "50%",
          backgroundColor: "#1a1a1a",
          border: "1px solid rgba(255,255,255,0.06)",
        } as React.CSSProperties
      }
      className={`relative rounded-2xl p-6 overflow-hidden transition-all duration-300 group cursor-default
        before:absolute before:inset-0 before:rounded-2xl before:opacity-0 before:transition-opacity before:duration-300
        hover:before:opacity-100
        before:bg-[radial-gradient(280px_circle_at_var(--mouse-x)_var(--mouse-y),rgba(255,255,255,0.04),transparent)]
        ${className}`}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; onHoverStart?.(); }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; onHoverEnd?.(); }}
    >
      {children}
    </motion.div>
  );
};

const IconWrap = ({ children }: { children: React.ReactNode }) => (
  <div
    className="p-2 rounded-lg w-fit mb-4"
    style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
  >
    {children}
  </div>
);

const iconStyle = { width: 18, height: 18, color: "rgba(255,255,255,0.65)" };
const titleStyle = "text-base font-semibold text-white mb-2";
const descStyle = { color: "rgba(255,255,255,0.4)" } as React.CSSProperties;

// ── Websites card — hover tracked at card boundary ───────────────────────────
function WebsitesCard({ delay }: { delay: number }) {
  const [hovered, setHovered] = useState(false);
  const { t } = useTranslation();
  return (
    <BentoItem
      className="lg:col-span-2 lg:row-span-2 flex flex-col justify-between"
      delay={delay}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      <div>
        <IconWrap><Globe style={iconStyle} /></IconWrap>
        <h3 className="text-xl font-bold text-white mb-3">
          {t("Moderne Websites mit KI", "Modern Websites with AI")}
        </h3>
        <p className="text-sm leading-relaxed" style={descStyle}>
          {t("Professionelle Unternehmenswebsites mit integrierter KI — intelligenter Chatbot, automatisierte Leaderfassung und personalisiertes Nutzererlebnis ab Tag 1.", "Professional business websites with integrated AI — smart chatbot, automated lead capture, and personalized user experience from day 1.")}
        </p>
      </div>
      <WebsiteMockup hovered={hovered} />
    </BentoItem>
  );
}

// ── Workflow SVG animation ────────────────────────────────────────────────────
const WF_CSS = `
@keyframes wf-dot {
  0%   { transform:translate(0px,0px);      opacity:1 }
  20%  { transform:translate(95px,0px);     opacity:1 }
  27%  { transform:translate(95px,0px);     opacity:1 }
  47%  { transform:translate(190px,0px);    opacity:1 }
  54%  { transform:translate(190px,0px);    opacity:1 }
  63%  { transform:translate(193px,-26px);  opacity:.7 }
  68%  { transform:translate(196px,-34px);  opacity:0 }
  99%  { transform:translate(0px,0px);      opacity:0 }
  100% { transform:translate(0px,0px);      opacity:1 }
}
@keyframes wf-pulse2 {
  0%,18%  { transform:scale(1) }
  21%     { transform:scale(1.5) }
  24%     { transform:scale(1) }
  100%    { transform:scale(1) }
}
@keyframes wf-pulse3 {
  0%,45%  { transform:scale(1) }
  48%     { transform:scale(1.5) }
  51%     { transform:scale(1) }
  100%    { transform:scale(1) }
}
@keyframes wf-star {
  0%,65%  { transform:scale(0);   opacity:0 }
  69%     { transform:scale(1.15);opacity:1 }
  72%     { transform:scale(1);   opacity:1 }
  84%     { transform:scale(1);   opacity:1 }
  91%     { transform:scale(.9);  opacity:0 }
  100%    { transform:scale(0);   opacity:0 }
}`;

function WorkflowAnimation({ hovered }: { hovered: boolean }) {
  const [active, setActive]   = useState(false);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    if (hovered) {
      const t = setTimeout(() => {
        setActive(true);
        setAnimKey(k => k + 1);
      }, 380);
      return () => clearTimeout(t);
    } else {
      setActive(false);
    }
  }, [hovered]);

  const run = active;
  const anim = (name: string) =>
    run ? `${name} 2s linear infinite` : 'none';

  const nodeStyle = (animName: string): React.CSSProperties => ({
    transformBox: 'fill-box' as const,
    transformOrigin: 'center',
    animation: anim(animName),
  });

  return (
    <div style={{ marginTop: 12, pointerEvents: 'none' }}>
      <style>{WF_CSS}</style>
      <svg
        key={animKey}
        viewBox="0 0 220 60"
        fill="none"
        style={{ width: '100%', height: 'auto', overflow: 'visible' }}
        aria-hidden="true"
      >
        {/* Line */}
        <line x1="15" y1="45" x2="205" y2="45"
          stroke="rgba(255,255,255,0.22)" strokeWidth="1" />

        {/* Node 1 — static */}
        <circle cx="15" cy="45" r="5" fill="white" fillOpacity="0.85" />

        {/* Node 2 — pulses on dot arrival */}
        <circle cx="110" cy="45" r="5" fill="white" fillOpacity="0.85"
          style={nodeStyle('wf-pulse2')} />

        {/* Node 3 — pulses on dot arrival */}
        <circle cx="205" cy="45" r="5" fill="white" fillOpacity="0.85"
          style={nodeStyle('wf-pulse3')} />

        {/* Traveling dot */}
        <circle cx="15" cy="45" r="4" fill="white"
          style={{
            filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.9))',
            animation: anim('wf-dot'),
          }} />

        {/* 4-pointed star — appears at arc peak above node 3 */}
        <path
          d="M211,5 C212.5,10 213,11 218,12.5 C213,14 212.5,15 211,20 C209.5,15 209,14 204,12.5 C209,11 209.5,10 211,5 Z"
          fill="white"
          style={{
            opacity: 0,
            transformBox: 'fill-box' as const,
            transformOrigin: 'center',
            filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.95))',
            animation: anim('wf-star'),
          }} />
      </svg>
    </div>
  );
}

// ── AI Workflows card with icon-exit hover ────────────────────────────────────
function AIWorkflowsCard({ delay }: { delay: number }) {
  const [hovered, setHovered] = useState(false);
  const { t } = useTranslation();

  const iconStyle_: React.CSSProperties = {
    transform:  hovered ? 'translateY(-60px)' : 'translateY(0)',
    opacity:    hovered ? 0 : 1,
    transition: hovered
      ? 'transform 220ms ease-in, opacity 220ms ease-in'
      : 'transform 220ms ease-out, opacity 220ms ease-out',
    transitionDelay: hovered ? '0ms' : '100ms',
  };

  const contentStyle: React.CSSProperties = {
    transform:  hovered ? 'translateY(-56px)' : 'translateY(0)',
    transition: hovered
      ? 'transform 280ms ease-out'
      : 'transform 280ms ease-in-out',
    transitionDelay: hovered ? '80ms' : '0ms',
  };

  return (
    <BentoItem
      className="flex flex-col overflow-hidden"
      delay={delay}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      <div style={iconStyle_}>
        <IconWrap><GitBranch style={iconStyle} /></IconWrap>
      </div>
      <div style={contentStyle}>
        <h3 className={titleStyle}>AI Workflows</h3>
        <p className="text-sm leading-relaxed" style={descStyle}>
          {t(
            "Wiederkehrende Prozesse vollständig automatisieren — Angebote, Rechnungen, E-Mails, Berichte.",
            "Fully automate recurring processes — quotes, invoices, emails, reports.",
          )}
        </p>
        <WorkflowAnimation hovered={hovered} />
      </div>
    </BentoItem>
  );
}

// ── Lead Generation card ──────────────────────────────────────────────────────
const CHECK_DELAYS = [400, 580, 760] as const;

function LeadGenCard({ delay }: { delay: number }) {
  const [hovered, setHovered] = useState(false);
  const { t } = useTranslation();

  const iconStyle_: React.CSSProperties = {
    transform:  hovered ? 'translateY(-60px)' : 'translateY(0)',
    opacity:    hovered ? 0 : 1,
    transition: hovered
      ? 'transform 220ms ease-in, opacity 220ms ease-in'
      : 'transform 220ms ease-out, opacity 220ms ease-out',
    transitionDelay: hovered ? '0ms' : '100ms',
  };

  const contentStyle: React.CSSProperties = {
    transform:  hovered ? 'translateY(-56px)' : 'translateY(0)',
    transition: hovered
      ? 'transform 280ms ease-out'
      : 'transform 280ms ease-in-out',
    transitionDelay: hovered ? '80ms' : '0ms',
  };

  const rowStyle = (enterDelay: number): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 8,
    opacity:         hovered ? 1 : 0,
    transition:      hovered ? 'opacity 300ms ease-out' : 'opacity 200ms ease-in',
    transitionDelay: hovered ? `${enterDelay}ms` : '0ms',
  });

  const circleStyle = (enterDelay: number): React.CSSProperties => ({
    width: 10, height: 10, borderRadius: '50%',
    backgroundColor: 'white', flexShrink: 0,
    filter:          hovered ? 'drop-shadow(0 0 4px rgba(255,255,255,0.85))' : 'none',
    transition:      hovered ? 'filter 300ms ease-out' : 'filter 200ms ease-in',
    transitionDelay: hovered ? `${enterDelay}ms` : '0ms',
  });

  return (
    <BentoItem
      className="flex flex-col"
      delay={delay}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      <div style={iconStyle_}>
        <IconWrap><Target style={iconStyle} /></IconWrap>
      </div>
      <div style={contentStyle}>
        <h3 className={titleStyle}>Lead Generation</h3>
        <p className="text-sm leading-relaxed" style={descStyle}>
          {t(
            "Qualifizierte Leads automatisch erfassen, bewerten und ins CRM übertragen.",
            "Automatically capture, score, and transfer qualified leads into your CRM.",
          )}
        </p>
      </div>

      {/* Checklist rows — absolute bottom, revealed space */}
      <div style={{
        position: 'absolute', bottom: 24, left: 24, right: 24,
        display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none',
      }}>
        {CHECK_DELAYS.map((d) => (
          <div key={d} style={rowStyle(d)}>
            <div style={circleStyle(d)} />
            <div style={{
              height: 8, borderRadius: 4,
              width: '70%', backgroundColor: 'white',
            }} />
          </div>
        ))}
      </div>
    </BentoItem>
  );
}

// ── Customer Support card ─────────────────────────────────────────────────────
function CustomerSupportCard({ delay }: { delay: number }) {
  const [hovered, setHovered] = useState(false);
  const { t } = useTranslation();

  const iconStyle_: React.CSSProperties = {
    transform:  hovered ? 'translateY(-60px)' : 'translateY(0)',
    opacity:    hovered ? 0 : 1,
    transition: hovered
      ? 'transform 220ms ease-in, opacity 220ms ease-in'
      : 'transform 220ms ease-out, opacity 220ms ease-out',
    transitionDelay: hovered ? '0ms' : '100ms',
  };

  const contentStyle: React.CSSProperties = {
    transform:  hovered ? 'translateY(-56px)' : 'translateY(0)',
    transition: hovered
      ? 'transform 280ms ease-out'
      : 'transform 280ms ease-in-out',
    transitionDelay: hovered ? '80ms' : '0ms',
  };

  const bubbleBase = (fromX: number, enterDelay: number): React.CSSProperties => ({
    transform:       hovered ? 'translateX(0)' : `translateX(${fromX}px)`,
    opacity:         hovered ? 1 : 0,
    transition:      hovered
      ? 'transform 250ms ease-out, opacity 250ms ease-out'
      : 'opacity 150ms ease-in, transform 150ms ease-in',
    transitionDelay: hovered ? `${enterDelay}ms` : '0ms',
  });

  const bubbleRect: React.CSSProperties = {
    height: 20,
    border: '1px solid rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  };

  return (
    <BentoItem
      className="flex flex-col"
      delay={delay}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      <div style={iconStyle_}>
        <IconWrap><MessageSquare style={iconStyle} /></IconWrap>
      </div>
      <div style={contentStyle}>
        <h3 className={titleStyle}>Customer Support</h3>
        <p className="text-sm leading-relaxed" style={descStyle}>
          {t(
            "KI beantwortet Kundenanfragen rund um die Uhr — präzise, auf Deutsch, nahtlos eskalierbar.",
            "AI answers customer enquiries around the clock — precise, in your language, seamlessly escalatable.",
          )}
        </p>
      </div>

      {/* Chat bubbles — sit in the space revealed by the icon exit */}
      <div style={{
        position: 'absolute', bottom: 24, left: 24, right: 24,
        display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none',
      }}>
        {/* Bubble 1 — left, tail bottom-left */}
        <div style={{ ...bubbleBase(-20, 400), marginTop: 32 }}>
          <div style={{ ...bubbleRect, width: '55%', borderRadius: '14px 14px 14px 3px' }} />
        </div>
        {/* Bubble 2 — right, tail bottom-right */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', ...bubbleBase(20, 580) }}>
          <div style={{ ...bubbleRect, width: '45%', borderRadius: '14px 14px 3px 14px', backgroundColor: 'rgba(255,255,255,1)', border: 'none' }} />
        </div>
      </div>
    </BentoItem>
  );
}

// ── Analyse & Reporting card ──────────────────────────────────────────────────
const BAR_HEIGHTS = [40, 65, 30, 80, 50, 90, 45];
const BAR_MAX     = Math.max(...BAR_HEIGHTS);

function AnalyseCard({ delay }: { delay: number }) {
  const [hovered, setHovered] = useState(false);
  const { t } = useTranslation();

  const iconStyle_: React.CSSProperties = {
    transform:  hovered ? 'translateY(-60px)' : 'translateY(0)',
    opacity:    hovered ? 0 : 1,
    transition: hovered
      ? 'transform 220ms ease-in, opacity 220ms ease-in'
      : 'transform 220ms ease-out, opacity 220ms ease-out',
    transitionDelay: hovered ? '0ms' : '100ms',
  };

  const contentStyle: React.CSSProperties = {
    transform:  hovered ? 'translateY(-56px)' : 'translateY(0)',
    transition: hovered
      ? 'transform 280ms ease-out'
      : 'transform 280ms ease-in-out',
    transitionDelay: hovered ? '80ms' : '0ms',
  };

  return (
    <BentoItem
      className="flex flex-col justify-between"
      delay={delay}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      <div>
        <div style={iconStyle_}>
          <IconWrap><BarChart3 style={iconStyle} /></IconWrap>
        </div>
        <div style={contentStyle}>
          <h3 className={titleStyle}>Analyse & Reporting</h3>
          <p className="text-sm" style={descStyle}>
            {t(
              "Live-Dashboards und automatische Reports — datenbasierte Entscheidungen ohne manuellen Aufwand.",
              "Live dashboards and automated reports — data-driven decisions without manual effort.",
            )}
          </p>
        </div>
      </div>

      {/* Bar chart — visible by default, grows on hover */}
      <div className="flex items-end gap-1 mt-4 h-16">
        {BAR_HEIGHTS.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm"
            style={{
              height: hovered ? `${Math.min(h * 1.35, 100)}%` : `${h * 0.25}%`,
              background: `rgba(255,255,255,${h === BAR_MAX ? 0.75 : 0.22})`,
              transition: 'height 350ms ease-out',
              transitionDelay: hovered ? `${i * 40}ms` : `${i * 20}ms`,
            }}
          />
        ))}
      </div>
    </BentoItem>
  );
}

// ── AI Schulung card — self-drawing line chart ────────────────────────────────
const CHART_PATH =
  "M 10,54 C 20,38 28,20 40,18 C 52,16 55,26 65,30 C 72,33 78,38 88,40 C 100,42 108,35 120,25 C 135,14 160,6 188,5";

function AISchulungCard({ delay }: { delay: number }) {
  const [hovered, setHovered] = useState(false);
  const [active,  setActive]  = useState(false);
  const hoverTimer  = useRef<ReturnType<typeof setTimeout>>(undefined);
  const arrowTimer  = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pathRef     = useRef<SVGPathElement>(null);
  const arrowRef    = useRef<SVGPolylineElement>(null);
  const dotMotRef   = useRef<SVGAnimationElement>(null);
  const dotOpRef    = useRef<SVGAnimationElement>(null);
  const { t }       = useTranslation();

  useEffect(() => {
    clearTimeout(hoverTimer.current);
    if (hovered) {
      hoverTimer.current = setTimeout(() => setActive(true), 380);
    } else {
      setActive(false);
    }
    return () => clearTimeout(hoverTimer.current);
  }, [hovered]);

  useEffect(() => {
    clearTimeout(arrowTimer.current);
    const path  = pathRef.current;
    const arrow = arrowRef.current;

    if (active && path) {
      const len = path.getTotalLength();
      path.style.transition      = 'none';
      path.style.strokeDasharray  = `${len}`;
      path.style.strokeDashoffset = `${len}`;

      requestAnimationFrame(() => requestAnimationFrame(() => {
        path.style.transition       = 'stroke-dashoffset 900ms ease-in-out';
        path.style.strokeDashoffset = '0';
        dotMotRef.current?.beginElement();
        dotOpRef.current?.beginElement();
      }));

      arrowTimer.current = setTimeout(() => {
        if (arrow) { arrow.style.transition = 'opacity 150ms ease-out'; arrow.style.opacity = '1'; }
      }, 810);
    } else {
      if (path) { path.style.transition = 'none'; path.style.strokeDashoffset = `${path.getTotalLength()}`; }
      if (arrow) { arrow.style.transition = 'none'; arrow.style.opacity = '0'; }
    }
    return () => clearTimeout(arrowTimer.current);
  }, [active]);

  const iconStyle_: React.CSSProperties = {
    transform:  hovered ? 'translateY(-60px)' : 'translateY(0)',
    opacity:    hovered ? 0 : 1,
    transition: hovered ? 'transform 220ms ease-in, opacity 220ms ease-in' : 'transform 220ms ease-out, opacity 220ms ease-out',
    transitionDelay: hovered ? '0ms' : '100ms',
  };
  const contentStyle: React.CSSProperties = {
    transform:  hovered ? 'translateY(-56px)' : 'translateY(0)',
    transition: hovered ? 'transform 280ms ease-out' : 'transform 280ms ease-in-out',
    transitionDelay: hovered ? '80ms' : '0ms',
  };

  return (
    <BentoItem
      className="flex flex-col"
      delay={delay}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      <div style={iconStyle_}>
        <IconWrap><GraduationCap style={iconStyle} /></IconWrap>
      </div>
      <div style={contentStyle}>
        <h3 className={titleStyle}>AI-Schulung</h3>
        <p className="text-sm leading-relaxed" style={descStyle}>
          {t(
            "Euer Team lernt, KI-Tools effektiv einzusetzen — praxisnah, auf euer Unternehmen zugeschnitten.",
            "Your team learns to use AI tools effectively — hands-on, tailored to your business.",
          )}
        </p>
      </div>

      {/* Line chart — absolute bottom, revealed space */}
      <div style={{
        position: 'absolute', bottom: 16, left: 24, right: 24,
        opacity: hovered ? 1 : 0,
        transition: 'opacity 200ms ease-in',
        pointerEvents: 'none',
      }}>
        <svg viewBox="0 0 200 62" fill="none" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
          <defs>
            <filter id="schulung-glow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Learning-curve path */}
          <path
            ref={pathRef}
            d={CHART_PATH}
            stroke="white" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ strokeDasharray: 300, strokeDashoffset: 300 }}
          />

          {/* Arrowhead at path end — fades in on completion */}
          <polyline
            ref={arrowRef}
            points="183,1 188,5 183,9"
            fill="none" stroke="white" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ opacity: 0 }}
          />

          {/* Glowing dot — travels along path via SMIL */}
          <circle r="4" fill="white" style={{ filter: 'url(#schulung-glow)' }}>
            <animateMotion
              ref={dotMotRef as React.RefObject<SVGAnimateMotionElement>}
              dur="0.9s" begin="indefinite" fill="freeze"
              path={CHART_PATH}
            />
            <animate
              ref={dotOpRef as React.RefObject<SVGAnimateElement>}
              attributeName="opacity"
              values="1;1;0" keyTimes="0;0.88;1"
              dur="0.9s" begin="indefinite" fill="freeze"
            />
          </circle>
        </svg>
      </div>
    </BentoItem>
  );
}

// ── Warp / Hyperspace card ────────────────────────────────────────────────────
function WarpCard({ delay }: { delay: number }) {
  const linesRef   = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const timers     = useRef<ReturnType<typeof setTimeout>[]>([]);
  const animating  = useRef(false);
  const { t }      = useTranslation();

  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  function sched(fn: () => void, ms: number) {
    timers.current.push(setTimeout(fn, ms));
  }

  function handleEnter() {
    if (animating.current) return;
    const box     = linesRef.current;
    const content = contentRef.current;
    if (!box || !content) return;
    animating.current = true;

    // Structured line definitions — top zone (above text) and bottom zone (below text)
    // [top%, left%, width%] — zones pushed further from text, more lines on the right
    const LINES: [number, number, number][] = [
      // top zone — 12 lines, tops 5%–26% (well clear of text)
      [  5,  4, 16 ],
      [  7, 50, 18 ],
      [  9, 20, 14 ],
      [ 11, 58, 16 ],
      [ 13,  8, 20 ],
      [ 15, 38, 14 ],
      [ 17, 64, 12 ],
      [ 19, 14, 18 ],
      [ 21, 44, 16 ],
      [ 23, 68, 14 ],
      [ 25, 28, 12 ],
      [ 27, 54, 20 ],
      // bottom zone — 12 lines, tops 73%–94%
      [ 73, 16, 18 ],
      [ 75, 55, 14 ],
      [ 77,  6, 16 ],
      [ 79, 46, 18 ],
      [ 81, 66, 12 ],
      [ 83, 24, 20 ],
      [ 85, 52, 14 ],
      [ 87, 10, 16 ],
      [ 89, 60, 18 ],
      [ 91, 34, 12 ],
      [ 93, 48, 20 ],
      [ 95, 18, 16 ],
    ];

    const STAGGER     = 45;   // ms between each line appearing
    const DRAW_DUR    = 460;  // each line draws in — slow & smooth
    const BUILD_END   = (LINES.length - 1) * STAGGER + DRAW_DUR + 80;
    const SHOOT_DUR   = 260;
    const LAUNCH_DELAY = BUILD_END + 60;

    const lineEls: HTMLDivElement[] = [];

    LINES.forEach(([top, left, width], i) => {
      sched(() => {
        const line = document.createElement('div');
        line.style.cssText = [
          'position:absolute',
          `top:${top}%`,
          `left:${left}%`,
          `width:${width}%`,
          'height:2px',
          'background:rgba(255,255,255,0.85)',
          'box-shadow:0 0 6px rgba(255,255,255,0.9),0 0 14px rgba(255,255,255,0.45)',
          'transform:scaleX(0)',
          'transform-origin:left',
          'opacity:0',
          'pointer-events:none',
          'will-change:transform,opacity',
        ].join(';');
        box.appendChild(line);
        lineEls.push(line);
        requestAnimationFrame(() => requestAnimationFrame(() => {
          line.style.transition = `transform ${DRAW_DUR}ms ease, opacity 90ms ease`;
          line.style.transform  = 'scaleX(1)';
          line.style.opacity    = '1';
        }));
      }, i * STAGGER);
    });

    // After all lines are drawn — shoot them all right off-screen together
    sched(() => {
      lineEls.forEach(line => {
        line.style.transition = `transform ${SHOOT_DUR}ms ease-in, opacity ${Math.round(SHOOT_DUR * 0.55)}ms ease-in`;
        line.style.transform  = 'translateX(1200px)';
        line.style.opacity    = '0';
      });
      sched(() => { lineEls.forEach(l => { l.parentNode && l.remove(); }); }, SHOOT_DUR + 60);
    }, BUILD_END);

    // Content launches right just after lines start shooting
    sched(() => {
      content.style.transition = 'transform 130ms ease-in, opacity 110ms ease-in';
      content.style.transform  = 'translateX(380px)';
      content.style.opacity    = '0';
    }, LAUNCH_DELAY);

    // Snap back, fade in
    sched(() => {
      content.style.transition = 'none';
      content.style.transform  = 'translateX(0)';
      content.style.opacity    = '0';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        content.style.transition = 'opacity 200ms ease-out';
        content.style.opacity    = '1';
        sched(() => { content.style.transition = ''; }, 220);
      }));
    }, LAUNCH_DELAY + 150);
  }

  function handleLeave() {
    animating.current = false;
  }

  return (
    <BentoItem
      className="lg:col-span-2 relative overflow-hidden flex items-center justify-center"
      delay={delay}
      onHoverStart={handleEnter}
      onHoverEnd={handleLeave}
    >
      <div ref={linesRef} className="absolute inset-0 pointer-events-none" />
      <div
        ref={contentRef}
        className="flex flex-col sm:flex-row sm:items-center gap-6"
        style={{ willChange: 'transform, opacity', position: 'relative', zIndex: 1 }}
      >
        <div className="shrink-0">
          <IconWrap><Sparkles style={{ ...iconStyle, color: "rgba(255,255,255,0.8)" }} /></IconWrap>
        </div>
        <div>
          <h3 className="text-base font-semibold text-white mb-1">
            {t("Maßgeschneiderte Projekte", "Custom Projects")}
          </h3>
          <p className="text-sm leading-relaxed" style={descStyle}>
            {t(
              "Kein Standard-Tool passt? Wir entwickeln genau das, was euer Unternehmen braucht — von der ersten Idee bis zur fertigen Lösung, vollständig auf eure Prozesse zugeschnitten.",
              "No standard tool fits? We build exactly what your business needs — from the first idea to the finished solution, fully tailored to your processes.",
            )}
          </p>
        </div>
      </div>
    </BentoItem>
  );
}

export const CyberneticBentoGrid = () => {
  const { t } = useTranslation();
  return (
    <section className="w-full py-32 px-8 md:px-16 lg:px-24" style={{ backgroundColor: "#0f0f0f" }}>
      <div className="max-w-6xl mx-auto">

        {/* ── Heading ── */}
        <motion.div className="mb-16" {...fadeUp(0)}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            {t("Was wir für dich bauen", "What we build for you")}
          </h2>
          <p className="text-lg max-w-xl" style={{ color: "rgba(255,255,255,0.4)" }}>
            {t("KI-Lösungen, die sofort wirken — von der ersten Website bis zum vollautomatischen Prozess.", "AI solutions that work immediately — from your first website to fully automated processes.")}
          </p>
        </motion.div>

        {/*
          4-Spalten-Grid, 3 Zeilen:
          Zeile 1: Website (2×2) | Workflows (1×1) | Analyse (1×1)
          Zeile 2: Website (2×2) | Customer Support (1×1) | Lead Gen (1×1)
          Zeile 3: Meeting (1×1) | Schulung (1×1) | Maßgeschneidert (2×1)
        */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[minmax(190px,auto)]">

          {/* 1. Websites — 2×2 featured */}
          <WebsitesCard delay={0} />

          {/* 2. AI Workflows */}
          <AIWorkflowsCard delay={0.07} />

          {/* 3. Analyse & Reporting */}
          <AnalyseCard delay={0.14} />

          {/* 4. Customer Support */}
          <CustomerSupportCard delay={0.21} />

          {/* 5. Lead Generation */}
          <LeadGenCard delay={0.28} />

          {/* 6. Meeting Zusammenfassung */}
          <MeetingCard delay={0.07} />

          {/* 7. AI Schulung */}
          <AISchulungCard delay={0.14} />

          {/* 8. Maßgeschneiderte Projekte — 2×1 wide */}
          <WarpCard delay={0.21} />

        </div>
      </div>
    </section>
  );
};
