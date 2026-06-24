import { useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Bot,
  BrainCircuit,
  Download,
  FileText,
  HelpCircle,
  Play,
  RefreshCcw,
  UploadCloud
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  agentDefinitions,
  analyzeAudio,
  analyzeText,
  analyzeVision,
  answerByReport,
  buildReport,
  createTaskPlan,
  detectModalities,
  fileCategory,
  formatSize,
  fuseResults,
  preprocess
} from "./analysisEngine.js";

const scenarios = ["课堂学习状态分析", "智能客服情绪监测", "访谈视频情绪分析", "心理健康辅助评估", "社交媒体舆情样本分析"];
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export default function App() {
  const [scenario, setScenario] = useState(scenarios[0]);
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [task, setTask] = useState(null);
  const [report, setReport] = useState(null);
  const [agentStatus, setAgentStatus] = useState({});
  const [messages, setMessages] = useState([{ role: "assistant", text: "你好，我可以解释识别依据、模态冲突、风险提示和改进建议。请先运行一次分析。" }]);
  const [question, setQuestion] = useState("");
  const [running, setRunning] = useState(false);

  const modalities = useMemo(() => detectModalities(text, files), [text, files]);

  const addFiles = (selectedFiles) => {
    setFiles((current) => [...current, ...selectedFiles]);
  };

  const loadDemo = () => {
    setScenario("智能客服情绪监测");
    setText("我真的有点受够了，问题一直没有解决，最近压力也很大。虽然我说没事，但其实还是很焦虑，希望你们尽快给我一个明确答复。");
  };

  const runAgent = async (id, ms = 280) => {
    setAgentStatus((current) => ({ ...current, [id]: "运行中" }));
    await new Promise((resolve) => setTimeout(resolve, ms));
    setAgentStatus((current) => ({ ...current, [id]: "完成" }));
  };

  const runAnalysis = async () => {
    if (!text.trim() && !files.length) {
      alert("请先输入文本或上传至少一个文件。");
      return;
    }
    setRunning(true);
    setReport(null);
    setAgentStatus({});

    await runAgent("planner");
    const plan = createTaskPlan({ text, files, scenario });
    setTask(plan);
    await runAgent("preprocess");
    const backendReport = await tryBackendAnalyze();
    if (backendReport) {
      setTask({ ...plan, id: backendReport.taskId });
      setAgentStatus({
        planner: "完成",
        preprocess: "完成",
        text: "完成",
        audio: "完成",
        vision: "完成",
        fusion: "完成",
        report: "完成",
        qa: "就绪"
      });
      setReport(backendReport);
      setRunning(false);
      return;
    }

    const prepared = preprocess({ text, files });
    await runAgent("text");
    const textResult = analyzeText(prepared.text);
    await runAgent("audio");
    const audioResult = analyzeAudio(prepared.files);
    await runAgent("vision");
    const visionResult = analyzeVision(prepared.files);
    await runAgent("fusion");
    const results = [textResult, audioResult, visionResult].filter(Boolean);
    const fusion = fuseResults(results, plan);
    await runAgent("report");
    const nextReport = buildReport({ fusion, modalityResults: results, plan, prepared });
    setReport(nextReport);
    setAgentStatus((current) => ({ ...current, qa: "就绪" }));
    setRunning(false);
  };

  const tryBackendAnalyze = async () => {
    try {
      const formData = new FormData();
      formData.append("scenario", scenario);
      formData.append("text", text);
      files.forEach((file) => formData.append("files", file));
      const response = await fetch(`${API_BASE}/api/analyze-form`, {
        method: "POST",
        body: formData
      });
      if (!response.ok) return null;
      const data = await response.json();
      return normalizeBackendReport(data.report);
    } catch {
      return null;
    }
  };

  const reset = () => {
    setScenario(scenarios[0]);
    setText("");
    setFiles([]);
    setTask(null);
    setReport(null);
    setAgentStatus({});
    setRunning(false);
    setMessages([{ role: "assistant", text: "你好，我可以解释识别依据、模态冲突、风险提示和改进建议。请先运行一次分析。" }]);
  };

  const ask = () => {
    const clean = question.trim();
    if (!clean) return;
    setMessages((current) => [...current, { role: "user", text: clean }]);
    askBackendOrLocal(clean);
    setQuestion("");
  };

  const askBackendOrLocal = async (clean) => {
    try {
      const response = await fetch(`${API_BASE}/api/qa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: clean,
          report: report ? denormalizeReport(report) : null
        })
      });
      if (response.ok) {
        const data = await response.json();
        setMessages((current) => [...current, { role: "assistant", text: data.answer }]);
        return;
      }
    } catch {
      // Fall back to local answer when the Python backend is not running.
    }
    setMessages((current) => [...current, { role: "assistant", text: answerByReport(clean, report) }]);
  };

  const exportReport = () => {
    if (!report) {
      alert("请先运行分析。");
      return;
    }
    const content = [
      "面向多模态情感识别的多智能体协同自助系统分析报告",
      `任务编号：${report.taskId}`,
      `生成时间：${report.createdAt}`,
      `应用场景：${report.scenario}`,
      `综合情绪：${report.labelName}`,
      `综合置信度：${Math.round(report.confidence * 100)}%`,
      `主导模态：${report.dominantModality}`,
      `风险等级：${report.riskLevel}`,
      "",
      "总体结论：",
      report.summary,
      "",
      "建议：",
      report.advice
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "情感识别分析报告.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <BrainCircuit size={26} />
          </div>
          <div>
            <h1>多模态情感识别</h1>
            <p>Multi-Agent System</p>
          </div>
        </div>
        <nav>
          <a href="#workspace">任务工作台</a>
          <a href="#agents">智能体协同</a>
          <a href="#report">分析报告</a>
          <a href="#qa">自助问答</a>
        </nav>
        <div className="runtime-card">
          <Activity size={18} />
          <div>
            <strong>React + Vite 原型</strong>
            <span>可本地运行，可上传 GitHub。</span>
          </div>
        </div>
      </aside>

      <main>
        <section className="hero" id="workspace">
          <div>
            <span className="eyebrow">AI Agent · Multimodal Emotion Recognition</span>
            <h2>面向多模态情感识别的多智能体协同自助系统</h2>
            <p>系统通过任务规划、数据预处理、单模态识别、融合决策、解释生成和自助问答等智能体，完成从素材上传到可解释报告的完整流程。</p>
          </div>
          <div className="hero-status">
            <span>当前任务</span>
            <strong>{task?.id || "TASK-LOCAL"}</strong>
            <p>{running ? "多智能体正在协同分析" : report ? "分析完成" : "等待创建任务"}</p>
          </div>
        </section>

        <section className="grid two">
          <section className="panel">
            <PanelTitle icon={<UploadCloud size={20} />} title="素材输入" action={<button onClick={loadDemo}>载入示例</button>} />
            <label>应用场景</label>
            <select value={scenario} onChange={(event) => setScenario(event.target.value)}>
              {scenarios.map((item) => <option key={item}>{item}</option>)}
            </select>

            <label>文本内容</label>
            <textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="请输入对话文本、评论内容或访谈转写文本。" />

            <label>多媒体文件</label>
            <div className="upload-box">
              <input type="file" multiple accept="audio/*,video/*,image/*,.txt" onChange={(event) => addFiles([...event.target.files])} />
              <UploadCloud size={34} />
              <strong>点击或拖拽上传文件</strong>
              <span>支持文本、音频、图片、视频</span>
            </div>
            <div className="file-list">
              {files.map((file, index) => (
                <div className="file-row" key={`${file.name}-${index}`}>
                  <span>{file.name}</span>
                  <em>{fileCategory(file)} · {formatSize(file.size)}</em>
                </div>
              ))}
            </div>
            <div className="button-row">
              <button className="primary" onClick={runAnalysis} disabled={running}>
                <Play size={16} /> {running ? "分析中" : "开始协同分析"}
              </button>
              <button onClick={reset}><RefreshCcw size={16} /> 重置</button>
            </div>
          </section>

          <section className="panel">
            <PanelTitle icon={<BarChart3 size={20} />} title="任务摘要" badge={report ? "已完成" : running ? "分析中" : "未分析"} />
            <div className="metrics">
              <Metric label="文本字数" value={text.trim().length} />
              <Metric label="上传文件" value={files.length} />
              <Metric label="参与模态" value={modalities.length} />
              <Metric label="综合置信度" value={report ? `${Math.round(report.confidence * 100)}%` : "--"} />
            </div>
            <div className="chart-card">
              <h3>情绪时间轴</h3>
              {report ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={report.timeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 1]} />
                    <Tooltip formatter={(value, name, item) => [item.payload.emotion, "情绪"]} />
                    <Bar dataKey="score" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="empty">分析后生成片段级情绪变化。</p>
              )}
            </div>
          </section>
        </section>

        <section className="panel" id="agents">
          <PanelTitle icon={<Bot size={20} />} title="多智能体协同流程" badge="Planner → Agents → Fusion → Report" />
          <div className="agent-grid">
            {agentDefinitions.map((agent) => (
              <article className="agent-card" key={agent.id}>
                <h3>{agent.name}</h3>
                <p>{agent.role}</p>
                <span className={statusClass(agentStatus[agent.id])}>{agentStatus[agent.id] || "等待"}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="grid two" id="report">
          <section className="panel">
            <PanelTitle icon={<FileText size={20} />} title="综合分析报告" action={<button onClick={exportReport}><Download size={16} /> 导出报告</button>} />
            {report ? <ReportView report={report} /> : <p className="empty">请先创建并运行分析任务。</p>}
          </section>
          <section className="panel">
            <PanelTitle icon={<Activity size={20} />} title="模态结果" badge="可解释证据" />
            {report ? <ModalityResults results={report.modalityResults} /> : <p className="empty">等待文本、语音、视觉智能体输出。</p>}
          </section>
        </section>

        <section className="panel" id="qa">
          <PanelTitle icon={<HelpCircle size={20} />} title="自助问答" badge="基于当前报告回答" />
          <div className="chat-box">
            {messages.map((message, index) => (
              <div className={`message ${message.role}`} key={`${message.role}-${index}`}>{message.text}</div>
            ))}
          </div>
          <div className="chat-input">
            <input value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => event.key === "Enter" && ask()} placeholder="例如：为什么判断为焦虑？哪个模态贡献最大？" />
            <button className="primary" onClick={ask}>提问</button>
          </div>
        </section>
      </main>
    </div>
  );
}

function normalizeBackendReport(report) {
  return {
    taskId: report.task_id,
    scenario: report.scenario,
    createdAt: report.created_at,
    label: report.label,
    labelName: report.label_name,
    confidence: report.confidence,
    conflict: report.conflict,
    dominantModality: report.dominant_modality,
    modalities: report.modalities,
    riskLevel: report.risk_level,
    summary: report.summary,
    advice: report.advice,
    distribution: report.distribution,
    timeline: report.timeline,
    modalityResults: report.modality_results.map((item) => ({
      agentName: item.agent_name,
      modality: item.modality,
      label: item.label,
      confidence: item.confidence,
      quality: item.quality,
      evidence: item.evidence,
      explanation: item.explanation
    }))
  };
}

function denormalizeReport(report) {
  return {
    task_id: report.taskId,
    scenario: report.scenario,
    created_at: report.createdAt,
    label: report.label,
    label_name: report.labelName,
    confidence: report.confidence,
    conflict: report.conflict,
    dominant_modality: report.dominantModality,
    modalities: report.modalities,
    risk_level: report.riskLevel,
    summary: report.summary,
    advice: report.advice,
    distribution: report.distribution,
    timeline: report.timeline,
    modality_results: report.modalityResults.map((item) => ({
      agent_name: item.agentName || `${item.modality}智能体`,
      modality: item.modality,
      label: item.label,
      confidence: item.confidence,
      quality: item.quality,
      evidence: item.evidence,
      explanation: item.explanation
    }))
  };
}

function PanelTitle({ icon, title, badge, action }) {
  return (
    <div className="panel-title">
      <div>{icon}<h2>{title}</h2></div>
      {badge ? <span className="badge">{badge}</span> : action}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ReportView({ report }) {
  return (
    <div className="report">
      <section>
        <h3>总体结论</h3>
        <p>{report.summary}</p>
        <p>综合置信度：<strong>{Math.round(report.confidence * 100)}%</strong>；风险等级：<strong>{report.riskLevel}</strong>。</p>
      </section>
      <section>
        <h3>融合解释</h3>
        <p>主导模态为 <strong>{report.dominantModality}</strong>。{report.conflict ? "不同模态存在情绪差异，融合智能体已按质量评分和置信度进行仲裁。" : "各模态输出较为一致，综合结论较稳定。"}</p>
      </section>
      <section>
        <h3>建议</h3>
        <p>{report.advice}</p>
      </section>
    </div>
  );
}

function ModalityResults({ results }) {
  return (
    <div className="modality-list">
      {results.map((item) => (
        <article className="modality-card" key={item.modality}>
          <h3>{item.modality}智能体</h3>
          <strong>{item.explanation}</strong>
          <p>情绪：{item.label}；置信度：{Math.round(item.confidence * 100)}%</p>
          <p>证据：{item.evidence.join("、")}</p>
          <div className="bar"><span style={{ width: `${Math.round(item.confidence * 100)}%` }} /></div>
        </article>
      ))}
    </div>
  );
}

function statusClass(status) {
  if (status === "完成" || status === "就绪") return "agent-status done";
  if (status === "运行中") return "agent-status running";
  return "agent-status";
}
