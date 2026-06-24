from __future__ import annotations

from app.agents.common import clamp
from app.schemas import AgentResult


def analyze_vision(files: list[dict]) -> AgentResult | None:
    visual_files = [
        file
        for file in files
        if str(file.get("content_type", "")).startswith("image/")
        or str(file.get("content_type", "")).startswith("video/")
        or file.get("category") in {"图片", "视频"}
    ]
    if not visual_files:
        return None

    seed = sum(int(file.get("size", 0)) + len(str(file.get("filename", ""))) * 3 for file in visual_files)
    label = ["happy", "neutral", "sad", "anxious"][seed % 4]
    return AgentResult(
        agent_name="视觉情感智能体",
        modality="视觉",
        label=label,
        confidence=clamp(0.55 + len(visual_files) * 0.075, 0.55, 0.84),
        quality=clamp(0.56 + min(seed / 16_000_000, 0.30), 0.55, 0.90),
        evidence=["图片/视频文件已接入", "视觉线索：表情、眼神、姿态、画面质量"],
        explanation="演示版使用文件信息模拟视觉情感模型输出，后续可替换为表情识别或视频 Transformer。",
    )
