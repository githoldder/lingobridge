# Sprint 4 技术评审：课件渲染、Live Class 数据打通与 Postgres 落库

> 日期：2026-05-19  
> 结论：`pdf.js` 是 MVP 课件与批注的兜底主线；PPTX 先走“转换/预览/降级到 PDF”而不是重押 Microsoft 365 Embed；Excel 作业改成“导入 + 手动表单”双模式；Sprint 4 的首要工程目标是 Postgres schema 落库和教师/学生真实数据链路。

## 1. 当前 PRD 是否已覆盖这些技术

`prds/current/` baseline、`prds/sprints/sprint-04-data-pdf-course-okrts.md` 和兼容入口 `prds/prd.json` 已经提到：

- PDF/PPTX 上传与课堂渲染解耦，PDF 使用缓存页，画笔需要与 PDF/canvas 分层。
- `lesson_node`、`assignment_node`、`live_session.lessonNodeId` 的一对一规则。
- 教师课程详情页包含课程信息、学生、课件、时间、作业、live。
- 真实注册登录 schema、`teacher_student_links`、`course_members`、`live_class_student`、模糊搜索添加学生。
- Excel homework 导入、学生端任务、学习记录持久化。
- Admin 独立后台和资源/学习数据管理。

没有充分写清或需要修订：

- `pdf.js` 为什么是 MVP 最佳兜底、annotation storage / Konva 层如何进入技术方案。
- PPTX 路线选择：`pptx.js` / Microsoft 365 Embed / 转 PDF 的取舍。
- Excel 作业“手动表单创建”与“Excel 导入”双模式。
- Admin UI 可退出登录的验收项。
- Live Class 前端存在两个翻页入口，且学生/教师翻页同步边界不清。
- 学生端仍有固定 `course-1`、静态 schedule、废弃 `StudentClassroomView` 等测试数据残留。
- PRD 状态表把多项写成“已完成”，但 OKRTS 和代码仍显示未完全闭环，状态需要降级为“部分完成/待验收”。

## 2. 技术路线评审

### PDF 与批注

推荐：Sprint 4 把 `pdf.js` 作为课堂课件渲染主线。

依据：

- Mozilla 官方说明 `PDF.js` 是 HTML5 PDF viewer，目标是 web 标准的 PDF 解析与渲染平台；当前仓库仍活跃，2026-04-27 有 v5.7.284 release。
- 官方文档把 PDF.js 分为 core/display/viewer 三层，MVP 应使用 display/viewer 层，不直接深入 core。
- 当前项目已依赖 `pdfjs-dist`，有 `src/components/PdfViewer.tsx`，迁移成本低。

设计建议：

- PDF 底层：`PdfViewer` 只负责 PDF page render、worker、page cache、zoom/fit。
- 批注层：前端单独维护 annotation layer，不与 PDF canvas 混画。文字用 Konva/Text，画笔 ink 用 stroke，图形/高亮按对象模型存储。
- 存储层：MVP 先存应用数据库 `pdf_annotations` 或 `live_annotations`；需要导出 PDF 时再映射到 PDF.js annotation storage 或服务端合成。不要在 Sprint 4 直接承诺“写回原 PDF 文件”。
- 打印导出：优先做浏览器 print/download 的课堂讲义导出，将 PDF page + annotation layer 合成到打印视图。后续再做真正 PDF annotation embedding。

### PPTX 渲染

推荐：MVP 不重押 Microsoft 365 Embed，优先 `pptx.js`/轻量解析作为预览 Spike，同时保留 PPTX 上传后转 PDF 的兜底。

取舍：

- `pptx.js` demo 明确支持“显示所有 slides”和“slide mode”，所以翻页可以在外层用 slide index 实现；它不是完整 PowerPoint 引擎，复杂动画、母版、字体、图表保真度不可控。
- Microsoft 365 Embed 功能更完整，但官方流程依赖 OneDrive / PowerPoint for the web 获取 iframe embed code；这引入账号、权限、外链、隐私、学校网络环境和 MVP 时间成本。
- 业务 PPTX 大多是文本 + 图片，可以接受“上传后转换成 PDF/图片页”的稳定路线；课堂交互、批注、翻页都复用 PDF page model。

决策：

- Sprint 4：PDF.js 兜底 + PPTX 转 PDF/图片页 Spike。
- Sprint 5：若 PPTX 保真度仍不可接受，再评估 Microsoft 365 Embed 或服务端 LibreOffice 转 PDF。

### Excel 作业

推荐：Handsontable 只做教师侧手动录入 UI；SheetJS 继续做 Excel 数据层导入/导出。

依据：

- Handsontable 官方定位是类 spreadsheet 的数据网格，并支持 React / Angular / Vue。
- SheetJS CE 官方定位是读取和生成 spreadsheet 数据，适合把 xlsx 解析成任务数据、导出表格。

设计：

- 模式 A：Excel 导入。上传 xlsx -> 后端解析 -> 预览 -> 发布到 assignment node。
- 模式 B：手动填写。教师在 Handsontable 表格录入 -> 前端提交 JSON rows -> 后端复用同一个 parser/validator -> 生成 learning tasks。
- 两种模式最终写同一组表：`assignment_imports`、`learning_tasks`、`vocabulary_items`，学生端只读发布后的 assignment node。

## 3. 代码扫描结论

- Admin logout：主布局 `src/components/Layout.tsx` 有 logout 按钮，但 `/admin` 是 full screen，`AdminDashboardView` 自己没有 logout，所以 admin 退出不了。需要在 Admin 顶栏补退出登录。
- Live Class 翻页：`src/components/TeacherClassroomView.tsx` 有两个翻页入口。一个在左侧设置面板内，仅教师可见；另一个在底部控制条，教师和学生都可见。两者都直接改本地 `pdfPage/currentPageIdx`，教师翻页会 patch live session，但学生端没有稳定轮询同步，且学生也可以自己翻页。
- 翻页边界：PDF 的下一页用 `Math.min(pdfPageCount || 999, p + 1)`，page count 未拿到时确实可以一路翻到 999；静态 HTML pages 用 `coursePages.length - 1` 限制。
- 学生端测试数据：废弃的 `StudentClassroomView.tsx` 固定 `COURSE_ID = 'course-1'`；`ScheduleView.tsx` 静态课程和 `lecturesApi.list('course-1')`；`entryResolver.ts` 默认 `course-1`。虽然路由当前用 `TeacherClassroomView role="student"`，这些残留仍会污染学生端课程/日程/作业入口。
- 教师课程打通：后端已有 course member、student search、assignment import、lesson node 的 JSON DB 版本，但还没有 Postgres 数据层；PRD 要求的“真实账户、真实课程、真实学生端可见性”需要落库后再验收。

## 4. 必改项

1. Admin UI：`AdminDashboardView` 增加统一顶栏、当前账号、logout、返回入口；后台仍保持 full screen。
2. PDF.js 专项：拆出 `LivePdfStage`、`AnnotationLayer`、`AnnotationStore`，把 PDF render 和批注对象模型隔离。
3. 翻页机制：只保留一个课堂主翻页控制。教师控制 live session current page；学生默认只跟随教师页码，可提供“临时自由浏览”开关但不改变 live state。
4. 数据落库：以 `backend/db/init/001_lingobridge_schema.sql` 为 schema 起点，新增 Postgres service，后端逐步从 JSON DB 切到 repository 层。
5. 学生端真实数据：课程、schedule、live、homework 全部从 `course_members` / `live_class_students` / `assignment_nodes` 推导，不再默认 `course-1`。
6. 课程编辑：添加学生必须支持真实账户模糊搜索和批量加入；上传课件、上传/手动作业、下载表格、设定 live 时间都写入同一课程/课时模型。
7. 作业双模式：Excel 导入和手动表单都走同一后端 validator 和 learning task creator。

## 5. 参考来源

- Mozilla PDF.js README: https://github.com/mozilla/pdf.js/
- Mozilla PDF.js Getting Started: https://mozilla.github.io/pdf.js/getting_started/
- PPTXjs demos: https://pptx.js.org/pages/demos.html
- Microsoft PowerPoint Web Embed: https://support.microsoft.com/en-us/office/embed-a-presentation-in-a-web-page-or-blog-19668a1d-2299-4af3-91e1-ae57af723a60
- Handsontable Docs: https://handsontable.com/docs/javascript-data-grid/
- SheetJS CE Docs: https://docs.sheetjs.com/docs/
