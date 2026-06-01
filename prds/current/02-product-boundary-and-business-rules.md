# 02 Product Boundary and Business Rules — LingoBridge v2.0 AI Module

> 更新日期：2026-06-01
> 覆盖范围：Sprint 09 v2.0 AI 模块系统边界与禁改清单
> 与 `prds/current/00-latest-product-decisions.md` 配合使用

---

## 1. 系统边界定义

### 1.1 学生端边界

**职责：**

- 展示个人学习画像（completionRate、avgScore、riskLevel、clusterLabel、weakKnowledgePoints）
- 展示个性化推荐练习（recommendations.json）
- 展示个人排名百分位（rankPercentile）
- 查看进步趋势（可选）

**不负责：**

- 配置 AI 模型参数
- 查看其他学生的学习数据
- 上传或修改学习记录（已有 MVP 能力，不在 AI 模块扩展范围）
- ASR 语音评分配置

**数据来源：**

- 后端 `/api/v1/analytics/student-profile?studentId=xxx`（只读）
- 前端不直接读 Python output/ 目录

---

### 1.2 教师端边界

**职责：**

- 展示班级洞察 summary（高风险学生数、共性薄弱知识点、班级平均分/完成率）
- 展示学生总览列表（每行含 risk badge）
- 查看班级学生学习画像对比

**不负责：**

- 操作 Python 管线运行
- 修改学生学习记录
- 实时重算学生画像（仅读离线输出 JSON）
- 删除或编辑学生数据

**数据来源：**

- 后端 `/api/v1/analytics/class-insights?classId=xxx`（只读）

---

### 1.3 Admin 数据中台边界

**职责：**

- 查看全局学生画像列表（studentId、riskLevel、clusterLabel、completionRate、avgScore）
- 查看模型运行状态（modelVersion、modelRunAt、invalidSampleCount）
- 查看推荐总数和活跃推荐数
- 支持手动触发 Python 管线重新运行（按钮操作）

**不负责：**

- 管理教师/学生账号（已有 MVP 能力）
- 直接操作 `backend/storage/` 或 `backend/data/db.json`
- 修改真实业务数据

**数据来源：**

- 后端 `/api/v1/analytics/admin-snapshot`（只读）
- `output/admin_snapshot.json`（Admin 可触发重新运行 Python 管线）

---

### 1.4 Python 分析管线边界

**职责：**

- 生成合成样本数据（`data/sample_*.csv`）
- 预处理学生学习事件（`output/student_features.csv`）
- 训练学生画像模型（聚类 + 阈值风险分层）→ `output/student_profiles.json`
- 生成个性化推荐 → `output/recommendations.json`
- 生成班级洞察 → `output/class_insights.json`
- 生成 Admin 快照 → `output/admin_snapshot.json`

**不负责：**

- 读取真实学生录音或音频内容
- 写入 `backend/storage/`、`backend/data/db.json`、`.env*`
- 调用外部 API（除 requirements.txt 声明的依赖外）
- 直接服务前端请求（Python 管线为离线批处理）

**运行环境：**

- 默认：`uv venv` + `uv pip install -r requirements.txt`
- 兜底：`conda env create -f environment.yml`
- 不受 PM2 管理（独立运行）

---

### 1.5 后端 API 边界

**职责（Sprint 09 新增）：**

- `GET /api/v1/analytics/student-profile?studentId=xxx`：返回单学生画像 JSON
- `GET /api/v1/analytics/class-insights?classId=xxx`：返回班级洞察 JSON
- `GET /api/v1/analytics/admin-snapshot`：返回 Admin 全局快照 JSON
- `POST /api/v1/analytics/run-pipeline`：可选，手动触发 Python 管线（Admin 按钮）

**不负责：**

- 执行 Python 管线本身（管线独立运行，结果写入 output/）
- 修改业务数据库（API 为只读接口）
- 提供实时 ML 推理（所有数据来自离线管线输出 JSON）

**接口约定：**

- 所有 analytics 接口均为 `GET`（只读），不需要权限升级
- 数据直接从 `output/*.json` 读取并返回，不做二次计算
- 接口路径前缀：`/api/v1/analytics/`

---

### 1.6 前端展示边界

**职责：**

- 学生端 Dashboard 增加 AI 学习助手卡片（读取 student-profile 接口）
- 教师端课程详情页增加班级洞察 Summary（读取 class-insights 接口）
- Admin Dashboard 增加 Analytics Tab（读取 admin-snapshot 接口）

**不负责：**

- 前端不直接调用 Python 管线
- 前端不直接读取 `output/*.json`（通过后端 API 间接读取）
- 前端不实现 ML 模型或数据处理逻辑

---

### 1.7 本地演示边界

**职责：**

- Python 管线独立运行，输出 JSON 到 `output/`
- PM2 管理 `lingobridge-backend`（端口 3001）和 `lingobridge-frontend-preview`（端口 4174）
- 三端（学生/教师/Admin）通过 localhost 访问

**演示步骤：**

1. 启动 PM2：`npm run pm2:start`
2. 运行 Python 管线：`python3 analysis/ai-learning-recommendation/run_pipeline.py`
3. 访问 `http://127.0.0.1:4174`（学生/教师/Admin 各角色）
4. 验证各端 AI 数据展示

**PM2 管理范围（不得改动）：**

- `lingobridge-backend`：`tsx backend/src/server.ts`，端口 3001
- `lingobridge-frontend-preview`：`vite preview --host 127.0.0.1 --port 4174 --strictPort`

---

## 2. Sprint 09 范围 vs 非范围

### 2.1 属于本 Sprint（Do）

- [x] S9-T00：执行环境治理护栏（已完成）
- [ ] S9-T01：数据指标与系统边界冻结（本任务）
- [ ] S9-T02：Python 数据管线实现（合成样本 + 画像 + 推荐）
- [ ] S9-T03：后端 analytics API 接口
- [ ] S9-T04：前端 AI 展示卡片/面板

### 2.2 不属于本 Sprint（Don't）

- ~~实时 ASR 语音评分接入~~
- ~~在线模型训练和部署~~
- ~~多租户 SaaS 数据隔离~~
- ~~LLM 生成推荐理由（用可解释规则替代）~~
- ~~实时 ML 推理 API~~
- ~~生产级 Kubernetes 部署~~

---

## 3. 核心业务规则（v2.0 AI 模块补充）

| 编号 | 规则 | 说明 |
|------|------|------|
| R-AI-01 | Python 管线为离线批处理 | 不提供实时推理，每次展示前需先运行管线 |
| R-AI-02 | analytics 接口为只读 | 不修改业务数据库，只返回 output/ 下的 JSON |
| R-AI-03 | 合成样本优先于真实数据 | MVP 阶段用合成样本建模，展示用 mock 数据 |
| R-AI-04 | 推荐理由用规则生成 | 不调用 LLM API，用阈值+特征组合生成 reason |
| R-AI-05 | 学生姓名脱敏 | Admin 和教师端不显示真实学生姓名，只显示 studentId |
| R-AI-06 | 班级洞察基于聚合数据 | 不暴露单一生学学生的详细学习记录给教师 |
| R-AI-07 | Python 管线独立于 PM2 | Python 脚本不受 PM2 管理，可独立运行 |
| R-AI-08 | MVP 主流程不变 | AI 模块不改动现有登录、课程、作业、录音、提交流程 |

---

## 4. 禁改模块与禁改数据

### 4.1 绝对禁止改动

| 路径 | 原因 |
|------|------|
| `backend/storage/` | 真实上传文件、录音文件存储目录 |
| `backend/data/db.json` | 真实运行数据，禁止 AI 模块读取或修改 |
| `.env*` | 密钥、token、数据库凭证 |
| `src/components/TeacherClassroomView.tsx` | 媒体权限逻辑，禁改 |
| `src/components/StudentClassroomView.tsx` | 媒体权限逻辑，禁改 |
| `src/components/HomeworkView.tsx` | 录音/提交/草稿逻辑，禁改 |
| `backend/src/providers/` | TTS/Speech Provider，禁改 |
| `docker/` | 容器部署配置，禁改 |
| `vercel.json` | Vercel 部署配置，禁改 |

### 4.2 临时文件禁止提交

| 路径 | 原因 |
|------|------|
| `output/playwright/*` | Playwright E2E 截图和临时文件 |
| `test-results/*` | 测试临时报告 |
| `task-summary-*.md` | 任务执行摘要，workspace 本地文件 |
| `node_modules/` | 依赖目录 |
| `*.log` | 日志文件 |

---

## 5. 后续 Agent 开工前必读文件

| 文件 | 原因 |
|------|------|
| `prds/json/sprint09-prd-260601-v2.0.json` | Sprint 09 完整任务定义和数据契约 |
| `prds/current/00-latest-product-decisions.md` | v2.0 最新产品决策 |
| `prds/current/02-product-boundary-and-business-rules.md` | 本文件，系统边界和禁改清单 |
| `docs/03-testing-deployment/ai-v2-demo-runbook.md` | PM2 命令、Python 管线运行、三端访问 |
| `analysis/ai-learning-recommendation/README.md` | AI 模块目录结构和环境配置 |
| `context/context.txt` | Sprint 执行历史和踩坑记录 |
| `.agent/rules/mvp-scope.md` | MVP 范围规则 |
| `.agent/rules/project-map.md` | 项目目录结构速查 |
| `src/services/apiClient.ts` | 前端 API 客户端，已有 completionRate、avgScore 类型 |
| `backend/src/app.ts` | 后端 Express，已有 `/api/v1/analytics/student-profile` 路由（未来） |

---

## 6. 数据契约引用

完整 dataContract 定义见 `prds/json/sprint09-prd-260601-v2.0.json` 的 `dataContract` 字段：

| 产出 | 文件 | 说明 |
|------|------|------|
| StudentLearningProfile | `output/student_profiles.json` | 含 riskLevel、clusterLabel、weakKnowledgePoints |
| PracticeRecommendation | `output/recommendations.json` | 含 title、reason、priority、sourceSignals |
| ClassInsight | `output/class_insights.json` | 含 highRiskStudents、commonWeakKnowledgePoints |
| AdminAnalyticsSnapshot | `output/admin_snapshot.json` | 含 modelVersion、modelRunAt、invalidSampleCount |