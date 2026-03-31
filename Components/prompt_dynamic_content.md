# Prompt: Website-Content dynamisch aus Supabase laden

Nutze diesen Prompt NACHDEM die website_texts Eintraege in Supabase erstellt wurden (siehe prompt_website_texts.md).
Dieser Prompt macht die statischen Komponenten dynamisch, sodass Texte und Bilder aus der Datenbank kommen und ueber das Dashboard editierbar sind.

---

## Prompt zum Kopieren

```
Mache den gesamten Content dieser Website dynamisch. Alle Texte und Bilder 
sollen aus der Supabase-Tabelle "website_texts" geladen werden, damit der 
Kunde sie ueber sein Dashboard aendern kann.

**Supabase-Projekt:**
- URL: process.env.NEXT_PUBLIC_SUPABASE_URL
- Anon Key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

**Tabelle: website_texts**
Spalten: text_id (text), page (text), section (text), type (text), 
         label (text), content (jsonb), tenant_id (uuid)

Die content-Spalte ist JSONB mit diesen moeglichen Feldern:
- headline_bold, headline_italic (Strings)
- subheadline (String)
- badge (String)
- paragraphs (String-Array)
- buttons (Array von {label, url, variant})
- features (Array von {label, description?})
- hero_image, cover_image, logo_url, banner_image (Strings mit Bild-URLs)
- nodes (Array von {label, position}) + center ({label})

**Tenant-Zuordnung:**
Die Website muss ihren Tenant ueber den Origin-Header identifizieren.
In der tenants-Tabelle gibt es eine "website"-Spalte mit der Domain.

---

### SCHRITT 1: Erstelle eine Hilfsfunktion zum Laden der Texte

Erstelle /lib/website-content.ts:

  import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
  // oder je nach Setup: createClient aus @supabase/ssr

  // Laedt alle website_texts fuer einen bestimmten Tenant anhand der Domain
  export async function getWebsiteContent(page: string) {
    // Option A: Server Component mit headers()
    // Tenant ueber Origin/Host Header identifizieren
    // Option B: Statisch mit bekannter tenant_id
    
    const supabase = createClient()
    
    const { data } = await supabase
      .from('website_texts')
      .select('text_id, section, type, content')
      .eq('page', page)
      .order('sort_order')
    
    // In ein einfach nutzbares Objekt umwandeln:
    // { hero: { badge, headline_bold, ... }, about: { ... } }
    const sections: Record<string, Record<string, unknown>> = {}
    for (const row of data ?? []) {
      sections[row.section] = {
        ...((sections[row.section] as Record<string, unknown>) ?? {}),
        ...(row.content as Record<string, unknown>),
        _type: row.type,
      }
    }
    return sections
  }

  // Hilfsfunktion fuer einzelne Sektion
  export async function getSection(page: string, section: string) {
    const supabase = createClient()
    const { data } = await supabase
      .from('website_texts')
      .select('content')
      .eq('page', page)
      .eq('section', section)
      .order('sort_order')
    
    if (!data || data.length === 0) return null
    
    // Mehrere Eintraege pro Sektion mergen (z.B. text + nodes)
    let merged: Record<string, unknown> = {}
    for (const row of data) {
      merged = { ...merged, ...(row.content as Record<string, unknown>) }
    }
    return merged
  }

---

### SCHRITT 2: Konvertiere jede Sektion zu einer dynamischen Komponente

Fuer JEDE Sektion auf der Website:

1. Finde den statischen Text im Component-Code
2. Ersetze ihn durch Daten aus getSection() / getWebsiteContent()
3. Baue Fallback-Werte ein fuer den Fall dass die DB leer ist

**Beispiel: Statische Hero-Sektion VORHER:**

  function Hero() {
    return (
      <section>
        <span>KI-Infrastruktur fuer den Mittelstand</span>
        <h1><b>Dein Unternehmen hat jetzt ein</b> <em>Betriebssystem</em></h1>
        <p>Jede Loesung, die wir bauen...</p>
        <a href="/demo">Demo buchen</a>
      </section>
    )
  }

**Beispiel: Dynamische Hero-Sektion NACHHER:**

  import { getSection } from '@/lib/website-content'

  async function Hero() {
    const content = await getSection('home', 'hero')
    
    const badge = (content?.badge as string) ?? ''
    const headlineBold = (content?.headline_bold as string) ?? ''
    const headlineItalic = (content?.headline_italic as string) ?? ''
    const subheadline = (content?.subheadline as string) ?? ''
    const heroImage = (content?.hero_image as string) ?? ''
    const buttons = (content?.buttons as {label:string, url:string, variant:string}[]) ?? []

    return (
      <section>
        {badge && <span>{badge}</span>}
        <h1>
          {headlineBold && <b>{headlineBold}</b>}{' '}
          {headlineItalic && <em>{headlineItalic}</em>}
        </h1>
        {subheadline && <p>{subheadline}</p>}
        {heroImage && <img src={heroImage} alt={headlineBold} />}
        {buttons.map((btn, i) => (
          <a key={i} href={btn.url}>{btn.label}</a>
        ))}
      </section>
    )
  }

---

### SCHRITT 3: Bilder dynamisch laden

Bild-Felder (hero_image, cover_image, logo_url, etc.) enthalten entweder:
- Eine vollstaendige Supabase Storage URL
- Einen leeren String (kein Bild gesetzt)

Regeln:
- Leerer String = Bild nicht rendern (kein kaputter <img> Tag)
- next/image verwenden wenn moeglich, aber mit unoptimized={true} fuer 
  externe Supabase-URLs, oder die Domain in next.config.ts eintragen
- Alt-Text aus dem Kontext ableiten (Headline oder Section-Name)

  {heroImage && (
    <Image src={heroImage} alt={headlineBold || 'Hero'} 
           width={1200} height={600} className="..." />
  )}

next.config.ts Domain hinzufuegen:
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  }

---

### SCHRITT 4: Ganzseitige Integration

Fuer eine komplette Seite (z.B. Home):

  import { getWebsiteContent } from '@/lib/website-content'

  export default async function HomePage() {
    const content = await getWebsiteContent('home')
    
    return (
      <>
        <Hero content={content.hero} />
        <AboutSection content={content.about} />
        <ServicesGrid content={content.services} />
        <CTASection content={content.cta} />
        <Footer content={content.footer} />
      </>
    )
  }

Jede Section-Komponente bekommt ihr content-Objekt als Prop:

  function AboutSection({ content }: { content?: Record<string, unknown> }) {
    if (!content) return null
    
    const badge = (content.badge as string) ?? ''
    const headlineBold = (content.headline_bold as string) ?? ''
    const headlineItalic = (content.headline_italic as string) ?? ''
    const paragraphs = (content.paragraphs as string[]) ?? []
    const features = (content.features as {label:string}[]) ?? []
    const coverImage = (content.cover_image as string) ?? ''

    return (
      <section>
        {badge && <span>{badge}</span>}
        <h2><b>{headlineBold}</b> <em>{headlineItalic}</em></h2>
        {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
        {coverImage && <img src={coverImage} alt={headlineBold} />}
        {features.length > 0 && (
          <ul>
            {features.map((f, i) => <li key={i}>{f.label}</li>)}
          </ul>
        )}
      </section>
    )
  }

---

### Regeln

1. JEDER hardcodierte Text muss durch einen Supabase-Wert ersetzt werden
2. JEDES statische Bild (das der Kunde aendern koennen soll) muss durch 
   ein Bild-Feld aus content ersetzt werden
3. Immer Fallback-Werte angeben (leerer String, leeres Array)
4. Leere Felder = Element nicht rendern (kein leerer <p>, kein kaputtes <img>)
5. Server Components nutzen (async function) fuer das Laden
6. Styling/CSS NICHT aendern — nur die Datenquelle ersetzen
7. Komponenten-Struktur und Layout NICHT aendern
8. TypeScript-Typen beibehalten

Gehe jetzt JEDE Seite und JEDE Sektion durch und mache sie dynamisch.
Zeige mir den vollstaendigen Code fuer jede geaenderte Datei.
```

---

## Workflow Zusammenfassung

| Schritt | Prompt | Was passiert |
|---------|--------|-------------|
| 1 | prompt_website_texts.md | SQL-Inserts: Texte in Supabase eintragen |
| 2 | prompt_dynamic_content.md | Code: Komponenten dynamisch machen |
| 3 | Dashboard | Kunde editiert Texte und Bilder selbst |

---

## Checkliste nach der Umstellung

- [ ] /lib/website-content.ts existiert mit getWebsiteContent() und getSection()
- [ ] Supabase Domain in next.config.ts images.remotePatterns eingetragen
- [ ] Jede Sektion laedt content aus Supabase statt hardcoded
- [ ] Bilder werden nur gerendert wenn URL nicht leer
- [ ] Fallback-Werte fuer alle Felder vorhanden
- [ ] Website laeuft ohne Fehler wenn website_texts leer ist
- [ ] Texte im Dashboard aendern → Website zeigt neue Texte nach Reload
- [ ] Bilder im Dashboard hochladen → Website zeigt neue Bilder nach Reload
