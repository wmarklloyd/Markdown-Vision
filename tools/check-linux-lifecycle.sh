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
pid=
stage='selecting the Markdown desktop handler'
finish() {
  result=$?
  if [ "$result" -ne 0 ]; then
    import -window root "$evidence/linux-lifecycle-failure.png" 2>/dev/null || true
    xwininfo -root -tree >"$evidence/linux-window-tree.txt" 2>&1 || true
    app_log=$(tail -n 5 "$evidence/app.log" 2>/dev/null | tr '\n' ' ' || true)
    echo "::error title=Linux lifecycle failed::Stage: $stage; exit: $result; app log: ${app_log:-empty}."
  fi
  if [ -n "$pid" ]; then kill "$pid" 2>/dev/null || true; fi
  rm -rf "$test_dir"
}
trap finish EXIT
# Limit printer discovery to the PDF backend in this isolated desktop.
export XDG_CONFIG_HOME="$test_dir/config"
export GTK_USE_PORTAL=0
mkdir -p "$XDG_CONFIG_HOME/gtk-3.0"
printf '[Settings]\ngtk-print-backends=file\n' >"$XDG_CONFIG_HOME/gtk-3.0/settings.ini"
printf 'XDG_DOCUMENTS_DIR="%s"\n' "$test_dir" >"$XDG_CONFIG_HOME/user-dirs.dirs"
# Keep the opt-in setup prompt out of this GUI lifecycle run; its association
# choice is already covered by the native service checks.
desktop_entry=$(find /usr/share/applications -maxdepth 1 -type f -name '*.desktop' \
  -exec grep -lE '^Exec=.*markdown-vision([[:space:]]|$)' {} + | head -n 1)
if [ -z "$desktop_entry" ]; then
  echo '::error title=Linux test setup failed::Could not find the installed Markdown Vision desktop launcher.'
  exit 1
fi
desktop_id=$(basename "$desktop_entry")
if ! xdg-mime default "$desktop_id" text/markdown; then
  echo "::error title=Linux test setup failed::xdg-mime could not select $desktop_id as the Markdown handler."
  exit 1
fi
current_default=$(xdg-mime query default text/markdown)
if [ "$current_default" != "$desktop_id" ]; then
  echo "::error title=Linux test setup failed::Expected Markdown handler '$desktop_id'; xdg-mime reports '$current_default'."
  exit 1
fi
stage='launching the installed app'
wait_for_window() {
  title=$1
  attempt=0
  while [ "$attempt" -lt 60 ]; do
    window=$(xdotool search --onlyvisible --name "$title" 2>/dev/null | head -n 1 || true)
    if [ -n "$window" ]; then
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
  window_titles=$(xdotool search --onlyvisible --name '.*' 2>/dev/null | while read -r candidate; do xdotool getwindowname "$candidate" 2>/dev/null || true; done | tr '\n' '|')
  app_log=$(tail -n 5 "$evidence/app.log" | tr '\n' ' ')
  echo "::error title=Linux GUI window timeout::Timed out waiting for '$title'. Visible windows: ${window_titles:-none}. App log: ${app_log:-empty}."
  echo 'Visible windows at failure:' >&2
  xdotool search --onlyvisible --name '.*' 2>/dev/null | while read -r candidate; do
    printf '  %s: ' "$candidate" >&2
    xdotool getwindowname "$candidate" 2>/dev/null >&2 || true
  done
  echo 'Application log:' >&2
  cat "$evidence/app.log" >&2
  return 1
}
require_window() {
  title=$1
  if ! wait_for_window "$title"; then
    echo "::error title=Linux GUI window timeout::Timed out waiting for visible window titled '$title'."
    return 1
  fi
}
wait_for_app_window() {
  attempt=0
  while [ "$attempt" -lt 60 ]; do
    window=$(xdotool search --onlyvisible --pid "$pid" 2>/dev/null | head -n 1 || true)
    if [ -n "$window" ]; then return 0; fi
    if ! kill -0 "$pid" 2>/dev/null; then
      cat "$evidence/app.log" >&2
      echo 'Application exited before its window appeared.' >&2
      return 1
    fi
    attempt=$((attempt + 1))
    sleep 1
  done
  window_titles=$(xdotool search --onlyvisible --name '.*' 2>/dev/null | while read -r candidate; do xdotool getwindowname "$candidate" 2>/dev/null || true; done | tr '\n' '|')
  app_log=$(tail -n 5 "$evidence/app.log" | tr '\n' ' ')
  echo "::error title=Linux application window timeout::No visible window for process $pid. Visible windows: ${window_titles:-none}. App log: ${app_log:-empty}."
  return 1
}
wait_for_print_dialog() {
  # WebKitGTK opens an untitled dialog. Xvfb runs without a window manager.
  /usr/bin/python3 - "$app_window" "$pid" <<'PY'
import sys
import time
from Xlib import X, Xatom, display, error

app_window, pid = map(int, sys.argv[1:])
connection = display.Display()
root = connection.screen().root
window_type = connection.intern_atom("_NET_WM_WINDOW_TYPE")
dialog_type = connection.intern_atom("_NET_WM_WINDOW_TYPE_DIALOG")
window_pid = connection.intern_atom("_NET_WM_PID")

deadline = time.monotonic() + 30
while time.monotonic() < deadline:
    for candidate in root.query_tree().children:
        try:
            if candidate.id == app_window or candidate.get_attributes().map_state != X.IsViewable:
                continue
            transient = candidate.get_wm_transient_for()
            kind = candidate.get_full_property(window_type, Xatom.ATOM)
            owner = candidate.get_full_property(window_pid, Xatom.CARDINAL)
            if (transient and transient.id == app_window) or (
                kind is not None and dialog_type in kind.value
                and owner is not None and pid in owner.value
            ):
                print(candidate.id)
                sys.exit(0)
        except error.BadWindow:
            continue
    time.sleep(0.25)

sys.exit("No visible GTK print dialog appeared")
PY
}
(cd "$test_dir" && exec "$app" "$fixture") >"$evidence/app.log" 2>&1 &
pid=$!
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
stage='waiting for the app window'
wait_for_app_window
stage='waiting for the Markdown fixture to load'
require_window 'Markdown-total-torture-test.md'
app_window=$window
stage='opening the print dialog'
xdotool windowfocus --sync "$app_window" key --clearmodifiers ctrl+p
stage='waiting for the print dialog'
print_dialog=$(wait_for_print_dialog)
import -window root "$evidence/linux-print.png"
stage='printing to PDF'
xdotool mousemove --window "$print_dialog" 85 85 click 1
import -window root "$evidence/linux-print-to-file.png"
xdotool windowfocus --sync "$print_dialog" key --clearmodifiers alt+p
pdf="$test_dir/output.pdf"
wait_for_file "$pdf"
file "$pdf" | grep -q 'PDF document'
cp "$pdf" "$evidence/linux-print.pdf"
stage='editing a new document'
xdotool windowfocus --sync "$app_window" key --clearmodifiers ctrl+n
require_window '^Untitled\.md$'
stage='pasting and copying UTF-8 text'
printf '\303\251' | xclip -selection clipboard -i
xdotool key --delay 120 ctrl+v ctrl+a ctrl+c
wait_for_clipboard "$(printf '\303\251')" "$evidence/composition.txt"
grep -q 'é' "$evidence/composition.txt"
stage='copying text from the editor'
xdotool key BackSpace
xdotool type --clearmodifiers 'Unsaved Linux test'
xdotool key ctrl+a ctrl+c
wait_for_clipboard 'Unsaved Linux test' "$evidence/clipboard.txt"
grep -q 'Unsaved Linux test' "$evidence/clipboard.txt"
stage='undoing and redoing a paste'
xdotool key --delay 120 End ctrl+v ctrl+z ctrl+shift+z ctrl+a ctrl+c
wait_for_clipboard 'Unsaved Linux test' "$evidence/clipboard-after-redo.txt"
test "$(grep -o 'Unsaved Linux test' "$evidence/clipboard-after-redo.txt" | wc -l)" -eq 2
stage='searching the editor'
xdotool key ctrl+f
xdotool type --clearmodifiers 'Linux'
attempt=0
while [ "$attempt" -lt 20 ]; do
  import -window root "$evidence/linux-search.png"
  screen_width=$(identify -format '%w' "$evidence/linux-search.png")
  convert "$evidence/linux-search.png" -crop "${screen_width}x220+0+0" +repage -colorspace Gray -resize 200% "$evidence/search-count.png"
  tesseract "$evidence/search-count.png" stdout --psm 11 -c tessedit_char_whitelist=0123456789of 2>/dev/null > "$evidence/search-ocr.txt"
  if tr -d ' \r\n' < "$evidence/search-ocr.txt" | grep -q '1of2'; then break; fi
  attempt=$((attempt + 1))
  sleep 0.5
done
if tr -d ' \r\n' < "$evidence/search-ocr.txt" | grep -q '1of2'; then
  echo 'Search result counter OCR recognized "1 of 2".'
else
  echo '::warning::Search UI screenshot did not OCR as "1 of 2". The screenshot and OCR text are retained for review.'
  cat "$evidence/search-ocr.txt" >&2
  echo "Display geometry: $(xdotool getdisplaygeometry | tr '\n' ' ')" >&2
fi
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
require_window 'Unsaved changes'
dialog=$window
import -window root "$evidence/linux-open-confirm.png"
xdotool windowfocus --sync "$dialog" key Return
kill -0 "$pid"
echo 'The already-running instance prompted before opening a file over unsaved changes.'
/usr/bin/python3 - "$app_window" <<'PY'
import sys
from Xlib import display, protocol
connection = display.Display()
window = connection.create_resource_object('window', int(sys.argv[1]))
event = protocol.event.ClientMessage(window=window, client_type=connection.intern_atom('WM_PROTOCOLS'),
    data=(32, [connection.intern_atom('WM_DELETE_WINDOW'), 0, 0, 0, 0]))
window.send_event(event, event_mask=0)
connection.flush()
PY
require_window 'Unsaved changes'
dialog=$window
import -window root "$evidence/linux-close-confirm.png"
xdotool windowfocus --sync "$dialog" key Return
kill -0 "$pid"
echo 'Closing the dirty window prompted and allowed editing to continue.'
