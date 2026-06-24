from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


EmotionLabel = Literal["happy", "sad", "angry", "anxious", "neutral"]


class FileMeta(BaseModel):
    filename: str
    content_type: str = "application/octet-stream"
    size: int = 0
    category: str = "未知"


class AnalyzeRequest(BaseModel):
    scenario: str = "课堂学习状态分析"
    text: str = ""
    files: list[FileMeta] = Field(default_factory=list)


class AgentResult(BaseModel):
    agent_name: str
    modality: str
    label: EmotionLabel
    confidence: float
    quality: float
    evidence: list[str] = Field(default_factory=list)
    explanation: str


class TimelineItem(BaseModel):
    name: str
    text: str
    emotion: str
    score: float


class EmotionDistributionItem(BaseModel):
    name: str
    value: float


class AnalysisReport(BaseModel):
    task_id: str
    scenario: str
    created_at: datetime
    label: EmotionLabel
    label_name: str
    confidence: float
    risk_level: str
    dominant_modality: str
    conflict: bool
    modalities: list[str]
    summary: str
    advice: str
    modality_results: list[AgentResult]
    timeline: list[TimelineItem]
    distribution: list[EmotionDistributionItem]


class AnalyzeResponse(BaseModel):
    task_id: str
    report: AnalysisReport


class QaRequest(BaseModel):
    question: str
    report: AnalysisReport | None = None


class QaResponse(BaseModel):
    answer: str
