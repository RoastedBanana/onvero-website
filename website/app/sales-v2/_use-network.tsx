'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ─── SUPABASE SINGLETON ──────────────────────────────────────────────────────

let _supabase: ReturnType<typeof createBrowserClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return _supabase;
}

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type Network = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type NetworkNode = {
  id: string;
  lead_id: string | null;
  x: number;
  y: number;
  expand_category: string | null;
  // joined lead data
  name: string;
  company: string;
  city: string;
  score: number;
};

export type NetworkEdge = {
  id: string;
  source_node_id: string;
  target_node_id: string;
  edge_type: string | null;
};

// ─── TRANSFORM RAW DB NODE ──────────────────────────────────────────────────

type RawNode = {
  id: string;
  lead_id: string | null;
  x: number;
  y: number;
  expand_category: string | null;
  leads: {
    id: string;
    company_name: string | null;
    first_name: string | null;
    last_name: string | null;
    city: string | null;
    score: number | null;
  } | null;
};

function rawToNode(r: RawNode): NetworkNode {
  const lead = r.leads;
  const name = lead
    ? [lead.first_name, lead.last_name].filter(Boolean).join(' ').trim() || lead.company_name || '—'
    : '—';
  return {
    id: r.id,
    lead_id: r.lead_id,
    x: r.x,
    y: r.y,
    expand_category: r.expand_category,
    name,
    company: lead?.company_name ?? '—',
    city: lead?.city ?? '—',
    score: Math.round(lead?.score ?? 0),
  };
}

// ─── useNetworks: list all networks ──────────────────────────────────────────

export function useNetworks() {
  const [networks, setNetworks] = useState<Network[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/networks', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { networks: data } = await res.json();
      setNetworks(data ?? []);
    } catch {
      setNetworks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createNetwork = useCallback(async (name?: string) => {
    const res = await fetch('/api/networks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name || 'Neues Netzwerk' }),
    });
    const { network } = await res.json();
    if (network) setNetworks((prev) => [network, ...prev]);
    return network as Network | null;
  }, []);

  const renameNetwork = useCallback(async (id: string, name: string) => {
    await fetch(`/api/networks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    setNetworks((prev) => prev.map((n) => (n.id === id ? { ...n, name } : n)));
  }, []);

  const deleteNetwork = useCallback(async (id: string) => {
    await fetch(`/api/networks/${id}`, { method: 'DELETE' });
    setNetworks((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return { networks, loading, createNetwork, renameNetwork, deleteNetwork, reload: load };
}

// ─── useNetworkCanvas: nodes + edges for one network ─────────────────────────

export function useNetworkCanvas(networkId: string | null) {
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [edges, setEdges] = useState<NetworkEdge[]>([]);
  const [loading, setLoading] = useState(false);
  const dirtyPositions = useRef<Map<string, { x: number; y: number }>>(new Map());
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load network data
  useEffect(() => {
    if (!networkId) { setNodes([]); setEdges([]); return; }
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const res = await fetch(`/api/networks/${networkId}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { nodes: rawNodes, edges: rawEdges } = await res.json();
        if (!cancelled) {
          setNodes((rawNodes ?? []).map((n: RawNode) => rawToNode(n)));
          setEdges(rawEdges ?? []);
        }
      } catch {
        if (!cancelled) { setNodes([]); setEdges([]); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [networkId]);

  // Realtime subscriptions
  useEffect(() => {
    if (!networkId) return;
    const supabase = getSupabase();
    let channel: RealtimeChannel;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: tu } = await supabase.from('tenant_users').select('tenant_id').eq('user_id', user.id).single();
      if (!tu?.tenant_id) return;

      channel = supabase
        .channel(`network-${networkId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'network_nodes', filter: `network_id=eq.${networkId}` },
          () => {
            // Re-fetch nodes on any change (simpler than partial updates with joins)
            fetch(`/api/networks/${networkId}`, { cache: 'no-store' })
              .then((r) => r.json())
              .then(({ nodes: rawNodes }) => { if (rawNodes) setNodes(rawNodes.map((n: RawNode) => rawToNode(n))); });
          })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'network_edges', filter: `network_id=eq.${networkId}` },
          () => {
            fetch(`/api/networks/${networkId}`, { cache: 'no-store' })
              .then((r) => r.json())
              .then(({ edges: rawEdges }) => { if (rawEdges) setEdges(rawEdges); });
          })
        .subscribe();
    })();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [networkId]);

  // ── Flush dirty positions ────────────────────────────────────────────────

  const flushPositions = useCallback(() => {
    if (!networkId || dirtyPositions.current.size === 0) return;
    const updates = Array.from(dirtyPositions.current.entries()).map(([id, pos]) => ({ id, ...pos }));
    dirtyPositions.current.clear();

    fetch(`/api/networks/${networkId}/nodes`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates }),
    });
  }, [networkId]);

  const scheduleFlush = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(flushPositions, 500);
  }, [flushPositions]);

  // ── Public mutations ─────────────────────────────────────────────────────

  const updateNodePosition = useCallback((nodeId: string, x: number, y: number) => {
    setNodes((prev) => prev.map((n) => (n.id === nodeId ? { ...n, x, y } : n)));
    dirtyPositions.current.set(nodeId, { x, y });
    scheduleFlush();
  }, [scheduleFlush]);

  const addNode = useCallback(async (leadId: string, x: number, y: number, expandCategory?: string) => {
    if (!networkId) return null;
    const res = await fetch(`/api/networks/${networkId}/nodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: leadId, x, y, expand_category: expandCategory }),
    });
    const { node } = await res.json();
    if (node) {
      const mapped = rawToNode(node);
      setNodes((prev) => [...prev, mapped]);
      return mapped;
    }
    return null;
  }, [networkId]);

  const removeNode = useCallback(async (nodeId: string) => {
    if (!networkId) return;
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setEdges((prev) => prev.filter((e) => e.source_node_id !== nodeId && e.target_node_id !== nodeId));
    await fetch(`/api/networks/${networkId}/nodes/${nodeId}`, { method: 'DELETE' });
  }, [networkId]);

  const updateNodeCategory = useCallback(async (nodeId: string, category: string) => {
    if (!networkId) return;
    setNodes((prev) => prev.map((n) => (n.id === nodeId ? { ...n, expand_category: category } : n)));
    await fetch(`/api/networks/${networkId}/nodes/${nodeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expand_category: category }),
    });
  }, [networkId]);

  const addEdge = useCallback(async (sourceNodeId: string, targetNodeId: string, edgeType?: string) => {
    if (!networkId) return null;
    const res = await fetch(`/api/networks/${networkId}/edges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source_node_id: sourceNodeId, target_node_id: targetNodeId, edge_type: edgeType }),
    });
    const { edge } = await res.json();
    if (edge) setEdges((prev) => [...prev, edge]);
    return edge as NetworkEdge | null;
  }, [networkId]);

  const removeEdge = useCallback(async (edgeId: string) => {
    if (!networkId) return;
    setEdges((prev) => prev.filter((e) => e.id !== edgeId));
    await fetch(`/api/networks/${networkId}/edges?edge_id=${edgeId}`, { method: 'DELETE' });
  }, [networkId]);

  return {
    nodes, edges, loading,
    addNode, removeNode, updateNodePosition, updateNodeCategory,
    addEdge, removeEdge, flushPositions,
  };
}
