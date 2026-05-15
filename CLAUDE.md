# Claude Context — Onvero

## SESSION START — IMMER ZUERST LESEN
`/Users/hanslacher/Documents/Obsidian Vault/Onvero/Claude Memory/_START.md`

Danach NUR die Datei laden die zur konkreten Frage passt (Routing-Tabelle in _START.md):
- Code / Auth / DB / Design → `Dev.md`
- Kunden → `Kunden.md`
- SmartParcel Projekt → `SmartParcel.md`
- Tasks → `Tasks.md`
- Links / IDs → `Refs.md`
- Strategie / Pakete → `Onvero.md`
- Zahlen / Kosten → `Finanzen.md`

**NICHT alle Dateien laden — Token-Effizienz ist wichtig.**

## NACH JEDEM GESPRÄCH — VAULT UPDATEN
Neue Erkenntnisse, Entscheidungen, Statusänderungen in die passende Datei schreiben.
Nur wirklich Neues — kein Code, keine git-History, keine temporären Tasks.

## ⚠️ KRITISCHE REGELN

### Frontend — NACH APP TRENNEN!
**`apps/website` (app.onvero.de):** Inline styles ONLY · DM Sans · Dark: #080808 bg, #6B7AFF accent
**`apps/sales` (sales.onvero.de):** Tailwind v4 · Nunito · White: #FFF bg, #0A2540 navy, #4F46E5 indigo
**Beide:** Keine Emojis · Deutsches UI · Kein Apollo/n8n/Tool-Namen in Kunden-UI

### Backend
- n8n Webhook-URLs immer als env vars (nie hardcoded)
- Claude API max_tokens: immer > 1500
- Supabase JSONB: `||` operator zum mergen
- Nach n8n partial updates: immer `n8n_validate_workflow`

## Repo (Monorepo)
- `/apps/sales` → sales.onvero.de (Port 3001 lokal)
- `/apps/website` → app.onvero.de
- `/apps/marketing` → onvero.de
- `/packages/ui`, `/packages/lib`

## Arbeitsweise
- Production-ready — keine Placeholder, keine TODOs
- Direct file edits — nicht nur Snippets zeigen
- Erst planen wenn unklar, dann bauen
- Vor "fixed" sagen: validieren
