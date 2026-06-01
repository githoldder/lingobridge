# AI v2.0 Demo Runbook

> LingoBridge v2.0 本地演示标准操作手册。
> 覆盖 Python 管线运行、PM2 进程管理、三端页面访问和 Sprint Review 流程。

---

## 目录

1. [环境检查](#1-环境检查)
2. [PM2 进程管理](#2-pm2-进程管理)
3. [Python ML 管线运行](#3-python-ml-管线运行)
4. [三端页面访问](#4-三端页面访问)
5. [Sprint Review 闸门](#5-sprint-review-闸门)
6. [Git / Ralph 执行纪律](#6-git--ralph-执行纪律)
7. [禁止事项](#7-禁止事项)

---

## 1. 环境检查

### 1.1 Python 环境（二选一）

**推荐 uv：**

```bash
cd /Users/caolei/Desktop/LingoBridge
uv venv 2>/dev/null || true
uv pip install -r analysis/ai-learning-recommendation/requirements.txt
```

**兜底 Anaconda：**

```bash
cd /Users/caolei/Desktop/LingoBridge
conda env create -f analysis/ai-learning-recommendation/environment.yml
conda activate lingobridge-ai-v2
```

### 1.2 PM2 状态检查

```bash
npm run pm2:status   # 查看进程状态
pm2 status
```

预期：两个进程均为 `online`。

---

## 2. PM2 进程管理

### 2.1 基础命令

| 操作 | 命令 |
|------|------|
| 启动（全部） | `npm run pm2:start` |
| 重启（全部） | `npm run pm2:restart` |
| 查看日志 | `npm run pm2:logs` |
| 停止（全部） | `npm run pm2:stop` |
| 状态详情 | `pm2 status` |
| 单进程重启 | `pm2 restart lingobridge-backend` |

### 2.2 PM2 管理的两个进程

| 进程名 | 实际脚本 | 说明 |
|--------|----------|------|
| `lingobridge-backend` | `tsx backend/src/server.ts` | 后端 API，端口 3001 |
| `lingobridge-frontend-preview` | `vite preview --port 4174` | 前端预览，端口 4174 |

### 2.3 避免僵尸进程规则

> **每次演示前必须检查 PM2 状态。**

1. **演示前**：运行 `pm2 status`，确认两个进程均为 `online`。
2. **端口异常**：先 `npm run pm2:restart`，不要手工 `kill` 无关进程。
3. **进程残留**：如果 `pm2 status` 显示 `stopped` 而非 `online`，执行 `pm2 restart <name>`。
4. **清理无效进程**：`pm2 delete <name>` 移除已停止且不再需要的进程。
5. **不要使用 `kill -9`**：PM2 管理的进程使用 `pm2 stop`/`pm2 restart`，避免破坏 PM2 进程表。
6. **Vite dev server**：只有明确需要热更新时才临时使用 `npm run dev`；演示结束后必须清理。

### 2.4 ecosystem.config.cjs 关键配置

```js
// 两个 PM2 进程配置（来自 ecosystem.config.cjs）
apps: [
  {
    name: 'lingobridge-backend',
    script: './node_modules/.bin/tsx',
    args: 'backend/src/server.ts',
    cwd: __dirname,           // 项目根目录
    env: { PORT: '3001' },
    max_memory_restart: '500M',
    restart_delay: 3000,
    time: true
  },
  {
    name: 'lingobridge-frontend-preview',
    script: './node_modules/.bin/vite',
    args: 'preview --host 127.0.0.1 --port 4174 --strictPort',
    cwd: __dirname,
    max_memory_restart: '500M',
    restart_delay: 3000,
    time: true
  }
]
```

---

## 3. Python ML 管线运行

### 3.1 一键运行

```bash
cd /Users/caolei/Desktop/LingoBridge
python3 analysis/ai-learning-recommendation/run_pipeline.py
```

### 3.2 步骤验证（可选）

```bash
# 1. 生成合成样本
python3 analysis/ai-learning-recommendation/src/generate_sample_data.py

# 2. 预处理
python3 analysis/ai-learning-recommendation/src/preprocess.py

# 3. 训练/画像
python3 analysis/ai-learning-recommendation/src/train_model.py

# 4. 推荐
python3 analysis/ai-learning-recommendation/src/recommend.py
```

### 3.3 输出检查

```bash
# 检查时间戳是否为最新（演示前必须）
ls -la analysis/ai-learning-recommendation/output/*.json

# 验证 JSON 格式
python3 -m json.tool analysis/ai-learning-recommendation/output/student_profiles.json | head -20
python3 -m json.tool analysis/ai-learning-recommendation/output/recommendations.json | head -20
```

---

## 4. 三端页面访问

> 默认前端预览地址：`http://127.0.0.1:4174`

### 4.1 学生端

- **入口**：`http://127.0.0.1:4174`
- **演示账号**：学生账号（如 `student1` / `student1`）
- **验证点**：
  - 首页是否有 AI 学习助手卡片（展示学习画像、推荐练习）
  - 个人排名页是否展示数据分析视图

### 4.2 教师端

- **入口**：`http://127.0.0.1:4174`
- **演示账号**：教师账号（如 `teacher1` / `teacher1`）
- **验证点**：
  - 学生总览页是否有班级洞察 summary（高风险学生数、共性薄弱点）
  - 学生行是否有 risk badge

### 4.3 Admin 端

- **入口**：`http://127.0.0.1:4174`
- **演示账号**：`admin` / `admin`
- **验证点**：
  - 是否有 analytics tab 或 summary band
  - 数据中台看板展示 totalStudents、modelVersion、recommendationCount

### 4.4 后端 API（可选）

```bash
curl http://127.0.0.1:3001/api/v1/health
curl http://127.0.0.1:3001/api/v1/analytics/student-profile?studentId=demo-student-01
```

---

## 5. Sprint Review 闸门

> **每个 Sprint 结束后必须输出 Review，先 Review 后 Push。**

### 5.1 Review 清单

Review 必须包含以下六个维度：

| 维度 | 内容 |
|------|------|
| **完成项** | 列出本 Sprint 已完成的所有 task/step |
| **未完成项** | 列出未完成或延期的 task/step，说明原因 |
| **风险** | 本 Sprint 遇到的技术风险和 product risk |
| **测试结果** | `npm run lint`、`npm run backend:test`、`npm run build`、AI smoke 结果 |
| **未提交文件** | `git status --short` 列出所有已修改但未 commit 的文件 |
| **不应提交文件** | 明确列出本地临时文件、不应 push 的文件（如 `output/playwright/`、`test-results/`、`backend/storage/`、`backend/data/db.json` 变更） |
| **建议是否 Push** | 根据以上维度综合判断，输出 YES/NO + 理由 |

### 5.2 Review 流程

```
Sprint 完成
    ↓
运行验证命令
    ↓
整理 Review 六个维度
    ↓
提交 Review 到 context/context.txt 或 docs/03-testing-deployment/
    ↓
用户确认是否 Push
    ↓
用户确认后执行最终 git push
    ↓
Sprint 结束
```

### 5.3 验证命令参考

```bash
# JSON PRD 校验
python3 -m json.tool prds/json/sprint09-prd-260601-v2.0.json > /dev/null && echo "JSON OK"

# TypeScript 编译
npm run lint

# 后端测试
npm run backend:test

# 前端构建
npm run build

# Python 管线
python3 analysis/ai-learning-recommendation/run_pipeline.py
```

---

## 6. Git / Ralph 执行纪律

### 6.1 Commit 规则

- **每完成一个 task 或可独立回滚的 subtask 立即本地 commit**。
- **Commit message 必须包含 taskId 或 stepId**，格式：`feat/ai-v2: complete S9-TXX-SXX (... description ...)`
- **只 stage 当前 task 相关文件**，不要混合无关改动。
- **禁止在 Sprint 执行中直接 `git push`**。
- Sprint 结束后先 Review，用户确认后再 Push。

### 6.2 回滚规则

- **优先使用 `git revert <commit-hash>`**，保留历史记录。
- **禁止 `git reset --hard`**，除非用户明确要求。
- **不要用 `git checkout` 覆盖用户改动**。

### 6.3 提交前检查

```bash
# 查看待提交文件
git status --short

# 确认不含禁止文件
rg -n "backend/storage/|backend/data/db.json|\.env|output/playwright/|test-results/" --glob "*.{ts,tsx,js,json,md}"
```

### 6.4 长期规则 vs 短期记忆

| 类型 | 存储位置 | 规则 |
|------|----------|------|
| 短期踩坑、执行经验 | `context/context.txt` | Sprint 结束后记录，当前 Sprint 本地 commit |
| 长期规则 | `.agent/rules/` 或 `prds/current/` | 必须经用户认可后才能写入 |

### 6.5 Sprint Review 输出模板

```markdown
# Sprint 09 v2.0 Review — S9-T00~T0X

## 完成项
- S9-T00-S01: Python 环境策略文档完成
- S9-T00-S02: PM2 进程治理文档完成
- ...

## 未完成项
- S9-T01-S03: （原因：...）

## 风险
- Python 管线在上台机器缺少 uv，需使用 conda 兜底

## 测试结果
- `npm run lint`: PASSED
- `npm run backend:test`: PASSED 9/9
- `npm run build`: PASSED
- `python3 run_pipeline.py`: PASSED

## 未提交文件
- analysis/ai-learning-recommendation/src/new_script.py

## 不应提交文件
- output/playwright/*.png
- test-results/*.log

## 建议是否 Push
NO — 建议先完成 S9-T02 剩余步骤再合并推送。
```

---

## 7. 禁止事项

### 7.1 绝对禁止

- 禁止读取或提交 `backend/storage/` 下的真实上传文件、录音文件。
- 禁止读取或提交 `backend/data/db.json` 的真实运行数据变更。
- 禁止提交 `.env*` 文件（含密钥、token）。
- 禁止提交 `output/playwright/` 下的临时截图、`test-results/` 下的临时报告。
- 禁止将本地私有绝对路径（如 `/Users/caolei/...`）写入代码或注释。
- 禁止在 Sprint 执行期间直接 `git push`。
- 禁止使用 `git reset --hard` 回滚。
- 禁止将真实学生姓名、邮箱、音频 URL 写入 `analysis/` 目录。
- 禁止将未完成的 ASR 云评分、实时深度学习训练、多租户 SaaS 写成已完成事实。

### 7.2 MVP 主流程禁改

- 不得重写登录、课程、课堂、课件上传、Excel 作业导入、录音、作业提交流程。
- 不得改动 `src/components/HomeworkView.tsx` 的录音/提交/草稿逻辑。
- 不得改动 `src/components/TeacherClassroomView.tsx` 和 `src/components/StudentClassroomView.tsx` 的媒体权限逻辑。
- 不得改动 `backend/src/providers/` 下的 TTS/Speech Provider。
- 不得改动 `docker/`、`vercel.json`、`.env*`。

---

## 附录：验证命令速查

```bash
# PM2 状态
pm2 status

# Python 管线
python3 analysis/ai-learning-recommendation/run_pipeline.py

# 三端验证（关键词扫描）
rg -n "uv|conda|Anaconda|PM2|pm2|Ralph|commit|review|push|context|memory|踩坑" \
  docs/03-testing-deployment/ai-v2-demo-runbook.md \
  analysis/ai-learning-recommendation/README.md \
  context/context.txt

# Git 状态
git status --short --branch

# JSON PRD 校验
python3 -m json.tool prds/json/sprint09-prd-260601-v2.0.json

# 私有路径扫描
rg -n "/Users/|file:///Users|OPENAI_API_KEY|JWT_SECRET|password" \
  docs/03-testing-deployment/ai-v2-demo-runbook.md \
  analysis/ai-learning-recommendation/README.md \
  context/context.txt
```