"use client";

import { Navbar } from "@/components/ui/navbar";
import { ZoomParallax } from "@/components/ui/zoom-parallax";
import { TeamCards } from "@/components/ui/team-cards";
import { FooterComponent } from "@/components/ui/flickering-footer";

const IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1280&h=720&fit=crop&auto=format&q=80",
    alt: "Modern office building",
  },
  {
    src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1280&h=720&fit=crop&auto=format&q=80",
    alt: "Team collaboration",
  },
  {
    src: "https://images.unsplash.com/photo-1557683316-973673baf926?w=800&h=800&fit=crop&auto=format&q=80",
    alt: "Abstract design",
  },
  {
    src: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=1280&h=720&fit=crop&auto=format&q=80",
    alt: "Working on laptop",
  },
  {
    src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=800&fit=crop&auto=format&q=80",
    alt: "Minimalist workspace",
  },
  {
    src: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1280&h=720&fit=crop&auto=format&q=80",
    alt: "Modern office interior",
  },
  {
    src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1280&h=720&fit=crop&auto=format&q=80",
    alt: "Nature and light",
  },
];

export default function UeberUns() {
  return (
    <main style={{ backgroundColor: "#0f0f0f" }}>
      <Navbar />

      {/* ── Header – above the parallax ── */}
      <section className="relative z-10 flex flex-col items-center justify-center pt-40 pb-20 px-8 text-center">
        <p
          className="text-xs font-semibold tracking-[0.2em] uppercase mb-5"
          style={{ color: "rgba(255,255,255,0.28)" }}
        >
          Team · Vision · Mission
        </p>
        <h1
          className="font-bold tracking-tight text-white mb-6"
          style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", lineHeight: 1.05 }}
        >
          Über uns
        </h1>
        <p
          className="text-base leading-relaxed max-w-lg"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
          Wir sind ein Team aus KI-Experten und Entwicklern, das Unternehmen
          dabei hilft, das volle Potenzial künstlicher Intelligenz zu entfalten.
        </p>
      </section>

      {/* ── Zoom parallax – 3D logo + images ── */}
      <ZoomParallax images={IMAGES} />

      {/* ── Team cards + connector lines + vision ── */}
      <TeamCards />

      <FooterComponent />
    </main>
  );
}
