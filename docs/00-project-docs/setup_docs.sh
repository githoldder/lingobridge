#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_TEMPLATE="/Users/caolei/Desktop/LatexCenterTool/packages/thuthesis-manual-writing-kit"
SHARED="${BASE_DIR}/shared"
DOCS=("FA" "SRS" "HLD" "LLD" "TP" "DEP" "UM")

for DOC in "${DOCS[@]}"; do
  DIR="${BASE_DIR}/${DOC}"
  echo "=== Creating ${DOC} ==="
  mkdir -p "${DIR}/templates/data" "${DIR}/templates/figures" "${DIR}/templates/ref" "${DIR}/scripts"

  # Copy thusetup.tex and main tex
  cp "${SRC_TEMPLATE}/templates/thusetup.tex" "${DIR}/templates/"
  cp "${SRC_TEMPLATE}/templates/thuthesis-example.tex" "${DIR}/templates/"

  # Copy ref
  cp "${SRC_TEMPLATE}/templates/ref/refs.bib" "${DIR}/templates/ref/"

  # Symlink fonts and cls to shared
  ln -snf "${SHARED}/fonts" "${DIR}/templates/fonts"
  ln -snf "${SHARED}/cls" "${DIR}/templates/cls"

  # Copy and adapt build script
  cp "${SRC_TEMPLATE}/scripts/build_manual.sh" "${DIR}/scripts/"
  cp "${SRC_TEMPLATE}/scripts/Makefile" "${DIR}/scripts/"
  chmod +x "${DIR}/scripts/build_manual.sh"

  echo "  ${DOC} created."
done

echo "=== All doc projects created ==="
