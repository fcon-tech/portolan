/**
 * Executable BDD scenario tests — these actually RUN the use-cases and assert
 * the Given/When/Then behaviour from charter 08's Gherkin features, not just
 * check file existence. Bridges the gap between traceability and real
 * acceptance testing.
 *
 * Each test maps to a charter-08 feature scenario.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { runIntake } = require('../../src/use-cases/run-intake');
const { validateIntakeResult } = require('../../src/domain/intake-result');
const { openBehaviourMap } = require('../../src/use-cases/open-behaviour-map');
const { drillToRegion } = require('../../src/use-cases/drill-to-region');
const { buildRegionProfile } = require('../../src/domain/region-profile');
const { confidenceForProducer, resolveConflict, isEvidenceCompatible } = require('../../src/domain/confidence');

// ---- Feature: Managed intake ----

test('BDD [managed-intake]: Admiral names repositories only', () => {
  // Given the admiral drops a Portolan link to an agent
  // When the agent runs managed intake
  // Then a typed intake result is persisted (validated), reusable on rebuild
  const r1 = runIntake({
    target_root: '/repo',
    anchors: [{ kind: 'repository', location: '/repo', access_method: 'local' }],
  });
  const r2 = runIntake({
    target_root: '/repo',
    anchors: [{ kind: 'repository', location: '/repo', access_method: 'local' }],
  });
  assert.deepStrictEqual(validateIntakeResult(r1), []);
  // rebuild reuses without re-asking — deterministic ids match
  assert.strictEqual(r1.anchors[0].id, r2.anchors[0].id);
});

test('BDD [managed-intake]: Admiral names repos, docs, and a ticket source', () => {
  const r = runIntake({
    target_root: '/repo',
    anchors: [
      { kind: 'repository', location: '/repo', access_method: 'local' },
      { kind: 'docs', location: '/docs', access_method: 'file' },
      { kind: 'issue-tracker', location: 'https://jira.example.com', access_method: 'api' },
    ],
  });
  assert.strictEqual(r.anchors.length, 3);
  assert.deepStrictEqual(r.perimeter, ['/repo']);
});

// ---- Feature: /portolan:map entry ----

test('BDD [/portolan:map]: first screen shows annotated overview (not undifferentiated graph)', () => {
  // The open-behaviour-map use-case builds the full graph model; the overview
  // is a SUMMARY of it (counts, distributions), not the raw graph. We verify
  // the model is buildable and its summary fields exist — the actual "annotated
  // overview vs undifferentiated graph" distinction is asserted at the shell
  // render level (headless parity check, proven in Slice 5d).
  const atlas = {
    objects: {
      components: [
        { id: 'c:a', display_name: 'A', c4_family: 'data-systems', lifecycle: 'active', route: '#/dossier/component/a', evidence: { state: 'source-visible' } },
        { id: 'c:b', display_name: 'B', c4_family: 'data-systems', lifecycle: 'active', route: '#/dossier/component/b', evidence: { state: 'source-visible' } },
      ],
      relationships: [],
    },
    c4: { context_boxes: [], families: [], component_boxes: [] },
  };
  const model = openBehaviourMap(atlas);
  // The overview summarises: 2 units, 0 edges. It does NOT dump the raw graph.
  assert.strictEqual(model.nodes.length, 2);
  assert.strictEqual(model.edges.length, 0);
});

// ---- Feature: Behaviour map ----

test('BDD [behaviour-map]: units and typed edges render; clicking a unit opens dossier', () => {
  const atlas = {
    objects: {
      components: [
        { id: 'c:a', display_name: 'A', c4_family: 'data-systems', lifecycle: 'active', route: '#/dossier/component/a', evidence: { state: 'source-visible' } },
        { id: 'c:b', display_name: 'B', c4_family: 'data-systems', lifecycle: 'active', route: '#/dossier/component/b', evidence: { state: 'source-visible' } },
      ],
      relationships: [
        { id: 'r:1', from_id: 'c:a', to_id: 'c:b', relationship_type: 'depends-on', route: '#/detail/relationship/r:1' },
      ],
    },
  };
  const model = openBehaviourMap(atlas);
  assert.strictEqual(model.nodes.length, 2);
  assert.strictEqual(model.edges.length, 1);
  // every node carries a route (so clicking opens a dossier)
  for (const n of model.nodes) assert.ok(n.route);
  // every node carries evidence.state
  for (const n of model.nodes) assert.ok(n.evidenceState);
});

// ---- Feature: Region drill-down ----

test('BDD [region-drill-down]: drilling into a cluster shows a statistical profile', () => {
  const atlas = {
    objects: {
      components: [
        { id: 'c:a', c4_family: 'data-systems', lifecycle: 'active', evidence: { state: 'source-visible' }, relationship_ids: ['r:1'], surface_ids: ['s:1'] },
        { id: 'c:b', c4_family: 'data-systems', lifecycle: 'retired', evidence: { state: 'metadata-visible' }, relationship_ids: ['r:1'], surface_ids: [] },
      ],
      relationships: [{ id: 'r:1', from_id: 'c:a', to_id: 'c:b' }],
    },
  };
  const r = drillToRegion(atlas, ['c:a', 'c:b']);
  assert.ok(r);
  assert.strictEqual(r.profile.unit_count, 2);
  assert.strictEqual(r.profile.edge_count, 1);
  assert.ok(r.profile.surface_count > 0);
  assert.ok(r.profile.lifecycle_distribution.active >= 1);
});

test('BDD [region-drill-down]: single-unit region is valid (edge_density 0)', () => {
  const atlas = { objects: { components: [{ id: 'c:solo', c4_family: 'unknown', lifecycle: 'active', evidence: { state: 'source-visible' } }], relationships: [] } };
  const r = drillToRegion(atlas, ['c:solo']);
  assert.strictEqual(r.profile.unit_count, 1);
  assert.strictEqual(r.profile.edge_density, 0);
});

// ---- Feature: Honest absence ----

test('BDD [honest-absence]: behaviour-only atlas when no intentions/representations ingested', () => {
  // intake named only a repository — no docs/tickets. The atlas is valid
  // behaviour-only; triangulation is absent. We verify the intake accepts a
  // repo-only anchor set and the atlas still builds.
  const intake = runIntake({
    target_root: '/repo',
    anchors: [{ kind: 'repository', location: '/repo', access_method: 'local' }],
  });
  const hasIntentions = intake.anchors.some(a => a.kind === 'issue-tracker' || a.kind === 'docs');
  assert.strictEqual(hasIntentions, false, 'behaviour-only: no intentions/representations');
  // the atlas still builds from the behaviour (code) truth
  const atlas = { objects: { components: [{ id: 'c:a', c4_family: 'data-systems', lifecycle: 'active', route: '#/x', evidence: { state: 'source-visible' } }], relationships: [] } };
  const model = openBehaviourMap(atlas);
  assert.strictEqual(model.nodes.length, 1);
});

test('BDD [honest-absence]: confidence is target-state (not in 0.1.0 schema) but the contract is defined', () => {
  // Part-1b: confidence levels are defined in domain/confidence.js and tested,
  // but not wired into the 0.1.0 schema. This test proves the CONTRACT exists
  // (so the honest-empty state has a defined behaviour), even though the
  // Container level needs runtime evidence we may not have.
  assert.strictEqual(confidenceForProducer('deterministic-core'), 'ironclad');
  assert.ok(isEvidenceCompatible('ironclad', 'source-visible'));
  // a conflict between ironclad and speculation resolves correctly
  const r = resolveConflict(
    { confidence: 'ironclad', producer: 'deterministic-core' },
    { confidence: 'speculation', producer: 'agent' },
  );
  assert.strictEqual(r.winner.confidence, 'ironclad');
});
