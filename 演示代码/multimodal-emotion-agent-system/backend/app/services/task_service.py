from __future__ import annotations

from app.agents import (
    analyze_audio,
    analyze_text,
    analyze_vision,
    build_report,
    create_plan,
    fuse_results,
    preprocess,
)
from app.schemas import AnalysisReport, AnalyzeRequest


class TaskService:
    def analyze(self, request: AnalyzeRequest) -> AnalysisReport:
        plan = create_plan(request)
        prepared = preprocess(request)
        results = [
            result
            for result in [
                analyze_text(prepared["text"]),
                analyze_audio(prepared["files"]),
                analyze_vision(prepared["files"]),
            ]
            if result is not None
        ]
        fusion = fuse_results(results)
        return build_report(plan=plan, prepared=prepared, results=results, fusion=fusion)
