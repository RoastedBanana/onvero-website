"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "@/lib/language-context";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" } as const,
  transition: { duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] as const },
});

const TESTIMONIALS = [
  {
    quote:
      "Ich war ehrlich gesagt skeptisch. KI klang nach etwas für große Konzerne, nicht für eine Kanzlei mit 12 Leuten. Aber seit wir den KI-Assistenten auf der Website haben, klingelt das Telefon nur noch für die Dinge die wirklich meine Zeit brauchen. Die ganzen 'Was kostet eine Steuererklärung' Anrufe sind einfach weg.",
    name: "Thomas Bergmann",
    role: "Geschäftsführer",
    company: "Bergmann Steuerberatung, Hannover",
    tags: ["KI-Website", "KI-Chatbot"],
    avatarColor: "#4285F4",
  },
  {
    quote:
      "Wir haben jeden Montag eine Stunde damit verbracht Termine zu koordinieren, Absagen zu bearbeiten und Erinnerungen rauszuschicken. Das klingt nach wenig bis man merkt dass das 50 Stunden im Jahr sind. Jetzt läuft das alles von alleine und ich habe das Gefühl meine Praxis ist plötzlich größer als sie ist.",
    name: "Sandra Kühl",
    role: "Inhaberin",
    company: "Kühl Physiotherapie, Freiburg",
    tags: ["Workflow-Automatisierung"],
    avatarColor: "#34A853",
  },
  {
    quote:
      "Wir bauen Stahlkonstruktionen, keine Software. Ich hätte nie gedacht dass KI für uns relevant ist. Aber unser Angebotsprozess hat sich von zwei Tagen auf zwei Stunden verkürzt. Konkret. Messbar. Ich hab das meinem Chef gezeigt und der hat sofort gefragt wann wir das auf den Rest der Firma ausrollen.",
    name: "Markus Diehl",
    role: "Vertriebsleiter",
    company: "Diehl Metallbau GmbH, Stuttgart",
    tags: ["Workflow-Automatisierung", "AI Workflows"],
    avatarColor: "#EA4335",
  },
  {
    quote:
      "Was mich überzeugt hat war nicht die Technologie sondern wie erklärt wurde was die Technologie für mich bedeutet. Kein Fachjargon, keine überflüssigen Features. Einfach: das ist dein Problem, das ist die Lösung, das kostet es, so schnell ist es fertig. Genau so hätte ich es mir gewünscht.",
    name: "Julia Hartmann",
    role: "Gründerin",
    company: "Hartmann Coaching & Consulting, München",
    tags: ["KI-Website", "KI-Chatbot"],
    avatarColor: "#A142F4",
  },
  {
    quote:
      "Wir haben im ersten Monat nach der neuen Website 14 Probefahrten gebucht ohne einen einzigen Anruf dafür entgegengenommen zu haben. Der Chatbot hat die Kunden qualifiziert, den Termin gebucht und mir eine Zusammenfassung geschickt bevor ich morgens ins Büro kam. Ich musste kurz nachschauen ob das wirklich funktioniert.",
    name: "René Bauer",
    role: "Betriebsleiter",
    company: "Autohaus Bauer, Kassel",
    tags: ["KI-Website", "KI-Chatbot", "Lead Generation"],
    avatarColor: "#F29900",
  },
];

function Avatar({ name, color }: { name: string; color: string }) {
  const letter = name.trim()[0].toUpperCase();
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        backgroundColor: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontSize: 15,
        fontWeight: 600,
        color: "#fff",
        userSelect: "none",
      }}
    >
      {letter}
    </div>
  );
}

const GAP = 16; // px — matches gap-4
const VISIBLE = 3;
const MAX_INDEX = TESTIMONIALS.length - VISIBLE; // 2

// ── Single card ───────────────────────────────────────────────────────────────
function TestimonialCard({
  quote,
  name,
  role,
  company,
  tags,
  avatarColor,
  width,
}: (typeof TESTIMONIALS)[0] & { width: number }) {
  const borderControls = useAnimation();

  return (
    <div
      className="shrink-0 rounded-2xl p-7 flex flex-col justify-between gap-8 relative"
      style={{
        width,
        backgroundColor: "#141414",
        // permanent subtle top highlight
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14)",
        minHeight: 300,
        cursor: "default",
      }}
      onMouseEnter={() =>
        borderControls.start({
          pathLength: 1,
          opacity: 1,
          transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
        })
      }
      onMouseLeave={() =>
        borderControls.start({
          pathLength: 0,
          opacity: 0,
          transition: { duration: 0.35, ease: "easeIn" },
        })
      }
    >
      {/* SVG animated border — draws from top-left clockwise */}
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{ width: "100%", height: "100%", borderRadius: "inherit" }}
        aria-hidden="true"
      >
        <motion.rect
          x="0.5"
          y="0.5"
          width="99%"
          height="99%"
          rx="15.5"
          ry="15.5"
          fill="none"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth="1"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={borderControls}
        />
      </svg>

      {/* Author */}
      <div className="flex items-center gap-3">
        <Avatar name={name} color={avatarColor} />
        <div>
          <p className="text-sm font-semibold text-white">{name}</p>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            {role} — {company}
          </p>
        </div>
      </div>

      {/* Quote */}
      <p
        className="text-sm leading-relaxed flex-1"
        style={{ color: "rgba(255,255,255,0.68)" }}
      >
        „{quote}"
      </p>

      {/* Service tags */}
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="text-[10px] font-medium px-2 py-0.5 rounded-md"
            style={{
              color: "rgba(255,255,255,0.42)",
              border: "1px solid rgba(255,255,255,0.09)",
              backgroundColor: "rgba(255,255,255,0.03)",
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────
export function TestimonialsSection() {
  const { t } = useTranslation();
  const [current, setCurrent] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cardWidth, setCardWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  // On mobile show 1 card, on desktop 3
  const visible = containerWidth > 0 && containerWidth < 640 ? 1 : VISIBLE;
  const maxIndex = TESTIMONIALS.length - visible;

  // Measure container → derive card width
  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.offsetWidth;
      setContainerWidth(w);
      const vis = w < 640 ? 1 : VISIBLE;
      setCardWidth((w - GAP * (vis - 1)) / vis);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Clamp current when visible count changes
  useEffect(() => {
    setCurrent((c) => Math.min(c, maxIndex));
  }, [maxIndex]);

  const scrollTo = (index: number) => {
    setCurrent(Math.max(0, Math.min(maxIndex, index)));
  };

  const offset = current * (cardWidth + GAP);

  return (
    <section
      className="w-full py-32 overflow-hidden"
      style={{ backgroundColor: "#0f0f0f" }}
    >
      <div className="px-8 md:px-12 lg:px-16 max-w-7xl mx-auto">

        {/* ── Header ── */}
        <motion.div {...fadeUp(0)} className="mb-14">
          <p
            className="text-xs font-semibold tracking-[0.2em] uppercase mb-5"
            style={{ color: "rgba(255,255,255,0.28)" }}
          >
            {t("Kunden · Stimmen · Ergebnisse", "Clients · Voices · Results")}
          </p>
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <h2
              className="font-bold tracking-tight"
              style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)", lineHeight: 1.1 }}
            >
              <span className="block text-white">{t("Was unsere", "What our")}</span>
              <span className="block" style={{ color: "rgba(255,255,255,0.28)" }}>
                {t("Kunden sagen", "clients say")}
              </span>
            </h2>

            {/* Arrow controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => scrollTo(current - 1)}
                disabled={current === 0}
                className="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200"
                style={{
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: current === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.65)",
                  backgroundColor: "transparent",
                  cursor: current === 0 ? "default" : "pointer",
                }}
                onMouseEnter={(e) => {
                  if (current !== 0)
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "rgba(255,255,255,0.3)";
                }}
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.borderColor =
                    "rgba(255,255,255,0.12)")
                }
              >
                <ChevronLeft style={{ width: 16, height: 16 }} />
              </button>
              <button
                onClick={() => scrollTo(current + 1)}
                disabled={current === maxIndex}
                className="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200"
                style={{
                  border: "1px solid rgba(255,255,255,0.12)",
                  color:
                    current === maxIndex
                      ? "rgba(255,255,255,0.2)"
                      : "rgba(255,255,255,0.65)",
                  backgroundColor: "transparent",
                  cursor: current === maxIndex ? "default" : "pointer",
                }}
                onMouseEnter={(e) => {
                  if (current !== MAX_INDEX)
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "rgba(255,255,255,0.3)";
                }}
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.borderColor =
                    "rgba(255,255,255,0.12)")
                }
              >
                <ChevronRight style={{ width: 16, height: 16 }} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── Carousel ── */}
        {/* overflow-hidden clips to exactly 3 cards */}
        <div ref={containerRef} className="overflow-hidden">
          <div
            className="flex"
            style={{
              gap: GAP,
              transform: `translateX(-${offset}px)`,
              transition: "transform 0.55s cubic-bezier(0.16, 1, 0.3, 1)",
              willChange: "transform",
            }}
          >
            {TESTIMONIALS.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.07,
                  ease: [0.16, 1, 0.3, 1],
                }}
                style={{ flexShrink: 0 }}
              >
                <TestimonialCard {...item} width={cardWidth} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Dot indicators (3 positions: 0 → MAX_INDEX) ── */}
        <motion.div
          {...fadeUp(0.15)}
          className="flex justify-center gap-2 mt-8"
        >
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              className="transition-all duration-300 rounded-full"
              style={{
                width: i === current ? 20 : 6,
                height: 6,
                backgroundColor:
                  i === current
                    ? "rgba(255,255,255,0.6)"
                    : "rgba(255,255,255,0.18)",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            />
          ))}
        </motion.div>

      </div>
    </section>
  );
}
