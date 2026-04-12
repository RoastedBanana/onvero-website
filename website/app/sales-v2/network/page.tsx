'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { C, ScoreBar } from '../_shared';
import { useNetworks, useNetworkCanvas, type NetworkNode, type NetworkEdge, type Network } from '../_use-network';

const BASE_DOT = 28;
const MIN_SCALE = 0.2;
const MAX_SCALE = 5;
const CARD_W = 220;
const GRID_SNAP = 20;
const CONNECTOR_LEN = 48;
const CONNECTOR_DOT_R = 5;
const CIRCLE_NODE_SIZE = 44;

type ExpandCategory = 'similar' | 'geo' | 'tech' | 'partners' | 'competitors';

const EXPAND_OPTIONS: { key: ExpandCategory; label: string; icon: string }[] = [
  { key: 'similar', label: 'Ähnliche Unternehmen', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { key: 'geo', label: 'Geografie', icon: 'M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z' },
  { key: 'tech', label: 'Technologie', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { key: 'partners', label: 'Kunden und Partner', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { key: 'competitors', label: 'Konkurrenten', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
];

type RawLead = { id: string; company_name?: string | null; first_name?: string | null; last_name?: string | null; city?: string | null; score?: number | null };

function scoreColor(s: number) { return s >= 70 ? C.success : s >= 40 ? C.warning : C.danger; }

/* ═══════════════════════════════════════════════════════════════════════════
   SIDEBAR
   ═══════════════════════════════════════════════════════════════════════════ */

function Sidebar({
  networks, loading, activeId, collapsed,
  onSelect, onCreate, onRename, onDelete, onToggle,
}: {
  networks: Network[]; loading: boolean; activeId: string | null; collapsed: boolean;
  onSelect: (id: string) => void; onCreate: () => void; onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void; onToggle: () => void;
}) {
  const [editId, setEditId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editId && inputRef.current) inputRef.current.focus(); }, [editId]);

  if (collapsed) {
    return (
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          position: 'absolute', top: 20, left: 24, zIndex: 20,
          borderRadius: 10, background: 'rgba(14,16,37,0.8)', border: `1px solid ${C.border}`,
          backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
          boxShadow: '0 8px 28px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)',
        }}
      >
        <button type="button" onClick={onToggle} style={{
          width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: C.text2, background: 'none', border: 'none', fontFamily: 'inherit',
        }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      </div>
    );
  }

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: 'absolute', top: 20, left: 24, bottom: 20, width: 260, zIndex: 20,
        borderRadius: 14, background: 'rgba(14,16,37,0.92)', border: `1px solid ${C.border}`,
        backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
        boxShadow: '0 16px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        animation: 'fadeInUp 0.2s cubic-bezier(0.22,1,0.36,1) both',
      }}
    >
      {/* Header */}
      <div style={{ padding: '14px 14px 10px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, fontSize: 12, fontWeight: 600, color: C.text1, letterSpacing: '-0.01em' }}>Netzwerke</div>
        <button type="button" onClick={onCreate} title="Neues Netzwerk" style={{
          width: 26, height: 26, borderRadius: 7, border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.03)',
          color: C.text2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit', padding: 0,
        }}>
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
        </button>
        <button type="button" onClick={onToggle} title="Zuklappen" style={{
          width: 26, height: 26, borderRadius: 7, border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.03)',
          color: C.text3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit', padding: 0,
        }}>
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
        {loading && <div style={{ padding: 16, textAlign: 'center', fontSize: 11, color: C.text3 }}>Lade…</div>}
        {!loading && networks.length === 0 && (
          <div style={{ padding: 16, textAlign: 'center', fontSize: 11, color: C.text3 }}>Noch keine Netzwerke erstellt.</div>
        )}
        {networks.map((n) => {
          const isActive = n.id === activeId;
          const isEditing = editId === n.id;
          return (
            <div key={n.id} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, marginBottom: 2,
              border: `1px solid ${isActive ? 'rgba(129,140,248,0.3)' : 'transparent'}`,
              background: isActive ? 'rgba(99,102,241,0.08)' : 'transparent',
              cursor: 'pointer', transition: 'all 0.12s ease',
            }}
              onClick={() => { if (!isEditing) onSelect(n.id); }}
              onDoubleClick={() => { setEditId(n.id); setEditVal(n.name); }}
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={isActive ? C.accentBright : C.text3} strokeWidth={1.5} strokeLinecap="round">
                <circle cx="12" cy="5" r="2" /><circle cx="5" cy="19" r="2" /><circle cx="19" cy="19" r="2" />
                <path d="M12 7v4M10.5 13l-4 4M13.5 13l4 4" />
              </svg>
              {isEditing ? (
                <input ref={inputRef} value={editVal} onChange={(e) => setEditVal(e.target.value)}
                  onBlur={() => { if (editVal.trim()) onRename(n.id, editVal.trim()); setEditId(null); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { if (editVal.trim()) onRename(n.id, editVal.trim()); setEditId(null); } if (e.key === 'Escape') setEditId(null); }}
                  style={{ flex: 1, fontSize: 12, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.borderAccent}`, borderRadius: 5, padding: '2px 6px', color: C.text1, outline: 'none', fontFamily: 'inherit', minWidth: 0 }}
                />
              ) : (
                <div style={{ flex: 1, fontSize: 12, fontWeight: isActive ? 500 : 400, color: isActive ? C.text1 : C.text2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {n.name}
                </div>
              )}
              <button type="button" onClick={(e) => { e.stopPropagation(); if (confirm(`"${n.name}" löschen?`)) onDelete(n.id); }}
                style={{ width: 20, height: 20, borderRadius: 5, border: 'none', background: 'transparent', color: C.text3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, fontFamily: 'inherit', opacity: 0.5, transition: 'opacity 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = C.danger; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.5'; e.currentTarget.style.color = C.text3; }}
              >
                <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   LEAD PICKER
   ═══════════════════════════════════════════════════════════════════════════ */

function LeadPicker({ open, onClose, onSelect }: {
  open: boolean; onClose: () => void; onSelect: (lead: RawLead) => void;
}) {
  const [q, setQ] = useState('');
  const [leads, setLeads] = useState<RawLead[]>([]);
  const [loading, setLoading] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    if (!open || loaded.current) return;
    setLoading(true);
    fetch('/api/leads', { cache: 'no-store' })
      .then((r) => r.json())
      .then(({ leads: raw }) => { setLeads(raw ?? []); loaded.current = true; })
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const filtered = q
    ? leads.filter((l) => {
        const s = q.toLowerCase();
        const name = [l.first_name, l.last_name].filter(Boolean).join(' ').toLowerCase();
        return name.includes(s) || (l.company_name ?? '').toLowerCase().includes(s) || (l.city ?? '').toLowerCase().includes(s);
      })
    : leads;

  return (
    <div onMouseDown={(e) => e.stopPropagation()} style={{
      position: 'absolute', top: 72, right: 24, bottom: 20, width: 340, borderRadius: 14,
      background: 'rgba(14,16,37,0.92)', border: `1px solid ${C.border}`, backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
      boxShadow: '0 16px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'fadeInUp 0.25s cubic-bezier(0.22,1,0.36,1) both', zIndex: 25,
    }}>
      <div style={{ padding: '14px 16px 12px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.text1 }}>Lead hinzufügen</div>
          <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>Klicke um einen Lead auf das Canvas zu setzen</div>
        </div>
        <button type="button" onClick={onClose} style={{ width: 26, height: 26, borderRadius: 7, border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.03)', color: C.text3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit', padding: 0 }}>
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>
      <div style={{ padding: '10px 12px 8px' }}>
        <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, Firma oder Stadt…"
          style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, color: C.text1, fontSize: 12, outline: 'none', fontFamily: 'inherit' }}
        />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px 12px' }}>
        {loading && <div style={{ padding: 20, textAlign: 'center', fontSize: 11, color: C.text3 }}>Lade Leads…</div>}
        {!loading && filtered.length === 0 && <div style={{ padding: 20, textAlign: 'center', fontSize: 11, color: C.text3 }}>Keine Leads gefunden.</div>}
        {!loading && filtered.map((l) => {
          const name = [l.first_name, l.last_name].filter(Boolean).join(' ').trim() || l.company_name || '—';
          const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('');
          return (
            <button key={l.id} type="button" onClick={() => onSelect(l)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 9,
              border: '1px solid transparent', background: 'transparent', cursor: 'pointer', color: C.text1, textAlign: 'left', fontFamily: 'inherit', marginBottom: 2, transition: 'all 0.12s ease',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(129,140,248,0.06)'; e.currentTarget.style.borderColor = 'rgba(129,140,248,0.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
            >
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 500, color: C.text2, flexShrink: 0 }}>{initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 500, color: C.text1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                <div style={{ fontSize: 10.5, color: C.text3, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.company_name ?? '—'} · {l.city ?? '—'}</div>
              </div>
              <div style={{ width: 56, flexShrink: 0 }}><ScoreBar score={Math.round(l.score ?? 0)} /></div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   EDGE SVG LINES
   ═══════════════════════════════════════════════════════════════════════════ */

function EdgeLines({ edges, nodes, offset, scale }: { edges: NetworkEdge[]; nodes: NetworkNode[]; offset: { x: number; y: number }; scale: number }) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  return (
    <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1, overflow: 'visible' }}>
      {edges.map((e) => {
        const src = nodeMap.get(e.source_node_id);
        const tgt = nodeMap.get(e.target_node_id);
        if (!src || !tgt) return null;
        const x1 = src.x * scale + offset.x;
        const y1 = src.y * scale + offset.y;
        const x2 = tgt.x * scale + offset.x;
        const y2 = tgt.y * scale + offset.y;
        return (
          <g key={e.id}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(129,140,248,0.2)" strokeWidth={Math.max(1, 1.5 * scale)} strokeDasharray={`${6 * scale} ${4 * scale}`} />
            <circle cx={x1} cy={y1} r={3 * scale} fill="rgba(129,140,248,0.4)" />
            <circle cx={x2} cy={y2} r={3 * scale} fill="rgba(129,140,248,0.4)" />
          </g>
        );
      })}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   LEAD NODE
   ═══════════════════════════════════════════════════════════════════════════ */

function LeadNodeCard({
  node, offset, scale, selected, dropdownOpen, isLoading,
  onSelect, onDragStart, onRemove, onToggleDropdown, onSelectCategory,
}: {
  node: NetworkNode; offset: { x: number; y: number }; scale: number; selected: boolean; dropdownOpen: boolean; isLoading: boolean;
  onSelect: () => void; onDragStart: (e: React.MouseEvent) => void; onRemove: () => void;
  onToggleDropdown: () => void; onSelectCategory: (cat: ExpandCategory) => void;
}) {
  const sx = node.x * scale + offset.x;
  const sy = node.y * scale + offset.y;
  const initials = node.name.split(' ').map((n) => n[0]).slice(0, 2).join('');
  const circleSize = CIRCLE_NODE_SIZE * scale;
  const chosenOpt = node.expand_category ? EXPAND_OPTIONS.find((o) => o.key === node.expand_category) : null;

  return (
    <div onMouseDown={(e) => { e.stopPropagation(); onSelect(); onDragStart(e); }}
      style={{ position: 'absolute', left: sx, top: sy, transform: 'translate(-50%, -50%)', cursor: 'grab', zIndex: selected || dropdownOpen ? 10 : 2 }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {/* Card */}
        <div style={{
          width: CARD_W * scale, padding: `${12 * scale}px ${14 * scale}px`, borderRadius: 14 * scale,
          border: `${Math.max(1, 1.5 * scale)}px solid ${selected ? 'rgba(129,140,248,0.5)' : C.border}`,
          background: selected ? 'linear-gradient(135deg,rgba(99,102,241,0.12),rgba(14,16,37,0.95))' : 'rgba(14,16,37,0.92)',
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          boxShadow: selected ? '0 12px 40px rgba(99,102,241,0.25),0 0 0 1px rgba(129,140,248,0.15),inset 0 1px 0 rgba(255,255,255,0.06)' : '0 8px 28px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.03)',
          display: 'flex', alignItems: 'center', gap: 10 * scale, position: 'relative', flexShrink: 0,
        }}>
          <div style={{ width: 36 * scale, height: 36 * scale, borderRadius: 9 * scale, background: 'linear-gradient(135deg,#6366F1,#818CF8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 * scale, fontWeight: 600, color: '#fff', flexShrink: 0 }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5 * scale, fontWeight: 550, color: C.text1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{node.name}</div>
            <div style={{ fontSize: 10.5 * scale, color: C.text3, marginTop: 2 * scale, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{node.company} · {node.city}</div>
          </div>
          <div style={{ width: 8 * scale, height: 8 * scale, borderRadius: '50%', background: scoreColor(node.score), boxShadow: `0 0 6px ${scoreColor(node.score)}`, flexShrink: 0 }} />
          {selected && (
            <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(); }} onMouseDown={(e) => e.stopPropagation()}
              style={{ position: 'absolute', top: -6 * scale, right: -6 * scale, width: 20 * scale, height: 20 * scale, borderRadius: '50%', border: `1px solid ${C.dangerBorder}`, background: C.dangerBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.danger, padding: 0, fontFamily: 'inherit' }}>
              <svg width={10 * scale} height={10 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          )}
        </div>

        {/* Connector + Circle */}
        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, marginLeft: -1 * scale, position: 'relative' }}>
          <div style={{ width: CONNECTOR_DOT_R * 2 * scale, height: CONNECTOR_DOT_R * 2 * scale, borderRadius: '50%', background: C.surface3, border: `${Math.max(1, 1.5 * scale)}px solid rgba(255,255,255,0.15)`, flexShrink: 0 }} />
          <div style={{ width: CONNECTOR_LEN * scale, height: Math.max(1, 1.5 * scale), background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {isLoading && (
              <div style={{
                position: 'absolute', inset: -3 * scale, borderRadius: '50%',
                border: `${Math.max(2, 2.5 * scale)}px solid rgba(255,255,255,0.08)`,
                borderTopColor: 'rgba(255,255,255,0.9)',
                animation: 'network-spinner 0.8s linear infinite',
                pointerEvents: 'none',
              }} />
            )}
            <button type="button" onClick={(e) => { e.stopPropagation(); if (!isLoading) onToggleDropdown(); }} onMouseDown={(e) => e.stopPropagation()}
              style={{
                width: circleSize, height: circleSize, borderRadius: '50%',
                border: `${Math.max(1, 1.5 * scale)}px solid ${isLoading ? 'rgba(255,255,255,0.2)' : chosenOpt || dropdownOpen ? 'rgba(129,140,248,0.5)' : 'rgba(255,255,255,0.12)'}`,
                background: chosenOpt || dropdownOpen ? 'rgba(99,102,241,0.15)' : 'rgba(14,16,37,0.92)',
                boxShadow: chosenOpt || dropdownOpen ? '0 8px 28px rgba(99,102,241,0.3)' : '0 8px 28px rgba(0,0,0,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isLoading ? 'wait' : 'pointer',
                color: chosenOpt || dropdownOpen ? C.accentBright : C.text3, padding: 0, fontFamily: 'inherit', flexShrink: 0, transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { if (!dropdownOpen && !chosenOpt && !isLoading) { e.currentTarget.style.borderColor = 'rgba(129,140,248,0.5)'; e.currentTarget.style.color = C.accentBright; } }}
              onMouseLeave={(e) => { if (!dropdownOpen && !chosenOpt && !isLoading) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = C.text3; } }}
            >
              {chosenOpt ? (
                <svg width={18 * scale} height={18 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d={chosenOpt.icon} /></svg>
              ) : (
                <svg width={16 * scale} height={16 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              )}
            </button>
          </div>
          {/* Dropdown */}
          {dropdownOpen && (
            <div onMouseDown={(e) => e.stopPropagation()} style={{
              position: 'absolute', top: circleSize / 2 + 8 * scale, right: 0, transform: 'translateX(10%)', zIndex: 30, minWidth: 220,
              borderRadius: 12, background: 'rgba(14,16,37,0.95)', border: `1px solid ${C.border}`, backdropFilter: 'blur(18px)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.5)', padding: '6px', animation: 'fadeInUp 0.2s cubic-bezier(0.22,1,0.36,1) both',
            }}>
              <div style={{ padding: '6px 10px 4px', fontSize: 10, color: C.text3, letterSpacing: '0.1em', fontWeight: 600, textTransform: 'uppercase' as const }}>Netzwerk erweitern</div>
              {EXPAND_OPTIONS.map((opt) => (
                <button key={opt.key} type="button" onClick={(e) => { e.stopPropagation(); onSelectCategory(opt.key); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: C.text1, textAlign: 'left', fontFamily: 'inherit', fontSize: 12, fontWeight: 450, transition: 'all 0.12s ease' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(129,140,248,0.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(129,140,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={C.accentBright} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d={opt.icon} /></svg>
                  </div>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Score bar */}
      <div style={{ marginTop: 4 * scale, paddingLeft: 14 * scale, paddingRight: 14 * scale, width: CARD_W * scale }}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: CARD_W }}><ScoreBar score={node.score} /></div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TOOLBAR
   ═══════════════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════════════
   MINIMAP
   ═══════════════════════════════════════════════════════════════════════════ */

function Minimap({ offset, scale, viewport, nodes, leftOffset }: {
  offset: { x: number; y: number }; scale: number; viewport: { w: number; h: number }; nodes: NetworkNode[]; leftOffset: number;
}) {
  if (viewport.w === 0 || viewport.h === 0) return null;
  const MAP_W = 200, MAP_H = 120, PAD = 8, WORLD = 3000;
  const k = (MAP_W - PAD * 2) / WORLD;
  const viewWorldW = viewport.w / scale, viewWorldH = viewport.h / scale;
  const viewWorldX = -offset.x / scale, viewWorldY = -offset.y / scale;
  const cx = MAP_W / 2, cy = MAP_H / 2;
  const rectX = cx + viewWorldX * k, rectY = cy + viewWorldY * k;
  const rectW = Math.max(6, viewWorldW * k), rectH = Math.max(6, viewWorldH * k);
  const clampedX = Math.max(PAD, Math.min(MAP_W - PAD - rectW, rectX));
  const clampedY = Math.max(PAD, Math.min(MAP_H - PAD - rectH, rectY));

  return (
    <div onMouseDown={(e) => e.stopPropagation()} style={{
      position: 'absolute', bottom: 86, left: leftOffset, width: MAP_W, height: MAP_H, borderRadius: 12,
      background: 'rgba(14,16,37,0.8)', border: `1px solid ${C.border}`, backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
      boxShadow: '0 8px 28px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)', overflow: 'hidden', zIndex: 15,
    }}>
      <div style={{ position: 'absolute', inset: PAD, borderRadius: 6, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 0.5px, transparent 0.5px)', backgroundSize: '8px 8px' }} />
      <div style={{ position: 'absolute', left: cx - 2, top: cy - 2, width: 4, height: 4, borderRadius: '50%', background: C.accentBright, boxShadow: `0 0 8px ${C.accent}` }} />
      {nodes.map((n) => (
        <div key={n.id} style={{ position: 'absolute', left: cx + n.x * k - 2, top: cy + n.y * k - 2, width: 4, height: 4, borderRadius: '50%', background: scoreColor(n.score), boxShadow: `0 0 4px ${scoreColor(n.score)}` }} />
      ))}
      <div style={{ position: 'absolute', left: clampedX, top: clampedY, width: rectW, height: rectH, border: `1px solid ${C.accent}`, background: 'rgba(129,140,248,0.12)', borderRadius: 3, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 5, left: 8, fontSize: 9, color: C.text3, letterSpacing: '0.14em', fontWeight: 600, fontFamily: 'ui-monospace, SFMono-Regular, monospace', pointerEvents: 'none' }}>MAP</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TOOLBAR
   ═══════════════════════════════════════════════════════════════════════════ */

function Toolbar({ onFit, onZoomIn, onZoomOut, onAdd, leftOffset }: { onFit: () => void; onZoomIn: () => void; onZoomOut: () => void; onAdd: () => void; leftOffset: number }) {
  const s = 20;
  const btn = (onClick: () => void, title: string, d: string) => (
    <button type="button" onClick={onClick} onMouseDown={(e) => e.stopPropagation()} title={title} style={{
      width: 48, height: 48, borderRadius: 11, border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.025)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.text2, fontFamily: 'inherit', transition: 'all 0.15s ease',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(129,140,248,0.08)'; e.currentTarget.style.color = C.accentBright; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; e.currentTarget.style.color = C.text2; }}
    >
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
    </button>
  );
  return (
    <div style={{
      position: 'absolute', bottom: 20, left: leftOffset, display: 'flex', gap: 8, padding: 8, borderRadius: 14,
      background: 'rgba(14,16,37,0.8)', border: `1px solid ${C.border}`, backdropFilter: 'blur(14px)',
      boxShadow: '0 8px 28px rgba(0,0,0,0.4)', zIndex: 15,
    }}>
      {btn(onFit, 'Fit', 'M4 9V5a1 1 0 011-1h4M20 9V5a1 1 0 00-1-1h-4M4 15v4a1 1 0 001 1h4M20 15v4a1 1 0 01-1 1h-4')}
      {btn(onZoomIn, 'Zoom in', 'M21 21l-4.3-4.3M11 8v6M8 11h6')}
      {btn(onZoomOut, 'Zoom out', 'M21 21l-4.3-4.3M8 11h6')}
      {btn(onAdd, 'Lead hinzufügen', 'M12 5v14M5 12h14')}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════════ */

export default function NetworkPage() {
  // Canvas state
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [dropdownNodeId, setDropdownNodeId] = useState<string | null>(null);
  const [loadingNodeIds, setLoadingNodeIds] = useState<Set<string>>(new Set());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Network state
  const { networks, loading: netsLoading, createNetwork, renameNetwork, deleteNetwork } = useNetworks();
  const [activeNetworkId, setActiveNetworkId] = useState<string | null>(null);
  const { nodes, edges, loading: canvasLoading, addNode, removeNode, updateNodePosition, updateNodeCategory, addEdge, flushPositions, setExpandingNode } = useNetworkCanvas(activeNetworkId);

  // Stop loading spinners when new nodes arrive
  const prevNodeCount = useRef(nodes.length);
  useEffect(() => {
    if (nodes.length > prevNodeCount.current && loadingNodeIds.size > 0) {
      setLoadingNodeIds(new Set());
    }
    prevNodeCount.current = nodes.length;
  }, [nodes.length, loadingNodeIds.size]);

  // Auto-select first network
  useEffect(() => {
    if (!activeNetworkId && networks.length > 0) setActiveNetworkId(networks[0].id);
  }, [networks, activeNetworkId]);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasDrag = useRef<{ active: boolean; startX: number; startY: number; ox: number; oy: number } | null>(null);
  const nodeDrag = useRef<{ id: string; startX: number; startY: number; nx: number; ny: number } | null>(null);
  const scaleRef = useRef(scale);
  scaleRef.current = scale;

  // ── Canvas init ─────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setViewport({ w: rect.width, h: rect.height });
    setOffset({ x: rect.width / 2, y: rect.height / 2 });
    const ro = new ResizeObserver(() => { const r = el.getBoundingClientRect(); setViewport({ w: r.width, h: r.height }); });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Drag handlers (with threshold to distinguish click from drag) ─────
  const DRAG_THRESHOLD = 4;

  useEffect(() => {
    function onMove(e: MouseEvent) {
      // Node drag
      if (nodeDrag.current) {
        const { id, startX, startY, nx, ny } = nodeDrag.current;
        const s = scaleRef.current;
        const newX = Math.round((nx + (e.clientX - startX) / s) / GRID_SNAP) * GRID_SNAP;
        const newY = Math.round((ny + (e.clientY - startY) / s) / GRID_SNAP) * GRID_SNAP;
        updateNodePosition(id, newX, newY);
        return;
      }
      // Canvas pan — only activate after threshold
      if (canvasDrag.current) {
        const { startX, startY, ox, oy, active } = canvasDrag.current;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (!active) {
          if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
            canvasDrag.current.active = true;
            document.body.style.cursor = 'grabbing';
          } else {
            return;
          }
        }
        setOffset({ x: ox + dx, y: oy + dy });
      }
    }
    function onUp() {
      if (nodeDrag.current) flushPositions();
      nodeDrag.current = null;
      canvasDrag.current = null;
      document.body.style.cursor = '';
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [updateNodePosition, flushPositions]);

  // ── Zoom ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      // Trackpad pinch-to-zoom sends ctrlKey on macOS
      const isPinch = e.ctrlKey || e.metaKey;
      if (isPinch) {
        const rect = el!.getBoundingClientRect();
        const cx = e.clientX - rect.left, cy = e.clientY - rect.top;
        setScale((prev) => {
          const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev * Math.exp(-e.deltaY * 0.01)));
          const ratio = next / prev;
          setOffset((o) => ({ x: cx - (cx - o.x) * ratio, y: cy - (cy - o.y) * ratio }));
          return next;
        });
      } else {
        // Two-finger scroll = pan; shift+scroll = zoom
        if (e.shiftKey) {
          const rect = el!.getBoundingClientRect();
          const cx = rect.width / 2, cy = rect.height / 2;
          setScale((prev) => {
            const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev * Math.exp(-e.deltaY * 0.005)));
            const ratio = next / prev;
            setOffset((o) => ({ x: cx - (cx - o.x) * ratio, y: cy - (cy - o.y) * ratio }));
            return next;
          });
        } else {
          setOffset((o) => ({ x: o.x - e.deltaX, y: o.y - e.deltaY }));
        }
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // ── Actions ─────────────────────────────────────────────────────────────
  function onCanvasMouseDown(e: React.MouseEvent) {
    setSelectedNodeId(null);
    setDropdownNodeId(null);
    canvasDrag.current = { active: false, startX: e.clientX, startY: e.clientY, ox: offset.x, oy: offset.y };
    document.body.style.cursor = 'grab';
  }

  function onNodeDragStart(id: string, e: React.MouseEvent) {
    const node = nodes.find((n) => n.id === id);
    if (!node) return;
    nodeDrag.current = { id, startX: e.clientX, startY: e.clientY, nx: node.x, ny: node.y };
    document.body.style.cursor = 'grabbing';
  }

  function zoomAtCenter(factor: number) {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.width / 2, cy = rect.height / 2;
    setScale((prev) => {
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev * factor));
      const ratio = next / prev;
      setOffset((o) => ({ x: cx - (cx - o.x) * ratio, y: cy - (cy - o.y) * ratio }));
      return next;
    });
  }

  function fitToNodes() {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (nodes.length === 0) { setScale(1); setOffset({ x: rect.width / 2, y: rect.height / 2 }); return; }
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const n of nodes) { minX = Math.min(minX, n.x - 150); maxX = Math.max(maxX, n.x + 150); minY = Math.min(minY, n.y - 80); maxY = Math.max(maxY, n.y + 80); }
    const bw = maxX - minX + 120, bh = maxY - minY + 120;
    const ns = Math.min(Math.max(MIN_SCALE, Math.min(rect.width / bw, rect.height / bh)), 2);
    setScale(ns);
    setOffset({ x: rect.width / 2 - ((minX + maxX) / 2) * ns, y: rect.height / 2 - ((minY + maxY) / 2) * ns });
  }

  async function handleCreateNetwork() {
    const net = await createNetwork();
    if (net) setActiveNetworkId(net.id);
  }

  async function handleAddLead(lead: RawLead) {
    if (!activeNetworkId) {
      const net = await createNetwork();
      if (!net) return;
      setActiveNetworkId(net.id);
      // Small delay for state to settle
      setTimeout(() => addLeadToCanvas(net.id, lead), 100);
      return;
    }
    addLeadToCanvas(activeNetworkId, lead);
  }

  async function addLeadToCanvas(netId: string, lead: RawLead) {
    const el = containerRef.current;
    const cx = el ? (el.getBoundingClientRect().width / 2 - offset.x) / scale : 0;
    const cy = el ? (el.getBoundingClientRect().height / 2 - offset.y) / scale : 0;
    const count = nodes.length;
    const angle = count * 2.4;
    const radius = 60 + count * 40;
    const x = Math.round((cx + Math.cos(angle) * radius) / GRID_SNAP) * GRID_SNAP;
    const y = Math.round((cy + Math.sin(angle) * radius) / GRID_SNAP) * GRID_SNAP;

    const newNode = await addNode(lead.id, x, y);

    // If there's a selected node, create an edge
    if (newNode && selectedNodeId) {
      await addEdge(selectedNodeId, newNode.id, 'manual');
    }
    setPickerOpen(false);
  }

  async function handleSelectCategory(nodeId: string, cat: ExpandCategory) {
    await updateNodeCategory(nodeId, cat);
    setDropdownNodeId(null);

    // Start loading animation
    setLoadingNodeIds((prev) => new Set(prev).add(nodeId));

    // Tell the hook which node is expanding so new arrivals get positioned relative to it
    setExpandingNode(nodeId);

    // Send website_data to n8n webhook only for "Ähnliche Unternehmen"
    if (cat === 'similar' && activeNetworkId) {
      try {
        await fetch(`/api/networks/${activeNetworkId}/expand`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ node_id: nodeId, category: cat }),
        });
      } catch {}
    } else {
      // For non-webhook categories, stop loading after a short delay
      setTimeout(() => {
        setLoadingNodeIds((prev) => { const next = new Set(prev); next.delete(nodeId); return next; });
        setExpandingNode(null);
      }, 600);
    }
  }

  async function handleDeleteNetwork(id: string) {
    await deleteNetwork(id);
    if (activeNetworkId === id) {
      setActiveNetworkId(networks.find((n) => n.id !== id)?.id ?? null);
    }
  }

  const dotSize = BASE_DOT * scale;

  return (
    <>
    <style>{`@keyframes network-spinner { to { transform: rotate(360deg); } }`}</style>
    <div
      ref={containerRef}
      onMouseDown={onCanvasMouseDown}
      style={{
        flex: 1, margin: '-28px -32px', position: 'relative', overflow: 'hidden',
        cursor: 'default', backgroundColor: C.bg,
        backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.18) ${Math.max(0.5, scale)}px, transparent ${Math.max(0.5, scale) + 0.5}px)`,
        backgroundSize: `${dotSize}px ${dotSize}px`, backgroundPosition: `${offset.x}px ${offset.y}px`,
        userSelect: 'none',
      }}
    >
      {/* Top-right info */}
      <div style={{
        position: 'absolute', top: 24, right: 32, fontSize: 11, color: C.text3, letterSpacing: '0.12em', fontWeight: 500,
        pointerEvents: 'none', fontFamily: 'ui-monospace, SFMono-Regular, monospace', zIndex: 5,
      }}>
        NETWORK · {(scale * 100).toFixed(0)}%
        {nodes.length > 0 && <span style={{ marginLeft: 12, background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.2)', borderRadius: 6, padding: '2px 8px', fontSize: 10, color: C.accentBright }}>{nodes.length} NODE{nodes.length !== 1 ? 'S' : ''}</span>}
      </div>

      {/* Sidebar */}
      <Sidebar
        networks={networks} loading={netsLoading} activeId={activeNetworkId} collapsed={sidebarCollapsed}
        onSelect={setActiveNetworkId} onCreate={handleCreateNetwork}
        onRename={renameNetwork} onDelete={handleDeleteNetwork}
        onToggle={() => setSidebarCollapsed((p) => !p)}
      />

      {/* Toolbar + Minimap — positioned next to sidebar */}
      {(() => { const lo = sidebarCollapsed ? 24 : 300; return (<>
        <Minimap offset={offset} scale={scale} viewport={viewport} nodes={nodes} leftOffset={lo} />
        <Toolbar onFit={fitToNodes} onZoomIn={() => zoomAtCenter(1.2)} onZoomOut={() => zoomAtCenter(1 / 1.2)} onAdd={() => setPickerOpen(true)} leftOffset={lo} />
      </>); })()}

      {/* Lead Picker */}
      <LeadPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={handleAddLead} />

      {/* Loading */}
      {canvasLoading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
          <div style={{ fontSize: 12, color: C.text3 }}>Lade Netzwerk…</div>
        </div>
      )}

      {/* Empty state — clickable square in center with text */}
      {!canvasLoading && activeNetworkId && nodes.length === 0 && !pickerOpen && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', gap: 12, zIndex: 1 }}>
          <button type="button" onClick={() => setPickerOpen(true)} onMouseDown={(e) => e.stopPropagation()}
            style={{
              pointerEvents: 'auto', width: 64, height: 64, borderRadius: 16,
              border: '1.5px dashed rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.02)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: C.text3, fontFamily: 'inherit', padding: 0,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(129,140,248,0.5)'; e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.color = C.accentBright; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.color = C.text3; }}
          >
            <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          </button>
          <div style={{ fontSize: 13, fontWeight: 500, color: C.text2 }}>Leads hinzufügen</div>
          <div style={{ fontSize: 11, color: C.text3 }}>Klicke um einen Lead auf das Canvas zu setzen</div>
        </div>
      )}

      {/* No network selected */}
      {!canvasLoading && !activeNetworkId && !netsLoading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', gap: 16, zIndex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: C.text2 }}>Kein Netzwerk ausgewählt</div>
          <button type="button" onClick={handleCreateNetwork} onMouseDown={(e) => e.stopPropagation()}
            style={{ pointerEvents: 'auto', padding: '8px 20px', borderRadius: 9, border: `1px solid rgba(129,140,248,0.3)`, background: 'rgba(99,102,241,0.1)', color: C.accentBright, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            + Netzwerk erstellen
          </button>
        </div>
      )}

      {/* Edge lines */}
      <EdgeLines edges={edges} nodes={nodes} offset={offset} scale={scale} />

      {/* Nodes */}
      {nodes.map((node) => (
        <LeadNodeCard
          key={node.id}
          node={node} offset={offset} scale={scale}
          selected={selectedNodeId === node.id}
          dropdownOpen={dropdownNodeId === node.id}
          isLoading={loadingNodeIds.has(node.id)}
          onSelect={() => { setSelectedNodeId(node.id); setDropdownNodeId(null); }}
          onDragStart={(e) => onNodeDragStart(node.id, e)}
          onRemove={() => removeNode(node.id)}
          onToggleDropdown={() => setDropdownNodeId((p) => p === node.id ? null : node.id)}
          onSelectCategory={(cat) => handleSelectCategory(node.id, cat)}
        />
      ))}
    </div>
    </>
  );
}
