#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="${1:-fishops}"
PORT="${PORT:-8080}"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed or not in PATH."
  echo "Install Node.js LTS, then run this script again."
  exit 1
fi

if ! command -v systemctl >/dev/null 2>&1; then
  echo "systemctl is not available. This script requires systemd."
  exit 1
fi

if [[ "${EUID}" -eq 0 ]]; then
  RUN_USER="${SUDO_USER:-root}"
  SUDO_CMD=""
else
  RUN_USER="${USER}"
  if ! command -v sudo >/dev/null 2>&1; then
    echo "sudo is required to install the systemd service."
    exit 1
  fi
  SUDO_CMD="sudo"
fi

NODE_BIN="$(command -v node)"
SERVICE_PATH="/etc/systemd/system/${SERVICE_NAME}.service"
TMP_FILE="$(mktemp)"

cat > "${TMP_FILE}" <<EOF
[Unit]
Description=FishOps Server
After=network.target

[Service]
Type=simple
User=${RUN_USER}
WorkingDirectory=${PROJECT_DIR}
ExecStart=${NODE_BIN} ${PROJECT_DIR}/server/index.mjs
Restart=always
RestartSec=3
Environment=PORT=${PORT}

[Install]
WantedBy=multi-user.target
EOF

${SUDO_CMD} cp "${TMP_FILE}" "${SERVICE_PATH}"
rm -f "${TMP_FILE}"

${SUDO_CMD} systemctl daemon-reload
${SUDO_CMD} systemctl enable "${SERVICE_NAME}"
${SUDO_CMD} systemctl restart "${SERVICE_NAME}"

echo "Installed and started ${SERVICE_NAME}."
echo "Service file: ${SERVICE_PATH}"
echo "Check status:"
echo "  ${SUDO_CMD:-} systemctl status ${SERVICE_NAME} --no-pager"
