'use client';

import { useState, useCallback } from 'react';
import type { Contact } from '../_types';

export interface EnrichParams {
  apolloPersonId: string;
  rawApolloPerson: Record<string, unknown>;
  getEmail: boolean;
  getPhone: boolean;
  generateEmail: boolean;
}

export function useContactEnrich(leadId: string) {
  const [enrichingContactId, setEnrichingContactId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const enrich = useCallback(
    async (params: EnrichParams): Promise<Contact | null> => {
      setEnrichingContactId(params.apolloPersonId);
      setError(null);
      try {
        const res = await fetch('/api/generate/person-enrich', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lead_id: leadId,
            apollo_person_id: params.apolloPersonId,
            raw_apollo_person: params.rawApolloPerson,
            get_email: params.getEmail,
            get_telephone: params.getPhone,
            generate_email: params.generateEmail,
          }),
        });

        if (res.status === 402) {
          setError('Nicht genug Credits.');
          return null;
        }
        if (!res.ok) {
          setError('Enrichment fehlgeschlagen.');
          return null;
        }

        const data = await res.json();
        return data as Contact;
      } catch {
        setError('Netzwerkfehler beim Enrichment.');
        return null;
      } finally {
        setEnrichingContactId(null);
      }
    },
    [leadId]
  );

  return { enrichingContactId, enrich, error };
}
