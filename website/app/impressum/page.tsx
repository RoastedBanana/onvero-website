import { Navbar } from "@/components/ui/navbar";
import { FooterComponent } from "@/components/ui/flickering-footer";

export default function ImpressumPage() {
  return (
    <main style={{ backgroundColor: "#0f0f0f", minHeight: "100vh", overflowX: "clip" }}>
      <Navbar />

      <section className="w-full px-8 md:px-16 lg:px-24 pt-40 pb-32">
        <div className="max-w-3xl mx-auto">
          <h1
            className="font-bold tracking-tight mb-12"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.1, color: "#fff" }}
          >
            Impressum
          </h1>

          <div
            className="flex flex-col gap-8 text-sm leading-relaxed"
            style={{ color: "rgba(255,255,255,0.65)" }}
          >
            <div>
              <p style={{ color: "rgba(255,255,255,0.8)" }}>
                Onvero UG (haftungsbeschränkt)<br />
                Lüdmoor 35 A<br />
                22175 Hamburg
              </p>
            </div>

            <div>
              <h2 className="text-white font-semibold text-base mb-3">Vertreten durch</h2>
              <p style={{ color: "rgba(255,255,255,0.8)" }}>
                Jan Felix Fahlbusch<br />
                Hans Gustav Lacher
              </p>
            </div>

            <div>
              <h2 className="text-white font-semibold text-base mb-3">Registereintrag</h2>
              <p>
                Eintragung im Handelsregister<br />
                Registergericht: Hamburg<br />
                Registernummer: HRB 193088
              </p>
            </div>

            <div>
              <h2 className="text-white font-semibold text-base mb-3">Umsatzsteuer-ID</h2>
              <p>
                Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG:<br />
                DE455148198
              </p>
            </div>

            <div>
              <h2 className="text-white font-semibold text-base mb-3">Kontakt</h2>
              <p>
                E-Mail:{" "}
                <a
                  href="mailto:info@onvero.de"
                  style={{ color: "rgba(255,255,255,0.8)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
                >
                  info@onvero.de
                </a>
              </p>
            </div>

            <div>
              <h2 className="text-white font-semibold text-base mb-3">Verbraucherstreitbeilegung</h2>
              <p>
                Wir sind nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen, und nehmen daran auch nicht teil.
              </p>
            </div>

            <div>
              <h2 className="text-white font-semibold text-base mb-3">Datenschutzerklärung</h2>
              <p>
                Unsere Datenschutzerklärung finden Sie unter dem folgenden Link:{" "}
                <a
                  href="/datenschutz"
                  style={{ color: "rgba(255,255,255,0.8)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
                >
                  /datenschutz
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      <FooterComponent />
    </main>
  );
}
