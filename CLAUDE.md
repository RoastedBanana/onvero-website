# Claude Context — Onvero

## IMMER ZUERST LESEN
`/Users/hanslacher/Documents/Obsidian Vault/Onvero/Claude Memory/_START.md`

Danach NUR die Datei laden die für die konkrete Frage relevant ist (Tabelle in _START.md).
Bei Frontend/Design zusätzlich: `Design-System.md`

## AM ENDE JEDES GESPRÄCHS — VAULT UPDATEN
Neue wichtige Erkenntnisse, Entscheidungen, oder Statusänderungen zurück in den Vault schreiben:
- `_START.md` — wenn sich Projektstatus, Stack oder Regeln ändern
- Passende Datei (Tech-Stack, Projekte, Kunden, etc.) — für inhaltliche Details
Nur wirklich Neues eintragen — kein Code, keine git-History, keine temporären Tasks.

## ⚠️ KRITISCHE REGELN — NIEMALS VERGESSEN

### Frontend — NACH APP TRENNEN!
**`apps/website` (app.onvero.de — altes Dashboard):**
- **KEIN Tailwind** — inline styles ONLY, kein className für Styles
- **DM Sans** — immer als Font laden
- **Dark Theme only** — Background #080808, Accent #6B7AFF

**`apps/sales` (sales.onvero.de — neue Plattform):**
- **Tailwind v4** — className für Styles
- **Nunito** — Font für neue Plattform
- **Weißes Design** — #FFFFFF bg, #0A2540 navy, #4F46E5 indigo

**Beide Apps:**
- **Keine Emojis** — nicht im UI, nicht in Comments
- **Deutsches UI** — alle user-facing Strings auf Deutsch

### Backend / n8n
- n8n Webhook-URLs immer als env vars (nie hardcoded)
- Claude API max_tokens: immer > 1500
- Supabase JSONB: `||` operator zum mergen
- Nach n8n partial updates: immer `n8n_validate_workflow` aufrufen

### Was niemals in Kunden-UI darf
- Apollo.io, n8n, interne Tool-Namen, Preise/Margen

## Projekt (Monorepo ab 29.04.2026)
- **Repo:** `/Users/hanslacher/onvero-website`
- **Altes Dashboard:** `/apps/website` → https://app.onvero.de
- **Neue Plattform:** `/apps/sales` → https://sales.onvero.de (Port 3001 lokal)
- **Marketing:** `/apps/marketing` → https://onvero.de
- **Shared UI:** `/packages/ui`

## Arbeitsweise
- Production-ready — keine Placeholder, keine TODOs
- Direct file edits — nicht nur Snippets zeigen
- Erst planen wenn unklar, dann bauen
- Vor "fixed" sagen: validieren
