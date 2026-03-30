import { Navbar } from "@/components/ui/navbar";
import { FooterComponent } from "@/components/ui/flickering-footer";

export default function DatenschutzPage() {
  return (
    <main style={{ backgroundColor: "#0f0f0f", minHeight: "100vh", overflowX: "clip" }}>
      <Navbar />

      <section className="w-full px-8 md:px-16 lg:px-24 pt-40 pb-32">
        <div className="max-w-3xl mx-auto">
          <h1
            className="font-bold tracking-tight mb-12"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.1, color: "#fff" }}
          >
            Datenschutzerklärung
          </h1>

          <div
            className="flex flex-col gap-10 text-sm leading-relaxed"
            style={{ color: "rgba(255,255,255,0.65)" }}
          >
            <div>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.75rem", marginBottom: "1.5rem" }}>Stand: März 2026</p>

              <h2 className="text-white font-semibold text-base mb-3">1. Datenschutz auf einen Blick</h2>
              <h3 className="font-medium mb-2" style={{ color: "rgba(255,255,255,0.8)" }}>Allgemeine Hinweise</h3>
              <p className="mb-4">
                Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie unsere Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können. Ausführliche Informationen zum Thema Datenschutz entnehmen Sie unserer weiter unten aufgeführten Datenschutzerklärung.
              </p>

              <h3 className="font-medium mb-2" style={{ color: "rgba(255,255,255,0.8)" }}>Datenerfassung auf unserer Website</h3>
              <p className="mb-4">
                <strong className="text-white">Wer ist verantwortlich für die Datenerfassung auf dieser Website?</strong> Die Datenverarbeitung auf dieser Website erfolgt durch den Webseitenbetreiber. Dessen Kontaktdaten können Sie dem Impressum dieser Website entnehmen.
              </p>
              <p className="mb-4">
                <strong className="text-white">Wie erfassen wir Ihre Daten?</strong> Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich z. B. um Daten handeln, die Sie in ein Kontaktformular eingeben oder im Chat mit unserem KI-Assistenten teilen. Andere Daten werden beim Besuch der Website automatisch durch unsere IT-Systeme erfasst. Das sind vor allem technische Daten (z. B. Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs).
              </p>
              <p className="mb-4">
                <strong className="text-white">Wofür nutzen wir Ihre Daten?</strong> Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu gewährleisten. Andere Daten können zur Bearbeitung Ihrer Anfragen, zur Terminvereinbarung oder zur Kontaktaufnahme genutzt werden.
              </p>
              <p>
                <strong className="text-white">Welche Rechte haben Sie bezüglich Ihrer Daten?</strong> Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht auf Berichtigung, Sperrung oder Löschung dieser Daten. Hierzu sowie zu weiteren Fragen zum Thema Datenschutz können Sie sich jederzeit an uns wenden.
              </p>
            </div>

            <div>
              <h2 className="text-white font-semibold text-base mb-3">2. Allgemeine Hinweise und Pflichtinformationen</h2>
              <h3 className="font-medium mb-2" style={{ color: "rgba(255,255,255,0.8)" }}>Datenschutz</h3>
              <p className="mb-4">
                Die Betreiber dieser Website nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.
              </p>
              <p className="mb-4">
                Wenn Sie diese Website benutzen, werden verschiedene personenbezogene Daten erhoben. Diese Datenschutzerklärung erläutert, welche Daten wir erheben und wofür wir sie nutzen. Sie erläutert auch, wie und zu welchem Zweck das geschieht.
              </p>

              <h3 className="font-medium mb-2" style={{ color: "rgba(255,255,255,0.8)" }}>Hinweis zur verantwortlichen Stelle</h3>
              <p className="mb-4">Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:</p>
              <p className="mb-4" style={{ color: "rgba(255,255,255,0.8)" }}>
                Onvero UG (haftungsbeschränkt)<br />
                Lüdmoor 35 A<br />
                22175 Hamburg<br />
                Telefon: +49 163 8981544<br />
                E-Mail: info@onvero.de
              </p>
              <p className="mb-4">
                Verantwortliche Stelle ist die natürliche oder juristische Person, die allein oder gemeinsam mit anderen über die Zwecke und Mittel der Verarbeitung von personenbezogenen Daten entscheidet.
              </p>

              <h3 className="font-medium mb-2" style={{ color: "rgba(255,255,255,0.8)" }}>Widerruf Ihrer Einwilligung zur Datenverarbeitung</h3>
              <p className="mb-4">
                Viele Datenverarbeitungsvorgänge sind nur mit Ihrer ausdrücklichen Einwilligung möglich. Sie können eine bereits erteilte Einwilligung jederzeit widerrufen. Die Rechtmäßigkeit der bis zum Widerruf erfolgten Datenverarbeitung bleibt vom Widerruf unberührt.
              </p>

              <h3 className="font-medium mb-2" style={{ color: "rgba(255,255,255,0.8)" }}>Beschwerderecht bei der zuständigen Aufsichtsbehörde</h3>
              <p className="mb-4">
                Im Falle von Verstößen gegen die DSGVO steht den Betroffenen ein Beschwerderecht bei einer Aufsichtsbehörde zu. Zuständige Aufsichtsbehörde in Datenschutzfragen für Onvero UG ist der Hamburgische Beauftragte für Datenschutz und Informationsfreiheit (HmbBfDI).
              </p>

              <h3 className="font-medium mb-2" style={{ color: "rgba(255,255,255,0.8)" }}>Recht auf Datenübertragbarkeit</h3>
              <p className="mb-4">
                Sie haben das Recht, Daten, die wir auf Grundlage Ihrer Einwilligung oder in Erfüllung eines Vertrags automatisiert verarbeiten, an sich oder an einen Dritten in einem gängigen, maschinenlesbaren Format aushändigen zu lassen.
              </p>

              <h3 className="font-medium mb-2" style={{ color: "rgba(255,255,255,0.8)" }}>SSL- bzw. TLS-Verschlüsselung</h3>
              <p className="mb-4">
                Diese Website nutzt aus Sicherheitsgründen und zum Schutz der Übertragung vertraulicher Inhalte eine SSL- bzw. TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie daran, dass die Adresszeile des Browsers von &quot;http://&quot; auf &quot;https://&quot; wechselt und an dem Schloss-Symbol in Ihrer Browserzeile.
              </p>

              <h3 className="font-medium mb-2" style={{ color: "rgba(255,255,255,0.8)" }}>Auskunft, Sperrung, Löschung</h3>
              <p>
                Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf unentgeltliche Auskunft über Ihre gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger und den Zweck der Datenverarbeitung und ggf. ein Recht auf Berichtigung, Sperrung oder Löschung dieser Daten. Hierzu sowie zu weiteren Fragen zum Thema personenbezogene Daten können Sie sich jederzeit an uns wenden.
              </p>
            </div>

            <div>
              <h2 className="text-white font-semibold text-base mb-3">3. Datenerfassung auf unserer Website</h2>

              <h3 className="font-medium mb-2" style={{ color: "rgba(255,255,255,0.8)" }}>Server-Logfiles</h3>
              <p className="mb-2">
                <strong className="text-white">a. Datenverarbeitung</strong> Wenn Sie unsere Website nur zu Informationszwecken besuchen, d. h. wenn Sie sich nicht registrieren oder uns anderweitig Informationen übermitteln, erhebt und verarbeitet unser Hosting-Anbieter (Vercel Inc. / Netlify Inc.) automatisch folgende Daten:
              </p>
              <ul className="list-disc list-inside mb-4 flex flex-col gap-1" style={{ paddingLeft: "1rem" }}>
                <li>IP-Adresse Ihres Endgeräts</li>
                <li>Informationen über Ihren Browser</li>
                <li>Name der aufgerufenen Seite (URL)</li>
                <li>Datum und Uhrzeit des Besuchs</li>
                <li>Statusmeldungen (z. B. Fehlermeldungen)</li>
                <li>Übertragene Datenmengen</li>
              </ul>
              <p className="mb-4">
                <strong className="text-white">b. Zweck und Rechtsgrundlage</strong> Die Verarbeitung erfolgt zur Bereitstellung der Website, zur Sicherstellung der Stabilität und Sicherheit sowie zur Nachverfolgung unbefugter Zugriffe. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse).
              </p>
              <p className="mb-4">
                <strong className="text-white">c. Speicherdauer</strong> Die Daten werden nach spätestens 30 Tagen gelöscht. IP-Adressen werden pseudonymisiert gespeichert.
              </p>

              <h3 className="font-medium mb-2" style={{ color: "rgba(255,255,255,0.8)" }}>Hosting</h3>
              <p className="mb-4">
                Wir hosten unsere Website bei Vercel Inc. (oder Netlify Inc.) mit Sitz in den USA. Beim Besuch unserer Website werden personenbezogene Daten auf den Servern des Hosting-Anbieters verarbeitet. Die Datenübertragung in die USA erfolgt auf Grundlage der EU-Standardvertragsklauseln (Art. 46 Abs. 2 lit. c DSGVO). Mit dem Hosting-Anbieter besteht ein Auftragsverarbeitungsvertrag gemäß Art. 28 DSGVO.
              </p>

              <h3 className="font-medium mb-2" style={{ color: "rgba(255,255,255,0.8)" }}>Cookies</h3>
              <p className="mb-4">
                Unsere Website verwendet Cookies. Cookies sind kleine Textdateien, die auf Ihrem Endgerät gespeichert werden und die Ihr Browser speichert. Technisch notwendige Cookies werden auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO gespeichert. Für alle weiteren Cookies holen wir Ihre Einwilligung über unseren Consent Manager ein.
              </p>
              <p className="mb-4">
                Sie können Ihren Browser so einstellen, dass Sie über das Setzen von Cookies informiert werden und Cookies nur im Einzelfall erlauben, die Annahme von Cookies für bestimmte Fälle oder generell ausschließen sowie das automatische Löschen der Cookies beim Schließen des Browser aktivieren.
              </p>

              <h3 className="font-medium mb-2" style={{ color: "rgba(255,255,255,0.8)" }}>Kontaktformular</h3>
              <p>
                Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, werden Ihre Angaben aus dem Anfrageformular inklusive der von Ihnen dort angegebenen Kontaktdaten zwecks Bearbeitung der Anfrage und für den Fall von Anschlussfragen bei uns gespeichert. Diese Daten geben wir nicht ohne Ihre Einwilligung weiter. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Vertragsanbahnung) bzw. Art. 6 Abs. 1 lit. a DSGVO (Einwilligung).
              </p>
            </div>

            <div>
              <h2 className="text-white font-semibold text-base mb-3">4. KI-gestützter Chatbot und AI-Rezeptionist</h2>
              <p className="mb-4">
                Auf unserer Website setzen wir einen KI-basierten Chatbot sowie einen AI-Rezeptionisten ein. Diese Systeme können folgende Aktionen ausführen: Fragen beantworten, Termine buchen, Anfragen in unser CRM-System eintragen sowie E-Mails in Ihrem Auftrag versenden.
              </p>

              <h3 className="font-medium mb-2" style={{ color: "rgba(255,255,255,0.8)" }}>Verarbeitete Daten</h3>
              <p className="mb-4">
                Die von Ihnen im Chat eingegebenen Nachrichten (z. B. Name, Kontaktdaten, Ihr Anliegen) werden zur Bearbeitung Ihrer Anfrage verarbeitet. Chatverläufe werden nicht dauerhaft gespeichert und nach Ende der Sitzung gelöscht. Sofern Sie einen Termin buchen oder Ihre Daten ins CRM übertragen werden, erfolgt dies nur auf Ihre Initiative hin.
              </p>

              <h3 className="font-medium mb-2" style={{ color: "rgba(255,255,255,0.8)" }}>Rechtsgrundlage</h3>
              <p className="mb-4">
                Rechtsgrundlage für die Datenverarbeitung über den Chatbot ist Art. 6 Abs. 1 lit. b DSGVO (Vertragsanbahnung und -erfüllung) sowie Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an effizienter Kundenkommunikation).
              </p>

              <h3 className="font-medium mb-2" style={{ color: "rgba(255,255,255,0.8)" }}>Eingesetzte Drittdienste</h3>
              <p className="mb-3">Zur Bereitstellung der KI-Funktionen nutzen wir folgende Dienstleister als Auftragsverarbeiter gemäß Art. 28 DSGVO:</p>
              <div className="flex flex-col gap-3">
                <p>
                  <strong className="text-white">OpenAI, L.L.C. (USA)</strong> – Verarbeitung von Spracheingaben durch ein KI-Sprachmodell. Datentransfer in die USA auf Grundlage der EU-Standardvertragsklauseln sowie des EU-US Data Privacy Frameworks.
                </p>
                <p>
                  <strong className="text-white">Google LLC (USA)</strong> – Google-Dienste (insbesondere Google Calendar für Terminbuchungen und Google-basierte E-Mail-Funktionen). Datentransfer in die USA auf Grundlage der EU-Standardvertragsklauseln und des EU-US Data Privacy Frameworks.
                </p>
                <p>
                  <strong className="text-white">HubSpot Inc. (USA)</strong> – CRM-System zur Erfassung und Verwaltung von Kontakt- und Anfragedaten. Datentransfer in die USA auf Grundlage der EU-Standardvertragsklauseln. HubSpot ist nach dem EU-US Data Privacy Framework zertifiziert.
                </p>
                <p>
                  <strong className="text-white">Buchungssystem</strong> – Terminvereinbarung auf Ihre Initiative hin. Dabei werden Name, Kontaktdaten und gewünschter Termin verarbeitet.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-white font-semibold text-base mb-3">5. Ihre Rechte</h2>
              <p className="mb-3">Sie haben gegenüber uns folgende Rechte hinsichtlich Ihrer personenbezogenen Daten:</p>
              <ul className="list-disc list-inside flex flex-col gap-1 mb-4" style={{ paddingLeft: "1rem" }}>
                <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
                <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
                <li>Recht auf Löschung (Art. 17 DSGVO)</li>
                <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
                <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
                <li>Recht auf Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
                <li>Recht auf Widerruf einer Einwilligung (Art. 7 Abs. 3 DSGVO)</li>
              </ul>
              <p>
                Zur Ausübung Ihrer Rechte wenden Sie sich bitte an:{" "}
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
              <h2 className="text-white font-semibold text-base mb-3">6. Keine automatisierte Entscheidungsfindung</h2>
              <p>
                Es findet keine automatisierte Entscheidungsfindung einschließlich Profiling im Sinne von Art. 22 DSGVO statt, die Ihnen gegenüber rechtliche Wirkung entfaltet oder Sie in ähnlicher Weise erheblich beeinträchtigt.
              </p>
            </div>

            <div>
              <h2 className="text-white font-semibold text-base mb-3">7. Änderungen dieser Datenschutzerklärung</h2>
              <p className="mb-6">
                Wir behalten uns vor, diese Datenschutzerklärung anzupassen, damit sie stets den aktuellen rechtlichen Anforderungen entspricht oder um Änderungen unserer Leistungen in der Datenschutzerklärung umzusetzen. Für Ihren erneuten Besuch gilt dann die neue Datenschutzerklärung.
              </p>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem" }}>
                Stand: März 2026 | Onvero UG (haftungsbeschränkt)
              </p>
            </div>
          </div>
        </div>
      </section>

      <FooterComponent />
    </main>
  );
}
