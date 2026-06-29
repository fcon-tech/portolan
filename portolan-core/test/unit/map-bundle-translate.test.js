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
});
