/**
 * Surface classification + state helpers. Pure functions.
 * Single responsibility: map corpus surface kinds/roles to the schema
 * surface_type enum, resolve surface state, and produce "why it matters" text
 * (Feature 2: Surface Detection Rules).
 */
'use strict';

const { normalizeRole } = require('./c4');

const SURFACE_KIND_TO_TYPE = {
  documentation: 'docs',
  'official-doc': 'docs',
  release: 'release-matrix',
  'official-release': 'release-matrix',
  'release-matrix': 'release-matrix',
  'mailing-list': 'mailing-list',
  'issue-tracker': 'issue-tracker',
  'official-issue-tracker': 'issue-tracker',
  wiki: 'wiki',
  'official-wiki': 'wiki',
  'binary-repository': 'binary-repo',
  'binary-repo': 'binary-repo',
  'docker-image': 'docker-image',
  'runtime-endpoint': 'runtime-endpoint',
  runtime: 'runtime-endpoint',
  'vendor-config': 'vendor-config',
  'project-site': 'other',
  repository: 'other',
};

function mapSurfaceType(kind, role) {
  const k = String(kind || '').toLowerCase();
  if (SURFACE_KIND_TO_TYPE[k]) {
    // Special-case runtime surfaces that are actually CI/verification.
    if (k === 'runtime' && /verification|ci|smoke|test/.test(String(role || '').toLowerCase())) {
      return 'ci';
    }
    return SURFACE_KIND_TO_TYPE[k];
  }
  // Role-based fallbacks.
  const r = normalizeRole(role);
  if (r.includes('support-matrix')) return 'release-matrix';
  if (r.includes('mailing') || r.includes('community')) return 'mailing-list';
  if (r.includes('tracker') || r.includes('issue')) return 'issue-tracker';
  if (r.includes('docker') || r.includes('image')) return 'docker-image';
  if (r.includes('binary') || r.includes('package-surface')) return 'binary-repo';
  if (r.includes('verification') || r.includes('ci') || r.includes('smoke')) return 'ci';
  if (r.includes('wiki') || r.includes('documentation')) return 'docs';
  return 'other';
}

function surfaceState(surface) {
  if (!surface) return 'unknown';
  const es = surface.evidence_state || 'metadata-visible';
  if (es === 'missing') return 'missing';
  if (['cannot_verify', 'unknown'].includes(es)) return 'unknown';
  return 'available';
}

function surfaceWhyItMatters(surfaceType, s) {
  switch (surfaceType) {
    case 'docs':
      return 'Documentation/release surface; explains intended behavior and compatibility.';
    case 'release-matrix':
      return 'Support/release matrix; records which component versions are compatible.';
    case 'mailing-list':
      return 'Community/mailing-list surface; the coordination and announcement channel.';
    case 'issue-tracker':
      return 'Issue tracker surface; where bugs, enhancements, and releases are tracked.';
    case 'wiki':
      return 'Wiki surface; community-maintained documentation and planning.';
    case 'ci':
      return 'CI/verification surface; smoke-test and upstream-verification jobs.';
    case 'binary-repo':
      return 'Binary/package repository surface; where installable artifacts are published.';
    case 'docker-image':
      return 'Docker image surface; containerized runtime artifacts.';
    case 'runtime-endpoint':
      return 'Runtime endpoint surface; observed or configured service endpoint.';
    case 'vendor-config':
      return 'Vendor/SaaS configuration surface; third-party deployment descriptor.';
    default:
      return (s && (s.note || s.label)) || 'Related inspection surface.';
  }
}

module.exports = { SURFACE_KIND_TO_TYPE, mapSurfaceType, surfaceState, surfaceWhyItMatters };
