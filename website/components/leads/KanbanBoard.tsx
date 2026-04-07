'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Lead } from '@/lib/leads-client';
import { updateLeadStatus } from '@/lib/leads-client';
import LeadAvatar from '@/components/ui/LeadAvatar';

const COLUMNS = [
  { key: 'new', label: 'Neu', color: '#a78bfa', bg: 'rgba(167,139,250,0.06)', border: 'rgba(167,139,250,0.1)' },
  {
    key: 'contacted',
    label: 'Kontaktiert',
    color: '#6B7AFF',
    bg: 'rgba(107,122,255,0.06)',
    border: 'rgba(107,122,255,0.1)',
  },
  {
    key: 'qualified',
    label: 'Qualifiziert',
    color: '#22C55E',
    bg: 'rgba(34,197,94,0.06)',
    border: 'rgba(34,197,94,0.1)',
  },
  {
    key: 'lost',
    label: 'Verloren',
    color: 'rgba(255,255,255,0.3)',
    bg: 'rgba(255,255,255,0.02)',
    border: 'rgba(255,255,255,0.04)',
  },
];

function scoreColor(s: number) {
  return s >= 70 ? '#FF5C2E' : s >= 45 ? '#F59E0B' : '#6B7AFF';
}

interface Props {
  leads: Lead[];
  onStatusChange?: (id: string, status: string) => void;
  onLeadDeleted?: (id: string) => void;
}

export default function KanbanBoard({ leads, onStatusChange, onLeadDeleted }: Props) {
  const router = useRouter();
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const dragRef = useRef<string | null>(null);

  const handleDragStart = (id: string) => {
    setDragId(id);
    dragRef.current = id;
  };

  const handleDrop = async (targetStatus: string) => {
    const id = dragRef.current;
    if (!id) return;
    setDragId(null);
    setDragOver(null);
    dragRef.current = null;

    const lead = leads.find((l) => l.id === id);
    if (!lead || lead.status === targetStatus) return;

    try {
      await updateLeadStatus(id, targetStatus);
      onStatusChange?.(id, targetStatus);
    } catch {
      /* ignore */
    }
  };

  return (
    <div>
      <style>{`
        div:hover > .kanban-delete-btn { opacity: 1 !important; }
        .kanban-card {
          transition: all 0.3s cubic-bezier(0.32,0.72,0,1);
        }
        .kanban-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
      `}</style>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${COLUMNS.length}, 1fr)`,
          gap: 12,
          marginTop: 12,
          minHeight: 400,
        }}
      >
        {COLUMNS.map((col) => {
          const colLeads = leads.filter((l) => l.status === col.key).sort((a, b) => b.score - a.score);
          const isOver = dragOver === col.key;

          return (
            <div
              key={col.key}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(col.key);
              }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(col.key);
              }}
              style={{
                background: isOver ? col.bg : 'rgba(255,255,255,0.015)',
                border: `1px solid ${isOver ? col.border : 'rgba(255,255,255,0.03)'}`,
                borderRadius: 16,
                padding: 10,
                transition: 'all 0.3s cubic-bezier(0.32,0.72,0,1)',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 300,
              }}
            >
              {/* Column Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 6px 10px',
                  marginBottom: 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: col.color }} />
                  <span style={{ fontSize: 11, fontWeight: 500, color: col.color }}>{col.label}</span>
                </div>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', fontFamily: 'var(--font-dm-mono)' }}>
                  {colLeads.length}
                </span>
              </div>

              {/* Cards */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
                {colLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="kanban-card"
                    draggable
                    onDragStart={() => handleDragStart(lead.id)}
                    onDragEnd={() => {
                      setDragId(null);
                      setDragOver(null);
                    }}
                    onClick={() => router.push(`/dashboard/leads/${lead.id}`)}
                    style={{
                      background: dragId === lead.id ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: 12,
                      padding: '12px 14px',
                      cursor: 'grab',
                      opacity: dragId === lead.id ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (dragId !== lead.id) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (dragId !== lead.id) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                      }
                    }}
                  >
                    {/* Card Header: Avatar + Name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <LeadAvatar website={lead.website} companyName={lead.company} score={lead.score} size="sm" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 500,
                            color: '#e8e8e8',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {lead.company}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: 'rgba(255,255,255,0.25)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {lead.name}
                        </div>
                      </div>
                    </div>

                    {/* Score + Industry */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 4,
                      }}
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 3 }}>
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: scoreColor(lead.score),
                            fontFamily: 'var(--font-dm-mono)',
                          }}
                        >
                          {lead.score}
                        </span>
                      </div>
                      {lead.industry && (
                        <span
                          style={{
                            fontSize: 9,
                            color: 'rgba(255,255,255,0.2)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: 80,
                          }}
                        >
                          {lead.industry.split('/')[0]}
                        </span>
                      )}
                    </div>

                    {/* Tags */}
                    {lead.source && (
                      <div style={{ marginTop: 4 }}>
                        {lead.source === 'apollo_outbound' && (
                          <span
                            style={{
                              fontSize: 8,
                              color: '#8B5CF6',
                              background: 'rgba(139,92,246,0.08)',
                              padding: '1px 5px',
                              borderRadius: 4,
                              fontWeight: 500,
                            }}
                          >
                            Apollo
                          </span>
                        )}
                      </div>
                    )}

                    {/* Date + Delete */}
                    <div
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}
                    >
                      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)', fontFamily: 'var(--font-dm-mono)' }}>
                        {new Date(lead.createdAt).toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </span>
                      {deleteConfirmId === lead.id ? (
                        <div style={{ display: 'flex', gap: 3 }} onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              setDeleting(true);
                              try {
                                await fetch(`/api/leads/${lead.id}`, { method: 'DELETE' });
                                onLeadDeleted?.(lead.id);
                              } catch {}
                              setDeleting(false);
                              setDeleteConfirmId(null);
                            }}
                            disabled={deleting}
                            style={{
                              fontSize: 9,
                              background: '#ef4444',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 4,
                              padding: '2px 6px',
                              cursor: 'pointer',
                              fontWeight: 600,
                              opacity: deleting ? 0.5 : 1,
                            }}
                          >
                            Ja
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(null);
                            }}
                            style={{
                              fontSize: 9,
                              background: 'rgba(255,255,255,0.04)',
                              color: 'rgba(255,255,255,0.35)',
                              border: 'none',
                              borderRadius: 4,
                              padding: '2px 6px',
                              cursor: 'pointer',
                            }}
                          >
                            Nein
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(lead.id);
                          }}
                          className="kanban-delete-btn"
                          style={{
                            fontSize: 10,
                            background: 'none',
                            border: 'none',
                            color: 'rgba(255,255,255,0.08)',
                            cursor: 'pointer',
                            padding: '0 2px',
                            opacity: 0,
                            transition: 'opacity 0.2s ease, color 0.2s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.08)')}
                          title="Löschen"
                        >
                          x
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {colLeads.length === 0 && (
                  <div
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
                  >
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.1)' }}>Keine</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
