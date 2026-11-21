#!/bin/sh
set -eu

# Run inside a fresh Xvfb and D-Bus session with xdotool and zenity installed.
app=$1
fixture=$2
evidence=$3
mkdir -p "$evidence"
"$app" "$fixture" >"$evidence/app.log" 2>&1 &
pid=$!
trap 'kill "$pid" 2>/dev/null || true' EXIT
sleep 8
kill -0 "$pid"
window=$(xdotool search --onlyvisible --name 'Markdown-total-torture-test.md' | head -n 1)
test -n "$window"
xdotool windowfocus --sync "$window" key ctrl+p
sleep 5
import -window root "$evidence/linux-print.png"
print_dialog=$(xdotool search --onlyvisible --name 'Print' | head -n 1)
test -n "$print_dialog"
xdotool windowfocus --sync "$print_dialog" key Escape
sleep 2
xdotool windowfocus --sync "$window" key ctrl+n
sleep 2
xdotool type --clearmodifiers 'Unsaved Linux test'
sleep 2
"$app" "$fixture" >"$evidence/second-instance.log" 2>&1 &
second=$!
sleep 5
if kill -0 "$second" 2>/dev/null; then
  echo 'Second instance did not exit after forwarding the file' >&2
  kill "$second" || true
  exit 1
fi
wait "$second"
dialog=$(xdotool search --onlyvisible --name 'Unsaved changes' | head -n 1)
test -n "$dialog"
import -window root "$evidence/linux-open-confirm.png"
xdotool windowfocus --sync "$dialog" key Return
sleep 2
kill -0 "$pid"
echo 'The already-running instance prompted before opening a file over unsaved changes.'
