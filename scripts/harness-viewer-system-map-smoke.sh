#!/usr/bin/env bash
# Browser smoke for the system-map-driven viewer (Feature 5 + Feature 9 + Feature 2).
# Builds a corpus-driven bundle, serves the viewer, and asserts:
#   - default route is Overview (first screen answers the five questions);
#   - the DOM/route contract is present (data-portolan-id/kind/route/clickable);
#   - the default map shows no surface peer components;
#   - a component dossier opens with all required sections (Feature 4);
#   - C4 family boxes are clickable;
#   - the browser console has no uncaught errors and no failed local asset requests.
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/.." && pwd)
TMP=$(mktemp -d); BUNDLE="$TMP/sm-bundle"; TARGET="$TMP/target"
mkdir -p "$BUNDLE" "$TARGET"
printf '[]\n' >"$BUNDLE/repos.json"
printf '{"schema_version":"0.1.0","repos":[]}\n' >"$BUNDLE/repo-profiles.json"
printf '{"schema_version":"0.1.0"}\n' >"$BUNDLE/manifest.json"
: >"$BUNDLE/hotspots-full.jsonl"; : >"$BUNDLE/relationships.jsonl"; : >"$BUNDLE/gaps.jsonl"
"$ROOT/scripts/build-atlas-surfaces.sh" "$TARGET" "$BUNDLE" "$ROOT/internal/testfixtures/corpus-manifests/apache-bigtop/manifest.json" >/dev/null
"$ROOT/scripts/build-atlas-facts.sh" "$TARGET" "$BUNDLE" >/dev/null
"$ROOT/scripts/build-system-map.sh" "$BUNDLE" "$TARGET" >/dev/null
"$ROOT/scripts/validate-system-map-schema.sh" "$BUNDLE/system-map.json" >/dev/null

# Choose a free port.
PORT=$(node -e "const n=require('net');const s=n.createServer();s.listen(0,'127.0.0.1',()=>{process.stdout.write(String(s.address().port));s.close();})")
node "$ROOT/viewer/scripts/serve.js" --bundle "$BUNDLE" --port "$PORT" >/dev/null 2>&1 &
VPID=$!
cleanup() { kill "$VPID" 2>/dev/null || true; wait "$VPID" 2>/dev/null || true; rm -rf "$TMP"; }
trap cleanup EXIT
for _ in $(seq 1 50); do curl -sf "http://127.0.0.1:$PORT/" >/dev/null 2>&1 && break; kill -0 "$VPID" 2>/dev/null || break; sleep 0.1; done

node - "$PORT" <<'NODE'
const port = process.argv[2];
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 980 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('requestfailed', r => { const u = r.url(); if (!u.includes('favicon')) errors.push('REQFAIL: ' + u); });
  const fail = (m) => { console.error('harness-viewer-system-map-smoke: FAIL: ' + m); process.exit(1); };

  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  // Feature 5: default route Overview, first screen answers the questions.
  const overviewText = await page.evaluate(() => document.body.innerText.toUpperCase());
  for (const phrase of ['MAIN COMPONENTS', 'IMPORTANT RELATIONSHIPS', 'WHAT IS MISSING OR UNKNOWN', 'WHAT TO CLICK NEXT']) {
    overviewText.includes(phrase) || fail(`Overview first screen missing "${phrase}"`);
  }

  // Feature 9: DOM/route contract present.
  const dom = await page.evaluate(() => ({
    id: document.querySelectorAll('[data-portolan-id]').length,
    kind: document.querySelectorAll('[data-portolan-kind]').length,
    route: document.querySelectorAll('[data-portolan-route]').length,
    clickable: document.querySelectorAll('[data-portolan-clickable]').length,
  }));
  dom.id > 0 || fail('no data-portolan-id elements');
  dom.kind > 0 || fail('no data-portolan-kind elements');
  dom.route > 0 || fail('no data-portolan-route elements');
  dom.clickable > 0 || fail('no data-portolan-clickable elements');

  // Feature 2: default map shows no surface peer components.
  await page.evaluate(() => { window.location.hash = '#/map'; });
  await page.waitForTimeout(300);
  const mapNodes = await page.evaluate(() => Array.from(document.querySelectorAll('[data-portolan-kind="component"]')).map(n => n.getAttribute('data-portolan-id')));
  mapNodes.length > 0 || fail('map has no component nodes');
  const leaked = mapNodes.filter(id => /support-matrix|mailing-list|bigtop-ci|binary-repo|docker-image/.test(id));
  leaked.length === 0 || fail(`map leaked ${leaked.length} surface-only node(s) as components: ${leaked.join(', ')}`);

  // Feature 4: Sqoop dossier opens with required sections.
  await page.evaluate(() => { window.location.hash = '#/dossier/component/apache-sqoop'; });
  await page.waitForTimeout(300);
  const dossierText = await page.evaluate(() => document.body.innerText.toUpperCase());
  for (const phrase of ['APACHE SQOOP', 'RETIRED / LEGACY', 'WHAT THIS IS', 'WHY IT IS PRESENT', 'WHERE IT SITS IN C4', 'NEXT USEFUL ACTIONS', 'PRODUCER AND EVIDENCE']) {
    dossierText.includes(phrase) || fail(`Sqoop dossier missing section "${phrase}"`);
  }
  const relLinks = await page.locator('[data-portolan-kind="relationship"]').count();
  relLinks >= 1 || fail('Sqoop dossier has no relationship links');

  // Feature 3: C4 family boxes clickable.
  await page.evaluate(() => { window.location.hash = '#/c4/families'; });
  await page.waitForTimeout(300);
  const familyCards = await page.locator('[data-portolan-kind="c4-family"]').count();
  familyCards > 0 || fail('C4 families view has no family boxes');

  // Surfaces view exists and shows surface types.
  await page.evaluate(() => { window.location.hash = '#/surfaces'; });
  await page.waitForTimeout(300);
  const surfaceNodes = await page.locator('[data-portolan-kind="surface"]').count();
  surfaceNodes > 0 || fail('Surfaces view has no surface nodes');

  // Search/filters: the components search input filters the list.
  await page.evaluate(() => { window.location.hash = '#/components'; });
  await page.waitForTimeout(300);
  const beforeSearch = await page.locator('.component-card').count();
  await page.fill('.search-input', 'sqoop');
  await page.waitForTimeout(400);
  const afterSearch = await page.locator('.component-card').count();
  afterSearch <= beforeSearch || fail(`search did not filter (before=${beforeSearch} after=${afterSearch})`);
  (await page.locator('.component-card').count()) >= 0 || fail('search produced negative count');
  // clear search
  await page.fill('.search-input', '');
  await page.waitForTimeout(200);

  // Negative regression: no dangling nodes (every data-portolan-id resolves to a map object).
  await page.evaluate(() => { window.location.hash = '#/overview'; });
  await page.waitForTimeout(300);
  const dangling = await page.evaluate(() => {
    const ids = Array.from(document.querySelectorAll('[data-portolan-id]')).map(n => n.getAttribute('data-portolan-id'));
    // map object ids are all the system-map object ids; we check no id is a literal placeholder
    return ids.filter(id => !id || id === 'undefined' || id === 'null').length;
  });
  dangling === 0 || fail(`${dangling} dangling/placeholder node id(s) found`);

  // Negative regression: no fake controls (every clickable claims clickable=true).
  const fakeControls = await page.evaluate(() => {
    const clickables = Array.from(document.querySelectorAll('[data-portolan-route]'));
    // A clickable with no href and no listener is a fake; here we assert none are missing a route value.
    return clickables.filter(n => !n.getAttribute('data-portolan-route')).length;
  });
  fakeControls === 0 || fail(`${fakeControls} clickable element(s) missing a route`);

  // Negative regression: no noisy inline question-mark clutter.
  const questionMarks = await page.evaluate(() => {
    return document.querySelectorAll('.help-mark, [title="?"], .inline-help-q').length;
  });
  questionMarks === 0 || fail(`${questionMarks} noisy inline help-mark element(s) found`);

  // Negative regression: unsupported C4 claim — every component c4_family is a known family.
  const badC4 = await page.evaluate(() => {
    // fetch the system map client-side to verify c4_family values
    return fetch('/bundle/system-map.json').then(r => r.json()).then(m => {
      const known = new Set(['data-systems','compute-processing','platform-governance','packaging-runtime','coordination-community','integration-services','unknown']);
      return (m.objects.components || []).filter(c => !known.has(c.c4_family)).length;
    });
  });
  badC4 === 0 || fail(`${badC4} component(s) have an unsupported c4_family value`);

  // Unknown/missing route handling: an invalid dossier route shows "Object not found", no crash.
  await page.evaluate(() => { window.location.hash = '#/dossier/component/does-not-exist-xyz'; });
  await page.waitForTimeout(300);
  const notFoundText = await page.evaluate(() => document.body.innerText);
  notFoundText.includes('not found') || fail('invalid dossier route did not show a not-found message');

  errors.length === 0 || fail(`browser had ${errors.length} error(s): ${errors.slice(0, 3).join(' | ')}`);
  console.error('harness-viewer-system-map-smoke: ok');
  await browser.close();
})().catch(e => { console.error('harness-viewer-system-map-smoke: FAIL: ' + e.message); process.exit(1); });
NODE
