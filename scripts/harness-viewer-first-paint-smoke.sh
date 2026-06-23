#!/usr/bin/env bash
# Playwright smoke for viewer first paint. CI-friendly: bounded timeouts,
# isolated temp bundle, local server cleanup, no mutation of the target fixture.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
TARGET_ROOT="$ROOT/internal/testfixtures/polyglot-service-landscape"
WORK_DIR=$(mktemp -d)
BUNDLE_DIR="$WORK_DIR/bundle"
VIEWER_LOG="$WORK_DIR/viewer.log"
PW_SCRIPT="$WORK_DIR/viewer-first-paint-smoke.cjs"
PID=""

fail() {
  echo "harness-viewer-first-paint-smoke: FAIL: $*" >&2
  if [[ -s "$VIEWER_LOG" ]]; then
    sed 's/^/viewer: /' "$VIEWER_LOG" >&2
  fi
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
require_cmd jq
require_cmd curl

"$ROOT/scripts/portolan-scan.sh" \
  "$TARGET_ROOT" \
  "$BUNDLE_DIR" \
  --yes \
  --skip-install \
  --no-viewer \
  --producers config,ctags \
  --shard-timeout 30 \
  --hotspot-budget 80 >/dev/null
"$ROOT/scripts/run-query-eval.sh" --run "$BUNDLE_DIR" >/dev/null
"$ROOT/scripts/build-captain-handoff.sh" "$BUNDLE_DIR" >/dev/null
jq -e '.repo_count == 2 and .relationship_count >= 2 and .target_root != ""' "$BUNDLE_DIR/manifest.json" >/dev/null
jq -e '
  .coverage.component_count == 2 and
  .coverage.edge_count >= 1 and
  .coverage.relationship_edges >= 1
' "$BUNDLE_DIR/atlas-facts.json" >/dev/null ||
  fail "viewer edge fixture did not produce a selectable atlas edge"
jq -s -e 'any((.from_repo // "") != "" and (.to_repo // "") != "")' \
  "$BUNDLE_DIR/relationships.jsonl" >/dev/null ||
  fail "viewer edge fixture did not produce endpoint relationship rows"
jq -e '.scenario == "captain-atlas-handoff" and .verdict == "verified"' "$BUNDLE_DIR/captain-handoff.json" >/dev/null
FIXTURE_REPO=$(jq -r '.[] | select(.name == "api-node") | .id' "$BUNDLE_DIR/repos.json")
WORKER_REPO=$(jq -r '.[] | select(.name == "worker-go") | .id' "$BUNDLE_DIR/repos.json")
[[ -n "$FIXTURE_REPO" && -n "$WORKER_REPO" ]] ||
  fail "viewer polyglot fixture did not expose api-node and worker-go repo ids"

HIDDEN_SYNTHETIC_TARGET="synthetic-support-14"
node - "$BUNDLE_DIR" <<'NODE'
const fs = require('fs');
const path = require('path');

const bundleDir = process.argv[2];
const atlasPath = path.join(bundleDir, 'atlas-facts.json');
const atlas = JSON.parse(fs.readFileSync(atlasPath, 'utf8'));
const layers = [
  ['entry', 'api', 'Synthetic entry'],
  ['service', 'worker', 'Synthetic service'],
  ['data', 'database', 'Synthetic data'],
  ['platform', 'platform', 'Synthetic platform'],
  ['support', 'library', 'Synthetic support'],
];
const additions = [];
for (const [layer, role, label] of layers) {
  for (let index = 1; index <= 14; index += 1) {
    const suffix = String(index).padStart(2, '0');
    const target = `synthetic-${layer}-${suffix}`;
    additions.push({
      id: `component:${target}`,
      target_id: target,
      repo_id: target,
      label: `${label} ${suffix}`,
      kind: 'repository',
      lifecycle: 'test-fixture',
      role,
      evidence_state: 'metadata-visible',
      summary: 'Synthetic large-map fixture node used by viewer smoke.',
      profile: { file_count: 1, primary_languages: [{ ext: '.md', files: 1 }] },
      counts: {
        findings: 0,
        severities: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
        kind_counts: {},
        inbound_manifest_deps: 0,
        outbound_manifest_deps: 0,
        relationship_records: 0,
        surfaces: 1,
      },
      surfaces: {},
      surface_routes: [],
      facts: [],
      signals: {
        good: ['synthetic fixture node'],
        attention: [],
        unknown: ['runtime call topology not_assessed'],
      },
    });
  }
}
atlas.components = [...(atlas.components || []), ...additions];
atlas.coverage = atlas.coverage || {};
atlas.coverage.component_count = atlas.components.length;
fs.writeFileSync(atlasPath, `${JSON.stringify(atlas, null, 2)}\n`);
NODE

(cd "$ROOT/viewer" && node scripts/build-static.js >/dev/null)

choose_port() {
  node - <<'NODE'
const net = require('net');
const server = net.createServer();
server.listen(0, '127.0.0.1', () => {
  const { port } = server.address();
  server.close(() => process.stdout.write(String(port)));
});
NODE
}

VIEWER_PORT=$(choose_port)
(cd "$ROOT/viewer" && node scripts/serve.js --bundle "$BUNDLE_DIR" --port "$VIEWER_PORT") >"$VIEWER_LOG" 2>&1 &
PID=$!

BASE_URL="http://127.0.0.1:$VIEWER_PORT"
for _ in $(seq 1 80); do
  if curl -sf "$BASE_URL/" >/dev/null 2>&1; then
    break
  fi
  kill -0 "$PID" 2>/dev/null || fail "viewer server exited before readiness"
  sleep 0.1
done
curl -sf "$BASE_URL/" >/dev/null || fail "viewer server did not become ready"

PLAYWRIGHT_MODULE=$(npx --yes --package playwright node -p "require.resolve('playwright')" 2>/dev/null || true)
[[ -n "$PLAYWRIGHT_MODULE" ]] || fail "could not resolve Playwright module via npx --package playwright"

cat >"$PW_SCRIPT" <<'NODE'
const { chromium } = require(process.env.PLAYWRIGHT_MODULE);

const baseUrl = process.env.BASE_URL;
if (!baseUrl) {
  throw new Error('BASE_URL is required');
}
const fixtureRepo = process.env.FIXTURE_REPO;
if (!fixtureRepo) {
  throw new Error('FIXTURE_REPO is required');
}
const workerRepo = process.env.WORKER_REPO;
if (!workerRepo) {
  throw new Error('WORKER_REPO is required');
}
const hiddenSyntheticTarget = process.env.HIDDEN_SYNTHETIC_TARGET;
if (!hiddenSyntheticTarget) {
  throw new Error('HIDDEN_SYNTHETIC_TARGET is required');
}

const rawHeavyPaths = new Set([
  '/bundle/hotspots.jsonl',
  '/bundle/relationships.jsonl',
  '/bundle/gaps.jsonl',
  '/bundle/claims.jsonl',
  '/bundle/promotion-health.jsonl',
]);
const apiHeavyPaths = new Set([
  '/api/hotspots',
  '/api/relationships',
  '/api/gaps',
  '/api/claims',
  '/api/promotion-health',
]);

const started = [];
const completed = [];
const rawHeavyRequested = [];
const selectedCodeRequests = [];
let firstVisibleAt = 0;
let releaseHeavyLoads = false;
let edgeAgentChecked = false;
const delayedRoutes = [];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(10_000);

  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (rawHeavyPaths.has(url.pathname)) {
      rawHeavyRequested.push(url.pathname);
      return route.fulfill({ status: 599, body: 'raw heavy JSONL should not be requested by first paint viewer' });
    }
    if (url.pathname === '/api/selected-code') {
      selectedCodeRequests.push(url.search);
    }
    if (apiHeavyPaths.has(url.pathname) && !releaseHeavyLoads) {
      started.push({ path: url.pathname, at: Date.now() });
      delayedRoutes.push(route);
      return;
    }
    await route.continue();
  });

  page.on('response', (response) => {
    const url = new URL(response.url());
    if (apiHeavyPaths.has(url.pathname)) {
      completed.push({ path: url.pathname, at: Date.now(), status: response.status() });
    }
  });

  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.getByText('Portolan').first().waitFor({ state: 'visible' });
  await page.getByText('Enterprise landscape atlas').waitFor({ state: 'visible' });
  firstVisibleAt = Date.now();

  const title = await page.title();
  if (!/Portolan Atlas/.test(title)) {
    throw new Error(`unexpected title: ${title}`);
  }

  const bodyText = (await page.locator('body').innerText()).trim();
  if (!bodyText.includes('Portolan') || bodyText.length < 40) {
    throw new Error(`viewer first screen looks blank: ${JSON.stringify(bodyText.slice(0, 120))}`);
  }
  for (const required of [
    'Repos',
    'Relations',
    'Risks',
    'Gaps',
    'Drill-down routes',
    'First inspection',
    'Landscape gaps',
    'Open source surfaces',
    'Trace relationships',
    'Ask from bundle',
    'runtime topology not_assessed',
  ]) {
    if (!bodyText.includes(required)) {
      throw new Error(`viewer first screen is missing captain atlas affordance: ${required}`);
    }
  }
  await page.getByTestId('captain-first-inspection').waitFor({ state: 'visible' });
  await page.getByTestId('captain-top-risks').waitFor({ state: 'visible' });
  await page.getByTestId('captain-global-gaps').waitFor({ state: 'visible' });
  const firstInspectionText = await page.getByTestId('captain-first-inspection').innerText();
  if (!/Risk|not_assessed|cannot_verify|Gap/i.test(firstInspectionText)) {
    throw new Error(`first inspection strip does not expose a concrete next inspection row: ${firstInspectionText}`);
  }
  const globalGapText = await page.getByTestId('captain-global-gaps').innerText();
  if (!/not_assessed|cannot_verify|unknown/i.test(globalGapText) || !/runtime|surface|gap/i.test(globalGapText)) {
    throw new Error(`global landscape gap rows are not visible on first screen: ${globalGapText}`);
  }

  const viewportNonBlank = await page.evaluate(() => {
    const app = document.querySelector('#app');
    if (!app) return false;
    const rect = app.getBoundingClientRect();
    const style = window.getComputedStyle(app);
    return rect.width > 100 && rect.height > 100 && style.visibility !== 'hidden' && style.display !== 'none';
  });
  if (!viewportNonBlank) {
    throw new Error('viewer app shell is not visibly laid out');
  }

  const completedBeforeFirstVisible = completed.filter((entry) => entry.at <= firstVisibleAt);
  if (completedBeforeFirstVisible.length > 0) {
    throw new Error(
      `bounded heavy API completed before first visible marker: ${completedBeforeFirstVisible.map((entry) => entry.path).join(', ')}`
    );
  }
  if (rawHeavyRequested.length > 0) {
    throw new Error(`viewer requested raw heavy JSONL instead of bounded API: ${rawHeavyRequested.join(', ')}`);
  }

  const mapVisible = await page.getByTestId('atlas-map').isVisible();
  if (!mapVisible) {
    throw new Error('viewer first screen does not expose the atlas map');
  }
  const selectableNodes = await page.locator('[data-testid="atlas-map"] [data-action="select-component"]').count();
  if (selectableNodes < 1) {
    throw new Error('viewer first screen map has no selectable nodes');
  }
  if (selectableNodes !== 48) {
    throw new Error(`large-map fixture should expose exactly 48 capped nodes, got ${selectableNodes}`);
  }
  const mapCountsText = await page.getByTestId('atlas-map-counts').innerText();
  if (!/48 visible nodes/.test(mapCountsText) || !/[1-9][0-9]* hidden nodes/.test(mapCountsText)) {
    throw new Error(`large-map cap is not visible in map counts: ${mapCountsText}`);
  }
  await page.getByTestId('atlas-map-layer-filter').waitFor({ state: 'visible' });
  const supportLayer = page.locator('[data-testid="atlas-map-layer-filter"] [data-action="map-layer"][data-layer="support"]');
  await supportLayer.waitFor({ state: 'visible' });
  const initialHiddenNode = await page.locator(`[data-testid="atlas-map-node"][data-node-id="${hiddenSyntheticTarget}"]`).count();
  if (initialHiddenNode !== 0) {
    throw new Error(`large-map fixture hidden node ${hiddenSyntheticTarget} was unexpectedly visible before drill-down`);
  }
  await supportLayer.click();
  await page.waitForFunction(() => document.querySelector('[data-testid="atlas-map"]')?.dataset.mapLayer === 'support');
  const layerCountsText = await page.getByTestId('atlas-map-counts').innerText();
  if (!layerCountsText.includes('Support nodes')) {
    throw new Error(`layer drill-down did not expose active layer counts: ${layerCountsText}`);
  }
  const layerHiddenNode = await page.locator(`[data-testid="atlas-map-node"][data-node-id="${hiddenSyntheticTarget}"]`).count();
  if (layerHiddenNode < 1) {
    throw new Error(`layer drill-down did not reveal hidden node ${hiddenSyntheticTarget}`);
  }
  await page.getByTestId('atlas-map-reset').click();
  await page.getByTestId('atlas-map-search').fill(hiddenSyntheticTarget);
  const searchHiddenNode = await page.locator(`[data-testid="atlas-map-node"][data-node-id="${hiddenSyntheticTarget}"]`).count();
  if (searchHiddenNode < 1) {
    throw new Error(`map search did not reveal hidden node ${hiddenSyntheticTarget}`);
  }
  await page.getByTestId('atlas-map-reset').click();

  releaseHeavyLoads = true;
  await Promise.all(delayedRoutes.splice(0).map((route) => route.continue()));
  await page.waitForTimeout(250);
  const loadedRiskText = await page.getByTestId('captain-top-risks').innerText();
  if (!loadedRiskText.includes('Why it matters')) {
    throw new Error(`top risk rows do not explain why they matter after bounded hotspot load: ${loadedRiskText}`);
  }

  const completedAfterRelease = completed.filter((entry) => apiHeavyPaths.has(entry.path));
  if (started.length === 0 && completedAfterRelease.length === 0) {
    throw new Error('no bounded heavy API requests were observed; first-paint smoke is not exercising deferred loads');
  }
  await page.locator('[data-testid="report-anchor-list"]').waitFor({ state: 'visible' });
  const reportAnchorCount = await page.locator('[data-testid="report-anchor-list"] .report-anchor').count();
  if (reportAnchorCount < 1) {
    throw new Error('executive brief did not expose any report-to-map anchors');
  }
  const firstReportAnchor = page.locator('[data-testid="report-anchor-list"] .report-anchor').first();
  const reportAnchorTitle = (await firstReportAnchor.locator('strong').innerText()).trim();
  const reportAnchorTarget = await firstReportAnchor.getAttribute('data-target');
  const reportAnchorFinding = await firstReportAnchor.getAttribute('data-finding');
  const reportAnchorEdge = await firstReportAnchor.getAttribute('data-edge');
  await firstReportAnchor.click();
  await page.waitForFunction(() => window.location.hash.includes('view=atlas'));
  await page.getByTestId('atlas-map').waitFor({ state: 'visible' });
  const hash = await page.evaluate(() => window.location.hash);
  if (reportAnchorEdge && !hash.includes(`edge=${encodeURIComponent(reportAnchorEdge)}`)) {
    throw new Error(`report-to-map edge anchor did not select edge ${reportAnchorEdge}: ${hash}`);
  }
  if (reportAnchorFinding && !hash.includes(`finding=${encodeURIComponent(reportAnchorFinding)}`)) {
    throw new Error(`report-to-map finding anchor did not select finding ${reportAnchorFinding}: ${hash}`);
  }
  if (reportAnchorTarget && !hash.includes(`component=${encodeURIComponent(reportAnchorTarget)}`)) {
    throw new Error(`report-to-map component anchor did not select target ${reportAnchorTarget}: ${hash}`);
  }
  const selectedMapNodes = await page.locator('[data-testid="atlas-map-node"].is-selected').count();
  if (selectedMapNodes < 1) {
    throw new Error('report-to-map anchor did not leave a selected map node visible');
  }
  if (reportAnchorTarget) {
    const selectedTargetVisible = await page.locator(`[data-testid="atlas-map-node"][data-node-id="${reportAnchorTarget}"].is-selected`).count();
    if (selectedTargetVisible < 1) {
      throw new Error(`report-to-map anchor selected hash target ${reportAnchorTarget}, but that map node is not selected`);
    }
  }
  await page.getByTestId('selection-report-panel').waitFor({ state: 'visible' });
  const reportPanelText = await page.getByTestId('selection-report-panel').innerText();
  if (!reportPanelText.includes('Report context') || !reportPanelText.includes('Back to report')) {
    throw new Error('selected object panel does not expose reciprocal report context and backlink');
  }
  if (reportAnchorTitle && !reportPanelText.includes(reportAnchorTitle)) {
    throw new Error(`selected object report context does not include clicked report anchor title: ${reportAnchorTitle}`);
  }

  const mapEdges = page.locator('[data-testid="atlas-map"] .edge-map-button[data-testid="atlas-map-edge"]');
  const mapEdgeCount = await mapEdges.count();
  if (mapEdgeCount < 1) {
    throw new Error('viewer edge fixture produced no clickable map edges');
  }
  await mapEdges.first().click({ force: true });
  await page.locator('.selection-card--edge').waitFor({ state: 'visible' });
  const endpointRepos = await page
    .locator('.selection-card--edge .endpoint-strip em')
    .evaluateAll((nodes) => [...new Set(nodes.map((node) => (node.textContent || '').trim()).filter(Boolean))]);
  for (const expectedRepo of [fixtureRepo, workerRepo]) {
    if (!endpointRepos.includes(expectedRepo)) {
      throw new Error(`selected edge did not expose endpoint repo id ${expectedRepo}: ${endpointRepos.join(', ')}`);
    }
  }
  const askButton = page.locator('.selection-card--edge .route-button-grid [data-view="agent"]').filter({ hasText: 'Ask from bundle' }).first();
  await askButton.click();
  await page.getByTestId('selected-edge-agent-panel').waitFor({ state: 'visible' });
  const edgeAgentText = await page.getByTestId('selected-edge-agent-panel').innerText();
  if (!edgeAgentText.includes('relationships --bundle')) {
    throw new Error('selected edge agent panel does not include a relationships --bundle command');
  }
  for (const repo of endpointRepos.slice(0, 2)) {
    if (!edgeAgentText.includes(`--repo ${repo}`) && !edgeAgentText.includes(`--repo '${repo}'`) && !edgeAgentText.includes(`--repo "${repo}"`)) {
      throw new Error(`selected edge agent panel missing endpoint relationships command for ${repo}`);
    }
  }
  edgeAgentChecked = true;

  await page.goto(`${baseUrl}/#view=agent`, { waitUntil: 'domcontentloaded' });
  await page.getByTestId('captain-handoff-panel').waitFor({ state: 'visible' });
  const handoffText = await page.getByTestId('captain-handoff-panel').innerText();
  if (!handoffText.includes('Captain handoff') || !/repos/i.test(handoffText) || !handoffText.includes('portolan-bundle-query.sh')) {
    throw new Error('Agent view does not render captain-handoff.json summary and query commands');
  }

  const selectedRoute = `${baseUrl}/#view=agent&repo=${encodeURIComponent(fixtureRepo)}&path=src/server.js&line=3&limit=5`;
  const selectedResponse = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return url.pathname === '/api/selected-code' && url.searchParams.get('repo') === fixtureRepo;
  });
  await page.goto(selectedRoute, { waitUntil: 'domcontentloaded' });
  const response = await selectedResponse;
  if (!response.ok()) {
    throw new Error(`/api/selected-code route returned ${response.status()}`);
  }
  await page.locator('[data-testid="selected-code-result"]').waitFor({ state: 'visible' });
  const selectedBody = await page.locator('body').innerText();
  for (const expected of ['Selected code lookup', 'selected-code-context', 'src/server.js', 'line 3', fixtureRepo, 'resolution limit']) {
    if (!selectedBody.toLowerCase().includes(String(expected).toLowerCase())) {
      throw new Error(`selected-code route did not render ${expected}`);
    }
  }
  if (selectedCodeRequests.length !== 1) {
    throw new Error(`expected one selected-code request from hash route, saw ${selectedCodeRequests.length}`);
  }

  await page.getByTestId('selected-code-form').locator('input[name="symbol"]').fill('routeJob');
  const formResponse = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return url.pathname === '/api/selected-code' && url.searchParams.get('symbol') === 'routeJob';
  });
  await page.getByTestId('selected-code-form').locator('button[type="submit"]').click();
  const submitted = await formResponse;
  if (!submitted.ok()) {
    throw new Error(`/api/selected-code form submit returned ${submitted.status()}`);
  }
  await page.waitForFunction(() => document.body.innerText.includes('routeJob'));

  await browser.close();
  process.stdout.write(JSON.stringify({
    firstVisibleAt,
    heavyStartedBeforeFirstVisible: started.filter((entry) => entry.at <= firstVisibleAt).map((entry) => entry.path),
    heavyCompletedBeforeFirstVisible: completedBeforeFirstVisible.map((entry) => entry.path),
    heavyCompletedAfterRelease: completedAfterRelease.map((entry) => `${entry.path}:${entry.status}`),
    rawHeavyRequested,
    reportAnchorCount,
    reportAnchorTarget,
    reportAnchorFinding,
    reportAnchorEdge,
    edgeAgentChecked,
    selectedCodeRequests,
  }, null, 2));
  process.stdout.write('\n');
}

main().catch((err) => {
  const message = err && err.message ? err.message : String(err);
  if (/Executable doesn't exist|browserType\.launch|Please run the following command|playwright install/i.test(message)) {
    process.stderr.write(`blocked: Playwright Chromium is not installed or cannot launch.\n`);
    process.stderr.write(`Run: npx playwright install chromium\n`);
  }
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
NODE

if ! BASE_URL="$BASE_URL" FIXTURE_REPO="$FIXTURE_REPO" WORKER_REPO="$WORKER_REPO" HIDDEN_SYNTHETIC_TARGET="$HIDDEN_SYNTHETIC_TARGET" PLAYWRIGHT_MODULE="$PLAYWRIGHT_MODULE" npx --yes --package playwright node "$PW_SCRIPT"; then
  fail "Playwright viewer first-paint smoke failed"
fi

echo "harness-viewer-first-paint-smoke: ok"
