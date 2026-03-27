"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Bot } from "lucide-react";
import { Navbar } from "@/components/ui/navbar";
import { FooterComponent } from "@/components/ui/flickering-footer";
import { FlippingCard } from "@/components/ui/flipping-card";
import { useTranslation } from "@/lib/language-context";

// ── Floating stars decoration ─────────────────────────────────────────────────
function Stars() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
      {/* large star top-right */}
      <path d="M290,48 L295,62 L309,67 L295,72 L290,86 L285,72 L271,67 L285,62 Z"
        fill="rgba(255,255,255,0.55)" />
      {/* medium star mid-right */}
      <path d="M318,90 L321,99 L330,102 L321,105 L318,114 L315,105 L306,102 L315,99 Z"
        fill="rgba(255,255,255,0.35)" />
      {/* small star */}
      <path d="M270,30 L272,36 L278,38 L272,40 L270,46 L268,40 L262,38 L268,36 Z"
        fill="rgba(255,255,255,0.25)" />
      {/* tiny dot stars */}
      <circle cx="305" cy="40" r="2" fill="rgba(255,255,255,0.3)" />
      <circle cx="340" cy="70" r="1.5" fill="rgba(255,255,255,0.2)" />
      <circle cx="255" cy="55" r="1.5" fill="rgba(255,255,255,0.2)" />
    </svg>
  );
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] as const },
});

// ── Card fronts ───────────────────────────────────────────────────────────────
function FormFront() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col h-full w-full rounded-2xl overflow-hidden">
      {/* Gradient area with stars */}
      <div
        className="relative flex-1"
        style={{
          background:
            "radial-gradient(ellipse 80% 90% at 85% 30%, rgba(20,140,200,0.75) 0%, rgba(10,80,140,0.4) 45%, transparent 70%), #0d0d10",
        }}
      >
        <Stars />
      </div>

      {/* Text area */}
      <div className="p-7 pt-5">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
          style={{ backgroundColor: "rgba(30,160,220,0.18)" }}
        >
          <Mail style={{ width: 18, height: 18, color: "#38bdf8" }} />
        </div>
        <h3 className="text-base font-semibold text-white mb-2">
          {t("Kontaktformular", "Contact Form")}
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.42)" }}>
          {t(
            "Schreib uns dein Anliegen — wir melden uns innerhalb von 24 Stunden.",
            "Send us your request — we'll get back to you within 24 hours."
          )}
        </p>
      </div>
    </div>
  );
}

function CallFront() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col h-full w-full rounded-2xl overflow-hidden">
      {/* Gradient area with stars */}
      <div
        className="relative flex-1"
        style={{
          background:
            "radial-gradient(ellipse 80% 90% at 85% 30%, rgba(120,60,220,0.75) 0%, rgba(70,20,140,0.4) 45%, transparent 70%), #0d0d10",
        }}
      >
        <Stars />
      </div>

      {/* Text area */}
      <div className="p-7 pt-5">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
          style={{ backgroundColor: "rgba(120,60,220,0.18)" }}
        >
          <Bot style={{ width: 18, height: 18, color: "#a78bfa" }} />
        </div>
        <h3 className="text-base font-semibold text-white mb-2">
          {t("KI-Erstgespräch", "AI Discovery Call")}
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.42)" }}>
          {t(
            "Starte direkt ein KI-geführtes Erstgespräch — ohne Wartezeit, rund um die Uhr.",
            "Start an AI-guided discovery call instantly — no waiting, 24/7."
          )}
        </p>
      </div>
    </div>
  );
}

// ── Card backs ────────────────────────────────────────────────────────────────
function FormBack() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-8 gap-5">
      <p className="text-sm text-center leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
        {t(
          "Für alle, die lieber schreiben als telefonieren. Wir antworten innerhalb von 24 Stunden mit einem konkreten Vorschlag.",
          "For those who prefer writing over calling. We reply within 24 hours with a concrete proposal."
        )}
      </p>
      <a
        href="mailto:hallo@onvero.de"
        className="text-center font-semibold rounded-xl py-3 px-6 text-sm transition-all duration-200"
        style={{
          backgroundColor: "#ffffff",
          color: "#000000",
          boxShadow: "0 8px 32px rgba(255,255,255,0.12)",
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLAnchorElement).style.backgroundColor =
            "rgba(255,255,255,0.92)")
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLAnchorElement).style.backgroundColor =
            "#ffffff")
        }
      >
        {t("Nachricht schreiben →", "Send a message →")}
      </a>
    </div>
  );
}

function CallBack() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-8 gap-5">
      <p className="text-sm text-center leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
        {t(
          "Kein Termin nötig. Unser KI-Agent stellt die richtigen Fragen, damit wir sofort wissen, wie wir dir helfen können.",
          "No appointment needed. Our AI agent asks the right questions so we know exactly how to help you."
        )}
      </p>
      <button
        className="text-center font-semibold rounded-xl py-3 px-6 text-sm transition-all duration-200"
        style={{
          backgroundColor: "#ffffff",
          color: "#000000",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 8px 32px rgba(255,255,255,0.12)",
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
            "rgba(255,255,255,0.92)")
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
            "#ffffff")
        }
      >
        {t("KI-Gespräch starten →", "Start AI Call →")}
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function BuchenPage() {
  const { t } = useTranslation();

  return (
    <main style={{ backgroundColor: "#0f0f0f", minHeight: "100vh" }}>
      <Navbar />

      <section className="flex flex-col items-center justify-center px-5 md:px-8 pt-28 md:pt-40 pb-20 md:pb-32">
        {/* Headline */}
        <motion.div {...fadeUp(0)} className="text-center mb-12 md:mb-20">
          <p
            className="text-xs font-semibold tracking-[0.2em] uppercase mb-5"
            style={{ color: "rgba(255,255,255,0.28)" }}
          >
            {t("Erstgespräch · Kontakt · Jetzt starten", "Discovery · Contact · Start now")}
          </p>
          <h1
            className="font-bold tracking-tight"
            style={{ fontSize: "clamp(2.2rem, 5vw, 3.5rem)", lineHeight: 1.08 }}
          >
            <span className="block text-white">
              {t("Tritt mit uns", "Get in touch")}
            </span>
            <span className="block" style={{ color: "rgba(255,255,255,0.28)" }}>
              {t("in Kontakt", "with us")}
            </span>
          </h1>
          <p
            className="mt-5 text-base max-w-md mx-auto"
            style={{ color: "rgba(255,255,255,0.38)" }}
          >
            {t(
              "Wähle den Weg, der zu dir passt.",
              "Choose the way that works for you."
            )}
          </p>
        </motion.div>

        {/* Flip Cards */}
        <div className="flex flex-col md:flex-row gap-5 items-center justify-center w-full max-w-[760px]">
          <motion.div {...fadeUp(0.1)} className="w-full md:w-[362px] shrink-0">
            {/* gradient border wrapper — blue */}
            <div style={{
              padding: 1,
              borderRadius: 17,
              background: "linear-gradient(135deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.06) 45%, rgba(255,255,255,0.01) 100%)",
              boxShadow: "0 0 20px rgba(20,140,220,0.12), 0 8px 30px rgba(20,140,220,0.08)",
            }}>
              <FlippingCard
                frontContent={<FormFront />}
                backContent={<FormBack />}
                height={400}
              />
            </div>
          </motion.div>

          <motion.div {...fadeUp(0.18)} className="w-full md:w-[362px] shrink-0">
            {/* gradient border wrapper — purple */}
            <div style={{
              padding: 1,
              borderRadius: 17,
              background: "linear-gradient(135deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.06) 45%, rgba(255,255,255,0.01) 100%)",
              boxShadow: "0 0 20px rgba(120,60,220,0.14), 0 8px 30px rgba(120,60,220,0.09)",
            }}>
              <FlippingCard
                frontContent={<CallFront />}
                backContent={<CallBack />}
                height={400}
              />
            </div>
          </motion.div>
        </div>

        {/* Back link */}
        <motion.div {...fadeUp(0.25)} className="mt-16">
          <Link
            href="/"
            className="text-sm transition-colors duration-200"
            style={{ color: "rgba(255,255,255,0.25)" }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.color =
                "rgba(255,255,255,0.6)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.color =
                "rgba(255,255,255,0.25)")
            }
          >
            ← {t("Zurück zur Startseite", "Back to home")}
          </Link>
        </motion.div>
      </section>

      <FooterComponent />
    </main>
  );
}
