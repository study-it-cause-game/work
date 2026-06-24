from __future__ import annotations

from app.schemas import AnalysisReport


def answer_question(question: str, report: AnalysisReport | None) -> str:
    if report is None:
        return "请先运行一次协同分析，我才能基于报告回答问题。"

    if "为什么" in question or "依据" in question:
        conflict_text = "本次存在模态冲突，系统已按质量评分和置信度进行融合仲裁。" if report.conflict else "本次各模态判断较一致，结论相对稳定。"
        return f"主要依据来自{report.dominant_modality}模态，综合情绪为“{report.label_name}”，置信度约 {round(report.confidence * 100)}%。{conflict_text}"
    if "哪个" in question or "贡献" in question:
        return f"当前贡献最大的模态是{report.dominant_modality}，系统根据模态质量和置信度综合计算主导模态。"
    if "建议" in question or "怎么" in question:
        return report.advice
    if "冲突" in question:
        return "存在模态冲突，说明不同模态表达的情绪并不完全一致。" if report.conflict else "未发现明显模态冲突。"
    return f"当前综合情绪为“{report.label_name}”，风险等级为“{report.risk_level}”。你可以继续询问识别依据、主导模态、模态冲突或建议。"
