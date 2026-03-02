#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/app/deploy/what-to-wear/frontend}"
ENV_FILE="${ENV_FILE:-${PROJECT_DIR}/.env.vps}"
EXPO_PORT="${EXPO_PORT:-8081}"
EXPO_USE_DEV_CLIENT="${EXPO_USE_DEV_CLIENT:-1}"

if [[ ! -d "${PROJECT_DIR}" ]]; then
  echo "Error: PROJECT_DIR does not exist: ${PROJECT_DIR}" >&2
  exit 1
fi

cd "${PROJECT_DIR}"

if [[ -f "${ENV_FILE}" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a
fi

if [[ -z "${EXPO_TOKEN:-}" ]]; then
  echo "Error: EXPO_TOKEN is missing. Set it in ${ENV_FILE} or environment." >&2
  exit 1
fi

if [[ -z "${EXPO_TUNNEL_SUBDOMAIN:-}" ]]; then
  echo "Error: EXPO_TUNNEL_SUBDOMAIN is missing. Set it in ${ENV_FILE} or environment." >&2
  exit 1
fi

expo_args=(start --tunnel --non-interactive --port "${EXPO_PORT}")
if [[ "${EXPO_USE_DEV_CLIENT}" == "1" ]]; then
  expo_args=(start --dev-client --tunnel --non-interactive --port "${EXPO_PORT}")
fi

echo "Starting Expo on port ${EXPO_PORT} (dev-client=${EXPO_USE_DEV_CLIENT}, subdomain=${EXPO_TUNNEL_SUBDOMAIN})"
exec npx expo "${expo_args[@]}"
