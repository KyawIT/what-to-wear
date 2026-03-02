#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/app/deploy/what-to-wear/frontend}"

if [[ ! -d "${PROJECT_DIR}" ]]; then
  echo "Error: PROJECT_DIR does not exist: ${PROJECT_DIR}" >&2
  exit 1
fi

cd "${PROJECT_DIR}"

if [[ ! -f "package.json" || ! -f "package-lock.json" ]]; then
  echo "Error: package.json/package-lock.json missing in ${PROJECT_DIR}" >&2
  exit 1
fi

echo "Installing frontend dependencies with npm ci (legacy peer deps enabled)..."
npm ci --legacy-peer-deps --no-audit --no-fund
