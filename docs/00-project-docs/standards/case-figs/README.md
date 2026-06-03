# Case Figures Reference Baseline

本目录用于保存图表规范的“可核验案例图”资产。当前阶段只建立参考基线，不生成新图，不放 AI 生成图。

## 目录分组

- `business-market/`：商业、竞品、市场、运营与财务类图表。
- `software-engineering/`：UML、BPMN、DFD、ERD、流程图、架构图、部署图等软件工程图。
- `data-ai/`：数据科学、机器学习、人工智能相关图，包括数据管道、算法流程、训练曲线、神经网络结构图。
- `ui-screenshots/`：UI 截图与设备容器展示，包括 Figma 组件、手机/平板/电脑 mockup、界面状态图。

## 使用原则

1. 在确定参考基线前，禁止生成任何替代图或 AI benchmark 图。
2. 所有截图必须能追溯到 PDF/网页源文件、章节、页码或图号。
3. ISO、IEEE、PMI、商业教材等受版权限制的内容，默认只记录来源与人工截图任务；未经授权不自动下载、不批量搬运。
4. 开放授权资源必须记录 license、作者、URL、访问日期。
5. 每张图进入本目录前，必须在 `manifest.csv` 登记。

## 核心文件

- `source-registry.csv`：四级来源体系主注册表，字段包含 domain、subcategory、source_type、reference_role、license/access、copying constraints 和 verified date。
- `domain-coverage.md`：按 domain 汇总 L1/L2/L3/L4 覆盖情况，并标记缺失层级。
- `allowed-copy-images.csv`：当前允许复制或生成复用的图片/工具清单，必须遵守署名和 license 条件。
- `reference-only.csv`：只能作为规则参考或标准依据，不能直接复制图片的资源。
- `license-pending.csv`：许可、页码、图号或 LICENSE 尚未核验完毕的资源。
- `manifest.csv`：进入本目录的具体案例图资产登记表。后续截图落地时必须更新该表。

## 四级来源约束

- L1 `normative-baseline`：唯一可用于判断“符合标准/违反标准”的来源。
- L2 `official-guidance`：可提炼设计规则，但不能覆盖 L1 的正式定义。
- L3 `case-gallery`：只用于参考图片、案例布局、模板和 few-shot 示例。
- L4 `discovery-index`：只用于发现更多资源，不能作为标准符合性依据。

## 命名规范

推荐格式：

```text
{category}/{source-short-name}_{year}_{chapter-or-figure}_{slug}.{ext}
```

示例：

```text
software-engineering/omg-uml-251_2017_ch17-sequence-lifeline.png
data-ai/crisp-dm_2000_fig2-process-model.png
ui-screenshots/figma-components_2026_device-mockup-practice.png
```
