"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
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
}: {
  className?: string;
  children: React.ReactNode;
  delay?: number;
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
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}
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
          <BentoItem className="lg:col-span-2 lg:row-span-2 flex flex-col justify-between" delay={0}>
            <div>
              <IconWrap><Globe style={iconStyle} /></IconWrap>
              <h3 className="text-xl font-bold text-white mb-3">
                {t("Moderne Websites mit KI", "Modern Websites with AI")}
              </h3>
              <p className="text-sm leading-relaxed" style={descStyle}>
                {t("Professionelle Unternehmenswebsites mit integrierter KI — intelligenter Chatbot, automatisierte Leaderfassung und personalisiertes Nutzererlebnis ab Tag 1.", "Professional business websites with integrated AI — smart chatbot, automated lead capture, and personalized user experience from day 1.")}
              </p>
            </div>
            {/* Browser mockup */}
            <div
              className="mt-6 rounded-xl overflow-hidden"
              style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <div
                className="flex items-center gap-1.5 px-3 py-2"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
              >
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.12)" }} />
                ))}
                <div
                  className="ml-2 flex-1 h-4 rounded-sm text-[10px] flex items-center px-2"
                  style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.25)" }}
                >
                  www.ihrUnternehmen.de
                </div>
              </div>
              <div className="p-4 space-y-2">
                <div className="h-3 w-2/3 rounded-sm" style={{ backgroundColor: "rgba(255,255,255,0.1)" }} />
                <div className="h-2 w-full rounded-sm" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
                <div className="h-2 w-4/5 rounded-sm" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
                <div className="mt-3 flex gap-2">
                  <div className="h-6 w-20 rounded-md" style={{ backgroundColor: "rgba(255,255,255,0.12)" }} />
                  <div className="h-6 w-16 rounded-md" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
                </div>
              </div>
            </div>
          </BentoItem>

          {/* 2. AI Workflows */}
          <BentoItem className="flex flex-col" delay={0.07}>
            <IconWrap><GitBranch style={iconStyle} /></IconWrap>
            <h3 className={titleStyle}>AI Workflows</h3>
            <p className="text-sm leading-relaxed" style={descStyle}>
              {t("Wiederkehrende Prozesse vollständig automatisieren — Angebote, Rechnungen, E-Mails, Berichte.", "Fully automate recurring processes — quotes, invoices, emails, reports.")}
            </p>
          </BentoItem>

          {/* 3. Analyse & Reporting */}
          <BentoItem className="flex flex-col justify-between" delay={0.14}>
            <div>
              <IconWrap><BarChart3 style={iconStyle} /></IconWrap>
              <h3 className={titleStyle}>Analyse & Reporting</h3>
              <p className="text-sm" style={descStyle}>
                {t("Live-Dashboards und automatische Reports — datenbasierte Entscheidungen ohne manuellen Aufwand.", "Live dashboards and automated reports — data-driven decisions without manual effort.")}
              </p>
            </div>
            {/* Mini chart */}
            <div className="flex items-end gap-1 mt-4 h-8">
              {[50, 70, 45, 85, 60, 90, 75].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm"
                  style={{ height: `${h}%`, background: `rgba(255,255,255,${0.1 + (h / 100) * 0.2})` }}
                />
              ))}
            </div>
          </BentoItem>

          {/* 4. Customer Support */}
          <BentoItem className="flex flex-col" delay={0.21}>
            <IconWrap><MessageSquare style={iconStyle} /></IconWrap>
            <h3 className={titleStyle}>Customer Support</h3>
            <p className="text-sm leading-relaxed" style={descStyle}>
              {t("KI beantwortet Kundenanfragen rund um die Uhr — präzise, auf Deutsch, nahtlos eskalierbar.", "AI answers customer enquiries around the clock — precise, in your language, seamlessly escalatable.")}
            </p>
          </BentoItem>

          {/* 5. Lead Generation */}
          <BentoItem className="flex flex-col" delay={0.28}>
            <IconWrap><Target style={iconStyle} /></IconWrap>
            <h3 className={titleStyle}>Lead Generation</h3>
            <p className="text-sm leading-relaxed" style={descStyle}>
              {t("Qualifizierte Leads automatisch erfassen, bewerten und ins CRM übertragen.", "Automatically capture, score, and transfer qualified leads into your CRM.")}
            </p>
          </BentoItem>

          {/* 6. Meeting Zusammenfassung */}
          <BentoItem className="flex flex-col" delay={0.07}>
            <IconWrap><Mic style={iconStyle} /></IconWrap>
            <h3 className={titleStyle}>Meeting-Zusammenfassung</h3>
            <p className="text-sm leading-relaxed" style={descStyle}>
              {t("Meetings automatisch transkribieren, zusammenfassen und Aufgaben direkt ins Projektmanagement übergeben.", "Automatically transcribe, summarise meetings, and push tasks directly into project management.")}
            </p>
          </BentoItem>

          {/* 7. AI Schulung */}
          <BentoItem className="flex flex-col" delay={0.14}>
            <IconWrap><GraduationCap style={iconStyle} /></IconWrap>
            <h3 className={titleStyle}>AI-Schulung</h3>
            <p className="text-sm leading-relaxed" style={descStyle}>
              {t("Euer Team lernt, KI-Tools effektiv einzusetzen — praxisnah, auf euer Unternehmen zugeschnitten.", "Your team learns to use AI tools effectively — hands-on, tailored to your business.")}
            </p>
          </BentoItem>

          {/* 8. Maßgeschneiderte Projekte — 2×1 wide */}
          <BentoItem className="lg:col-span-2 flex flex-col sm:flex-row sm:items-center gap-6" delay={0.21}>
            <div className="shrink-0">
              <IconWrap><Sparkles style={{ ...iconStyle, color: "rgba(255,255,255,0.8)" }} /></IconWrap>
            </div>
            <div>
              <h3 className="text-base font-semibold text-white mb-1">
                {t("Maßgeschneiderte Projekte", "Custom Projects")}
              </h3>
              <p className="text-sm leading-relaxed" style={descStyle}>
                {t("Kein Standard-Tool passt? Wir entwickeln genau das, was euer Unternehmen braucht — von der ersten Idee bis zur fertigen Lösung, vollständig auf eure Prozesse zugeschnitten.", "No standard tool fits? We build exactly what your business needs — from the first idea to the finished solution, fully tailored to your processes.")}
              </p>
            </div>
          </BentoItem>

        </div>
      </div>
    </section>
  );
};
