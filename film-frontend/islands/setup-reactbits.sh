#!/usr/bin/env bash
# Copy React Bits components (real source) into a project's islands folder.
# React Bits is MIT + Commons Clause: use in a website is fine, redistributing the
# components is not, so this skill fetches them at build time instead of shipping them.
#
# Usage: bash setup-reactbits.sh <dest-dir> <ComponentName> [ComponentName ...]
#   e.g. bash setup-reactbits.sh islands/reactbits SplitText ScrollStack MagicBento DotGrid
# Env:   RB_CACHE   where the shallow clone is kept (default: ~/.cache/react-bits)
set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "usage: $0 <dest-dir> <Component> [Component ...]" >&2
  exit 1
fi

DEST="$1"; shift
CACHE="${RB_CACHE:-$HOME/.cache/react-bits}"

if [ -d "$CACHE/.git" ]; then
  git -C "$CACHE" pull --ff-only --quiet || echo "warn: could not update $CACHE, using cached copy" >&2
else
  mkdir -p "$(dirname "$CACHE")"
  git clone --depth 1 --quiet https://github.com/DavidHDev/react-bits "$CACHE"
fi

CONTENT="$CACHE/src/content"
mkdir -p "$DEST"
cp "$CACHE/LICENSE.md" "$DEST/LICENSE.md"

missing=()
for name in "$@"; do
  src="$(find "$CONTENT" -mindepth 2 -maxdepth 2 -type d -name "$name" | head -n 1)"
  if [ -z "$src" ]; then
    missing+=("$name")
    continue
  fi
  rm -rf "${DEST:?}/$name"
  cp -r "$src" "$DEST/$name"
  echo "copied $name  <-  ${src#"$CONTENT"/}"
done

if [ "${#missing[@]}" -gt 0 ]; then
  echo "not found: ${missing[*]}" >&2
  echo "available categories: $(ls "$CONTENT" | tr '\n' ' ')" >&2
  echo "list one: ls \"$CONTENT/Components\"" >&2
  exit 2
fi
