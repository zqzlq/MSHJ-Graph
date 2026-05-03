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
  const [activeModule, setActiveModule] = React.useState<ModuleKey>('overview');
  const [graphFilter, setGraphFilter] = React.useState('all');
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      await fetch(`${API_BASE}/api/init`, { method: 'POST' });
      const [dashboardRes, graphRes, discoverRes, resumesRes, evalRes] = await Promise.all([
        fetch(`${API_BASE}/api/dashboard`),
        fetch(`${API_BASE}/api/graph`),
        fetch(`${API_BASE}/api/discover`),
        fetch(`${API_BASE}/api/resumes`),
        fetch(`${API_BASE}/api/evaluation`)
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

  const filteredNodes = React.useMemo(() => {
    const nodes = graph?.nodes ?? [];
    return graphFilter === 'all' ? nodes : nodes.filter((node) => node.type === graphFilter);
  }, [graph?.nodes, graphFilter]);

  const visibleGraph = React.useMemo(() => {
    if (!graph) {
      return { nodes: [] as GraphNode[], edges: [] as GraphEdge[], positions: {} as Record<string, { x: number; y: number }> };
    }

    const seedIds = new Set(filteredNodes.map((node) => node.id));
    const visibleIds = new Set(seedIds);
    graph.edges.forEach((edge) => {
      if (graphFilter === 'all' || seedIds.has(edge.source) || seedIds.has(edge.target)) {
        visibleIds.add(edge.source);
        visibleIds.add(edge.target);
      }
    });

    const nodes = graph.nodes.filter((node) => visibleIds.has(node.id));
    const edges = graph.edges.filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target));
    const columns: Record<string, number> = {
      job: 120,
      skill: 430,
      skill_category: 725,
      scenario: 850
    };
    const grouped = nodes.reduce<Record<string, GraphNode[]>>((acc, node) => {
      acc[node.type] = [...(acc[node.type] ?? []), node];
      return acc;
    }, {});
    const positions: Record<string, { x: number; y: number }> = {};
    const maxGroupSize = Math.max(...Object.values(grouped).map(g => g.length), 1);
    const canvasHeight = Math.max(620, maxGroupSize * 28 + 100);

    Object.entries(grouped).forEach(([type, group]) => {
      const x = columns[type] ?? 500;
      const gap = Math.min(48, Math.max(20, (canvasHeight - 100) / Math.max(group.length, 1)));
      const startY = 40 + Math.max(0, ((canvasHeight - 80) - gap * (group.length - 1)) / 2);
      group.forEach((node, index) => {
        const offset = type === 'skill' ? (index % 2 === 0 ? -14 : 14) : 0;
        positions[node.id] = { x: x + offset, y: startY + index * gap };
      });
    });

    return { nodes, edges, positions, canvasHeight };
  }, [filteredNodes, graph, graphFilter]);

  const selectedNode = graph?.nodes.find((node) => node.id === selectedNodeId) ?? null;
  const relatedEdges = graph?.edges.filter((edge) => edge.source === selectedNodeId || edge.target === selectedNodeId) ?? [];
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
            <div className="graph-canvas">
              <svg className="knowledge-graph" viewBox={`0 0 980 ${visibleGraph.canvasHeight}`} role="img" aria-label="岗位能力知识图谱">
                <defs>
                  <marker id="arrow" markerHeight="10" markerWidth="10" orient="auto" refX="9" refY="3">
                    <path d="M0,0 L0,6 L9,3 z" />
                  </marker>
                </defs>
                {visibleGraph.edges.map((edge) => {
                  const source = visibleGraph.positions[edge.source];
                  const target = visibleGraph.positions[edge.target];
                  if (!source || !target) {
                    return null;
                  }
                  const isActive = edge.source === selectedNodeId || edge.target === selectedNodeId;
                  const midX = (source.x + target.x) / 2;
                  const midY = (source.y + target.y) / 2;
                  return (
                    <g key={`${edge.source}-${edge.target}`} className={`graph-edge ${edge.relation} ${isActive ? 'active' : ''}`}>
                      <line x1={source.x} y1={source.y} x2={target.x} y2={target.y} markerEnd="url(#arrow)" />
                      <text x={midX} y={midY - 6}>{edge.relation}</text>
                    </g>
                  );
                })}
                {visibleGraph.nodes.map((node) => {
                  const position = visibleGraph.positions[node.id];
                  if (!position) {
                    return null;
                  }
                  const isSelected = selectedNodeId === node.id;
                  const related = relatedEdges.some((edge) => edge.source === node.id || edge.target === node.id);
                  return (
                    <g
                      key={node.id}
                      className={`kg-node ${node.type} ${isSelected ? 'selected' : ''} ${related ? 'related' : ''}`}
                      onClick={() => setSelectedNodeId(node.id)}
                      tabIndex={0}
                      role="button"
                    >
                      <circle cx={position.x} cy={position.y} r={node.type === 'job' ? 34 : 26} />
                      <text x={position.x} y={position.y + 5}>{node.label.length > 12 ? `${node.label.slice(0, 11)}...` : node.label}</text>
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
                      {update.sources.map((source) => <span key={`${update.job_id}-${source}`}>{source}</span>)}
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
