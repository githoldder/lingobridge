#!/usr/bin/env bash
set -euo pipefail

echo "=== LingoBridge Seed ==="

ENDPOINT="${1:-http://127.0.0.1:3001/api/v1}"

echo "Seeding against $ENDPOINT"

echo "Creating demo course..."
curl -s -X POST "$ENDPOINT/courses" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer teacher-1" \
  -d '{"title":"第三课：自我介绍","description":"MVP demo seed course"}' > /dev/null

echo "Checking health..."
curl -s "$ENDPOINT/health"

echo ""
echo "=== Seed complete ==="
