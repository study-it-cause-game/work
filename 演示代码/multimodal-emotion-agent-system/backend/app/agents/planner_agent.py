from __future__ import annotations

from uuid import uuid4

from app.agents.common import detect_modalities, file_category
from app.schemas import AnalyzeRequest


def create_plan(request: AnalyzeRequest) -> dict:
    return {
        "task_id": f"TASK-{uuid4().hex[:8].upper()}",
        "scenario": request.scenario,
        "modalities": detect_modalities(request.text, request.files),
        "file_types": [file_category(file) for file in request.files],
    }
