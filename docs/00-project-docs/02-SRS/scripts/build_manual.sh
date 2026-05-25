#!/usr/bin/env bash
# 清华 thuthesis manual 编译脚本

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_DIR="$(cd "${SCRIPT_DIR}/../templates" && pwd)"
MAIN="02-SRS"

cd "${TEMPLATE_DIR}"

export TEXINPUTS=".:./cls//:"
export BIBINPUTS=".:./ref//:"
export BSTINPUTS=".:./cls//:"

echo "=== 开始编译 thuthesis manual ==="
echo "工作目录: ${TEMPLATE_DIR}"
echo "模板路径: ${TEMPLATE_DIR}/cls"
echo "字体路径: ${TEMPLATE_DIR}/fonts"

echo "[1/4] XeLaTeX 第一次..."
xelatex -interaction=nonstopmode -halt-on-error "${MAIN}.tex"

echo "[2/4] BibTeX..."
bibtex "${MAIN}"

echo "[3/4] XeLaTeX 第二次..."
xelatex -interaction=nonstopmode -halt-on-error "${MAIN}.tex"

echo "[4/4] XeLaTeX 第三次..."
xelatex -interaction=nonstopmode -halt-on-error "${MAIN}.tex"

echo "=== 编译完成: ${TEMPLATE_DIR}/${MAIN}.pdf ==="
