"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/language-context";

// ── CountUp ───────────────────────────────────────────────────────────────────
function parseValue(value: string): { num: number; suffix: string; decimals: number } {
  const match = value.match(/^(\d+\.?\d*)(.*)$/);
  if (!match) return { num: 0, suffix: value, decimals: 0 };
  const num = parseFloat(match[1]);
  const decimals = match[1].includes(".") ? match[1].split(".")[1].length : 0;
  return { num, suffix: match[2], decimals };
}

function CountUp({ value, duration = 1600 }: { value: string; duration?: number }) {
  const { num, suffix, decimals } = parseValue(value);
  const [display, setDisplay] = useState("0");
  const ref = useRef<HTMLSpanElement>(null);
  const fired = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || fired.current) return;
        fired.current = true;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          const current = eased * num;
          setDisplay(decimals > 0 ? current.toFixed(decimals) : Math.floor(current).toString());
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [num, decimals, duration]);

  return <span ref={ref}>{display}{suffix}</span>;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function MetricsSection() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const textFired  = useRef(false);
  const textRefs    = useRef<(HTMLElement | null)[]>([null, null, null]);

  const metrics = [
    { label: t("Zeitersparnis", "Time saved"),       value: "7.5h", description: t("Pro Mitarbeiter pro Woche durch KI-Automatisierung", "Per employee per week through AI automation") },
    { label: t("Antwortzeit", "Response time"),      value: "60s",  description: t("Statt 4 Stunden — KI-Rezeptionist antwortet sofort", "Instead of 4 hours — AI receptionist responds instantly") },
    { label: t("Automatisierbar", "Automatable"),    value: "80%",  description: t("Der täglichen Routineaufgaben in typischen KMU-Prozessen", "Of daily routine tasks in typical SME processes") },
    { label: t("Umsetzung", "Time to launch"),       value: "3w",   description: t("Von Erstgespräch bis zur ersten laufenden KI-App", "From first call to your first running AI app") },
    { label: t("Kostenreduktion", "Cost reduction"), value: "40%",  description: t("Weniger Aufwand in Dokumenten- und Finanzprozessen", "Less effort in document and finance processes") },
    { label: t("Lead-Quote", "Lead rate"),           value: "3×",   description: t("Mehr qualifizierte Leads durch KI-gestützte Website und Chatbot", "More qualified leads via AI-powered website and chatbot") },
  ];

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // ── Initial hidden state for blur-in ────────────────────────────────────
    textRefs.current.forEach((el) => {
      if (!el) return;
      el.style.opacity = "0";
      el.style.filter  = "blur(8px)";
    });

    let rafId = 0;
    const tick = () => {
      rafId = 0;
      const sRect = section.getBoundingClientRect();
      const viewH = window.innerHeight;
      if (sRect.top < viewH && !textFired.current) {
        textFired.current = true;
        textRefs.current.forEach((el, i) => {
          if (!el) return;
          el.style.transition = `opacity 700ms ease-out ${i * 160}ms, filter 700ms ease-out ${i * 160}ms`;
          el.style.opacity    = "1";
          el.style.filter     = "blur(0px)";
        });
      }
    };

    const onScroll = () => { if (!rafId) rafId = requestAnimationFrame(tick); };
    window.addEventListener("scroll", onScroll, { passive: true });
    requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="w-full pb-16 px-8 md:px-16 lg:px-24"
      style={{ backgroundColor: "#0f0f0f", paddingTop: "24rem" }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 lg:gap-28 items-start">

          {/* ── LEFT: Text + CTAs — blur-in + CSS sticky centred ── */}
          <div style={{ position: "sticky", top: "50%", transform: "translateY(-50%)", alignSelf: "start" }}>
            <h2
              ref={(el) => { textRefs.current[0] = el; }}
              className="font-bold tracking-tight mb-8"
              style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)", lineHeight: 1.1 }}
            >
              <span className="block text-white">{t("Was konkret", "What you")}</span>
              <span className="block" style={{ color: "rgba(255,255,255,0.28)" }}>
                {t("bei dir rauskommt", "actually get")}
              </span>
            </h2>

            <p
              ref={(el) => { textRefs.current[1] = el; }}
              className="text-base leading-relaxed mb-12 max-w-xs"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              {t("Keine Versprechen. Nur Ergebnisse, die messbar sind.", "No promises. Only results that are measurable.")}
            </p>

            <div ref={(el) => { textRefs.current[2] = el; }} className="flex flex-col sm:flex-row gap-3">
              <Button
                asChild
                className="rounded-full px-7 py-5 text-sm font-semibold bg-white hover:bg-white/90 text-black border-0 transition-all duration-300 hover:-translate-y-0.5"
              >
                <Link href="/buchen">{t("Erstgespräch buchen", "Book a call")}</Link>
              </Button>
              <Button
                variant="ghost"
                className="rounded-full px-7 py-5 text-sm font-semibold bg-transparent border transition-all duration-300 hover:-translate-y-0.5 hover:bg-transparent"
                style={{ borderColor: "rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.6)" }}
              >
                {t("Projekte ansehen", "See Projects")}
              </Button>
            </div>
          </div>

          {/* ── RIGHT: 2×3 Metric Grid ── */}
          <div className="grid grid-cols-2 gap-px" style={{ background: "rgba(255,255,255,0.05)" }}>
            {metrics.map(({ label, value, description }, i) => (
              <motion.div
                key={label}
                className="flex flex-col justify-between p-8 group"
                style={{ backgroundColor: "#0f0f0f" }}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.65, delay: 0.05 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="text-xs font-medium tracking-wide mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {label}
                </p>
                <p
                  className="font-bold tracking-tight leading-none mb-4"
                  style={{ fontSize: "clamp(2rem, 3.5vw, 2.75rem)", color: "#ffffff" }}
                >
                  <CountUp value={value} duration={1400 + i * 100} />
                </p>
                <p className="text-xs leading-relaxed mb-5" style={{ color: "rgba(255,255,255,0.38)" }}>
                  {description}
                </p>
                <a
                  href="#"
                  className="text-xs font-medium transition-colors duration-200 w-fit"
                  style={{ color: "rgba(255,255,255,0.25)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.65)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}
                >
                  {t("Mehr erfahren →", "Learn more →")}
                </a>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
