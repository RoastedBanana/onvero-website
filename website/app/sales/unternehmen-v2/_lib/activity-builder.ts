import type { Company, Contact } from '../_types';

export type ActivityEvent = {
  id: string;
  timestamp: Date;
  type: 'created' | 'scored' | 'scraped' | 'enriched' | 'drafted' | 'contacted';
  title: string;
  subtitle?: string;
  badge?: { text: string; color: 'indigo' | 'green' | 'amber' | 'gray' };
  dotColor: 'indigo' | 'green' | 'amber' | 'gray';
};

export function buildActivityFeed(company: Company, contacts: Contact[]): ActivityEvent[] {
  const events: ActivityEvent[] = [];

  // Company created
  if (company.created_at) {
    events.push({
      id: 'created',
      timestamp: new Date(company.created_at),
      type: 'created',
      title: 'Unternehmen hinzugefügt',
      subtitle: company.source ? `Quelle: ${company.source}` : undefined,
      dotColor: 'gray',
    });
  }

  // AI scored
  if (company.ai_scored_at) {
    events.push({
      id: 'scored',
      timestamp: new Date(company.ai_scored_at),
      type: 'scored',
      title: 'KI-Scoring durchgeführt',
      badge: company.fit_score !== null ? { text: `Score: ${company.fit_score}`, color: 'indigo' } : undefined,
      dotColor: 'indigo',
    });
  }

  // Website scraped
  if (company.website_scraped_at) {
    events.push({
      id: 'scraped',
      timestamp: new Date(company.website_scraped_at),
      type: 'scraped',
      title: 'Website analysiert',
      subtitle: company.primary_domain ?? undefined,
      dotColor: 'green',
    });
  }

  // Contacts enriched
  for (const contact of contacts) {
    if (contact.created_at) {
      const name =
        (contact.full_name ?? [contact.first_name, contact.last_name].filter(Boolean).join(' ')) || 'Kontakt';
      events.push({
        id: `enriched-${contact.id}`,
        timestamp: new Date(contact.created_at),
        type: 'enriched',
        title: `Ansprechpartner enriched: ${name}`,
        subtitle: contact.title ?? undefined,
        dotColor: 'indigo',
      });
    }

    // Email draft generated
    if (contact.email_draft_body && contact.updated_at) {
      const name =
        (contact.full_name ?? [contact.first_name, contact.last_name].filter(Boolean).join(' ')) || 'Kontakt';
      events.push({
        id: `drafted-${contact.id}`,
        timestamp: new Date(contact.updated_at),
        type: 'drafted',
        title: `Email-Draft erstellt für ${name}`,
        subtitle: contact.email_draft_subject ?? undefined,
        dotColor: 'amber',
      });
    }

    // Contacted
    if (contact.last_contacted_at) {
      const name =
        (contact.full_name ?? [contact.first_name, contact.last_name].filter(Boolean).join(' ')) || 'Kontakt';
      events.push({
        id: `contacted-${contact.id}`,
        timestamp: new Date(contact.last_contacted_at),
        type: 'contacted',
        title: `Kontakt aufgenommen: ${name}`,
        badge: { text: 'Gesendet', color: 'green' },
        dotColor: 'green',
      });
    }
  }

  // Sort DESC (newest first)
  events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return events;
}
