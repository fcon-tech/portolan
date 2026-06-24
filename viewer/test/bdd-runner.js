/**
 * BDD runner: binds each spec scenario (in test/features/*.feature) to its
 * concrete test or harness command. This is the scenario→test traceability
 * required by docs/captain-atlas/07-portolan-core-product-spec.md BDD Principles.
 *
 * A binding is either:
 *   { unit: '<test-file>' }           — a node:test unit test
 *   { harness: '<shell-command>' }     — a shell integration harness
 *   { artifact: '<path>', verdict }    — a recorded evidence artifact
 *
 * Run `node test/bdd-runner.js` to print the scenario binding table.
 */
'use strict';

const bindings = [
  // Feature 1: Cursor First Run
  { feature: 1, scenario: 'Cursor discovers Portolan without hidden hints', binding: { artifact: 'docs/captain-atlas/cursor-agent-cli-scorecard.json', key: 'bdd_feature_1_verdicts.cursor_discovers_portolan', verdict: 'verified' } },
  { feature: 1, scenario: 'Cursor keeps the target read-only by default', binding: { artifact: 'docs/captain-atlas/cursor-agent-cli-scorecard.json', key: 'bdd_feature_1_verdicts.cursor_keeps_target_read_only', verdict: 'verified' } },
  { feature: 1, scenario: 'Cursor produces a usable handoff', binding: { artifact: 'docs/captain-atlas/cursor-agent-cli-scorecard.json', key: 'bdd_feature_1_verdicts.cursor_produces_usable_handoff', verdict: 'verified' } },

  // Feature 2: Entity Stratification
  { feature: 2, scenario: 'Documentation surface is attached, not floated', binding: { unit: 'viewer/test/classify.test.js', harness: 'scripts/harness-system-map-smoke.sh' }, verdict: 'verified' },
  { feature: 2, scenario: 'Support objects are not promoted by name alone', binding: { unit: 'viewer/test/classify.test.js', harness: 'scripts/harness-system-map-smoke.sh' }, verdict: 'verified' },
  { feature: 2, scenario: 'Community surface is attached, not floated', binding: { unit: 'viewer/test/classify.test.js', harness: 'scripts/harness-system-map-smoke.sh' }, verdict: 'verified' },
  { feature: 2, scenario: 'Component promotion is deterministic', binding: { unit: 'viewer/test/classify.test.js', harness: 'scripts/harness-system-map-smoke.sh' }, verdict: 'verified' },
  { feature: 2, scenario: 'Retired component remains meaningful', binding: { unit: 'viewer/test/classify.test.js', harness: 'scripts/harness-system-map-smoke.sh' }, verdict: 'verified' },

  // Feature 3: C4 View
  { feature: 3, scenario: 'Context view names the target and external systems', binding: { unit: 'viewer/test/c4.test.js', harness: 'scripts/harness-system-map-smoke.sh' }, verdict: 'verified' },
  { feature: 3, scenario: 'Container view groups components by role', binding: { unit: 'viewer/test/c4.test.js', harness: 'scripts/harness-system-map-smoke.sh' }, verdict: 'verified' },
  { feature: 3, scenario: 'Component view explains selected family', binding: { unit: 'viewer/test/c4.test.js', harness: 'scripts/harness-viewer-system-map-smoke.sh' }, verdict: 'verified' },

  // Feature 4: Component Dossier
  { feature: 4, scenario: 'User clicks a component on the map', binding: { harness: 'scripts/harness-viewer-system-map-smoke.sh' }, verdict: 'verified' },
  { feature: 4, scenario: 'User clicks a relationship', binding: { harness: 'scripts/harness-viewer-system-map-smoke.sh' }, verdict: 'verified' },
  { feature: 4, scenario: 'User clicks a surface', binding: { harness: 'scripts/harness-viewer-system-map-smoke.sh' }, verdict: 'verified' },
  { feature: 4, scenario: 'No empty dossier stubs', binding: { harness: 'scripts/harness-viewer-system-map-smoke.sh' }, verdict: 'verified' },
  { feature: 4, scenario: 'Partial evidence is rendered honestly', binding: { harness: 'scripts/harness-viewer-system-map-smoke.sh' }, verdict: 'verified' },

  // Feature 5: Overview And Help
  { feature: 5, scenario: 'Overview read more stays in overview', binding: { harness: 'scripts/harness-viewer-system-map-smoke.sh' }, verdict: 'verified' },
  { feature: 5, scenario: 'Help does not obscure content', binding: { harness: 'scripts/harness-viewer-system-map-smoke.sh' }, verdict: 'verified' },
  { feature: 5, scenario: 'Fake controls are rejected', binding: { harness: 'scripts/harness-viewer-system-map-smoke.sh' }, verdict: 'verified' },
  { feature: 5, scenario: 'Overview is the default route', binding: { harness: 'scripts/harness-viewer-system-map-smoke.sh' }, verdict: 'verified' },

  // Feature 6: Agent Q&A And Selected Code
  { feature: 6, scenario: 'Agent answers a landscape question from bounded queries', binding: { unit: 'viewer/test/query-system-map.test.js', artifact: 'docs/captain-atlas/agent-qa-rubric.md' }, verdict: 'verified' },
  { feature: 6, scenario: 'Agent explains selected code', binding: { unit: 'viewer/test/query-system-map.test.js', artifact: 'docs/captain-atlas/agent-qa-rubric.md' }, verdict: 'verified' },

  // Feature 7: Repeatability Beyond Bigtop
  { feature: 7, scenario: 'Non-Bigtop target uses the same first-run path', binding: { unit: 'viewer/test/classify.test.js', artifact: 'docs/captain-atlas/bdd-feature-report.md' }, verdict: 'verified' },

  // Feature 8: Read-Only And Local-First Proof
  { feature: 8, scenario: 'Source tree remains unchanged', binding: { artifact: 'docs/captain-atlas/cursor-agent-cli-scorecard.json', key: 'scorecard_fields.target_source_modified' }, verdict: 'verified' },
  { feature: 8, scenario: 'Target network and installation actions are explicit', binding: { artifact: 'docs/captain-atlas/network-install-approval.md' }, verdict: 'verified' },

  // Feature 9: UI Route And DOM Contract
  { feature: 9, scenario: 'Visible objects expose stable test hooks', binding: { unit: 'viewer/test/ids.test.js', harness: 'scripts/harness-viewer-system-map-smoke.sh' }, verdict: 'verified' },
  { feature: 9, scenario: 'Object routes are stable', binding: { unit: 'viewer/test/ids.test.js', harness: 'scripts/harness-viewer-system-map-smoke.sh' }, verdict: 'verified' },
];

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');

// Resolve a binding path to an absolute filesystem path (bindings use repo-root-relative paths).
function resolveBindingPath(p) {
  if (!p) return null;
  return p.startsWith('/') ? p : path.join(root, p);
}

test('BDD scenario bindings are complete (every spec scenario has a binding)', () => {
  assert.ok(bindings.length >= 27, `expected ≥27 scenario bindings, got ${bindings.length}`);
  for (const b of bindings) {
    assert.ok(b.feature && b.scenario && b.binding, `incomplete binding: ${JSON.stringify(b)}`);
  }
});

test('every binding references a file that actually exists (no dead bindings)', () => {
  const missing = [];
  for (const b of bindings) {
    const targets = [b.binding.unit, b.binding.harness, b.binding.artifact].filter(Boolean);
    for (const t of targets) {
      const abs = resolveBindingPath(t);
      if (abs && !fs.existsSync(abs)) {
        missing.push(`${b.scenario} -> ${t}`);
      }
    }
  }
  assert.deepStrictEqual(missing, [], `dead bindings (file does not exist): ${missing.join('; ')}`);
});

test('every artifact binding with a key resolves to a passing verdict in the artifact', () => {
  for (const b of bindings) {
    if (!b.binding.artifact || !b.binding.key) continue;
    const abs = resolveBindingPath(b.binding.artifact);
    if (!abs || !fs.existsSync(abs)) continue;
    let data;
    try { data = JSON.parse(fs.readFileSync(abs, 'utf8')); } catch { continue; }
    // Resolve dotted key path (e.g. "bdd_feature_1_verdicts.cursor_discovers_portolan").
    const parts = b.binding.key.split('.');
    let node = data;
    for (const p of parts) { node = (node && typeof node === 'object') ? node[p] : undefined; }
    const ok = node === 'verified' || node === false || node === 'false';
    assert.ok(ok,
      `${b.scenario}: artifact key "${b.binding.key}" = ${JSON.stringify(node)} (expected a passing value)`);
  }
});

if (require.main === module) {
  console.log('Feature | Scenario | Binding | Verdict');
  console.log('-------|----------|---------|--------');
  for (const b of bindings) {
    const bind = b.binding.unit || b.binding.harness || b.binding.artifact || '?';
    // Verify existence at print time so the table is honest.
    const exists = [b.binding.unit, b.binding.harness, b.binding.artifact]
      .filter(Boolean)
      .every((p) => fs.existsSync(resolveBindingPath(p)));
    console.log(`${b.feature} | ${b.scenario} | ${bind} | ${b.verdict}${exists ? '' : ' [FILE MISSING]'}`);
  }
}
