# AI 课程大作业数据指标字典

> 版本：v1.0.0
> 更新日期：2026-06-01
> 覆盖范围：LingoBridge v2.0 AI 学习推荐系统 Sprint 09
> 用途：冻结所有 AI 模块数据指标的定义、来源、计算口径和实现状态
> 关联文件：`prds/json/sprint09-prd-260601-v2.0.json` dataContract

---

## 字典结构

每个指标按以下结构定义：

| 字段 | 说明 |
|------|------|
| 中文名 | 可读中文名称 |
| 英文字段名 | 接口/JSON/代码中实际使用的字段名 |
| 指标用途 | 这个指标解决什么问题 |
| 数据来源 | 输入数据来自哪个 MVP 数据源 |
| 计算口径 | 精确的计算公式或逻辑 |
| 是否需要新增后端接口 | Yes/No/Mock，说明 |
| 是否允许前端 mock | Yes/No，说明 |
| 风险等级 | P0（必须）/P1（重要）/P2（可选） |
| 后续实现 TaskId | 关联的 Sprint 09 TaskId |

---

## 指标列表

---

### 1. completionRate（学习完成率）

| 字段 | 内容 |
|------|------|
| **中文名** | 学习完成率 |
| **英文字段名** | `completionRate` |
| **指标用途** | 衡量学生完成了多少已发布的学习任务 |
| **数据来源** | `learningTasks`（已发布）+ `learningRecords`（完成状态） |
| **计算口径** | `completionRate = (已标记 completed/correct 的 learningRecords 条目数 / 该学生可见的 learningTasks 总数) × 100`，取整数百分位 |
| **是否需要新增后端接口** | No — 已在 `backend/src/app.ts` 和 `src/services/apiClient.ts` 中实现（`GET /api/v1/analytics/student-profile` 路由中） |
| **是否允许前端 mock** | Yes — MVP 阶段允许前端 hardcode 示例数据用于 UI 展示验证 |
| **风险等级** | **P0**（必须） |
| **后续实现 TaskId** | S9-T03（接口已就绪，数据源复用现有 MVP） |

**已有实现：**

- `backend/src/app.ts:2344`：`completionRate: tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0`
- `src/services/apiClient.ts:710`：`completionRate: number`
- `src/components/AdminDashboardView.tsx:563,676,679`：已使用 `lp.completionRate` 渲染进度条和数字

---

### 2. avgScore（平均得分）

| 字段 | 内容 |
|------|------|
| **中文名** | 平均得分 |
| **英文字段名** | `avgScore` |
| **指标用途** | 衡量学生的整体学业表现水平 |
| **数据来源** | `learningRecords[].score` |
| **计算口径** | `avgScore = 已评分 records 的 score 均值，保留 1 位小数`；无评分记录时为 `0` |
| **是否需要新增后端接口** | No — 已在 `backend/src/app.ts` 中实现（`GET /api/v1/analytics/student-profile` 路由中） |
| **是否允许前端 mock** | Yes — MVP 阶段允许前端 hardcode 示例数据 |
| **风险等级** | **P0**（必须） |
| **后续实现 TaskId** | S9-T03（接口已就绪，数据源复用现有 MVP） |

**已有实现：**

- `backend/src/app.ts:2338`：`avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0`
- `backend/src/app.ts:2346`：`avgScore: Math.round(avgScore * 10) / 10`（保留 1 位小数）
- `src/services/apiClient.ts:712`：`avgScore: number`
- `src/components/AdminDashboardView.tsx:629,683`：已使用 `lp.avgScore`

---

### 3. recordingCoverageRate（录音覆盖率）

| 字段 | 内容 |
|------|------|
| **中文名** | 录音覆盖率 |
| **英文字段名** | `recordingCoverageRate` |
| **指标用途** | 衡量学生完成了多少需要录音的任务 |
| **数据来源** | `learningTasks`（taskType=recording）+ `learningRecords`（有录音 attempt 的记录） |
| **计算口径** | `recordingCoverageRate = 有录音的 learningRecords 条目数 / 需要录音的 learningTasks 总数 × 100` |
| **是否需要新增后端接口** | No — 复用现有 `learningTasks` 和 `learningRecords` 查询，无需新接口 |
| **是否允许前端 mock** | Yes — MVP 阶段允许前端 hardcode 百分比用于 UI 验证 |
| **风险等级** | **P1**（重要，非 P0 核心指标） |
| **后续实现 TaskId** | S9-T03（复用现有数据源，无需新增 API） |

**注意：** 录音覆盖率统计的是"任务有没有录音"，不读取音频内容本身，只统计 `learningRecords` 中是否存在该 taskId 的记录。

---

### 4. avgRetryCount（平均重试次数）

| 字段 | 内容 |
|------|------|
| **中文名** | 平均重试次数 |
| **英文字段名** | `avgRetryCount` |
| **指标用途** | 衡量学生的学习坚持度和难度感知 |
| **数据来源** | `learningRecords[].attemptsCount` |
| **计算口径** | `avgRetryCount = 所有人均 attemptsCount 均值，保留 1 位小数` |
| **是否需要新增后端接口** | No — 复用现有 `attemptsCount` 字段 |
| **是否允许前端 mock** | Yes — MVP 阶段允许前端 hardcode 示例数据 |
| **风险等级** | **P2**（可选，用于推荐算法输入） |
| **后续实现 TaskId** | S9-T02（Python 管线内部计算，不暴露新 API） |

---

### 5. recentActiveDays（近期活跃天数）

| 字段 | 内容 |
|------|------|
| **中文名** | 近期活跃天数 |
| **英文字段名** | `recentActiveDays` |
| **指标用途** | 衡量学生最近 N 天是否有学习行为 |
| **数据来源** | `learningRecords[].updatedAt` 或 `learningRecords[].completedAt` |
| **计算口径** | `recentActiveDays = 近 7 天内有 learningRecord 更新的天数去重计数` |
| **是否需要新增后端接口** | No — 复用现有 `updatedAt` 时间戳 |
| **是否允许前端 mock** | Yes — MVP 阶段允许前端 hardcode 示例天数 |
| **风险等级** | **P1**（重要，风险分层输入特征） |
| **后续实现 TaskId** | S9-T02（Python 管线内部计算） |

---

### 6. weakKnowledgePoints（薄弱知识点）

| 字段 | 内容 |
|------|------|
| **中文名** | 薄弱知识点 |
| **英文字段名** | `weakKnowledgePoints` |
| **指标用途** | 识别学生在哪些音节/语调/韵部上表现最差 |
| **数据来源** | `learningTasks.initial/tone/rhymeGroup/difficulty` + 低分 learningRecords |
| **计算口径** | `weakKnowledgePoints = score < 60 的 learningRecords 按 task. initial/tone/rhymeGroup 聚合，取频率最高的前 N 个` |
| **是否需要新增后端接口** | No — Python 管线内部聚合，无需新 API |
| **是否允许前端 mock** | Yes — MVP 阶段允许 hardcode 示例知识点列表 |
| **风险等级** | **P0**（必须，学生端和教师端核心展示指标） |
| **后续实现 TaskId** | S9-T02（Python 管线生成） |

**数据来源字段：**

- `learningTask.initial`：声母（b/p/m/f...）
- `learningTask.tone`：声调（1/2/3/4）
- `learningTask.rhymeGroup`：韵部
- `learningTask.difficulty`：难度等级

---

### 7. riskLevel（风险等级）

| 字段 | 内容 |
|------|------|
| **中文名** | 学习风险等级 |
| **英文字段名** | `riskLevel` |
| **指标用途** | 识别需要重点关注的学生（低/中/高风险） |
| **数据来源** | Python 管线基于 completionRate、avgScore、recentActiveDays、avgRetryCount 阈值计算 |
| **计算口径** | 规则阈值（可解释）：<br>`high`: avgScore < 60 AND recentActiveDays < 3<br>`medium`: avgScore < 75 OR recentActiveDays < 5<br>`low`: 其他 |
| **是否需要新增后端接口** | No — Python 管线输出 `student_profiles.json`，后端 API 读取后返回 |
| **是否允许前端 mock** | Yes — MVP 阶段允许 hardcode Low/Medium/High |
| **风险等级** | **P0**（必须，核心分层指标） |
| **后续实现 TaskId** | S9-T02（Python 管线生成）|

---

### 8. clusterLabel（学习画像标签）

| 字段 | 内容 |
|------|------|
| **中文名** | 学习画像标签 |
| **英文字段名** | `clusterLabel` |
| **指标用途** | 将学生归类为不同学习类型，便于教师了解班级构成 |
| **数据来源** | Python 管线基于 KMeans 聚类（纯 Python 实现或 scikit-learn） |
| **计算口径** | 聚类标签（5 类）：<br>`steady_leader`：高完成率+高分<br>`needs_recording_practice`：低录音覆盖率<br>`tone_weakness`：声调薄弱<br>`low_activity`：活跃度低<br>`fast_improver`：近期进步快 |
| **是否需要新增后端接口** | No — Python 管线输出 `student_profiles.json` |
| **是否允许前端 mock** | Yes — MVP 阶段允许 hardcode 标签 |
| **风险等级** | **P1**（重要，教师端班级构成展示） |
| **后续实现 TaskId** | S9-T02（Python 管线生成） |

---

### 9. rankPercentile（排名百分位）

| 字段 | 内容 |
|------|------|
| **中文名** | 排名百分位 |
| **英文字段名** | `rankPercentile` |
| **指标用途** | 让学生了解自己在班级中的相对位置 |
| **数据来源** | Python 管线基于所有学生的 completionRate + avgScore 综合排序 |
| **计算口径** | `rankPercentile = (该学生排名 / 班级学生总数) × 100`，取整数，Top 10% 表示为 `10` |
| **是否需要新增后端接口** | No — Python 管线生成 `student_profiles.json` |
| **是否允许前端 mock** | Yes — MVP 阶段允许 hardcode 排名 |
| **风险等级** | **P1**（重要，学生端排行榜展示） |
| **后续实现 TaskId** | S9-T02（Python 管线生成） |

---

### 10. recommendationReason（推荐理由）

| 字段 | 内容 |
|------|------|
| **中文名** | 推荐理由 |
| **英文字段名** | `recommendationReason` |
| **指标用途** | 让学生理解为什么推荐这个练习 |
| **数据来源** | Python 管线根据 weakKnowledgePoints、recordingCoverageRate、completionRate、averageRetryCount 组合生成 |
| **计算口径** | 规则生成（可解释，非 LLM）：<br>原因类型：<br>- "你的声调得分偏低，建议加强四声练习"<br>- "你已完成大部分任务，建议挑战高难度韵部"<br>- "你的录音覆盖率偏低，建议多练习朗读"<br>- "你的进步很快，建议提前学习下一课" |
| **是否需要新增后端接口** | No — Python 管线输出 `recommendations.json` |
| **是否允许前端 mock** | Yes — MVP 阶段允许 hardcode 推荐理由 |
| **风险等级** | **P0**（必须，推荐练习卡片核心内容） |
| **后续实现 TaskId** | S9-T02（Python 管线生成） |

**重要约束：** v2.0 不调用 LLM API，推荐理由必须用纯规则生成。禁止将"使用 LLM 生成推荐"作为已完成项写入任何文档。

---

## 指标实现状态总览

| 指标 | 已有 MVP 实现 | 需要 S9-T02 | 需要 S9-T03 | 需要 S9-T04 | 风险等级 |
|------|--------------|-------------|-------------|-------------|----------|
| completionRate | ✅ backend/app.ts | — | — | — | P0 |
| avgScore | ✅ backend/app.ts | — | — | — | P0 |
| recordingCoverageRate | ❌ 需 Python 管线 | S9-T02 | — | — | P1 |
| avgRetryCount | ❌ 需 Python 管线 | S9-T02 | — | — | P2 |
| recentActiveDays | ❌ 需 Python 管线 | S9-T02 | — | — | P1 |
| weakKnowledgePoints | ❌ 需 Python 管线 | S9-T02 | — | — | P0 |
| riskLevel | ❌ 需 Python 管线 | S9-T02 | — | — | P0 |
| clusterLabel | ❌ 需 Python 管线 | S9-T02 | — | — | P1 |
| rankPercentile | ❌ 需 Python 管线 | S9-T02 | — | — | P1 |
| recommendationReason | ❌ 需 Python 管线 | S9-T02 | — | — | P0 |

---

## 数据来源映射

| MVP 数据源 | 可派生指标 |
|------------|-----------|
| `learningTasks` | completionRate（分母）、recordingCoverageRate（分母） |
| `learningRecords` | completionRate（分子）、avgScore、avgRetryCount、recentActiveDays、weakKnowledgePoints |
| `learningTask.initial/tone/rhymeGroup/difficulty` | weakKnowledgePoints（聚合维度） |
| 无直接来源 | clusterLabel、rankPercentile、recommendationReason（Python 管线计算） |

---

## 前端类型定义（已有）

```typescript
// src/services/apiClient.ts:710-712
export interface StudentLearningProfile {
  completionRate: number;
  avgScore: number;
  // 以下为 v2.0 AI 模块新增
  riskLevel?: 'low' | 'medium' | 'high';
  clusterLabel?: string;
  weakKnowledgePoints?: string[];
  rankPercentile?: number;
  recentActiveDays?: number;
  recordingCoverageRate?: number;
}
```

---

## 验证命令

```bash
# 验证指标字段在代码中的引用
rg -n "completionRate|avgScore|recordingCoverageRate|riskLevel|clusterLabel|rankPercentile|recommendationReason" \
  docs/00-project-docs/08-AI-CW \
  prds/current

# 验证 JSON PRD dataContract
python3 -m json.tool prds/json/sprint09-prd-260601-v2.0.json > /dev/null && echo "JSON OK"

# 验证私有路径未泄露
rg -n "/Users/|file:///Users|OPENAI_API_KEY|JWT_SECRET|password" \
  docs/00-project-docs/08-AI-CW \
  prds/current
```