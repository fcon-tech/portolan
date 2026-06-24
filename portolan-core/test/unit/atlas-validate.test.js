/**
 * Unit tests for the semantic atlas validator.
 * Covers the invariants that JSON Schema cannot express.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { validateSystemMap } = require('../../src/domain/atlas-validate');

function baseMap() {
  return {
    schema_version: '0.1.0',
    generated_by: 'test',
    target: { id: 'target:root', display_name: 'root', root: '/r', approved_output_area: '.portolan', approved_instruction_files: ['AGENTS.md'] },
    objects: { components: [], repositories: [], surfaces: [], relationships: [], findings: [], unknowns: [] },
    c4: { context_boxes: [], families: [], component_boxes: [] },
  };
}

test('a clean minimal map validates with zero errors', () => {
  const { errors } = validateSystemMap(baseMap());
  assert.deepStrictEqual(errors, []);
});

test('duplicate id across kinds fails', () => {
  const m = baseMap();
  m.objects.components.push({ id: 'dup', display_name: 'c', type: 'application', role: 'x', lifecycle: 'active', repository_ids: [], surface_ids: [], relationship_ids: [], finding_ids: [], unknown_ids: [], c4_family: 'data-systems', promotion_signals: [{ signal_type: 'repository-metadata', source: 's', producer: 'p', independence_group: 'g' }], created_by_producer_family: 'p', why_present: 'w', next_actions: [], evidence: { state: 'source-visible', source: 's', producer: 'p' }, route: '#/dossier/component/dup' });
  m.objects.repositories.push({ id: 'dup', display_name: 'r', source_visibility_state: 'source-visible', languages: [], file_count: 0, component_ids: [], producer_coverage: {}, top_finding_ids: [], gap_ids: [], created_by_producer_family: 'p', why_present: 'w', evidence: { state: 'source-visible', source: 's', producer: 'p' }, route: '#/dossier/repository/dup' });
  const { errors } = validateSystemMap(m);
  assert.ok(errors.some((e) => /duplicate id across kinds/i.test(e)), `expected duplicate-id error, got: ${JSON.stringify(errors)}`);
});

test('dangling relationship endpoint fails', () => {
  const m = baseMap();
  m.objects.relationships.push({ id: 'rel:1', relationship_type: 'depends-on', from_id: 'ghost-a', to_id: 'ghost-b', created_by_producer_family: 'p', why_present: 'w', evidence: { state: 'metadata-visible', source: 's', producer: 'p' }, summary: 's', route: '#/detail/relationship/rel:1' });
  const { errors } = validateSystemMap(m);
  assert.ok(errors.some((e) => /from_id does not resolve/i.test(e)), `expected unresolved endpoint, got: ${JSON.stringify(errors)}`);
});

test('unresolved surface owner fails', () => {
  const m = baseMap();
  m.objects.surfaces.push({ id: 'surf:1', surface_type: 'docs', label: 'd', owner_id: 'no-such-owner', state: 'available', evidence: { state: 'metadata-visible', source: 's', producer: 'p' }, created_by_producer_family: 'p', why_present: 'w', why_it_matters: 'm', route: '#/dossier/surface/surf:1' });
  const { errors } = validateSystemMap(m);
  assert.ok(errors.some((e) => /owner_id does not resolve/i.test(e)), `expected unresolved owner, got: ${JSON.stringify(errors)}`);
});

test('promoted component without a promotion signal fails', () => {
  const m = baseMap();
  m.objects.components.push({ id: 'c:nosig', display_name: 'c', type: 'application', role: 'x', lifecycle: 'active', repository_ids: [], surface_ids: [], relationship_ids: [], finding_ids: [], unknown_ids: [], c4_family: 'data-systems', promotion_signals: [], created_by_producer_family: 'p', why_present: 'w', next_actions: [], evidence: { state: 'source-visible', source: 's', producer: 'p' }, route: '#/dossier/component/c:nosig' });
  const { errors } = validateSystemMap(m);
  assert.ok(errors.some((e) => /no promotion signal/i.test(e)), `expected no-signal error, got: ${JSON.stringify(errors)}`);
});

test('surface masquerading as a default-map component fails', () => {
  const m = baseMap();
  m.objects.components.push({ id: 'component:mailing-list-thing', display_name: 'ml', type: 'application', role: 'x', lifecycle: 'active', repository_ids: [], surface_ids: [], relationship_ids: [], finding_ids: [], unknown_ids: [], c4_family: 'coordination-community', promotion_signals: [{ signal_type: 'repository-metadata', source: 's', producer: 'p', independence_group: 'g' }], created_by_producer_family: 'p', why_present: 'w', next_actions: [], evidence: { state: 'source-visible', source: 's', producer: 'p' }, route: '#/dossier/component/mailing-list-thing' });
  const { errors } = validateSystemMap(m);
  assert.ok(errors.some((e) => /surface.*not a meaningful component/i.test(e)), `expected surface-leak error, got: ${JSON.stringify(errors)}`);
});
