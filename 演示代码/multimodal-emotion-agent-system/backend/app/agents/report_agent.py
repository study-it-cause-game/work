from __future__ import annotations

from datetime import datetime

from app.agents.common import EMOTION_NAMES, EMOTION_WORDS
from app.schemas import AgentResult, AnalysisReport, TimelineItem


ADVICE = {
    "happy": "当前表达整体积极，可继续关注正向反馈和高价值行为。",
    "sad": "检测到低落倾向，建议关注持续时间、表达强度和外部支持情况。",
    "angry": "检测到不满或愤怒倾向，建议优先安抚情绪、澄清诉求并降低冲突。",
    "anxious": "检测到焦虑或紧张倾向，建议关注压力来源、任务负荷和后续变化。",
    "neutral": "当前情绪整体平稳，建议结合更多上下文持续观察。",
}


def build_report(
    *,
    plan: dict,
    prepared: dict,
    results: list[AgentResult],
    fusion: dict,
) -> AnalysisReport:
    label = fusion["label"]
    timeline = _build_timeline(prepared["segments"], label)
    modalities = plan.get("modalities", [])
    return AnalysisReport(
        task_id=plan["task_id"],
        scenario=plan["scenario"],
        created_at=datetime.now(),
        label=label,
        label_name=EMOTION_NAMES[label],
        confidence=fusion["confidence"],
        risk_level="需要关注" if label in {"sad", "angry", "anxious"} else "常规关注",
        dominant_modality=fusion["dominant_modality"],
        conflict=fusion["conflict"],
        modalities=modalities,
        summary=f"系统综合{'、'.join(modalities) if modalities else '可用'}模态信息，判断该样本主要情绪为“{EMOTION_NAMES[label]}”。",
        advice=ADVICE[label],
        modality_results=results,
        timeline=timeline,
        distribution=fusion["distribution"],
    )


def _build_timeline(segments: list[str], fallback_label: str) -> list[TimelineItem]:
    items: list[TimelineItem] = []
    for index, segment in enumerate(segments[:6]):
        label = _segment_label(segment) if segment != "当前素材整体片段" else fallback_label
        items.append(
            TimelineItem(
                name=f"片段{index + 1}",
                text=segment,
                emotion=EMOTION_NAMES[label],
                score=round(0.50 + index * 0.06, 2),
            )
        )
    return items


def _segment_label(segment: str) -> str:
    scores = {label: sum(segment.count(word) for word in words) for label, words in EMOTION_WORDS.items()}
    if all(value == 0 for value in scores.values()):
        return "neutral"
    return max(scores.items(), key=lambda item: item[1])[0]
