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
xdotool mousemove --window "$print_dialog" 85 85 click 1
sleep 1
import -window root "$evidence/linux-print-to-file.png"
xdotool mousemove --window "$print_dialog" 580 486 click 1
sleep 5
pdf="$PWD/output.pdf"
test -f "$pdf"
file "$pdf" | grep -q 'PDF document'
cp "$pdf" "$evidence/linux-print.pdf"
xdotool windowfocus --sync "$window" key ctrl+n
sleep 2
xdotool type --clearmodifiers 'Unsaved Linux test'
sleep 2
xdotool key ctrl+a ctrl+c
sleep 1
timeout 5 xclip -selection clipboard -o > "$evidence/clipboard.txt"
grep -q 'Unsaved Linux test' "$evidence/clipboard.txt"
xdotool key End ctrl+v ctrl+z ctrl+shift+z
sleep 1
xdotool key ctrl+a ctrl+c
sleep 1
timeout 5 xclip -selection clipboard -o > "$evidence/clipboard-after-redo.txt"
test "$(grep -o 'Unsaved Linux test' "$evidence/clipboard-after-redo.txt" | wc -l)" -eq 2
xdotool key ctrl+f
xdotool type --clearmodifiers 'Linux'
sleep 1
import -window root "$evidence/linux-search.png"
tesseract "$evidence/linux-search.png" stdout 2>/dev/null > "$evidence/search-ocr.txt"
grep -Eq '1 of 2' "$evidence/search-ocr.txt"
xdotool key Escape
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
