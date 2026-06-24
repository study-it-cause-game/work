# 面向多模态情感识别的多智能体协同自助系统

这是一个用于课程作业展示的全栈工程项目，主题为“面向多模态情感识别的多智能体协同自助系统”。项目包含 **React 前端** 和 **Python FastAPI 后端**，实现素材上传、任务规划、智能体协同、情感分析报告、自助问答和报告导出等功能。

> 当前版本是课程原型。Python 后端已经实现完整接口和多智能体模块，但暂未接入真实深度学习模型。文本情感使用规则与关键词模拟，语音和视觉情感基于上传文件信息模拟。后续可以把对应智能体替换为真实模型。

## 一、项目功能

- 文本输入：支持输入对话文本、评论、访谈转写内容。
- 多媒体上传：支持音频、图片、视频和 txt 文件。
- 多智能体协同：模拟任务规划、数据预处理、文本情感、语音情感、视觉情感、融合决策、解释生成和自助问答智能体。
- 情感分析报告：输出综合情绪、置信度、主导模态、风险等级、模态冲突说明和建议。
- 可视化展示：使用 Recharts 展示情绪时间轴。
- 自助问答：基于当前报告回答“为什么这样判断”“哪个模态贡献最大”“有什么建议”等问题。
- 报告导出：支持导出 txt 格式分析报告。

## 二、技术栈

- React 19
- Vite 6
- lucide-react
- Recharts
- Python 3.10+
- FastAPI
- Uvicorn
- Pydantic

## 三、运行方式

进入项目目录：

```bash
cd multimodal-emotion-agent-system
```

### 1. 启动 Python 后端

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

后端启动后访问：

```text
http://localhost:8000/api/health
```

### 2. 启动 React 前端

打开另一个终端，回到项目根目录：

```bash
cd multimodal-emotion-agent-system
npm install
npm run dev
```

浏览器访问：

```bash
http://localhost:5173
```

前端默认调用：

```text
http://localhost:8000
```

如果需要修改后端地址，可以创建 `.env` 文件：

```bash
VITE_API_BASE=http://localhost:8000
```

### 3. 打包前端

```bash
npm run build
```

预览打包结果：

```bash
npm run preview
```

## 四、项目结构

```text
multimodal-emotion-agent-system/
├─ index.html
├─ package.json
├─ vite.config.js
├─ README.md
├─ backend/
│  ├─ requirements.txt
│  └─ app/
│     ├─ main.py
│     ├─ schemas.py
│     ├─ agents/
│     │  ├─ planner_agent.py
│     │  ├─ preprocess_agent.py
│     │  ├─ text_agent.py
│     │  ├─ audio_agent.py
│     │  ├─ vision_agent.py
│     │  ├─ fusion_agent.py
│     │  ├─ report_agent.py
│     │  └─ qa_agent.py
│     └─ services/
│        └─ task_service.py
├─ docs/
│  └─ design-notes.md
└─ src/
   ├─ main.jsx
   ├─ App.jsx
   ├─ analysisEngine.js
   └─ styles.css
```

## 五、智能体设计

| 智能体 | 作用 |
| --- | --- |
| 任务规划智能体 | 识别素材类型，拆解多模态任务 |
| 数据预处理智能体 | 清洗文本、识别文件类型、生成片段 |
| 文本情感智能体 | 基于关键词与语义规则识别文本情绪 |
| 语音情感智能体 | 模拟音频或视频中的声学情绪线索 |
| 视觉情感智能体 | 模拟图片或视频中的表情与姿态线索 |
| 融合决策智能体 | 根据模态质量和置信度融合结果 |
| 解释生成智能体 | 生成结构化情感分析报告 |
| 自助问答智能体 | 基于报告上下文回答用户追问 |

## 六、后续扩展

- 将 `backend/app/agents` 中的模拟智能体替换为真实模型。
- 增加用户登录、任务历史、报告管理和数据库存储。
- 将融合模块升级为跨模态 Transformer 或图神经网络。
- 增加 Docker 部署文件和 GitHub Actions。

## 七、注意事项

本系统仅用于课程作业和技术原型展示，不能用于医学诊断、心理诊断或强制性人员评价。情绪识别结果只适合作为辅助参考。
