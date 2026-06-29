'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { translateMapBundle } = require('../../src/domain/map-bundle-translate');

function repoNode(id, label, path) {
  return { id, kind: 'repository', label, evidence: { state: 'source-visible', source: path || `/tmp/${id}` } };
}

function edge(from, to, kind) {
  return { from, to, kind: kind || 'imports', evidence: { state: 'metadata-visible', source: 'graph.json' } };
}

test('translateMapBundle: repository nodes become atlasSurfaces targets + repos', () => {
  const artifacts = translateMapBundle({
    graph: { nodes: [repoNode('svc-a', 'Service A'), repoNode('svc-b', 'Service B')], edges: [] },
    summary: { root: '/tmp/landscape', generated_at: '2026-01-01T00:00:00Z', graph: { nodes: 2, edges: 0 } },
  });
  assert.equal(artifacts.atlasSurfaces.targets.length, 2);
  assert.equal(artifacts.repos.length, 2);
  assert.equal(artifacts.atlasSurfaces.targets[0].id, 'svc-a');
  assert.equal(artifacts.atlasSurfaces.targets[0].kind, 'repository');
  assert.equal(artifacts.repos[0].name, 'Service A');
});

test('translateMapBundle: repo-to-repo edges become relationships + depends_on', () => {
  const artifacts = translateMapBundle({
    graph: { nodes: [repoNode('a', 'A'), repoNode('b', 'B')], edges: [edge('a', 'b', 'imports')] },
  });
  assert.equal(artifacts.relationships.length, 1);
  assert.equal(artifacts.relationships[0].from_repo, 'a');
  assert.equal(artifacts.relationships[0].to_repo, 'b');
  assert.equal(artifacts.relationships[0].type, 'imports');
  // depends_on is populated on the target for the manifest-dep path
  const targetA = artifacts.atlasSurfaces.targets.find((t) => t.id === 'a');
  assert.deepEqual(targetA.depends_on, ['b']);
});

test('translateMapBundle: non-repo edges are excluded from relationships', () => {
  const artifacts = translateMapBundle({
    graph: {
      nodes: [
        repoNode('repo', 'Repo'),
        { id: 'repo:source:file.go', kind: 'unknown', evidence: { state: 'source-visible' } },
      ],
      edges: [edge('repo', 'repo:source:file.go', 'observes')],
    },
  });
  assert.equal(artifacts.relationships.length, 0, 'observes edges to non-repo nodes should not be relationships');
});

test('translateMapBundle: weak coverage records become gaps', () => {
  const artifacts = translateMapBundle({
    graph: { nodes: [], edges: [] },
    coverage: {
      records: [
        { id: 'gap-1', kind: 'repository-discovery', evidence_state: 'unknown', status: 'unknown', reason: 'no .git' },
        { id: 'ok-1', kind: 'source-inventory', evidence_state: 'source-visible', status: 'observed' },
      ],
    },
  });
  assert.equal(artifacts.gaps.length, 1);
  assert.equal(artifacts.gaps[0].id, 'gap-1');
});

test('translateMapBundle: evidence state mapping (cannot-verify → cannot_verify)', () => {
  const artifacts = translateMapBundle({
    graph: { nodes: [{ id: 'r', kind: 'repository', label: 'R', evidence: { state: 'cannot-verify' } }], edges: [] },
  });
  assert.equal(artifacts.atlasSurfaces.targets[0].evidence_state, 'cannot_verify');
});

test('translateMapBundle: evidence state mapping (underscore cannot_verify from Go graph)', () => {
  const artifacts = translateMapBundle({
    graph: { nodes: [{ id: 'r', kind: 'repository', label: 'R', evidence: { state: 'cannot_verify' } }], edges: [] },
  });
  assert.equal(artifacts.atlasSurfaces.targets[0].evidence_state, 'cannot_verify');
});

test('translateMapBundle: not_assessed evidence state preserved', () => {
  const artifacts = translateMapBundle({
    graph: { nodes: [], edges: [] },
    coverage: { records: [{ id: 'g1', evidence_state: 'not_assessed', status: 'not_assessed', reason: 'x' }] },
  });
  assert.equal(artifacts.gaps[0].evidence_state, 'not_assessed');
});

test('translateMapBundle: findings mapped to hotspots', () => {
  const artifacts = translateMapBundle({
    graph: { nodes: [], edges: [] },
    findings: [
      { id: 'f1', kind: 'duplication', severity: 'high', summary: 'dup found', evidence_state: 'source-visible' },
      { id: 'f2', kind: 'relationships', severity: 'medium', summary: 'dep edge', evidence_state: 'cannot_verify' },
    ],
  });
  assert.equal(artifacts.hotspots.length, 2);
  assert.equal(artifacts.hotspots[0].id, 'f1');
  assert.equal(artifacts.hotspots[0].severity, 'high');
  assert.equal(artifacts.hotspots[1].evidence_state, 'cannot_verify');
});

test('translateMapBundle: handles empty/missing graph gracefully', () => {
  const artifacts = translateMapBundle({ graph: null, summary: null, findings: null, coverage: null });
  assert.equal(artifacts.atlasSurfaces.targets.length, 0);
  assert.equal(artifacts.relationships.length, 0);
  assert.equal(artifacts.repos.length, 0);
  assert.equal(artifacts.atlasSurfaces.schema_version, '0.1.0');
});

test('translateMapBundle: parallel edges (same from/to/kind) are not collapsed', () => {
  const artifacts = translateMapBundle({
    graph: {
      nodes: [repoNode('a', 'A'), repoNode('b', 'B')],
      edges: [
        edge('a', 'b', 'imports'),
        edge('a', 'b', 'imports'), // parallel edge
        edge('a', 'b', 'depends-on'),
      ],
    },
  });
  assert.equal(artifacts.relationships.length, 3, 'all three edges should produce distinct relationships');
  const ids = artifacts.relationships.map((r) => r.id);
  assert.equal(new Set(ids).size, 3, 'relationship ids must be unique');
  // depends_on must be deduplicated despite parallel edges
  const targetA = artifacts.atlasSurfaces.targets.find((t) => t.id === 'a');
  assert.deepEqual(targetA.depends_on, ['b'], 'depends_on deduplicated to unique repos');
});

test('translateMapBundle: references edges (symbol-index) become typed relationships', () => {
  const artifacts = translateMapBundle({
    graph: {
      nodes: [repoNode('repo-a', 'Repo A'), repoNode('repo-b', 'Repo B')],
      edges: [
        {
          from: 'repo-a',
          to: 'repo-b',
          kind: 'references',
          evidence: { state: 'metadata-visible', source: '.portolan/symbol-index/export.json' },
        },
      ],
    },
  });
  assert.equal(artifacts.relationships.length, 1, 'references edge should produce a relationship');
  assert.equal(artifacts.relationships[0].type, 'references');
  assert.equal(artifacts.relationships[0].from_repo, 'repo-a');
  assert.equal(artifacts.relationships[0].to_repo, 'repo-b');
  assert.equal(artifacts.relationships[0].evidence_state, 'metadata-visible');
  // references must NOT populate depends_on (it is not a declared dependency)
  const targetA = artifacts.atlasSurfaces.targets.find((t) => t.id === 'repo-a');
  assert.deepEqual(targetA.depends_on, [], 'references should not populate depends_on');
});

test('translateMapBundle: external nodes (out-of-perimeter refs) become surface-only targets', () => {
  const artifacts = translateMapBundle({
    graph: {
      nodes: [
        repoNode('repo-a', 'Repo A'),
        {
          id: 'external:symbol-ref:abc123',
          kind: 'external',
          label: 'external-pkg/src/index.js',
          evidence: { state: 'metadata-visible', source: '.portolan/symbol-index/export.json' },
        },
      ],
      edges: [
        {
          from: 'repo-a',
          to: 'external:symbol-ref:abc123',
          kind: 'references',
          evidence: { state: 'metadata-visible', source: '.portolan/symbol-index/export.json' },
        },
      ],
    },
  });
  assert.equal(artifacts.relationships.length, 1, 'repo->external edge should produce a relationship');
  assert.equal(artifacts.relationships[0].type, 'references');
  assert.equal(artifacts.relationships[0].from_repo, 'repo-a');
  assert.equal(artifacts.relationships[0].to_repo, 'external:symbol-ref:abc123');
  const extTarget = artifacts.atlasSurfaces.targets.find((t) => t.kind === 'external');
  assert.ok(extTarget, 'an external target should exist');
  assert.equal(extTarget.lifecycle, 'external');
});
