#!/usr/bin/env bash
set -euo pipefail

ENDPOINT="${1:-http://127.0.0.1:3001/api/v1/health}"
BASE_URL="${ENDPOINT%/health}"
PASS=false

check() {
  local label="$1" method="$2" url="$3" expected="$4"
  shift 4
  local extra=("$@")
  local raw

  if [ ${#extra[@]} -gt 0 ]; then
    raw=$(curl --noproxy "*" -s -w "%{http_code}" "${extra[@]}" -X "$method" "$url" 2>/dev/null || true)
  else
    raw=$(curl --noproxy "*" -s -w "%{http_code}" -X "$method" "$url" 2>/dev/null || true)
  fi
  resp="${raw: -3}"

  if [ "$resp" = "$expected" ]; then
    echo "  PASS  $label"
  else
    echo "  FAIL  $label (expected $expected, got $resp)"
    PASS=false
  fi
}

echo "LingoBridge Health Check"
echo "Target: $ENDPOINT"
echo ""

PASS=true

check "Health endpoint" GET "$BASE_URL/health" 200
check "Demo login" POST "$BASE_URL/auth/login" 200 \
  -H "Content-Type: application/json" \
  --data '{"email":"teacher@test.com","password":"Test@123456"}'
check "Course list" GET "$BASE_URL/courses" 200

echo ""
if [ "$PASS" = true ]; then
  echo "All checks passed."
  exit 0
else
  echo "Some checks failed."
  exit 1
fi
