/**
 * Domain: bounded-query envelope + limit parsing.
 *
 * The standard result envelope for every bundle-query family: a bounded slice
 * of records plus an honest total (exact or lower_bound), truncation flag, and
 * warnings. `parseLimit` clamps to the bounded-query window.
 *
 * Pure functions, zero dependencies. Domain layer.
 */
'use strict';

const SCHEMA_VERSION = '0.1.0';
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 200;

// Promotion-health statuses that are treated as degraded and promoted into gaps.
const DEGRADED_HEALTH_STATUSES = new Set([
  'cannot_verify',
  'not_integrated',
  'not_assessed',
  'partial',
  'non_exhaustive',
  'polluted_by_non_source',
  'dominated_by_fixture_data',
  'oversized',
  'stale',
  'inventory_mismatch',
]);

function parseLimit(raw, fallback = DEFAULT_LIMIT) {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, MAX_LIMIT);
}

function wrapResult(query, records, total, limit, warnings = [], options = {}) {
  const out = records.slice(0, limit);
  const truncated = options.truncated !== undefined ? Boolean(options.truncated) : total > out.length;
  return {
    schema_version: SCHEMA_VERSION,
    query,
    records: out,
    total_records: total,
    total_records_relation: options.totalRecordsRelation || 'exact',
    truncated,
    truncated_records: truncated ? total - out.length : 0,
    warnings,
  };
}

module.exports = { SCHEMA_VERSION, DEFAULT_LIMIT, MAX_LIMIT, DEGRADED_HEALTH_STATUSES, parseLimit, wrapResult };
