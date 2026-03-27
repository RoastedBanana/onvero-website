"use client";

import { motion } from "framer-motion";
import { Globe, GitBranch, BarChart3, FileText, TrendingUp } from "lucide-react";
import DisplayCards from "@/components/ui/display-cards";
import { useTranslation } from "@/lib/language-context";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" } as const,
  transition: { duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] as const },
});


export function ProjectsSection() {
  const { t } = useTranslation();

  const projects = [
    {
      icon: <Globe style={{ width: 14, height: 14, color: "rgba(255,255,255,0.7)" }} />,
      title: t("KI-Website & Chatbot", "AI Website & Chatbot"),
      description: t("Leadgenerierung um 3× gesteigert", "Lead generation increased 3×"),
      date: t("Handelsunternehmen · 2024", "Retail company · 2024"),
    },
    {
      icon: <GitBranch style={{ width: 14, height: 14, color: "rgba(255,255,255,0.7)" }} />,
      title: t("Workflow-Automatisierung", "Workflow Automation"),
      description: t("7,5 Std. Zeitersparnis pro Mitarbeiter/Woche", "7.5 hrs saved per employee/week"),
      date: t("Kanzlei · 2024", "Law firm · 2024"),
    },
    {
      icon: <BarChart3 style={{ width: 14, height: 14, color: "rgba(255,255,255,0.7)" }} />,
      title: t("BusinessOS Integration", "BusinessOS Integration"),
      description: t("80 % der Routineprozesse automatisiert", "80% of routine processes automated"),
      date: t("Agentur · 2025", "Agency · 2025"),
    },
    {
      icon: <FileText style={{ width: 14, height: 14, color: "rgba(255,255,255,0.7)" }} />,
      title: t("KI-Dokumentenanalyse", "AI Document Analysis"),
      description: t("Bearbeitungszeit um 65 % reduziert", "Processing time reduced by 65%"),
      date: t("Versicherung · 2024", "Insurance · 2024"),
    },
    {
      icon: <TrendingUp style={{ width: 14, height: 14, color: "rgba(255,255,255,0.7)" }} />,
      title: t("Automatisiertes Reporting", "Automated Reporting"),
      description: t("Tagesberichte ohne manuellen Aufwand", "Daily reports without manual effort"),
      date: t("E-Commerce · 2025", "E-Commerce · 2025"),
    },
  ];

  return (
    <section
      className="w-full py-32 px-8 md:px-16 lg:px-24"
      style={{ backgroundColor: "#0f0f0f" }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-20 lg:gap-24 items-center">

          {/* ── LEFT: Text ── */}
          <motion.div {...fadeUp(0)}>
            <p
              className="text-xs font-semibold tracking-[0.2em] uppercase mb-5"
              style={{ color: "rgba(255,255,255,0.28)" }}
            >
              {t("Referenzen · Ergebnisse · Vertrauen", "References · Results · Trust")}
            </p>
            <h2
              className="font-bold tracking-tight mb-6"
              style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)", lineHeight: 1.1 }}
            >
              <span className="block text-white">{t("Unsere", "Our")}</span>
              <span className="block" style={{ color: "rgba(255,255,255,0.28)" }}>
                {t("Projekte", "Projects")}
              </span>
            </h2>
            <p
              className="text-base leading-relaxed mb-10 max-w-sm"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              {t(
                "Jedes Projekt ist ein Beweis: KI funktioniert — wenn sie richtig eingesetzt wird. Hier sind einige der Lösungen, die wir für unsere Kunden gebaut haben.",
                "Every project is proof: AI works — when it's applied correctly. Here are some of the solutions we've built for our clients."
              )}
            </p>
            <a
              href="#chatbot"
              className="inline-flex items-center gap-2 text-sm font-medium transition-colors duration-200"
              style={{ color: "rgba(255,255,255,0.45)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
            >
              {t("Projekt anfragen →", "Request a project →")}
            </a>
          </motion.div>

          {/* ── RIGHT: Stacked cards + button ── */}
          <motion.div
            {...fadeUp(0.15)}
            className="flex flex-col items-start justify-center pt-8 pb-64 overflow-hidden"
          >
            <DisplayCards cards={projects} />

            <div className="mt-6 ml-0 sm:mt-16 sm:ml-[100px]">
              <a
                href="#chatbot"
                className="inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-xl transition-all duration-200"
                style={{
                  color: "rgba(255,255,255,0.45)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#ffffff";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "rgba(255,255,255,0.45)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                }}
              >
                {t("Alle Projekte ansehen →", "View all projects →")}
              </a>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
