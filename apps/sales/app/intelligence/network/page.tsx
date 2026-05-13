'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme, colors } from '../layout';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Lead {
  id: string;
  name: string;
  industry: string;
  system: string;
  carrier: string;
  score: number;
  city: string;
  tier: string;
  contacts: Contact[];
}

interface Contact {
  name: string;
  role: string;
  formerCompanies: string[];
}

interface PhysNode {
  id: string;
  lead: Lead;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  cluster: string;
  colorIdx: number;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  strength: number;
  shared: string[];
  isBridge: boolean;
  bridgeContact?: string;
}

type ClusterKey = 'industry' | 'system' | 'carrier';

// ─── Constants ────────────────────────────────────────────────────────────────

const PALETTE = [
  { fill: 'rgba(79,70,229,0.09)', stroke: 'rgba(79,70,229,0.3)', text: '#4F46E5', node: '#4F46E5' },
  { fill: 'rgba(5,150,105,0.09)', stroke: 'rgba(5,150,105,0.3)', text: '#059669', node: '#059669' },
  { fill: 'rgba(217,119,6,0.09)', stroke: 'rgba(217,119,6,0.3)', text: '#D97706', node: '#D97706' },
  { fill: 'rgba(220,38,38,0.09)', stroke: 'rgba(220,38,38,0.3)', text: '#DC2626', node: '#DC2626' },
  { fill: 'rgba(8,145,178,0.09)', stroke: 'rgba(8,145,178,0.3)', text: '#0891B2', node: '#0891B2' },
  { fill: 'rgba(124,58,237,0.09)', stroke: 'rgba(124,58,237,0.3)', text: '#7C3AED', node: '#7C3AED' },
  { fill: 'rgba(156,163,175,0.09)', stroke: 'rgba(156,163,175,0.3)', text: '#6B7280', node: '#94A3B8' },
];

const CW = 1600;
const CH = 1000;
const R_MIN = 24;
const R_MAX = 48;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreR(s: number) {
  return R_MIN + Math.max(0, Math.min(1, (s - 30) / 70)) * (R_MAX - R_MIN);
}

function similarity(a: Lead, b: Lead): { score: number; shared: string[] } {
  let s = 0;
  const shared: string[] = [];
  if (a.industry && a.industry === b.industry) {
    s += 0.4;
    shared.push(a.industry);
  }
  if (a.system && a.system === b.system) {
    s += 0.35;
    shared.push(a.system);
  }
  const ac = a.carrier?.split(' ')[0];
  const bc = b.carrier?.split(' ')[0];
  if (ac && ac === bc) {
    s += 0.25;
    shared.push(ac);
  }
  return { score: Math.min(1, s), shared };
}

function convexHull(pts: { x: number; y: number }[]): { x: number; y: number }[] {
  if (pts.length < 3) return pts;
  const sorted = [...pts].sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower: { x: number; y: number }[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: { x: number; y: number }[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  upper.pop();
  lower.pop();
  return [...lower, ...upper];
}

function expandHull(hull: { x: number; y: number }[], pad: number): { x: number; y: number }[] {
  if (!hull.length) return [];
  const cx = hull.reduce((s, p) => s + p.x, 0) / hull.length;
  const cy = hull.reduce((s, p) => s + p.y, 0) / hull.length;
  return hull.map((p) => {
    const dx = p.x - cx,
      dy = p.y - cy;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    return { x: p.x + (dx / d) * pad, y: p.y + (dy / d) * pad };
  });
}

function smoothPath(hull: { x: number; y: number }[]): string {
  if (hull.length < 3) {
    if (hull.length === 2) return `M${hull[0].x},${hull[0].y} L${hull[1].x},${hull[1].y}`;
    if (hull.length === 1) return `M${hull[0].x},${hull[0].y}`;
    return '';
  }
  const pts = [...hull, hull[0], hull[1]];
  let d = '';
  for (let i = 0; i < hull.length; i++) {
    const p0 = pts[i],
      p1 = pts[i + 1],
      p2 = pts[i + 2];
    const mx1 = (p0.x + p1.x) / 2,
      my1 = (p0.y + p1.y) / 2;
    const mx2 = (p1.x + p2.x) / 2,
      my2 = (p1.y + p2.y) / 2;
    if (i === 0) d += `M${mx1.toFixed(1)},${my1.toFixed(1)} `;
    d += `Q${p1.x.toFixed(1)},${p1.y.toFixed(1)} ${mx2.toFixed(1)},${my2.toFixed(1)} `;
  }
  return d + 'Z';
}

function clusterValue(lead: Lead, key: ClusterKey): string {
  if (key === 'industry') return lead.industry || 'Sonstige';
  if (key === 'system') return lead.system || 'Sonstige';
  return lead.carrier?.split(' ')[0] || 'Sonstige';
}

function runPhysics(nodes: PhysNode[], edges: Edge[]): PhysNode[] {
  const ns = nodes.map((n) => ({ ...n }));
  const cx = CW / 2,
    cy = CH / 2;
  const TICKS = 220;
  for (let t = 0; t < TICKS; t++) {
    const alpha = Math.pow(1 - t / TICKS, 1.5);
    // Repulsion
    for (let i = 0; i < ns.length; i++) {
      for (let j = i + 1; j < ns.length; j++) {
        const dx = ns[j].x - ns[i].x,
          dy = ns[j].y - ns[i].y;
        const d2 = dx * dx + dy * dy || 0.01;
        const d = Math.sqrt(d2);
        const minD = ns[i].r + ns[j].r + 28;
        const k = d < minD ? 18000 : 9000;
        const f = (k / d2) * alpha;
        const fx = (dx / d) * f,
          fy = (dy / d) * f;
        ns[i].vx -= fx;
        ns[i].vy -= fy;
        ns[j].vx += fx;
        ns[j].vy += fy;
      }
    }
    // Attraction along similarity edges
    for (const e of edges) {
      if (e.isBridge) continue;
      const src = ns.find((n) => n.id === e.source);
      const tgt = ns.find((n) => n.id === e.target);
      if (!src || !tgt) continue;
      const dx = tgt.x - src.x,
        dy = tgt.y - src.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 0.1;
      const target = e.strength > 0.6 ? 130 : e.strength > 0.3 ? 220 : 340;
      const diff = d - target;
      const k = e.strength > 0.6 ? 0.045 : 0.015;
      const f = diff * k * alpha;
      const fx = (dx / d) * f,
        fy = (dy / d) * f;
      src.vx += fx;
      src.vy += fy;
      tgt.vx -= fx;
      tgt.vy -= fy;
    }
    // Cluster gravity — same cluster pull toward each other
    const clusters = new Map<string, { x: number; y: number; n: number }>();
    for (const node of ns) {
      const e = clusters.get(node.cluster) ?? { x: 0, y: 0, n: 0 };
      e.x += node.x;
      e.y += node.y;
      e.n++;
      clusters.set(node.cluster, e);
    }
    for (const node of ns) {
      const e = clusters.get(node.cluster)!;
      const gcx = e.x / e.n,
        gcy = e.y / e.n;
      node.vx += (gcx - node.x) * 0.008 * alpha;
      node.vy += (gcy - node.y) * 0.008 * alpha;
    }
    // Global gravity
    for (const n of ns) {
      n.vx += (cx - n.x) * 0.008 * alpha * 0.4;
      n.vy += (cy - n.y) * 0.008 * alpha * 0.4;
    }
    // Apply + dampen + clamp
    for (const n of ns) {
      n.vx *= 0.78;
      n.vy *= 0.78;
      n.x += n.vx;
      n.y += n.vy;
      n.x = Math.max(n.r + 30, Math.min(CW - n.r - 30, n.x));
      n.y = Math.max(n.r + 30, Math.min(CH - n.r - 30, n.y));
    }
  }
  return ns;
}

function buildGraph(leads: Lead[], key: ClusterKey): { nodes: PhysNode[]; edges: Edge[] } {
  const vals = [...new Set(leads.map((l) => clusterValue(l, key)))];
  const colorMap = new Map(vals.map((v, i) => [v, i % PALETTE.length]));

  const nodes: PhysNode[] = leads.map((lead, i) => {
    const angle = (i / leads.length) * Math.PI * 2;
    const dist = 220 + Math.random() * 80;
    const cv = clusterValue(lead, key);
    return {
      id: lead.id,
      lead,
      x: CW / 2 + Math.cos(angle) * dist + (Math.random() - 0.5) * 60,
      y: CH / 2 + Math.sin(angle) * dist + (Math.random() - 0.5) * 60,
      vx: 0,
      vy: 0,
      r: scoreR(lead.score),
      cluster: cv,
      colorIdx: colorMap.get(cv) ?? 6,
    };
  });

  const edges: Edge[] = [];
  for (let i = 0; i < leads.length; i++) {
    for (let j = i + 1; j < leads.length; j++) {
      const { score, shared } = similarity(leads[i], leads[j]);
      if (score >= 0.25) {
        edges.push({
          id: `e-${i}-${j}`,
          source: leads[i].id,
          target: leads[j].id,
          strength: score,
          shared,
          isBridge: false,
        });
      }
    }
  }

  // Career bridge edges (Mark concept)
  for (const lead of leads) {
    for (const contact of lead.contacts) {
      for (const fc of contact.formerCompanies) {
        const match = leads.find(
          (l) =>
            l.id !== lead.id &&
            (l.name.toLowerCase().includes(fc.toLowerCase().slice(0, 6)) ||
              fc.toLowerCase().includes(l.name.toLowerCase().split(' ')[0]))
        );
        if (match) {
          const already = edges.find(
            (e) =>
              e.isBridge &&
              ((e.source === lead.id && e.target === match.id) || (e.source === match.id && e.target === lead.id))
          );
          if (!already) {
            edges.push({
              id: `bridge-${lead.id}-${match.id}`,
              source: lead.id,
              target: match.id,
              strength: 0.5,
              shared: [],
              isBridge: true,
              bridgeContact: `${contact.name} (${contact.role})`,
            });
          }
        }
      }
    }
  }

  return { nodes, edges };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapLead(row: any): Lead {
  const ctx: Record<string, unknown> = row.follow_up_context ?? {};
  const rawC = (ctx.contacts ?? []) as Array<Record<string, unknown>>;
  return {
    id: row.id as string,
    name: (row.company_name as string) ?? '',
    industry: (row.industry as string) ?? '',
    system: (ctx.shop_system as string) ?? '',
    carrier: (ctx.carrier as string) ?? '',
    score: typeof row.fit_score === 'number' ? row.fit_score : 50,
    city: (row.city as string) ?? '',
    tier: (row.tier as string) ?? '',
    contacts: rawC.map((c) => ({
      name: (c.name as string) ?? '',
      role: (c.role as string) ?? '',
      formerCompanies: (c.former_companies as string[]) ?? [],
    })),
  };
}

// ─── ICP Pattern detector ─────────────────────────────────────────────────────

function detectPatterns(leads: Lead[]): { label: string; count: number; attrs: string[] }[] {
  const patterns: { key: string; attrs: string[]; ids: Set<string> }[] = [];
  for (let i = 0; i < leads.length; i++) {
    for (let j = i + 1; j < leads.length; j++) {
      const { shared } = similarity(leads[i], leads[j]);
      if (shared.length >= 2) {
        const key = shared.sort().join('|');
        const existing = patterns.find((p) => p.key === key);
        if (existing) {
          existing.ids.add(leads[i].id);
          existing.ids.add(leads[j].id);
        } else {
          patterns.push({ key, attrs: shared, ids: new Set([leads[i].id, leads[j].id]) });
        }
      }
    }
  }
  return patterns
    .filter((p) => p.ids.size >= 2)
    .sort((a, b) => b.ids.size - a.ids.size)
    .slice(0, 4)
    .map((p) => ({ label: p.attrs.join(' + '), count: p.ids.size, attrs: p.attrs }));
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Transform = { x: number; y: number; scale: number };

export default function NetworkPage() {
  const { theme } = useTheme();
  const c = colors(theme);
  const isDark = theme === 'dark';

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState<PhysNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [clusterKey, setClusterKey] = useState<ClusterKey>('industry');
  const [showBridges, setShowBridges] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<Edge | null>(null);
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 0.72 });
  const [simRunning, setSimRunning] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const panRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const dragRef = useRef<{ id: string; sx: number; sy: number; ox: number; oy: number } | null>(null);

  // ── Load leads ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/leads')
      .then((r) => r.json())
      .then((data) => {
        const mapped: Lead[] = (data.leads ?? []).map(mapLead);
        setLeads(mapped);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // ── Build + simulate when leads or clusterKey changes ───────────────────────
  useEffect(() => {
    if (leads.length === 0) return;
    setSimRunning(true);
    setSelectedId(null);
    const { nodes: rawNodes, edges: rawEdges } = buildGraph(leads, clusterKey);
    const settled = runPhysics(rawNodes, rawEdges);
    setNodes(settled);
    setEdges(rawEdges);
    setSimRunning(false);
  }, [leads, clusterKey]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const selectedNode = selectedId ? (nodeMap.get(selectedId) ?? null) : null;
  const patterns = detectPatterns(leads);

  // Cluster hulls
  const clusterGroups = new Map<string, PhysNode[]>();
  for (const n of nodes) {
    const list = clusterGroups.get(n.cluster) ?? [];
    list.push(n);
    clusterGroups.set(n.cluster, list);
  }

  // ── Interaction ─────────────────────────────────────────────────────────────
  const handleSvgMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (e.button !== 0) return;
      panRef.current = { sx: e.clientX, sy: e.clientY, ox: transform.x, oy: transform.y };
    },
    [transform]
  );

  const handleSvgMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (dragRef.current) {
        const { id, sx, sy, ox, oy } = dragRef.current;
        const dx = (e.clientX - sx) / transform.scale;
        const dy = (e.clientY - sy) / transform.scale;
        setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, x: ox + dx, y: oy + dy } : n)));
        return;
      }
      if (panRef.current) {
        const { sx, sy, ox, oy } = panRef.current;
        setTransform((p) => ({ ...p, x: ox + (e.clientX - sx), y: oy + (e.clientY - sy) }));
      }
    },
    [transform.scale]
  );

  const handleSvgMouseUp = useCallback(() => {
    dragRef.current = null;
    panRef.current = null;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const rect = svgRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? 0.88 : 1.12;
    setTransform((p) => {
      const ns = Math.min(3, Math.max(0.2, p.scale * delta));
      const f = ns / p.scale;
      return { scale: ns, x: mx - f * (mx - p.x), y: my - f * (my - p.y) };
    });
  }, []);

  function handleNodeMouseDown(e: React.MouseEvent, node: PhysNode) {
    e.stopPropagation();
    panRef.current = null;
    dragRef.current = { id: node.id, sx: e.clientX, sy: e.clientY, ox: node.x, oy: node.y };
  }

  function handleNodeClick(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    setSelectedId((p) => (p === id ? null : id));
  }

  const visibleEdges = edges.filter((e) => (e.isBridge ? showBridges : e.strength >= 0.25));

  // ── Empty / loading states ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: c.bgPage,
          fontFamily: 'var(--font-inter), sans-serif',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: c.textSub, marginTop: 12 }}>Leads laden…</div>
        </div>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: c.bgPage,
          fontFamily: 'var(--font-inter), sans-serif',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <svg
          width={48}
          height={48}
          viewBox="0 0 24 24"
          fill="none"
          stroke={c.border}
          strokeWidth={1.4}
          strokeLinecap="round"
        >
          <circle cx="12" cy="5" r="2" />
          <circle cx="5" cy="19" r="2" />
          <circle cx="19" cy="19" r="2" />
          <path d="M12 7v4M10.5 13l-4 4M13.5 13l4 4" />
        </svg>
        <div style={{ fontSize: 14, color: c.textSub, fontWeight: 600 }}>Keine Leads vorhanden</div>
        <div style={{ fontSize: 12, color: c.textMuted }}>Füge zuerst Leads hinzu um das Netzwerk zu erkunden</div>
      </div>
    );
  }

  const clusterLabels = [...clusterGroups.keys()];

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        fontFamily: 'var(--font-inter), sans-serif',
        background: c.bgPage,
      }}
    >
      {/* ── Left Sidebar ─────────────────────────────────────────────────── */}
      <div
        style={{
          width: 272,
          borderRight: `1px solid ${c.border}`,
          background: c.bgCard,
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 18px 12px', borderBottom: `1px solid ${c.border}` }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: c.accent,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              marginBottom: 6,
            }}
          >
            ICP Discovery
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: c.text, marginBottom: 4 }}>Netzwerk</div>
          <div style={{ fontSize: 11, color: c.textSub }}>
            {leads.length} Leads · {edges.filter((e) => !e.isBridge).length} Ähnlichkeiten ·{' '}
            {edges.filter((e) => e.isBridge).length} Verbindungen
          </div>
        </div>

        {/* Cluster switcher */}
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${c.border}` }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: c.textSub,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 8,
            }}
          >
            Cluster nach
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {(
              [
                ['industry', 'Branche'],
                ['system', 'Shop-System'],
                ['carrier', 'Carrier'],
              ] as [ClusterKey, string][]
            ).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setClusterKey(k)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 10px',
                  borderRadius: 8,
                  border: `1.5px solid ${clusterKey === k ? c.accent : c.border}`,
                  background: clusterKey === k ? (isDark ? `${c.accent}22` : '#EEF0FF') : 'transparent',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: clusterKey === k ? c.accent : c.borderStrong,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 12, fontWeight: 700, color: clusterKey === k ? c.accent : c.textSub }}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Cluster legend */}
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${c.border}` }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: c.textSub,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 8,
            }}
          >
            Cluster
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {clusterLabels.map((label) => {
              const group = clusterGroups.get(label)!;
              const colorIdx = group[0]?.colorIdx ?? 6;
              const pal = PALETTE[colorIdx];
              return (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: pal.stroke, flexShrink: 0 }} />
                  <span
                    style={{
                      fontSize: 12,
                      color: c.textSub,
                      fontWeight: 600,
                      flex: 1,
                      minWidth: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {label || 'Sonstige'}
                  </span>
                  <span style={{ fontSize: 10, color: c.textMuted, fontWeight: 700 }}>{group.length}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ICP Patterns */}
        {patterns.length > 0 && (
          <div style={{ padding: '14px 18px', flex: 1, overflowY: 'auto' }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: c.textSub,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 10,
              }}
            >
              Erkannte ICP-Muster
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {patterns.map((p, i) => (
                <div
                  key={i}
                  style={{
                    background: c.bgPage,
                    borderRadius: 10,
                    padding: '10px 12px',
                    border: `1px solid ${c.border}`,
                  }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 5 }}>
                    {p.attrs.map((a) => (
                      <span
                        key={a}
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: 4,
                          background: isDark ? `${c.accent}22` : '#EEF0FF',
                          color: c.accent,
                        }}
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: c.textSub }}>
                    <span style={{ fontWeight: 700, color: c.text }}>{p.count}</span> Unternehmen passen
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Kontaktbrücken toggle */}
        <div style={{ padding: '12px 18px', borderTop: `1px solid ${c.border}`, marginTop: 'auto' }}>
          <button
            onClick={() => setShowBridges((v) => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: '8px 10px',
              borderRadius: 8,
              border: `1.5px solid ${showBridges ? '#7C3AED' : c.border}`,
              background: showBridges ? (isDark ? 'rgba(124,58,237,0.15)' : '#F5F3FF') : 'transparent',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <svg
              width={13}
              height={13}
              viewBox="0 0 16 16"
              fill="none"
              stroke={showBridges ? '#7C3AED' : c.textMuted}
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <circle cx="3" cy="8" r="2" />
              <circle cx="13" cy="8" r="2" />
              <line x1="5" y1="8" x2="11" y2="8" strokeDasharray="2 1.5" />
            </svg>
            <span style={{ fontSize: 12, fontWeight: 700, color: showBridges ? '#7C3AED' : c.textSub }}>
              Kontaktbrücken
            </span>
            <span
              style={{
                marginLeft: 'auto',
                fontSize: 10,
                fontWeight: 700,
                color: showBridges ? '#7C3AED' : c.textMuted,
              }}
            >
              {edges.filter((e) => e.isBridge).length}
            </span>
          </button>
        </div>
      </div>

      {/* ── Canvas ───────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        {/* Toolbar */}
        <div
          style={{
            height: 48,
            borderBottom: `1px solid ${c.border}`,
            background: c.bgCard,
            display: 'flex',
            alignItems: 'center',
            paddingInline: 16,
            gap: 8,
            flexShrink: 0,
          }}
        >
          <div style={{ flex: 1 }} />
          {/* Sim running indicator */}
          {simRunning && <span style={{ fontSize: 11, color: c.textSub }}>Berechne…</span>}
          {/* Zoom */}
          {([0.45, 0.72, 1.0, 1.4] as const).map((z) => (
            <button
              key={z}
              onClick={() => setTransform((p) => ({ ...p, scale: z }))}
              style={{
                padding: '4px 9px',
                borderRadius: 6,
                border: `1px solid ${Math.abs(transform.scale - z) < 0.05 ? c.accent : c.border}`,
                background:
                  Math.abs(transform.scale - z) < 0.05 ? (isDark ? `${c.accent}22` : '#EEF0FF') : 'transparent',
                color: Math.abs(transform.scale - z) < 0.05 ? c.accent : c.textSub,
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {Math.round(z * 100)}%
            </button>
          ))}
          <div style={{ width: 1, height: 20, background: c.border }} />
          <button
            onClick={() => setTransform({ x: 0, y: 0, scale: 0.72 })}
            style={{
              padding: '4px 9px',
              borderRadius: 6,
              border: `1px solid ${c.border}`,
              background: 'transparent',
              color: c.textSub,
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Reset
          </button>
        </div>

        {/* SVG Canvas */}
        <svg
          ref={svgRef}
          style={{
            flex: 1,
            background: c.bgPage,
            backgroundImage: `radial-gradient(circle, ${isDark ? 'rgba(255,255,255,0.06)' : '#D1D5DB'} 1px, transparent 1px)`,
            backgroundSize: '28px 28px',
            cursor: panRef.current ? 'grabbing' : 'grab',
            display: 'block',
          }}
          onMouseDown={handleSvgMouseDown}
          onMouseMove={handleSvgMouseMove}
          onMouseUp={handleSvgMouseUp}
          onMouseLeave={handleSvgMouseUp}
          onWheel={handleWheel}
          onClick={() => setSelectedId(null)}
        >
          <g transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}>
            {/* ── Cluster hulls ─────────────────────────────────────────── */}
            {[...clusterGroups.entries()].map(([label, group]) => {
              if (group.length < 2) return null;
              const pts = group.map((n) => ({ x: n.x, y: n.y }));
              const hull = expandHull(convexHull(pts), 50 + group[0].r);
              const path = smoothPath(hull);
              if (!path) return null;
              const pal = PALETTE[group[0].colorIdx];
              const cx = group.reduce((s, n) => s + n.x, 0) / group.length;
              const cy = group.reduce((s, n) => s + n.y, 0) / group.length;
              // find top point of hull
              const topY = Math.min(...hull.map((p) => p.y));
              return (
                <g key={label}>
                  <path d={path} fill={pal.fill} stroke={pal.stroke} strokeWidth={1.5} strokeDasharray="6 3" />
                  <text
                    x={cx}
                    y={topY - 10}
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight={700}
                    fill={pal.text}
                    fontFamily="var(--font-inter), sans-serif"
                    opacity={0.8}
                  >
                    {label}
                  </text>
                </g>
              );
            })}

            {/* ── Edges ──────────────────────────────────────────────────── */}
            {visibleEdges.map((edge) => {
              const src = nodeMap.get(edge.source);
              const tgt = nodeMap.get(edge.target);
              if (!src || !tgt) return null;
              const isHovered = hoveredEdge?.id === edge.id;
              if (edge.isBridge) {
                return (
                  <g key={edge.id}>
                    <line
                      x1={src.x}
                      y1={src.y}
                      x2={tgt.x}
                      y2={tgt.y}
                      stroke="#7C3AED"
                      strokeWidth={isHovered ? 2.5 : 1.5}
                      strokeDasharray="5 4"
                      opacity={isHovered ? 0.85 : 0.35}
                      onMouseEnter={() => setHoveredEdge(edge)}
                      onMouseLeave={() => setHoveredEdge(null)}
                      style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
                    />
                    {isHovered && (
                      <text
                        x={(src.x + tgt.x) / 2}
                        y={(src.y + tgt.y) / 2 - 8}
                        textAnchor="middle"
                        fontSize={9}
                        fill="#7C3AED"
                        fontFamily="var(--font-inter), sans-serif"
                        fontWeight={600}
                      >
                        {edge.bridgeContact}
                      </text>
                    )}
                  </g>
                );
              }
              const op = 0.08 + edge.strength * 0.38;
              const sw = 0.8 + edge.strength * 1.8;
              return (
                <g key={edge.id}>
                  <line
                    x1={src.x}
                    y1={src.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    stroke={c.textMuted}
                    strokeWidth={sw}
                    opacity={op}
                    onMouseEnter={() => setHoveredEdge(edge)}
                    onMouseLeave={() => setHoveredEdge(null)}
                    style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
                  />
                  {isHovered && edge.shared.length > 0 && (
                    <text
                      x={(src.x + tgt.x) / 2}
                      y={(src.y + tgt.y) / 2 - 7}
                      textAnchor="middle"
                      fontSize={9}
                      fill={c.textSub}
                      fontFamily="var(--font-inter), sans-serif"
                      fontWeight={600}
                    >
                      {edge.shared.join(' · ')}
                    </text>
                  )}
                </g>
              );
            })}

            {/* ── Nodes ─────────────────────────────────────────────────── */}
            {nodes.map((node) => {
              const isSelected = node.id === selectedId;
              const isHovered = node.id === hoveredId;
              const pal = PALETTE[node.colorIdx];
              const sc = node.lead.score >= 80 ? '#DC2626' : node.lead.score >= 65 ? '#D97706' : '#64748B';
              const active = isSelected || isHovered;
              return (
                <g
                  key={node.id}
                  onMouseDown={(e) => handleNodeMouseDown(e, node)}
                  onClick={(e) => handleNodeClick(e, node.id)}
                  onMouseEnter={() => setHoveredId(node.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Glow ring */}
                  {active && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.r + 7}
                      fill={`${pal.node}22`}
                      stroke={pal.stroke}
                      strokeWidth={1.5}
                    />
                  )}
                  {/* Main circle */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.r}
                    fill={active ? pal.fill : c.bgCard}
                    stroke={active ? pal.node : c.border}
                    strokeWidth={active ? 2 : 1.5}
                  />
                  {/* Score ring */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.r - 4}
                    fill="none"
                    stroke={sc}
                    strokeWidth={2.5}
                    strokeDasharray={`${(node.lead.score / 100) * 2 * Math.PI * (node.r - 4)} ${2 * Math.PI * (node.r - 4)}`}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${node.x} ${node.y})`}
                    opacity={0.75}
                  />
                  {/* Score label */}
                  <text
                    x={node.x}
                    y={node.y + 4}
                    textAnchor="middle"
                    fontSize={node.r > 34 ? 13 : 11}
                    fontWeight={800}
                    fill={sc}
                    fontFamily="var(--font-inter), sans-serif"
                  >
                    {node.lead.score}
                  </text>
                  {/* Company name label below */}
                  <text
                    x={node.x}
                    y={node.y + node.r + 14}
                    textAnchor="middle"
                    fontSize={10}
                    fontWeight={700}
                    fill={active ? c.text : c.textSub}
                    fontFamily="var(--font-inter), sans-serif"
                  >
                    {node.lead.name.length > 18 ? node.lead.name.slice(0, 17) + '…' : node.lead.name}
                  </text>
                  {node.lead.city && (
                    <text
                      x={node.x}
                      y={node.y + node.r + 26}
                      textAnchor="middle"
                      fontSize={9}
                      fill={c.textMuted}
                      fontFamily="var(--font-inter), sans-serif"
                    >
                      {node.lead.city}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* ── Detail Panel ─────────────────────────────────────────────────── */}
      {selectedNode && (
        <div
          style={{
            width: 284,
            borderLeft: `1px solid ${c.border}`,
            background: c.bgCard,
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 16px',
              borderBottom: `1px solid ${c.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: PALETTE[selectedNode.colorIdx].fill,
                border: `1.5px solid ${PALETTE[selectedNode.colorIdx].stroke}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: 13,
                fontWeight: 800,
                color: PALETTE[selectedNode.colorIdx].text,
              }}
            >
              {selectedNode.lead.name.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: c.text,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {selectedNode.lead.name}
              </div>
              <div style={{ fontSize: 11, color: c.textSub, marginTop: 1 }}>{selectedNode.lead.city}</div>
            </div>
            <button
              onClick={() => setSelectedId(null)}
              style={{
                width: 26,
                height: 26,
                borderRadius: 7,
                border: `1px solid ${c.border}`,
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg
                width={10}
                height={10}
                viewBox="0 0 16 16"
                fill="none"
                stroke={c.textSub}
                strokeWidth={2.5}
                strokeLinecap="round"
              >
                <path d="M3 3l10 10M13 3L3 13" />
              </svg>
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Score */}
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: c.textSub,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 6,
                }}
              >
                Score
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color:
                      selectedNode.lead.score >= 80 ? '#DC2626' : selectedNode.lead.score >= 65 ? '#D97706' : '#64748B',
                  }}
                >
                  {selectedNode.lead.score}
                </div>
                <div style={{ flex: 1, height: 6, background: c.bgHover, borderRadius: 99 }}>
                  <div
                    style={{
                      width: `${selectedNode.lead.score}%`,
                      height: '100%',
                      borderRadius: 99,
                      background:
                        selectedNode.lead.score >= 80
                          ? '#DC2626'
                          : selectedNode.lead.score >= 65
                            ? '#D97706'
                            : '#94A3B8',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Attributes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Branche', value: selectedNode.lead.industry },
                { label: 'Shop-System', value: selectedNode.lead.system },
                { label: 'Carrier', value: selectedNode.lead.carrier },
                { label: 'Tier', value: selectedNode.lead.tier },
              ]
                .filter((r) => r.value)
                .map(({ label, value }) => (
                  <div key={label}>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: c.textSub,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        marginBottom: 3,
                      }}
                    >
                      {label}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: c.text }}>{value}</div>
                  </div>
                ))}
            </div>

            {/* Similar leads */}
            {(() => {
              const similar = edges
                .filter(
                  (e) =>
                    !e.isBridge && (e.source === selectedNode.id || e.target === selectedNode.id) && e.strength >= 0.3
                )
                .sort((a, b) => b.strength - a.strength)
                .slice(0, 4)
                .map((e) => {
                  const otherId = e.source === selectedNode.id ? e.target : e.source;
                  const other = nodeMap.get(otherId);
                  return other ? { node: other, edge: e } : null;
                })
                .filter(Boolean) as { node: PhysNode; edge: Edge }[];
              if (!similar.length) return null;
              return (
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: c.textSub,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      marginBottom: 8,
                    }}
                  >
                    Ähnliche Leads
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {similar.map(({ node, edge }) => (
                      <div
                        key={node.id}
                        onClick={() => setSelectedId(node.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '7px 9px',
                          borderRadius: 8,
                          border: `1px solid ${c.border}`,
                          cursor: 'pointer',
                          background: c.bgPage,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 18,
                            fontWeight: 800,
                            color: node.lead.score >= 80 ? '#DC2626' : node.lead.score >= 65 ? '#D97706' : '#64748B',
                            minWidth: 28,
                          }}
                        >
                          {node.lead.score}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: c.text,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {node.lead.name}
                          </div>
                          <div style={{ fontSize: 10, color: c.textSub, marginTop: 1 }}>{edge.shared.join(' · ')}</div>
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: c.accent }}>
                          {Math.round(edge.strength * 100)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Contacts / bridges */}
            {selectedNode.lead.contacts.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#7C3AED',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: 8,
                  }}
                >
                  Kontaktbrücken
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {selectedNode.lead.contacts.map((c2, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 8,
                        background: isDark ? 'rgba(124,58,237,0.12)' : '#F5F3FF',
                        border: isDark ? '1px solid rgba(124,58,237,0.25)' : '1px solid #DDD6FE',
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 700, color: isDark ? '#C4B5FD' : '#4C1D95' }}>
                        {c2.name}
                      </div>
                      <div style={{ fontSize: 10, color: '#7C3AED', marginTop: 2 }}>{c2.role}</div>
                      {c2.formerCompanies.length > 0 && (
                        <div style={{ marginTop: 5, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {c2.formerCompanies.map((fc) => (
                            <span
                              key={fc}
                              style={{
                                fontSize: 9,
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: 4,
                                background: isDark ? 'rgba(124,58,237,0.2)' : '#EDE9FE',
                                color: isDark ? '#A78BFA' : '#6D28D9',
                              }}
                            >
                              ex-{fc}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '12px 16px', borderTop: `1px solid ${c.border}` }}>
            <a
              href={`/intelligence/leads/${selectedNode.lead.id}`}
              style={{
                display: 'block',
                textAlign: 'center',
                padding: '8px',
                borderRadius: 8,
                border: 'none',
                background: c.accent,
                color: '#fff',
                fontSize: 12,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Lead öffnen →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
