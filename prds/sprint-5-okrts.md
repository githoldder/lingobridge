# Sprint 5 OKRTS：教学业务核心模型升级与真实课堂/作业体验

> 日期：2026-05-23
> 来源：最新 `prd.md` 与 `prd.json` (LPR01-LPR10)

## Objective
在 Sprint 4 完成基础跑通后，进一步落实班级实体、课时Live整合、真实课堂考勤、精细化作业状态（三级缓存、录音三槽位）与学习科学规律（单词遗忘曲线）。

## Key Results
- KR1: 所有测试脏数据可由教师或 Admin 一键清理（保留 demo seed）。
- KR2: 班级成为学生与课程可见性的核心控制面。
- KR3: Live Classroom 实现真实考勤并默认加载指定 PDF 课件。
- KR4: 学生录音不再全局覆盖，支持三槽位且草稿不丢。
- KR5: 单词学习按 1/3 步长增长并遵循长期衰减机制。
- KR6: Annotation 工具支持教学级互动（橡皮擦、页面文本框等）。

## Task Breakdown

### O1：模型升级与数据治理
| ID | 任务 | 交付 | 状态 |
|---|---|---|---|
| S5-T01 | 测试数据清理脚本 | 编写独立脚本与 Admin 清理入口，支持清理 course/lesson/records，保留 seed | todo |
| S5-T02 | 班级绑定核心重构 | 新增 class 实体及其与 teacher, student, course 的关联 API | done |
| S5-T03 | 课程/课时/Live 融合 | 固定 classroom；课时作为 live 实例；支持空教室状态 | todo |
| S5-T04 | 默认课件机制 | 课程/课时级 `defaultCoursewareFileId` 及进入 live 时自动打开逻辑 | todo |

### O2：精细化作业与缓存机制
| ID | 任务 | 交付 | 状态 |
|---|---|---|---|
| S5-T05 | 录音题三槽位组件 | UI 重构，支持单题最多 3 个槽位及本地重置 | todo |
| S5-T06 | 作业三级缓存策略 | 浏览器缓存、应用状态树及后端草稿存储，意外退出可恢复 | todo |
| S5-T07 | 确认提交边界 | “完成并提交”按钮交互及推送至教师端的正式归档流 | todo |
| S5-T08 | 单词掌握度与遗忘曲线 | db 中新增 progress state，处理 1/3 步进及周级别 decay 逻辑 | todo |

### O3：实时同步与课堂工具增强
| ID | 任务 | 交付 | 状态 |
|---|---|---|---|
| S5-T09 | 课程变动通知同步 | 老师操作（封面、学生、课件、开课）触发学生端 schedule/消息更新 | todo |
| S5-T10 | Live 真实入会面板 | 右上角 Students 读取 `live-sessions/:id/participants` API 渲染 | todo |
| S5-T11 | Annotation 增强 | 增加箭头、区域/对象橡皮擦、内联绝对定位输入框、取色工具 | todo |

## Execution Order
1. **O1** 数据治理与 schema 变更是基础，需最先执行（S5-T01 ~ T04）。
2. **O3 课堂与同步** 依赖新课件及班级结构，随后开展（S5-T09 ~ T11）。
3. **O2 作业与缓存** 链路较独立，可并行或收尾实施（S5-T05 ~ T08）。
