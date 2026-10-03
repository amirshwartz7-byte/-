#!/usr/bin/env bash
# Sends a WhatsApp message to yourself via CallMeBot.
# Requires CALLMEBOT_PHONE (international format, e.g. 972501234567) and CALLMEBOT_APIKEY.
set -euo pipefail

if [ $# -lt 1 ] || [ -z "$1" ]; then
  echo "usage: $0 \"message\"" >&2
  exit 2
fi
: "${CALLMEBOT_PHONE:?CALLMEBOT_PHONE is not set}"
: "${CALLMEBOT_APIKEY:?CALLMEBOT_APIKEY is not set}"

curl -sS --fail --max-time 30 -G "https://api.callmebot.com/whatsapp.php" \
  --data-urlencode "phone=${CALLMEBOT_PHONE}" \
  --data-urlencode "text=$1" \
  --data-urlencode "apikey=${CALLMEBOT_APIKEY}" >/dev/null
echo "sent"
