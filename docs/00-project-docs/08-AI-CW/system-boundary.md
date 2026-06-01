# 系统边界说明 — LingoBridge v2.0 AI 学习推荐模块

> 版本：v1.0.0
> 更新日期：2026-06-01
> 覆盖范围：Sprint 09 v2.0 AI 模块各层系统边界定义
> 关联文件：`prds/json/sprint09-prd-260601-v2.0.json`、`prds/current/02-product-boundary-and-business-rules.md`

---

## 1. 各层边界定义

### 1.1 学生端边界

**AI 展示职责：**

- 读取 `GET /api/v1/analytics/student-profile?studentId=xxx`
- 展示个人学习画像：completionRate、avgScore、riskLevel、clusterLabel、weakKnowledgePoints 前 3
- 展示个性化推荐练习：title、reason、priority、sourceSignals
- 展示排名百分位：rankPercentile

**不做：**

- 不直接调用 Python 管线
- 不直接读取 `output/*.json`
- 不修改任何学习记录
- 不配置 AI 模型参数

**AI 感展示 vs 真实数据：**

| 内容 | 类型 | 说明 |
|------|------|------|
| riskLevel badge | **真实计算** | Python 管线基于阈值规则计算，非 mock |
| clusterLabel | **真实计算** | Python 管线基于聚类，非 mock |
| weakKnowledgePoints 前 3 | **真实计算** | Python 管线聚合低分记录，非 mock |
| 推荐练习 title | **真实计算** | Python 管线基于薄弱点推荐，非 mock |
| 推荐理由 reason | **规则生成** | 阈值规则生成，**非 LLM** |
| 排名 rankPercentile | **真实计算** | Python 管线综合排序，非 mock |
| completionRate 数字 | **已有 MVP** | 复用 `backend/src/app.ts` 已有实现 |
| avgScore 数字 | **已有 MVP** | 复用 `backend/src/app.ts` 已有实现 |

---

### 1.2 教师端边界

**AI 展示职责：**

- 读取 `GET /api/v1/analytics/class-insights?classId=xxx`
- 展示班级洞察 Summary：高风险学生数、共性薄弱知识点、班级平均分/完成率
- 展示学生总览列表：每行含 risk badge，按 riskLevel 排序

**不做：**

- 不操作 Python 管线运行
- 不查看单个学生的详细学习记录细节（仅展示聚合数据）
- 不修改学生数据

**AI 感展示 vs 真实数据：**

| 内容 | 类型 | 说明 |
|------|------|------|
| 高风险学生数 | **真实计算** | Python 管线聚合并返回，非 mock |
| 共性薄弱知识点 | **真实计算** | Python 管线聚合所有学生 weakKnowledgePoints |
| 班级平均分 | **已有 MVP** | 复用后端现有聚合逻辑 |
| 学生 risk badge | **真实计算** | Python 管线返回，非 mock |
| 班级洞察柱状图 | **AI 感展示** | 基于真实数据渲染，前端 mock 图表组件 |

---

### 1.3 Admin 数据中台边界

**AI 展示职责：**

- 读取 `GET /api/v1/analytics/admin-snapshot`
- 展示全局学生画像列表（脱敏 studentId、riskLevel、clusterLabel、completionRate、avgScore）
- 展示模型运行状态：modelVersion、modelRunAt、invalidSampleCount、recommendationCount
- 按钮触发 Python 管线重新运行（`POST /api/v1/analytics/run-pipeline`）

**不做：**

- 不直接操作 `backend/storage/`、`backend/data/db.json`
- 不修改真实业务数据
- 不显示真实学生姓名（studentId 脱敏）

**AI 感展示 vs 真实数据：**

| 内容 | 类型 | 说明 |
|------|------|------|
| 学生画像列表 | **真实计算** | Python 管线输出，前端展示 |
| modelVersion | **真实记录** | Python 管线每次运行写入 output/admin_snapshot.json |
| modelRunAt | **真实记录** | Python 管线运行时间戳 |
| invalidSampleCount | **真实统计** | Python 管线统计无足够数据的样本 |
| 管线重新运行按钮 | **真实操作** | POST 触发 Python 脚本，刷新 output/ |

---

### 1.4 Python 分析管线边界

**职责：**

- 独立运行，不受 PM2 管理
- 输入：`data/sample_*.csv`（合成样本），不读取真实业务数据
- 输出：`output/*.json`（student_profiles.json、recommendations.json、class_insights.json、admin_snapshot.json）
- 不调用外部付费 API
- 不读取音频内容

**不做：**

- 不直接服务 HTTP 请求
- 不修改 `backend/storage/`、`backend/data/db.json`、`.env*`
- 不提交到业务数据库
- 不读取真实学生录音或上传文件

**运行环境：**

```bash
# 推荐
uv venv && uv pip install -r requirements.txt
python3 run_pipeline.py

# 兜底
conda env create -f environment.yml && conda activate lingobridge-ai-v2
python3 run_pipeline.py
```

---

### 1.5 后端 API 边界

**Sprint 09 新增接口（只读）：**

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/v1/analytics/student-profile` | GET | 返回 `output/student_profiles.json` 中指定学生数据 |
| `/api/v1/analytics/class-insights` | GET | 返回 `output/class_insights.json` |
| `/api/v1/analytics/admin-snapshot` | GET | 返回 `output/admin_snapshot.json` |
| `/api/v1/analytics/run-pipeline` | POST | 触发 Python 管线运行（可选，Admin 按钮） |

**不做：**

- 不执行 Python 管线本身（管线独立运行）
- 不做实时 ML 推理
- 不修改业务数据库

**接口约束：**

- 所有 analytics 接口为 `GET`（只读），无需权限升级
- 数据直接从 `output/*.json` 读取并返回，不做二次计算
- `POST /api/v1/analytics/run-pipeline` 仅 Admin 可调用

---

### 1.6 前端展示边界

**职责：**

- 学生端 Dashboard 增加 AI 学习助手卡片（调用 student-profile 接口）
- 教师端课程详情页增加班级洞察 Summary（调用 class-insights 接口）
- Admin Dashboard 增加 Analytics Tab（调用 admin-snapshot 接口）

**不做：**

- 不直接调用 Python 管线
- 不直接读取 `output/*.json`（通过后端 API 间接读取）
- 不实现 ML 模型或数据处理逻辑

**图表/UI 组件：**

- riskLevel badge：颜色区分（Low=绿、Medium=黄、High=红）
- completionRate：进度条或圆环图
- weakKnowledgePoints：列表前 3 项
- 推荐练习卡片：列表最多 2 条，含 reason
- 班级洞察柱状图：可选，前端 mock 图表组件

---

### 1.7 本地演示边界

**职责：**

- PM2 管理 `lingobridge-backend`（tsx 3001）和 `lingobridge-frontend-preview`（vite 4174）
- Python 管线独立运行（不受 PM2 管理）
- 三端通过 `http://127.0.0.1:4174` 访问

**演示步骤（详见 `docs/03-testing-deployment/ai-v2-demo-runbook.md`）：**

```bash
# 1. 启动 PM2
npm run pm2:start

# 2. 运行 Python 管线
python3 analysis/ai-learning-recommendation/run_pipeline.py

# 3. 验证输出时间戳
ls -la analysis/ai-learning-recommendation/output/*.json

# 4. 访问三端
# 学生：http://127.0.0.1:4174/student
# 教师：http://127.0.0.1:4174/teacher
# Admin：http://127.0.0.1:4174/admin
```

---

## 2. 禁改边界清单

### 2.1 绝对禁止改动

| 路径 | 原因 |
|------|------|
| `backend/storage/` | 真实上传文件、录音文件存储目录 |
| `backend/data/db.json` | 真实运行数据，禁止 AI 模块读取或修改 |
| `.env*` | 密钥、token、数据库凭证 |
| `src/components/TeacherClassroomView.tsx` | 教师端媒体权限逻辑，禁改 |
| `src/components/StudentClassroomView.tsx` | 学生端媒体权限逻辑，禁改 |
| `src/components/HomeworkView.tsx` | 录音/提交/草稿逻辑，禁改 |
| `backend/src/providers/` | TTS/Speech Provider，禁改 |
| `docker/` | 容器部署配置，禁改 |
| `vercel.json` | Vercel 部署配置，禁改 |

### 2.2 禁止提交的临时文件

| 路径 | 原因 |
|------|------|
| `output/playwright/*` | Playwright E2E 截图和临时文件 |
| `test-results/*` | 测试临时报告 |
| `task-summary-*.md` | 任务执行摘要，workspace 本地文件 |
| `node_modules/` | 依赖目录 |

### 2.3 MVP 主流程禁改

| 模块 | 原因 |
|------|------|
| 登录/注册流程 | MVP 核心流程，AI 模块不扩展权限体系 |
| 课程/课件上传 | MVP 核心流程，AI 模块仅读取 metadata |
| Excel 作业导入 | MVP 核心流程，Python 管线仅用导入结果数据 |
| 录音/作业提交 | MVP 核心流程，AI 模块仅用完成状态元数据 |
| 实时 live classroom | MVP 核心流程，AI 模块不改动媒体逻辑 |

---

## 3. 后续 Agent 开工前必读文件

| 文件 | 原因 |
|------|------|
| `prds/json/sprint09-prd-260601-v2.0.json` | Sprint 09 完整任务定义、dataContract、mandatoryAgentDiscipline |
| `prds/current/00-latest-product-decisions.md` | v2.0 产品定位、受众价值、MVP 可复用能力 |
| `prds/current/02-product-boundary-and-business-rules.md` | 系统边界、禁改清单、业务规则补充 |
| `docs/03-testing-deployment/ai-v2-demo-runbook.md` | PM2 命令、Python 管线运行、三端访问、Sprint Review 闸门 |
| `docs/00-project-docs/08-AI-CW/data-metric-dictionary.md` | 10 个 AI 指标的定义、来源、计算口径、实现状态 |
| `analysis/ai-learning-recommendation/README.md` | AI 模块目录结构、环境配置、禁止事项 |
| `context/context.txt` | Sprint 执行历史和踩坑记录 |
| `.agent/rules/mvp-scope.md` | MVP 范围规则 |
| `.agent/rules/project-map.md` | 项目目录结构速查 |
| `src/services/apiClient.ts` | 前端 API 客户端，已有 completionRate、avgScore 类型定义 |
| `backend/src/app.ts` | 后端 Express，已有 completionRate/avgScore 计算逻辑 |

---

## 4. 验证命令速查

```bash
# JSON PRD 格式校验
python3 -m json.tool prds/json/sprint09-prd-260601-v2.0.json > /dev/null && echo "JSON OK"

# 指标字段扫描
rg -n "completionRate|avgScore|recordingCoverageRate|riskLevel|clusterLabel|rankPercentile|recommendationReason" \
  docs/00-project-docs/08-AI-CW \
  prds/current

# 私有路径扫描
rg -n "/Users/|file:///Users|OPENAI_API_KEY|JWT_SECRET|password" \
  docs/00-project-docs/08-AI-CW \
  prds/current

# Git 状态
git status --short --branch

# PM2 状态（演示前必须检查）
pm2 status
```