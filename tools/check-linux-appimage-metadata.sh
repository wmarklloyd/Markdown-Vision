#!/bin/sh
set -eu

app=$(realpath "${1:?Usage: check-linux-appimage-metadata.sh APPIMAGE}")
root=$(mktemp -d)
trap 'rm -rf "$root"' EXIT HUP INT TERM
# AppImage's built-in extraction does not mount the image or require FUSE.
(cd "$root" && "$app" --appimage-extract 'usr/share/applications/*' >/dev/null)
desktop=$(find "$root/squashfs-root/usr/share/applications" -maxdepth 1 -type f -name '*.desktop' -print -quit)
test -n "$desktop"
sh tools/check-linux-desktop.sh "$desktop"
