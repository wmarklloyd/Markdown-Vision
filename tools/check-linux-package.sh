#!/bin/sh
set -eu

package=${1:?Usage: check-linux-package.sh PACKAGE.deb VERSION [ARCH]}
expected_version=${2:?Usage: check-linux-package.sh PACKAGE.deb VERSION [ARCH]}
expected_arch=${3:-amd64}

field() {
  dpkg-deb --field "$package" "$1"
}

test "$(field Package)" = markdown-vision
test "$(field Version)" = "$expected_version"
test "$(field Architecture)" = "$expected_arch"

dependencies=$(field Depends)
for required in libwebkit2gtk-4.1-0 libgtk-3-0 zenity xdg-utils fontconfig curl pkexec; do
  case " $dependencies " in
    *"$required"*) ;;
    *) echo "Required runtime dependency missing from package: $required" >&2; exit 1 ;;
  esac
done

root=$(mktemp -d)
trap 'rm -rf "$root"' EXIT HUP INT TERM
dpkg-deb --extract "$package" "$root"
test -x "$root/usr/bin/markdown-vision"

desktop_dir="$root/usr/share/applications"
desktop_file=$(find "$desktop_dir" -maxdepth 1 -type f -name '*.desktop' -print -quit)
test -n "$desktop_file"
sh tools/check-linux-desktop.sh "$desktop_file"

printf 'Linux DEB metadata passed: %s %s %s; runtime dependencies and Markdown desktop association are present.\n' \
  "$(field Package)" "$(field Version)" "$(field Architecture)"
