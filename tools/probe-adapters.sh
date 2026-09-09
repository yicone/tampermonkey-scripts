#!/bin/sh
set -e
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"

{
  python3 -c 'import json,sys; print("process.env.PROBE_ROOT = %s;" % json.dumps(sys.argv[1]))' "$ROOT"
  cat "$ROOT/tools/probe-adapters.mjs"
} | ego-browser nodejs
