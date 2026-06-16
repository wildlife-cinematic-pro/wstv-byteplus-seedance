#!/bin/zsh
set -euo pipefail

cd "$(dirname "$0")"

PYTHON=".venv/bin/python"
if [[ ! -x "$PYTHON" ]]; then
  PYTHON="python3"
fi

open "http://127.0.0.1:8765" >/dev/null 2>&1 || true
exec "$PYTHON" scripts/wstv_server.py --host 127.0.0.1 --port 8765
