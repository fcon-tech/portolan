/**
 * Unit tests for the semantic component investigation domain (captain-atlas 17).
 *
 * Verifies the portable contract enforcement: source-ref resolution (incl. the
 * "URL-only is not resolvable" rule), the bidirectional overlap pair with >= 3
 * dimensions, min concepts/risks, the all-not_assessed rejection, and that
 * investigationForComponent returns null for non-sample ids.
 *
 * Domain-layer: pure functions, no DOM/IO.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');

const {
  resolveSourceRef, hasLocalMeaning, buildSemanticViewModel,
  investigationForComponent, overlapRelationsFor, ecosystemPlacementMap,
  validateShape, enforceEvidenceAnchors,
  MIN_INTERNAL_CONCEPTS, MIN_RISKS, MIN_OVERLAP_DIMENSIONS,
} = require('../../src/domain/semantic-investigation');

// ---------------------------------------------------------------------------
// A minimal valid fixture used by most tests. Two components with a
// bidirectional 3-dimension overlap + a third with a not_assessed model.
// ---------------------------------------------------------------------------
function baseFixture(over) {
  return Object.assign({
    sample: {
      selection_reason: 'why',
      components: ['component:a', 'component:b', 'component:c'],
    },
    capabilities: [{ id: 'capability:p', label: 'P' }, { id: 'capability:q', label: 'Q' }],
    regions: [{ id: 'capability:region-x', label: 'Region X', capabilities: ['capability:p'] }],
    sources: [
      { id: 'src-a', label: 'A docs', kind: 'official-doc', url: 'https://a', claim_scope: 'concepts for a', summary: 'docs a' },
      { id: 'note-a', label: 'Note A', kind: 'curated-note', note_path: 'notes/a.md', claim_scope: 'model a', summary: 'note a' },
    ],
    components: [
      fixtureComponent('component:a', {
        semantic_relations: [
          { type: 'overlaps_with', target_id: 'component:b', dimensions: ['capability:p', 'capability:q', 'capability:packaging'], explanation: 'x', source_boundary: 'curated-knowledge', source_ref: 'source:note-a' },
        ],
      }),
      fixtureComponent('component:b', {
        semantic_relations: [
          { type: 'overlaps_with', target_id: 'component:a', dimensions: ['capability:p', 'capability:q', 'capability:packaging'], explanation: 'x', source_boundary: 'curated-knowledge', source_ref: 'source:note-a' },
        ],
      }),
      fixtureComponent('component:c', { allNotAssessed: true }),
    ],
  }, over || {});
}

function fixtureComponent(id, opts) {
  opts = opts || {};
  // allNotAssessed means every CLAIM is tagged not_assessed (to exercise the
  // all-not-assessed rejection), but the component still satisfies the
  // unconditional min-risks gate with 2 not_assessed, non-generic risks. Only
  // the internal MODEL is allowed to be empty (with an explicit next producer).
  const purpose = opts.allNotAssessed
    ? { summary: 'c', source_boundary: 'not_assessed', source_ref: '' }
    : { summary: 'purpose ' + id, source_boundary: 'curated-knowledge', source_ref: 'source:src-a' };
  const concepts = [];
  if (!opts.allNotAssessed) {
    for (let i = 0; i < MIN_INTERNAL_CONCEPTS; i++) {
      concepts.push({ id: `concept:${id}-${i}`, label: `Concept ${i}`, explanation: 'explanation ' + i, source_boundary: 'curated-knowledge', source_ref: 'source:src-a' });
    }
  }
  const boundary = opts.allNotAssessed ? 'not_assessed' : 'curated-knowledge';
  const ref = opts.allNotAssessed ? '' : 'source:src-a';
  const risks = [
    { id: `risk:${id}-1`, label: 'Risk 1', explanation: 'a component-specific risk that is detailed', source_boundary: boundary, source_ref: ref },
    { id: `risk:${id}-2`, label: 'Risk 2', explanation: 'another specific operational peculiarity', source_boundary: opts.allNotAssessed ? 'not_assessed' : 'agent-hypothesis', source_ref: opts.allNotAssessed ? '' : `risk:${id}-2` },
  ];
  return {
    id,
    display_name: id,
    ecosystem_regions: ['capability:region-x'],
    purpose,
    capabilities: [{ id: 'capability:p', label: 'P', source_boundary: boundary, source_ref: ref }],
    internal_concepts: concepts,
    integration_surfaces: [{ kind: opts.allNotAssessed ? 'not_assessed' : 'package_recipe', label: 'recipe', source_boundary: opts.allNotAssessed ? 'not_assessed' : 'local-corpus', evidence_ref: opts.allNotAssessed ? '' : 'evidence:e1', explanation: 'recipe' }],
    semantic_relations: opts.semantic_relations || [],
    risks,
    evidence_boundary: { local_corpus: ['evidence:e1'], curated_knowledge: ['source:src-a'], agent_hypotheses: [], not_assessed: [] },
    next_expedition: opts.allNotAssessed ? [{ producer: 'model producer', action: 'assess the internal model', why: 'concepts are not_assessed', closes_gap: 'gap:c-model' }] : [],
  };
}

// ===========================================================================
// resolveSourceRef + hasLocalMeaning
// ===========================================================================
test('resolveSourceRef resolves a curated-note source card', () => {
  const si = { sources: [{ id: 'n', kind: 'curated-note', note_path: 'notes/n.md', claim_scope: 'scope', summary: 'sum' }] };
  const r = resolveSourceRef(si, 'source:n');
  assert.strictEqual(r.resolves, true);
  assert.strictEqual(r.sourceCard.id, 'n');
});

test('resolveSourceRef REJECTS a URL-only source card with no local meaning', () => {
  const si = { sources: [{ id: 'u', kind: 'official-doc', url: 'https://x' }] };
  const r = resolveSourceRef(si, 'source:u');
  assert.strictEqual(r.resolves, false);
  assert.match(r.reason, /no claim_scope\/summary/);
});

test('resolveSourceRef accepts an official-doc card that has claim_scope', () => {
  const si = { sources: [{ id: 'u', kind: 'official-doc', url: 'https://x', claim_scope: 'backs concept X' }] };
  assert.strictEqual(resolveSourceRef(si, 'source:u').resolves, true);
});

test('resolveSourceRef resolves local_corpus evidence refs', () => {
  const si = { evidenceBoundary: { local_corpus: ['evidence:e1'] }, sources: [] };
  assert.strictEqual(resolveSourceRef(si, 'evidence:e1').resolves, true);
  assert.strictEqual(resolveSourceRef(si, 'evidence:e2').resolves, false);
});

test('resolveSourceRef rejects empty / malformed refs', () => {
  assert.strictEqual(resolveSourceRef({ sources: [] }, '').resolves, false);
  assert.strictEqual(resolveSourceRef({ sources: [] }, 'garbage').resolves, false);
});

test('hasLocalMeaning is true for curated-note with note_path', () => {
  assert.strictEqual(hasLocalMeaning({ kind: 'curated-note', note_path: 'n.md' }), true);
  assert.strictEqual(hasLocalMeaning({ kind: 'official-doc', url: 'https://x' }), false);
  assert.strictEqual(hasLocalMeaning({ kind: 'official-doc', url: 'https://x', claim_scope: 'x' }), true);
});

// ===========================================================================
// Bidirectional overlap pair
// ===========================================================================
test('overlapRelationsFor reports a bidirectional pair with >= 3 dimensions', () => {
  const si = baseFixture();
  const fromA = overlapRelationsFor(si, 'component:a');
  assert.strictEqual(fromA.length, 1);
  assert.strictEqual(fromA[0].otherId, 'component:b');
  assert.strictEqual(fromA[0].bidirectional, true);
  assert.ok(fromA[0].dimensions.length >= MIN_OVERLAP_DIMENSIONS);
});

test('a one-directional overlap is NOT reported as bidirectional', () => {
  const si = baseFixture();
  // Remove B->A so the pair is only A->B.
  si.components[1].semantic_relations = [];
  const fromA = overlapRelationsFor(si, 'component:a');
  assert.strictEqual(fromA.length, 1);
  assert.strictEqual(fromA[0].bidirectional, false);
});

test('overlap pair dimensions are the union across overlaps_with + contrasts_with', () => {
  const si = baseFixture();
  si.components[0].semantic_relations.push({ type: 'contrasts_with', target_id: 'component:b', dimensions: ['capability:streaming'], explanation: 'c', source_boundary: 'curated-knowledge', source_ref: 'source:note-a' });
  const fromA = overlapRelationsFor(si, 'component:a');
  assert.ok(fromA[0].dimensions.includes('capability:streaming'));
});

// ===========================================================================
// investigationForComponent
// ===========================================================================
test('investigationForComponent returns the decorated model for a selected id', () => {
  const si = baseFixture();
  const inv = investigationForComponent(si, 'component:a');
  assert.ok(inv);
  assert.strictEqual(inv.componentId, 'component:a');
  assert.ok(inv.internalConcepts.length >= MIN_INTERNAL_CONCEPTS);
});

test('investigationForComponent returns null for a non-sample id', () => {
  const si = baseFixture();
  // component:zz is not in the components list.
  assert.strictEqual(investigationForComponent(si, 'component:zz'), null);
});

test('investigationForComponent returns null for a component present in the sidecar but NOT selected (deepseek M1)', () => {
  // A component that exists in si.components but is not in sample.components
  // must NOT render a full investigation — it gets a typed not-investigated panel.
  const si = baseFixture();
  const unselected = fixtureComponent('component:unselected', {});
  si.components.push(unselected);
  // sample.components stays ['component:a','component:b','component:c'].
  assert.strictEqual(investigationForComponent(si, 'component:unselected'), null);
  // a selected id still resolves.
  assert.ok(investigationForComponent(si, 'component:a'));
});

test('validateShape handles null and empty object without throwing', () => {
  assert.ok(validateShape(null).some(v => v.code === 'not-object'));
  // an empty object has no sample -> sample-reason + sample-size violations, no throw.
  const v = validateShape({});
  assert.ok(Array.isArray(v) && v.length > 0);
});

// ===========================================================================
// ecosystemPlacementMap
// ===========================================================================
test('ecosystemPlacementMap groups components by capability region', () => {
  const si = baseFixture();
  const map = ecosystemPlacementMap(si);
  assert.ok(map.regions.length >= 1);
  const region = map.regions.find(r => r.id === 'capability:region-x');
  assert.ok(region, 'expected region-x');
  assert.ok(region.components.length >= 3);
  assert.ok(map.overlapPairs.length >= 1);
});

test('ecosystemPlacementMap places only SELECTED components (not every sidecar component)', () => {
  // Add a 4th component that is NOT in the sample; it must not appear on the map.
  const si = baseFixture({
    components: [
      ...baseFixture().components,
      fixtureComponent('component:unselected', {}),
    ],
  });
  const selectedOnly = new Set(si.sample.components);
  const map = ecosystemPlacementMap(si, selectedOnly);
  const placed = new Set();
  for (const r of map.regions) for (const c of r.components) placed.add(c.id);
  assert.ok(!placed.has('component:unselected'), 'an unselected sidecar component must not be placed on the map');
  for (const id of selectedOnly) assert.ok(placed.has(id), `selected component ${id} should be placed`);
});

test('a local-corpus claim with an unresolvable evidence ref fails validation', () => {
  const si = baseFixture();
  // Point a concept's source_ref at an evidence id not in any boundary ledger.
  si.components[0].internal_concepts[0].source_boundary = 'local-corpus';
  si.components[0].internal_concepts[0].source_ref = 'evidence:does-not-exist';
  const codes = validateShape(si).map(v => v.code);
  assert.ok(codes.includes('source-unresolved'), 'an unresolvable local-corpus evidence ref must fail');
});

test('a local-corpus evidence ref resolves against per-component evidence_boundary', () => {
  // resolveSourceRef must read each component's evidence_boundary.local_corpus.
  const si = baseFixture();
  si.sources = si.sources || [];
  const r = resolveSourceRef(si, 'evidence:e1');
  assert.strictEqual(r.resolves, true, 'evidence:e1 is in a component boundary and must resolve');
});

test('validateShape rejects an unknown semantic relation type', () => {
  const si = baseFixture();
  si.components[0].semantic_relations.push({ type: 'made_up_relation', target_id: 'component:b', dimensions: ['capability:p'], explanation: 'x', source_boundary: 'curated-knowledge', source_ref: 'source:note-a' });
  const codes = validateShape(si).map(v => v.code);
  assert.ok(codes.includes('bad-relation-type'), 'an unknown relation type must fail');
});

// ===========================================================================
// validateShape (the contract gate)
// ===========================================================================
test('validateShape passes for the base fixture', () => {
  assert.deepStrictEqual(validateShape(baseFixture()), []);
});

test('validateShape fails when sample lacks a selection_reason', () => {
  const si = baseFixture({ sample: { components: ['component:a', 'component:b', 'component:c'] } });
  const codes = validateShape(si).map(v => v.code);
  assert.ok(codes.includes('sample-reason'));
});

test('validateShape fails when a component has fewer than MIN concepts and no not_assessed model', () => {
  const si = baseFixture();
  si.components[0].internal_concepts = []; // a is not allNotAssessed, so this is a violation
  const codes = validateShape(si).map(v => v.code);
  assert.ok(codes.includes('concepts-count'));
});

test('validateShape allows zero concepts only with an explicit not_assessed model + producer', () => {
  // component:c already demonstrates this (allNotAssessed: true with a model producer).
  const codes = validateShape(baseFixture()).map(v => v.code);
  assert.ok(!codes.includes('concepts-count'));
});

test('validateShape fails when a component has fewer than MIN risks', () => {
  const si = baseFixture();
  si.components[0].risks = [{ id: 'r', label: 'r', explanation: 'one specific risk', source_boundary: 'curated-knowledge', source_ref: 'source:src-a' }];
  const codes = validateShape(si).map(v => v.code);
  assert.ok(codes.includes('risks-count'));
});

test('validateShape fails on a generic risk ("inspect source")', () => {
  const si = baseFixture();
  si.components[0].risks = [
    { id: 'r1', label: 'r1', explanation: 'a detailed component risk', source_boundary: 'curated-knowledge', source_ref: 'source:src-a' },
    { id: 'r2', label: 'r2', explanation: 'inspect source', source_boundary: 'curated-knowledge', source_ref: 'source:src-a' },
  ];
  const codes = validateShape(si).map(v => v.code);
  assert.ok(codes.includes('generic-risk'));
});

test('validateShape fails when every component escapes via not_assessed', () => {
  const si = baseFixture({
    components: [
      fixtureComponent('component:a', { allNotAssessed: true }),
      fixtureComponent('component:b', { allNotAssessed: true }),
      fixtureComponent('component:c', { allNotAssessed: true }),
    ],
  });
  const codes = validateShape(si).map(v => v.code);
  assert.ok(codes.includes('all-not-assessed'));
});

test('validateShape fails when no bidirectional overlap pair exists', () => {
  const si = baseFixture();
  si.components[1].semantic_relations = []; // break B->A
  const codes = validateShape(si).map(v => v.code);
  assert.ok(codes.includes('overlap-pair'));
});

test('validateShape fails when a curated claim has no resolvable source card', () => {
  const si = baseFixture();
  si.components[0].purpose.source_ref = 'source:does-not-exist';
  const codes = validateShape(si).map(v => v.code);
  assert.ok(codes.includes('curated-unresolved'));
});

test('validateShape fails when an assessed claim has no source_ref at all', () => {
  const si = baseFixture();
  si.components[0].purpose.source_ref = '';
  si.components[0].purpose.source_boundary = 'curated-knowledge';
  const codes = validateShape(si).map(v => v.code);
  assert.ok(codes.some(c => c === 'source-ref' || c === 'curated-unresolved'));
});

test('validateShape fails when an overlap pair component is not in the sample', () => {
  const si = baseFixture();
  si.components.push(fixtureComponent('component:d', {
    semantic_relations: [
      { type: 'overlaps_with', target_id: 'component:a', dimensions: ['capability:p', 'capability:q', 'capability:packaging'], explanation: 'x', source_boundary: 'curated-knowledge', source_ref: 'source:note-a' },
    ],
  }));
  // Add reverse A->D so the pair is bidirectional, but D is not in the sample.
  si.components[0].semantic_relations.push({ type: 'overlaps_with', target_id: 'component:d', dimensions: ['capability:p', 'capability:q', 'capability:packaging'], explanation: 'x', source_boundary: 'curated-knowledge', source_ref: 'source:note-a' });
  const codes = validateShape(si).map(v => v.code);
  assert.ok(codes.includes('overlap-not-selected'));
});

// ===========================================================================
// The real Bigtop fixture must validate
// ===========================================================================
test('the committed Bigtop fixture validates (load + validateShape)', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const dir = path.join(__dirname, '..', 'fixtures', 'semantic-investigation');
  const si = JSON.parse(fs.readFileSync(path.join(dir, 'semantic-investigation.bigtop.json'), 'utf8'));
  si.sources = JSON.parse(fs.readFileSync(path.join(dir, 'sources.json'), 'utf8')).sources;
  const violations = validateShape(si);
  assert.deepStrictEqual(violations, [], `expected no violations, got: ${JSON.stringify(violations)}`);
});

// ===========================================================================
// Spec 19: command-receipt anchor + evidence anchor enforcement
// ===========================================================================

test('resolveSourceRef resolves a command-receipt anchor (spec 19)', () => {
  const si = {
    command_receipts: [
      { id: 'rc1', command: 'rg --json "pattern"', exit_code: 0, output_excerpt: '3 matches', timestamp: '2026-06-29T10:00:00Z' },
    ],
    sources: [],
  };
  const r = resolveSourceRef(si, 'receipt:rc1');
  assert.strictEqual(r.resolves, true);
  assert.strictEqual(r.sourceCard.kind, 'command-receipt');
  assert.strictEqual(r.sourceCard.receipt.command, 'rg --json "pattern"');
});

test('resolveSourceRef rejects an unknown command-receipt id (spec 19)', () => {
  const si = { command_receipts: [], sources: [] };
  const r = resolveSourceRef(si, 'receipt:missing');
  assert.strictEqual(r.resolves, false);
  assert.match(r.reason, /not in si.command_receipts/);
});

test('enforceEvidenceAnchors downgrades unanchored claims to not_assessed (spec 19)', () => {
  const si = {
    sources: [{ id: 'good', kind: 'official-doc', url: 'https://x', claim_scope: 'scope' }],
    command_receipts: [{ id: 'rc1', command: 'cmd', exit_code: 0, output_excerpt: 'ok', timestamp: '2026-01-01T00:00:00Z' }],
    components: [{
      id: 'component:x',
      purpose: { summary: 'x', source_boundary: 'curated-knowledge', source_ref: 'source:good' },
      capabilities: [
        { id: 'cap:ok', label: 'OK', source_boundary: 'curated-knowledge', source_ref: 'source:good' },
        { id: 'cap:bad', label: 'Bad', source_boundary: 'curated-knowledge', source_ref: 'source:nonexistent' },
      ],
      internal_concepts: [
        { id: 'concept:1', label: 'C1', explanation: 'explanation', source_boundary: 'local-corpus', source_ref: 'receipt:rc1' },
        { id: 'concept:2', label: 'C2', explanation: 'explanation', source_boundary: 'local-corpus', source_ref: 'evidence:nonexistent' },
      ],
      risks: [],
      integration_surfaces: [],
      semantic_relations: [],
      evidence_boundary: { local_corpus: [], curated_knowledge: [], agent_hypotheses: [], not_assessed: [] },
    }],
  };

  const { si: patched, downgraded } = enforceEvidenceAnchors(si);

  // The anchored claims keep their boundary.
  assert.strictEqual(patched.components[0].purpose.source_boundary, 'curated-knowledge');
  assert.strictEqual(patched.components[0].capabilities[0].source_boundary, 'curated-knowledge');
  assert.strictEqual(patched.components[0].internal_concepts[0].source_boundary, 'local-corpus');

  // The unanchored claims are downgraded.
  assert.strictEqual(patched.components[0].capabilities[1].source_boundary, 'not_assessed');
  assert.strictEqual(patched.components[0].internal_concepts[1].source_boundary, 'not_assessed');

  // Downgrade ledger records what was downgraded and why.
  assert.strictEqual(downgraded.length, 2);
  assert.ok(downgraded.some(d => d.claimId === 'cap:bad'));
  assert.ok(downgraded.some(d => d.claimId === 'concept:2'));
});

test('enforceEvidenceAnchors does not mutate the original (spec 19)', () => {
  const si = {
    sources: [],
    components: [{
      id: 'component:y',
      purpose: { summary: 'y', source_boundary: 'curated-knowledge', source_ref: 'source:missing' },
      capabilities: [],
      internal_concepts: [],
      risks: [],
      integration_surfaces: [],
      semantic_relations: [],
    }],
  };
  const original = JSON.parse(JSON.stringify(si));
  enforceEvidenceAnchors(si);
  assert.deepStrictEqual(si, original, 'original must not be mutated');
});

test('enforceEvidenceAnchors leaves not_assessed claims alone (spec 19)', () => {
  const si = {
    sources: [],
    components: [{
      id: 'component:z',
      purpose: { summary: 'z', source_boundary: 'not_assessed', source_ref: '' },
      capabilities: [],
      internal_concepts: [],
      risks: [],
      integration_surfaces: [],
      semantic_relations: [],
    }],
  };
  const { downgraded } = enforceEvidenceAnchors(si);
  assert.strictEqual(downgraded.length, 0);
});

test('enforceEvidenceAnchors handles empty/null input (spec 19)', () => {
  assert.deepStrictEqual(enforceEvidenceAnchors(null).downgraded, []);
  assert.deepStrictEqual(enforceEvidenceAnchors({}).downgraded, []);
  assert.deepStrictEqual(enforceEvidenceAnchors({ components: [] }).downgraded, []);
});
