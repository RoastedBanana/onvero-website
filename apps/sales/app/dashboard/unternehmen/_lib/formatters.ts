// ─── NULL-SAFE FORMATTERS ───────────────────────────────────────────────────
// Every field from Supabase can be null. These helpers ensure clean display.

export const fmt = {
  text(v: string | null, fallback = '\u2014'): string {
    return v && v.trim() ? v.trim() : fallback;
  },

  number(v: number | null, fallback = '\u2014'): string {
    return v !== null && v !== undefined ? v.toLocaleString('de-DE') : fallback;
  },

  employees(v: number | null): string {
    if (v === null || v === undefined) return '\u2014';
    if (v >= 1000) return `${(v / 1000).toFixed(1).replace(/\.0$/, '')}k`;
    return String(v);
  },

  revenue(printed: string | null, raw: number | null): string {
    if (printed && printed.trim()) return printed.trim();
    if (raw !== null && raw !== undefined) {
      if (raw >= 1_000_000_000) return `${(raw / 1_000_000_000).toFixed(1)}B`;
      if (raw >= 1_000_000) return `${(raw / 1_000_000).toFixed(1)}M`;
      if (raw >= 1_000) return `${(raw / 1_000).toFixed(0)}k`;
      return raw.toLocaleString('de-DE');
    }
    return '\u2014';
  },

  domain(website: string | null, primaryDomain: string | null): string {
    if (primaryDomain && primaryDomain.trim()) return primaryDomain.trim();
    if (!website) return '\u2014';
    return (
      website
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/$/, '') || '\u2014'
    );
  },

  countryCity(country: string | null, city: string | null): string {
    const parts: string[] = [];
    if (city && city.trim()) parts.push(city.trim());
    if (country && country.trim()) {
      const c = country.trim();
      // Shorten common country names to codes
      const short: Record<string, string> = {
        Germany: 'DE',
        Deutschland: 'DE',
        'United States': 'US',
        'United Kingdom': 'UK',
        Austria: 'AT',
        Switzerland: 'CH',
        France: 'FR',
        Netherlands: 'NL',
      };
      parts.push(short[c] ?? c);
    }
    return parts.length > 0 ? parts.join(', ') : '\u2014';
  },

  tier(tier: string | null): 'HOT' | 'WARM' | 'COLD' | 'UNRATED' {
    if (!tier) return 'UNRATED';
    const upper = tier.toUpperCase().trim();
    if (upper.startsWith('HOT')) return 'HOT';
    if (upper.startsWith('WARM')) return 'WARM';
    if (upper.startsWith('COLD')) return 'COLD';
    return 'UNRATED';
  },

  score(v: number | null): { display: string; value: number } {
    if (v === null || v === undefined) return { display: '\u2013', value: 0 };
    return { display: String(v), value: v };
  },

  employeeRange(v: number | null): string | null {
    if (v === null || v === undefined) return null;
    if (v < 10) return '<10';
    if (v <= 50) return '10\u201350';
    if (v <= 200) return '50\u2013200';
    return '200+';
  },

  initials(name: string | null): string {
    if (!name || !name.trim()) return '?';
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  },

  industry(v: string | null): string {
    if (!v || !v.trim()) return '';
    const map: Record<string, string> = {
      'Information Technology and Services': 'IT & Software',
      'Computer Software': 'Software',
      'Computer & Network Security': 'IT-Sicherheit',
      'Computer Hardware': 'Hardware',
      'Computer Games': 'Gaming',
      'Computer Networking': 'Netzwerke',
      Internet: 'Internet',
      'Online Media': 'Online-Medien',
      Telecommunications: 'Telekommunikation',
      Wireless: 'Wireless',
      Semiconductors: 'Halbleiter',
      Cybersecurity: 'Cybersicherheit',
      'Artificial Intelligence': 'Künstliche Intelligenz',
      'Financial Services': 'Finanzdienstleistungen',
      Banking: 'Banking',
      'Investment Banking': 'Investmentbanking',
      Insurance: 'Versicherungen',
      'Venture Capital & Private Equity': 'Venture Capital',
      Accounting: 'Buchhaltung & Steuer',
      'Real Estate': 'Immobilien',
      'Marketing and Advertising': 'Marketing & Werbung',
      'Public Relations and Communications': 'PR & Kommunikation',
      'Market Research': 'Marktforschung',
      Consulting: 'Beratung',
      'Management Consulting': 'Unternehmensberatung',
      'Legal Services': 'Rechtsberatung',
      'Human Resources': 'Personal & HR',
      'Staffing and Recruiting': 'Personalvermittlung',
      'Outsourcing/Offshoring': 'Outsourcing',
      Retail: 'Einzelhandel',
      Wholesale: 'Großhandel',
      Supermarkets: 'Supermärkte',
      'E-Learning': 'E-Learning',
      'Education Management': 'Bildung',
      Manufacturing: 'Fertigung',
      'Mechanical or Industrial Engineering': 'Maschinenbau',
      'Electrical/Electronic Manufacturing': 'Elektronik',
      'Consumer Electronics': 'Unterhaltungselektronik',
      Automotive: 'Automobil',
      'Airlines/Aviation': 'Luftfahrt',
      'Logistics and Supply Chain': 'Logistik',
      'Transportation/Trucking/Railroad': 'Transport & Logistik',
      Construction: 'Baugewerbe',
      'Architecture & Planning': 'Architektur',
      'Facilities Services': 'Facility Management',
      Healthcare: 'Gesundheitswesen',
      'Hospital & Health Care': 'Gesundheitswesen',
      'Medical Devices': 'Medizintechnik',
      Pharmaceuticals: 'Pharma',
      Biotechnology: 'Biotechnologie',
      'Health, Wellness and Fitness': 'Gesundheit & Fitness',
      'Mental Health Care': 'Psychologie',
      'Medical Practice': 'Arztpraxis',
      Veterinary: 'Veterinärmedizin',
      Nanotechnology: 'Nanotechnologie',
      Chemicals: 'Chemie',
      'Renewables & Environment': 'Erneuerbare Energien',
      'Oil & Energy': 'Energie',
      Utilities: 'Versorgung',
      'Environmental Services': 'Umweltdienstleistungen',
      'Food & Beverages': 'Ernährung & Getränke',
      Restaurants: 'Gastronomie',
      Hospitality: 'Gastgewerbe',
      'Wine and Spirits': 'Wein & Spirituosen',
      'Events Services': 'Veranstaltungen',
      Entertainment: 'Unterhaltung',
      'Media Production': 'Medienproduktion',
      'Broadcast Media': 'Rundfunk',
      Music: 'Musik',
      Photography: 'Fotografie',
      Design: 'Design',
      'Fine Art': 'Kunst',
      Publishing: 'Verlagswesen',
      Printing: 'Druck',
      Newspapers: 'Zeitungen',
      'Apparel & Fashion': 'Mode',
      'Luxury Goods & Jewelry': 'Luxusgüter',
      'Consumer Goods': 'Konsumgüter',
      Cosmetics: 'Kosmetik',
      'Sporting Goods': 'Sport & Freizeit',
      Furniture: 'Möbel',
      'Business Supplies and Equipment': 'Bürobedarf',
      'Packaging and Containers': 'Verpackung',
      Plastics: 'Kunststoffe',
      'Glass, Ceramics & Concrete': 'Glas & Keramik',
      Textiles: 'Textilien',
      'Paper & Forest Products': 'Papier & Forst',
      'Mining & Metals': 'Bergbau & Metalle',
      'Defense & Space': 'Verteidigung',
      'Security and Investigations': 'Sicherheit',
      'Government Administration': 'Öffentliche Verwaltung',
      'Non-profit Organization Management': 'Non-Profit',
      'Religious Institutions': 'Kirche & Religion',
      'Civic & Social Organization': 'Zivilgesellschaft',
      Research: 'Forschung',
      'Think Tanks': 'Think Tanks',
      'Political Organization': 'Politik',
      Sports: 'Sport',
      'Import and Export': 'Import & Export',
      Maritime: 'Schifffahrt',
      Farming: 'Landwirtschaft',
      Fishing: 'Fischerei',
      Dairy: 'Milchwirtschaft',
      'Online Classifieds': 'Online-Marktplätze',
    };
    return map[v.trim()] ?? v.trim();
  },
};
