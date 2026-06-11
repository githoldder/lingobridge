#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCS=("01-FA" "02-SRS" "03-HLD" "04-LLD" "05-TP" "06-DEP" "07-UM")
FAILED=()

echo "=========================================="
echo "  LingoBridge 文档一键编译"
echo "=========================================="

for DOC in "${DOCS[@]}"; do
  SCRIPT="${BASE_DIR}/${DOC}/scripts/build_manual.sh"
  if [ -f "${SCRIPT}" ]; then
    echo ""
    echo ">>> 编译 ${DOC} ..."
    if bash "${SCRIPT}"; then
      echo "<<< ${DOC} 编译成功"
    else
      echo "<<< ${DOC} 编译失败！"
      FAILED+=("${DOC}")
    fi
  else
    echo ">>> ${DOC}/scripts/build_manual.sh 不存在，跳过"
    FAILED+=("${DOC}")
  fi
done

echo ""
echo "=========================================="
if [ ${#FAILED[@]} -eq 0 ]; then
  echo "  全部 ${#DOCS[@]} 份文档编译成功！"
else
  echo "  编译失败的文档：${FAILED[*]}"
fi
echo "=========================================="
