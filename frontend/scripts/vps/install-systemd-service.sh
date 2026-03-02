#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="${SERVICE_NAME:-wtw-expo}"
APP_DIR="${APP_DIR:-/app/deploy/what-to-wear/frontend}"
RUN_AS_USER="${RUN_AS_USER:-root}"
EXPO_PORT="${EXPO_PORT:-8081}"
EXPO_USE_DEV_CLIENT="${EXPO_USE_DEV_CLIENT:-1}"
NODE_MAJOR="${NODE_MAJOR:-20}"
SERVICE_PATH="/etc/systemd/system/${SERVICE_NAME}.service"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Error: run this script as root (or with sudo)." >&2
  exit 1
fi

if [[ ! -d "${APP_DIR}" ]]; then
  echo "Error: APP_DIR does not exist: ${APP_DIR}" >&2
  exit 1
fi

if [[ ! -f "${APP_DIR}/package.json" ]]; then
  echo "Error: package.json not found in APP_DIR: ${APP_DIR}" >&2
  exit 1
fi

if [[ ! -f "${APP_DIR}/scripts/vps/start-expo-vps.sh" ]]; then
  echo "Error: missing start script at ${APP_DIR}/scripts/vps/start-expo-vps.sh" >&2
  exit 1
fi

if [[ ! -f "${APP_DIR}/scripts/vps/validate-env-vps.sh" ]]; then
  echo "Error: missing env validator at ${APP_DIR}/scripts/vps/validate-env-vps.sh" >&2
  exit 1
fi

if [[ ! -f "${APP_DIR}/.env.vps" ]]; then
  echo "Error: ${APP_DIR}/.env.vps not found. Create it from .env.vps.example first." >&2
  exit 1
fi

if ! id "${RUN_AS_USER}" >/dev/null 2>&1; then
  echo "Error: run user does not exist: ${RUN_AS_USER}" >&2
  exit 1
fi

RUN_AS_HOME="$(getent passwd "${RUN_AS_USER}" | cut -d: -f6)"
if [[ -z "${RUN_AS_HOME}" ]]; then
  echo "Error: could not resolve home directory for user ${RUN_AS_USER}" >&2
  exit 1
fi

NVM_DIR_VALUE="${NVM_DIR:-${RUN_AS_HOME}/.nvm}"

bash "${APP_DIR}/scripts/vps/validate-env-vps.sh" "${APP_DIR}/.env.vps"

cat > "${SERVICE_PATH}" <<EOF
[Unit]
Description=WTW Expo Metro (Tunnel)
After=network.target

[Service]
Type=simple
User=${RUN_AS_USER}
WorkingDirectory=${APP_DIR}
Environment=PROJECT_DIR=${APP_DIR}
Environment=ENV_FILE=${APP_DIR}/.env.vps
Environment=EXPO_PORT=${EXPO_PORT}
Environment=EXPO_USE_DEV_CLIENT=${EXPO_USE_DEV_CLIENT}
ExecStart=/usr/bin/env bash -lc 'if [ -s "${NVM_DIR_VALUE}/nvm.sh" ]; then . "${NVM_DIR_VALUE}/nvm.sh"; nvm use --silent ${NODE_MAJOR} >/dev/null 2>&1 || true; fi; exec ./scripts/vps/start-expo-vps.sh'
Restart=always
RestartSec=5
KillSignal=SIGINT
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
EOF

chmod 0644 "${SERVICE_PATH}"

systemctl daemon-reload
systemctl enable --now "${SERVICE_NAME}"

echo "Installed and started ${SERVICE_NAME}."
echo "Service file: ${SERVICE_PATH}"
echo "Status:"
systemctl status "${SERVICE_NAME}" --no-pager
echo "Follow logs:"
echo "journalctl -u ${SERVICE_NAME} -f"
