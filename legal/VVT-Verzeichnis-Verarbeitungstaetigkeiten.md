# Verzeichnis von Verarbeitungstätigkeiten (VVT)

**gemäß Art. 30 Abs. 1 DSGVO**

---

## Angaben zum Verantwortlichen

| Feld | Angabe |
|---|---|
| **Unternehmen** | Onvero UG (haftungsbeschränkt) |
| **Anschrift** | Lüdmoor 35 A, 22175 Hamburg |
| **Vertretungsberechtigte** | Jan Felix Fahlbusch, Hans Gustav Lacher |
| **Kontakt Datenschutz** | info@onvero.de / +49 163 8981544 |
| **Handelsregister** | HRB 193088, AG Hamburg |
| **USt-IdNr.** | DE455148198 |
| **Datenschutzbeauftragter** | Nicht bestellt (< 20 Personen ständig mit automatisierter Verarbeitung beschäftigt, § 38 BDSG) |
| **Erstellt am** | 08.04.2026 |
| **Letzte Aktualisierung** | 08.04.2026 |

---

## Verarbeitungstätigkeit 1: Website-Betrieb und Hosting

| Feld | Beschreibung |
|---|---|
| **Bezeichnung** | Bereitstellung der Unternehmenswebsite onvero.de |
| **Zweck** | Darstellung des Unternehmens, Kundengewinnung, Informationsbereitstellung |
| **Kategorien betroffener Personen** | Website-Besucher |
| **Kategorien personenbezogener Daten** | IP-Adresse, Browsertyp, Betriebssystem, aufgerufene URLs, Zeitstempel, übertragene Datenmenge |
| **Rechtsgrundlage** | Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Bereitstellung der Website) |
| **Empfänger/Auftragsverarbeiter** | Vercel Inc. (USA) — Hosting |
| **Drittlandtransfer** | USA — EU-Standardvertragsklauseln (Art. 46 Abs. 2 lit. c DSGVO) |
| **Löschfrist** | Server-Logfiles: 30 Tage, IP-Adressen pseudonymisiert |
| **TOM-Verweis** | TLS-Verschlüsselung, Security Headers (HSTS, CSP, X-Frame-Options) |

---

## Verarbeitungstätigkeit 2: Cookie-Einwilligungsverwaltung

| Feld | Beschreibung |
|---|---|
| **Bezeichnung** | Verwaltung der Cookie-Einwilligung |
| **Zweck** | Dokumentation und Umsetzung der Cookie-Präferenzen der Besucher |
| **Kategorien betroffener Personen** | Website-Besucher |
| **Kategorien personenbezogener Daten** | Einwilligungsstatus (accepted/rejected) |
| **Rechtsgrundlage** | Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an rechtskonformem Cookie-Einsatz) |
| **Empfänger/Auftragsverarbeiter** | Keine (localStorage im Browser des Nutzers) |
| **Drittlandtransfer** | Keiner |
| **Löschfrist** | Unbegrenzt im Browser gespeichert, vom Nutzer jederzeit löschbar |
| **TOM-Verweis** | Daten verbleiben ausschließlich auf dem Endgerät des Nutzers |

---

## Verarbeitungstätigkeit 3: Webanalyse (Plausible Analytics)

| Feld | Beschreibung |
|---|---|
| **Bezeichnung** | Anonyme Website-Nutzungsanalyse |
| **Zweck** | Auswertung der Website-Nutzung zur Verbesserung des Angebots |
| **Kategorien betroffener Personen** | Website-Besucher (nur nach Einwilligung) |
| **Kategorien personenbezogener Daten** | Keine personenbezogenen Daten — ausschließlich aggregierte Daten: Seitenaufrufe, Verweisquellen, Gerätetyp, Land. Keine IP-Speicherung, keine Cookies |
| **Rechtsgrundlage** | Art. 6 Abs. 1 lit. a DSGVO (Einwilligung via Cookie-Banner) |
| **Empfänger/Auftragsverarbeiter** | Plausible Insights OÜ (Estland, EU) |
| **Drittlandtransfer** | Keiner (EU) |
| **Löschfrist** | Aggregierte Daten, kein Personenbezug |
| **TOM-Verweis** | Datenschutzfreundliche Analyse ohne Tracking, Consent-abhängiges Laden |

---

## Verarbeitungstätigkeit 4: Kontaktformular

| Feld | Beschreibung |
|---|---|
| **Bezeichnung** | Entgegennahme und Verarbeitung von Kontaktanfragen |
| **Zweck** | Bearbeitung von Kundenanfragen, Terminvereinbarung, Angebotserstellung |
| **Kategorien betroffener Personen** | Interessenten, potenzielle Kunden |
| **Kategorien personenbezogener Daten** | Name, Unternehmen, E-Mail, Telefon, Website, Branche, Mitarbeiterzahl, eingesetzte Tools, Digitalreifegrad, gewünschte Leistungen, Problembeschreibung, Ziele, Budget, Wunschtermin, Kontaktquelle |
| **Rechtsgrundlage** | Art. 6 Abs. 1 lit. b DSGVO (Vertragsanbahnung), Art. 6 Abs. 1 lit. a DSGVO (Einwilligung) |
| **Empfänger/Auftragsverarbeiter** | n8n (selbst gehostet, EU) — Workflow-Verarbeitung |
| **Drittlandtransfer** | Keiner (n8n auf eigenem EU-Server) |
| **Löschfrist** | Kontaktdaten werden nach Abschluss der Anfrage bzw. bei Widerruf gelöscht, spätestens nach 6 Monaten ohne Geschäftsbeziehung |
| **TOM-Verweis** | CSRF-Schutz, Rate-Limiting (5 Anfragen/15 Min.), E-Mail-Validierung, Whitelist-Filterung der Felder, HMAC-signierte Webhooks |

---

## Verarbeitungstätigkeit 5: KI-Chatbot und AI-Rezeptionist

| Feld | Beschreibung |
|---|---|
| **Bezeichnung** | KI-basierte Kommunikation mit Website-Besuchern |
| **Zweck** | Beantwortung von Fragen, Terminbuchung, Erfassung von Anfragen |
| **Kategorien betroffener Personen** | Website-Besucher, Interessenten |
| **Kategorien personenbezogener Daten** | Chat-Nachrichten (ggf. Name, E-Mail, Telefon, Anliegen), ggf. hochgeladene Bilder |
| **Rechtsgrundlage** | Art. 6 Abs. 1 lit. b DSGVO (Vertragsanbahnung), Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an effizienter Kundenkommunikation) |
| **Empfänger/Auftragsverarbeiter** | OpenAI, L.L.C. (USA) — KI-Sprachmodell; n8n (selbst gehostet, EU) — Workflow-Verarbeitung |
| **Drittlandtransfer** | USA (OpenAI) — EU-Standardvertragsklauseln, EU-US Data Privacy Framework |
| **Löschfrist** | Chatverläufe werden nicht dauerhaft gespeichert, Löschung nach Ende der Sitzung. Kontaktdaten nur bei expliziter Weitergabe durch den Nutzer in CRM übernommen |
| **TOM-Verweis** | Rate-Limiting (30 Anfragen/Stunde), HMAC-signierte Webhooks |

---

## Verarbeitungstätigkeit 6: Benutzerregistrierung und Authentifizierung

| Feld | Beschreibung |
|---|---|
| **Bezeichnung** | Registrierung und Anmeldung am Dashboard |
| **Zweck** | Bereitstellung eines geschützten Kundenbereichs |
| **Kategorien betroffener Personen** | Registrierte Kunden und Teammitglieder |
| **Kategorien personenbezogener Daten** | E-Mail-Adresse, Passwort (bcrypt-verschlüsselt), Vorname, Nachname, Sitzungsdaten (JWT-Token) |
| **Rechtsgrundlage** | Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) |
| **Empfänger/Auftragsverarbeiter** | Supabase Inc. (USA) — Datenbank und Auth-Service, gehostet in EU (Frankfurt, AWS eu-central-1) |
| **Drittlandtransfer** | Keiner (Daten in EU gehostet). Supabase Inc. als US-Unternehmen: EU-Standardvertragsklauseln als Absicherung |
| **Löschfrist** | Kontodaten: bis zur Löschung des Kontos durch den Nutzer oder auf Anfrage. Sitzungscookies: 7 Tage |
| **TOM-Verweis** | Passwort-Hashing (bcrypt), httpOnly-Cookies, CSRF-Token (24h), TLS-Verschlüsselung |

---

## Verarbeitungstätigkeit 7: Lead-Management und CRM

| Feld | Beschreibung |
|---|---|
| **Bezeichnung** | Verwaltung von Geschäftskontakten und Leads |
| **Zweck** | Kundenpflege, Vertrieb, Geschäftsanbahnung |
| **Kategorien betroffener Personen** | Geschäftskontakte, Leads, potenzielle Kunden (B2B) |
| **Kategorien personenbezogener Daten** | Name, E-Mail, Telefon, Unternehmen, Adresse, Website, Branche, LinkedIn-URL, Google-Business-Daten (Bewertung, Rezensionen), KI-generierte Zusammenfassungen und Tags, E-Mail-Entwürfe, Lead-Score, Aktivitätshistorie |
| **Rechtsgrundlage** | Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an Kundenakquise und -pflege), Art. 6 Abs. 1 lit. b DSGVO (Vertragsanbahnung) |
| **Empfänger/Auftragsverarbeiter** | Supabase Inc. (EU-gehostet) — Datenbank; n8n (selbst gehostet, EU) — Workflows; OpenAI (USA) — KI-Analyse/Scoring |
| **Drittlandtransfer** | USA (OpenAI) — EU-Standardvertragsklauseln, EU-US Data Privacy Framework |
| **Löschfrist** | Bei Widerspruch oder fehlender Geschäftsbeziehung: Löschung nach 12 Monaten Inaktivität. Aktive Geschäftskontakte: Dauer der Geschäftsbeziehung + gesetzliche Aufbewahrungsfristen |
| **TOM-Verweis** | Multi-Tenant-Isolation (tenant_id), rollenbasierte Zugriffskontrolle (admin/member), Row-Level Security in Supabase |

---

## Verarbeitungstätigkeit 8: E-Mail-Versand

| Feld | Beschreibung |
|---|---|
| **Bezeichnung** | Versand von Geschäfts-E-Mails an Leads/Kontakte |
| **Zweck** | Geschäftskorrespondenz, Nachfassen bei Anfragen |
| **Kategorien betroffener Personen** | Leads, Geschäftskontakte |
| **Kategorien personenbezogener Daten** | Empfänger-E-Mail, Name, E-Mail-Inhalt (Betreff, Text), Absenderinformationen, Zustellstatus, Bounce-Informationen |
| **Rechtsgrundlage** | Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung/-anbahnung), Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an Geschäftskommunikation) |
| **Empfänger/Auftragsverarbeiter** | Resend Inc. (USA) — E-Mail-Zustellung; n8n (selbst gehostet, EU) — Workflow |
| **Drittlandtransfer** | USA (Resend) — EU-Standardvertragsklauseln |
| **Löschfrist** | E-Mail-Metadaten (Bounces): 6 Monate. E-Mail-Inhalte: nicht dauerhaft bei Resend gespeichert |
| **TOM-Verweis** | Rate-Limiting (10/Min.), HMAC-signierte Webhooks (Resend), Bounce-Tracking zur Qualitätssicherung |

---

## Verarbeitungstätigkeit 9: Meeting-Analyse und Transkription

| Feld | Beschreibung |
|---|---|
| **Bezeichnung** | Transkription und Analyse von Meeting-Aufzeichnungen |
| **Zweck** | Erstellung von Meeting-Zusammenfassungen, Vorbereitung auf Meetings |
| **Kategorien betroffener Personen** | Gesprächsteilnehmer (intern und extern) |
| **Kategorien personenbezogener Daten** | Audiodaten (Sprachaufnahmen), Transkripte, Meeting-Zusammenfassungen, Teilnehmernamen, E-Mail-Adressen |
| **Rechtsgrundlage** | Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung), Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an effizienter Geschäftsorganisation). Hinweis: Bei Aufnahme externer Teilnehmer ist deren Einwilligung erforderlich |
| **Empfänger/Auftragsverarbeiter** | Groq Inc. (USA) — Sprach-zu-Text (Whisper-Modell); n8n (selbst gehostet, EU) — Zusammenfassungs-Workflows |
| **Drittlandtransfer** | USA (Groq) — EU-Standardvertragsklauseln |
| **Löschfrist** | Audiodaten: nicht dauerhaft bei Groq gespeichert (nur zur Verarbeitung). Transkripte: Dauer der Geschäftsbeziehung |
| **TOM-Verweis** | Dateigröße limitiert (20 MB Chunks), serverseitige Verarbeitung, authentifizierter Zugriff |

---

## Verarbeitungstätigkeit 10: Rate-Limiting und Missbrauchsschutz

| Feld | Beschreibung |
|---|---|
| **Bezeichnung** | Schutz vor missbräuchlicher Nutzung der API-Endpunkte |
| **Zweck** | Sicherstellung der Verfügbarkeit, Schutz vor DDoS und Spam |
| **Kategorien betroffener Personen** | Alle Nutzer der Website und API |
| **Kategorien personenbezogener Daten** | IP-Adresse (als Hash/pseudonymisierter Zähler) |
| **Rechtsgrundlage** | Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Sicherheit der Dienste) |
| **Empfänger/Auftragsverarbeiter** | Upstash Inc. (USA) — Redis-Datenbank für Zähler |
| **Drittlandtransfer** | USA (Upstash) — EU-Standardvertragsklauseln |
| **Löschfrist** | Automatische Löschung nach Ablauf des Zeitfensters (1–15 Minuten je nach Endpunkt) |
| **TOM-Verweis** | In-Memory-Fallback bei Nichterreichbarkeit von Upstash |

---

## Verarbeitungstätigkeit 11: Blog-Verwaltung

| Feld | Beschreibung |
|---|---|
| **Bezeichnung** | Erstellung und Veröffentlichung von Blog-Beiträgen |
| **Zweck** | Content-Marketing, Informationsbereitstellung |
| **Kategorien betroffener Personen** | Autoren (interne Mitarbeiter) |
| **Kategorien personenbezogener Daten** | Autorenname, Erstellungsdatum, Bilddateien |
| **Rechtsgrundlage** | Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an Unternehmenskommunikation) |
| **Empfänger/Auftragsverarbeiter** | Supabase Inc. (EU-gehostet) — Datenbank und Bildspeicher |
| **Drittlandtransfer** | Keiner (EU) |
| **Löschfrist** | Bis zur Löschung durch den Autor/Administrator |
| **TOM-Verweis** | Authentifizierter Zugriff, Mandantentrennung |

---

## Verarbeitungstätigkeit 12: Einladungssystem

| Feld | Beschreibung |
|---|---|
| **Bezeichnung** | Einladung neuer Teammitglieder zum Dashboard |
| **Zweck** | Onboarding von Kunden-Teammitgliedern |
| **Kategorien betroffener Personen** | Eingeladene Personen |
| **Kategorien personenbezogener Daten** | E-Mail-Adresse, Einladungstoken, Ablaufdatum, Nutzungsstatus |
| **Rechtsgrundlage** | Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) |
| **Empfänger/Auftragsverarbeiter** | Supabase Inc. (EU-gehostet) — Datenbank |
| **Drittlandtransfer** | Keiner (EU) |
| **Löschfrist** | Nicht eingelöste Einladungen: nach Ablauf (7 Tage). Eingelöste Einladungen: mit Kontolöschung |
| **TOM-Verweis** | Token-basierte Einladung mit Ablaufdatum, einmalige Verwendung |

---

## Übersicht Auftragsverarbeiter

| Dienstleister | Sitz | Daten | AVV | Drittlandgarantie |
|---|---|---|---|---|
| **Vercel Inc.** | USA | Server-Logs, IP-Adressen | Erforderlich | EU-Standardvertragsklauseln |
| **Supabase Inc.** | USA (Hosting: EU/Frankfurt) | Nutzerdaten, Leads, Auth | Erforderlich | EU-Standardvertragsklauseln + EU-Hosting |
| **OpenAI, L.L.C.** | USA | Chat-Nachrichten, KI-Anfragen | Erforderlich | EU-Standardvertragsklauseln, DPF |
| **Google LLC** | USA | Kalender, E-Mail-Funktionen | Erforderlich | EU-Standardvertragsklauseln, DPF |
| **Groq Inc.** | USA | Audiodaten zur Transkription | Erforderlich | EU-Standardvertragsklauseln |
| **Resend Inc.** | USA | E-Mail-Adressen, E-Mail-Inhalte | Erforderlich | EU-Standardvertragsklauseln |
| **Upstash Inc.** | USA | IP-basierte Zähler (pseudonymisiert) | Erforderlich | EU-Standardvertragsklauseln |
| **Plausible Insights OÜ** | Estland (EU) | Keine personenbezogenen Daten | Empfohlen | Nicht erforderlich (EU) |

**Status AVVs:** TODO — Vor Launch mit allen Auftragsverarbeitern abschließen.

---

## Technische und organisatorische Maßnahmen (TOM) — Übersicht

### Zutrittskontrolle
- Cloud-basierte Infrastruktur, kein physischer Serverzugang

### Zugangskontrolle
- Passwort-basierte Authentifizierung (bcrypt-Hashing)
- JWT-basierte Sitzungsverwaltung (7 Tage Gültigkeit)
- httpOnly-Cookies für Sitzungsdaten
- Rollenbasierte Zugriffskontrolle (Admin/Member)

### Zugriffskontrolle
- Multi-Tenant-Architektur mit strikter Mandantentrennung (tenant_id)
- Row-Level Security in Supabase
- Supabase Service-Role-Key nur serverseitig

### Weitergabekontrolle
- TLS/SSL-Verschlüsselung für alle Datenübertragungen
- HSTS mit 2 Jahren Gültigkeit und Preload
- HMAC-SHA256-signierte Webhooks
- Content Security Policy (CSP)

### Eingabekontrolle
- CSRF-Schutz (Double-Submit-Cookie, 24h Gültigkeit)
- Rate-Limiting auf allen API-Endpunkten
- E-Mail-Validierung
- Whitelist-Filterung bei Formulardaten

### Auftragskontrolle
- AVVs mit allen Auftragsverarbeitern (TODO: abschließen)
- EU-Standardvertragsklauseln für US-Dienste

### Verfügbarkeitskontrolle
- Hosting bei Vercel (globales CDN, automatische Skalierung)
- In-Memory-Fallback bei Ausfall von Upstash Redis

### Trennungskontrolle
- Multi-Tenant-Datenbank mit tenant_id-Filterung
- Separate Supabase-Buckets für verschiedene Datentypen

---

## Hinweise

1. Dieses Verzeichnis ist mindestens einmal jährlich zu überprüfen und bei Änderungen der Verarbeitungstätigkeiten zeitnah zu aktualisieren.
2. Bei Einführung neuer Dienste oder Verarbeitungstätigkeiten ist dieses Verzeichnis vor Inbetriebnahme zu ergänzen.
3. Bei KI-gestützter Verarbeitung personenbezogener Daten ist zu prüfen, ob eine Datenschutz-Folgenabschätzung (DSFA) gemäß Art. 35 DSGVO erforderlich ist.
4. Die AVVs mit allen aufgeführten Auftragsverarbeitern sind vor dem Launch der Website abzuschließen und diesem Verzeichnis als Anlage beizufügen.
