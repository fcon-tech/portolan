/**
 * Component classification: promotion rule, lifecycle mapping, type mapping.
 * Pure functions. Single responsibility: decide how a raw corpus target maps
 * to a component classification (Feature 2: Entity Stratification).
 *
 * The Component Promotion Rule (spec "Component Promotion Rule"): a raw entity
 * is promoted to a component only when its kind has strong identity; surface-
 * only kinds are never promoted; ambiguous kinds fall back to the tie-breaker
 * upstream (keep as surface/unknown unless two independent signals support it).
 */
'use strict';

const PROMOTABLE_KINDS = new Set([
  'repository',
  'retired-project',
  'package',
  'application',
  'library',
  'platform',
  'service',
]);

const SURFACE_ONLY_KINDS = new Set([
  'documentation',
  'mailing-list',
  'issue-tracker',
  'wiki',
  'binary-repository',
  'docker-image',
  'runtime',
  'release',
  'runtime-endpoint',
  'project-site',
]);

function isPromotableComponent(target) {
  const kind = String((target && target.kind) || '').toLowerCase();
  if (SURFACE_ONLY_KINDS.has(kind)) return false;
  if (PROMOTABLE_KINDS.has(kind)) return true;
  return false;
}

function mapLifecycle(target) {
  const lc = String((target && target.lifecycle) || 'unknown').toLowerCase();
  if (['active', 'external', 'retired', 'internal-support', 'unknown'].includes(lc)) {
    return lc;
  }
  if (lc === 'retired' || lc === 'legacy') return 'retired';
  return 'unknown';
}

function mapComponentType(target) {
  const kind = String((target && target.kind) || '').toLowerCase();
  if (kind === 'retired-project') return 'retired';
  if (kind === 'repository') {
    return target.role && /integrator|platform|ecosystem/.test(target.role) ? 'platform' : 'application';
  }
  if (kind === 'package') return 'package';
  if (kind === 'application' || kind === 'service') return 'application';
  if (kind === 'library') return 'library';
  return 'unknown';
}

module.exports = {
  PROMOTABLE_KINDS,
  SURFACE_ONLY_KINDS,
  isPromotableComponent,
  mapLifecycle,
  mapComponentType,
};
