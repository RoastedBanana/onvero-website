"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/language-context";

function FloatingPaths({ position }: { position: number }) {
  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
      380 - i * 5 * position
    } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
      152 - i * 5 * position
    } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
      684 - i * 5 * position
    } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    width: 0.5 + i * 0.03,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* viewBox extended to 700 so curves that reach y≈875 are visible further down */}
      <svg
        className="w-full h-full text-white"
        viewBox="0 0 696 700"
        preserveAspectRatio="xMidYMin slice"
        fill="none"
      >
        <title>Background Paths</title>
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={0.04 + path.id * 0.01}
            initial={{ pathLength: 0.3, opacity: 0.6 }}
            animate={{
              pathLength: 1,
              opacity: [0.3, 0.6, 0.3],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: 20 + Math.random() * 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
        ))}
      </svg>
    </div>
  );
}

export function BackgroundPaths() {
  const { scrollY } = useScroll();
  const { t, lang } = useTranslation();

  // position: fixed means the element is already anchored to the viewport — no counteraction needed.
  // Phase 1 (0 → ~700px, hero height): y stays at 0, paths appear completely fixed.
  // Phase 2 (700px → ~2000px, reaching timeline): paths slide off the top (negative y).
  const pathsY = useTransform(scrollY, [0, 700, 2000], [0, 0, -800]);

  return (
    <div
      className="relative min-h-screen w-full flex items-center justify-center"
      style={{ backgroundColor: "#0f0f0f" }}
    >
      {/* Fixed background — z-index 0 so subsequent sections (z-index 1) cover it */}
      <motion.div
        className="fixed inset-0 pointer-events-none"
        style={{
          y: pathsY,
          zIndex: 0,
          maskImage:
            "linear-gradient(to bottom, black 30%, rgba(0,0,0,0.45) 60%, transparent 82%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 30%, rgba(0,0,0,0.45) 60%, transparent 82%)",
        }}
      >
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
      </motion.div>

      {/* Hero content — above the fixed paths */}
      <div
        className="relative w-full px-8 md:px-16 lg:px-24 flex items-center gap-16"
        style={{ zIndex: 10 }}
      >
        {/* Left: Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="flex-shrink-0 w-full max-w-xl"
        >
          <h1
            className="mb-6 text-white leading-[1.05]"
            style={{ fontSize: "clamp(2.2rem, 4.5vw, 4.5rem)" }}
          >
            {[
              lang === "de"
                ? <>Dein Unternehmen hat jetzt ein <em style={{ fontFamily: "TimesNewRomanPSMT,'Times New Roman',Times,serif", fontStyle: "italic", letterSpacing: "0.02em" }}>KI-Betriebssystem</em></>
                : <>Your business now has an <em style={{ fontFamily: "TimesNewRomanPSMT,'Times New Roman',Times,serif", fontStyle: "italic", letterSpacing: "0.02em" }}>AI operating system</em></>,
            ].map((line, lineIndex) => (
              <span key={lineIndex} className="block overflow-hidden">
                <motion.span
                  className="block font-bold tracking-tight"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  transition={{
                    delay: lineIndex * 0.22,
                    duration: 0.9,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="text-lg md:text-xl mb-10 leading-relaxed"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            {t("Keine isolierten Tools mehr. Wir bauen maßgeschneiderte KI-Workflows, die miteinander sprechen — und verbinden sie zu einer Infrastruktur, die dein Unternehmen wirklich voranbringt.", "No more isolated tools. We build custom AI workflows that talk to each other — and connect them into an infrastructure that truly drives your business forward.")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button asChild className="rounded-xl px-8 py-6 text-base font-semibold bg-white hover:bg-white/90 text-black border-0 shadow-lg shadow-white/10 transition-all duration-300 hover:-translate-y-0.5">
              <Link href="/buchen">{t("Kostenloses Erstgespräch →", "Free Intro Call →")}</Link>
            </Button>
            <div
              className="inline-block group p-px rounded-xl overflow-hidden"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              <Button
                variant="ghost"
                asChild
                className="rounded-[0.65rem] px-8 py-6 text-base font-semibold bg-transparent hover:bg-white/5 transition-all duration-300 group-hover:-translate-y-0.5 border-0"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                <Link href="/#leistungen">{t("Leistungen ansehen ↓", "See Services ↓")}</Link>
              </Button>
            </div>
          </motion.div>
        </motion.div>

        {/* Right: Dashboard screenshot — 3D tilted, overflows right */}
        <motion.div
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="hidden lg:block flex-1 min-w-0"
          style={{
            marginRight: '-48rem',
            marginTop: '4rem',
            perspective: '1200px',
          }}
        >
          {/* Ambient glow behind the card */}
          <div style={{
            position: 'absolute',
            inset: '10% 0 10% 10%',
            background: 'radial-gradient(ellipse at 60% 50%, rgba(120,120,255,0.12) 0%, rgba(80,80,200,0.06) 50%, transparent 80%)',
            filter: 'blur(40px)',
            zIndex: 0,
            pointerEvents: 'none',
          }} />

          <div
            style={{
              position: 'relative',
              zIndex: 1,
              transform: 'rotateY(-18deg) rotateX(6deg)',
              transformStyle: 'preserve-3d',
              borderRadius: '14px',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: `
                -40px 40px 100px rgba(0,0,0,0.8),
                -8px 8px 32px rgba(0,0,0,0.5),
                inset 0 1px 0 rgba(255,255,255,0.08)
              `,
              background: '#111',
            }}
          >
            <Image
              src="/dashboard-preview.png"
              alt="Dashboard Vorschau"
              width={1200}
              height={800}
              priority
              style={{
                width: '100%',
                display: 'block',
                minHeight: 520,
                objectFit: 'cover',
                objectPosition: 'top left',
              }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
