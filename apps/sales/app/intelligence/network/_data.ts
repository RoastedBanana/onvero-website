// ─── Types ────────────────────────────────────────────────────────────────────

export type NodeType = 'company' | 'person' | 'deal' | 'signal';

export type EdgeType = 'works_at' | 'knows' | 'competitor' | 'partner' | 'owns_deal' | 'has_signal' | 'expand';

export interface NetworkMeta {
  id: string;
  name: string;
  nodeCount: number;
  updatedAt: string;
}

export interface CompanyData {
  name: string;
  industry: string;
  city: string;
  score: number;
  employees: string;
  signals: number;
}

export interface PersonData {
  name: string;
  role: string;
  companyName: string;
  email: string;
}

export interface DealData {
  title: string;
  value: string;
  stage: 'prospecting' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  probability: number;
  closeDate: string;
}

export type SignalKind = 'funding' | 'negative_review' | 'job_posting' | 'tech_change' | 'expansion';

export interface SignalData {
  kind: SignalKind;
  description: string;
  date: string;
  strength: 'high' | 'medium' | 'low';
}

export interface GraphNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  company?: CompanyData;
  person?: PersonData;
  deal?: DealData;
  signal?: SignalData;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  label?: string;
}

export interface NetworkGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_NETWORKS: NetworkMeta[] = [
  { id: 'net-1', name: 'Fashion & Retail', nodeCount: 8, updatedAt: '07.05.2026' },
  { id: 'net-2', name: 'Tech Startup Cluster', nodeCount: 6, updatedAt: '06.05.2026' },
  { id: 'net-3', name: 'München Netzwerk', nodeCount: 4, updatedAt: '04.05.2026' },
];

const MOCK_GRAPHS: Record<string, NetworkGraph> = {
  'net-1': {
    nodes: [
      {
        id: 'n1',
        type: 'company',
        x: 320,
        y: 260,
        company: {
          name: 'Fashion House GmbH',
          industry: 'Mode & Bekleidung',
          city: 'München',
          score: 91,
          employees: '50–200',
          signals: 3,
        },
      },
      {
        id: 'n2',
        type: 'person',
        x: 640,
        y: 140,
        person: {
          name: 'Sarah Müller',
          role: 'Head of Logistics',
          companyName: 'Fashion House GmbH',
          email: 's.mueller@fashionhouse.de',
        },
      },
      {
        id: 'n3',
        type: 'deal',
        x: 640,
        y: 360,
        deal: {
          title: 'Fashion House — Onboarding',
          value: '48.000 €',
          stage: 'proposal',
          probability: 65,
          closeDate: '15.06.2026',
        },
      },
      {
        id: 'n4',
        type: 'company',
        x: 80,
        y: 100,
        company: {
          name: 'SportGear Online',
          industry: 'Sport & Outdoor',
          city: 'Hamburg',
          score: 85,
          employees: '20–50',
          signals: 2,
        },
      },
      {
        id: 'n5',
        type: 'person',
        x: 960,
        y: 140,
        person: { name: 'Markus Weber', role: 'CEO', companyName: 'SportGear Online', email: 'm.weber@sportgear.de' },
      },
      {
        id: 'n6',
        type: 'signal',
        x: 80,
        y: 380,
        signal: {
          kind: 'negative_review',
          description: '3 negative DHL-Bewertungen in 30 Tagen',
          date: '05.05.2026',
          strength: 'high',
        },
      },
      {
        id: 'n7',
        type: 'signal',
        x: 320,
        y: 480,
        signal: { kind: 'funding', description: 'Series A — 4,2 Mio. EUR', date: '28.04.2026', strength: 'high' },
      },
      {
        id: 'n8',
        type: 'company',
        x: 960,
        y: 360,
        company: {
          name: 'HomeStyle24',
          industry: 'Wohnen & Deko',
          city: 'Köln',
          score: 72,
          employees: '10–20',
          signals: 0,
        },
      },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2', type: 'works_at', label: 'Ansprechpartner' },
      { id: 'e2', source: 'n1', target: 'n3', type: 'owns_deal', label: 'Deal' },
      { id: 'e3', source: 'n4', target: 'n6', type: 'has_signal', label: 'Signal' },
      { id: 'e4', source: 'n1', target: 'n7', type: 'has_signal', label: 'Signal' },
      { id: 'e5', source: 'n2', target: 'n5', type: 'knows', label: 'kennt' },
      { id: 'e6', source: 'n5', target: 'n4', type: 'works_at', label: 'CEO' },
      { id: 'e7', source: 'n4', target: 'n8', type: 'competitor', label: 'Konkurrent' },
    ],
  },

  'net-2': {
    nodes: [
      {
        id: 'm1',
        type: 'company',
        x: 280,
        y: 260,
        company: {
          name: 'TechDirect GmbH',
          industry: 'Elektronik',
          city: 'Berlin',
          score: 79,
          employees: '10–20',
          signals: 1,
        },
      },
      {
        id: 'm2',
        type: 'person',
        x: 580,
        y: 160,
        person: {
          name: 'Julia Schneider',
          role: 'CTO',
          companyName: 'TechDirect GmbH',
          email: 'j.schneider@techdirect.de',
        },
      },
      {
        id: 'm3',
        type: 'deal',
        x: 580,
        y: 360,
        deal: {
          title: 'TechDirect — Pilot',
          value: '12.000 €',
          stage: 'qualified',
          probability: 40,
          closeDate: '01.07.2026',
        },
      },
      {
        id: 'm4',
        type: 'signal',
        x: 60,
        y: 240,
        signal: {
          kind: 'job_posting',
          description: 'Sucht Logistics Manager — Wachstumssignal',
          date: '02.05.2026',
          strength: 'medium',
        },
      },
      {
        id: 'm5',
        type: 'company',
        x: 860,
        y: 260,
        company: {
          name: 'CloudShip AG',
          industry: 'Logistik-Tech',
          city: 'Berlin',
          score: 64,
          employees: '5–10',
          signals: 0,
        },
      },
      {
        id: 'm6',
        type: 'person',
        x: 860,
        y: 460,
        person: { name: 'Tom Richter', role: 'Founder', companyName: 'CloudShip AG', email: 't.richter@cloudship.io' },
      },
    ],
    edges: [
      { id: 'f1', source: 'm1', target: 'm2', type: 'works_at', label: 'CTO' },
      { id: 'f2', source: 'm1', target: 'm3', type: 'owns_deal', label: 'Deal' },
      { id: 'f3', source: 'm1', target: 'm4', type: 'has_signal', label: 'Signal' },
      { id: 'f4', source: 'm1', target: 'm5', type: 'competitor', label: 'Wettbewerb' },
      { id: 'f5', source: 'm5', target: 'm6', type: 'works_at', label: 'Founder' },
      { id: 'f6', source: 'm2', target: 'm6', type: 'knows', label: 'kennt' },
    ],
  },

  'net-3': {
    nodes: [
      {
        id: 'p1',
        type: 'company',
        x: 300,
        y: 240,
        company: {
          name: 'Bavarian Goods GmbH',
          industry: 'Lebensmittel',
          city: 'München',
          score: 68,
          employees: '20–50',
          signals: 1,
        },
      },
      {
        id: 'p2',
        type: 'person',
        x: 580,
        y: 140,
        person: {
          name: 'Andreas Bauer',
          role: 'Geschäftsführer',
          companyName: 'Bavarian Goods GmbH',
          email: 'a.bauer@bavarian-goods.de',
        },
      },
      {
        id: 'p3',
        type: 'signal',
        x: 60,
        y: 220,
        signal: {
          kind: 'expansion',
          description: 'Neue Niederlassung in Augsburg geplant',
          date: '20.04.2026',
          strength: 'medium',
        },
      },
      {
        id: 'p4',
        type: 'deal',
        x: 580,
        y: 340,
        deal: {
          title: 'Bavarian Goods — Erstgespräch',
          value: '8.400 €',
          stage: 'prospecting',
          probability: 20,
          closeDate: '01.08.2026',
        },
      },
    ],
    edges: [
      { id: 'g1', source: 'p1', target: 'p2', type: 'works_at', label: 'GF' },
      { id: 'g2', source: 'p1', target: 'p3', type: 'has_signal', label: 'Signal' },
      { id: 'g3', source: 'p1', target: 'p4', type: 'owns_deal', label: 'Deal' },
    ],
  },
};

// ─── Service Functions ─────────────────────────────────────────────────────────
// Replace each function body with a real fetch() call to connect your backend.

let _nextNetId = 4;
let _nextNodeId = 200;
let _nextEdgeId = 200;

export async function getNetworks(): Promise<NetworkMeta[]> {
  return [...MOCK_NETWORKS];
}

export async function createNetwork(name: string): Promise<NetworkMeta> {
  const n: NetworkMeta = {
    id: `net-${_nextNetId++}`,
    name,
    nodeCount: 0,
    updatedAt: new Date().toLocaleDateString('de-DE'),
  };
  MOCK_NETWORKS.unshift(n);
  MOCK_GRAPHS[n.id] = { nodes: [], edges: [] };
  return n;
}

export async function renameNetwork(id: string, name: string): Promise<void> {
  const n = MOCK_NETWORKS.find((x) => x.id === id);
  if (n) n.name = name;
}

export async function deleteNetwork(id: string): Promise<void> {
  const i = MOCK_NETWORKS.findIndex((x) => x.id === id);
  if (i >= 0) MOCK_NETWORKS.splice(i, 1);
  delete MOCK_GRAPHS[id];
}

export async function getNetworkGraph(networkId: string): Promise<NetworkGraph> {
  const g = MOCK_GRAPHS[networkId];
  if (!g) return { nodes: [], edges: [] };
  return { nodes: [...g.nodes], edges: [...g.edges] };
}

export async function moveNode(networkId: string, nodeId: string, x: number, y: number): Promise<void> {
  const node = MOCK_GRAPHS[networkId]?.nodes.find((n) => n.id === nodeId);
  if (node) {
    node.x = x;
    node.y = y;
  }
}

export async function removeNode(networkId: string, nodeId: string): Promise<void> {
  const g = MOCK_GRAPHS[networkId];
  if (!g) return;
  g.nodes = g.nodes.filter((n) => n.id !== nodeId);
  g.edges = g.edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
  const meta = MOCK_NETWORKS.find((n) => n.id === networkId);
  if (meta) meta.nodeCount = g.nodes.length;
}

export async function addNode(networkId: string, node: Omit<GraphNode, 'id'>): Promise<GraphNode> {
  const g = MOCK_GRAPHS[networkId];
  const newNode: GraphNode = { ...node, id: `node-${_nextNodeId++}` };
  g.nodes.push(newNode);
  const meta = MOCK_NETWORKS.find((n) => n.id === networkId);
  if (meta) meta.nodeCount = g.nodes.length;
  return newNode;
}

export async function addEdge(
  networkId: string,
  source: string,
  target: string,
  type: EdgeType,
  label?: string
): Promise<GraphEdge> {
  const g = MOCK_GRAPHS[networkId];
  const edge: GraphEdge = { id: `edge-${_nextEdgeId++}`, source, target, type, label };
  g.edges.push(edge);
  return edge;
}

export async function removeEdge(networkId: string, edgeId: string): Promise<void> {
  const g = MOCK_GRAPHS[networkId];
  if (g) g.edges = g.edges.filter((e) => e.id !== edgeId);
}

export async function findPath(networkId: string, sourceId: string, targetId: string): Promise<string[]> {
  const g = MOCK_GRAPHS[networkId];
  if (!g) return [];

  const adj = new Map<string, string[]>();
  for (const e of g.edges) {
    if (!adj.has(e.source)) adj.set(e.source, []);
    if (!adj.has(e.target)) adj.set(e.target, []);
    adj.get(e.source)!.push(e.target);
    adj.get(e.target)!.push(e.source);
  }

  const visited = new Set<string>([sourceId]);
  const queue: string[][] = [[sourceId]];
  while (queue.length > 0) {
    const path = queue.shift()!;
    const cur = path[path.length - 1];
    if (cur === targetId) return path;
    for (const neighbor of adj.get(cur) ?? []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([...path, neighbor]);
      }
    }
  }
  return [];
}
