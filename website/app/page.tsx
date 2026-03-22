import { Navbar } from "@/components/ui/navbar";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { CyberneticBentoGrid } from "@/components/ui/cybernetic-bento-grid";
import { BusinessOS } from "@/components/ui/business-os";
import { TechSection } from "@/components/ui/tech-section";
import { TimelineSection } from "@/components/ui/timeline-section";
import { MetricsSection } from "@/components/ui/metrics-section";
import { ProjectsSection } from "@/components/ui/projects-section";
import { TestimonialsSection } from "@/components/ui/testimonials-section";
import { ChatSection } from "@/components/ui/chat-section";
import { FooterComponent } from "@/components/ui/flickering-footer";

export default function Home() {
  return (
    <main style={{ backgroundColor: "#0f0f0f" }}>
      {/* 1. Navbar */}
      <Navbar />

      {/* 2. Hero — BackgroundPaths */}
      <section id="hero">
        <BackgroundPaths />
      </section>

      {/* 3. Bento Grid — Leistungen
          No z-index: the fixed paths (z-index 0) paint over this section — that's the bleed effect.
          Paths scroll away and fade out before the next section anyway. */}
      <section id="leistungen" style={{ backgroundColor: "#0f0f0f" }}>
        <CyberneticBentoGrid />
      </section>

      {/* From BusinessOS onward: position relative + z-index 1 covers the fixed paths */}

      {/* 4. BusinessOS Diagram */}
      <section id="businessos" style={{ position: "relative", zIndex: 1, backgroundColor: "#0f0f0f" }}>
        <BusinessOS />
      </section>

      {/* 5. Technologies & Systems */}
      <section id="technologien" style={{ position: "relative", zIndex: 1, backgroundColor: "#0f0f0f" }}>
        <TechSection />
      </section>

      {/* 6. Timeline — Prozess */}
      <section id="prozess" style={{ position: "relative", zIndex: 1, backgroundColor: "#0f0f0f" }}>
        <TimelineSection />
      </section>

      {/* 6. Metrics — Was bei dir rauskommt */}
      <section id="ergebnisse" style={{ position: "relative", zIndex: 1, backgroundColor: "#0f0f0f" }}>
        <MetricsSection />
      </section>

      {/* 7. Projekte */}
      <section id="projekte" style={{ position: "relative", zIndex: 1, backgroundColor: "#0f0f0f" }}>
        <ProjectsSection />
      </section>

      {/* 8. Testimonials */}
      <section id="testimonials" style={{ position: "relative", zIndex: 1, backgroundColor: "#0f0f0f" }}>
        <TestimonialsSection />
      </section>

      {/* 9. ChatBot Section */}
      <section id="chatbot" style={{ position: "relative", zIndex: 1, backgroundColor: "#0f0f0f" }}>
        <ChatSection />
      </section>

      {/* 7. Footer */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <FooterComponent />
      </div>
    </main>
  );
}
