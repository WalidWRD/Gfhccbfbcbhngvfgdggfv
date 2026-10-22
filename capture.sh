#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
: "${CAPTURE_URL:?Set CAPTURE_URL to the exact page to capture.}"
: "${CAPTURE_DIR:?Set CAPTURE_DIR for the screenshot output.}"

CAPTURE_DIR="$(realpath -m "$CAPTURE_DIR")"
case "$CAPTURE_DIR/" in
  "$PROJECT_DIR"/*)
    echo "CAPTURE_DIR must be outside the project source tree: $CAPTURE_DIR" >&2
    exit 1
    ;;
esac

if [[ ! "$CAPTURE_URL" =~ ^https?:// ]]; then
  echo "CAPTURE_URL must be an http(s) URL: $CAPTURE_URL" >&2
  exit 1
fi

if [[ ! -f "$PROJECT_DIR/scripts/capture.mjs" ]]; then
  echo "Missing capture implementation: $PROJECT_DIR/scripts/capture.mjs" >&2
  exit 1
fi

time_it() {
  local label="$1"
  shift
  local started finished status
  started="$(date +%s%N)"
  set +e
  "$@"
  status=$?
  set -e
  finished="$(date +%s%N)"
  printf '[timing] %-36s %8d ms (exit %d)\n' "$label" "$(( (finished - started) / 1000000 ))" "$status" >&2
  return "$status"
}

time_it "prepare capture directory" mkdir -p "$CAPTURE_DIR"
time_it "capture desktop and mobile views" node "$PROJECT_DIR/scripts/capture.mjs"
