"use client";

import { Timeline } from "@/components/ui/timeline";
import { useTranslation } from "@/lib/language-context";

export function TimelineSection() {
  const { t } = useTranslation();

  const timelineData = [
    {
      title: t("Erstgespräch", "Initial Meeting"),
      content: (
        <div>
          <p className="text-sm md:text-base font-normal mb-6" style={{ color: "rgba(255,255,255,0.6)" }}>
            {t(
              "Wir lernen dein Unternehmen kennen — deine Ziele, Prozesse und Herausforderungen. Kein technisches Vorwissen nötig.",
              "We get to know your business — your goals, processes, and challenges. No technical knowledge required."
            )}
          </p>
          <div className="space-y-2">
            {[
              t("30 Minuten kostenlos & unverbindlich", "30 minutes, free & non-binding"),
              t("Analyse deiner aktuellen Prozesse", "Analysis of your current processes"),
              t("Erste KI-Potenziale identifizieren", "Identify first AI opportunities"),
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "rgba(255,255,255,0.35)" }} />
                {item}
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: t("Konzept", "Concept"),
      content: (
        <div>
          <p className="text-sm md:text-base font-normal mb-3" style={{ color: "rgba(255,255,255,0.6)" }}>
            {t(
              "Wir entwickeln eine maßgeschneiderte KI-Strategie für dein Unternehmen — mit konkretem Umsetzungsplan und Zeitrahmen.",
              "We develop a tailor-made AI strategy for your business — with a concrete implementation plan and timeline."
            )}
          </p>
          <p className="text-sm md:text-base font-normal mb-6" style={{ color: "rgba(255,255,255,0.45)" }}>
            {t(
              "Wir analysieren deine bestehenden Datenstrukturen und Prozesse und bauen das Konzept darauf auf, nicht an ihr vorbei.",
              "We analyze your existing data structures and processes and build the concept on top of them, not around them."
            )}
          </p>
          <div className="space-y-2">
            {[
              t("Individuelle KI-Roadmap", "Individual AI roadmap"),
              t("Technischer Architekturplan", "Technical architecture plan"),
              t("Klare Kosten- und Zeitplanung", "Clear cost and time planning"),
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "rgba(255,255,255,0.35)" }} />
                {item}
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: t("Umsetzung", "Implementation"),
      content: (
        <div>
          <p className="text-sm md:text-base font-normal mb-6" style={{ color: "rgba(255,255,255,0.6)" }}>
            {t(
              "Unser Team entwickelt und implementiert alle KI-Systeme — schnell, professionell und mit laufenden Updates.",
              "Our team develops and implements all AI systems — fast, professional, and with ongoing updates."
            )}
          </p>
          <div className="space-y-2">
            {[
              t("Agile Entwicklung in 2–4 Wochen", "Agile development in 2–4 weeks"),
              t("Wöchentliche Status-Updates", "Weekly status updates"),
              t("Vollständige Integration in bestehende Systeme", "Full integration into existing systems"),
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "rgba(255,255,255,0.35)" }} />
                {item}
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: t("Launch & Support", "Launch & Support"),
      content: (
        <div>
          <p className="text-sm md:text-base font-normal mb-3" style={{ color: "rgba(255,255,255,0.6)" }}>
            {t(
              "Alle aufgebauten Prozesse werden in dein persönliches BusinessOS zusammengeführt — dein digitaler Business Agent ist ab sofort einsatzbereit.",
              "All built processes are merged into your personal BusinessOS — your digital business agent is ready to go."
            )}
          </p>
          <p className="text-sm md:text-base font-normal mb-6" style={{ color: "rgba(255,255,255,0.45)" }}>
            {t(
              "Du erhältst deine Zugangsdaten für das BusinessOS und kannst sofort loslegen. Wir bleiben an deiner Seite mit persönlichem Support.",
              "You receive your BusinessOS login credentials and can get started immediately. We stay by your side with personal support."
            )}
          </p>
          <div className="space-y-2">
            {[
              t("Übergabe deines digitalen Business Agenten", "Handover of your digital business agent"),
              t("Zugangsdaten & Onboarding ins BusinessOS", "Login credentials & BusinessOS onboarding"),
              t("Persönlicher Support & laufende Optimierung", "Personal support & ongoing optimization"),
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "rgba(255,255,255,0.35)" }} />
                {item}
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ];

  return <Timeline data={timelineData} />;
}
