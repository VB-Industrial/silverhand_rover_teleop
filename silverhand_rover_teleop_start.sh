#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UI_DIST_DIR="${SCRIPT_DIR}/ui/dist"
HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-4174}"

if [[ ! -d "${UI_DIST_DIR}" || ! -f "${UI_DIST_DIR}/index.html" ]]; then
  echo "UI dist not found at ${UI_DIST_DIR}"
  echo "Build the UI first with:"
  echo "  cd ${SCRIPT_DIR}/ui && npm run build"
  exit 1
fi

echo "Serving silverhand_rover_teleop UI from ${UI_DIST_DIR}"
echo "URL: http://${HOST}:${PORT}/"

exec python3 -m http.server "${PORT}" --bind "${HOST}" --directory "${UI_DIST_DIR}"
