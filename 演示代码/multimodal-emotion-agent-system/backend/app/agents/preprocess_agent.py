from __future__ import annotations

import re

from app.agents.common import file_category
from app.schemas import AnalyzeRequest


def preprocess(request: AnalyzeRequest) -> dict:
    text = re.sub(r"\s+", " ", request.text or "").strip()
    segments = [item.strip() for item in re.split(r"[。！？!?；;]", text) if item.strip()]
    if not segments:
        segments = ["当前素材整体片段"]

    files = [
        {
            "filename": file.filename,
            "content_type": file.content_type,
            "size": file.size,
            "category": file_category(file),
        }
        for file in request.files
    ]
    return {"text": text, "segments": segments, "files": files}
