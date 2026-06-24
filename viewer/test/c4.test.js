/**
 * Unit tests for C4 family assignment determinism + priority order.
 * Covers Feature 3 (C4 View) at the data level.
 *
 * RED phase: imports from scripts/system-map/c4.js (not yet extracted).
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { assignC4Family, C4_FAMILY_RULES } = require('../scripts/system-map/c4');

const VALID_FAMILIES = [
  'data-systems', 'compute-processing', 'platform-governance',
  'packaging-runtime', 'coordination-community', 'integration-services', 'unknown',
];

test('C4 family: every rule family is a valid schema enum', () => {
  for (const rule of C4_FAMILY_RULES) {
    assert.ok(VALID_FAMILIES.includes(rule.family), `rule family "${rule.family}" not in schema enum`);
  }
});

test('C4 family: storage/database role -> data-systems', () => {
  assert.strictEqual(assignC4Family({ role: 'database', kind: 'repository' }), 'data-systems');
  assert.strictEqual(assignC4Family({ role: 'distributed-nosql-store', kind: 'repository' }), 'data-systems');
});

test('C4 family: batch/stream role -> compute-processing', () => {
  assert.strictEqual(assignC4Family({ role: 'batch-processing', kind: 'repository' }), 'compute-processing');
  assert.strictEqual(assignC4Family({ role: 'workflow-orchestration', kind: 'repository' }), 'compute-processing');
});

test('C4 family: security role -> platform-governance', () => {
  assert.strictEqual(assignC4Family({ role: 'security-governance', kind: 'repository' }), 'platform-governance');
});

test('C4 family: package role -> packaging-runtime', () => {
  assert.strictEqual(assignC4Family({ role: 'bigtop-runtime-support', kind: 'package' }), 'packaging-runtime');
});

test('C4 family: integrator role -> coordination-community', () => {
  assert.strictEqual(assignC4Family({ role: 'ecosystem-integrator', kind: 'repository' }), 'coordination-community');
});

test('C4 family: connector/client role -> integration-services', () => {
  assert.strictEqual(assignC4Family({ role: 'legacy-rdbms-hadoop-transfer', kind: 'retired-project' }), 'integration-services');
});

test('C4 family: unknown role with no match -> unknown', () => {
  assert.strictEqual(assignC4Family({ role: 'something-weird', kind: 'repository' }), 'unknown');
});

test('C4 family: missing role/kind -> unknown', () => {
  assert.strictEqual(assignC4Family({}), 'unknown');
});

test('C4 family determinism: same input always yields the same family', () => {
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

test('C4 family priority: data-systems wins over compute-processing when both match', () => {
  // A role that contains a data keyword AND a compute keyword should resolve by
  // priority order (data-systems is priority 1).
  // "database-batch" contains both; the rule order should pick data-systems.
  const fam = assignC4Family({ role: 'database-batch-hybrid', kind: 'repository' });
  assert.strictEqual(fam, 'data-systems');
});
