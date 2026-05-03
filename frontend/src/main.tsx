import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  Activity,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  Database,
  FileSearch,
  GitBranch,
  Layers3,
  Network,
  RefreshCcw,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  XCircle
} from 'lucide-react';
import './styles.css';

const API_BASE = 'http://127.0.0.1:8000';

type Job = {
  id: string;
  title: string;
  category: string;
  level: string;
  definition: string;
  core_responsibilities: string[];
  required_skills: string[];
  bonus_skills: string[];
  industry_scenarios: string[];
  evidence_sources: string[];
};

type Dashboard = {
  job_count: number;
  jd_count: number;
  resume_count: number;
  graph_metrics: { node_count: number; edge_count: number; density: number };
  jobs: Job[];
};

type GraphNode = { id: string; label: string; type: string; category?: string };
type GraphEdge = { source: string; target: string; relation: string; weight?: number };
type GraphData = { nodes: GraphNode[]; edges: GraphEdge[] };

type Resume = {
  id: string;
  name: string;
  target_job_id: string;
  text: string;
};

type Discovery = {
  job_id: string;
  title: string;
  definition: string;
  confidence: number;
  signal_count: number;
  required_skills: string[];
  bonus_skills: string[];
  industry_scenarios: string[];
  evidence_sources: string[];
};

type UpdateResult = {
  job_id: string;
  title: string;
  baseline_batch: string | null;
  current_batch: string | null;
  added: string[];
  removed: string[];
  strengthened: string[];
  summary: string;
  sources: string[];
};

type ParsedResume = {
  skills: Array<{ name: string; category: string; confidence: number; evidence: string[] }>;
  projects: string[];
  years: number | null;
  raw_text_length: number;
};

type MatchResult = {
  job_id: string;
  job_title: string;
  score: number;
  covered_required: string[];
  missing_required: string[];
  covered_bonus: string[];
  resume_skills: string[];
  diagnosis: string;
  learning_path: Array<{ skill: string; steps: string[] }>;
  parsed_resume: ParsedResume;
};

type ExtractionDetail = {
  case_id: string;
  type: string;
  precision: number;
  recall: number;
  f1: number;
  tp: number;
  fp: number;
  fn: number;
  expected: string[];
  predicted: string[];
  missing: string[];
  extra: string[];
};

type MatchDetail = {
  case_id: string;
  job_id: string;
  score: number;
  expected_min_score: number;
  passed: boolean;
  covered_required: string[];
  missing_required: string[];
  diagnosis: string;
};

type DiscoveryDetail = {
  job_id: string;
  title: string;
  confidence: number;
  signal_count: number;
  skills_count: number;
};

type EvaluationData = {
  summary: {
    skill_extraction_f1: number;
    skill_extraction_precision: number;
    skill_extraction_recall: number;
    matching_accuracy: number;
    matching_passed: string;
    discovery_count: number;
    high_confidence_discoveries: number;
  };
  skill_extraction: {
    metric: string;
    total_cases: number;
    macro_avg: { precision: number; recall: number; f1: number };
    micro_avg: { precision: number; recall: number; f1: number };
    details: ExtractionDetail[];
  };
  matching: {
    metric: string;
    total_cases: number;
    passed: number;
    failed: number;
    accuracy: number;
    details: MatchDetail[];
  };
  discovery: {
    metric: string;
    total_discoveries: number;
    high_confidence_count: number;
    discoveries: DiscoveryDetail[];
  };
};

type ClusterJob = {
  id: string;
  title: string;
  category: string;
  coords: { x: number; y: number };
};

type Cluster = {
  id: number;
  jobs: ClusterJob[];
  center: { x: number; y: number };
  top_skills: Array<{ name: string; count: number }>;
};

type ClusteringData = {
  n_clusters: number;
  n_jobs: number;
  clusters: Cluster[];
  similarity_edges: Array<{ source: string; target: string; similarity: number }>;
};

type ModuleKey = 'overview' | 'graph' | 'evolution' | 'matching' | 'evaluation';

const modules: Array<{ key: ModuleKey; label: string; icon: React.ReactNode }> = [
  { key: 'overview', label: '态势总览', icon: <BarChart3 size={18} /> },
  { key: 'graph', label: '图谱探索', icon: <Network size={18} /> },
  { key: 'evolution', label: '动态演化', icon: <TrendingUp size={18} /> },
  { key: 'matching', label: '人岗诊断', icon: <Target size={18} /> },
  { key: 'evaluation', label: '系统评测', icon: <ClipboardCheck size={18} /> }
];

function Pill({ children, tone = 'blue' }: { children: React.ReactNode; tone?: 'blue' | 'green' | 'orange' | 'gray' | 'red' | 'purple' }) {
  return <span className={`pill ${tone}`}>{children}</span>;
}

function Card({ title, subtitle, icon, children, accent = false }: { title: string; subtitle?: string; icon: React.ReactNode; children: React.ReactNode; accent?: boolean }) {
  return (
    <section className={`card ${accent ? 'accent-card' : ''}`}>
      <div className="card-title">
        <div className="icon-wrap">{icon}</div>
        <div>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function Progress({ value, label, tone = 'blue' }: { value: number; label: string; tone?: 'blue' | 'green' | 'orange' | 'red' }) {
  return (
    <div className="progress-block">
      <div className="progress-head">
        <span>{label}</span>
        <b>{value}%</b>
      </div>
      <div className="progress-track">
        <div className={`progress-fill ${tone}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="empty">{text}</div>;
}

type ForceNode = GraphNode & { x: number; y: number; vx: number; vy: number };

function useForceSimulation(graph: GraphData | null, graphFilter: string) {
  const nodesRef = React.useRef<ForceNode[]>([]);
  const edgesRef = React.useRef<GraphEdge[]>([]);
  const iterRef = React.useRef(0);
  const rafRef = React.useRef(0);
  const [version, setVersion] = React.useState(0);

  const filteredNodes = React.useMemo(() => {
    if (!graph) return [];
    return graphFilter === 'all' ? graph.nodes : graph.nodes.filter((n) => n.type === graphFilter);
  }, [graph?.nodes, graphFilter]);

  const { nodes, edges } = React.useMemo(() => {
    if (!graph) return { nodes: [] as GraphNode[], edges: [] as GraphEdge[] };
    const ids = new Set(filteredNodes.map((n) => n.id));
    graph.edges.forEach((e) => {
      if (ids.has(e.source) || ids.has(e.target)) {
        ids.add(e.source);
        ids.add(e.target);
      }
    });
    return {
      nodes: graph.nodes.filter((n) => ids.has(n.id)),
      edges: graph.edges.filter((e) => ids.has(e.source) && ids.has(e.target)),
    };
  }, [filteredNodes, graph]);

  const graphRef = React.useRef({ nodes, edges });
  graphRef.current = { nodes, edges };

  React.useEffect(() => {
    const W = 1200, H = 750, CX = W / 2, CY = H / 2;
    const { nodes: gNodes, edges: gEdges } = graphRef.current;
    const nodeMap = new Map(nodesRef.current.map((n) => [n.id, n]));
    const oldIds = new Set(nodeMap.keys());
    const changed = gNodes.length !== oldIds.size || gNodes.some((n) => !oldIds.has(n.id));

    if (changed) {
      const kept = gNodes.filter((n) => nodeMap.has(n.id));
      const added = gNodes.filter((n) => !nodeMap.has(n.id));
      const angleStep = (2 * Math.PI) / Math.max(added.length, 1);
      const newNodes: ForceNode[] = [
        ...kept.map((n) => nodeMap.get(n.id)!),
        ...added.map((n, i) => ({
          ...n,
          x: CX + Math.cos(i * angleStep) * 280 + (Math.random() - 0.5) * 100,
          y: CY + Math.sin(i * angleStep) * 280 + (Math.random() - 0.5) * 100,
          vx: 0,
          vy: 0,
        })),
      ];
      nodesRef.current = newNodes;
      edgesRef.current = gEdges;
      iterRef.current = 0;
    }

    if (nodesRef.current.length === 0) return;
    let active = true;

    function step() {
      if (!active || iterRef.current >= 250) return;
      const ns = nodesRef.current;
      const es = edgesRef.current;
      const N = ns.length;
      const repulsion = 45000;
      const damping = 0.82;
      const maxV = 40;
      const minDist = 90;

      for (let i = 0; i < N; i++) {
        let fx = 0, fy = 0;
        for (let j = 0; j < N; j++) {
          if (i === j) continue;
          const dx = ns[i].x - ns[j].x;
          const dy = ns[i].y - ns[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const f = repulsion / (dist * dist);
          fx += (dx / dist) * f;
          fy += (dy / dist) * f;
          if (dist < minDist) {
            const push = (minDist - dist) * 0.5;
            fx += (dx / dist) * push;
            fy += (dy / dist) * push;
          }
        }
        ns[i].vx = (ns[i].vx + fx) * damping;
        ns[i].vy = (ns[i].vy + fy) * damping;
      }

      const nodeIndex = new Map(ns.map((n, i) => [n.id, i]));
      for (const edge of es) {
        const si = nodeIndex.get(edge.source);
        const ti = nodeIndex.get(edge.target);
        if (si === undefined || ti === undefined) continue;
        const dx = ns[ti].x - ns[si].x;
        const dy = ns[ti].y - ns[si].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const targetDist = 220;
        const force = (dist - targetDist) * 0.006;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        ns[si].vx += fx;
        ns[si].vy += fy;
        ns[ti].vx -= fx;
        ns[ti].vy -= fy;
      }

      for (const node of ns) {
        node.vx += (CX - node.x) * 0.001;
        node.vy += (CY - node.y) * 0.001;
        node.vx = Math.max(-maxV, Math.min(maxV, node.vx));
        node.vy = Math.max(-maxV, Math.min(maxV, node.vy));
        node.x += node.vx;
        node.y += node.vy;
        node.x = Math.max(60, Math.min(W - 60, node.x));
        node.y = Math.max(60, Math.min(H - 60, node.y));
      }

      iterRef.current++;
      setVersion((v) => v + 1);
      rafRef.current = requestAnimationFrame(step);
    }

    rafRef.current = requestAnimationFrame(step);
    return () => {
      active = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [nodes, edges]);

  const positions = React.useMemo(() => {
    const pos: Record<string, { x: number; y: number }> = {};
    for (const n of nodesRef.current) {
      pos[n.id] = { x: n.x, y: n.y };
    }
    return pos;
  }, [version]);

  return { nodes, edges, positions, nodesRef };
}

function GraphCanvas({
  nodes,
  edges,
  positions,
  selectedNodeId,
  onSelectNode,
  nodesRef,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  positions: Record<string, { x: number; y: number }>;
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  nodesRef: React.RefObject<ForceNode[]>;
}) {
  const W = 1200, H = 750;
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [viewBox, setViewBox] = React.useState({ x: 0, y: 0, w: W, h: H });
  const [search, setSearch] = React.useState('');
  const [dragging, setDragging] = React.useState<{ nodeId: string; offsetX: number; offsetY: number } | null>(null);
  const [isPanning, setIsPanning] = React.useState(false);
  const panStartRef = React.useRef({ x: 0, y: 0, vx: 0, vy: 0 });

  const filteredEdges = edges.filter((e) => {
    const s = positions[e.source], t = positions[e.target];
    return s && t;
  });

  const searchLower = search.toLowerCase();
  const searchMatchIds = React.useMemo(() => {
    if (!searchLower) return new Set<string>();
    return new Set(nodes.filter((n) => n.label.toLowerCase().includes(searchLower)).map((n) => n.id));
  }, [nodes, searchLower]);

  const relatedEdgeIds = React.useMemo(() => {
    if (!selectedNodeId) return new Set<string>();
    return new Set(edges.filter((e) => e.source === selectedNodeId || e.target === selectedNodeId).map((e) => `${e.source}-${e.target}`));
  }, [edges, selectedNodeId]);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 1.12 : 0.89;
      setViewBox((vb) => {
        const newW = Math.max(200, Math.min(W * 3, vb.w * factor));
        const newH = Math.max(130, Math.min(H * 3, vb.h * factor));
        const rect = el.getBoundingClientRect();
        const mx = ((e.clientX - rect.left) / rect.width) * vb.w + vb.x;
        const my = ((e.clientY - rect.top) / rect.height) * vb.h + vb.y;
        return { x: mx - (mx - vb.x) * (newW / vb.w), y: my - (my - vb.y) * (newH / vb.h), w: newW, h: newH };
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (dragging) return;
    setIsPanning(true);
    panStartRef.current = { x: e.clientX, y: e.clientY, vx: viewBox.x, vy: viewBox.y };
  };

  React.useEffect(() => {
    if (!isPanning) return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const scaleX = viewBox.w / rect.width;
    const scaleY = viewBox.h / rect.height;
    const onMove = (e: MouseEvent) => {
      setViewBox((vb) => ({
        ...vb,
        x: panStartRef.current.vx - (e.clientX - panStartRef.current.x) * scaleX,
        y: panStartRef.current.vy - (e.clientY - panStartRef.current.y) * scaleY,
      }));
    };
    const onUp = () => setIsPanning(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [isPanning, viewBox.w, viewBox.h]);

  const toSvg = (clientX: number, clientY: number) => {
    const el = containerRef.current!;
    const rect = el.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * viewBox.w + viewBox.x,
      y: ((clientY - rect.top) / rect.height) * viewBox.h + viewBox.y,
    };
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    onSelectNode(nodeId);
    const svg = toSvg(e.clientX, e.clientY);
    const pos = positions[nodeId];
    if (!pos) return;
    setDragging({ nodeId, offsetX: svg.x - pos.x, offsetY: svg.y - pos.y });
  };

  React.useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const svg = toSvg(e.clientX, e.clientY);
      const node = nodesRef.current?.find((n: ForceNode) => n.id === dragging.nodeId);
      if (node) {
        node.x = svg.x - dragging.offsetX;
        node.y = svg.y - dragging.offsetY;
        node.vx = 0;
        node.vy = 0;
      }
    };
    const onUp = () => setDragging(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragging]);

  const centerOn = (x: number, y: number) => {
    setViewBox({ x: x - W / 2, y: y - H / 2, w: W, h: H });
  };

  const handleSearchSelect = (nodeId: string) => {
    onSelectNode(nodeId);
    const pos = positions[nodeId];
    if (pos) centerOn(pos.x, pos.y);
  };

  return (
    <div>
      <div className="graph-toolbar">
        <input
          className="graph-search"
          type="text"
          placeholder="搜索节点..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {searchLower && searchMatchIds.size > 0 && (
          <div className="graph-search-results">
            {nodes.filter((n) => searchMatchIds.has(n.id)).slice(0, 8).map((n) => (
              <button key={n.id} className="graph-search-item" onClick={() => handleSearchSelect(n.id)}>
                <Pill tone={n.type === 'job' ? 'gray' : n.type === 'skill' ? 'green' : n.type === 'skill_category' ? 'blue' : 'orange'}>{n.type}</Pill>
                {n.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div
        ref={containerRef}
        className="graph-canvas"
        onMouseDown={handleCanvasMouseDown}
        style={{ cursor: isPanning ? 'grabbing' : dragging ? 'grabbing' : 'default' }}
      >
        <svg
          className="knowledge-graph"
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
          role="img"
          aria-label="岗位能力知识图谱"
        >
          <defs>
            <marker id="arrow" markerHeight="10" markerWidth="10" orient="auto" refX="9" refY="3">
              <path d="M0,0 L0,6 L9,3 z" />
            </marker>
          </defs>
          {filteredEdges.map((edge) => {
            const s = positions[edge.source]!;
            const t = positions[edge.target]!;
            const isRelated = relatedEdgeIds.has(`${edge.source}-${edge.target}`);
            return (
              <g key={`${edge.source}-${edge.target}`} className={`graph-edge ${edge.relation} ${isRelated ? 'active' : ''}`}>
                <line x1={s.x} y1={s.y} x2={t.x} y2={t.y} markerEnd="url(#arrow)" />
                <text x={(s.x + t.x) / 2} y={(s.y + t.y) / 2 - 6}>{edge.relation}</text>
              </g>
            );
          })}
          {nodes.map((node) => {
            const pos = positions[node.id];
            if (!pos) return null;
            const isSelected = selectedNodeId === node.id;
            const isRelated = relatedEdgeIds.size > 0 && edges.some((e) => (e.source === selectedNodeId && e.target === node.id) || (e.target === selectedNodeId && e.source === node.id));
            const isSearchMatch = searchMatchIds.has(node.id);
            return (
              <g
                key={node.id}
                className={`kg-node ${node.type} ${isSelected ? 'selected' : ''} ${isRelated ? 'related' : ''}`}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                style={{ cursor: 'grab' }}
              >
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={node.type === 'job' ? 34 : 26}
                  stroke={isSearchMatch ? '#ef4444' : undefined}
                  strokeWidth={isSearchMatch ? 4 : undefined}
                />
                <text x={pos.x} y={pos.y + 5}>{node.label.length > 12 ? `${node.label.slice(0, 11)}...` : node.label}</text>
                <title>{node.label}</title>
              </g>
            );
          })}
        </svg>
        <div className="graph-legend">
          <span><i className="legend-job" />岗位</span>
          <span><i className="legend-skill" />技能点</span>
          <span><i className="legend-category" />技能类别</span>
          <span><i className="legend-scenario" />行业场景</span>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [dashboard, setDashboard] = React.useState<Dashboard | null>(null);
  const [graph, setGraph] = React.useState<GraphData | null>(null);
  const [discoveries, setDiscoveries] = React.useState<Discovery[]>([]);
  const [updates, setUpdates] = React.useState<Record<string, UpdateResult>>({});
  const [resumes, setResumes] = React.useState<Resume[]>([]);
  const [selectedJob, setSelectedJob] = React.useState('ai_agent_engineer');
  const [resumeText, setResumeText] = React.useState('');
  const [matchResult, setMatchResult] = React.useState<MatchResult | null>(null);
  const [parsedResume, setParsedResume] = React.useState<ParsedResume | null>(null);
  const [evaluation, setEvaluation] = React.useState<EvaluationData | null>(null);
  const [clustering, setClustering] = React.useState<ClusteringData | null>(null);
  const [graphView, setGraphView] = React.useState<'topology' | 'cluster'>('topology');
  const [activeModule, setActiveModule] = React.useState<ModuleKey>('overview');
  const [graphFilter, setGraphFilter] = React.useState('all');
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [pathSource, setPathSource] = React.useState('');
  const [pathTarget, setPathTarget] = React.useState('');
  const [pathResult, setPathResult] = React.useState<{ path: Array<{ id: string; label: string; type: string }>; edges: Array<{ source: string; target: string; relation: string }>; length?: number; error?: string } | null>(null);
  const [uploadedFileName, setUploadedFileName] = React.useState('');

  async function handleFileUpload(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API_BASE}/api/upload/resume`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setUploadedFileName(file.name);
        setResumeText(data.raw_text_length > 0 ? `（已上传 ${file.name}，解析到 ${data.skills.length} 项技能）\n\n` + (data.projects?.join('\n') ?? '') : '');
        setParsedResume(data);
      }
    } catch {
      alert('上传失败，请检查后端服务');
    }
  }

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [dashboardRes, graphRes, discoverRes, resumesRes, evalRes, clusterRes] = await Promise.all([
        fetch(`${API_BASE}/api/dashboard`),
        fetch(`${API_BASE}/api/graph`),
        fetch(`${API_BASE}/api/discover`),
        fetch(`${API_BASE}/api/resumes`),
        fetch(`${API_BASE}/api/evaluation`),
        fetch(`${API_BASE}/api/clustering`)
      ]);
      const dashboardData: Dashboard = await dashboardRes.json();
      const graphData: GraphData = await graphRes.json();
      const resumeData: Resume[] = await resumesRes.json();
      const updatePairs = await Promise.all(
        dashboardData.jobs.map(async (job) => [job.id, await fetch(`${API_BASE}/api/updates/${job.id}`).then((res) => res.json())] as const)
      );

      setDashboard(dashboardData);
      setGraph(graphData);
      setSelectedNodeId(graphData.nodes[0]?.id ?? null);
      setDiscoveries(await discoverRes.json());
      setResumes(resumeData);
      setResumeText(resumeData[0]?.text ?? '');
      setUpdates(Object.fromEntries(updatePairs));
      try {
        if (evalRes.ok) setEvaluation(await evalRes.json());
      } catch { /* evaluation API not available */ }
      try {
        if (clusterRes.ok) setClustering(await clusterRes.json());
      } catch { /* clustering API not available */ }
    } catch {
      setError('无法连接后端服务，请先启动 FastAPI：uvicorn app.main:app --reload');
    } finally {
      setLoading(false);
    }
  }

  async function runResumeParse() {
    const response = await fetch(`${API_BASE}/api/parse/resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: resumeText })
    });
    setParsedResume(await response.json());
  }

  async function runMatch() {
    const response = await fetch(`${API_BASE}/api/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: selectedJob, resume_text: resumeText })
    });
    const result = await response.json();
    setMatchResult(result);
    setParsedResume(result.parsed_resume);
  }

  async function runPathQuery() {
    if (!pathSource || !pathTarget) return;
    const res = await fetch(`${API_BASE}/api/graph/path?source=${encodeURIComponent(pathSource)}&target=${encodeURIComponent(pathTarget)}`);
    setPathResult(await res.json());
  }

  React.useEffect(() => {
    loadData();
  }, []);

  const jobs = dashboard?.jobs ?? [];
  const activeJob = jobs.find((job) => job.id === selectedJob) ?? jobs[0];
  const selectedResume = resumes.find((resume) => resume.target_job_id === selectedJob) ?? resumes[0];

  React.useEffect(() => {
    if (selectedResume) {
      setResumeText(selectedResume.text);
      setMatchResult(null);
      setParsedResume(null);
    }
  }, [selectedJob, selectedResume?.id]);

  const { nodes: forceNodes, edges: forceEdges, positions, nodesRef } = useForceSimulation(graph, graphFilter);

  const selectedNode = forceNodes.find((node) => node.id === selectedNodeId) ?? null;
  const relatedEdges = forceEdges.filter((edge) => edge.source === selectedNodeId || edge.target === selectedNodeId);
  const nodeTypeCounts = React.useMemo(() => {
    return (graph?.nodes ?? []).reduce<Record<string, number>>((acc, node) => {
      acc[node.type] = (acc[node.type] ?? 0) + 1;
      return acc;
    }, {});
  }, [graph?.nodes]);

  const requiredCoverage = matchResult && activeJob ? Math.round((matchResult.covered_required.length / Math.max(activeJob.required_skills.length, 1)) * 100) : 0;
  const bonusCoverage = matchResult && activeJob ? Math.round((matchResult.covered_bonus.length / Math.max(activeJob.bonus_skills.length, 1)) * 100) : 0;
  const evidenceQuality = parsedResume ? Math.round((parsedResume.skills.filter((skill) => skill.evidence.length > 0).length / Math.max(parsedResume.skills.length, 1)) * 100) : 0;

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader" />
        <h1>正在构建岗位能力图谱工作台</h1>
        <p>加载 JD、简历、图谱和动态演化数据...</p>
      </div>
    );
  }

  return (
    <main>
      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Talent Capability Intelligence Platform</p>
          <h1>多源异构数据驱动岗位和能力图谱</h1>
          <p>面向比赛演示的高级 MVP 工作台：岗位发现、能力演化、证据校验、图谱探索与人岗诊断一体化。</p>
          <div className="hero-tags">
            <Pill tone="purple">LLM/RAG 可扩展</Pill>
            <Pill tone="green">证据链校验</Pill>
            <Pill tone="orange">动态演化分析</Pill>
          </div>
        </div>
        <div className="hero-panel">
          <div>
            <span>系统状态</span>
            <b>{error ? '后端未连接' : '演示数据就绪'}</b>
          </div>
          <button onClick={loadData}>
            <RefreshCcw size={16} />
            重置数据
          </button>
        </div>
      </header>

      {error ? <div className="error-banner">{error}</div> : null}

      <nav className="module-nav">
        {modules.map((module) => (
          <button key={module.key} className={activeModule === module.key ? 'active' : ''} onClick={() => setActiveModule(module.key)}>
            {module.icon}
            {module.label}
          </button>
        ))}
      </nav>

      {dashboard ? (
        <section className="metrics">
          <div className="metric-card">
            <Database />
            <strong>{dashboard.jd_count}</strong>
            <span>多源 JD 记录</span>
            <small>招聘网站、趋势报告、企业样例</small>
          </div>
          <div className="metric-card">
            <BrainCircuit />
            <strong>{dashboard.job_count}</strong>
            <span>岗位能力画像</span>
            <small>新兴岗位 + 既有岗位</small>
          </div>
          <div className="metric-card">
            <Network />
            <strong>{dashboard.graph_metrics.node_count}</strong>
            <span>图谱节点</span>
            <small>{dashboard.graph_metrics.edge_count} 条关系</small>
          </div>
          <div className="metric-card">
            <ShieldCheck />
            <strong>{Math.round(dashboard.graph_metrics.density * 1000) / 10}%</strong>
            <span>关系密度</span>
            <small>用于评估图谱连通性</small>
          </div>
        </section>
      ) : null}

      {activeModule === 'overview' ? (
        <>
          <section className="workflow">
            {[
              ['数据接入', '多源 JD 与简历样例导入', <Database key="data" />],
              ['解析清洗', '技能词典、证据片段、噪声过滤', <FileSearch key="parse" />],
              ['图谱构建', '岗位、技能、技术栈、场景关联', <Network key="graph" />],
              ['动态演化', '新增、删除、增强能力项追踪', <GitBranch key="evolve" />],
              ['人岗诊断', '匹配度、差距、学习路径输出', <Route key="match" />]
            ].map(([title, desc, icon], index) => (
              <div className="workflow-step" key={String(title)}>
                <div className="step-index">{index + 1}</div>
                <div className="step-icon">{icon}</div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </section>

          <div className="grid two">
            <Card title="岗位能力画像" subtitle="支持岗位定义、职责、技能和场景一屏查看" icon={<Layers3 />}>
              <div className="job-board">
                {jobs.map((job) => (
                  <article key={job.id} className={`job-card ${selectedJob === job.id ? 'selected' : ''}`} onClick={() => setSelectedJob(job.id)}>
                    <div className="job-head">
                      <div>
                        <h3>{job.title}</h3>
                        <span>{job.level} · {job.industry_scenarios.join(' / ')}</span>
                      </div>
                      <Pill tone={job.category === 'emerging' ? 'orange' : 'blue'}>{job.category === 'emerging' ? '新兴岗位' : '既有岗位'}</Pill>
                    </div>
                    <p>{job.definition}</p>
                    <div className="skill-row">
                      {job.required_skills.slice(0, 8).map((skill) => <Pill key={skill} tone="green">{skill}</Pill>)}
                    </div>
                  </article>
                ))}
              </div>
            </Card>

            <Card title="新岗位发现雷达" subtitle="基于新兴技术信号、技能组合和来源证据计算候选置信度" icon={<Sparkles />} accent>
              {discoveries.map((item) => (
                <article key={item.job_id} className="discovery-card">
                  <div className="job-head">
                    <div>
                      <h3>{item.title}</h3>
                      <span>{item.signal_count} 个新兴信号 · {item.industry_scenarios.join(' / ')}</span>
                    </div>
                    <div className="confidence">{Math.round(item.confidence * 100)}%</div>
                  </div>
                  <p>{item.definition}</p>
                  <Progress value={Math.round(item.confidence * 100)} label="岗位发现置信度" tone="orange" />
                  <div className="evidence-list">
                    {item.evidence_sources.map((source) => <span key={source}>{source}</span>)}
                  </div>
                </article>
              ))}
            </Card>
          </div>
        </>
      ) : null}

      {activeModule === 'graph' ? (
        <div className="grid graph-layout">
          <Card title="图谱探索器" subtitle="按节点类型筛选，并点击节点查看相邻关系" icon={<Network />} accent>
            <div className="filter-bar">
              <button className={graphView === 'topology' ? 'active' : ''} onClick={() => setGraphView('topology')}>
                <Network size={14} /> 拓扑视图
              </button>
              <button className={graphView === 'cluster' ? 'active' : ''} onClick={() => setGraphView('cluster')}>
                <Layers3 size={14} /> 聚类视图
              </button>
            </div>
            {graphView === 'topology' ? (
              <>
                <div className="filter-bar">
                  {[
                    ['all', '全部', graph?.nodes.length ?? 0],
                    ['job', '岗位', nodeTypeCounts.job ?? 0],
                    ['skill', '技能', nodeTypeCounts.skill ?? 0],
                    ['skill_category', '技能类别', nodeTypeCounts.skill_category ?? 0],
                    ['scenario', '行业场景', nodeTypeCounts.scenario ?? 0]
                  ].map(([key, label, count]) => (
                    <button key={String(key)} className={graphFilter === key ? 'active' : ''} onClick={() => setGraphFilter(String(key))}>
                      {label}<span>{count}</span>
                    </button>
                  ))}
                </div>
                <GraphCanvas
                  nodes={forceNodes}
                  edges={forceEdges}
                  positions={positions}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={setSelectedNodeId}
                  nodesRef={nodesRef}
                />
              </>
            ) : null}
            {graphView === 'cluster' && clustering ? (
              <div className="cluster-view">
                <svg className="cluster-canvas" viewBox="-6 -6 12 12" role="img" aria-label="岗位聚类散点图">
                  <line x1="-5" y1="0" x2="5" y2="0" stroke="#e5ebf5" strokeWidth="0.02" />
                  <line x1="0" y1="-5" x2="0" y2="5" stroke="#e5ebf5" strokeWidth="0.02" />
                  {clustering.clusters.map((cluster) => {
                    const colors = ['#2f6df6', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed'];
                    const color = colors[cluster.id % colors.length];
                    return cluster.jobs.map((job) => (
                      <g key={job.id} className="cluster-node" onClick={() => { setSelectedJob(job.id); setGraphView('topology'); }}>
                        <circle cx={job.coords.x} cy={-job.coords.y} r={0.35} fill={color} opacity={0.85} stroke="white" strokeWidth={0.06} />
                        <text x={job.coords.x} y={-job.coords.y + 0.55} textAnchor="middle" fontSize="0.3" fill="#162033" fontWeight="700">
                          {job.title.length > 6 ? job.title.slice(0, 5) + '..' : job.title}
                        </text>
                      </g>
                    ));
                  })}
                </svg>
                <div className="cluster-info">
                  {clustering.clusters.map((cluster) => {
                    const colors = ['#2f6df6', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed'];
                    const color = colors[cluster.id % colors.length];
                    return (
                      <div key={cluster.id} className="cluster-card">
                        <div className="cluster-header">
                          <i style={{ background: color, width: 12, height: 12, borderRadius: '50%', display: 'inline-block' }} />
                          <b>类别 {cluster.id + 1}</b>
                          <span>{cluster.jobs.length} 个岗位</span>
                        </div>
                        <div className="skill-row">
                          {cluster.top_skills.map((s) => <Pill key={s.name} tone="green">{s.name} ({s.count})</Pill>)}
                        </div>
                        <div className="muted">{cluster.jobs.map((j) => j.title).join('、')}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </Card>

          <Card title="节点关系详情" subtitle="展示证据化关系，便于评审理解图谱如何生成" icon={<Search />}>
            {selectedNode ? (
              <div className="node-detail">
                <Pill tone="purple">{selectedNode.type}</Pill>
                <h3>{selectedNode.label}</h3>
                <p className="muted">节点 ID：{selectedNode.id}</p>
                <h4>相邻关系</h4>
                {relatedEdges.length ? relatedEdges.map((edge) => {
                  const otherId = edge.source === selectedNode.id ? edge.target : edge.source;
                  const other = graph?.nodes.find((node) => node.id === otherId);
                  return (
                    <div className="relation-row" key={`${edge.source}-${edge.target}`}>
                      <span>{edge.relation}</span>
                      <b>{other?.label ?? otherId}</b>
                    </div>
                  );
                }) : <EmptyState text="该筛选下暂无相邻关系" />}
              </div>
            ) : <EmptyState text="请选择一个图谱节点" />}
            <h4 style={{ marginTop: 20 }}>路径查询</h4>
            <p className="muted" style={{ marginBottom: 10 }}>选择起止节点，查询图谱中最短路径</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <select value={pathSource} onChange={(e) => setPathSource(e.target.value)} style={{ flex: 1 }}>
                <option value="">起点节点</option>
                {forceNodes.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
              </select>
              <select value={pathTarget} onChange={(e) => setPathTarget(e.target.value)} style={{ flex: 1 }}>
                <option value="">终点节点</option>
                {forceNodes.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
              </select>
            </div>
            <button className="secondary" onClick={runPathQuery} style={{ width: '100%' }}>
              <Route size={14} /> 查询路径
            </button>
            {pathResult && (
              <div style={{ marginTop: 12 }}>
                {pathResult.error ? (
                  <EmptyState text={pathResult.error} />
                ) : (
                  <>
                    <p className="muted">路径长度：{pathResult.length} 跳</p>
                    <div className="timeline" style={{ marginLeft: 0 }}>
                      {pathResult.path.map((node, i) => (
                        <div key={node.id} className="timeline-item" style={{ marginLeft: 0 }}>
                          <div className="timeline-dot" />
                          <div className="timeline-content">
                            <Pill tone={node.type === 'job' ? 'gray' : node.type === 'skill' ? 'green' : node.type === 'skill_category' ? 'blue' : 'orange'}>{node.type}</Pill>
                            <b>{node.label}</b>
                            {pathResult.edges[i] && <span className="muted"> → {pathResult.edges[i].relation}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </Card>
        </div>
      ) : null}

      {activeModule === 'evolution' ? (
        <div className="grid two">
          <Card title="岗位能力动态更新" subtitle="按时间批次比较 JD 能力项变化" icon={<GitBranch />} accent>
            <div className="timeline">
              {Object.values(updates).map((update) => (
                <article key={update.job_id} className="timeline-item">
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <div className="job-head">
                      <h3>{update.title}</h3>
                      <Pill>{update.baseline_batch ?? '初始'} → {update.current_batch ?? '当前'}</Pill>
                    </div>
                    <p>{update.summary}</p>
                    <div className="change-grid">
                      <div>
                        <b>新增能力</b>
                        {update.added.length ? update.added.map((skill) => <Pill key={skill} tone="green">{skill}</Pill>) : <span className="muted">无</span>}
                      </div>
                      <div>
                        <b>删除能力</b>
                        {update.removed.length ? update.removed.map((skill) => <Pill key={skill} tone="red">{skill}</Pill>) : <span className="muted">无</span>}
                      </div>
                      <div>
                        <b>增强能力</b>
                        {update.strengthened.length ? update.strengthened.map((skill) => <Pill key={skill} tone="purple">{skill}</Pill>) : <span className="muted">无</span>}
                      </div>
                    </div>
                    <div className="evidence-list">
                      {update.sources.map((source, i) => <span key={`${update.job_id}-${source}-${i}`}>{source}</span>)}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </Card>

          <Card title="幻觉防控与证据链" subtitle="把大模型抽取约束到可验证证据与技能词典中" icon={<ShieldCheck />}>
            <div className="control-list">
              <div><CheckCircle2 /><span>技能词典归一化：别名统一到标准技能点</span></div>
              <div><CheckCircle2 /><span>证据片段保留：每个技能尽量关联原文句子</span></div>
              <div><CheckCircle2 /><span>多源交叉验证：招聘站点、趋势报告、企业样例共同支撑</span></div>
              <div><CheckCircle2 /><span>人工优化入口：岗位卡片支持后续扩展审核与修改</span></div>
            </div>
          </Card>
        </div>
      ) : null}

      {activeModule === 'matching' ? (
        <div className="grid matching-layout">
          <Card title="简历解析与目标岗位选择" subtitle="可替换任意文本简历，实时解析技能证据" icon={<FileSearch />}>
            <label>目标岗位</label>
            <select value={selectedJob} onChange={(event) => setSelectedJob(event.target.value)}>
              {jobs.map((job) => <option value={job.id} key={job.id}>{job.title}</option>)}
            </select>
            <label>上传简历文件</label>
            <div
              className={`upload-zone ${uploadedFileName ? 'has-file' : ''}`}
              onClick={() => document.getElementById('resume-file-input')?.click()}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('dragover'); }}
              onDragLeave={(e) => e.currentTarget.classList.remove('dragover')}
              onDrop={async (e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('dragover');
                const file = e.dataTransfer.files?.[0];
                if (!file) return;
                await handleFileUpload(file);
              }}
            >
              <input
                id="resume-file-input"
                type="file"
                accept=".pdf,.txt"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) await handleFileUpload(file);
                }}
              />
              {uploadedFileName ? (
                <>
                  <CheckCircle2 size={28} className="upload-zone-icon" style={{ color: '#16a34a' }} />
                  <span className="upload-zone-name">{uploadedFileName}</span>
                  <span className="upload-zone-text">点击或拖拽重新上传</span>
                </>
              ) : (
                <>
                  <svg className="upload-zone-icon" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span className="upload-zone-text">点击选择或拖拽 PDF / TXT 文件到此处</span>
                </>
              )}
            </div>
            <label>简历文本</label>
            <textarea value={resumeText} onChange={(event) => setResumeText(event.target.value)} />
            <div className="button-row">
              <button className="secondary" onClick={runResumeParse}>
                <FileSearch size={16} />
                仅解析简历
              </button>
              <button onClick={runMatch}>
                <Activity size={16} />
                运行匹配诊断
              </button>
            </div>
          </Card>

          <Card title="匹配评分拆解" subtitle="把总分拆为必备技能、加分技能和证据质量" icon={<Target />} accent>
            {matchResult ? (
              <>
                <div className="score-ring">
                  <div>
                    <strong>{matchResult.score}</strong>
                    <span>/100</span>
                  </div>
                </div>
                <h3>{matchResult.job_title}</h3>
                <p>{matchResult.diagnosis}</p>
                <Progress value={requiredCoverage} label="必备技能覆盖率" tone={requiredCoverage >= 75 ? 'green' : 'orange'} />
                <Progress value={bonusCoverage} label="加分技能覆盖率" tone="blue" />
                <Progress value={evidenceQuality} label="证据片段完整度" tone="green" />
              </>
            ) : <EmptyState text="运行匹配后展示评分拆解" />}
          </Card>

          <Card title="技能差距与学习路径" subtitle="面向目标岗位输出可执行补齐路线" icon={<Route />}>
            {matchResult ? (
              <div className="gap-layout">
                <div>
                  <h3>已覆盖必备技能</h3>
                  {matchResult.covered_required.map((skill) => <Pill key={skill} tone="green">{skill}</Pill>)}
                  <h3>关键缺口</h3>
                  {matchResult.missing_required.length ? matchResult.missing_required.map((skill) => <Pill key={skill} tone="red">{skill}</Pill>) : <Pill tone="green">无关键缺口</Pill>}
                  <h3>加分项</h3>
                  {matchResult.covered_bonus.length ? matchResult.covered_bonus.map((skill) => <Pill key={skill} tone="purple">{skill}</Pill>) : <span className="muted">暂无覆盖</span>}
                </div>
                <div className="learning-path">
                  {matchResult.learning_path.length ? matchResult.learning_path.map((item) => (
                    <div key={item.skill}>
                      <b>{item.skill}</b>
                      <ol>{item.steps.map((step) => <li key={step}>{step}</li>)}</ol>
                    </div>
                  )) : <EmptyState text="必备技能已基本覆盖，可继续冲刺加分项" />}
                </div>
              </div>
            ) : <EmptyState text="暂无匹配结果" />}
          </Card>

          <Card title="简历解析证据" subtitle="展示抽取出的技能、置信度和原文证据" icon={<Search />}>
            {parsedResume ? (
              <div className="parse-result">
                <div className="parse-meta">
                  <span>工作年限：{parsedResume.years ?? '未识别'}</span>
                  <span>文本长度：{parsedResume.raw_text_length}</span>
                  <span>技能数：{parsedResume.skills.length}</span>
                </div>
                {parsedResume.skills.map((skill) => (
                  <div className="skill-evidence" key={skill.name}>
                    <div>
                      <b>{skill.name}</b>
                      <Pill tone="gray">{skill.category}</Pill>
                      <span>{Math.round(skill.confidence * 100)}%</span>
                    </div>
                    <p>{skill.evidence[0] ?? '暂无证据片段'}</p>
                  </div>
                ))}
              </div>
            ) : <EmptyState text="解析简历后展示技能证据" />}
          </Card>
        </div>
      ) : null}

      {activeModule === 'evaluation' && evaluation ? (
        <>
          <section className="metrics">
            <div className="metric-card">
              <ClipboardCheck />
              <strong>{Math.round(evaluation.summary.skill_extraction_f1 * 100)}%</strong>
              <span>技能抽取 F1</span>
              <small>Precision {Math.round(evaluation.summary.skill_extraction_precision * 100)}% / Recall {Math.round(evaluation.summary.skill_extraction_recall * 100)}%</small>
            </div>
            <div className="metric-card">
              <Target />
              <strong>{Math.round(evaluation.summary.matching_accuracy * 100)}%</strong>
              <span>匹配准确率</span>
              <small>{evaluation.summary.matching_passed} 通过</small>
            </div>
            <div className="metric-card">
              <Sparkles />
              <strong>{evaluation.summary.discovery_count}</strong>
              <span>新岗位发现</span>
              <small>{evaluation.summary.high_confidence_discoveries} 个高置信度</small>
            </div>
            <div className="metric-card">
              <Database />
              <strong>{evaluation.skill_extraction.total_cases}</strong>
              <span>评测用例数</span>
              <small>技能抽取 + 匹配验证</small>
            </div>
          </section>

          <div className="grid two">
            <Card title="技能抽取评测" subtitle="基于 30 条测试用例，验证 JD 和简历的技能识别准确率" icon={<ClipboardCheck />} accent>
              <div className="change-grid">
                <div>
                  <b>Macro 平均</b>
                  <Progress value={Math.round(evaluation.skill_extraction.macro_avg.precision * 100)} label="Precision" tone="green" />
                  <Progress value={Math.round(evaluation.skill_extraction.macro_avg.recall * 100)} label="Recall" tone="blue" />
                  <Progress value={Math.round(evaluation.skill_extraction.macro_avg.f1 * 100)} label="F1" tone="green" />
                </div>
                <div>
                  <b>Micro 平均</b>
                  <Progress value={Math.round(evaluation.skill_extraction.micro_avg.precision * 100)} label="Precision" tone="green" />
                  <Progress value={Math.round(evaluation.skill_extraction.micro_avg.recall * 100)} label="Recall" tone="blue" />
                  <Progress value={Math.round(evaluation.skill_extraction.micro_avg.f1 * 100)} label="F1" tone="green" />
                </div>
              </div>
              <h4>逐条结果</h4>
              <div className="eval-list">
                {evaluation.skill_extraction.details.map((d) => (
                  <div className="eval-row" key={d.case_id}>
                    <span className={d.f1 >= 0.8 ? 'eval-pass' : 'eval-warn'}>
                      {d.f1 >= 0.8 ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    </span>
                    <b>{d.case_id}</b>
                    <Pill tone="gray">{d.type}</Pill>
                    <span>P:{Math.round(d.precision * 100)}%</span>
                    <span>R:{Math.round(d.recall * 100)}%</span>
                    <span>F1:{Math.round(d.f1 * 100)}%</span>
                    {d.extra.length ? <span className="muted">多识别: {d.extra.join(', ')}</span> : null}
                  </div>
                ))}
              </div>
            </Card>

            <Card title="人岗匹配评测" subtitle="验证匹配分数是否达到预期最低阈值" icon={<Target />}>
              <Progress value={Math.round(evaluation.matching.accuracy * 100)} label="匹配准确率" tone={evaluation.matching.accuracy >= 0.9 ? 'green' : 'orange'} />
              <h4>逐条结果</h4>
              <div className="eval-list">
                {evaluation.matching.details.map((d) => (
                  <div className="eval-row" key={d.case_id}>
                    <span className={d.passed ? 'eval-pass' : 'eval-fail'}>
                      {d.passed ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    </span>
                    <b>{d.case_id}</b>
                    <span>得分: {d.score}</span>
                    <span>阈值: {d.expected_min_score}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card title="新岗位发现结果" subtitle="基于新兴技术信号的岗位发现清单" icon={<Sparkles />}>
            <div className="eval-list">
              {evaluation.discovery.discoveries.map((d) => (
                <div className="eval-row" key={d.job_id}>
                  <div className="confidence" style={{ width: 48, height: 48, fontSize: 14 }}>
                    {Math.round(d.confidence * 100)}%
                  </div>
                  <b>{d.title}</b>
                  <span>{d.signal_count} 个新兴信号</span>
                  <span>{d.skills_count} 项必备技能</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      ) : null}
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
