#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
cd "$ROOT"

if [[ ! -f package.json ]]; then
  echo "ERROR: package.json not found at repo root" >&2
  exit 1
fi

echo "== npm run lint =="
npm run lint

echo
echo "== npm run build =="
npm run build

echo
echo "VERIFY PASS"
