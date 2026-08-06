#!/usr/bin/env sh
# Fetch Monaco and Blockly into vendor/, so the app needs no CDN at runtime.
#
#   scripts/vendor.sh
#
# A workshop runs in rooms whose internet is unreliable or absent, and an editor
# that fails to load takes the exercise with it. vendor/ is gitignored: it is a
# build input, pinned here and fetched on demand — the same treatment the
# platform gives every runtime dist.
set -eu

ROOT=$(cd "$(dirname "$0")/.." && pwd)
VENDOR="$ROOT/vendor"
MONACO_VERSION=0.45.0
BLOCKLY_VERSION=9.3.3

mkdir -p "$VENDOR"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

fetch_npm() {
  name=$1; version=$2; dest=$3; keep=$4
  echo "==> $name@$version"
  curl -fsSL -o "$tmp/pkg.tgz" \
    "https://registry.npmjs.org/$name/-/$name-$version.tgz"
  rm -rf "$dest"; mkdir -p "$dest"
  tar -xzf "$tmp/pkg.tgz" -C "$tmp"
  cp -R "$tmp/package/$keep" "$dest/"
  rm -rf "$tmp/package"
}

fetch_npm monaco-editor "$MONACO_VERSION" "$VENDOR/monaco" min/vs
fetch_npm blockly "$BLOCKLY_VERSION" "$VENDOR/blockly" blockly_compressed.js

echo "==> vendored into $VENDOR"
