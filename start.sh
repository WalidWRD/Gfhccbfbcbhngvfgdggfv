#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${PORT:-3000}"
DIST="$PROJECT_DIR/dist"
META_DIR="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"
DEPLOYMENT_OUTPUT="$META_DIR/deployment-output.json"

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

cd "$PROJECT_DIR"

if [[ ! -f "$PROJECT_DIR/src/index.html" ]]; then
  echo "Missing source entrypoint: $PROJECT_DIR/src/index.html" >&2
  exit 1
fi

time_it "prepare metadata directory" mkdir -p "$META_DIR"
time_it "reset build output" rm -rf "$DIST"
time_it "create build output" mkdir -p "$DIST"
time_it "copy source to build output" cp -R "$PROJECT_DIR/src/." "$DIST/"

if [[ -f "$PROJECT_DIR/package.json" ]]; then
  if [[ -f "$PROJECT_DIR/package-lock.json" ]]; then
    time_it "install dependencies" npm ci --no-audit --no-fund
  else
    time_it "install dependencies" npm install --no-audit --no-fund
  fi
  if node -e 'const p=require(process.argv[1]); process.exit(p.scripts && p.scripts.build ? 0 : 1)' "$PROJECT_DIR/package.json"; then
    time_it "build project" npm run build
  fi
fi

if [[ ! -f "$DIST/index.html" ]]; then
  echo "Build output missing index.html: $DIST/index.html" >&2
  exit 1
fi

time_it "write deployment metadata" node -e '
  const fs = require("node:fs");
  const [output, project, directory] = process.argv.slice(1);
  fs.writeFileSync(output, JSON.stringify({ project, directory }) + "\n");
' "$DEPLOYMENT_OUTPUT" "$PROJECT_DIR" "$DIST"

echo "Serving $DIST on 0.0.0.0:$PORT" >&2
time_it "serve static build output" python3 -m http.server "$PORT" --bind 0.0.0.0 --directory "$DIST"
