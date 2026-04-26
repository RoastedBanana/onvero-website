"use client";

import {
  useScroll,
  useTransform,
  motion,
} from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "@onvero/lib/language-context";

interface TimelineEntry {
  title: string;
  content: React.ReactNode;
}

export const Timeline = ({ data }: { data: TimelineEntry[] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const lineRef = useRef<HTMLDivElement>(null);
  const [lineHeight, setLineHeight] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Measure the track line height
  useEffect(() => {
    if (lineRef.current) {
      setLineHeight(lineRef.current.getBoundingClientRect().height);
    }
  }, []);

  // Framer Motion scroll progress for the animated track line
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });
  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, lineHeight]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  // IntersectionObserver — mark which step is in the center of the viewport
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    stepRefs.current.forEach((ref, index) => {
      if (!ref) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveIndex(index);
        },
        // Fire when the step occupies at least the middle 40% of the viewport
        { threshold: 0, rootMargin: "-30% 0px -30% 0px" }
      );
      observer.observe(ref);
      observers.push(observer);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [data.length]);

  return (
    <div
      className="w-full font-sans md:px-10"
      style={{ backgroundColor: "#0f0f0f" }}
      ref={containerRef}
    >
      {/* ── Section header ── */}
      <motion.div
        className="max-w-7xl mx-auto py-28 px-4 md:px-8 lg:px-10"
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2
          className="mb-4 text-white max-w-4xl font-bold tracking-tight"
          style={{ fontSize: "clamp(2.2rem, 4.5vw, 4rem)", lineHeight: 1.1 }}
        >
          {t("So arbeiten", "How")}{" "}
          <em
            style={{
              fontFamily: "TimesNewRomanPSMT,'Times New Roman',Times,serif",
              fontStyle: "italic",
              letterSpacing: "0.02em",
              fontWeight: "normal",
            }}
          >
            {t("wir", "we")}
          </em>{" "}
          {t("mit dir", "work with you")}
        </h2>
        <p
          className="text-sm md:text-base max-w-sm"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          {t(
            "Von der ersten Idee bis zum fertigen System — klar strukturiert, schnell umgesetzt.",
            "From the first idea to the finished system — clearly structured, quickly delivered."
          )}
        </p>
      </motion.div>

      {/* ── Steps ── */}
      <div ref={lineRef} className="relative max-w-7xl mx-auto pb-20">
        {data.map((item, index) => {
          const isActive = activeIndex === index;
          // Each successive step sticks 20px lower — creates the stacking offset
          const stickyTop = 80 + index * 20;

          return (
            <div
              key={index}
              // 70vh min-height = the scroll "resistance" that keeps each step visible
              style={{ minHeight: "70vh" }}
            >
              <div
                ref={(el) => { stepRefs.current[index] = el; }}
                className="sticky flex justify-start md:gap-10"
                style={{
                  top: `${stickyTop}px`,
                  // Later steps paint over earlier ones during transition
                  zIndex: index + 1,
                }}
              >
                {/* Left: dot + title (md+) */}
                <div className="flex flex-col md:flex-row z-40 items-center top-40 self-start max-w-xs lg:max-w-sm md:w-full">
                  {/* Dot indicator */}
                  <div
                    className="h-10 absolute left-3 md:left-3 w-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "#0f0f0f" }}
                  >
                    <div
                      className="h-4 w-4 rounded-full p-2"
                      style={{
                        backgroundColor: isActive
                          ? "rgba(255,255,255,0.75)"
                          : "rgba(255,255,255,0.07)",
                        border: isActive
                          ? "1px solid rgba(255,255,255,0.5)"
                          : "1px solid rgba(255,255,255,0.12)",
                        transition: "background-color 0.4s ease, border-color 0.4s ease",
                      }}
                    />
                  </div>

                  <h3
                    className="hidden md:block text-xl md:pl-20 md:text-5xl font-bold"
                    style={{
                      color: isActive ? "#ffffff" : "rgba(255,255,255,0.25)",
                      transition: "color 0.4s ease",
                    }}
                  >
                    {item.title}
                  </h3>
                </div>

                {/* Right: content */}
                <div className="relative pl-20 pr-4 md:pl-4 w-full">
                  {/* Mobile title */}
                  <h3
                    className="md:hidden block text-2xl mb-4 text-left font-bold"
                    style={{
                      color: isActive ? "#ffffff" : "rgba(255,255,255,0.25)",
                      transition: "color 0.4s ease",
                    }}
                  >
                    {item.title}
                  </h3>

                  {/* Content wrapper — opacity fade for inactive steps */}
                  <div
                    style={{
                      opacity: isActive ? 1 : 0.22,
                      transition: "opacity 0.4s ease",
                    }}
                  >
                    {item.content}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Animated track line */}
        <div
          className="absolute md:left-8 left-8 top-0 overflow-hidden w-[2px]"
          style={{
            height: lineHeight + "px",
            background:
              "linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.08) 10%, rgba(255,255,255,0.08) 90%, transparent 100%)",
          }}
        >
          <motion.div
            style={{
              height: heightTransform,
              opacity: opacityTransform,
              position: "absolute",
              insetInline: 0,
              top: 0,
              width: "2px",
              borderRadius: "9999px",
              background:
                "linear-gradient(to top, rgba(255,255,255,0.7), rgba(255,255,255,0.2), transparent)",
            }}
          />
        </div>
      </div>
    </div>
  );
};
