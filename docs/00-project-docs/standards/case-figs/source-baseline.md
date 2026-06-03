# 图表标准与案例来源基线

更新时间：2026-06-02

本文件覆盖 `docs/00-project-docs/standards` 涉及的主要图表类型。今天只确定参考基线，不生成图。

## 1. 商业、竞品、市场图

适用图件：

- 市场规模与增长：折线图、柱状图、面积图。
- 竞品对比：矩阵图、雷达图、定位图、功能表格。
- 成本收益：瀑布图、堆叠柱状图、对比条形图。
- 运营指标：仪表盘、KPI 卡片、趋势图。

优先基线：

- IBCS International Business Communication Standards：用于商业报告图表的一致表达、标签、场景、差异值和减噪原则。IBCS 明确强调选择合适图表、避免杂乱，并倾向柱、条、线而非饼图/仪表盘。
- Edward Tufte, *The Visual Display of Quantitative Information*：经典统计图表教材，适合约束数据墨水比、图表完整性、小倍数图和误导性图表检查。
- Financial Times Visual Vocabulary：适合做“根据分析目的选图”的案例库，覆盖变化、分布、排名、关系、组成、空间等常见分析目的。

截图策略：

- IBCS 与 Tufte 默认不自动截图，先记录章节/页面，必要时由人工确认许可。
- FT Visual Vocabulary 若采用 GitHub 公开资源，必须先核对仓库 license，再按 license 复制和署名。

## 2. 软件工程图

适用图件：

- UML：用例图、类图、对象图、活动图、状态机图、时序图、通信图、组件图、部署图、包图。
- BPMN：业务流程图、协作图、泳道图。
- 结构化分析：数据流图、程序流程图、系统流程图。
- 数据建模：ERD、数据库逻辑模型、数据字典表。
- 架构与部署：C4、模块图、接口调用图、部署拓扑。

优先基线：

- OMG UML 2.5.1：UML 图的最高优先级来源，官方页面提供 `UML/2.5.1/PDF` 规范文档。
- OMG BPMN 2.0：业务流程建模的最高优先级来源，官方页面提供 BPMN 2.0 规范 PDF 与非规范示例 PDF。
- ISO 5807:1985：流程图、数据流图、程序流程图、系统流程图符号的国际标准。该标准仍为 Published/Confirmed，但 PDF 为付费标准，不能随意搬运。
- IEEE 1016-2009：软件设计描述标准，适合约束设计视图/视角，不适合作为所有 UML 符号的直接来源。
- GB/T 9385-2008、GB/T 8567-2006：用于国内软件需求规格、软件文档结构与交付格式约束；标准图符号仍应回到 UML/BPMN/ISO 5807 等专门规范。

截图策略：

- OMG UML/BPMN 官方 PDF 可作为首批人工截图对象，截图必须记录规范版本、章节号、页码、图号。
- ISO/IEEE/GB 付费或授权受限标准只记录来源；如果用户通过学校数据库或官方渠道取得 PDF，再人工截图。
- 禁止使用博客图、PlantUML 自画图或 AI 图冒充官方标准图。

## 3. 数据科学与人工智能图

适用图件：

- 数据生命周期：CRISP-DM、数据采集-清洗-建模-评估-部署流程。
- 数据管道：ETL/ELT、特征工程、训练/验证/测试切分、模型服务流程。
- 算法流程：分类、聚类、推荐、排序、评估流程图。
- 训练图：loss/accuracy 曲线、混淆矩阵、ROC/PR 曲线、学习曲线。
- 神经网络：MLP/CNN/RNN/Transformer 结构图、模型输入输出图。

优先基线：

- CRISP-DM 1.0 Step-by-step data mining guide：数据挖掘项目流程图的经典行业基线。
- Wikimedia CRISP-DM Process Diagram：开放授权图，可在满足 CC-BY-SA 条件下作为案例图。
- Evidence-based guidance framework for neural network system diagrams：开放论文，专门讨论神经网络系统图在学术出版中的表达规范。
- NN-SVG JOSS paper 与 PlotNeuralNet：可作为“如何绘制可发表神经网络结构图”的工具与案例基线。
- Goodfellow/Bengio/Courville *Deep Learning*：算法概念与神经网络结构的经典教材，适合引用概念，不建议自动搬运教材图。

截图策略：

- 开放论文与开源项目可以优先纳入，但必须记录 license。
- 神经网络结构图没有统一的 ISO/GB 画法标准，应以论文出版实践、开源工具和教材案例形成项目内规范。
- 后续项目生成图必须明确标注“项目图”，不能标注为“标准图”。

## 4. UI 截图与设备容器

适用图件：

- 学生端、教师端、管理端页面截图。
- 手机、平板、桌面端设备容器图。
- UI 组件状态图、交互流程图、设计系统组件表。

优先基线：

- Figma components/styles/shared libraries best practices：用于约束组件化、共享库和设备 mockup 的组织方式。
- ISO 9241-125:2017：高层级视觉信息呈现规范，适合作为界面信息组织、人因与可读性基线；该标准明确不规定具体 chart/graph 细节。
- Material Design、Microsoft Fluent 2、Apple Human Interface Guidelines：根据最终 UI 风格选择其一作为界面容器与组件参考。

截图策略：

- UI 截图必须来自本项目真实运行页面或 Figma 组件，不允许使用无关模板图。
- 手机/电脑容器应由 Figma 组件或官方设计资源生成，截图源文件应保存 Figma 页面/组件名。
- 最终报告中的 UI 图应包含“真实界面截图 + 设备容器”，而不是孤立页面截图。

## 5. 进入 `case-figs` 的门槛

每个案例图必须满足：

- `manifest.csv` 有记录。
- 有源文件 URL 或 PDF 路径。
- 有章节/页码/图号。
- 有 license 或访问方式说明。
- 截图文件名与 manifest 的 `asset_path` 对应。
- 不是 AI 生成图，不是二手博客图冒充标准图。

