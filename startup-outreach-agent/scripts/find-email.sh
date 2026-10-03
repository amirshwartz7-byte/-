#!/usr/bin/env bash
# Looks up a work email with the Hunter.io Email Finder API.
# Usage: find-email.sh <domain> <first_name> <last_name>
# Prints "<email> <score>", or nothing if not found. Requires HUNTER_API_KEY.
set -euo pipefail

if [ $# -ne 3 ]; then
  echo "usage: $0 <domain> <first_name> <last_name>" >&2
  exit 2
fi
: "${HUNTER_API_KEY:?HUNTER_API_KEY is not set}"

curl -sS --fail --max-time 30 -G "https://api.hunter.io/v2/email-finder" \
  --data-urlencode "domain=$1" \
  --data-urlencode "first_name=$2" \
  --data-urlencode "last_name=$3" \
  --data-urlencode "api_key=${HUNTER_API_KEY}" \
  | python3 -c 'import json,sys; d=json.load(sys.stdin).get("data") or {}; e=d.get("email"); print(e, d.get("score")) if e else None'
