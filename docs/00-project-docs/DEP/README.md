# 部署说明文档

## 1. 环境要求

### 1.1 硬件要求
| 资源 | 最低配置 | 推荐配置 |
|---|---|---|
| CPU | 1核 | 2核+ |
| 内存 | 2GB | 4GB+ |
| 磁盘 | 10GB | 20GB+ |

### 1.2 软件依赖
| 软件 | 版本要求 | 用途 |
|---|---|---|
| Node.js | 20.0+ | 运行后端服务与前端构建 |
| PM2 | 5.3+ | 进程管理（本地/直接部署）|
| Docker | 20.10+ | 容器化部署（生产环境推荐） |
| Docker Compose | 1.29+ | 多容器编排（后端+Nginx） |
| Nginx | 1.20+ | 反向代理（容器内或宿主机） |

*注：当前 LingoBridge MVP 阶段使用基于本地文件的 JSON 数据库 (`backend/data/db.json`)，无需安装 MySQL 或 Redis 等外部数据库依赖。*

### 1.3 网络要求
- 服务器需开放端口：22（SSH）、80/443（HTTP/HTTPS）
- 内部应用端口：后端运行在 3001 端口，前端运行在 3000/4174 端口。
- 域名已备案（如需公网访问）

## 2. 部署前准备

### 2.1 服务器与环境初始化
```bash
# 1. 更新系统
sudo apt update && sudo apt upgrade -y

# 2. 安装 Node.js 与 PM2
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pm2

# 3. 安装Docker与Docker Compose（推荐）
curl -fsSL https://get.docker.com | sh
```

### 2.2 数据库初始化
本项目在 MVP 阶段采用无外置依赖的 JSON 文件存储，无需预先安装 MySQL 或 Redis 数据库。
数据库文件将自动在运行期间生成或读取于 `backend/data/db.json` 中。
如果需要重置，可确保 `backend/data/db.json` 文件具有读写权限或直接从 `backend/src/db.ts` 中的 seed 数据重新生成。

## 3. 部署步骤

### 3.1 项目目录结构
```
/opt/lingobridge/
├── docker/
│   ├── docker-compose.yml
│   └── nginx/
├── backend/
│   ├── data/        # 自动生成的数据库JSON文件
│   └── src/
├── dist/            # 前端打包产物
├── ecosystem.config.cjs
├── package.json
└── ...
```

### 3.2 环境配置
复制环境变量文件并根据需要修改：
```bash
cp .env.example .env
```
配置示例：
```bash
# 后端配置
HOST=0.0.0.0
PORT=3001
# 如果有其他例如 JWT Secret 等变量
```

### 3.3 启动服务 (PM2 方式)
如果是直接在宿主机进行进程管理：
```bash
# 1. 进入项目目录
cd /opt/lingobridge

# 2. 安装依赖并构建前端
npm install
npm run build

# 3. 使用 PM2 启动服务（根据 ecosystem.config.cjs 启动后端和前端）
npm run pm2:start

# 4. 查看日志
npm run pm2:logs
```

### 3.4 启动服务 (Docker 方式)
如果是基于容器化部署（生产推荐）：
```bash
# 1. 确保前端已构建（或使用多阶段构建）
npm run build

# 2. 进入 docker 目录
cd docker

# 3. 启动所有服务（backend 容器 + nginx 容器）
docker-compose up -d

# 4. 查看服务状态与日志
docker-compose ps
docker-compose logs -f
```

## 4. 验证部署

### 4.1 服务健康检查

| 检查项 | 预期结果 | 检查命令 |
|---|---|---|
| 后端 API | HTTP响应 | `curl -I http://localhost:3001/api/v1/users/me` |
| 前端页面 | HTTP 200 | `curl -I http://localhost:80/` |
| 数据目录权限 | 具有写权限 | `ls -ld backend/data` |

### 4.2 业务验证
- [ ] 访问 http://域名/ 查看首页可正常加载
- [ ] 使用默认 admin / teacher / student 账号进行登录测试
- [ ] 后台上传一次 PDF 或 Excel，确认存储路径是否正常写入

## 5. 常用运维操作

### 5.1 日志查看
```bash
# PM2 日志
npm run pm2:logs

# Docker 日志
docker-compose logs -f backend
```

### 5.2 数据备份
只需打包备份 `backend/data/` 目录和上传的静态文件即可，无须 mysqldump。
```bash
# 备份数据文件与存储
tar -czf backup_data_$(date +%Y%m%d).tar.gz backend/data/ backend/storage/
```

### 5.3 回滚方案
代码回滚：
```bash
# 回滚到指定版本
git checkout v1.0.0
npm install && npm run build
npm run pm2:restart
# 或 docker-compose up -d --build backend
```
数据回滚：
```bash
# 恢复备份的 JSON 数据文件
tar -xzf backup_data_20240401.tar.gz -C /opt/lingobridge/
```

## 6. 故障排查

| 症状 | 可能原因 | 解决方法 |
|---|---|---|
| 应用无法启动 | 端口冲突 | 检查端口占用：`lsof -i :3001` 或 `:80` |
| 无法登录/注册 | 数据文件无写权限 | 确保 `backend/data/` 和 `backend/data/db.json` 有写权限 |
| 502 Bad Gateway | Nginx无法连接到后端 | 检查后端进程是否运行正常，确认反向代理配置中端口号匹配 |
| 前端静态资源 404 | Vite 构建路径错误 | 检查 `dist` 目录是否存在且被 Nginx 正确代理 |

## 7. 安全加固建议

- [ ] 配置防火墙，仅对外开放 80/443 端口，不暴露 3001 端口给公网
- [ ] 启用 HTTPS（建议使用 Let's Encrypt 配置于 Nginx 中）
- [ ] 限制 `backend/data` 和 `backend/storage` 目录的系统级别访问权限
- [ ] 对于正式环境上线前，考虑是否需要重构为 MySQL/PostgreSQL 等关系型数据库

---

#### 部署文档检查清单

- [ ] 覆盖所有部署场景（本地PM2 / 容器化Docker）
- [ ] 每步命令有注释说明用途
- [ ] 敏感配置项有占位符说明（无硬编码明文密码）
- [ ] 有健康检查方法（如何判断部署成功）
- [ ] 有回滚方案（针对代码和基于本地文件的数据库）
- [ ] 有故障排查表（常见问题和解决方案）
- [ ] 有备份策略说明（JSON文件备份而非SQL dump）
- [ ] 目录结构与实际部署一致
- [ ] 端口号与实际配置一致（3001, 80 等）
- [ ] 安全加固建议已包含
