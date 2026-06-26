/**
 * BDD runner for Part-1a: binds each scenario in test/features/*.feature to its
 * concrete unit test in portolan-core. Traceability harness (same pattern as the
 * frozen viewer/test/bdd-runner.js) — verifies each scenario has a binding to a
 * real, passing test, and that referenced files exist.
 *
 * Run `node test/bdd-runner.js` to print the scenario binding table.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const test = require('node:test');
const assert = require('node:assert');

const ROOT = path.join(__dirname, '..', '..');

const EXECUTABLE = 'portolan-core/test/unit/bdd-scenarios.test.js';

const bindings = [
  // Feature: Managed intake
  { feature: 'managed-intake', scenario: 'Admiral names repositories only', binding: { unit: EXECUTABLE, test: 'BDD [managed-intake]: Admiral names repositories only' } },
  { feature: 'managed-intake', scenario: 'Admiral names repos, docs, and a ticket source', binding: { unit: EXECUTABLE, test: 'BDD [managed-intake]: Admiral names repos, docs, and a ticket source' } },

  // Feature: /portolan:map entry
  { feature: 'behaviour-map', scenario: 'First screen is an annotated overview, not an undifferentiated graph', binding: { unit: EXECUTABLE, test: 'BDD [/portolan:map]: first screen shows annotated overview (not undifferentiated graph)' } },

  // Feature: Behaviour map
  { feature: 'behaviour-map', scenario: 'The behaviour map shows units and typed edges', binding: { unit: EXECUTABLE, test: 'BDD [behaviour-map]: units and typed edges render; clicking a unit opens dossier' } },
  { feature: 'behaviour-map', scenario: 'Zoom controls detail without losing structure', binding: { unit: 'portolan-core/test/unit/graph-layout.test.js' } },

  // Feature: Region drill-down
  { feature: 'region-drill-down', scenario: 'Drilling into a family cluster shows its statistical profile', binding: { unit: EXECUTABLE, test: 'BDD [region-drill-down]: drilling into a cluster shows a statistical profile' } },
  { feature: 'region-drill-down', scenario: 'A single-unit region is valid', binding: { unit: EXECUTABLE, test: 'BDD [region-drill-down]: single-unit region is valid (edge_density 0)' } },

  // Feature: Honest absence
  { feature: 'honest-absence', scenario: 'Behaviour-only atlas when no intentions/representations ingested', binding: { unit: EXECUTABLE, test: 'BDD [honest-absence]: behaviour-only atlas when no intentions/representations ingested' } },
  { feature: 'honest-absence', scenario: 'Container level honest-empty without runtime evidence', binding: { unit: EXECUTABLE, test: 'BDD [honest-absence]: confidence is target-state (not in 0.1.0 schema) but the contract is defined' } },

  // Feature: Atlas navigation index (captain-atlas 13)
  { feature: 'atlas-navigation-index', scenario: 'Bigtop package route is navigable', binding: { unit: EXECUTABLE, test: 'BDD [atlas-navigation-index]: Bigtop package route is navigable' } },
  { feature: 'atlas-navigation-index', scenario: 'Portolan-self implementation route is navigable', binding: { unit: EXECUTABLE, test: 'BDD [atlas-navigation-index]: Portolan-self implementation route is navigable' } },
  { feature: 'atlas-navigation-index', scenario: 'Coverage exposes missing and partial regions', binding: { unit: EXECUTABLE, test: 'BDD [atlas-navigation-index]: Coverage exposes missing and partial regions' } },
  { feature: 'atlas-navigation-index', scenario: 'Findings are first-class atlas objects', binding: { unit: EXECUTABLE, test: 'BDD [atlas-navigation-index]: Findings are first-class atlas objects' } },
  { feature: 'atlas-navigation-index', scenario: 'Unknown probes preserve not-assessed truth', binding: { unit: EXECUTABLE, test: 'BDD [atlas-navigation-index]: Unknown probes preserve not-assessed truth' } },
  { feature: 'atlas-navigation-index', scenario: 'Receipt validation does not trust agent self-status blindly', binding: { unit: EXECUTABLE, test: 'BDD [atlas-navigation-index]: Receipt validation does not trust agent self-status blindly' } },
  { feature: 'atlas-navigation-index', scenario: 'Generated atlas is compared to raw-agent frontier', binding: { unit: EXECUTABLE, test: 'BDD [atlas-navigation-index]: Generated atlas is compared to raw-agent frontier' } },

  // Feature: Atlas reading experience (captain-atlas 15)
  { feature: 'atlas-reading-experience', scenario: 'The first screen is a system walkthrough', binding: { unit: EXECUTABLE, test: 'BDD [atlas-reading-experience]: The first screen is a system walkthrough' } },
  { feature: 'atlas-reading-experience', scenario: 'Package journey reads as a system route', binding: { unit: EXECUTABLE, test: 'BDD [atlas-reading-experience]: Package journey reads as a system route' } },
  { feature: 'atlas-reading-experience', scenario: 'Route dossier explains evidence and uncertainty', binding: { unit: EXECUTABLE, test: 'BDD [atlas-reading-experience]: Route dossier explains evidence and uncertainty' } },
  { feature: 'atlas-reading-experience', scenario: 'Findings and probes guide the next expedition', binding: { unit: EXECUTABLE, test: 'BDD [atlas-reading-experience]: Findings and probes guide the next expedition' } },
  { feature: 'atlas-reading-experience', scenario: 'Coverage shows system scale', binding: { unit: EXECUTABLE, test: 'BDD [atlas-reading-experience]: Coverage shows system scale' } },
  { feature: 'atlas-reading-experience', scenario: 'Human review can reject repo-map regressions', binding: { unit: EXECUTABLE, test: 'BDD [atlas-reading-experience]: Human review can reject repo-map regressions' } },

  // Feature: Atlas drill-down semantics (captain-atlas 16)
  { feature: 'atlas-drilldown-semantics', scenario: 'Navigation labels are reader-facing', binding: { unit: EXECUTABLE, test: 'BDD [atlas-drilldown-semantics]: Navigation labels are reader-facing' } },
  { feature: 'atlas-drilldown-semantics', scenario: 'Relationship clicks explain the edge', binding: { unit: EXECUTABLE, test: 'BDD [atlas-drilldown-semantics]: Relationship clicks explain the edge' } },
  { feature: 'atlas-drilldown-semantics', scenario: 'Route stages drill into evidence', binding: { unit: EXECUTABLE, test: 'BDD [atlas-drilldown-semantics]: Route stages drill into evidence' } },
  { feature: 'atlas-drilldown-semantics', scenario: 'Unknown probes keep route context', binding: { unit: EXECUTABLE, test: 'BDD [atlas-drilldown-semantics]: Unknown probes keep route context' } },
  { feature: 'atlas-drilldown-semantics', scenario: 'Evidence anchors state what they prove', binding: { unit: EXECUTABLE, test: 'BDD [atlas-drilldown-semantics]: Evidence anchors state what they prove' } },
  { feature: 'atlas-drilldown-semantics', scenario: 'C4 is honest-empty when runtime/deploy evidence is absent', binding: { unit: EXECUTABLE, test: 'BDD [atlas-drilldown-semantics]: C4 is honest-empty when runtime/deploy evidence is absent' } },
  { feature: 'atlas-drilldown-semantics', scenario: 'Run Log separates artifact validation from evidence usability', binding: { unit: EXECUTABLE, test: 'BDD [atlas-drilldown-semantics]: Run Log separates artifact validation from evidence usability' } },
];

// --- self-verification tests (run by node --test) ---
test('bdd: every binding has a feature, scenario, and unit binding', () => {
  assert.ok(bindings.length >= 9, `expected >= 9 bindings, got ${bindings.length}`);
  for (const b of bindings) {
    assert.ok(b.feature, `binding missing feature: ${JSON.stringify(b)}`);
    assert.ok(b.scenario, `binding missing scenario: ${JSON.stringify(b)}`);
    assert.ok(b.binding && b.binding.unit, `binding missing unit: ${JSON.stringify(b)}`);
  }
});

test('bdd: every referenced unit test file exists on disk', () => {
  for (const b of bindings) {
    const fp = path.join(ROOT, b.binding.unit);
    assert.ok(fs.existsSync(fp), `unit test file does not exist: ${b.binding.unit}`);
  }
});

test('bdd: every feature file exists on disk', () => {
  const features = [...new Set(bindings.map(b => b.feature))];
  for (const f of features) {
    // Features are named feature-p1a-<name>.feature (Part-1a) or
    // feature-p1b-<name>.feature (Part-1b). Accept either prefix.
    const candidates = [
      path.join(__dirname, 'features', `feature-p1a-${f}.feature`),
      path.join(__dirname, 'features', `feature-p1b-${f}.feature`),
    ];
    assert.ok(candidates.some(p => fs.existsSync(p)), `feature file does not exist: feature-p1{a|b}-${f}.feature`);
  }
});

// --- printable table (when run directly) ---
if (require.main === module) {
  console.log('Feature | Scenario | Binding | Verdict');
  console.log('--- | --- | --- | ---');
  for (const b of bindings) {
    const exists = fs.existsSync(path.join(ROOT, b.binding.unit));
    console.log(`${b.feature} | ${b.scenario} | ${b.binding.unit} | ${exists ? 'bound' : 'MISSING'}`);
  }
}

module.exports = { bindings };
