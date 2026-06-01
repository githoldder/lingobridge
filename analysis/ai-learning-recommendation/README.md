# AI Learning Recommendation — Analysis Module

> LingoBridge v2.0 机器学习子系统。生成学习画像、风险分层和个性化练习推荐。
> 本目录仅包含 Python 分析脚本和输出，不涉及前端/后端业务逻辑。

---

## 模块定位

```
learningRecords / recordings / homeworkSubmissions
        ↓
  Python Pipeline (本目录)
        ↓
output/student_profiles.json      ← 学生画像
output/recommendations.json       ← 个性化推荐
output/class_insights.json         ← 班级洞察
output/admin_snapshot.json         ← Admin 全局快照
```

- **集成方式**：离线 JSON 优先（P0）。Python 管线输出 JSON，前端通过 `analyticsApi` 或后端 `/api/v1/analytics/*` 只读接口读取。
- **不注入业务逻辑**：本目录代码不写回 `backend/storage`、`backend/data/db.json` 或任何业务表。
- **不提交录音音频**：只统计 `durationSec`、`taskId`、`createdAt` 等元数据，不读取音频内容。

---

## 目录结构

```
analysis/ai-learning-recommendation/
├── README.md               ← 本文件
├── requirements.txt        ← uv pip 依赖清单
├── environment.yml         ← conda 环境清单（演示兜底）
├── run_pipeline.py         ← 端到端串联脚本
├── data/                   ← 输入数据（合成样本）
│   ├── sample_learning_events.csv
│   ├── sample_students.csv
│   └── sample_tasks.csv
├── src/                    ← 核心脚本
│   ├── generate_sample_data.py
│   ├── preprocess.py
│   ├── train_model.py
│   └── recommend.py
├── output/                 ← Pipeline 输出（gitignore）
│   ├── student_features.csv
│   ├── student_profiles.json
│   ├── model_metrics.json
│   ├── recommendations.json
│   ├── class_insights.json
│   └── admin_snapshot.json
└── reports/                ← 可选报告输出
```

---

## 环境配置（必须二选一）

### 推荐：uv（轻量、快速、可复现）

```bash
# 创建虚拟环境
uv venv

# 安装依赖
uv pip install -r requirements.txt

# 验证
python3 src/generate_sample_data.py
python3 src/preprocess.py
python3 src/train_model.py
python3 src/recommend.py

# 或一键运行
python3 run_pipeline.py
```

> `uv` 更适合仓库内可复现脚本和轻量依赖锁定。生产/上台演示均可使用。

### 兜底：Anaconda / conda（本地课堂演示）

```bash
# 创建环境
conda env create -f environment.yml

# 激活环境
conda activate lingobridge-ai-v2

# 运行
python run_pipeline.py

# 导出当前环境（供他人复用）
conda env export > environment.yml
```

> 当 uv 不可用、或演示机器已有 Anaconda 时，使用此方案。

---

## 依赖说明

- **优先使用标准库**：JSON、CSV、统计计算优先用 Python 标准库实现。
- **如需 pandas / scikit-learn**：必须在 `requirements.txt` 和 `environment.yml` 中明确声明。
- **不预装大型深度学习框架**：TensorFlow / PyTorch 不在 v2.0 P0 范围内。
- **所有依赖必须锁定**：不得依赖全局 site-packages 的隐式包。

---

## 运行顺序

```
generate_sample_data.py  → data/*.csv（合成样本）
       ↓
preprocess.py            → output/student_features.csv + preprocess_summary.json
       ↓
train_model.py            → output/student_profiles.json + model_metrics.json
       ↓
recommend.py              → output/recommendations.json + class_insights.json + admin_snapshot.json
```

---

## 禁止事项

- 禁止读取 `backend/storage/` 下的任何真实音频文件。
- 禁止读取 `backend/data/db.json` 中的真实学生姓名、邮箱、音频 URL。
- 禁止将本地私有绝对路径（如 `/Users/caolei/...`）写入代码或注释。
- 禁止将 output/*.json 中的 studentId 关联到真实学生身份。
- 禁止在 Sprint 执行期间直接 `git push` 本仓库。

---

## 与 PM2 的关系

本地演示时，后端/前端进程由 PM2 管理（参见 `docs/03-testing-deployment/ai-v2-demo-runbook.md`）。
Python 管线独立运行，不受 PM2 进程管理约束。

---

## 产出契约（dataContract）

详见 `prds/json/sprint09-prd-260601-v2.0.json` 的 `dataContract` 字段：

| 产出 | 路径 | 说明 |
|------|------|------|
| StudentLearningProfile | `output/student_profiles.json` | 含 riskLevel、clusterLabel、weakKnowledgePoints |
| PracticeRecommendation | `output/recommendations.json` | 必须含 title、reason、priority、sourceSignals |
| ClassInsight | `output/class_insights.json` | 含 highRiskStudents、commonWeakKnowledgePoints |
| AdminAnalyticsSnapshot | `output/admin_snapshot.json` | 含 modelVersion、modelRunAt、invalidSampleCount |