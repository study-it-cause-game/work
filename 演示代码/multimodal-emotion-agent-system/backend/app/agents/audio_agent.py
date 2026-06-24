from __future__ import annotations

from app.agents.common import clamp
from app.schemas import AgentResult


def analyze_audio(files: list[dict]) -> AgentResult | None:
    audio_files = [
        file
        for file in files
        if str(file.get("content_type", "")).startswith("audio/")
        or str(file.get("content_type", "")).startswith("video/")
        or file.get("category") in {"音频", "视频"}
    ]
    if not audio_files:
        return None

    seed = sum(int(file.get("size", 0)) + len(str(file.get("filename", ""))) for file in audio_files)
    label = ["anxious", "neutral", "angry", "sad"][seed % 4]
    return AgentResult(
        agent_name="语音情感智能体",
        modality="语音",
        label=label,
        confidence=clamp(0.56 + len(audio_files) * 0.08, 0.56, 0.84),
        quality=clamp(0.58 + min(seed / 14_000_000, 0.28), 0.55, 0.90),
        evidence=["音频/视频文件已接入", "声学线索：音强、语速、停顿、频谱"],
        explanation="演示版使用文件信息模拟语音情感模型输出，后续可替换为 wav2vec 或 SER 模型。",
    )
