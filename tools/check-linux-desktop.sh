#!/bin/sh
set -eu

desktop=${1:?Usage: check-linux-desktop.sh LAUNCHER.desktop}
template=./native-tauri/launcher.desktop
test -f "$desktop"
test -f "$template"
node tools/check-linux-desktop-duplicates.cjs "$desktop" "$template"
grep -Eq '^MimeType=.*text/markdown(;|$)' "$desktop"
grep -Eq '^Exec=.+$' "$desktop"
printf 'Linux launcher contains every localized description and its Markdown association.\n'
