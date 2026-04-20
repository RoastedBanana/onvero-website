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
    if (upper === 'HOT') return 'HOT';
    if (upper === 'WARM') return 'WARM';
    if (upper === 'COLD') return 'COLD';
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
};
