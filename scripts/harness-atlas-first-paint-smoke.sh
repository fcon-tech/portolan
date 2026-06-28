#!/usr/bin/env bash
# Playwright smoke for the portolan-core clean-stack atlas (the successor to the
# superseded viewer first-paint smoke). Exports atlas.html from the demo
# system-map, serves it, and asserts the OpenSpec navigation spec's first-screen
# contract: an annotated overview renders (not an undifferentiated graph), with
# a clear affordance to open the behaviour map, and no console errors.
#
# CI-friendly: bounded timeouts, isolated temp dir, server cleanup, no mutation.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
SYSTEM_MAP="${SYSTEM_MAP:-$ROOT/docs/site/atlas/system-map.demo.json}"
WORK_DIR=$(mktemp -d)
ATLAS_HTML="$WORK_DIR/atlas.html"
PW_SCRIPT="$WORK_DIR/atlas-first-paint-smoke.cjs"
BASE_URL=""
PID=""

fail() {
  echo "harness-atlas-first-paint-smoke: FAIL: $*" >&2
  exit 1
}

cleanup() {
  if [[ -n "${PID:-}" ]]; then
    kill "$PID" 2>/dev/null || true
    wait "$PID" 2>/dev/null || true
  fi
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "missing required command: $1"
}

require_cmd node
require_cmd npx
[[ -f "$SYSTEM_MAP" ]] || fail "system-map not found: $SYSTEM_MAP"

# 1. Export the clean-stack atlas from the demo system-map.
node "$ROOT/portolan-core/scripts/export-shell.mjs" \
  --system-map "$SYSTEM_MAP" \
  --out "$ATLAS_HTML" \
  --title "Portolan Atlas — smoke" >/dev/null
[[ -s "$ATLAS_HTML" ]] || fail "atlas.html was not produced"

# 2. Resolve the Playwright module (dep-free: fetched on demand via npx).
PLAYWRIGHT_MODULE=$(npx --yes --package playwright node -p "require.resolve('playwright')" 2>/dev/null || true)
[[ -n "$PLAYWRIGHT_MODULE" ]] || fail "could not resolve Playwright module via npx --package playwright"

# 3. Embedded Playwright script: static server + headless first-paint assertions.
cat >"$PW_SCRIPT" <<'NODE'
const http = require('http');
const fs = require('fs');
const path = require('path');

const dir = process.env.ATLAS_DIR;
const html = process.env.ATLAS_HTML;
const playwright = require(process.env.PLAYWRIGHT_MODULE);
const { chromium } = playwright;

const server = http.createServer((req, res) => {
  // Serve atlas.html at '/' and any same-dir asset by basename.
  let file = req.url === '/' ? html : path.join(dir, path.basename(req.url));
  try {
    const data = fs.readFileSync(file);
    res.setHeader('Content-Type', file.endsWith('.html') ? 'text/html' : 'application/octet-stream');
    res.end(data);
  } catch (e) {
    res.statusCode = 404;
    res.end('not found');
  }
});

(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/`;

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(10_000);

  const consoleErrors = [];
  const failedRequests = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('requestfailed', (r) => { failedRequests.push(r.url()); });

  await page.goto(baseUrl, { waitUntil: 'load' });

  // First screen renders (JS executes); body is non-blank.
  await page.getByText('Portolan').first().waitFor({ state: 'visible' });
  const title = await page.title();
  if (!/Portolan Atlas/.test(title)) {
    throw new Error(`unexpected title: ${title}`);
  }
  const bodyText = (await page.locator('body').innerText()).trim();
  if (bodyText.length < 40) {
    throw new Error(`atlas first screen looks blank: ${JSON.stringify(bodyText.slice(0, 120))}`);
  }

  // Navigation spec § first screen: annotated overview, not an undifferentiated
  // graph. The overview shows landscape shape (units, groupings) and an
  // affordance to open the behaviour map.
  const lower = bodyText.toLowerCase();
  const hasOverviewMarker = lower.includes('overview') || lower.includes('landscape') || lower.includes('unit');
  if (!hasOverviewMarker) {
    throw new Error('first screen has no overview/landscape marker');
  }

  // Affordance to open the behaviour map (CTA). Accept either a clickable link
  // or visible text mentioning the behaviour/component map.
  const cta = await page.locator('a.cta-primary, a:has-text("behaviour map"), a:has-text("component map"), a:has-text("Open")').count();
  if (cta === 0) {
    throw new Error('no affordance to open the behaviour map on the first screen');
  }

  if (consoleErrors.length > 0) {
    throw new Error(`console errors at first paint: ${JSON.stringify(consoleErrors.slice(0, 5))}`);
  }
  // Local asset 404s for the inlined shell would be a packaging bug.
  const localFailures = failedRequests.filter((u) => u.startsWith(baseUrl));
  if (localFailures.length > 0) {
    throw new Error(`failed local requests: ${JSON.stringify(localFailures)}`);
  }

  await browser.close();
  server.close();
})().catch((e) => {
  console.error('atlas-first-paint-smoke:', e.message);
  process.exit(1);
});
NODE

# 4. Run it.
if ! ATLAS_DIR="$WORK_DIR" ATLAS_HTML="$ATLAS_HTML" PLAYWRIGHT_MODULE="$PLAYWRIGHT_MODULE" \
  npx --yes --package playwright node "$PW_SCRIPT"; then
  fail "Playwright atlas first-paint smoke failed"
fi

echo "harness-atlas-first-paint-smoke: ok"
