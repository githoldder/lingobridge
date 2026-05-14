#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_DIR"

echo "=== LingoBridge Deployment ==="

echo "1. Installing dependencies..."
npm install

echo "2. Building frontend..."
npm run build

echo "3. Building and starting Docker services..."
cd docker
docker compose build
docker compose up -d

echo ""
echo "=== Deployment complete ==="
echo "Frontend: http://<server-ip>"
echo "Health:   http://<server-ip>/api/v1/health"

echo ""
echo "Running health check..."
sleep 3
curl --noproxy "*" -s http://127.0.0.1/api/v1/health || echo "WARNING: Health check failed — check container logs"
