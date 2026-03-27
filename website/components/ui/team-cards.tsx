'use client';

import { useEffect, useRef } from 'react';

// ── Vision lines — each is one logical phrase rendered as a block span ────────
const VISION_LINES = [
  'Wir glauben, dass die Unternehmen, die morgen führen,',
  'nicht die größten sind —',
  'sondern die, die heute anfangen, smarter zu arbeiten.',
  'Onvero existiert, um diesen Schritt so einfach wie möglich zu machen.',
  'Nicht mit überkomplexen Systemen oder abstrakten Versprechen,',
  'sondern mit Lösungen, die sich in bestehende Workflows einfügen,',
  'sofort wirken und jeden Tag ein bisschen mehr abnehmen.',
  'Unsere Vision ist eine Welt, in der KI nicht das Werkzeug von Konzernen ist — sondern der stille Mitarbeiter jedes ambitionierten Unternehmens.',
];

function LinkedInIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="white" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function ConnectorSVG({ glowId, d }: { glowId: string; d: string }) {
  return (
    <svg
      data-connector=""
      viewBox="0 0 900 220"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    >
      <defs>
        <filter id={`glow-${glowId}`} x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
        </filter>
      </defs>
      <path className="guide" d={d} stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
      <path className="streak-glow" d={d} stroke="rgba(255,220,140,0.55)" strokeWidth="10"
        strokeLinecap="round" filter={`url(#glow-${glowId})`} opacity={0} />
      <path className="streak-core" d={d} stroke="rgba(255,255,255,0.92)" strokeWidth="2"
        strokeLinecap="round" opacity={0} />
    </svg>
  );
}

function Portrait({ src, alt, href }: { src: string; alt: string; href: string }) {
  return (
    <div className="flex-shrink-0 relative" style={{ width: 300 }}>
      <img
        src={src}
        alt={alt}
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
          borderRadius: 8,
        }}
      />
      <a
        href={href}
        className="absolute bottom-3 right-3 w-8 h-8 rounded flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
        aria-label="LinkedIn"
      >
        <LinkedInIcon />
      </a>
    </div>
  );
}

export function TeamCards() {
  const sectionRef     = useRef<HTMLElement>(null);
  const visionWrapRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section    = sectionRef.current;
    const visionWrap = visionWrapRef.current;
    if (!section) return;

    const fades     = Array.from(section.querySelectorAll<HTMLElement>('[data-fade]'));
    const connSVGs  = Array.from(section.querySelectorAll<SVGSVGElement>('[data-connector]'));
    const lineSpans = Array.from(section.querySelectorAll<HTMLElement>('[data-line]'));

    fades.forEach(el => { el.style.transition = 'opacity 0.25s ease'; });

    // ── Connector streak setup ────────────────────────────────────────────────
    const STREAK = 120;

    type ConnCache = { glow: SVGPathElement; core: SVGPathElement; len: number } | null;

    const connCache: ConnCache[] = connSVGs.map(svg => {
      const guide = svg.querySelector<SVGPathElement>('.guide');
      const glow  = svg.querySelector<SVGPathElement>('.streak-glow');
      const core  = svg.querySelector<SVGPathElement>('.streak-core');
      if (!guide || !glow || !core) return null;
      const len = guide.getTotalLength();
      const da  = `${STREAK} ${len + STREAK}`;
      glow.setAttribute('stroke-dasharray', da);
      glow.setAttribute('stroke-dashoffset', `${STREAK}`);
      glow.setAttribute('opacity', '1');
      core.setAttribute('stroke-dasharray', da);
      core.setAttribute('stroke-dashoffset', `${STREAK}`);
      core.setAttribute('opacity', '1');
      return { glow, core, len };
    });

    // Cache wrapper measurements once — avoids getBoundingClientRect in the hot scroll path
    // and sidesteps sticky-element layout quirks.
    const visionAbsTop  = visionWrap ? visionWrap.getBoundingClientRect().top + window.scrollY : 0;
    const visionHeight  = visionWrap ? visionWrap.offsetHeight : 1;

    function tick() {
      const vh = window.innerHeight;
      const sy = window.scrollY;

      // 1. Fade-in for team text blocks
      fades.forEach(el => {
        const r = el.getBoundingClientRect();
        const t = Math.max(0, Math.min(1, (vh * 0.95 - r.top) / (vh * 0.5)));
        el.style.opacity = `${0.2 + t * 0.8}`;
      });

      // 3. Connector streaks
      connSVGs.forEach((svg, i) => {
        const c = connCache[i];
        if (!c) return;
        const r = svg.getBoundingClientRect();
        const p = Math.max(0, Math.min(1, (vh - r.top) / (r.height + vh)));
        const offset = STREAK - p * c.len;
        c.glow.setAttribute('stroke-dashoffset', `${offset}`);
        c.core.setAttribute('stroke-dashoffset', `${offset}`);
      });

      // 4. Vision lines — progress based on absolute scrollY, not getBoundingClientRect
      //    progress 0 = wrapper top just entered viewport bottom
      //    progress 1 = wrapper has fully scrolled through
      if (lineSpans.length > 0) {
        const progress    = Math.max(0, Math.min(1, (sy - visionAbsTop + vh) / visionHeight));
        const ENTRY       = 0.2; // first 20 % = entrance, all lines dim
        const lineProgress = Math.max(0, (progress - ENTRY) / (1 - ENTRY));

        lineSpans.forEach((line, i) => {
          line.style.opacity = lineProgress >= i / lineSpans.length ? '1' : '0.15';
        });
      }
    }

    window.addEventListener('scroll', tick, { passive: true });
    tick();
    return () => window.removeEventListener('scroll', tick);
  }, []);

  return (
    <section ref={sectionRef} style={{ backgroundColor: '#0f0f0f' }}>

      {/* ── Card 1: Jan Fahlbusch ───────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-8 md:px-16 pt-36 pb-12">
        <div className="flex flex-col md:flex-row gap-16 md:gap-28 items-start">
          <Portrait
            src="/Jan.jpg"
            alt="Jan Fahlbusch"
            href="#"
          />
          <div className="pt-3">
            <p data-fade="" className="text-xs font-semibold tracking-[0.18em] uppercase mb-2"
              style={{ color: 'rgba(255,255,255,0.35)', opacity: 0.2 }}>
              Head of Product
            </p>
            <h2 data-fade="" className="font-bold text-white mb-5"
              style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.05, opacity: 0.2 }}>
              Jan Fahlbusch
            </h2>
            <p data-fade="" className="text-sm leading-relaxed max-w-md"
              style={{ color: 'rgba(255,255,255,0.5)', opacity: 0.2 }}>
              [Placeholder — Jan&apos;s bio text here]
            </p>
          </div>
        </div>
      </div>

      {/* ── Connector 1 ─────────────────────────────────────────────────────── */}
      <div className="relative w-full" style={{ height: 220 }}>
        <ConnectorSVG glowId="a" d="M 270 0 C 270 110 680 110 680 220" />
      </div>

      {/* ── Card 2: Hans Lacher ─────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-8 md:px-16 pt-12 pb-12">
        <div className="flex flex-col-reverse md:flex-row gap-16 md:gap-28 items-start">
          <div className="flex-1 min-w-0">
            <p data-fade="" className="text-xs font-semibold tracking-[0.18em] uppercase mb-2"
              style={{ color: 'rgba(255,255,255,0.35)', opacity: 0.2 }}>
              Head of Enterprise
            </p>
            <h2 data-fade="" className="font-bold text-white mb-5"
              style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.05, opacity: 0.2 }}>
              Hans Lacher
            </h2>
            <p data-fade="" className="text-sm leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.5)', opacity: 0.2 }}>
              Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy
              eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam
              voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita
              kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.
              Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy
              eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam
              voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita
              kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.
            </p>
          </div>
          <Portrait
            src="/Hans.jpeg"
            alt="Hans Lacher"
            href="#"
          />
        </div>
      </div>

      {/* ── Connector 2 ─────────────────────────────────────────────────────── */}
      <div className="relative w-full" style={{ height: 220 }}>
        <ConnectorSVG glowId="b" d="M 630 0 C 630 110 220 110 220 220" />
      </div>

      {/* ── Unsere Vision ───────────────────────────────────────────────────── */}
      {/*
        Outer wrapper is 280 vh tall — gives scroll room for:
        - 20 % entry phase  (~56 vh): text arrives and sits centered, all lines dim
        - 80 % reveal phase (~224 vh / 8 lines ≈ 28 vh per line)
        Inner content is sticky so the text block stays centered in the
        viewport while the wrapper scrolls underneath it.
      */}
      <div
        ref={visionWrapRef}
        style={{ minHeight: '280vh', position: 'relative' }}
      >
        <div
          className="sticky"
          style={{ top: 'calc(50vh - 220px)', paddingBottom: '4rem' }}
        >
          <div className="max-w-7xl mx-auto px-8 md:px-16">
            <h2
              className="font-bold text-white"
              style={{ fontSize: '2.5rem', lineHeight: 1.1, marginBottom: '2rem' }}
            >
              Unsere Vision
            </h2>

            <p style={{ fontSize: 'clamp(1.3rem, 2.2vw, 1.8rem)', lineHeight: 1.9, color: '#ffffff', margin: 0 }}>
              {VISION_LINES.map((line, i) => (
                <span
                  key={i}
                  data-line=""
                  style={{ display: 'block', opacity: 0.15, transition: 'opacity 0.5s ease-out' }}
                >
                  {line}
                </span>
              ))}
            </p>
          </div>
        </div>
      </div>

    </section>
  );
}
