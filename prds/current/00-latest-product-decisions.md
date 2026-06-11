# 00 Latest Product Decisions — LingoBridge v2.0 AI Learning Recommendation

> 更新日期：2026-06-01
> 覆盖范围：Sprint 09 v2.0 AI 模块新增产品决策
> 定位：Sprint 09 执行期间的唯一产品决策快照，每次 Sprint 开始前更新
> 与 `prds/current/02-product-boundary-and-business-rules.md` 配合使用

---

## 1. 产品定位与目标受众

### 1.1 v2.0 模块定位

**课程大作业展示导向 AI 系统**，不是生产级机器学习闭环。

目标：

- 让教师在课程大作业答辩/展示场景中，有可讲解的 AI 学习分析能力
- 让学生在个人学习报告中看到个性化练习推荐，提升学习体验
- 让 admin 在数据中台看到全班/全校的学习状态概览

不追求：

- 实时在线模型训练和部署
- ASR 语音评分接入真实评分闭环
- 多租户 SaaS 化数据隔离
- 99.9% 可用性的生产 ML 服务

### 1.2 受众与核心价值

| 角色 | 核心价值 | AI 展示方式 |
|------|----------|-------------|
| 学生 | 看到个人学习画像和个性化练习建议 | riskLevel badge + 推荐练习卡片 + 排名 |
| 教师 | 看到班级共性薄弱点和重点关注学生 | 班级洞察 summary + 高风险学生列表 + 班级平均分 |
| Admin | 全局数据中台，模型运行状态 | 全体学生数、模型版本、最新运行时间、推荐总数 |

---

## 2. 学生端产品决策

### 2.1 个人学习画像卡

位置：学生端 Dashboard 或 Profile 页

展示内容：

- **学习进度圆环**：completionRate，可视化为圆形进度条
- **综合得分**：avgScore，显示为数字均分
- **风险等级 badge**：riskLevel，显示 Low/Medium/High，带颜色
- **学习画像标签**：clusterLabel，显示 steady_leader / needs_recording_practice / tone_weakness / low_activity / fast_improver
- **薄弱知识点前 3**：weakKnowledgePoints，取前 3 个

数据来源：

- Python 管线输出 `output/student_profiles.json`
- 前端通过 API 接口读取 JSON 文件内容（Mock 模式），或通过后端 `/api/v1/analytics/student-profile` 只读接口获取

### 2.2 个性化推荐练习

位置：学生端 Dashboard 或推荐 Tab

展示内容：

- **推荐练习列表**：最多前 2 条，含 title、reason、priority、sourceSignals
- **推荐理由**：recommendationReason，从 sourceSignals 聚合生成

展示约束：

- 推荐仅基于当前 MVP 已有的学习任务、录音记录和完成状态
- 不引入新的 ASR 评分数据作为推荐输入
- 推荐理由使用可解释规则生成，不使用 LLM API

### 2.3 排行榜

位置：学生端排行榜 Tab

展示内容：

- **个人排名百分位**：rankPercentile，显示为 Top X%
- **班级排名**：按 completionRate + avgScore 综合排序
- **进步趋势**：progressTrend（可选），展示近 7 天趋势

展示约束：

- 排行榜数据从 `output/student_profiles.json` 读取，不实时查询数据库
- 排名仅用于展示，不做竞赛或竞争性激励设计

---

## 3. 教师端产品决策

### 3.1 班级洞察 Summary

位置：教师端课程详情页或班级学生列表页

展示内容：

- **班级平均完成率**：所有学生的 completionRate 平均
- **班级平均分**：所有学生的 avgScore 平均
- **高风险学生数**：riskLevel = high 的学生数量
- **共性薄弱知识点**：从所有学生 weakKnowledgePoints 聚合，取频率最高的前 3 个

数据来源：

- Python 管线输出 `output/class_insights.json`
- 前端通过后端只读 API 获取，教师端不直接读 Python output 目录

### 3.2 学生总览列表

位置：教师端学生管理页

展示内容：

- 每行学生显示 risk badge（Low / Medium / High）
- 按 riskLevel 排序，高风险在前
- 显示 completionRate、avgScore

展示约束：

- 学生数据从后端 `/api/v1/analytics/class-insights` 接口读取
- 不做实时计算，所有数据来源于 Python 管线的离线输出 JSON

### 3.3 教师复盘视图

位置：教师端班级复盘 Tab

展示内容：

- **学生学习画像对比**：多个学生的 riskLevel、completionRate 对比柱状图
- **薄弱点分布**：weakKnowledgePoints 词云或柱状图
- **录音覆盖率**：recordingCoverageRate 班级平均值

展示约束：

- 数据来源于 Python 管线的离线输出 JSON
- 不实时调用 ML 模型，每次展示前需先运行 Python 管线

---

## 4. Admin 数据中台产品决策

### 4.1 全局数据看板

位置：Admin 端 Dashboard 或 Analytics Tab

展示内容：

- **totalStudents**：当前注册学生总数
- **modelVersion**：当前运行的数据模型版本（如 v1.0.0）
- **modelRunAt**：Python 管线最新运行时间
- **recommendationCount**：当前活跃推荐数量
- **invalidSampleCount**：无法建模的样本数（如缺少学习记录的学生）

展示约束：

- 数据从 `output/admin_snapshot.json` 读取
- Admin 可手动触发 Python 管线重新运行（按钮操作，结果写入 output/）

### 4.2 学生画像列表

位置：Admin 端 Analytics 页

展示内容：

- 学生列表：studentId、riskLevel、clusterLabel、completionRate、avgScore、weakKnowledgePoints 前 3
- 支持按 riskLevel 筛选

展示约束：

- 数据从 `output/student_profiles.json` 读取
- 不显示真实学生姓名（Privacy 约束），只显示脱敏 studentId

---

## 5. Python 管线与数据边界

### 5.1 数据输入边界

- **输入数据源**：`analysis/ai-learning-recommendation/data/` 下的合成样本 CSV
- **不直接读取**：`backend/storage/`、`backend/data/db.json`、真实学生录音
- **间接来源**：后端 API 接口返回的聚合数据（需 S9-T03 新增接口）

### 5.2 数据输出边界

- **输出目录**：`analysis/ai-learning-recommendation/output/`
- **输出 JSON**：student_profiles.json、recommendations.json、class_insights.json、admin_snapshot.json
- **禁止输出**：真实学生姓名、邮箱、手机号、音频文件路径

### 5.3 MVP 可复用能力

以下 v1.0 已有能力**不需要改动**，直接复用：

| 已有能力 | 复用方式 |
|----------|----------|
| 学习任务导入（Excel） | Python 管线直接用 learningTasks 数据，无需修改 |
| 录音记录元数据 | Python 管线用 durationSec、createdAt、taskId，不读取音频内容 |
| 学习记录持久化 | Python 管线用 learningRecords 的 completionStatus、attemptsCount |
| 后端 /api/v1/analytics/* | 新增只读接口返回 Python 管线输出的 JSON（需 S9-T03 实现） |
| AdminDashboardView | 在现有 Admin Dashboard 中增加 analytics tab（需 S9-T04 实现） |
| 学生/教师/Admin 角色 | 角色权限不变，AI 展示数据按角色权限读取 |

### 5.4 需要新增的能力

| 新增能力 | 优先级 | 关联 TaskId |
|----------|--------|-------------|
| Python 数据管线（合成样本生成、特征工程、聚类、推荐） | P0 | S9-T02 |
| 后端 `/api/v1/analytics/student-profile` 接口 | P0 | S9-T03 |
| 后端 `/api/v1/analytics/class-insights` 接口 | P0 | S9-T03 |
| 后端 `/api/v1/analytics/admin-snapshot` 接口 | P1 | S9-T03 |
| 学生端 AI 学习助手卡片（Dashboard） | P0 | S9-T04 |
| 教师端班级洞察 Summary | P0 | S9-T04 |
| Admin 数据中台 Analytics Tab | P1 | S9-T04 |

---

## 6. 禁止事项（v2.0 AI 模块）

- 禁止引入 ASR 语音评分作为推荐输入（v2.0 仅用规则阈值）
- 禁止调用外部付费 LLM API（推荐理由用可解释规则生成）
- 禁止读取或写入 `backend/storage/`、`backend/data/db.json`、`.env*`
- 禁止提交录音、PDF、Excel 真实上传文件
- 禁止将真实学生姓名/邮箱写入 `analysis/` 目录
- 禁止改动 `TeacherClassroomView`、`StudentClassroomView`、`HomeworkView` 录音逻辑
- 禁止改动 `backend/src/providers/`、docker/、vercel.json
- 禁止在 Sprint 执行中直接 `git push`