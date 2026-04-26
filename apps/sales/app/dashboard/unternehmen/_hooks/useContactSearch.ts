'use client';

import { useState, useCallback } from 'react';
import type { ApolloPerson } from '../_types';

export function useContactSearch(leadId: string) {
  const [searchResults, setSearchResults] = useState<ApolloPerson[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const search = useCallback(async () => {
    setSearchLoading(true);
    setSearchError(null);
    try {
      const res = await fetch('/api/generate/apollo-people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: leadId }),
      });

      if (res.status === 402) {
        setSearchError('Nicht genug Credits. Upgrade erforderlich.');
        return;
      }
      if (!res.ok) {
        setSearchError('Suche fehlgeschlagen. Bitte erneut versuchen.');
        return;
      }

      const data = await res.json();
      const persons: ApolloPerson[] = (data.persons ?? []).map((p: Record<string, unknown>) => ({
        apollo_person_id: p.apollo_person_id ?? (p.raw_apollo_person as Record<string, unknown>)?.id ?? null,
        first_name: p.first_name ?? null,
        last_name: p.last_name ?? null,
        full_name: p.full_name ?? null,
        title: p.title ?? (p.raw_apollo_person as Record<string, unknown>)?.title ?? null,
        email: p.email ?? null,
        email_status: p.email_status ?? null,
        phone: p.phone ?? null,
        linkedin_url: p.linkedin_url ?? null,
        photo_url: p.photo_url ?? (p.raw_apollo_person as Record<string, unknown>)?.photo_url ?? null,
        raw_apollo_person: (p.raw_apollo_person as ApolloPerson['raw_apollo_person']) ?? null,
      }));

      setSearchResults(persons);
    } catch {
      setSearchError('Netzwerkfehler. Bitte erneut versuchen.');
    } finally {
      setSearchLoading(false);
    }
  }, [leadId]);

  const clearResults = useCallback(() => {
    setSearchResults([]);
    setSearchError(null);
  }, []);

  return { searchResults, searchLoading, searchError, search, clearResults };
}
