#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env.vps}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Error: env file not found: ${ENV_FILE}" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

errors=0

require_var() {
  local var_name="$1"
  local value="${!var_name:-}"
  if [[ -z "${value}" ]]; then
    echo "Missing required variable: ${var_name}" >&2
    errors=$((errors + 1))
  fi
}

validate_public_url() {
  local var_name="$1"
  local value="${!var_name:-}"

  if [[ -z "${value}" ]]; then
    return
  fi

  if [[ "${value}" != http://* && "${value}" != https://* ]]; then
    echo "Invalid URL (${var_name}): must start with http:// or https://" >&2
    errors=$((errors + 1))
    return
  fi

  if [[ "${value}" == *"localhost"* || "${value}" == *"127.0.0.1"* || "${value}" == *"::1"* ]]; then
    echo "Invalid URL (${var_name}): localhost loopback addresses are not reachable from iPhone testing." >&2
    errors=$((errors + 1))
  fi
}

required_vars=(
  EXPO_TOKEN
  EXPO_TUNNEL_SUBDOMAIN
  EXPO_PUBLIC_BACKEND_ROOT
  EXPO_PUBLIC_BETTER_AUTH_URL
  EXPO_PUBLIC_KC_ISSUER
  EXPO_PUBLIC_KC_CLIENT_ID
  EXPO_PUBLIC_KC_LOGOUT_URL
  EXPO_PUBLIC_KC_POST_LOGOUT_REDIRECT_URL
)

required_url_vars=(
  EXPO_PUBLIC_BACKEND_ROOT
  EXPO_PUBLIC_BETTER_AUTH_URL
  EXPO_PUBLIC_KC_ISSUER
  EXPO_PUBLIC_KC_LOGOUT_URL
)

optional_url_vars=(
  EXPO_PUBLIC_REMBG_URL
)

for var_name in "${required_vars[@]}"; do
  require_var "${var_name}"
done

for var_name in "${required_url_vars[@]}"; do
  validate_public_url "${var_name}"
done

for var_name in "${optional_url_vars[@]}"; do
  validate_public_url "${var_name}"
done

if [[ "${errors}" -gt 0 ]]; then
  echo "Validation failed with ${errors} issue(s)." >&2
  exit 1
fi

echo "Env file looks valid for VPS remote iPhone testing: ${ENV_FILE}"
