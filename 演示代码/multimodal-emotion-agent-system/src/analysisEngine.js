export const agentDefinitions = [
  { id: "planner", name: "任务规划智能体", role: "识别素材类型，拆解多模态分析任务。" },
  { id: "preprocess", name: "数据预处理智能体", role: "清洗文本，抽取文件类型，生成质量评分。" },
  { id: "text", name: "文本情感智能体", role: "基于语义线索识别文本情绪。" },
  { id: "audio", name: "语音情感智能体", role: "分析音频或视频中的声学情绪线索。" },
  { id: "vision", name: "视觉情感智能体", role: "分析图片或视频中的表情与姿态线索。" },
  { id: "fusion", name: "融合决策智能体", role: "融合各模态输出，处理冲突与置信度。" },
  { id: "report", name: "解释生成智能体", role: "生成结构化报告和可读解释。" },
  { id: "qa", name: "自助问答智能体", role: "基于当前报告回答用户追问。" }
];

export const emotionNames = {
  happy: "积极/开心",
  sad: "悲伤/低落",
  angry: "愤怒/不满",
  anxious: "焦虑/紧张",
  neutral: "中性/平稳"
};

const emotionWords = {
  happy: ["开心", "高兴", "满意", "喜欢", "期待", "顺利", "轻松", "感谢", "成功", "舒服"],
  sad: ["难过", "失落", "悲伤", "崩溃", "无助", "疲惫", "低落", "孤独", "痛苦", "哭"],
  angry: ["生气", "愤怒", "讨厌", "烦", "受够", "投诉", "不满", "糟糕", "差劲", "气死"],
  anxious: ["焦虑", "紧张", "担心", "压力", "害怕", "恐惧", "慌", "不安", "失眠", "担忧"],
  neutral: ["一般", "还行", "没事", "正常", "可以", "知道", "了解", "收到"]
};

export function createTaskPlan({ text, files, scenario }) {
  const modalities = detectModalities(text, files);
  return {
    id: `TASK-${Date.now().toString().slice(-6)}`,
    scenario,
    modalities,
    createdAt: new Date().toLocaleString(),
    fileTypes: files.map((file) => fileCategory(file)).filter(Boolean)
  };
}

export function preprocess({ text, files }) {
  const normalizedText = text.replace(/\s+/g, " ").trim();
  const segments = normalizedText
    ? normalizedText.split(/[。！？!?；;]/).map((item) => item.trim()).filter(Boolean)
    : ["当前素材整体片段"];

  return {
    text: normalizedText,
    segments,
    files: files.map((file) => ({
      name: file.name,
      type: file.type || "unknown",
      size: file.size,
      category: fileCategory(file)
    }))
  };
}

export function analyzeText(text) {
  if (!text) return null;
  const scores = scoreText(text);
  const top = topEmotion(scores);
  const evidence = emotionWords[top.label].filter((word) => text.includes(word));
  const confidence = clamp(0.5 + top.score * 0.075 + Math.min(text.length / 500, 0.12), 0.5, 0.93);

  return {
    modality: "文本",
    label: top.label,
    confidence,
    quality: clamp(0.55 + text.length / 240, 0.55, 0.95),
    evidence: evidence.length ? evidence.slice(0, 6) : ["未出现强情绪词，按整体语义倾向判断"],
    explanation: evidence.length
      ? `文本中出现“${evidence.slice(0, 4).join("、")}”等情绪线索。`
      : "文本情绪表达较弱，系统给出偏中性的语义判断。"
  };
}

export function analyzeAudio(files) {
  const audioFiles = files.filter((file) => file.type.startsWith("audio/") || file.type.startsWith("video/"));
  if (!audioFiles.length) return null;
  const seed = audioFiles.reduce((sum, file) => sum + file.size + file.name.length, 0);
  const label = ["anxious", "neutral", "angry", "sad"][seed % 4];

  return {
    modality: "语音",
    label,
    confidence: clamp(0.56 + audioFiles.length * 0.08, 0.56, 0.84),
    quality: clamp(0.58 + Math.min(seed / 14_000_000, 0.28), 0.55, 0.9),
    evidence: ["音频/视频文件已接入", "声学线索：音强、语速、停顿、频谱"],
    explanation: "演示版使用文件信息模拟语音情感模型输出，后续可替换为 wav2vec 或 SER 模型。"
  };
}

export function analyzeVision(files) {
  const visualFiles = files.filter((file) => file.type.startsWith("image/") || file.type.startsWith("video/"));
  if (!visualFiles.length) return null;
  const seed = visualFiles.reduce((sum, file) => sum + file.size + file.name.length * 3, 0);
  const label = ["happy", "neutral", "sad", "anxious"][seed % 4];

  return {
    modality: "视觉",
    label,
    confidence: clamp(0.55 + visualFiles.length * 0.075, 0.55, 0.84),
    quality: clamp(0.56 + Math.min(seed / 16_000_000, 0.3), 0.55, 0.9),
    evidence: ["图片/视频文件已接入", "视觉线索：表情、眼神、姿态、画面质量"],
    explanation: "演示版使用文件信息模拟视觉情感模型输出，后续可替换为表情识别或视频 Transformer。"
  };
}

export function fuseResults(results, plan) {
  const valid = results.filter(Boolean);
  const weighted = valid.reduce((acc, item) => {
    const weight = item.confidence * item.quality;
    acc[item.label] = (acc[item.label] || 0) + weight;
    return acc;
  }, {});
  const [label, score = 0.5] = Object.entries(weighted).sort((a, b) => b[1] - a[1])[0] || ["neutral", 0.5];
  const total = Object.values(weighted).reduce((sum, value) => sum + value, 0) || 1;
  const dominant = [...valid].sort((a, b) => b.confidence * b.quality - a.confidence * a.quality)[0];

  return {
    label,
    confidence: clamp(score / total + 0.22, 0.48, 0.95),
    conflict: new Set(valid.map((item) => item.label)).size > 1,
    dominantModality: dominant?.modality || plan.modalities[0] || "文本",
    distribution: Object.entries(weighted).map(([name, value]) => ({
      name: emotionNames[name],
      value: Number((value / total).toFixed(2))
    }))
  };
}

export function buildReport({ fusion, modalityResults, plan, prepared }) {
  const timeline = prepared.segments.slice(0, 6).map((segment, index) => {
    const top = segment === "当前素材整体片段" ? { label: fusion.label } : topEmotion(scoreText(segment));
    return {
      name: `片段${index + 1}`,
      text: segment,
      emotion: emotionNames[top.label],
      score: Number((0.5 + index * 0.06).toFixed(2))
    };
  });

  const advice = {
    happy: "当前表达整体积极，可继续关注正向反馈和高价值行为。",
    sad: "检测到低落倾向，建议关注持续时间、表达强度和外部支持情况。",
    angry: "检测到不满或愤怒倾向，建议优先安抚情绪、澄清诉求并降低冲突。",
    anxious: "检测到焦虑或紧张倾向，建议关注压力来源、任务负荷和后续变化。",
    neutral: "当前情绪整体平稳，建议结合更多上下文持续观察。"
  };

  return {
    taskId: plan.id,
    scenario: plan.scenario,
    createdAt: plan.createdAt,
    label: fusion.label,
    labelName: emotionNames[fusion.label],
    confidence: fusion.confidence,
    conflict: fusion.conflict,
    dominantModality: fusion.dominantModality,
    modalities: plan.modalities,
    modalityResults,
    distribution: fusion.distribution,
    timeline,
    riskLevel: ["sad", "angry", "anxious"].includes(fusion.label) ? "需要关注" : "常规关注",
    summary: `系统综合${plan.modalities.join("、") || "可用"}模态信息，判断该样本主要情绪为“${emotionNames[fusion.label]}”。`,
    advice: advice[fusion.label]
  };
}

export function answerByReport(question, report) {
  if (!report) return "请先运行一次协同分析，我才能基于报告回答问题。";
  if (question.includes("为什么") || question.includes("依据")) {
    return `主要依据来自${report.dominantModality}模态，综合情绪为“${report.labelName}”，置信度约 ${Math.round(report.confidence * 100)}%。${report.conflict ? "本次存在模态冲突，系统已按质量评分和置信度进行融合仲裁。" : "本次各模态判断较一致，结论相对稳定。"}`;
  }
  if (question.includes("哪个") || question.includes("贡献")) {
    return `当前贡献最大的模态是${report.dominantModality}，系统根据模态质量和置信度综合计算主导模态。`;
  }
  if (question.includes("建议") || question.includes("怎么")) return report.advice;
  if (question.includes("冲突")) return report.conflict ? "存在模态冲突，说明不同模态表达的情绪并不完全一致。" : "未发现明显模态冲突。";
  return `当前综合情绪为“${report.labelName}”，风险等级为“${report.riskLevel}”。你可以继续询问识别依据、主导模态、模态冲突或建议。`;
}

export function detectModalities(text, files) {
  const modalities = new Set();
  if (text.trim()) modalities.add("文本");
  files.forEach((file) => {
    const category = fileCategory(file);
    if (category === "文本") modalities.add("文本");
    if (category === "音频") modalities.add("语音");
    if (category === "图片") modalities.add("视觉");
    if (category === "视频") {
      modalities.add("语音");
      modalities.add("视觉");
    }
  });
  return [...modalities];
}

export function fileCategory(file) {
  if (file.type?.startsWith("audio/")) return "音频";
  if (file.type?.startsWith("image/")) return "图片";
  if (file.type?.startsWith("video/")) return "视频";
  if (file.name?.toLowerCase().endsWith(".txt")) return "文本";
  return "未知";
}

export function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function scoreText(text) {
  const scores = Object.fromEntries(Object.keys(emotionWords).map((label) => [label, 0]));
  Object.entries(emotionWords).forEach(([label, words]) => {
    scores[label] = words.reduce((sum, word) => sum + text.split(word).length - 1, 0);
  });
  if (/(不|没|无).{0,3}(开心|满意|喜欢|顺利)/.test(text)) {
    scores.sad += 1;
    scores.anxious += 1;
    scores.happy = Math.max(0, scores.happy - 1);
  }
  if (Object.values(scores).every((value) => value === 0)) scores.neutral = 1;
  return scores;
}

function topEmotion(scores) {
  const [label, score] = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return { label, score };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
