#!/usr/bin/env bash
# מצפן — הרצה מקומית
set -e
cd "$(dirname "$0")/backend"
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate
pip install -q -r requirements.txt
echo ""
echo "מצפן עולה על http://localhost:8420 — לחץ Ctrl+C כדי לעצור."
echo ""
python app.py
