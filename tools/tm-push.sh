#!/bin/sh
set -e
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
MODE="loader"
SCRIPT="ask-across-sites"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --mode=*) MODE="${1#*=}" ;;
    --script=*) SCRIPT="${1#*=}" ;;
    --mode)
      MODE="$2"
      shift
      ;;
    --script)
      SCRIPT="$2"
      shift
      ;;
    *)
      echo "unknown arg: $1" >&2
      echo "usage: tools/tm-push.sh --mode=loader|full [--script=ask-across-sites]" >&2
      exit 1
      ;;
  esac
  shift
done

# ego-browser's Node may start with cwd=/ and drop the parent env.
# Prefix assignments so the piped script always sees the real repo path.
{
  python3 -c 'import json,sys
for k,v in zip(("TM_PUSH_ROOT","TM_PUSH_MODE","TM_PUSH_SCRIPT"), sys.argv[1:]):
    print(f"process.env.{k} = {json.dumps(v)};")
' "$ROOT" "$MODE" "$SCRIPT"
  cat "$ROOT/tools/tm-push.mjs"
} | ego-browser nodejs
