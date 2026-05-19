# LingoBridge 项目文档体系

> 本文档体系针对 LingoBridge MVP（基于 React+Node 的轻量级中文学习平台）。
> 依据 GB/T 8567—2006、GB/T 9385—2008 等国家标准，使用 thuthesis LaTeX 模板编译。

## 文档索引

| 文档 | 缩写 | 适用标准 | 状态 | PDF 路径 |
|---|---|---|---|---|
| 可行性分析报告 | FA | GB/T 8567—2006 | draft | `FA/templates/thuthesis-example.pdf` |
| 软件需求规格说明书 | SRS | GB/T 9385—2008 | draft | `SRS/templates/thuthesis-example.pdf` |
| 概要设计说明书 | HLD | GB/T 8567—2006, IEEE 1016 | draft | `HLD/templates/thuthesis-example.pdf` |
| 详细设计说明书 | LLD | GB/T 8567—2006, IEEE 1016 | draft | `LLD/templates/thuthesis-example.pdf` |
| 测试计划 | TP | GB/T 8567—2006, IEEE 829 | draft | `TP/templates/thuthesis-example.pdf` |
| 部署说明 | DEP | GB/T 8567—2006 | draft | `DEP/templates/thuthesis-example.pdf` |
| 用户手册 | UM | GB/T 8567—2006 | draft | `UM/templates/thuthesis-example.pdf` |

## 编译

### 单份编译

```bash
bash FA/scripts/build_manual.sh
```

### 一键编译全部

```bash
bash build_all.sh
```

### 前提

- TeX Live 2025+ (含 xelatex)
- 共享字体在 `shared/fonts/`
- 共享模板类在 `shared/cls/`

## 标准对齐快查表

每份文档扩写前，先查阅对应的规范和检查清单：

| 文档 | 规范源 | 章节 | 模板 | 检查清单 |
|---|---|---|---|---|
| FA | `standards/04_软件工程文档规范.md` | §2.1 可行性分析报告 | 轻量版模板(L123-158) | §2.1 检查清单(L190-197) |
| SRS | `standards/04_软件工程文档规范.md` | §2.2 SRS | `standards/templates/软件需求规格说明书SRS模板.md` | `standards/checklists/SRS检查清单.md` |
| HLD | `standards/04_软件工程文档规范.md` | §2.3 概要设计说明书 | `standards/templates/概要设计说明书模板.md` | `standards/checklists/软件设计文档检查清单.md` |
| LLD | `standards/04_软件工程文档规范.md` | §2.4 详细设计说明书 | `standards/templates/详细设计说明书模板.md` | `standards/checklists/软件设计文档检查清单.md` |
| TP | `standards/04_软件工程文档规范.md` | §2.6 测试计划 | — | `standards/checklists/测试文档检查清单.md` |
| DEP | `standards/04_软件工程文档规范.md` | §2.8 部署说明 | — | — |
| UM | `standards/04_软件工程文档规范.md` | §2.9 用户手册 | — | — |

### 图表绘制时查阅

| 图表类型 | 规范源 | 章节 |
|---|---|---|
| 流程图 | `standards/06_图表与建模规范.md` | §1.1 流程图 |
| 时序图 | `standards/06_图表与建模规范.md` | §1.4 时序图 |
| 用例图 | `standards/06_图表与建模规范.md` | §1.5 用例图 |
| 类图 | `standards/06_图表与建模规范.md` | §1.6 类图 |
| 组件图 | `standards/06_图表与建模规范.md` | §1.7 组件图 |
| 部署图 | `standards/06_图表与建模规范.md` | §1.8 部署图 |
| ER图 | `standards/06_图表与建模规范.md` | §1.9 E-R 图 |
| 架构图 | `standards/06_图表与建模规范.md` | §1.11 架构图(C4) |
| 甘特图 | `standards/06_图表与建模规范.md` | §1.12 甘特图 |

## 目录结构

```text
00-project-docs/
├── shared/            # 共享资源（fonts, cls, refs.bib）
├── FA/                # 可行性分析报告
├── SRS/               # 软件需求规格说明书
├── HLD/               # 概要设计说明书
├── LLD/               # 详细设计说明书
├── TP/                # 测试计划
├── DEP/               # 部署说明
├── UM/                # 用户手册
├── build_all.sh       # 一键编译
└── README.md          # 本文件
```
