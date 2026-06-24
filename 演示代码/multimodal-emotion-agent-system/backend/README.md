# Backend API

这是“面向多模态情感识别的多智能体协同自助系统”的 Python 后端，使用 FastAPI 实现。

## 启动

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 接口

| 接口 | 方法 | 说明 |
| --- | --- | --- |
| `/api/health` | GET | 健康检查 |
| `/api/analyze` | POST | JSON 方式提交分析任务 |
| `/api/analyze-form` | POST | 表单方式提交文本和文件 |
| `/api/qa` | POST | 基于报告进行自助问答 |
| `/api/export-report` | POST | 导出文本报告 |

## 智能体模块

- `planner_agent.py`：任务规划
- `preprocess_agent.py`：数据预处理
- `text_agent.py`：文本情感识别
- `audio_agent.py`：语音情感识别
- `vision_agent.py`：视觉情感识别
- `fusion_agent.py`：多模态融合决策
- `report_agent.py`：报告生成
- `qa_agent.py`：自助问答

当前版本使用规则和文件信息模拟模型输出，方便课程作业跑通流程。后续可替换为 PyTorch 模型或调用大模型接口。
