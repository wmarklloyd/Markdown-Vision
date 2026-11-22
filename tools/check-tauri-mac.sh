#!/bin/sh
set -eu
node tools/stage-tauri.cjs
if ! command -v cargo >/dev/null 2>&1; then
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal --no-modify-path
  PATH="$HOME/.cargo/bin:$PATH"
  export PATH
fi
cargo test --locked --manifest-path native-tauri/Cargo.toml
cd native-tauri
npx --yes @tauri-apps/cli@2.12.6 build --debug --bundles app --no-sign -- --locked
