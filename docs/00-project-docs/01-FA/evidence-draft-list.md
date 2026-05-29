# FA 补证截图与数据源 Draft List

> 用途：本文件给项目组内部核对，不进入正式 LaTeX 正文。正式 PDF 仅保留图、结论和必要引用。

## 1. 已插入正文的截图

| 类别 | 当前文件 | 来源 URL | 内容物清单 | 状态 |
|---|---|---|---|---|
| 政策依据 / 国际中文教育 | `templates/figures/policy_moe_chinese_education_combined.png` | https://www.moe.gov.cn/jyb_xwfb/moe_2082/2024/2024_zl13/202411/t20241113_1162611.html | 教育部页面标题、发布日期、来源；“国际中文教育是教育强国建设的重要组成部分”等定位；“搭建语言教育和文化文明对话平台”等段落。 | 已由本地截图源拼接并插入；复现时通过 `LINGOBRIDGE_POLICY_SCREENSHOT_TOP` 与 `LINGOBRIDGE_POLICY_SCREENSHOT_BOTTOM` 指定截图路径。 |

## 2. 建议后续补截的页面

| 类别 | 建议 URL | 建议文件名 | 内容物清单 |
|---|---|---|---|
| 语音服务平台 | https://help.aliyun.com/zh/isi/ | `speech-platform-evidence.png` | 阿里云智能语音交互产品文档首页、功能入口、TTS/语音识别/口语评测相关目录或产品说明。 |
| 备选语音/实时音视频平台 | https://cloud.tencent.com/document/product/647 | `realtime-audio-platform-evidence.png` | 腾讯云实时音视频 TRTC 文档首页、音视频能力说明、Web 端接入文档入口。 |
| 浏览器录音标准 | https://www.w3.org/TR/mediastream-recording/ | `web-recording-standard.png` | W3C MediaStream Recording 标准标题、发布日期、MediaRecorder API 概述、数据分片/Blob 事件说明。 |
| 浏览器录音兼容性 | https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder | `web-recording-mdn-evidence.png` | MDN MediaRecorder 页面、Baseline/Widely available 标识、构造函数、`start()` / `stop()` / `dataavailable` 事件说明。 |
| 部署平台控制台或产品文档 | https://vercel.com/docs/deployments | `deployment-platform-evidence.png` | Vercel Deployments 文档标题、部署概念、Preview/Production 部署说明。 |
| 对象存储 | https://www.aliyun.com/product/oss | `object-storage-evidence.png` | 阿里云 OSS 产品页、标准存储/容量包/地域/价格入口。 |
| 云资源价格 | https://www.aliyun.com/product/swas | `cloud-server-price-evidence.png` | 阿里云轻量应用服务器产品页、香港或境外节点规格、价格、带宽、购买页关键信息。 |
| 竞品 Duolingo | https://www.duolingo.com/learn | `duolingo-product-evidence.png` | Duolingo 中文页面首屏、游戏化学习主张、语言选择入口。 |
| 竞品 HelloTalk | https://www.hellotalk.com/en/features | `hellotalk-product-evidence.png` | HelloTalk features 页面、语言交换、聊天、语音/视频通话、社群功能。 |

## 3. 图表数据源与口径

| 图表 | 数据源 | 口径说明 |
|---|---|---|
| 国际中文教育需求与在线语言学习市场趋势 | 教育部、国务院侨办、ResearchAndMarkets、Grand View Research | 中文纳入国民教育体系国家数为官方公开报道；在线语言学习市场采用公开报告摘要端点与 CAGR，逐年值为按 CAGR 推算的趋势线。 |
| Duolingo 2019--2025 官方披露的用户规模与商业化趋势 | Duolingo 招股书、投资者关系新闻稿、SEC 股东信 | 2019--2020 来自招股书；2021--2025 来自年度 Q4/FY 披露。MAU 和付费订阅者为期末/季度披露口径，收入为全年 GAAP revenue。 |

## 4. 信源质量备注

| 信源类型 | 等级 | 使用方式 |
|---|---|---|
| 教育部、国务院侨办、W3C、MDN、SEC、公司投资者关系 | S/A | 可作为正文引用与关键事实依据。 |
| Grand View Research、ResearchAndMarkets 公开摘要 | A- | 可用于市场趋势判断；完整报告未购买，正文应标注为公开摘要与预测口径。 |
| 产品官网与产品文档 | A-/B+ | 可作为功能、部署、采购入口佐证，不单独用于证明市场规模。 |
