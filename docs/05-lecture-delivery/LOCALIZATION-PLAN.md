# LingoBridge 人工智能课程大作业本地化适配计划

日期：2026-06-02

## 1. 选题决策

最终推荐题目：

> 基于 DKT 知识追踪与 Levenshtein 距离校准的国际中文自适应学习推荐系统

短标题可用于封面：

> 基于 DKT 知识追踪与 Levenshtein 距离校准的国际中文自适应学习推荐系统

## 2. 为什么选这个题

课程指导书要求有 Python 代码、数据预处理、算法设计、交互设计、运行测试和报告。LingoBridge 已经具备教师端、学生端、管理端和课程/作业/录音等 MVP 主流程，因此最合适的方式不是另起一个无关 AI demo，而是把人工智能算法嵌入现有平台。

该方向可同时覆盖：

- 数据分析：学习记录、作业提交、录音练习、反馈、排名。
- 机器学习：学生掌握度预测、风险分层、练习推荐。
- 推荐系统：基于薄弱知识点和学习状态生成个性化练习路径。
- 文本处理变体：使用 Levenshtein 编辑距离对拼音转写、ASR 字幕或练习答案进行相似度校准。
- 交互设计：学生端、教师端、admin 数据中台都能展示 AI 结果。

## 3. 调研基线

当前项目最适合采用“知识追踪 + 编辑距离校准 + 自适应推荐”的组合路线，而不是单纯文本分类、聊天机器人或泛化 RAG 包装。

可引用方向：

- Knowledge Tracing 用于估计学生知识状态，并可服务推荐、课程学习和互动教育。
- Levenshtein Distance 是经典字符串相似度算法，适合用于拼音、字幕和练习答案的轻量校准。
- 2024/2025 年教育 AI 综述强调学习分析、个性化推荐、学习结果评估和教学影响，而不是只看模型准确率。

优先调研来源：

- TutorLLM: Customizing Learning Recommendations with Knowledge Tracing and Retrieval-Augmented Generation, arXiv 2025: `https://arxiv.org/abs/2502.15709`
- SINKT: A Structure-Aware Inductive Knowledge Tracing Model with Large Language Model, arXiv 2024: `https://arxiv.org/abs/2407.01245`
- LLM-KT: Aligning Large Language Models with Knowledge Tracing using a Plug-and-Play Instruction, arXiv 2025: `https://arxiv.org/abs/2502.02945`
- Personalized process-type learning path recommendation based on process mining and deep knowledge tracing, Knowledge-Based Systems 2024: `https://www.sciencedirect.com/science/article/pii/S0950705124010657`
- A Second-Classroom Personalized Learning Path Recommendation System Based on Large Language Model Technology, Applied Sciences 2025: `https://www.mdpi.com/2076-3417/15/14/7655`
- A Systematic Review of the Role of Learning Analytics in Supporting Personalized Learning, Education Sciences 2024: `https://www.mdpi.com/2227-7102/14/1/51`

## 4. 算法路线

分三层实现，避免本地演示过重：

### P0 规则基线

- 输入：学生练习记录、作业完成率、录音提交次数、教师反馈、知识点标签。
- 处理：缺失值清洗、重复记录合并、按学生/知识点/时间窗口聚合。
- 输出：学习活跃度、完成率、薄弱知识点、风险等级、推荐练习。

### P1 机器学习模型

- 模型 1：Logistic Regression / RandomForest 预测“下一次练习是否达标”。
- 模型 2：基于相似学生或知识点的推荐排序。
- 指标：accuracy、F1、AUC、precision@k、recall@k。

### P2 热点增强模型

- 知识追踪：DKT/SAKT/轻量 Transformer 或序列模型，预测学生对拼音、声调、听读、作业知识点的掌握概率。
- Levenshtein 校准：对 ASR 字幕、拼音转写或练习答案做编辑距离匹配，输出校准文本和推荐证据。
- 本地演示优先采用规则基线、DKT 原型和 Levenshtein 校准，避免网络/API 依赖影响答辩。

## 5. analysis 代码目录目标结构

目标目录：`analysis/ai-learning-recommendation/`

```text
analysis/ai-learning-recommendation/
├── README.md
├── requirements.txt
├── environment.yml
├── data/
│   ├── raw/
│   ├── processed/
│   └── demo/
├── src/
│   ├── export_learning_logs.py
│   ├── clean_learning_logs.py
│   ├── build_features.py
│   ├── train_baseline.py
│   ├── train_knowledge_tracing.py
│   ├── recommend_exercises.py
│   └── evaluate_models.py
├── reports/
│   ├── metrics.json
│   ├── model_card.md
│   └── experiment_summary.md
├── output/
│   ├── figures/
│   ├── recommendations/
│   └── model/
├── scripts/
│   ├── run_pipeline.sh
│   └── clean_outputs.sh
└── Makefile
```

## 6. 课程报告目录本地化目标

当前 `docs/05-lecture-delivery/报告/` 是外来 LaTeX 模板目录，需要本地化为可构建、可复用、可审计的课程报告工程。

目标结构：

```text
docs/05-lecture-delivery/
├── requirements/
│   ├── README.md
│   └── 人工智能课程大作业指导书(2025-2026-1).pdf
├── report/
│   ├── Makefile
│   ├── build.sh
│   ├── clean.sh
│   ├── main.tex
│   ├── thusetup.tex
│   ├── cls/
│   ├── data/
│   ├── figures/
│   ├── refs/
│   └── output/
└── LOCALIZATION-PLAN.md
```

现有中文目录 `报告/` 可先保留，下一步再决定是否迁移为英文 `report/`。迁移时必须保证：

- 不破坏原模板骨架。
- 保留 `第17组.pdf` 作为模板对照。
- 统一主入口为 `main.tex` 或保留 `thuthesis-example.tex` 但增加 Makefile 别名。
- 编译产物进入 `output/`，避免 `.aux/.log/.toc` 散落。
- figures 只放报告实际使用图，不混入 00-project-docs 的无关生命周期图。

## 7. 报告章节适配

必须保留课程模板 5 章骨架：

1. 绪论：课程背景、国际中文教育场景、AI 选题意义、研究目的。
2. 系统设计与方法：数据采集、特征工程、DKT 知识追踪、Levenshtein 校准与推荐算法。
3. 系统具体实现：Python pipeline、模型训练、三端 AI 模块、接口或导入导出流程。
4. 实验：数据集、预处理结果、模型指标、推荐案例、消融实验、演示稳定性。
5. 总结与展望：完成度、局限性、伦理与隐私、未来可接入真实教学数据和更强模型。

## 8. 下一步执行顺序

1. 固化 `docs/05-lecture-delivery` 目录结构，增加 Makefile/build.sh/clean.sh。
2. 完成 `analysis/ai-learning-recommendation` 的 Python pipeline 骨架。
3. 从 LingoBridge MVP 导出或构造 demo 学习行为数据。
4. 实现 P0 规则基线和 P1 机器学习模型。
5. 输出 metrics、recommendations、figures。
6. 将实验结果注入课程报告正文。
7. 编译 PDF，渲染检查封面、摘要、图表、留白和参考文献。
8. Sprint review 后再进入 UI 三端模块实现。

## 9. 禁止事项

- 禁止把软件工程生命周期文档直接拼接成课程报告。
- 禁止无 Python 数据处理/算法代码就声称完成 AI 大作业。
- 禁止用 `\nocite{*}` 填充参考文献。
- 禁止使用 AI 生成图冒充标准图。
- 禁止把真实学生隐私数据写入仓库。
