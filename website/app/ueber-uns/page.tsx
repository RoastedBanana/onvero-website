import { Navbar } from "@/components/ui/navbar";
import { FooterComponent } from "@/components/ui/flickering-footer";

export default function UeberUns() {
  return (
    <main style={{ backgroundColor: "#0f0f0f" }}>
      <Navbar />
      <section
        className="w-full min-h-screen px-8 md:px-16 lg:px-24 flex items-center"
        style={{ paddingTop: "8rem", paddingBottom: "6rem" }}
      >
        <div className="max-w-4xl mx-auto">
          <p
            className="text-xs font-semibold tracking-[0.2em] uppercase mb-5"
            style={{ color: "rgba(255,255,255,0.28)" }}
          >
            Team · Vision · Mission
          </p>
          <h1
            className="font-bold tracking-tight mb-8 text-white"
            style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)", lineHeight: 1.05 }}
          >
            Über uns
          </h1>
          <p
            className="text-lg leading-relaxed max-w-2xl"
            style={{ color: "rgba(255,255,255,0.5)", fontSize: "clamp(1rem, 2vw, 1.2rem)" }}
          >
            Wir sind ein Team aus KI-Ingenieuren und Unternehmensberatern, das
            mittelständischen Unternehmen dabei hilft, die Möglichkeiten moderner
            KI zu nutzen — ohne technischen Overhead.
          </p>
        </div>
      </section>
      <FooterComponent />
    </main>
  );
}
