from __future__ import annotations

import re

from app.agents.common import EMOTION_WORDS, clamp
from app.schemas import AgentResult, EmotionLabel


def analyze_text(text: str) -> AgentResult | None:
    if not text:
        return None

    scores = _score_text(text)
    label, score = max(scores.items(), key=lambda item: item[1])
    evidence = [word for word in EMOTION_WORDS[label] if word in text][:6]
    confidence = clamp(0.50 + score * 0.075 + min(len(text) / 500, 0.12), 0.50, 0.93)
    quality = clamp(0.55 + len(text) / 240, 0.55, 0.95)

    return AgentResult(
        agent_name="文本情感智能体",
        modality="文本",
        label=label,
        confidence=confidence,
        quality=quality,
        evidence=evidence or ["未出现强情绪词，按整体语义倾向判断"],
        explanation=(
            f"文本中出现“{'、'.join(evidence[:4])}”等情绪线索。"
            if evidence
            else "文本情绪表达较弱，系统给出偏中性的语义判断。"
        ),
    )


def _score_text(text: str) -> dict[EmotionLabel, int]:
    scores: dict[EmotionLabel, int] = {label: 0 for label in EMOTION_WORDS}
    for label, words in EMOTION_WORDS.items():
        scores[label] = sum(text.count(word) for word in words)
    if re.search(r"(不|没|无).{0,3}(开心|满意|喜欢|顺利)", text):
        scores["sad"] += 1
        scores["anxious"] += 1
        scores["happy"] = max(0, scores["happy"] - 1)
    if all(value == 0 for value in scores.values()):
        scores["neutral"] = 1
    return scores
