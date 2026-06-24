from __future__ import annotations

from app.agents.common import EMOTION_NAMES, clamp
from app.schemas import AgentResult, EmotionDistributionItem


def fuse_results(results: list[AgentResult]) -> dict:
    valid = [result for result in results if result is not None]
    if not valid:
        return {
            "label": "neutral",
            "confidence": 0.50,
            "conflict": False,
            "dominant_modality": "文本",
            "distribution": [EmotionDistributionItem(name="中性/平稳", value=1.0)],
        }

    weighted: dict[str, float] = {}
    for result in valid:
        weighted[result.label] = weighted.get(result.label, 0.0) + result.confidence * result.quality

    label, score = max(weighted.items(), key=lambda item: item[1])
    total = sum(weighted.values()) or 1.0
    dominant = max(valid, key=lambda item: item.confidence * item.quality)
    distribution = [
        EmotionDistributionItem(name=EMOTION_NAMES[name], value=round(value / total, 2))
        for name, value in weighted.items()
    ]

    return {
        "label": label,
        "confidence": clamp(score / total + 0.22, 0.48, 0.95),
        "conflict": len({item.label for item in valid}) > 1,
        "dominant_modality": dominant.modality,
        "distribution": distribution,
    }
