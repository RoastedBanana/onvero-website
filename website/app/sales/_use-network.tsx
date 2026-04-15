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
  source_node_id: string | null;
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
  source_node_id: string | null;
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
    source_node_id: r.source_node_id,
    name,
    company: lead?.company_name ?? '—',
    city: lead?.city ?? '—',
    score: Math.round(lead?.score ?? 0),
  };
}

// ─── LAYOUT CONSTANTS ────────────────────────────────────────────────────────

const NODE_OFFSET_X = 340;   // horizontal distance from source to new nodes
const NODE_SPACING_Y = 120;  // vertical spacing between new nodes
const GRID_SNAP = 20;

function snap(v: number) { return Math.round(v / GRID_SNAP) * GRID_SNAP; }

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
  // Map of node-id -> arrival index for stagger animation. Cleared after animation window.
  const [newlyArrivedIds, setNewlyArrivedIds] = useState<Map<string, number>>(new Map());
  const dirtyPositions = useRef<Map<string, { x: number; y: number }>>(new Map());
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track expanding node so we know where to position incoming nodes (fallback when
  // source_node_id is not set in the DB row — e.g. legacy n8n insertions).
  const expandingNodeId = useRef<string | null>(null);
  const knownNodeIds = useRef<Set<string>>(new Set());

  // ── Load network data ───────────────────────────────────────────────────

  useEffect(() => {
    if (!networkId) { setNodes([]); setEdges([]); knownNodeIds.current.clear(); return; }
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const res = await fetch(`/api/networks/${networkId}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { nodes: rawNodes, edges: rawEdges } = await res.json();
        if (!cancelled) {
          const mapped = (rawNodes ?? []).map((n: RawNode) => rawToNode(n));
          setNodes(mapped);
          setEdges(rawEdges ?? []);
          knownNodeIds.current = new Set(mapped.map((n: NetworkNode) => n.id));
        }
      } catch {
        if (!cancelled) { setNodes([]); setEdges([]); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [networkId]);

  // ── Auto-position new nodes from n8n ────────────────────────────────────
  //
  // Nodes that arrive from n8n either carry `source_node_id` (preferred — set by
  // the n8n workflow when it inserts the row) or we fall back to the in-memory
  // `expandingNodeId` ref (set when the user clicked expand in this browser).
  //
  // We ALWAYS override the position from n8n with our fan layout — n8n's
  // positions are not trusted (they can be random or (0,0)).
  //
  // We group incoming nodes by their effective source so that parallel expansions
  // from different seed-nodes all land correctly.

  const autoPositionNewNodes = useCallback(async (
    incomingNodes: NetworkNode[],
    existingNodes: NetworkNode[],
    fallbackSourceId: string | null,
    existingEdges: NetworkEdge[],
  ) => {
    if (incomingNodes.length === 0) return;

    // Group by source_node_id (falling back to the ref for nodes without one)
    const groups = new Map<string | null, NetworkNode[]>();
    for (const node of incomingNodes) {
      const effectiveSource = node.source_node_id ?? fallbackSourceId;
      const list = groups.get(effectiveSource) ?? [];
      list.push(node);
      groups.set(effectiveSource, list);
    }

    const positionUpdates: { id: string; x: number; y: number }[] = [];
    const newEdges: { sourceId: string; targetId: string }[] = [];

    for (const [sourceId, group] of groups) {
      // No source → can't reposition intelligently, leave as-is
      if (!sourceId) continue;

      const source = existingNodes.find((n) => n.id === sourceId);
      if (!source) continue;

      // Count existing children of this source (nodes already positioned with this source)
      // so that new nodes get placed AFTER them, not overlapping.
      const existingChildrenCount = existingEdges.filter(
        (e) => e.source_node_id === sourceId &&
               !group.some((g) => g.id === e.target_node_id),
      ).length;

      const baseX = source.x + NODE_OFFSET_X;
      const baseY = source.y;

      // Total slots = existing children + new group. Center the whole column on source.y.
      const totalSlots = existingChildrenCount + group.length;
      const totalHeight = (totalSlots - 1) * NODE_SPACING_Y;
      const startY = baseY - totalHeight / 2;

      group.forEach((node, i) => {
        const slotIndex = existingChildrenCount + i;
        const x = snap(baseX);
        const y = snap(startY + slotIndex * NODE_SPACING_Y);
        positionUpdates.push({ id: node.id, x, y });
        // Only create edge if one doesn't already exist
        const edgeExists = existingEdges.some(
          (e) => e.source_node_id === sourceId && e.target_node_id === node.id,
        );
        if (!edgeExists) newEdges.push({ sourceId, targetId: node.id });
      });
    }

    // Update positions in local state immediately
    if (positionUpdates.length > 0) {
      setNodes((prev) => prev.map((n) => {
        const update = positionUpdates.find((u) => u.id === n.id);
        return update ? { ...n, x: update.x, y: update.y } : n;
      }));

      // Persist positions to DB
      if (networkId) {
        fetch(`/api/networks/${networkId}/nodes`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates: positionUpdates }),
        });
      }
    }

    // Create edges — skip if one already exists for this (source, target) pair
    if (networkId && newEdges.length > 0) {
      for (const { sourceId, targetId } of newEdges) {
        const res = await fetch(`/api/networks/${networkId}/edges`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source_node_id: sourceId, target_node_id: targetId, edge_type: 'expand' }),
        });
        const { edge } = await res.json();
        if (edge) setEdges((prev) => [...prev, edge]);
      }
    }
  }, [networkId]);

  // ── Realtime subscriptions ──────────────────────────────────────────────

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
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'network_nodes',
          filter: `network_id=eq.${networkId}`,
        }, () => {
          // Fetch all nodes + edges, detect new nodes, auto-position them
          fetch(`/api/networks/${networkId}`, { cache: 'no-store' })
            .then((r) => r.json())
            .then(({ nodes: rawNodes, edges: rawEdges }) => {
              if (!rawNodes) return;
              const allMapped: NetworkNode[] = rawNodes.map((n: RawNode) => rawToNode(n));
              const allEdges: NetworkEdge[] = rawEdges ?? [];
              const newNodes = allMapped.filter((n) => !knownNodeIds.current.has(n.id));

              // Update known IDs
              allMapped.forEach((n: NetworkNode) => knownNodeIds.current.add(n.id));

              // Set all nodes
              setNodes(allMapped);
              setEdges(allEdges);

              if (newNodes.length === 0) return;

              // Mark new nodes for stagger animation
              setNewlyArrivedIds((prev) => {
                const next = new Map(prev);
                newNodes.forEach((n, i) => next.set(n.id, i));
                return next;
              });
              // Clear stagger marks after the animation window (500ms anim + 80ms * count stagger + buffer)
              const clearAfter = 800 + newNodes.length * 80;
              const idsToClear = newNodes.map((n) => n.id);
              setTimeout(() => {
                setNewlyArrivedIds((prev) => {
                  const next = new Map(prev);
                  idsToClear.forEach((id) => next.delete(id));
                  return next;
                });
              }, clearAfter);

              // Auto-position: nodes with source_node_id will be grouped; nodes without
              // one still use the fallback ref (backwards-compat for legacy n8n workflows).
              autoPositionNewNodes(newNodes, allMapped, expandingNodeId.current, allEdges);
            });
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'network_nodes',
          filter: `network_id=eq.${networkId}`,
        }, () => {
          fetch(`/api/networks/${networkId}`, { cache: 'no-store' })
            .then((r) => r.json())
            .then(({ nodes: rawNodes }) => {
              if (rawNodes) setNodes(rawNodes.map((n: RawNode) => rawToNode(n)));
            });
        })
        .on('postgres_changes', {
          event: 'DELETE',
          schema: 'public',
          table: 'network_nodes',
          filter: `network_id=eq.${networkId}`,
        }, () => {
          fetch(`/api/networks/${networkId}`, { cache: 'no-store' })
            .then((r) => r.json())
            .then(({ nodes: rawNodes }) => {
              if (rawNodes) {
                const mapped = rawNodes.map((n: RawNode) => rawToNode(n));
                setNodes(mapped);
                knownNodeIds.current = new Set(mapped.map((n: NetworkNode) => n.id));
              }
            });
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'network_edges',
          filter: `network_id=eq.${networkId}`,
        }, () => {
          fetch(`/api/networks/${networkId}`, { cache: 'no-store' })
            .then((r) => r.json())
            .then(({ edges: rawEdges }) => { if (rawEdges) setEdges(rawEdges); });
        })
        .subscribe();
    })();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [networkId, autoPositionNewNodes]);

  // ── Flush dirty positions ───────────────────────────────────────────────

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

  // ── Public mutations ────────────────────────────────────────────────────

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
      knownNodeIds.current.add(mapped.id);
      return mapped;
    }
    return null;
  }, [networkId]);

  const removeNode = useCallback(async (nodeId: string) => {
    if (!networkId) return;
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setEdges((prev) => prev.filter((e) => e.source_node_id !== nodeId && e.target_node_id !== nodeId));
    knownNodeIds.current.delete(nodeId);
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

  /** Call this before triggering the webhook so we know which node is the source */
  const setExpandingNode = useCallback((nodeId: string | null) => {
    expandingNodeId.current = nodeId;
  }, []);

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
    nodes, edges, loading, newlyArrivedIds,
    addNode, removeNode, updateNodePosition, updateNodeCategory,
    addEdge, removeEdge, flushPositions, setExpandingNode,
  };
}
