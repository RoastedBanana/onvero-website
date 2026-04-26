# Onvero Monorepo

Turborepo + npm workspaces. Drei deployable Apps + drei shared Packages.

```
onvero/
├── apps/
│   ├── marketing/   → onvero.de              (Landing, Blog, Buchen, Legal)
│   ├── sales/       → sales.onvero.de        (Login + /dashboard, alle CRM-Routen)
│   └── website/     → website.onvero.de      (Platzhalter, kommt noch)
└── packages/
    ├── ui/                  @onvero/ui              (49 React-Components)
    ├── lib/                 @onvero/lib             (Supabase, CSRF, Rate-Limit, Utils)
    └── config/tailwind/     @onvero/tailwind-preset (Design-Tokens, CSS-Theme)
```

---

## Setup (einmalig)

```bash
git clone https://github.com/RoastedBanana/onvero-website.git
cd onvero-website
npm install     # installiert alles für alle Apps + Packages
```

**Node:** ≥ 20. **Package-Manager:** npm (kein pnpm/yarn).

### Environment-Variablen

`.env.local` pro App, **niemals committen** (sind in `.gitignore`):

- `apps/sales/.env.local` — Vorlage: `apps/sales/.env.example` (Supabase, n8n, Groq, Upstash, Resend)
- `apps/marketing/.env.local` — Mindestens: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `N8N_WEBHOOK_CHAT`
- `apps/website/.env.local` — leer, noch nicht benötigt

Frag Jan nach den aktuellen Werten oder zieh sie aus Vercel: `vercel env pull` im jeweiligen App-Ordner (Vercel CLI erforderlich).

---

## Lokal entwickeln

### Alle Apps gleichzeitig

```bash
npm run dev
```

Startet via Turborepo parallel:
- marketing → http://localhost:3000
- sales     → http://localhost:3001
- website   → http://localhost:3002

### Nur eine App

```bash
cd apps/sales && npm run dev
# oder
npx turbo dev --filter=@onvero/sales
```

### Build / Type-Check / Lint

```bash
npm run build         # baut alle Apps + Packages, mit Caching
npm run type-check
npm run lint
```

Turbo cached intelligent — wenn nichts geändert wurde, ist der Build in <1s durch.

---

## Wo schreibe ich was?

### Neue Seite in der Sales-App
`apps/sales/app/dashboard/<route>/page.tsx`. Routen unter `/dashboard/*` sind authentifiziert (siehe `apps/sales/proxy.ts`). State-Management via lokaler Hooks (`_use-leads.tsx` etc.) — kein Redux/Zustand.

### Neue Marketing-Seite
`apps/marketing/app/<route>/page.tsx`. Öffentlich, keine Auth.

### Neuer wiederverwendbarer UI-Component
`packages/ui/src/<namespace>/<name>.tsx`, dann importierbar als:

```tsx
import { Button } from '@onvero/ui/primitives/button';
import { Navbar } from '@onvero/ui/marketing/navbar';
```

**Namespaces:**
- `primitives/` — Buttons, Cards, Inputs, Popovers (Radix-basiert)
- `marketing/` — Hero-Sections, Bento-Grids, Navbar, Footer (für Landing-Pages)
- `effects/` — Animations, 3D, Confetti, Shimmer
- `chat/` — Chat-Widget-Bausteine
- `app-shell/` — `Providers`, `CookieConsent`, `AnalyticsLoader`, `ContactForm`
- `hooks/` — Shared React Hooks (`use-auto-scroll`)

**Wichtig:** Components mit Browser-APIs brauchen `'use client'` als erste Zeile.

### Neue Utility / Server-Code
`packages/lib/src/<name>.ts`. Beispiele:

```tsx
import { cn } from '@onvero/lib/utils';
import { createServerSupabaseClient } from '@onvero/lib/supabase-server';
import { createClient } from '@onvero/lib/supabase';
```

**Server-only Code** (alles was `next/headers` oder andere Server-APIs nutzt) MUSS in einem eigenen Subpath wie `supabase-server` liegen. Sonst landet es im Browser-Bundle und der Build bricht.

### Sales-spezifischer Code (kein Shared)
Bleibt in `apps/sales/app/dashboard/_*.tsx` (Underscore-Prefix = Next.js "Private Route Segment", nicht als Route gerendert). Beispiele: `_shared.tsx` (1280-Zeilen Sales-Design-System), `_use-leads.tsx`, `_command-palette.tsx`.

### Neue Tailwind-Klasse oder Design-Token
- **Globale Tokens** (Farben, Schriften): `packages/config/tailwind/tokens.css`
- **Theme-Mapping** (`--color-*` Variablen für Tailwind): `packages/config/tailwind/theme.css`
- **Body/Scrollbar/Resets:** `packages/config/tailwind/base.css`

Änderungen wirken sofort in allen drei Apps.

### Neue API-Route
- **Sales-API** (Tenant-scoped, Auth nötig): `apps/sales/app/api/<route>/route.ts`
- **Public-API** (Marketing): `apps/marketing/app/api/<route>/route.ts`

Geteilte Business-Logik: in `packages/lib/src/`, Route-Handler sind dann dünne Wrapper.

---

## Import-Konventionen

| Import | Bedeutung |
|---|---|
| `from '@onvero/ui/...'` | Geteilte Komponenten |
| `from '@onvero/lib/...'` | Geteilte Utilities & Server-Code |
| `from '@/...'` | App-internes (relativ zur App-Root, z. B. `@/app/dashboard/_shared`) |
| `from './...'` oder `'../...'` | Relativ — für nahe Geschwister |

**Niemals** `@/components/*` oder `@/lib/*` — das gibt's seit der Monorepo-Migration nicht mehr.

---

## Deployment

Drei Vercel-Projekte automatisch verlinkt mit GitHub-Repo:

| Projekt | Domain | Auto-Deploy von |
|---|---|---|
| `onvero-marketing` | (noch keine, kommt später) | `main` Branch |
| `onvero-sales` | `sales.onvero.de` | `main` |
| `onvero-website` | `website.onvero.de` | `main` |
| `onvero-website-legacy` | `onvero.de`, `www.onvero.de` | `main` (zeigt auf `apps/marketing`) |

**Push auf `main`** → alle 4 Projekte rebuilden parallel. Turbo-Cache + `turbo-ignore` minimieren überflüssige Builds.

**Feature-Branches** → Preview-Deploy pro Projekt mit URL wie `onvero-sales-<hash>.vercel.app` (Vercel-SSO-geschützt; mit Vercel-Login erreichbar).

---

## Git-Workflow

```bash
git checkout main && git pull
git checkout -b feat/dein-feature

# ... arbeiten, lokal testen mit npm run build ...

git push -u origin feat/dein-feature
gh pr create   # oder über GitHub UI
```

**Konventionen:**
- Branch-Namen: `feat/...`, `fix/...`, `chore/...`, `refactor/...`
- Commit-Messages: kurze imperative Beschreibung. Optional Conventional Commits (`feat:`, `fix:`, `chore:`)
- PRs: kleinere Patches lieber öfter, statt riesige Mega-PRs
- Production-Deploys passieren bei jedem Merge auf `main` — vorher local `npm run build` durchlaufen lassen

---

## Bekannte Stolpersteine

1. **Tailwind-Klassen funktionieren nicht im neuen Component:** Prüf ob die Datei unter `packages/ui/src/**/*.{ts,tsx}` liegt — sonst scannt Tailwind sie nicht. Notfalls in `apps/<name>/app/globals.css` die `@source`-Direktive checken.

2. **`Module not found: @onvero/lib/...`:** Vergessen `npm install` im Repo-Root nach dem Anlegen einer neuen `packages/`-Datei mit neuen Subpath-Exports? Workspace-Linking aktualisieren mit `npm install`.

3. **Build bricht mit `next/headers` Fehler:** Du importierst Server-Code (`@onvero/lib/supabase-server`) aus einer Client-Component (`'use client'`-Datei). Stattdessen `@onvero/lib/supabase` (Browser-Variante) nutzen.

4. **Alte URL-Pfade vergessen:** `/sales/*` gibt es nicht mehr — heißt jetzt `/dashboard/*`. Marketing leitet alte Bookmarks per 308 weiter. In neuem Code direkt `/dashboard/...` verwenden.

5. **`AUTH_COOKIE_DOMAIN` lokal nicht setzen:** Die Variable ist nur für Production (`.onvero.de`). Lokal würde sie Cookies für `localhost` brechen. In `.env.local` weglassen.

6. **`_archive/` ignorieren:** Liegt am Repo-Root, enthält Legacy-Dashboard-Code zur Sicherheit. Nicht editieren — wird in 2-4 Wochen gelöscht.

7. **Stray `~/package-lock.json`:** Falls Vercel-CLI oder Turbopack die "wrong workspace root" warning zeigt — siehe `turbopack.root` Setting in den `next.config.ts` der Apps. Sollte schon korrekt sein.

---

## Cheat-Sheet

```bash
npm run dev                                        # alle Apps parallel
npx turbo dev --filter=@onvero/sales               # nur sales
npx turbo build --filter=@onvero/marketing         # nur marketing bauen
npx turbo build --filter='...[origin/main]'        # nur was sich ggü. main geändert hat
npx turbo run lint type-check                      # zwei Tasks parallel über alle Workspaces
npm install <pkg> -w @onvero/sales                 # Dep zu spezifischer App hinzufügen
npm install <pkg> -w @onvero/ui                    # Dep zu shared package
```

---

## Fragen?

Frag Jan oder check `CLAUDE.md` / `AGENTS.md` in den Unterordnern für AI-Coding-Kontext.
