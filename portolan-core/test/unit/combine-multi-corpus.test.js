/**
 * Unit test for the multi-corpus combine use-case.
 * Verifies the merged bundle's frontier-comparison satisfies the literal AND
 * pass-condition (>=1 Bigtop AND >=1 portolan-self matches/exceeds).
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { buildAtlasNavigationIndex } = require('../../src/use-cases/build-atlas-navigation-index');
const { combineMultiCorpusFrontier } = require('../../src/use-cases/combine-multi-corpus');
const { checkFrontierComparison } = require('../../src/domain/atlas-navigation');

function memSource(subjects, presence) {
  return {
    exists: (rel) => !!presence[rel], findFile: () => '',
    enumerateSubjects: () => subjects,
    resolveAnchors: (candidates) => {
      const m = new Map();
      for (const c of candidates) m.set(c.key || `${c.file}\u0000${c.substring}`, { found: true, lineStart: 1, lineEnd: 1, matchCount: 1 });
      return m;
    },
  };
}
const BIGTOP_SUBJECTS = [{ subject_id: 'repo:apache-bigtop-repo', subject_type: 'repository', subject_label: 'b', source_path: 'repos/apache-bigtop-repo', exists: true, expected_by: 'e', promotion_state: 'promoted' }];
const SELF_SUBJECTS = ['go-cli', 'scripts', 'viewer', 'portolan-core', 'schemas', 'fixtures'].map(r => ({ subject_id: `region:${r}`, subject_type: 'source_region', subject_label: r, source_path: r, exists: true, expected_by: 'e', promotion_state: 'promoted' }));
const BIGTOP_PRESENT = { 'repos/apache-bigtop-repo': true };
const SELF_PRESENT = { 'portolan-core': true, viewer: true, schema: true };

test('combineMultiCorpusFrontier: merged frontier satisfies literal AND pass-condition', () => {
  const bigtop = buildAtlasNavigationIndex({ targetRoot: '/b', sourceAdapter: memSource(BIGTOP_SUBJECTS, BIGTOP_PRESENT) });
  const self = buildAtlasNavigationIndex({ targetRoot: '/s', sourceAdapter: memSource(SELF_SUBJECTS, SELF_PRESENT) });
  const merged = combineMultiCorpusFrontier(bigtop, self);
  // combined target_id triggers the literal AND check.
  const check = checkFrontierComparison(merged.frontierComparison, merged.receiptValidation.target_id);
  assert.strictEqual(check.status, 'verified', check.summary);
  assert.match(check.summary, /combined:/);
});

test('combineMultiCorpusFrontier: merged artifacts carry both corpora', () => {
  const bigtop = buildAtlasNavigationIndex({ targetRoot: '/b', sourceAdapter: memSource(BIGTOP_SUBJECTS, BIGTOP_PRESENT) });
  const self = buildAtlasNavigationIndex({ targetRoot: '/s', sourceAdapter: memSource(SELF_SUBJECTS, SELF_PRESENT) });
  const merged = combineMultiCorpusFrontier(bigtop, self);
  // routes from both corpora present
  const routeFamilies = new Set(merged.navigationIndex.map(n => n.route_family));
  assert.ok(routeFamilies.has('package_flow'), 'Bigtop package route merged');
  assert.ok(routeFamilies.has('command') || routeFamilies.has('script_workflow'), 'self route merged');
  // disagreements merged (self carries them)
  assert.ok(merged.receiptValidation.status_disagreements.length >= 2);
});
