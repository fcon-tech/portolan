#!/usr/bin/env bash
# Playwright smoke for real corpus viewer usefulness. It opens existing bundles,
# captures screenshots, and checks captain-atlas affordances without mutating the
# corpus or requiring a long scan.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
BIGTOP_BUNDLE=""
SECOND_OSS_BUNDLE=""
OUTPUT_DIR=""
REQUIRE_SECOND_OSS_RELATIONSHIPS=0
WORK_DIR=$(mktemp -d)
PID=""

usage() {
  cat <<'EOF'
usage: harness-viewer-corpus-smoke.sh [options]

Options:
  --bigtop-bundle DIR      Existing full or bounded Bigtop atlas bundle.
  --second-oss-bundle DIR  Existing non-Bigtop OSS atlas bundle.
  --output-dir DIR         Directory for screenshots/checklist JSON.
  --require-second-oss-relationships
                            Require second OSS edge drill-down. Use for strict
                            northstar proof, not no-edge portability smoke.
  -h, --help               Show this help.
EOF
}

fail() {
  echo "harness-viewer-corpus-smoke: FAIL: $*" >&2
  if [[ -n "${VIEWER_LOG:-}" && -s "$VIEWER_LOG" ]]; then
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

require_opt_value() {
  local flag=$1 val=${2:-}
  if [[ -z "$val" || "$val" == -* ]]; then
    echo "option $flag requires a value" >&2
    usage >&2
    exit 2
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --bigtop-bundle) require_opt_value --bigtop-bundle "${2:-}"; BIGTOP_BUNDLE="$2"; shift 2 ;;
    --second-oss-bundle) require_opt_value --second-oss-bundle "${2:-}"; SECOND_OSS_BUNDLE="$2"; shift 2 ;;
    --output-dir) require_opt_value --output-dir "${2:-}"; OUTPUT_DIR="$2"; shift 2 ;;
    --require-second-oss-relationships) REQUIRE_SECOND_OSS_RELATIONSHIPS=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done

[[ -n "$BIGTOP_BUNDLE" || -n "$SECOND_OSS_BUNDLE" ]] ||
  fail "pass at least one corpus bundle"

if [[ -n "$BIGTOP_BUNDLE" ]]; then
  BIGTOP_BUNDLE=$(cd "$BIGTOP_BUNDLE" && pwd)
fi
if [[ -n "$SECOND_OSS_BUNDLE" ]]; then
  SECOND_OSS_BUNDLE=$(cd "$SECOND_OSS_BUNDLE" && pwd)
fi
if [[ -z "$OUTPUT_DIR" ]]; then
  OUTPUT_DIR="$WORK_DIR/screenshots"
fi
mkdir -p "$OUTPUT_DIR"
OUTPUT_DIR=$(cd "$OUTPUT_DIR" && pwd)

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "missing required command: $1"
}

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

run_lane() {
  local lane=$1 bundle=$2 min_repos=$3 min_relationships=$4 require_handoff=$5
  local port base_url pw_script result_json
  VIEWER_LOG="$WORK_DIR/$lane-viewer.log"
  pw_script="$WORK_DIR/$lane-viewer-corpus-smoke.cjs"
  result_json="$OUTPUT_DIR/$lane-checklist.json"

  [[ -d "$bundle" ]] || fail "$lane bundle not found: $bundle"
  [[ -f "$bundle/manifest.json" ]] || fail "$lane missing manifest.json"
  [[ -f "$bundle/atlas-facts.json" ]] || fail "$lane missing atlas-facts.json"
  jq -e \
    --argjson min_repos "$min_repos" \
    --argjson min_relationships "$min_relationships" \
    '.repo_count >= $min_repos and .relationship_count >= $min_relationships' \
    "$bundle/manifest.json" >/dev/null ||
    fail "$lane manifest does not meet corpus expectation: repo_count=$(jq -r '.repo_count // 0' "$bundle/manifest.json") min_repos=$min_repos relationship_count=$(jq -r '.relationship_count // 0' "$bundle/manifest.json") min_relationships=$min_relationships"
  jq -e \
    --argjson min_repos "$min_repos" \
    '.coverage.component_count >= $min_repos and .coverage.runtime_topology == "not_assessed"' \
    "$bundle/atlas-facts.json" >/dev/null ||
    fail "$lane atlas facts do not expose expected components/runtime gap"

  port=$(choose_port)
  base_url="http://127.0.0.1:$port"
  (cd "$ROOT/viewer" && node scripts/serve.js --bundle "$bundle" --port "$port") >"$VIEWER_LOG" 2>&1 &
  PID=$!

  for _ in $(seq 1 80); do
    if curl -sf "$base_url/" >/dev/null 2>&1; then
      break
    fi
    kill -0 "$PID" 2>/dev/null || fail "$lane viewer exited before readiness"
    sleep 0.1
  done
  curl -sf "$base_url/" >/dev/null || fail "$lane viewer did not become ready"

  cat >"$pw_script" <<'NODE'
const fs = require('fs');
const path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE);

const lane = process.env.LANE;
const baseUrl = process.env.BASE_URL;
const outputDir = process.env.OUTPUT_DIR;
const minRepos = Number(process.env.MIN_REPOS || '1');
const minRelationships = Number(process.env.MIN_RELATIONSHIPS || '0');
const requireHandoff = process.env.REQUIRE_HANDOFF === '1';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 980 } });
  page.setDefaultTimeout(15_000);

  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.getByText('Enterprise landscape atlas').waitFor({ state: 'visible' });
  await page.getByTestId('atlas-map').waitFor({ state: 'visible' });
  await page.screenshot({ path: path.join(outputDir, `${lane}-overview.png`), fullPage: true });

  const bodyText = await page.locator('body').innerText();
  for (const required of [
    'Repos',
    'Risks',
    'Gaps',
    'Drill-down routes',
    'Open source surfaces',
    'Ask from bundle',
    'runtime topology not_assessed',
  ]) {
    if (!bodyText.includes(required)) {
      throw new Error(`${lane}: first screen missing ${required}`);
    }
  }

  const nodeCount = await page.locator('[data-testid="atlas-map-node"]').count();
  if (nodeCount < Math.min(minRepos, 12)) {
    throw new Error(`${lane}: expected visible map nodes for corpus, got ${nodeCount}`);
  }

  const countText = await page.getByTestId('atlas-map-counts').innerText();
  if (!/visible nodes/.test(countText)) {
    throw new Error(`${lane}: map count text missing visible node summary: ${countText}`);
  }

  let selectedNode = page.locator('[data-testid="atlas-map-node"]').first();
  if (minRelationships > 0) {
    const edgeTarget = await page.evaluate(async () => {
      const response = await fetch('/api/atlas?section=edges&limit=20');
      const payload = await response.json();
      const record = (payload.records || []).find((item) =>
        item.from_target || item.to_target || item.payload?.from_target || item.payload?.to_target
      );
      return record?.from_target || record?.to_target || record?.payload?.from_target || record?.payload?.to_target || '';
    });
    if (edgeTarget) {
      const edgeNode = page.locator(`[data-testid="atlas-map-node"][data-node-id="${edgeTarget}"]`).first();
      if (await edgeNode.count()) {
        selectedNode = edgeNode;
      }
    }
  }
  await selectedNode.click();
  await page.locator('.selection-card').first().waitFor({ state: 'visible' });
  if (minRelationships > 0) {
    const visibleNodes = page.locator('[data-testid="atlas-map-node"]');
    const visibleNodeCount = await visibleNodes.count();
    for (let i = 0; i < visibleNodeCount; i += 1) {
      const edgeCount = await page.locator('.selection-card .edge-button-list [data-action="select-edge"]').count();
      if (edgeCount > 0) break;
      await visibleNodes.nth(i).click();
      await page.locator('.selection-card').first().waitFor({ state: 'visible' });
    }
  }
  const selectedText = await page.locator('.selection-card').first().innerText();
  for (const required of ['facts', 'risks', 'gaps']) {
    if (!selectedText.toLowerCase().includes(required)) {
      throw new Error(`${lane}: selected node panel missing ${required}`);
    }
  }
  await page.screenshot({ path: path.join(outputDir, `${lane}-node-drilldown.png`), fullPage: true });

  let edgeChecked = false;
  if (minRelationships > 0) {
    const mapEdges = page.locator('[data-testid="atlas-map"] .edge-map-button[data-testid="atlas-map-edge"]');
    const edgeCount = await mapEdges.count();
    if (edgeCount < 1) {
      throw new Error(`${lane}: expected clickable relationship edge in atlas map`);
    }
    await mapEdges.first().click({ force: true });
    await page.locator('.selection-card--edge').waitFor({ state: 'visible' });
    const edgeText = await page.locator('.selection-card--edge').innerText();
    if (!edgeText.includes('Ask from bundle') || !edgeText.includes('Endpoint')) {
      throw new Error(`${lane}: selected edge panel lacks agent drill-down/endpoints`);
    }
    await page.screenshot({ path: path.join(outputDir, `${lane}-edge-drilldown.png`), fullPage: true });
    edgeChecked = true;
  }

  let handoffStatus = 'not_assessed';
  await page.goto(`${baseUrl}/#view=agent`, { waitUntil: 'domcontentloaded' });
  await page.getByTestId('selected-code-panel').waitFor({ state: 'visible' });
  const agentText = await page.locator('body').innerText();
  if (!agentText.includes('Selected code lookup') || !agentText.includes('selected-code --bundle')) {
    throw new Error(`${lane}: agent view missing selected-code drill-down command`);
  }
  if (requireHandoff) {
    const handoffJson = await (await fetch(`${baseUrl}/bundle/captain-handoff.json`)).json();
    if (minRelationships > 0 && handoffJson.verdict !== 'verified') {
      throw new Error(`${lane}: captain-handoff.json verdict is ${handoffJson.verdict || 'missing'}, expected verified`);
    }
    if (handoffJson.statuses?.qna_eval !== 'verified' ||
        handoffJson.statuses?.drill_down !== 'verified' ||
        handoffJson.statuses?.selected_code_drill_down !== 'verified') {
      throw new Error(`${lane}: captain handoff lacks verified Q&A/selected-code drill-down statuses`);
    }
    if (minRelationships > 0 &&
        (handoffJson.statuses?.relationship_drill_down !== 'verified' ||
         Number(handoffJson.counts?.relationships || 0) < minRelationships)) {
      throw new Error(`${lane}: captain handoff lacks verified relationship drill-down evidence`);
    }
    await page.getByTestId('captain-handoff-panel').waitFor({ state: 'visible' });
    const handoffText = await page.getByTestId('captain-handoff-panel').innerText();
    if (!handoffText.includes('Captain handoff') || !handoffText.includes('portolan-bundle-query.sh')) {
      throw new Error(`${lane}: handoff panel missing captain handoff/query commands`);
    }
    handoffStatus = handoffJson.verdict === 'verified' ? 'verified' : 'not_assessed';
  }
  await page.screenshot({ path: path.join(outputDir, `${lane}-agent-drilldown.png`), fullPage: true });

  await browser.close();
  const result = {
    lane,
    verdict: 'verified',
    screenshots: [
      `${lane}-overview.png`,
      `${lane}-node-drilldown.png`,
      ...(edgeChecked ? [`${lane}-edge-drilldown.png`] : []),
      `${lane}-agent-drilldown.png`,
    ],
    checks: {
      first_screen_orients_captain: 'verified',
      map_drilldown: 'verified',
      edge_drilldown: edgeChecked ? 'verified' : 'not_assessed',
      selected_code_agent_route: 'verified',
      captain_handoff: requireHandoff ? handoffStatus : 'not_assessed',
    },
  };
  fs.writeFileSync(process.env.RESULT_JSON, `${JSON.stringify(result, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

main().catch((err) => {
  const message = err && err.message ? err.message : String(err);
  if (/Executable doesn't exist|browserType\.launch|Please run the following command|playwright install/i.test(message)) {
    process.stderr.write('blocked: Playwright Chromium is not installed or cannot launch.\n');
    process.stderr.write('Run: npx playwright install chromium\n');
  }
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
NODE

  if ! LANE="$lane" \
    BASE_URL="$base_url" \
    OUTPUT_DIR="$OUTPUT_DIR" \
    RESULT_JSON="$result_json" \
    MIN_REPOS="$min_repos" \
    MIN_RELATIONSHIPS="$min_relationships" \
    REQUIRE_HANDOFF="$require_handoff" \
    PLAYWRIGHT_MODULE="$PLAYWRIGHT_MODULE" \
    npx --yes --package playwright node "$pw_script"; then
    fail "$lane Playwright corpus viewer smoke failed"
  fi

  kill "$PID" 2>/dev/null || true
  wait "$PID" 2>/dev/null || true
  PID=""
}

require_cmd node
require_cmd npx
require_cmd jq
require_cmd curl

(cd "$ROOT/viewer" && node scripts/build-static.js >/dev/null)
PLAYWRIGHT_MODULE=$(npx --yes --package playwright node -p "require.resolve('playwright')" 2>/dev/null || true)
[[ -n "$PLAYWRIGHT_MODULE" ]] || fail "could not resolve Playwright module via npx --package playwright"

if [[ -n "$BIGTOP_BUNDLE" ]]; then
  run_lane "bigtop" "$BIGTOP_BUNDLE" 10 1 1
fi
if [[ -n "$SECOND_OSS_BUNDLE" ]]; then
  if [[ "$REQUIRE_SECOND_OSS_RELATIONSHIPS" -eq 1 ]]; then
    run_lane "second-oss" "$SECOND_OSS_BUNDLE" 2 1 1
  else
    run_lane "second-oss" "$SECOND_OSS_BUNDLE" 2 0 1
  fi
fi

echo "harness-viewer-corpus-smoke: ok output=$OUTPUT_DIR"
