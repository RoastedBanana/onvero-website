import { fetchLeads, computeStats } from '@/lib/leads-api';
import { LeadsDashboardClient } from './client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LeadsPage() {
  let leads;
  try {
    leads = await fetchLeads();
  } catch (e) {
    console.error('Supabase Fehler:', e);
    const { mockLeads } = await import('@/lib/mock-leads');
    leads = mockLeads.map((m) => {
      const [firstName = '', ...rest] = m.name.split(' ');
      const lastName = rest.join(' ');
      return {
        id: m.id,
        company: m.company,
        firstName,
        lastName,
        name: m.name,
        email: m.email,
        website: m.website,
        city: m.city,
        status: m.status,
        score: m.score,
        industry: m.industry,
        aiSummary: m.ai_summary ?? undefined,
        aiTags: m.ai_tags,
        emailDraft: m.email_draft ?? undefined,
        createdAt: m.created_at,
        nextAction: m.next_action,
        technologies: [] as string[],
        strengths: [] as string[],
        redFlags: [] as string[],
        concerns: [] as string[],
      };
    });
  }

  const stats = computeStats(leads);

  return <LeadsDashboardClient leads={leads} stats={stats} />;
}
