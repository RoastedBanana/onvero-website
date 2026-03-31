# Prompt: Website-Texte in Supabase eintragen

Nutze diesen Prompt wenn du eine neue Kunden-Website baust und die Texte im BusinessOS-Dashboard editierbar machen willst.

---

## Prompt zum Kopieren

```
Ich habe eine neue Kunden-Website gebaut und brauche jetzt die SQL-Inserts 
fuer die website_texts Tabelle in Supabase.

**Tenant-ID:** [TENANT_ID hier einfuegen]
**Owner-ID (user_id):** [USER_ID hier einfuegen]

Fuer JEDE Sektion auf JEDER Seite der Website soll ein Eintrag erstellt werden.
Nimm die aktuellen Texte direkt aus dem Code / der Website.

Die Tabelle hat folgende Struktur:

  INSERT INTO website_texts (text_id, page, section, type, label, sort_order, content, tenant_id, owner_id)

Regeln:
- text_id: Format "{page}__{section}__{beschreibung}" z.B. "home__hero__copy"
- page: Seitenname lowercase z.B. "home", "about", "leistungen", "kontakt", "preise"
- section: Sektionsname lowercase z.B. "hero", "about", "services", "cta", "footer"
- type: Einer von:
    - "hero_block" — Hero-Sektion mit Headlines, Subheadline, Buttons, Badge
    - "text_block" — Textsektion mit Headlines, Paragraphs, Features, Badge
    - "node_grid" — Diagramm/Grid mit Nodes und Center-Label
    - "cta_block" — Call-to-Action mit Headline, Text, Button
    - "image_block" — Bild-Sektion mit Bild-URL und optionalem Text
    - "feature_grid" — Feature-Uebersicht mit Array von Features
    - "testimonial_block" — Kundenstimmen
    - "pricing_block" — Preistabelle
    - "faq_block" — FAQ Akkordeon
    - "contact_block" — Kontaktformular-Texte
    - "footer_block" — Footer-Texte und Links
- label: Anzeigename im Dashboard z.B. "Hero", "Ueber uns — Text"
- sort_order: Reihenfolge innerhalb der Seite (1, 2, 3...)
- content: JSONB mit den editierbaren Feldern

Wichtig fuer das JSONB content:
- Headlines MUESSEN als separate Felder: "headline_bold" und "headline_italic"
- Texte als "paragraphs" Array von Strings
- "subheadline" als einzelner String
- "badge" als einzelner String (kleiner Text ueber der Headline)
- "buttons" als Array von {label, url, variant} Objekten
- "features" als Array von {label} Objekten (optional mit "description")
- Bilder als "hero_image", "cover_image", "logo_url" etc. (leerer String wenn noch kein Bild)
- Fuer Node-Grids: "center" Objekt + "nodes" Array mit {label, position}

Feldnamen muessen diese Konventionen einhalten damit das Dashboard sie 
richtig gruppiert und anzeigt:
- Headlines: Keys mit "headline", "title", "heading"
- Texte: Keys mit "paragraph", "text", "description", "subheadline", "content"
- Buttons: Keys mit "button"
- Badges: Keys mit "badge", "tag"
- Features: Keys mit "feature", "benefit", "point"
- Bilder: Keys mit "image", "img", "logo", "cover", "banner", "thumbnail", "bild"
- Links: Keys mit "url", "link", "href"

Beispiel fuer eine Hero-Sektion:

  INSERT INTO website_texts (text_id, page, section, type, label, sort_order, content, tenant_id, owner_id)
  VALUES (
    'home__hero__copy', 'home', 'hero', 'hero_block', 'Hero', 1,
    '{
      "badge": "Willkommen bei [Firmenname]",
      "headline_bold": "Erster Teil der Headline",
      "headline_italic": "Zweiter Teil kursiv",
      "subheadline": "Beschreibender Untertitel der Hero-Sektion.",
      "hero_image": "",
      "buttons": [
        {"label": "CTA Button", "url": "/kontakt", "variant": "primary"},
        {"label": "Zweiter Button", "url": "/leistungen", "variant": "secondary"}
      ]
    }'::jsonb,
    '[TENANT_ID]',
    '[USER_ID]'
  );

Beispiel fuer eine Text-Sektion:

  INSERT INTO website_texts (text_id, page, section, type, label, sort_order, content, tenant_id, owner_id)
  VALUES (
    'home__about__copy', 'home', 'about', 'text_block', 'Ueber uns', 2,
    '{
      "badge": "UEBER UNS",
      "headline_bold": "Wer ist",
      "headline_italic": "Firmenname",
      "paragraphs": [
        "Erster Absatz mit Beschreibung.",
        "Zweiter Absatz mit mehr Details."
      ],
      "features": [
        {"label": "Feature 1"},
        {"label": "Feature 2"},
        {"label": "Feature 3"}
      ]
    }'::jsonb,
    '[TENANT_ID]',
    '[USER_ID]'
  );

Erstelle jetzt die SQL-Inserts fuer ALLE Sektionen der Website.
Nimm die echten Texte die aktuell auf der Website stehen.
Jede Seite, jede Sektion, jedes editierbare Textfeld.
```

---

## Checkliste nach dem Eintragen

- [ ] Tenant existiert in `tenants` Tabelle
- [ ] User existiert in `tenant_users` mit `joined_at` gesetzt
- [ ] Alle Seiten und Sektionen sind abgedeckt
- [ ] Bild-Felder haben leere Strings `""` als Platzhalter (nicht null)
- [ ] `sort_order` ist pro Seite aufsteigend
- [ ] Im Dashboard unter "Website > Texte" pruefen ob alles angezeigt wird
