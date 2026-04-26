import dynamic from "next/dynamic";
import { Navbar } from "@onvero/ui/marketing/navbar";
import { BackgroundPaths } from "@onvero/ui/effects/background-paths";

const CyberneticBentoGrid = dynamic(() =>
  import("@onvero/ui/marketing/cybernetic-bento-grid").then((m) => m.CyberneticBentoGrid)
);
const BusinessOS = dynamic(() =>
  import("@onvero/ui/marketing/business-os").then((m) => m.BusinessOS)
);
const TechSection = dynamic(() =>
  import("@onvero/ui/marketing/tech-section").then((m) => m.TechSection)
);
const TimelineSection = dynamic(() =>
  import("@onvero/ui/marketing/timeline-section").then((m) => m.TimelineSection)
);
const TestimonialsSection = dynamic(() =>
  import("@onvero/ui/marketing/testimonials-section").then((m) => m.TestimonialsSection)
);
const ChatSection = dynamic(() =>
  import("@onvero/ui/chat/chat-section").then((m) => m.ChatSection)
);
const FooterComponent = dynamic(() =>
  import("@onvero/ui/marketing/flickering-footer").then((m) => m.FooterComponent)
);
const BlogSection = dynamic(() =>
  import("@onvero/ui/marketing/blog-section").then((m) => m.BlogSection)
);

export default function Home() {
  return (
    <main style={{ backgroundColor: "#0f0f0f", overflowX: "clip" }}>
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

{/* 8. Testimonials */}
      <section id="testimonials" style={{ position: "relative", zIndex: 1, backgroundColor: "#0f0f0f" }}>
        <TestimonialsSection />
      </section>

      {/* 9. ChatBot Section */}
      <section id="chatbot" style={{ position: "relative", zIndex: 1, backgroundColor: "#0f0f0f" }}>
        <ChatSection />
      </section>

      {/* 10. Blog Section */}
      <BlogSection />

      {/* Footer */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <FooterComponent />
      </div>
    </main>
  );
}
