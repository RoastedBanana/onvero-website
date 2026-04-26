'use client';

import { Navbar } from '@/components/ui/navbar';
import { FooterComponent } from '@/components/ui/flickering-footer';

export default function AGBPage() {
  return (
    <main style={{ backgroundColor: '#0f0f0f', minHeight: '100vh', overflowX: 'clip' }}>
      <Navbar />

      <section className="w-full px-8 md:px-16 lg:px-24 pt-40 pb-32">
        <div className="max-w-3xl mx-auto">
          <h1
            className="font-bold tracking-tight mb-12"
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.1, color: '#fff' }}
          >
            Allgemeine Geschäftsbedingungen
          </h1>

          <div className="flex flex-col gap-10 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', marginBottom: '1.5rem' }}>
                Stand: April 2026
              </p>

              <h2 className="text-white font-semibold text-base mb-3">§ 1 Geltungsbereich</h2>
              <p className="mb-4">
                (1) Diese Allgemeinen Geschäftsbedingungen (nachfolgend &quot;AGB&quot;) gelten für alle Verträge
                zwischen der Onvero UG (haftungsbeschränkt), Lüdmoor 35 A, 22175 Hamburg (nachfolgend &quot;Onvero&quot;
                oder &quot;wir&quot;) und dem Kunden (nachfolgend &quot;Kunde&quot; oder &quot;Auftraggeber&quot;) über
                die Erbringung von Dienstleistungen im Bereich KI-Infrastruktur, Webentwicklung, Automatisierung und
                verwandte digitale Leistungen.
              </p>
              <p className="mb-4">
                (2) Abweichende, entgegenstehende oder ergänzende AGB des Kunden werden nur dann Vertragsbestandteil,
                wenn und soweit Onvero ihrer Geltung ausdrücklich schriftlich zugestimmt hat.
              </p>
              <p>
                (3) Diese AGB gelten ausschließlich gegenüber Unternehmern im Sinne von § 14 BGB, juristischen Personen
                des öffentlichen Rechts oder öffentlich-rechtlichen Sondervermögen.
              </p>
            </div>

            <div>
              <h2 className="text-white font-semibold text-base mb-3">§ 2 Vertragsschluss</h2>
              <p className="mb-4">
                (1) Unsere Angebote auf der Website und in Präsentationen sind freibleibend und unverbindlich. Sie
                stellen keine bindenden Angebote dar, sondern eine Aufforderung zur Abgabe eines Angebots.
              </p>
              <p className="mb-4">
                (2) Der Vertrag kommt zustande durch ein individuelles Angebot von Onvero und dessen Annahme durch den
                Kunden, oder durch beidseitige Unterzeichnung eines Projektvertrags bzw. einer Auftragsbestätigung.
              </p>
              <p>
                (3) Mündliche Nebenabreden bestehen nicht. Änderungen und Ergänzungen des Vertrags bedürfen der
                Schriftform. Dies gilt auch für die Aufhebung dieses Schriftformerfordernisses.
              </p>
            </div>

            <div>
              <h2 className="text-white font-semibold text-base mb-3">§ 3 Leistungsumfang</h2>
              <p className="mb-4">
                (1) Der konkrete Leistungsumfang ergibt sich aus dem jeweiligen Angebot, der Leistungsbeschreibung oder
                dem Projektvertrag. Onvero erbringt insbesondere folgende Leistungen:
              </p>
              <ul className="list-disc list-inside mb-4 flex flex-col gap-1" style={{ paddingLeft: '1rem' }}>
                <li>Entwicklung und Bereitstellung von KI-gestützten Websites</li>
                <li>Einrichtung und Integration von KI-Chatbots und AI-Assistenten</li>
                <li>Workflow-Automatisierung und Prozessoptimierung</li>
                <li>Entwicklung von Micro AI Apps und Custom-AI-Lösungen</li>
                <li>Beratung im Bereich KI-Infrastruktur für Unternehmen</li>
              </ul>
              <p className="mb-4">
                (2) Onvero ist berechtigt, zur Leistungserbringung Dritte (Subunternehmer) einzusetzen. Onvero bleibt
                gegenüber dem Kunden für die ordnungsgemäße Leistungserbringung verantwortlich.
              </p>
              <p>
                (3) Sofern nicht anders vereinbart, schuldet Onvero eine Dienstleistung und kein bestimmtes Werk oder
                Ergebnis. Dies gilt insbesondere für KI-basierte Lösungen, deren Ergebnisse technologiebedingt variieren
                können.
              </p>
            </div>

            <div>
              <h2 className="text-white font-semibold text-base mb-3">§ 4 Mitwirkungspflichten des Kunden</h2>
              <p className="mb-4">
                (1) Der Kunde stellt Onvero alle zur Leistungserbringung erforderlichen Informationen, Materialien und
                Zugänge rechtzeitig und vollständig zur Verfügung.
              </p>
              <p className="mb-4">
                (2) Der Kunde benennt einen Ansprechpartner, der für die Dauer des Projekts zur Entscheidungsfindung
                befugt ist.
              </p>
              <p>
                (3) Verzögerungen, die durch fehlende oder verspätete Mitwirkung des Kunden entstehen, gehen nicht zu
                Lasten von Onvero. Vereinbarte Termine verschieben sich entsprechend.
              </p>
            </div>

            <div>
              <h2 className="text-white font-semibold text-base mb-3">§ 5 Vergütung und Zahlungsbedingungen</h2>
              <p className="mb-4">
                (1) Die Vergütung richtet sich nach dem jeweiligen Angebot oder Projektvertrag. Alle Preise verstehen
                sich zuzüglich der gesetzlichen Umsatzsteuer.
              </p>
              <p className="mb-4">
                (2) Sofern nicht anders vereinbart, sind Rechnungen innerhalb von 14 Tagen nach Rechnungsdatum ohne
                Abzug zur Zahlung fällig.
              </p>
              <p className="mb-4">
                (3) Bei wiederkehrenden Leistungen (z. B. Hosting, Wartung, SaaS-Lösungen) erfolgt die Abrechnung im
                Voraus zum vereinbarten Intervall.
              </p>
              <p>
                (4) Kommt der Kunde in Zahlungsverzug, ist Onvero berechtigt, Verzugszinsen in Höhe von 9 Prozentpunkten
                über dem jeweiligen Basiszinssatz zu verlangen (§ 288 Abs. 2 BGB).
              </p>
            </div>

            <div>
              <h2 className="text-white font-semibold text-base mb-3">§ 6 Nutzungsrechte und geistiges Eigentum</h2>
              <p className="mb-4">
                (1) Nach vollständiger Bezahlung räumt Onvero dem Kunden die für den vereinbarten Zweck erforderlichen
                Nutzungsrechte an den erstellten Arbeitsergebnissen ein.
              </p>
              <p className="mb-4">
                (2) Rechte an von Onvero eingesetzter Standardsoftware, Frameworks, Bibliotheken und KI-Modellen Dritter
                verbleiben beim jeweiligen Rechteinhaber. Der Kunde erhält insoweit nur ein einfaches Nutzungsrecht im
                Rahmen des Projekts.
              </p>
              <p>
                (3) Onvero behält das Recht, allgemeine Methoden, Techniken und Erfahrungen, die im Rahmen der
                Leistungserbringung gewonnen werden, für andere Projekte zu nutzen, sofern keine vertraulichen
                Informationen des Kunden offengelegt werden.
              </p>
            </div>

            <div>
              <h2 className="text-white font-semibold text-base mb-3">§ 7 Vertraulichkeit</h2>
              <p className="mb-4">
                (1) Beide Parteien verpflichten sich, alle im Rahmen der Zusammenarbeit erlangten vertraulichen
                Informationen der jeweils anderen Partei geheim zu halten und nur für die Vertragsdurchführung zu
                verwenden.
              </p>
              <p>
                (2) Diese Verpflichtung gilt auch nach Beendigung des Vertragsverhältnisses fort, solange und soweit die
                vertraulichen Informationen nicht rechtmäßig öffentlich bekannt geworden sind.
              </p>
            </div>

            <div>
              <h2 className="text-white font-semibold text-base mb-3">§ 8 Haftung</h2>
              <p className="mb-4">
                (1) Onvero haftet unbeschränkt für Schäden aus der Verletzung des Lebens, des Körpers oder der
                Gesundheit sowie bei vorsätzlichem oder grob fahrlässigem Handeln.
              </p>
              <p className="mb-4">
                (2) Bei leichter Fahrlässigkeit haftet Onvero nur bei Verletzung wesentlicher Vertragspflichten
                (Kardinalpflichten). In diesem Fall ist die Haftung auf den vertragstypischen, vorhersehbaren Schaden
                begrenzt.
              </p>
              <p className="mb-4">
                (3) Die Haftung für entgangenen Gewinn, mittelbare Schäden und Folgeschäden ist bei leichter
                Fahrlässigkeit ausgeschlossen.
              </p>
              <p>
                (4) Da KI-basierte Systeme auf statistischen Modellen basieren, kann Onvero keine Garantie für die
                Richtigkeit, Vollständigkeit oder Verfügbarkeit von KI-generierten Inhalten oder Ergebnissen übernehmen.
                Der Kunde ist für die Überprüfung und Freigabe von KI-Ergebnissen vor deren Verwendung selbst
                verantwortlich.
              </p>
            </div>

            <div>
              <h2 className="text-white font-semibold text-base mb-3">§ 9 Verfügbarkeit und Wartung</h2>
              <p className="mb-4">
                (1) Onvero bemüht sich um eine hohe Verfügbarkeit der bereitgestellten Dienste, kann jedoch keine
                ununterbrochene Verfügbarkeit garantieren. Planmäßige Wartungsarbeiten werden nach Möglichkeit vorab
                angekündigt.
              </p>
              <p>
                (2) Für Ausfälle, die durch höhere Gewalt, Störungen bei Drittanbietern oder vom Kunden zu vertretende
                Umstände verursacht werden, übernimmt Onvero keine Haftung.
              </p>
            </div>

            <div>
              <h2 className="text-white font-semibold text-base mb-3">§ 10 Laufzeit und Kündigung</h2>
              <p className="mb-4">
                (1) Projektverträge enden mit vollständiger Leistungserbringung, sofern nicht anders vereinbart.
              </p>
              <p className="mb-4">
                (2) Dauerschuldverhältnisse (z. B. Hosting, Wartung, SaaS) können von beiden Parteien mit einer Frist
                von 30 Tagen zum Monatsende gekündigt werden, sofern nicht im Einzelvertrag eine andere Laufzeit
                vereinbart ist.
              </p>
              <p>
                (3) Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt. Ein wichtiger Grund
                liegt insbesondere vor, wenn eine Partei ihre vertraglichen Pflichten trotz Abmahnung wiederholt oder
                schwerwiegend verletzt.
              </p>
            </div>

            <div>
              <h2 className="text-white font-semibold text-base mb-3">§ 11 Datenschutz</h2>
              <p className="mb-4">
                (1) Onvero verarbeitet personenbezogene Daten gemäß den geltenden Datenschutzvorschriften, insbesondere
                der DSGVO und des BDSG. Details entnehmen Sie unserer{' '}
                <a
                  href="/datenschutz"
                  style={{ color: 'rgba(255,255,255,0.8)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
                >
                  Datenschutzerklärung
                </a>
                .
              </p>
              <p>
                (2) Soweit Onvero im Rahmen der Leistungserbringung personenbezogene Daten im Auftrag des Kunden
                verarbeitet, schließen die Parteien einen gesonderten Auftragsverarbeitungsvertrag gemäß Art. 28 DSGVO.
              </p>
            </div>

            <div>
              <h2 className="text-white font-semibold text-base mb-3">§ 12 Schlussbestimmungen</h2>
              <p className="mb-4">
                (1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts (CISG).
              </p>
              <p className="mb-4">
                (2) Gerichtsstand für alle Streitigkeiten aus oder im Zusammenhang mit diesem Vertrag ist Hamburg,
                sofern der Kunde Kaufmann, eine juristische Person des öffentlichen Rechts oder ein
                öffentlich-rechtliches Sondervermögen ist.
              </p>
              <p className="mb-4">
                (3) Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, so bleibt die Wirksamkeit der
                übrigen Bestimmungen hiervon unberührt. Anstelle der unwirksamen Bestimmung gilt eine wirksame Regelung,
                die dem wirtschaftlichen Zweck der unwirksamen Bestimmung am nächsten kommt.
              </p>
              <p className="mb-6">
                (4) Onvero behält sich vor, diese AGB jederzeit mit Wirkung für die Zukunft zu ändern. Bestehende
                Verträge bleiben von Änderungen unberührt.
              </p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>
                Stand: April 2026 | Onvero UG (haftungsbeschränkt)
              </p>
            </div>
          </div>
        </div>
      </section>

      <FooterComponent />
    </main>
  );
}
