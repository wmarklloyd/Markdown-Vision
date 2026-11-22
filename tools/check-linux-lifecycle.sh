#!/bin/sh
set -eu

# Run inside a fresh Xvfb and D-Bus session with xdotool and zenity installed.
app=$1
fixture=$2
evidence=$3
mkdir -p "$evidence"
case "$app" in /*) ;; *) app="$(cd "$(dirname "$app")" && pwd)/$(basename "$app")" ;; esac
case "$fixture" in /*) ;; *) fixture="$(cd "$(dirname "$fixture")" && pwd)/$(basename "$fixture")" ;; esac
test_dir=$(mktemp -d "${TMPDIR:-/tmp}/markdown-vision-lifecycle.XXXXXX")
if command -v setxkbmap >/dev/null 2>&1; then setxkbmap -layout us; fi
wait_for_window() {
  title=$1
  attempt=0
  while [ "$attempt" -lt 60 ]; do
    window=$(xdotool search --onlyvisible --name "$title" 2>/dev/null | head -n 1 || true)
    if [ -n "$window" ]; then
      printf '%s\n' "$window"
      return 0
    fi
    if ! kill -0 "$pid" 2>/dev/null; then
      cat "$evidence/app.log" >&2
      echo "Application exited before window appeared: $title" >&2
      return 1
    fi
    attempt=$((attempt + 1))
    sleep 1
  done
  echo "Window did not appear within 60 seconds: $title" >&2
  return 1
}
(cd "$test_dir" && exec "$app" "$fixture") >"$evidence/app.log" 2>&1 &
pid=$!
trap 'kill "$pid" 2>/dev/null || true; rm -rf "$test_dir"' EXIT
wait_for_file() {
  file_path=$1
  attempt=0
  while [ "$attempt" -lt 60 ]; do
    if [ -s "$file_path" ]; then return 0; fi
    attempt=$((attempt + 1))
    sleep 1
  done
  echo "File did not appear within 60 seconds: $file_path" >&2
  return 1
}
wait_for_process_exit() {
  process_id=$1
  attempt=0
  while [ "$attempt" -lt 30 ]; do
    if ! kill -0 "$process_id" 2>/dev/null; then return 0; fi
    attempt=$((attempt + 1))
    sleep 1
  done
  echo "Process $process_id did not exit within 30 seconds." >&2
  return 1
}
wait_for_clipboard() {
  expected=$1
  output_file=$2
  attempt=0
  while [ "$attempt" -lt 20 ]; do
    if timeout 2 xclip -selection clipboard -o >"$output_file" 2>/dev/null \
        && grep -Fq "$expected" "$output_file"; then return 0; fi
    attempt=$((attempt + 1))
    sleep 0.25
  done
  echo "Clipboard did not contain expected text: $expected" >&2
  return 1
}
window=$(wait_for_window 'Markdown-total-torture-test.md')
xdotool windowfocus --sync "$window" key ctrl+p
print_dialog=$(wait_for_window 'Print')
import -window root "$evidence/linux-print.png"
xdotool mousemove --window "$print_dialog" 85 85 click 1
import -window root "$evidence/linux-print-to-file.png"
xdotool mousemove --window "$print_dialog" 580 486 click 1
pdf="$test_dir/output.pdf"
wait_for_file "$pdf"
file "$pdf" | grep -q 'PDF document'
cp "$pdf" "$evidence/linux-print.pdf"
xdotool windowfocus --sync "$window" key ctrl+n
xdotool type --clearmodifiers 'é'
xdotool key ctrl+a ctrl+c
wait_for_clipboard "$(printf '\303\251')" "$evidence/composition.txt"
grep -q 'é' "$evidence/composition.txt"
xdotool key BackSpace
xdotool type --clearmodifiers 'Unsaved Linux test'
xdotool key ctrl+a ctrl+c
wait_for_clipboard 'Unsaved Linux test' "$evidence/clipboard.txt"
grep -q 'Unsaved Linux test' "$evidence/clipboard.txt"
xdotool key End ctrl+v ctrl+z ctrl+shift+z
xdotool key ctrl+a ctrl+c
wait_for_clipboard 'Unsaved Linux test' "$evidence/clipboard-after-redo.txt"
test "$(grep -o 'Unsaved Linux test' "$evidence/clipboard-after-redo.txt" | wc -l)" -eq 2
xdotool key ctrl+f
xdotool type --clearmodifiers 'Linux'
attempt=0
while [ "$attempt" -lt 20 ]; do
  import -window root "$evidence/linux-search.png"
  convert "$evidence/linux-search.png" -crop 43x24+921+77 +repage -resize 500% "$evidence/search-count.png"
  tesseract "$evidence/search-count.png" stdout --psm 7 -c tessedit_char_whitelist=0123456789of 2>/dev/null > "$evidence/search-ocr.txt"
  if grep -q 'of2' "$evidence/search-ocr.txt"; then break; fi
  attempt=$((attempt + 1))
  sleep 0.5
done
grep -q 'of2' "$evidence/search-ocr.txt"
xdotool key Escape
xdotool mousemove 330 35 click 1
sleep 1
xdotool mousemove 70 165 click --repeat 2 --delay 100 1
sleep 1
import -window root "$evidence/linux-split-counterpart.png"
xdotool mousemove 418 35 click 1
sleep 1
import -window root "$evidence/linux-split-vertical.png"
"$app" "$fixture" >"$evidence/second-instance.log" 2>&1 &
second=$!
wait_for_process_exit "$second"
wait "$second"
dialog=$(wait_for_window 'Unsaved changes')
import -window root "$evidence/linux-open-confirm.png"
xdotool windowfocus --sync "$dialog" key Return
kill -0 "$pid"
echo 'The already-running instance prompted before opening a file over unsaved changes.'
/usr/bin/python3 - "$window" <<'PY'
import sys
from Xlib import display, protocol
connection = display.Display()
window = connection.create_resource_object('window', int(sys.argv[1]))
event = protocol.event.ClientMessage(window=window, client_type=connection.intern_atom('WM_PROTOCOLS'),
    data=(32, [connection.intern_atom('WM_DELETE_WINDOW'), 0, 0, 0, 0]))
window.send_event(event, event_mask=0)
connection.flush()
PY
dialog=$(wait_for_window 'Unsaved changes')
import -window root "$evidence/linux-close-confirm.png"
xdotool windowfocus --sync "$dialog" key Return
kill -0 "$pid"
echo 'Closing the dirty window prompted and allowed editing to continue.'
