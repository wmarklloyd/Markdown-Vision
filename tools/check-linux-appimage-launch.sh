#!/bin/sh
set -eu

app=${1:?Usage: check-linux-appimage-launch.sh APPIMAGE MARKDOWN_FILE LOG_FILE}
fixture=${2:?Usage: check-linux-appimage-launch.sh APPIMAGE MARKDOWN_FILE LOG_FILE}
log=${3:?Usage: check-linux-appimage-launch.sh APPIMAGE MARKDOWN_FILE LOG_FILE}
title=$(basename "$fixture")

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

attempt=0
while [ "$attempt" -lt 120 ]; do
  if ! kill -0 "$pid" 2>/dev/null; then
    cat "$log" >&2
    echo 'AppImage exited before opening its document.' >&2
    exit 1
  fi
  if xdotool search --onlyvisible --name "$title" >/dev/null 2>&1; then
    echo "AppImage opened $title in the virtual desktop."
    exit 0
  fi
  attempt=$((attempt + 1))
  sleep 1
done

cat "$log" >&2
echo "AppImage did not show a window titled $title within 120 seconds." >&2
exit 1
