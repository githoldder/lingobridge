# LingoBridge 项目文档体系

> 本文档体系针对 LingoBridge MVP（基于 React+Node 的轻量级中文学习平台）。
> 依据 GB/T 8567—2006、GB/T 9385—2008 等国家标准，使用 thuthesis LaTeX 模板编译。

## 文档索引

| 文档 | 编号 | 适用标准 | 状态 | PDF 路径 |
|---|---|---|---|---|
| 可行性分析报告 | 01-FA | GB/T 8567—2006 | draft | `01-FA/templates/01-FA.pdf` |
| 软件需求规格说明书 | 02-SRS | GB/T 9385—2008 | draft | `02-SRS/templates/02-SRS.pdf` |
| 概要设计说明书 | 03-HLD | GB/T 8567—2006, IEEE 1016 | draft | `03-HLD/templates/03-HLD.pdf` |
| 详细设计说明书 | 04-LLD | GB/T 8567—2006, IEEE 1016 | draft | `04-LLD/templates/04-LLD.pdf` |
| 测试计划 | 05-TP | GB/T 8567—2006, IEEE 829 | draft | `05-TP/templates/05-TP.pdf` |
| 部署说明 | 06-DEP | GB/T 8567—2006 | draft | `06-DEP/templates/06-DEP.pdf` |
| 用户手册 | 07-UM | GB/T 8567—2006 | draft | `07-UM/templates/07-UM.pdf` |

## 编译

### 单份编译

```bash
bash 01-FA/scripts/build_manual.sh
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
| 01-FA | `standards/04_软件工程文档规范.md` | §2.1 可行性分析报告 | 轻量版模板 | 检查清单 |
| 02-SRS | `standards/04_软件工程文档规范.md` | §2.2 SRS | 软件需求规格说明书SRS模板 | SRS检查清单 |
| 03-HLD | `standards/04_软件工程文档规范.md` | §2.3 概要设计说明书 | 概要设计说明书模板 | 软件设计文档检查清单 |
| 04-LLD | `standards/04_软件工程文档规范.md` | §2.4 详细设计说明书 | 详细设计说明书模板 | 软件设计文档检查清单 |
| 05-TP | `standards/04_软件工程文档规范.md` | §2.6 测试计划 | — | 测试文档检查清单 |
| 06-DEP | `standards/04_软件工程文档规范.md` | §2.8 部署说明 | — | — |
| 07-UM | `standards/04_软件工程文档规范.md` | §2.9 用户手册 | — | — |

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
├── 01-FA/             # 可行性分析报告
├── 02-SRS/            # 软件需求规格说明书
├── 03-HLD/            # 概要设计说明书
├── 04-LLD/            # 详细设计说明书
├── 05-TP/             # 测试计划
├── 06-DEP/            # 部署说明
├── 07-UM/             # 用户手册
├── build_all.sh       # 一键编译
└── README.md          # 本文件
```
