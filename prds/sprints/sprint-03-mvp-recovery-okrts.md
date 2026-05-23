# Sprint 3 OKRTS：MVP Recovery 与公网试采闭环

> 日期：2026-05-17  
> 状态：启动  
> 说明：当前环境未暴露 `okrts` 工具，本文件按 OKR / KR / Task / Status 结构作为下一波 Sprint 执行拆解。

## Objective

在不继续扩张长期技术路线的前提下，把 LingoBridge MVP 修回“老师可演示、学生可采集、后台可核查、公网可试用”的闭环。

## Key Results

| KR | 指标 | 验收口径 |
|---|---|---|
| KR1 | 角色路由正确率 100% | admin、teacher、student 登录后分别进入自己的页面；登录页不弹 GuestGate |
| KR2 | 数据 schema 明确并落地 | users、sessions、profiles、teacher-student、live-class-student schema 完成并被业务代码使用 |
| KR3 | Live Class 主链路可用 | 老师创建 Live Class、选择学生、上传课件、上传 homework；学生端可见 |
| KR4 | 课件和画笔稳定 | samples PDF/PPTX 可上传查看；画笔绘制不白屏 |
| KR5 | Homework 可导入可学习 | samples Excel 可导入，学生端显示对应任务并能保存学习记录 |
| KR6 | Admin 后台定位清楚 | 后台可查看账号、文件、多媒体、作业、学习进度、服务状态 |
| KR7 | 验证覆盖缺陷 | 后端测试、Playwright smoke、手动公网验收清单覆盖当前缺陷 |

## Tasks

### O1：修复身份、登录、注册与后台路由

| ID | 任务 | 交付 | 状态 |
|---|---|---|---|
| S3-T01 | 修复 GuestGate 状态泄漏 | 点击登录/注册时关闭弹窗；登录页不再出现“解锁完整功能” | todo |
| S3-T02 | 修复 admin 路由 | admin 登录后进入独立后台；非 admin 不能进入 | todo |
| S3-T03 | 设计数据库 schema | 输出 users/sessions/profile/link/live-class schema | todo |
| S3-T04 | 改造注册登录业务 | 注册、登录、users/me 基于 schema，保留 demo seed | todo |

### O2：重构老师、学生、Live Class 关系

| ID | 任务 | 交付 | 状态 |
|---|---|---|---|
| S3-T05 | 建立 teacher-student 默认关系 | 测试老师默认绑定测试学生 | todo |
| S3-T06 | 建立 live_class_student 关系 | Live Class 可批量选择学生 | todo |
| S3-T07 | 学生搜索接口 | 按用户名、姓名、学号模糊搜索 | todo |
| S3-T08 | 老师端学生选择 UI | 不再只靠邮箱添加，支持勾选默认班级学生 | todo |

### O3：打通课程、课件、homework 到学生端

| ID | 任务 | 交付 | 状态 |
|---|---|---|---|
| S3-T09 | 课程可见性修复 | 老师创建课程/Live Class 后，绑定学生可见 | todo |
| S3-T10 | 课件归属 Live Class | 一个课件只属于一个 Live Class，一个 Live Class 多课件 | todo |
| S3-T11 | homework 归属 Live Class | 一个 Live Class 可上传多个 homework Excel | todo |
| S3-T12 | 学生端 homework 过滤 | 学生只看到自己所属 Live Class 的任务 | todo |

### O4：修复 PDF 与画笔

| ID | 任务 | 交付 | 状态 |
|---|---|---|---|
| S3-T13 | PDF 静态资源与 URL 修复 | 上传后的 PDF 可由前端访问 | todo |
| S3-T14 | PDF.js worker 修复 | 不再渲染加载失败 | todo |
| S3-T15 | 拆分 PDF canvas 与批注 canvas | 画笔绘制不触发白屏 | todo |
| S3-T16 | 画笔回归测试 | samples PDF + 画笔 smoke 通过 | todo |

### O5：Admin 后台服务化

| ID | 任务 | 交付 | 状态 |
|---|---|---|---|
| S3-T17 | Admin 账号管理 | 查看、搜索、新增、删除、禁用账号 | todo |
| S3-T18 | Admin 文件/多媒体管理 | 查看 PDF/PPTX/Excel/录音/录播文件 | todo |
| S3-T19 | Admin 学习数据管理 | 查看作业、学习记录、学习进度 | todo |
| S3-T20 | Admin 服务状态 | API health、TTS status、存储容量概览 | todo |

### O6：样例素材与验收测试

| ID | 任务 | 交付 | 状态 |
|---|---|---|---|
| S3-T21 | 样例 Excel/PDF/PPTX | `tests/samples/generated/` 下多套素材 | done |
| S3-T22 | 后端 API 测试扩展 | 注册登录、学生绑定、homework 导入、学生查询 | todo |
| S3-T23 | Playwright smoke | admin/teacher/student 三角色主链路 | todo |
| S3-T24 | 公网验收脚本 | 老师演示流程和学生试采流程 | todo |

## Execution Order

1. S3-T01、S3-T02：先修路由和门禁，避免测试路径污染。
2. S3-T03、S3-T04：补 schema，再动注册登录业务。
3. S3-T05 到 S3-T12：重构 Live Class 关系并打通学生端。
4. S3-T13 到 S3-T16：集中修 PDF 和画笔。
5. S3-T17 到 S3-T20：补 Admin 后台真实运营能力。
6. S3-T22 到 S3-T24：补自动化和公网验收。

## Definition Of Done

- `npm run lint` 通过。
- `npm run build` 通过。
- `npm test` 通过。
- PRD JSON 可解析。
- samples Excel/PDF/PPTX 全部可用于上传测试。
- 老师账号能完成：登录、创建 Live Class、选择学生、上传课件、上传 homework。
- 学生账号能完成：登录、看到所属 Live Class/课程、打开 homework、听 TTS、录音、保存记录。
- Admin 账号能完成：登录后台、查看账号/资源/学习数据/服务状态。

