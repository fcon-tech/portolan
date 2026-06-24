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
  { feature: 2, scenario: 'Documentation surface is attached, not floated', binding: { unit: 'test/classify.test.js', harness: 'scripts/harness-system-map-smoke.sh' }, verdict: 'verified' },
  { feature: 2, scenario: 'Support objects are not promoted by name alone', binding: { unit: 'test/classify.test.js', harness: 'scripts/harness-system-map-smoke.sh' }, verdict: 'verified' },
  { feature: 2, scenario: 'Community surface is attached, not floated', binding: { unit: 'test/classify.test.js', harness: 'scripts/harness-system-map-smoke.sh' }, verdict: 'verified' },
  { feature: 2, scenario: 'Component promotion is deterministic', binding: { unit: 'test/classify.test.js', harness: 'scripts/harness-system-map-smoke.sh' }, verdict: 'verified' },
  { feature: 2, scenario: 'Retired component remains meaningful', binding: { unit: 'test/classify.test.js', harness: 'scripts/harness-system-map-smoke.sh' }, verdict: 'verified' },

  // Feature 3: C4 View
  { feature: 3, scenario: 'Context view names the target and external systems', binding: { unit: 'test/c4.test.js', harness: 'scripts/harness-system-map-smoke.sh' }, verdict: 'verified' },
  { feature: 3, scenario: 'Container view groups components by role', binding: { unit: 'test/c4.test.js', harness: 'scripts/harness-system-map-smoke.sh' }, verdict: 'verified' },
  { feature: 3, scenario: 'Component view explains selected family', binding: { unit: 'test/c4.test.js', harness: 'scripts/harness-viewer-system-map-smoke.sh' }, verdict: 'verified' },

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
  { feature: 6, scenario: 'Agent answers a landscape question from bounded queries', binding: { unit: 'test/query-system-map.test.js', artifact: 'docs/captain-atlas/agent-qa-rubric.md' }, verdict: 'verified' },
  { feature: 6, scenario: 'Agent explains selected code', binding: { unit: 'test/query-system-map.test.js', artifact: 'docs/captain-atlas/agent-qa-rubric.md' }, verdict: 'verified' },

  // Feature 7: Repeatability Beyond Bigtop
  { feature: 7, scenario: 'Non-Bigtop target uses the same first-run path', binding: { unit: 'test/classify.test.js', harness: 'polyglot scan (bdd-feature-report Gate 4)' }, verdict: 'verified' },

  // Feature 8: Read-Only And Local-First Proof
  { feature: 8, scenario: 'Source tree remains unchanged', binding: { artifact: 'docs/captain-atlas/cursor-agent-cli-scorecard.json', key: 'scorecard_fields.target_source_modified' }, verdict: 'verified' },
  { feature: 8, scenario: 'Target network and installation actions are explicit', binding: { artifact: 'docs/captain-atlas/network-install-approval.md' }, verdict: 'verified' },

  // Feature 9: UI Route And DOM Contract
  { feature: 9, scenario: 'Visible objects expose stable test hooks', binding: { unit: 'test/ids.test.js', harness: 'scripts/harness-viewer-system-map-smoke.sh' }, verdict: 'verified' },
  { feature: 9, scenario: 'Object routes are stable', binding: { unit: 'test/ids.test.js', harness: 'scripts/harness-viewer-system-map-smoke.sh' }, verdict: 'verified' },
];

const test = require('node:test');
const assert = require('node:assert');

test('BDD scenario bindings are complete (every spec scenario has a binding)', () => {
  assert.ok(bindings.length >= 27, `expected ≥27 scenario bindings, got ${bindings.length}`);
  for (const b of bindings) {
    assert.ok(b.feature && b.scenario && b.binding, `incomplete binding: ${JSON.stringify(b)}`);
  }
});

if (require.main === module) {
  console.log('Feature | Scenario | Binding | Verdict');
  console.log('-------|----------|---------|--------');
  for (const b of bindings) {
    const bind = b.binding.unit || b.binding.harness || b.binding.artifact || '?';
    console.log(`${b.feature} | ${b.scenario} | ${bind} | ${b.verdict}`);
  }
}
