'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import { Zap, User, ArrowRightLeft, Radio, Loader2 } from 'lucide-react';

/* ── Types ── */

interface Lead {
  id: string;
  company_name: string;
  score: number | null;
  status: string;
  source: string | null;
  created_at: string;
}

interface GenerationRun {
  id: string;
  status: string;
  search_terms: string[];
  leads_found: number;
  leads_new: number;
  started_at: string;
}

interface ActivityItem {
  id: string;
  type: 'scored' | 'created' | 'status' | 'campaign';
  title: string;
  description: string;
  timestamp: string;
  color: string;
  leadId?: string;
}

/* ── Helpers ── */

function getTier(score: number): 'hot' | 'warm' | 'cold' {
  if (score >= 70) return 'hot';
  if (score >= 40) return 'warm';
  return 'cold';
}

const DOT_COLORS = {
  hot: '#FF5C2E',
  warm: '#F59E0B',
  cold: '#6B7AFF',
  created: '#22C55E',
  status: '#a78bfa',
  campaign: '#F59E0B',
};

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return 'gerade eben';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `vor ${diffMin} Min.`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `vor ${diffHrs} Stunde${diffHrs === 1 ? '' : 'n'}`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 30) return `vor ${diffDays} Tag${diffDays === 1 ? '' : 'en'}`;
  const diffMonths = Math.floor(diffDays / 30);
  return `vor ${diffMonths} Monat${diffMonths === 1 ? '' : 'en'}`;
}

function buildActivities(leads: Lead[], runs: GenerationRun[]): ActivityItem[] {
  const items: ActivityItem[] = [];

  for (const lead of leads) {
    // Lead scored
    if (lead.score !== null && lead.score > 0) {
      const tier = getTier(lead.score);
      items.push({
        id: `scored-${lead.id}`,
        type: 'scored',
        title: 'Lead gescored',
        description: `${lead.company_name} hat Score ${lead.score} erhalten`,
        timestamp: lead.created_at,
        color: DOT_COLORS[tier],
        leadId: lead.id,
      });
    }

    // Lead created
    items.push({
      id: `created-${lead.id}`,
      type: 'created',
      title: 'Neuer Kontakt',
      description: `${lead.company_name} importiert`,
      timestamp: lead.created_at,
      color: DOT_COLORS.created,
      leadId: lead.id,
    });

    // Status change
    if (lead.status && lead.status !== 'new') {
      items.push({
        id: `status-${lead.id}`,
        type: 'status',
        title: 'Status geaendert',
        description: `${lead.company_name} → ${lead.status}`,
        timestamp: lead.created_at,
        color: DOT_COLORS.status,
        leadId: lead.id,
      });
    }
  }

  for (const run of runs) {
    items.push({
      id: `campaign-${run.id}`,
      type: 'campaign',
      title: 'Kampagne gestartet',
      description: run.search_terms?.join(', ') || 'Kampagne',
      timestamp: run.started_at,
      color: DOT_COLORS.campaign,
    });
  }

  items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return items;
}

/* ── Icons per type ── */

function TypeIcon({ type }: { type: ActivityItem['type'] }) {
  const props = { size: 11, strokeWidth: 2, style: { color: 'rgba(255,255,255,0.5)' } as React.CSSProperties };
  switch (type) {
    case 'scored':
      return <Zap {...props} />;
    case 'created':
      return <User {...props} />;
    case 'status':
      return <ArrowRightLeft {...props} />;
    case 'campaign':
      return <Radio {...props} />;
  }
}

/* ── Status badge for campaigns ── */

function StatusBadge({ status }: { status: string }) {
  const isRunning = status === 'running';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 9,
        fontWeight: 600,
        color: isRunning ? '#F59E0B' : status === 'completed' ? '#22C55E' : 'rgba(255,255,255,0.4)',
        background: isRunning
          ? 'rgba(245,158,11,0.1)'
          : status === 'completed'
            ? 'rgba(34,197,94,0.1)'
            : 'rgba(255,255,255,0.05)',
        border: `1px solid ${isRunning ? 'rgba(245,158,11,0.2)' : status === 'completed' ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 10,
        padding: '2px 7px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}
    >
      {status}
    </span>
  );
}

/* ── Main Page ── */

export default function ActivityPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [campaignStatuses, setCampaignStatuses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [leadsRes, runsRes] = await Promise.all([fetch('/api/leads'), fetch('/api/lead-generator-runs?limit=5')]);

        const { leads = [] } = await leadsRes.json();
        const { runs = [] } = await runsRes.json();

        const items = buildActivities(leads as Lead[], runs as GenerationRun[]);
        setActivities(items);

        const statuses: Record<string, string> = {};
        for (const run of runs as GenerationRun[]) {
          statuses[`campaign-${run.id}`] = run.status;
        }
        setCampaignStatuses(statuses);
      } catch {
        /* silently fail */
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div
      style={{
        padding: '32px 40px',
        maxWidth: 720,
        fontFamily: 'var(--font-dm-sans)',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
      }}
    >
      <PageHeader title="Aktivitaeten" subtitle="Letzte Ereignisse in deinem BusinessOS" showTime={false} />

      <div style={{ marginTop: 32 }}>
        {loading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 0',
              color: 'rgba(255,255,255,0.3)',
            }}
          >
            <Loader2
              size={18}
              strokeWidth={2}
              style={{
                animation: 'spin 1s linear infinite',
              }}
            />
            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : activities.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 0',
              color: 'rgba(255,255,255,0.25)',
              fontSize: 13,
            }}
          >
            Keine Aktivitaeten vorhanden.
          </div>
        ) : (
          <div style={{ position: 'relative', paddingLeft: 28 }}>
            {/* Timeline line */}
            <div
              style={{
                position: 'absolute',
                left: 4,
                top: 0,
                bottom: 0,
                width: 1,
                background: 'rgba(255,255,255,0.06)',
              }}
            />

            {activities.map((item, i) => (
              <div
                key={item.id}
                style={{
                  position: 'relative',
                  marginBottom: i < activities.length - 1 ? 8 : 0,
                }}
              >
                {/* Dot */}
                <div
                  style={{
                    position: 'absolute',
                    left: -28 + 4 - 5,
                    top: 14,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: item.color,
                    boxShadow: `0 0 8px ${item.color}40`,
                    zIndex: 1,
                  }}
                />

                {/* Card */}
                <div
                  onClick={item.leadId ? () => router.push(`/dashboard/leads/${item.leadId}`) : undefined}
                  style={{
                    background: '#111',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 10,
                    padding: '12px 16px',
                    cursor: item.leadId ? 'pointer' : 'default',
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (item.leadId) {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                      e.currentTarget.style.background = '#141414';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (item.leadId) {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                      e.currentTarget.style.background = '#111';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <TypeIcon type={item.type} />
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: 'rgba(255,255,255,0.7)',
                      }}
                    >
                      {item.title}
                    </span>
                    {item.type === 'campaign' && campaignStatuses[item.id] && (
                      <StatusBadge status={campaignStatuses[item.id]} />
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.35)',
                      marginBottom: 4,
                    }}
                  >
                    {item.description}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: 'rgba(255,255,255,0.2)',
                      fontFamily: 'var(--font-dm-mono)',
                    }}
                  >
                    {relativeTime(item.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
