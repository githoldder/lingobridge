#!/usr/bin/env bash
# LingoBridge 部署脚本 — Tencent Cloud
# 用法:
#   ./scripts/deploy.sh build          # 仅构建前端
#   ./scripts/deploy.sh cos <bucket>   # 构建并上传前端到 COS
#   ./scripts/deploy.sh server <host>  # 构建并 rsync 到服务器
#   ./scripts/deploy.sh help           # 显示详细说明
set -euo pipefail
cd "$(dirname "$0")/.."

DIST_DIR="./dist"
BACKEND_DIR="./backend"
BUILD_LOG="./deploy-build.log"

require_api_url() {
  if [ -z "${VITE_API_BASE_URL:-}" ]; then
    echo "✗ 必须设置 VITE_API_BASE_URL 环境变量指向公网 API 地址"
    echo "  用法: VITE_API_BASE_URL=https://api.lingobridge.com/api/v1 $0 $*"
    exit 1
  fi
  echo "  VITE_API_BASE_URL=$VITE_API_BASE_URL"
}

echo "=== LingoBridge 部署工具 ==="

case "${1:-help}" in
  build)
    require_api_url "$@"
    echo "→ 构建前端 (VITE_API_BASE_URL=$VITE_API_BASE_URL)..."
    VITE_API_BASE_URL="$VITE_API_BASE_URL" npm run build 2>&1 | tee "$BUILD_LOG"
    echo "✓ 构建完成: $DIST_DIR"
    echo "  大小: $(du -sh "$DIST_DIR" 2>/dev/null | cut -f1)"
    ;;

  cos)
    BUCKET="${2:?Usage: $0 cos <bucket-name>}"
    REGION="${3:-ap-guangzhou}"
    require_api_url "$@"
    echo "→ 构建前端 (VITE_API_BASE_URL=$VITE_API_BASE_URL)..."
    VITE_API_BASE_URL="$VITE_API_BASE_URL" npm run build 2>&1 | tee "$BUILD_LOG"
    echo "→ 上传到 COS: cos://$BUCKET/"
    if command -v coscli &>/dev/null; then
      coscli sync "$DIST_DIR/" "cos://$BUCKET/" -r
    elif command -v coscmd &>/dev/null; then
      coscmd -b "$BUCKET" -r "$REGION" upload -r "$DIST_DIR/" /
    else
      echo "✗ 需要安装 coscli 或 coscmd"
      echo "  安装: pip install coscmd"
      exit 1
    fi
    echo "✓ 已部署到 COS bucket: $BUCKET"
    # 输出可能的 CDN/访问地址
    echo "  预览地址: https://${BUCKET}.cos.${REGION}.myqcloud.com"
    ;;

  server)
    HOST="${2:?Usage: $0 server <user@host>}"
    REMOTE_DIR="${3:-/var/www/lingobridge}"
    require_api_url "$@"
    echo "→ 构建前端 (VITE_API_BASE_URL=$VITE_API_BASE_URL)..."
    VITE_API_BASE_URL="$VITE_API_BASE_URL" npm run build 2>&1 | tee "$BUILD_LOG"
    echo "→ 同步到 $HOST:$REMOTE_DIR ..."
    rsync -avz --delete "$DIST_DIR/" "$HOST:$REMOTE_DIR/frontend/"
    rsync -avz --delete "$BACKEND_DIR/" --exclude 'node_modules' --exclude 'data' "$HOST:$REMOTE_DIR/backend/"
    echo "✓ 同步完成"
    echo ""
    echo "  后端部署步骤 (在服务器上执行):"
    echo "    cd $REMOTE_DIR/backend"
    echo "    npm install --production"
    echo "    pm2 start ecosystem.config.cjs"
    ;;

  help|*)
    cat <<'HELP'
用法:
  VITE_API_BASE_URL=https://api.lingobridge.com/api/v1 ./scripts/deploy.sh build
  VITE_API_BASE_URL=https://api.lingobridge.com/api/v1 ./scripts/deploy.sh cos <bucket> [region]
  VITE_API_BASE_URL=https://api.lingobridge.com/api/v1 ./scripts/deploy.sh server <user@host> [path]

前置条件:
  1. 设置 VITE_API_BASE_URL 环境变量指向公网 API（缺失则构建失败）
  2. 安装 AWS CLI 风格的 coscli:  https://github.com/tencentyun/coscli
     或 pip install coscmd

  3. 配置 COS 凭证:
     coscli config  # 或 coscmd config

  4. 创建 COS Bucket (如未创建):
     - 登录 https://console.cloud.tencent.com/cos
     - 创建 Bucket (建议: lingobridge-demo)
     - 开启"静态网站"功能
     - 设置 Index 文档为 index.html, Error 文档为 index.html (SPA)
     - (可选)绑定 CDN 域名

一键部署到 COS:
  VITE_API_BASE_URL=https://api.lingobridge.com/api/v1 ./scripts/deploy.sh cos lingobridge-demo ap-guangzhou

回滚步骤:
  1. COS 版本控制: 如果开启了版本控制, 可在 COS 控制台恢复历史版本
  2. 手动回滚: 用上一个构建产物覆盖:
     coscli sync ./dist_previous/ cos://lingobridge-demo/ -r
  3. 代码回滚: git revert 或 git reset + 重新部署

HELP
    ;;
esac
