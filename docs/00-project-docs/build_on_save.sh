#!/usr/bin/env bash
set -euo pipefail

DOCS_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INPUT_PATH="${1:-}"
DOCS=("01-FA" "02-SRS" "03-HLD" "04-LLD" "05-TP" "06-DEP" "07-UM")

abs_path() {
  local path="$1"
  if [ -z "${path}" ]; then
    return 1
  fi

  if [[ "${path}" != /* ]]; then
    path="${PWD}/${path}"
  fi

  local dir
  local base
  dir="$(dirname "${path}")"
  base="$(basename "${path}")"

  if [ -d "${dir}" ]; then
    printf '%s/%s\n' "$(cd "${dir}" && pwd)" "${base}"
  else
    return 1
  fi
}

run_full_build() {
  local doc="$1"
  local script="${DOCS_ROOT}/${doc}/scripts/build_manual.sh"
  local lock_root="${DOCS_ROOT}/.build-locks"
  local lock_dir="${lock_root}/${doc}.lock"

  if [ ! -f "${script}" ]; then
    echo "[build-on-save] Missing build script: ${script}" >&2
    return 1
  fi

  mkdir -p "${lock_root}"
  if ! mkdir "${lock_dir}" 2>/dev/null; then
    echo "[build-on-save] ${doc} is already building; skip this save."
    return 0
  fi
  trap "rm -rf '${lock_dir}'" RETURN

  echo "[build-on-save] Full build ${doc} via ${script}"
  bash "${script}"
}

if [ -z "${INPUT_PATH}" ]; then
  echo "[build-on-save] No file path received; nothing to build."
  exit 0
fi

ABS_INPUT="$(abs_path "${INPUT_PATH}")"

for doc in "${DOCS[@]}"; do
  doc_root="${DOCS_ROOT}/${doc}"
  case "${ABS_INPUT}" in
    "${doc_root}"/*)
      run_full_build "${doc}"
      exit 0
      ;;
  esac
done

case "${ABS_INPUT}" in
  "${DOCS_ROOT}/shared"/*)
    echo "[build-on-save] Shared asset changed; Cmd+S is current-document only, so nothing to build."
    ;;
  *)
    echo "[build-on-save] ${ABS_INPUT} is outside docs/00-project-docs/01-07; nothing to build."
    ;;
esac
