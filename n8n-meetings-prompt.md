# Onvero Meetings — n8n Workflow Prompt

Du baust die n8n-Workflows für das Meetings-Feature von Onvero. Unten ist alles, was du wissen musst.

---

## Projekt-Überblick

Onvero ist eine KI-gestützte Sales-Plattform (Next.js + Supabase + n8n). Das Meetings-Feature ist im Frontend + Backend fertig gebaut. Es fehlen **2 n8n-Workflows**, die die KI-Analyse und die automatische Meeting-Erstellung steuern.

## n8n Server

- **URL:** `https://n8n.srv1223027.hstgr.cloud`
- **Webhook-Secret:** `59317c4c-217d-4046-93d8-15ea3e94dbb6`
- **Signing:** HMAC-SHA256 — Headers: `x-webhook-secret`, `x-webhook-signature`, `x-webhook-timestamp`

## Supabase

- **Projekt-ID:** `jnaqmsvozkpqawqwslrl`
- **Region:** eu-west-1
- **DB Host:** `db.jnaqmsvozkpqawqwslrl.supabase.co`

---

## Supabase Tabellen (bereits erstellt)

### `meetings`
```sql
id UUID PK, tenant_id UUID, lead_id UUID FK→leads, title TEXT, type TEXT ('Video'|'Telefon'|'Vor Ort'),
status TEXT ('Geplant'|'Aktiv'|'Abgeschlossen'), date DATE, time TIME, duration INT, phases JSONB,
product TEXT, notes TEXT, from_suggestion BOOL, win_loss TEXT ('won'|'lost'|'pending'|NULL),
created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
```

### `meeting_recordings`
```sql
id UUID PK, meeting_id UUID FK→meetings, tenant_id UUID, storage_path TEXT,
duration_seconds INT, file_size_bytes BIGINT, mime_type TEXT, created_at TIMESTAMPTZ
```

### `meeting_transcripts`
```sql
id UUID PK, meeting_id UUID FK→meetings, tenant_id UUID, transcript TEXT,
language TEXT, provider TEXT, created_at TIMESTAMPTZ
```

### `meeting_notes`
```sql
id UUID PK, meeting_id UUID FK→meetings, tenant_id UUID, text TEXT,
timestamp_seconds INT, phase_id TEXT, phase_name TEXT, created_at TIMESTAMPTZ
```

### `meeting_analysis`
```sql
id UUID PK, meeting_id UUID FK→meetings, tenant_id UUID, summary TEXT,
action_items JSONB, ai_insights JSONB, sentiment TEXT ('positive'|'neutral'|'negative'),
talk_ratio_user REAL, talk_ratio_customer REAL, follow_up_draft TEXT,
coaching_scores JSONB, created_at TIMESTAMPTZ
```

### `meeting_suggestions`
```sql
id UUID PK, tenant_id UUID, lead_id UUID FK→leads, lead_name TEXT, company TEXT,
email_snippet TEXT, suggested_type TEXT, suggested_duration INT, reason TEXT,
dismissed BOOL, accepted BOOL, created_at TIMESTAMPTZ
```

### `leads` (bereits vorhanden, relevante Felder)
```sql
id UUID, tenant_id UUID, company_name TEXT, first_name TEXT, last_name TEXT,
email TEXT, phone TEXT, status TEXT, score INT, ai_summary TEXT, ai_tags JSONB,
ai_next_action TEXT, email_draft_subject TEXT, email_draft_body TEXT
```

---

## Workflow 1: Meeting KI-Analyse (Phase 10)

### Trigger
Webhook: `N8N_WEBHOOK_MEETING_ANALYZER` (neu erstellen)

### Wann wird er aufgerufen?
Nachdem ein Meeting beendet und die Transkription abgeschlossen wurde. Das Frontend (oder ein separater API-Call) ruft den Webhook auf.

### Input-Payload
```json
{
  "meeting_id": "uuid",
  "tenant_id": "uuid",
  "transcript": "Der komplette Transkript-Text des Meetings",
  "meeting_title": "Discovery Call — Firma GmbH",
  "meeting_type": "Video",
  "contact_name": "Marcus Weber",
  "company": "Stackbase GmbH",
  "product": "Smart Parcel Logistik-Software",
  "notes": [
    { "text": "Interesse an API-Integration", "timestamp": 120, "phaseName": "Bedarfsanalyse" },
    { "text": "Budget ca. 5000/Monat", "timestamp": 340, "phaseName": "Kurzpitch" }
  ],
  "phases": [
    { "name": "Begrüßung", "duration": 2 },
    { "name": "Bedarfsanalyse", "duration": 10 },
    { "name": "Kurzpitch", "duration": 5 }
  ]
}
```

### Was der Workflow machen soll

1. **Zusammenfassung generieren** — Kurze, strukturierte Summary des Gesprächs (3-5 Sätze). Deutsch.
2. **Action Items extrahieren** — Konkrete nächste Schritte als JSON-Array: `[{"text": "Angebot senden", "assignee": "user", "priority": "high"}]`
3. **KI-Insights generieren** — 3-5 Erkenntnisse als JSON-Array: `["Hohe Kaufbereitschaft", "Budget vorhanden: 5000/Monat", "Entscheidung in 2 Wochen"]`
4. **Sentiment analysieren** — `"positive"`, `"neutral"`, oder `"negative"`
5. **Talk-Ratio berechnen** — Anteil User vs. Kunde (z.B. 0.6 und 0.4). Kann aus dem Transkript geschätzt werden anhand von Sprecherwechseln.
6. **Follow-Up E-Mail Draft** — Personalisierte Follow-Up-E-Mail basierend auf dem Gespräch. Deutsch.
7. **Coaching Scores** — JSON-Objekt mit Bewertungen (0-100):
```json
{
  "gespraechsanteil": 62,
  "fragetechnik": 78,
  "einwandbehandlung": 55,
  "closing": 71,
  "bedarfsanalyse": 83,
  "follow_up": 68
}
```

### Output — In Supabase schreiben
Alles in die `meeting_analysis` Tabelle schreiben (INSERT oder UPSERT auf `meeting_id`):

```json
{
  "meeting_id": "<aus input>",
  "tenant_id": "<aus input>",
  "summary": "<generierter text>",
  "action_items": [{"text": "...", "assignee": "user", "priority": "high"}],
  "ai_insights": ["Insight 1", "Insight 2", "Insight 3"],
  "sentiment": "positive",
  "talk_ratio_user": 0.62,
  "talk_ratio_customer": 0.38,
  "follow_up_draft": "<generierter email text>",
  "coaching_scores": {"gespraechsanteil": 62, "fragetechnik": 78, ...}
}
```

### Webhook Response
```json
{
  "success": true,
  "summary": "<kurzfassung>",
  "action_items": [...],
  "ai_insights": [...]
}
```

### LLM-Prompt Vorlage
Nutze einen System-Prompt wie:
```
Du bist ein erfahrener Sales-Coach. Analysiere das folgende Verkaufsgespräch und gib strukturiertes Feedback.
Sprache: Deutsch.
Antworte ausschließlich im angegebenen JSON-Format.
```

---

## Workflow 2: Auto-Meeting aus E-Mail-Antwort (Phase 11)

### Trigger
Webhook: `N8N_WEBHOOK_MEETING_AUTO_SUGGEST` (neu erstellen)

### Wann wird er aufgerufen?
Wenn eine E-Mail-Antwort von einem Lead eingeht. Dies kann über einen E-Mail-Webhook, einen Polling-Workflow, oder manuell getriggert werden.

### Input-Payload
```json
{
  "tenant_id": "uuid",
  "lead_id": "uuid",
  "lead_name": "Clara Wolff",
  "company": "Silo Labs",
  "email_subject": "Re: Ihre Anfrage zu Smart Parcel",
  "email_body": "Vielen Dank für die Info! Hätte Interesse an einem kurzen Gespräch...",
  "lead_status": "contacted",
  "lead_score": 72
}
```

### Was der Workflow machen soll

1. **E-Mail analysieren** — Ist die Antwort positiv/interessiert? Oder eine Absage?
2. **Wenn positiv:**
   - **Email-Snippet extrahieren** — Der relevanteste Satz aus der Antwort (max 200 Zeichen)
   - **Meeting-Typ vorschlagen** — Basierend auf Lead-Score und Kontext (`Video`, `Telefon`, oder `Vor Ort`)
   - **Dauer vorschlagen** — Basierend auf dem Stadium (Discovery: 25min, Demo: 35min, Follow-Up: 20min)
   - **Grund generieren** — Kurze Erklärung warum ein Meeting vorgeschlagen wird (z.B. "Positive Antwort auf E-Mail — Interesse an Gespräch signalisiert")
   - **In Supabase schreiben** — Neuen Eintrag in `meeting_suggestions`
3. **Wenn negativ:** Nichts tun (oder optional den Lead-Status auf "lost" updaten)

### Output — In Supabase schreiben
Neuer Eintrag in `meeting_suggestions`:

```json
{
  "tenant_id": "<aus input>",
  "lead_id": "<aus input>",
  "lead_name": "Clara Wolff",
  "company": "Silo Labs",
  "email_snippet": "Hätte Interesse an einem kurzen Gespräch, um Details zu klären…",
  "suggested_type": "Video",
  "suggested_duration": 25,
  "reason": "Positive Antwort auf E-Mail erkannt — Interesse an Gespräch signalisiert",
  "dismissed": false,
  "accepted": false
}
```

### Optional: Lead-Score Update
Wenn die Antwort positiv ist, den Lead-Score in der `leads` Tabelle um +10 erhöhen und `ai_next_action` auf "Meeting vereinbaren" setzen.

### Webhook Response
```json
{
  "success": true,
  "suggestion_created": true,
  "sentiment": "positive",
  "suggested_type": "Video"
}
```

---

## Bestehende Webhook-Patterns die du als Referenz nutzen kannst

### Meeting Summarizer (bereits vorhanden, ähnliches Pattern)
- Env: `N8N_WEBHOOK_MEETING_SUMMARIZER`
- Input: `{ "transcript": "...", "summary_type": "standard", "tenant_id": "..." }`
- Output: `{ "summary": "...", "result": "..." }` oder plain text

### Lead Scoring (bereits vorhanden)
- Env: `N8N_WEBHOOK_KI_SCORING`
- Input: `{ "lead_id": "...", "tenant_id": "..." }`
- Signed with HMAC headers

---

## Neue ENV-Variablen die angelegt werden müssen

In `.env.local` der Next.js App:
```
N8N_WEBHOOK_MEETING_ANALYZER=https://n8n.srv1223027.hstgr.cloud/webhook/<deine-neue-id>
N8N_WEBHOOK_MEETING_AUTO_SUGGEST=https://n8n.srv1223027.hstgr.cloud/webhook/<deine-neue-id>
```

---

## Zusammenfassung

| Workflow | Trigger | Input | Output | Schreibt in |
|----------|---------|-------|--------|-------------|
| Meeting KI-Analyse | Webhook nach Transkription | meeting_id, transcript, notes, phases | summary, actions, insights, coaching | `meeting_analysis` |
| Auto-Meeting Vorschlag | Webhook bei E-Mail-Antwort | lead_id, email_body, lead_score | suggestion mit Typ/Dauer/Grund | `meeting_suggestions` |

Beide Workflows brauchen Supabase-Zugriff (Service-Role-Key) zum Schreiben in die DB.
