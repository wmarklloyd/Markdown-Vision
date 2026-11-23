#!/bin/sh
set -eu

app=${1:?Usage: check-linux-appimage-launch.sh APPIMAGE MARKDOWN_FILE LOG_FILE}
fixture=${2:?Usage: check-linux-appimage-launch.sh APPIMAGE MARKDOWN_FILE LOG_FILE}
log=${3:?Usage: check-linux-appimage-launch.sh APPIMAGE MARKDOWN_FILE LOG_FILE}
APPIMAGE_EXTRACT_AND_RUN=1 "$app" "$fixture" >"$log" 2>&1 &
pid=$!
cleanup() {
  kill "$pid" 2>/dev/null || true
  wait "$pid" 2>/dev/null || true
}
trap cleanup EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM

sleep 5
if ! kill -0 "$pid" 2>/dev/null; then
  cat "$log" >&2
  echo 'AppImage exited shortly after launch.' >&2
  exit 1
fi

echo 'AppImage extracted and remained running after launch.'
