# 03-HLD 概要设计说明书学术与工程审查报告

日期：2026-05-29  
审查对象：`docs/00-project-docs/03-HLD/templates/data/*.tex`、`.agent` 文档生成规范  
依据：GB/T 8567—2006、IEEE 1016、GB/T 7714—2015、项目 02-SRS 需求追踪矩阵、后端路由源码与当前 LaTeX 编译日志

## 1. 已先行修订的 Agent 规范

本次先修订 `.agent` 提示词系统，再审查正文。原因是 03-HLD 的问题并非单个表格，而是生成规范未强制区分“已实现事实、候选方案、后续扩展”和“学术排版要求”。

已完成的规范修订包括：

| 文件 | 修订要点 |
|---|---|
| `.agent/skills/05_lingobridge_docs_standard/SKILL.md` | 新增 03-HLD 强制生成规范，要求先核 SRS、代码路由、数据模型和已确认技术调研；未验证能力不得写为已实现。 |
| `.agent/rules/latex-writing-discipline.md` | 修正本地路径与序列词使用的自相矛盾规则；新增 HLD 学术设计文档红线与分页表格规则。 |
| `.agent/skills/05_lingobridge_docs_standard/software-engineering-docs.md` | 在 HLD 检查清单中追加需求追踪、授权、错误码、候选接口状态和 LaTeX 表格审查要求。 |
| `.agent/skills/05_lingobridge_docs_standard/document-quality-checklist.md` | 增加“正式 PDF 表格截断或重叠”“设计事实不可证”两个一票否决项。 |
| `.agent/skills/01_latex_infrastructure/SKILL.md` | 将 03-HLD 纳入交付前静态扫描范围，并取消旧规则中鼓励机械序列词的写法。 |
| `.agent/workflows/document-latex-injection-and-delivery.md` | 将 03-HLD 的正文目录和参考文献副本纳入注入交付流程，统一日志分级与引用同步口径。 |
| `.agent/rules/agent-ops-governance.md`、`.agent/rules/mvp-scope.md` | 去除提示词中的本机绝对路径链接，明确以仓库内 PRD 副本作为可审计基线。 |
| `docs/00-project-docs/03-HLD/scripts/Makefile` | 将编译入口从错误的 `thuthesis-example` 改为 `03-HLD`，恢复 03-HLD 的标准构建链。 |

## 2. 当前 03-HLD 的核心问题点

| 严重级别 | 问题类型 | 位置 | 问题说明 | 建议处理 |
|---|---|---|---|---|
| P0 | 构建入口错误 | `03-HLD/scripts/Makefile` | 原 Makefile 指向 `thuthesis-example.tex`，导致 `make` 无法构建 03-HLD。 | 已修复为 `MAIN = 03-HLD`；后续交付必须以 `make` 构建为准。 |
| P0 | 接口表排版失败 | `chap04.tex:19--39` | 表 4.1 使用 `longtable` 但列宽总量超出正文宽度，日志出现 59.99951pt alignment overfull；截图中的跨页表格也出现视觉上割裂、表题重复和单元格拥挤。 | 拆分为“接口概览表 + 分模块接口表”，或将表格转为横向页；每列重新定宽并补足 `\allowbreak`。 |
| P0 | 设计事实不可证 | `chap04.tex:9--13`、`chap05.tex:171` | 文中把阿里云 ASR 教育场景打分、腾讯会议 REST API、Microsoft Teams API、ASR 音素级评分写成既成设计，但 SRS 与当前 PRD 多处标记 ASR/会议集成为后续或 Spike 能力。 | 将相关内容改为“候选增强能力/后续扩展”，MVP 正文只写 TTS、MediaRecorder 录音、外部会议链接或人工听评。 |
| P0 | 与需求边界冲突 | `chap04.tex:13`、`chap06.tex:38`、`chap10.tex:11--18` | SRS 中 FR-007 为 V1.1 阶段，PRD 也要求 ASR/翻译不进入正式课堂主链路；HLD 却把实时音视频、WebRTC 连麦和会议 API 作为内部主设计描述。 | 以 02-SRS 的 V1.0/V1.1/V2.0 边界重写章节，把外部会议/ASR/翻译放入约束与演进路线。 |
| P1 | 接口矩阵缺少工程要素 | `chap04.tex:19--39` | 表 4.1 缺少接口编号、需求追踪编号、HTTP 状态码、错误码、路径参数、状态字段、是否已实现等字段；且仅列 12 个接口，未覆盖后端实际存在的大量 `courses/:id`、`classes/:id/members`、`live-sessions`、`homework-submissions` 等接口。 | 先从 `backend/src/app.ts` 抽取实际路由，按 Auth/Class/Course/Courseware/Homework/Recording/Live/Admin 分组。 |
| P1 | 文风不符合学术设计书 | `chap01.tex:4`、`chap02.tex:6--27`、`chap04.tex:4`、`chap08.tex:29`、`chap10.tex:14--18` | 出现“高保真、极致、强力、无界、圆满、战略高度、国际一流、高超架构柔性”等营销或夸张表达，削弱概要设计书的客观性。 | 全文按“设计对象 + 约束 + 方案 + 影响”的句式重写，删除宣传式形容词。 |
| P1 | 需求追踪断裂 | 全文 | HLD 章节很少显式引用 SRS 的 `FR-001` 至 `FR-009`、`NFR-001` 至 `NFR-007`，无法证明设计覆盖需求。 | 每个模块表、接口表、数据表和安全/性能段落增加追踪列或正文映射说明。 |
| P1 | 数据模型表过细且割裂 | `chap05.tex:24--167` | HLD 中大量数据库字段表更接近 DBD/LLD，且多个短表连续堆叠，缺少“概念数据模型、核心实体关系、设计约束”的概要层说明。 | HLD 保留核心实体关系与关键约束，字段级明细迁移到数据库设计说明书或附录。 |
| P1 | 安全表述存在风险 | `chap08.tex:4--6` | JWT 描述为“基于 SHA-256 算法签发”，易误导为单纯哈希签名；`localStorage` 存 JWT 被写成安全缓存，缺少 XSS 风险说明。 | 改为 HS256/RS256 签名机制、过期策略、刷新策略与 XSS/CSRF 风险控制；避免把 `localStorage` 写成绝对安全。 |
| P2 | 编译存在非阻断 warning | `03-HLD.log` | 当前 PDF 可生成 32 页，但日志仍有 `Label tab:rest_api multiply defined`、多处 `Overfull \hbox`、字体替换 warning。 | 修复重复标签来源，重构表 4.1 与第 5 章字段表，编译后再次审查日志。 |
| P2 | 表格浮动策略不统一 | `chap01.tex`、`chap02.tex`、`chap03.tex`、`chap05.tex`、`chap07.tex` | 多处使用 `table[H] + tabularx`，短表可接受，但字段表、职责表内容较长时容易造成页面拥挤和 underfull/overfull。 | 短表保留，长字段表改 `longtable`、横向页或拆分章节。 |
| P2 | 概要设计与详细设计边界混杂 | `chap07.tex`、`chap09.tex` | 多处算法级伪代码和实现细节写入 HLD，包含具体事件回调、数组、MD5 键值等，已经接近 LLD。 | HLD 只保留策略与设计理由，算法迁移到 04-LLD。 |

## 3. 优先整改顺序

1. 重写第 4 章接口设计：先抽取真实后端路由，再按模块拆表，补需求追踪、认证、错误码和实现状态。
2. 重写 ASR、会议、WebRTC 相关段落：V1.0 写为外部会议辅助与录音人工听评；ASR/翻译/会议 API 写为后续候选。
3. 清洗全文文风：删除营销化形容词和绝对化结论，改为学术设计描述。
4. 调整第 5 章数据设计粒度：HLD 保留概念模型、核心实体和关键约束，字段细节迁移到 DBD/LLD。
5. 修复 LaTeX warning：表格列宽、重复 label、长英文标识断行、字体替换。

## 4. 编译审查记录

修复 Makefile 后已执行 `make`，当前 `03-HLD.pdf` 可生成，页数为 32 页。构建仍存在非阻断 warning，尤其集中在第 4 章接口表和第 5 章字段表；因此当前 PDF 只能作为问题定位版本，不建议直接作为最终学术交付版。
