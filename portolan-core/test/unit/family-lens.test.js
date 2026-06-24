/**
 * Unit tests for family-lens assignment determinism + priority order.
 * Covers the family grouping lens (legacy-required) at the data level.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { assignC4Family, C4_FAMILY_RULES } = require('../../src/domain/family-lens');

const VALID_FAMILIES = [
  'data-systems', 'compute-processing', 'platform-governance',
  'packaging-runtime', 'coordination-community', 'integration-services', 'unknown',
];

test('family lens: every rule family is a valid schema enum', () => {
  for (const rule of C4_FAMILY_RULES) {
    assert.ok(VALID_FAMILIES.includes(rule.family), `rule family "${rule.family}" not in schema enum`);
  }
});

test('family lens: storage/database role -> data-systems', () => {
  assert.strictEqual(assignC4Family({ role: 'database', kind: 'repository' }), 'data-systems');
  assert.strictEqual(assignC4Family({ role: 'distributed-nosql-store', kind: 'repository' }), 'data-systems');
});

test('family lens: batch/stream role -> compute-processing', () => {
  assert.strictEqual(assignC4Family({ role: 'batch-processing', kind: 'repository' }), 'compute-processing');
  assert.strictEqual(assignC4Family({ role: 'workflow-orchestration', kind: 'repository' }), 'compute-processing');
});

test('family lens: security role -> platform-governance', () => {
  assert.strictEqual(assignC4Family({ role: 'security-governance', kind: 'repository' }), 'platform-governance');
});

test('family lens: package role -> packaging-runtime', () => {
  assert.strictEqual(assignC4Family({ role: 'bigtop-runtime-support', kind: 'package' }), 'packaging-runtime');
});

test('family lens: integrator role -> coordination-community', () => {
  assert.strictEqual(assignC4Family({ role: 'ecosystem-integrator', kind: 'repository' }), 'coordination-community');
});

test('family lens: connector/client role -> integration-services', () => {
  assert.strictEqual(assignC4Family({ role: 'legacy-rdbms-hadoop-transfer', kind: 'retired-project' }), 'integration-services');
});

test('family lens: unknown role with no match -> unknown', () => {
  assert.strictEqual(assignC4Family({ role: 'something-weird', kind: 'repository' }), 'unknown');
});

test('family lens: missing role/kind -> unknown', () => {
  assert.strictEqual(assignC4Family({}), 'unknown');
});

test('family lens determinism: same input always yields the same family', () => {
  const targets = [
    { role: 'database', kind: 'repository' },
    { role: 'batch', kind: 'service' },
    { role: 'mystery', kind: 'thing' },
  ];
  for (const t of targets) {
    const f = assignC4Family(t);
    for (let i = 0; i < 5; i++) {
      assert.strictEqual(assignC4Family(t), f);
    }
  }
});

test('family lens priority: data-systems wins over compute-processing when both match', () => {
  const fam = assignC4Family({ role: 'database-batch-hybrid', kind: 'repository' });
  assert.strictEqual(fam, 'data-systems');
});
