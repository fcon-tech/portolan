/**
 * Unit tests for the semantic-investigation producer (spec 18).
 *
 * Verifies that the producer generates SI pages from corpus data, that agent
 * claims are bounded and labelled, and that deterministic evidence is not
 * overridden.
 *
 * Domain-layer: pure functions, no DOM/IO.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { generateSemanticInvestigation } = require('../../src/domain/semantic-investigation-producer');

function baseSystemMap() {
  return {
    target: { id: 'test-target', display_name: 'Test Target' },
    objects: {
      components: [
        { id: 'component:alpha', display_name: 'Alpha', c4_family: 'library', type: 'library' },
        { id: 'component:beta', display_name: 'Beta', c4_family: 'library', type: 'library' },
        { id: 'component:gamma', display_name: 'Gamma', c4_family: 'application', type: 'application' },
      ],
      repositories: [
        { id: 'component:alpha', display_name: 'Alpha' },
        { id: 'component:beta', display_name: 'Beta' },
        { id: 'component:gamma', display_name: 'Gamma' },
      ],
      relationships: [
        { source: 'component:alpha', target: 'component:beta', type: 'depends-on' },
        { source: 'component:gamma', target: 'component:alpha', type: 'depends-on' },
      ],
      findings: [
        { id: 'finding-1', kind: 'overlapping-capabilities', summary: 'Alpha and Beta overlap', component_ids: ['component:alpha', 'component:beta'], severity: 'minor', evidence_state: 'metadata-visible' },
        { id: 'finding-2', kind: 'duplication', summary: 'Dup in Alpha', component_ids: ['component:alpha'], severity: 'major', evidence_state: 'source-visible' },
      ],
      surfaces: [],
      unknowns: [],
    },
  };
}

test('generateSemanticInvestigation produces pages from corpus (spec 18)', () => {
  const si = generateSemanticInvestigation(baseSystemMap());
  assert.ok(si._generated, 'should mark as generated');
  assert.ok(si.components.length >= 3, 'should have all components');
  assert.ok(si.sample.components.length >= 3, 'should select at least 3 sample components');
  assert.ok(si.capabilities.length > 0, 'should infer capabilities');
  assert.ok(si.regions.length > 0, 'should infer regions');
});

test('generated pages are corpus-sourced, not fixture-backed (spec 18)', () => {
  const si = generateSemanticInvestigation(baseSystemMap());
  for (const comp of si.components) {
    assert.strictEqual(comp.purpose.source_boundary, 'local-corpus',
      `${comp.id} purpose should be local-corpus`);
  }
});

test('agent claims are bounded and labelled (spec 18)', () => {
  const agentClaims = {
    components: [{
      component_id: 'component:alpha',
      purpose: 'Alpha processes data streams.',
      risks: [
        { label: 'Agent Risk 1', explanation: 'A risk from the agent' },
        { label: 'Agent Risk 2', explanation: 'Another risk' },
        { label: 'Agent Risk 3', explanation: 'Third risk' },
        { label: 'Agent Risk 4', explanation: 'This should be truncated (bounded)' },
      ],
    }],
  };
  const si = generateSemanticInvestigation(baseSystemMap(), { agentClaims });
  const alpha = si.components.find(c => c.id === 'component:alpha');
  // Agent purpose is appended with a visible [Agent:] label.
  assert.ok(alpha.purpose.summary.includes('[Agent:'), 'agent purpose should be labelled');
  // Agent risks are bounded to 3.
  const agentRisks = alpha.risks.filter(r => r.id.startsWith('risk:agent-'));
  assert.strictEqual(agentRisks.length, 3, 'agent risks should be bounded to 3');
  for (const r of agentRisks) {
    assert.strictEqual(r.source_boundary, 'agent-hypothesis',
      `agent risk ${r.id} should preserve agent-hypothesis boundary`);
  }
});

test('agent claims do not override deterministic evidence boundary (spec 18)', () => {
  const agentClaims = {
    components: [{
      component_id: 'component:alpha',
      purpose: 'Agent says this.',
    }],
  };
  const si = generateSemanticInvestigation(baseSystemMap(), { agentClaims });
  const alpha = si.components.find(c => c.id === 'component:alpha');
  // The purpose should still be local-corpus (the original boundary), not agent-hypothesis.
  assert.strictEqual(alpha.purpose.source_boundary, 'local-corpus');
});

test('overlap findings feed semantic relations (spec 18 composes spec 21)', () => {
  const sm = baseSystemMap();
  const si = generateSemanticInvestigation(sm);
  const alpha = si.components.find(c => c.id === 'component:alpha');
  const overlapRels = alpha.semantic_relations.filter(r => r.type === 'overlaps_with');
  assert.ok(overlapRels.length > 0, 'alpha should have an overlaps_with relation from the finding');
});

test('internal model is honestly not_assessed without symbol data (spec 18)', () => {
  const si = generateSemanticInvestigation(baseSystemMap());
  const comp = si.components[0];
  // Without symbol-level data, the internal model should be empty + have a next_expedition.
  assert.strictEqual(comp.internal_concepts.length, 0);
  assert.ok(comp.next_expedition.some(n => /internal model|concepts/i.test(n.why || '')));
});

test('empty system-map yields an honest empty investigation (spec 18)', () => {
  const si = generateSemanticInvestigation(null);
  assert.ok(si._generated);
  assert.strictEqual(si.components.length, 0);
  assert.strictEqual(si.sample.components.length, 0);
  assert.ok(si._warning);
});

test('generated investigation passes enforceEvidenceAnchors (spec 18 + 19)', () => {
  const si = generateSemanticInvestigation(baseSystemMap());
  // After enforceEvidenceAnchors runs inside the producer, all claims should
  // have valid boundaries (local-corpus with empty ref becomes not_assessed
  // or stays local-corpus if the resolution passes).
  for (const comp of si.components) {
    const boundary = comp.purpose.source_boundary;
    assert.ok(['local-corpus', 'not_assessed'].includes(boundary),
      `${comp.id} purpose boundary should be local-corpus or not_assessed`);
  }
});
