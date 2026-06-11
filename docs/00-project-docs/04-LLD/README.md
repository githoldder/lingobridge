# 软件详细设计说明书（LLD）

<div align="center">

**项目名称：** LingoBridge
**文档版本：** v4.1

</div>

---

## 1. 引言
本文档基于 HLD 进一步细化 LingoBridge 的模块实现细节，重点说明本地 JSON 存储结构、前后端核心流程和错误处理。

## 2. 数据库与存储详细设计 (db.ts)

由于本项目采用基于本地文件的 JSON 持久化方案，核心的数据访问在 `backend/src/db.ts` 中完成。

### 2.1 核心数据结构设计
整个系统的数据作为一个 JSON Object（即 `Database` 类型）缓存在内存，并定时/触发落盘。

关键类型与字段：
```typescript
type Database = {
  users: User[];
  sessions: Session[];
  courses: Course[];
  lessonNodes: LessonNode[];
  assignmentNodes: AssignmentNode[];
  learningRecords: LearningRecord[];
  files: CoursewareFile[]; // 关联的 PDF/PPTX
  teacherStudentLinks: TeacherStudentLink[];
};

// 学习记录实体设计
interface LearningRecord {
  id: string; // 唯一 UUID
  studentId: string;
  lessonNodeId: string;
  taskId: string;
  status: 'pending' | 'completed';
  lastRecordingId?: string; // 关联上传的录音文件路径/ID
}
```

### 2.2 数据读写策略
- **读取**：服务启动时 `ensureDb()` 读取 `backend/data/db.json`，若文件不存在则从 seed 初始化并建立目录。
- **写入**：所有修改操作（Upsert）在更新内存 `cached` 对象后，调用 `writeDb(cached)` 覆盖文件。
- **注意**：目前 Express 采取单线程异步写入，在极高并发下可能会出现争用覆盖。作为 MVP 暂时接受此风险。

## 3. 核心功能流程设计

### 3.1 身份控制与 GuestGate 流程
**前端实现：**
1. 页面加载，调用 `useAuth()`，从 localStorage/cookie 中提取 token 请求 `/api/v1/users/me`。
2. 未登录则挂载 `role: 'guest'`。
3. 渲染 `<GuestGate />` 高阶组件：包裹所有要求权限的 Button。如果 user 是 guest，拦截 `onClick` 并展示登录弹窗；否则正常触发动作。

### 3.2 教师布置课时与作业 (Live -> Lesson -> Assignment)
1. 教师在前端选择课程，点击“创建 Live”。
2. 后端接收请求：
   - 生成 UUID `liveSessionId`。
   - 同步生成关联的 `lessonNodeId`（课时）。
   - 针对该课时生成一个 `assignmentNodeId`（该堂课作业）。
3. 前后端约束：**强制维持 一对一 映射关系。** 学生访问 Live 时，能无缝顺延到对应的作业节点提交记录。

### 3.3 画笔工具 (Canvas Integration)
- **底层技术**：在 PDF 渲染层之上叠加绝对定位的 `<canvas>`。
- **状态维护**：以 `pageNumber` 为键，存储该页的涂鸦状态数组。翻页时根据 `currentPage` 切回历史笔迹或空白。
- **清除逻辑**：触发 `clearInk` 动作时，仅清空 `inkData[currentPage]`，而非整堂课数据。

## 4. 异常处理设计

| 异常场景 | 后端行为 | 前端行为 |
|---|---|---|
| JWT 伪造或过期 | 抛出 401 Unauthorized | AuthContext 拦截 401，清空状态并跳登录页 |
| `db.json` 文件写锁失败 | 抛出 500 Internal Error 并打 Log | 提示“数据保存失败，请稍后重试” |
| PDF 上传超限 (>50MB) | Express 文件中间件抛出 413 Payload Too Large | 上传弹窗抛出明确的体积限制提示 |

---

#### LLD 检查清单
- [x] 是否清晰描述了本地 JSON 读取和存储的技术路线。
- [x] 门禁控制的逻辑代码实现路径（`GuestGate`）已明确。
- [x] 模块内部依赖关系不涉及超出真实栈的内容。
