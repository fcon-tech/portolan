/**
 * Unit tests for the three-axis evidence-usability report (captain-atlas 16).
 *
 * Verifies:
 *   - artifact validation is derived from receipt machine_status and never
 *     implies evidence depth;
 *   - evidence usability classifies honestly on BOTH enriched rows
 *     (anchor_status present) and raw bundle rows (line ranges + quality
 *     note) — a 0/0 line range is never 'precise';
 *   - runtime assessment never treats source visibility as runtime proof;
 *   - per-route breakdown is consistent with the global verdict.
 *
 * Domain-layer: pure functions, no DOM/IO.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');

const {
  evidenceUsabilityReport, classifyEvidenceUsability, classifyRuntimeAxis,
  artifactValidationAxis,
} = require('../../src/domain/atlas-evidence-usability');

function stage(over) {
  return Object.assign({
    source_evidence_state: 'source-visible', runtime_assessment: 'not_assessed',
    line_start: 0, line_end: 0, route_quality_note: '', source_anchor: '',
  }, over || {});
}

test('artifact axis mirrors receipt machine_status and normalizes unknown values', () => {
  assert.strictEqual(artifactValidationAxis('verified'), 'verified');
  assert.strictEqual(artifactValidationAxis('failed'), 'failed');
  assert.strictEqual(artifactValidationAxis('blocked'), 'blocked');
  assert.strictEqual(artifactValidationAxis('not_assessed'), 'not_assessed');
  assert.strictEqual(artifactValidationAxis('something-weird'), 'not_assessed');
  assert.strictEqual(artifactValidationAxis(undefined), 'not_assessed');
});

test('evidence usability: precise enriched anchors -> anchored', () => {
  const stages = [
    stage({ anchor_status: 'precise', source_evidence_state: 'source-visible' }),
    stage({ anchor_status: 'precise', source_evidence_state: 'source-visible' }),
  ];
  assert.strictEqual(classifyEvidenceUsability(stages), 'anchored');
});

test('evidence usability: mix of precise and missing -> partial', () => {
  const stages = [
    stage({ anchor_status: 'precise' }),
    stage({ anchor_status: 'missing', line_start: 0, line_end: 0 }),
  ];
  assert.strictEqual(classifyEvidenceUsability(stages), 'partial');
});

test('evidence usability: visible but no precise anchors -> weak', () => {
  const stages = [
    stage({ anchor_status: 'ambiguous', source_anchor: 'foo', route_quality_note: 'ambiguous anchor(s): foo' }),
    stage({ anchor_status: 'missing', route_quality_note: 'anchor not found: bar' }),
  ];
  assert.strictEqual(classifyEvidenceUsability(stages), 'weak');
});

test('evidence usability: no visible evidence -> none', () => {
  const stages = [
    stage({ source_evidence_state: 'not_assessed' }),
    stage({ source_evidence_state: 'blocked' }),
  ];
  assert.strictEqual(classifyEvidenceUsability(stages), 'none');
});

test('evidence usability works on RAW bundle rows (no anchor_status) via line ranges', () => {
  // A raw bundle row has no export-time anchor_status. Classification must fall
  // back to line ranges + route_quality_note and never fabricate precision.
  const rawPrecise = stage({ line_start: 10, line_end: 14 }); // no anchor_status
  const rawAmbiguous = stage({ line_start: 0, line_end: 0, route_quality_note: 'ambiguous anchor(s): x' });
  const rawUnresolved = stage({ line_start: 0, line_end: 0, route_quality_note: '' });
  assert.strictEqual(classifyEvidenceUsability([rawPrecise, rawAmbiguous]), 'partial');
  assert.strictEqual(classifyEvidenceUsability([rawAmbiguous, rawUnresolved]), 'weak');
  assert.strictEqual(classifyEvidenceUsability([rawPrecise, rawPrecise]), 'anchored');
});

test('a 0/0 line range is NEVER classified precise, even with source_excerpt present', () => {
  // Defensive: if a row somehow carries a snippet but no real line range, the
  // classifier must still say weak/ambiguous, never precise.
  const bad = stage({ line_start: 0, line_end: 0, source_excerpt: 'fake snippet', source_anchor: '' });
  assert.strictEqual(classifyEvidenceUsability([bad]), 'weak');
});

test('runtime axis: no verified runtimes -> runtime_not_assessed', () => {
  const stages = [stage({ runtime_assessment: 'not_assessed' }), stage({ runtime_assessment: 'blocked' })];
  assert.strictEqual(classifyRuntimeAxis(stages), 'runtime_not_assessed');
});

test('runtime axis: some verified -> runtime_partial', () => {
  const stages = [stage({ runtime_assessment: 'verified' }), stage({ runtime_assessment: 'not_assessed' })];
  assert.strictEqual(classifyRuntimeAxis(stages), 'runtime_partial');
});

test('runtime axis: all verified -> runtime_verified', () => {
  const stages = [stage({ runtime_assessment: 'verified' }), stage({ runtime_assessment: 'verified' })];
  assert.strictEqual(classifyRuntimeAxis(stages), 'runtime_verified');
});

test('full report separates all three axes and never collapses them', () => {
  const navAtlas = {
    navigationIndex: [
      stage({ route_id: 'route:a', anchor_status: 'precise', runtime_assessment: 'not_assessed' }),
      stage({ route_id: 'route:a', anchor_status: 'missing', runtime_assessment: 'blocked' }),
    ],
    receiptValidation: { machine_status: 'verified' },
  };
  const r = evidenceUsabilityReport(navAtlas);
  assert.strictEqual(r.artifactValidation, 'verified');
  assert.strictEqual(r.evidenceUsability, 'partial'); // 1 precise + 1 missing
  assert.strictEqual(r.runtimeAssessment, 'runtime_not_assessed');
  // copy present for each axis
  assert.ok(r.copy.artifactValidation.length > 10);
  assert.ok(r.copy.evidenceUsability.length > 10);
  assert.ok(r.copy.runtimeAssessment.length > 10);
  // per-route breakdown
  assert.strictEqual(r.perRoute.length, 1);
  assert.strictEqual(r.perRoute[0].routeId, 'route:a');
  assert.strictEqual(r.stageCounts.total, 2);
  assert.strictEqual(r.stageCounts.preciseAnchors, 1);
});

test('artifact_validated is never presented as evidence-rich: weak evidence + verified artifact is reported honestly', () => {
  // This is the doc-16 hard rule: machine_status verified does not mean the
  // atlas is evidence-rich. The report keeps them separate.
  const navAtlas = {
    navigationIndex: [
      stage({ route_id: 'r', anchor_status: 'ambiguous', source_anchor: 'x', route_quality_note: 'ambiguous anchor(s): x' }),
    ],
    receiptValidation: { machine_status: 'verified' },
  };
  const r = evidenceUsabilityReport(navAtlas);
  assert.strictEqual(r.artifactValidation, 'verified');
  assert.strictEqual(r.evidenceUsability, 'weak');
  assert.strictEqual(r.stageCounts.preciseAnchors, 0);
});
