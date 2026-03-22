"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/language-context";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" } as const,
  transition: { duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] as const },
});

export function MetricsSection() {
  const { t } = useTranslation();

  const metrics = [
    { label: t("Zeitersparnis", "Time saved"),      value: "7.5h",  description: t("Pro Mitarbeiter pro Woche durch KI-Automatisierung", "Per employee per week through AI automation") },
    { label: t("Antwortzeit", "Response time"),     value: "60s",   description: t("Statt 4 Stunden — KI-Rezeptionist antwortet sofort", "Instead of 4 hours — AI receptionist responds instantly") },
    { label: t("Automatisierbar", "Automatable"),   value: "80%",   description: t("Der täglichen Routineaufgaben in typischen KMU-Prozessen", "Of daily routine tasks in typical SME processes") },
    { label: t("Umsetzung", "Time to launch"),      value: "3w",    description: t("Von Erstgespräch bis zur ersten laufenden KI-App", "From first call to your first running AI app") },
    { label: t("Kostenreduktion", "Cost reduction"),value: "40%",   description: t("Weniger Aufwand in Dokumenten- und Finanzprozessen", "Less effort in document and finance processes") },
    { label: t("Lead-Quote", "Lead rate"),          value: "3×",    description: t("Mehr qualifizierte Leads durch KI-gestützte Website und Chatbot", "More qualified leads via AI-powered website and chatbot") },
  ];

  return (
    <section
      className="w-full py-32 px-8 md:px-16 lg:px-24"
      style={{ backgroundColor: "#0f0f0f" }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 lg:gap-28 items-start">

          {/* ── LEFT: Text + CTAs ── */}
          <motion.div className="lg:sticky lg:top-32" {...fadeUp(0)}>
            {/* Headline */}
            <h2
              className="font-bold tracking-tight mb-8"
              style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)", lineHeight: 1.1 }}
            >
              <span className="block text-white">{t("Was konkret", "What you")}</span>
              <span className="block" style={{ color: "rgba(255,255,255,0.28)" }}>
                {t("bei dir rauskommt", "actually get")}
              </span>
            </h2>

            {/* Subtext */}
            <p
              className="text-base leading-relaxed mb-12 max-w-xs"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              {t("Keine Versprechen. Nur Ergebnisse, die messbar sind.", "No promises. Only results that are measurable.")}
            </p>

            {/* CTA Buttons — pill style */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                className="rounded-full px-7 py-5 text-sm font-semibold bg-white hover:bg-white/90 text-black border-0 transition-all duration-300 hover:-translate-y-0.5"
              >
                {t("Erstgespräch buchen", "Book a call")}
              </Button>
              <Button
                variant="ghost"
                className="rounded-full px-7 py-5 text-sm font-semibold bg-transparent border transition-all duration-300 hover:-translate-y-0.5 hover:bg-transparent"
                style={{
                  borderColor: "rgba(255,255,255,0.14)",
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                {t("Projekte ansehen", "See Projects")}
              </Button>
            </div>
          </motion.div>

          {/* ── RIGHT: 2×3 Metric Grid ── */}
          <div className="grid grid-cols-2 gap-px" style={{ background: "rgba(255,255,255,0.05)" }}>
            {metrics.map(({ label, value, description }, i) => (
              <motion.div
                key={label}
                className="flex flex-col justify-between p-8 group"
                style={{ backgroundColor: "#0f0f0f" }}
                {...fadeUp(0.05 + i * 0.07)}
              >
                {/* Label */}
                <p
                  className="text-xs font-medium tracking-wide mb-4"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  {label}
                </p>

                {/* Big number */}
                <p
                  className="font-bold tracking-tight leading-none mb-4"
                  style={{
                    fontSize: "clamp(2rem, 3.5vw, 2.75rem)",
                    color: "#ffffff",
                  }}
                >
                  {value}
                </p>

                {/* Description */}
                <p
                  className="text-xs leading-relaxed mb-5"
                  style={{ color: "rgba(255,255,255,0.38)" }}
                >
                  {description}
                </p>

                {/* Mehr erfahren link */}
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
