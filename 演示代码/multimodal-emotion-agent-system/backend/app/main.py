from __future__ import annotations

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse

from app.agents import answer_question
from app.schemas import AnalyzeRequest, AnalyzeResponse, FileMeta, QaRequest, QaResponse
from app.services.task_service import TaskService

app = FastAPI(title="多模态情感识别多智能体协同自助系统 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

task_service = TaskService()


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "service": "multimodal-emotion-agent-api"}


@app.post("/api/analyze", response_model=AnalyzeResponse)
def analyze(request: AnalyzeRequest) -> AnalyzeResponse:
    report = task_service.analyze(request)
    return AnalyzeResponse(task_id=report.task_id, report=report)


@app.post("/api/analyze-form", response_model=AnalyzeResponse)
async def analyze_form(
    scenario: str = Form("课堂学习状态分析"),
    text: str = Form(""),
    files: list[UploadFile] = File(default=[]),
) -> AnalyzeResponse:
    metas = [
        FileMeta(
            filename=file.filename or "unknown",
            content_type=file.content_type or "application/octet-stream",
            size=len(await file.read()),
        )
        for file in files
    ]
    request = AnalyzeRequest(scenario=scenario, text=text, files=metas)
    report = task_service.analyze(request)
    return AnalyzeResponse(task_id=report.task_id, report=report)


@app.post("/api/qa", response_model=QaResponse)
def qa(request: QaRequest) -> QaResponse:
    return QaResponse(answer=answer_question(request.question, request.report))


@app.post("/api/export-report", response_class=PlainTextResponse)
def export_report(request: AnalyzeRequest) -> str:
    report = task_service.analyze(request)
    lines = [
        "面向多模态情感识别的多智能体协同自助系统分析报告",
        f"任务编号：{report.task_id}",
        f"生成时间：{report.created_at}",
        f"应用场景：{report.scenario}",
        f"综合情绪：{report.label_name}",
        f"综合置信度：{round(report.confidence * 100)}%",
        f"主导模态：{report.dominant_modality}",
        f"风险等级：{report.risk_level}",
        "",
        "总体结论：",
        report.summary,
        "",
        "建议：",
        report.advice,
    ]
    return "\n".join(lines)
