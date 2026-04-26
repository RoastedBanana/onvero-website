import { Navbar } from "@onvero/ui/marketing/navbar";
import { FooterComponent } from "@onvero/ui/marketing/flickering-footer";
import ContactForm from "@onvero/ui/app-shell/ContactForm";

export const metadata = {
  title: "Briefing | Onvero",
  description: "Sende uns dein Briefing vor dem Erstgespräch.",
};

export default function FormularPage() {
  return (
    <main style={{ backgroundColor: "#0f0f0f", minHeight: "100vh" }}>
      <Navbar />

      <section className="flex flex-col items-center px-5 md:px-8 pt-28 md:pt-40 pb-24">
        <div className="text-center mb-12 w-full max-w-lg">
          <p
            className="text-xs font-semibold tracking-[0.2em] uppercase mb-4"
            style={{ color: "rgba(255,255,255,0.28)" }}
          >
            Briefing · Erstgespräch · Onvero
          </p>
          <h1
            className="font-bold tracking-tight text-white"
            style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", lineHeight: 1.1 }}
          >
            Stell uns dein Projekt vor
          </h1>
          <p
            className="mt-4 text-sm leading-relaxed"
            style={{ color: "rgba(255,255,255,0.38)" }}
          >
            Damit unser Erstgespräch sofort auf den Punkt kommt — kein Smalltalk, nur Ergebnisse.
          </p>
        </div>

        <ContactForm />
      </section>

      <FooterComponent />
    </main>
  );
}
