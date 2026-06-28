/**
 * Domain: evidence-promotion atlas — constants, classifier, query-index,
 * record shapers, and the semantic validator.
 *
 * Pure functions/data only. This is the Clean-Architecture extraction of the
 * frozen viewer/scripts/evidence-promotion-atlas.js pure core. Filesystem I/O
 * (stat, sha256, git ls-files, artifact reads/writes) lives in adapters and
 * crosses the boundary via ports, injected by the use-case.
 *
 * Domain layer — may depend only on domain (sibling modules use node:crypto /
 * node:path which are deterministic built-ins, allowed).
 */
'use strict';

const path = require('path');
const crypto = require('crypto');

const SCHEMA_VERSION = '0.1.0';

const FAMILIES = [
  'source_code', 'documentation', 'build_metadata', 'dependency_metadata',
  'configuration', 'deployment_model', 'ci_cd', 'runtime_observation',
  'catalog_descriptor', 'duplication', 'static_analysis', 'search_index',
  'symbol_index', 'semantic_index', 'analysis_claim',
];

const EVIDENCE_STATES = new Set([
  'source-visible', 'metadata-visible', 'runtime-visible', 'claim-only',
  'unknown', 'cannot_verify', 'not_assessed',
]);

const PROMOTION_MATRIX = [
  ['source_code', 'source', ['file_inventory', 'source_role', 'definition'], 'No behavior, ownership, references, or runtime topology from file presence alone.'],
  ['symbol_index', 'metadata', ['definition'], 'Definition-only unless the producer contract supplies resolved references.'],
  ['semantic_index', 'metadata', ['definition', 'reference', 'call', 'typed_dependency'], 'Only when supplied producer contracts prove those fact kinds read-only or approval-gated.'],
  ['search_index', 'metadata', ['retrieval_route', 'preview_available'], 'Retrieval support only; not architecture truth.'],
  ['documentation', 'metadata', ['documented_intent', 'surface_description'], 'Metadata-visible unless cross-checked by source or runtime.'],
  ['build_metadata', 'metadata', ['declared_module', 'build_relationship'], 'Declared metadata only; no runtime topology.'],
  ['dependency_metadata', 'metadata', ['component', 'dependency'], 'Dependency facts only; no service relationship unless resolved locally.'],
  ['configuration', 'metadata', ['config_surface', 'env_var_name', 'port_declaration', 'secret_reference_name'], 'Never expose secret values; no runtime proof.'],
  ['deployment_model', 'metadata', ['desired_state_service', 'desired_state_resource'], 'Metadata-visible desired state; no runtime proof.'],
  ['ci_cd', 'metadata', ['workflow_surface', 'release_surface'], 'Declared workflow only.'],
  ['runtime_observation', 'runtime', ['observed_runtime_service', 'observed_runtime_edge'], 'Runtime-visible only for supplied local observations.'],
  ['catalog_descriptor', 'metadata', ['declared_service', 'api_surface', 'catalog_fact'], 'Unresolved relations are cannot_verify.'],
  ['duplication', 'metadata', ['duplication_finding', 'duplicate_cluster'], 'Not ownership or dependency truth.'],
  ['static_analysis', 'metadata', ['static_analysis_finding'], 'Semantic fact only when the producer contract explicitly supplies that fact kind.'],
  ['analysis_claim', 'claim', ['claim_record'], 'Always claim-only; never promotes facts from statement text alone.'],
].map(([family, evidence_layer, eligible_fact_kinds, resolution_limit]) => ({
  family, evidence_layer, eligible_fact_kinds, resolution_limit,
}));

const THRESHOLDS = {
  polluted_by_non_source_ratio: 0.5,
  dominated_by_fixture_data_ratio: 0.35,
  oversized_artifact_bytes: 100 * 1024 * 1024,
  oversized_family_bytes: 500 * 1024 * 1024,
  low_confidence_ratio: 0.1,
  low_confidence_threshold: 0.5,
  inventory_mismatch_ratio: 0.01,
  inventory_mismatch_max_threshold_count: 100,
};

const HEALTH_STATUSES = new Set([
  'ok', 'partial', 'non_exhaustive', 'oversized', 'dominated_by_fixture_data',
  'polluted_by_non_source', 'stale', 'inventory_mismatch', 'raw_available_only',
  'unsupported_language', 'not_integrated', 'cannot_verify', 'not_assessed',
]);

const EVIDENCE_LAYERS = new Set(['source', 'metadata', 'runtime', 'claim', 'unknown']);

const SOURCE_ROLES = new Set([
  'runtime_product_code', 'test_code', 'test_artifact', 'fixture_data',
  'generated_code', 'vendor_code', 'documentation', 'configuration',
  'deployment_model', 'build_metadata', 'ci_cd', 'secret_reference_surface',
  'runtime_observation', 'catalog_descriptor', 'unknown_role',
]);

const PROMOTED_ROUTE_FAMILIES = new Set(['source_code', 'symbol_index', 'analysis_claim']);

// ---- pure helpers ----

function hashText(text) {
  return crypto.createHash('sha256').update(String(text)).digest('hex').slice(0, 16);
}

function evidenceStateOr(value, fallback) {
  return EVIDENCE_STATES.has(value) ? value : fallback;
}

function roleForPath(file) {
  const p = file.replace(/\\/g, '/').toLowerCase();
  const base = path.basename(p);
  if (p.includes('/vendor/') || p.includes('/third_party/') || p.includes('/external/')) return ['vendor_code', 0.8];
  if (p.includes('/generated/') || p.includes('/gen/') || base.includes('generated')) return ['generated_code', 0.75];
  if (p.includes('/fixtures/') || p.includes('/fixture/') || p.includes('/testdata/')) return ['fixture_data', 0.85];
  if (p.includes('/test/') || p.includes('/tests/') || p.includes('/spec/') || /\.(test|spec)\./.test(base) || base.endsWith('_test.go')) return ['test_code', 0.8];
  if (/\.(md|rst|adoc|txt)$/.test(base) || p.includes('/docs/')) return ['documentation', 0.8];
  if (base === 'docker-compose.yml' || base === 'docker-compose.yaml' || p.includes('/helm/') || p.includes('/kubernetes/') || /\.(tf|tfvars)$/.test(base)) return ['deployment_model', 0.75];
  if (p.includes('/.github/workflows/') || p.includes('/.gitlab-ci') || base === 'jenkinsfile') return ['ci_cd', 0.8];
  if (/^(package\.json|package-lock\.json|go\.mod|go\.sum|pom\.xml|build\.gradle|settings\.gradle|requirements\.txt|pyproject\.toml|cargo\.toml|cargo\.lock)$/.test(base)) return ['build_metadata', 0.8];
  if (base === 'openapi.json' || base === 'openapi.yaml' || /\.(proto|graphql|avsc)$/.test(base) || base === 'catalog-info.yaml') return ['catalog_descriptor', 0.75];
  if (/^\.env(\.|$)/.test(base) || /(^|\/)(secrets?|credentials?|vault)(\/|[-_.])/.test(p) || /(secret|credential|vault)[-_a-z0-9]*\.(env|ya?ml|json|toml|properties|txt)$/.test(base)) return ['secret_reference_surface', 0.75];
  if (/(^|\.)(env|ini|conf|config|properties|toml|yaml|yml|json)$/.test(base) || p.includes('/config/')) return ['configuration', 0.6];
  if (/\.(go|js|jsx|ts|tsx|py|java|kt|scala|rb|php|rs|c|cc|cpp|h|hpp|cs)$/.test(base)) return ['runtime_product_code', 0.65];
  return ['unknown_role', 0.35];
}

// ---- promotion query index ----

function normalizeIndexValue(value) {
  return String(value || '').trim().toLowerCase();
}

function promotionQueryKey(filters) {
  return ['family', 'status', 'stratum']
    .filter((field) => filters[field])
    .map((field) => `${field}=${normalizeIndexValue(filters[field])}`)
    .join('&');
}

/**
 * Subset-index builder. `toJSON(sizeOf)` takes a `sizeOf(name)->number|null`
 * callback (the reader's size port) instead of touching fs directly.
 */
function createPromotionQueryIndex(sampleLimit, generatedAt) {
  const artifacts = {};
  function ensureArtifact(artifact) {
    if (!artifacts[artifact]) artifacts[artifact] = { total: 0, queries: {} };
    return artifacts[artifact];
  }
  function ensureQuery(artifactIndex, key) {
    if (!artifactIndex.queries[key]) artifactIndex.queries[key] = { total: 0, records: [] };
    return artifactIndex.queries[key];
  }
  function addRow(artifact, row) {
    const artifactIndex = ensureArtifact(artifact);
    artifactIndex.total += 1;
    const filters = {
      family: normalizeIndexValue(row.family),
      status: normalizeIndexValue(row.status),
      stratum: normalizeIndexValue(row.stratum),
    };
    const fields = ['family', 'status', 'stratum'].filter((field) => filters[field]);
    const keySets = [];
    for (let mask = 1; mask < (1 << fields.length); mask += 1) {
      const filter = {};
      fields.forEach((field, index) => { if (mask & (1 << index)) filter[field] = filters[field]; });
      keySets.push(filter);
    }
    for (const filter of keySets) {
      const query = ensureQuery(artifactIndex, promotionQueryKey(filter));
      query.total += 1;
      if (query.records.length < sampleLimit) query.records.push(row);
    }
  }
  function addRows(artifact, rows) { rows.forEach((row) => addRow(artifact, row)); }
  function toJSON(sizeOf) {
    const indexedArtifacts = {};
    for (const [artifact, artifactIndex] of Object.entries(artifacts)) {
      const sizeBytes = sizeOf ? sizeOf(artifact) : null;
      indexedArtifacts[artifact] = {
        ...artifactIndex,
        artifact_stats: { row_count: artifactIndex.total, size_bytes: sizeBytes },
      };
    }
    return {
      schema_version: SCHEMA_VERSION,
      generated_at: generatedAt || new Date().toISOString(),
      sample_limit: sampleLimit,
      artifacts: indexedArtifacts,
    };
  }
  return { addRow, addRows, toJSON };
}

// ---- record shapers ----

function sourceInventoryRawArtifact(bundleDir, inventory) {
  const root = path.resolve(inventory.root || '');
  const id = `raw-source-inventory-${hashText(root)}`;
  return {
    id, stratum: 'raw_evidence', evidence_layer: 'source', evidence_state: 'source-visible',
    family: 'source_code', producer: 'portolan-source-inventory',
    producer_ref: `source-inventory.json#${id}`, path: root, source_root: root,
    size_bytes: 0, inventory_source: inventory.inventory_source || 'unknown',
    total_file_count: inventory.total || 0,
    retained_file_refs: (inventory.files || []).length,
    truncated: Boolean(inventory.truncated), expansion_mode: 'external',
    resolution_limit: inventory.truncated
      ? 'The full source corpus is cataloged by count and local root; only classified-sources.jsonl rows are retained in the bundle.'
      : 'The source inventory rows retained in classified-sources.jsonl cover this root within the configured classification limit.',
  };
}

function shapeRawArtifact(bundleDir, file, producer, family, stats, contentHash, expansionMode = 'core') {
  return {
    id: `raw-${hashText(`${family}:${file}`)}`,
    stratum: 'raw_evidence', evidence_layer: 'metadata', evidence_state: 'metadata-visible',
    family, producer,
    producer_ref: path.relative(bundleDir, file),
    path: path.relative(bundleDir, file),
    size_bytes: stats.size,
    mtime: stats.mtime,
    content_hash: stats.size <= 50 * 1024 * 1024 ? `sha256:${contentHash}` : undefined,
    expansion_mode: expansionMode,
  };
}

function healthRecord(family, status, reason, evidenceRefs, producerRef, extra = {}) {
  return {
    id: `promotion-health-${family}`,
    stratum: 'promotion_health', family, scope: 'bundle', fact_kind: 'family_route',
    status,
    evidence_state: status === 'cannot_verify' ? 'cannot_verify' : status === 'not_assessed' ? 'not_assessed' : 'metadata-visible',
    evidence_layer: status === 'not_assessed' ? 'unknown' : 'metadata',
    reason,
    observed_count: evidenceRefs.length,
    denominator: extra.denominator != null ? extra.denominator : null,
    threshold: extra.threshold != null ? extra.threshold : null,
    calculation_rule: extra.calculation_rule || 'family route has representative local input or terminal state',
    next_action: extra.next_action || '',
    producer: extra.producer || 'portolan-evidence-promotion-atlas',
    producer_ref: producerRef || evidenceRefs[0] || 'promotion-route',
    evidence_refs: evidenceRefs,
    route_proof: evidenceRefs.length > 0,
    ...extra,
  };
}

function truncationHealth(family, id, reason, observedCount, denominator, threshold, evidenceRefs, producerRef, calculationRule, nextAction) {
  return healthRecord(family, 'non_exhaustive', reason, evidenceRefs, producerRef, {
    id, observed_count: observedCount, denominator, threshold,
    calculation_rule: calculationRule, next_action: nextAction,
  });
}

// ---- validate helpers ----

function hasValue(row, field) {
  return row[field] !== undefined && row[field] !== null && row[field] !== '';
}
function requireFields(row, fields, label, errors) {
  for (const field of fields) { if (!hasValue(row, field)) errors.push(`${label} missing ${field}`); }
}
function requireEnum(row, field, allowed, label, errors) {
  if (hasValue(row, field) && !allowed.has(row[field])) errors.push(`${label} invalid ${field}: ${row[field]}`);
}
function requireArray(row, field, label, errors) {
  if (!Array.isArray(row[field])) errors.push(`${label} ${field} must be an array`);
}

/**
 * Pure semantic validator. Takes the parsed artifacts + a `sizeOf(name)` port
 * callback (for query-index byte-size cross-checks) + a `hasArtifact(name)`
 * predicate. Returns { errors }. Mirrors the legacy validate() body.
 */
function validatePromotionAtlas({ registry, matrix, queryIndex, health, promoted, classified, raw, completion, sizeOf, hasArtifact }) {
  const errors = [];
  if (!registry || !Array.isArray(registry.families)) errors.push('missing evidence-families.json registry');
  if (!Array.isArray(matrix && matrix.records)) errors.push('missing promotion-matrix.json records');
  if (!health.length) errors.push('missing promotion-health.jsonl records');
  if (!classified.length) errors.push('missing classified-sources.jsonl records');

  if (queryIndex !== undefined) {
    if (!queryIndex || typeof queryIndex !== 'object') {
      errors.push('promotion-query-index.json must be valid JSON object');
    } else {
      const requiredIndexedArtifacts = {
        'promotion-health.jsonl': health.length,
        'classified-sources.jsonl': classified.length,
        'raw-artifacts.jsonl': raw.length,
      };
      if (promoted !== null) requiredIndexedArtifacts['promoted-facts.jsonl'] = promoted.length;
      for (const [artifact, expectedRows] of Object.entries(requiredIndexedArtifacts)) {
        const artifactIndex = queryIndex.artifacts && queryIndex.artifacts[artifact];
        if (!artifactIndex || typeof artifactIndex !== 'object') {
          errors.push(`promotion-query-index missing artifact ${artifact}`);
          continue;
        }
        const rowCount = Number(artifactIndex.artifact_stats && artifactIndex.artifact_stats.row_count);
        if (!Number.isFinite(rowCount) || rowCount !== expectedRows) {
          errors.push(`promotion-query-index ${artifact} row_count mismatch: expected ${expectedRows}, got ${artifactIndex.artifact_stats && artifactIndex.artifact_stats.row_count}`);
        }
        const sizeBytes = Number(artifactIndex.artifact_stats && artifactIndex.artifact_stats.size_bytes);
        if (hasArtifact && !hasArtifact(artifact)) {
          errors.push(`promotion-query-index ${artifact} points to missing artifact`);
        } else if (sizeOf && Number.isFinite(sizeBytes) && sizeBytes >= 0 && sizeOf(artifact) !== sizeBytes) {
          errors.push(`promotion-query-index ${artifact} size_bytes mismatch`);
        }
        if (!artifactIndex.queries || typeof artifactIndex.queries !== 'object') {
          errors.push(`promotion-query-index ${artifact} queries must be an object`);
        }
      }
    }
  }

  if (registry && Array.isArray(registry.families)) {
    const seenFamilies = new Set();
    for (const row of registry.families) {
      if (!FAMILIES.includes(row.id)) errors.push(`registry invalid family: ${row.id || '?'}`);
      seenFamilies.add(row.id);
    }
    for (const family of FAMILIES) {
      if (!seenFamilies.has(family)) errors.push(`registry missing canonical family ${family}`);
    }
  }
  if (registry && Array.isArray(registry.health_statuses)) {
    for (const status of registry.health_statuses) {
      if (!HEALTH_STATUSES.has(status)) errors.push(`registry invalid health status: ${status}`);
    }
  }

  const matrixByFamily = new Map();
  if (matrix && Array.isArray(matrix.records)) {
    for (const row of matrix.records) {
      const label = `promotion matrix ${row.family || '?'}`;
      requireFields(row, ['family', 'evidence_layer', 'eligible_fact_kinds', 'resolution_limit'], label, errors);
      requireEnum(row, 'family', new Set(FAMILIES), label, errors);
      requireEnum(row, 'evidence_layer', EVIDENCE_LAYERS, label, errors);
      if (!Array.isArray(row.eligible_fact_kinds) || row.eligible_fact_kinds.length === 0) {
        errors.push(`${label} eligible_fact_kinds must be a non-empty array`);
      }
      matrixByFamily.set(row.family, row);
    }
  }

  for (const row of classified) {
    const label = `classified ${row.id || '?'}`;
    requireFields(row, ['id', 'stratum', 'family', 'evidence_layer', 'evidence_state', 'path', 'source_role', 'confidence', 'classifier', 'evidence_refs'], label, errors);
    if (row.stratum !== 'classified_source') errors.push(`${label} invalid stratum: ${row.stratum || '?'}`);
    requireEnum(row, 'family', new Set(FAMILIES), label, errors);
    requireEnum(row, 'evidence_layer', EVIDENCE_LAYERS, label, errors);
    requireEnum(row, 'evidence_state', EVIDENCE_STATES, label, errors);
    requireEnum(row, 'source_role', SOURCE_ROLES, label, errors);
    requireArray(row, 'evidence_refs', label, errors);
    if (typeof row.confidence !== 'number' || row.confidence < 0 || row.confidence > 1) {
      errors.push(`${label} confidence must be a number between 0 and 1`);
    }
  }

  for (const row of raw) {
    const label = `raw artifact ${row.id || '?'}`;
    requireFields(row, ['id', 'stratum', 'evidence_layer', 'evidence_state', 'family', 'producer', 'producer_ref', 'path', 'size_bytes', 'expansion_mode'], label, errors);
    if (row.stratum !== 'raw_evidence') errors.push(`${label} invalid stratum: ${row.stratum || '?'}`);
    requireEnum(row, 'family', new Set(FAMILIES), label, errors);
    requireEnum(row, 'evidence_layer', EVIDENCE_LAYERS, label, errors);
    requireEnum(row, 'evidence_state', EVIDENCE_STATES, label, errors);
    requireEnum(row, 'expansion_mode', new Set(['core', 'expanded', 'external', 'missing']), label, errors);
    if (!Number.isInteger(row.size_bytes) || row.size_bytes < 0) {
      errors.push(`${label} size_bytes must be a non-negative integer`);
    }
  }

  const healthByFamily = new Map();
  for (const row of health) {
    const label = `health ${row.id || '?'}`;
    requireFields(row, ['id', 'stratum', 'family', 'scope', 'fact_kind', 'status', 'evidence_state', 'evidence_layer', 'reason', 'observed_count', 'calculation_rule', 'producer', 'producer_ref', 'evidence_refs', 'route_proof'], label, errors);
    if (row.stratum !== 'promotion_health') errors.push(`${label} invalid stratum: ${row.stratum || '?'}`);
    requireEnum(row, 'family', new Set(FAMILIES), label, errors);
    requireEnum(row, 'status', HEALTH_STATUSES, label, errors);
    requireEnum(row, 'evidence_state', EVIDENCE_STATES, label, errors);
    requireEnum(row, 'evidence_layer', EVIDENCE_LAYERS, label, errors);
    requireArray(row, 'evidence_refs', label, errors);
    if (typeof row.route_proof !== 'boolean') errors.push(`${label} route_proof must be boolean`);
    if (typeof row.observed_count !== 'number') errors.push(`${label} observed_count must be numeric`);
    if (row.id === `promotion-health-${row.family}`) healthByFamily.set(row.family, row);
  }
  for (const family of FAMILIES) {
    if (!healthByFamily.has(family)) errors.push(`missing bundle-level health for canonical family ${family}`);
  }

  const validatePromotedRow = (row) => {
    const label = `promoted/claim record ${row.id || '?'}`;
    requireFields(row, ['id', 'stratum', 'family', 'fact_kind', 'evidence_layer', 'evidence_state', 'source_refs', 'producer', 'producer_ref', 'promotion_basis', 'resolution_limit'], label, errors);
    requireEnum(row, 'family', new Set(FAMILIES), label, errors);
    requireEnum(row, 'evidence_layer', EVIDENCE_LAYERS, label, errors);
    requireEnum(row, 'evidence_state', EVIDENCE_STATES, label, errors);
    requireArray(row, 'source_refs', label, errors);
    if (row.stratum !== 'promoted_fact' && row.stratum !== 'claim') errors.push(`${label} invalid stratum: ${row.stratum || '?'}`);
    if (row.stratum === 'claim') {
      if (row.family !== 'analysis_claim') errors.push(`${label} claim family must be analysis_claim`);
      if (row.evidence_layer !== 'claim') errors.push(`${label} claim evidence_layer must be claim`);
      if (row.evidence_state !== 'claim-only') errors.push(`${label} claim evidence_state must be claim-only`);
    }
    if (row.stratum === 'promoted_fact') {
      if (row.evidence_layer === 'claim') errors.push(`promoted fact ${row.id || '?'} uses claim evidence layer`);
      const matrixRow = matrixByFamily.get(row.family);
      if (!matrixRow) {
        errors.push(`${label} has no promotion matrix family route`);
      } else {
        if (row.evidence_layer !== matrixRow.evidence_layer) {
          errors.push(`${label} evidence_layer ${row.evidence_layer} does not match matrix ${matrixRow.evidence_layer}`);
        }
        if (!matrixRow.eligible_fact_kinds.includes(row.fact_kind)) {
          errors.push(`${label} fact_kind ${row.fact_kind} is not eligible for family ${row.family}`);
        }
      }
    }
  };
  for (const row of promoted || []) validatePromotedRow(row);

  if (completion) {
    for (const family of FAMILIES) {
      const row = healthByFamily.get(family);
      if (!row) continue;
      if (row.status === 'not_integrated') errors.push(`completion blocked: ${family} is not_integrated`);
      if (!row.route_proof || !Array.isArray(row.evidence_refs) || row.evidence_refs.length === 0) {
        errors.push(`completion blocked: ${family} lacks non-stub route proof with evidence_refs`);
      }
      if (!row.producer_ref || String(row.producer_ref).startsWith('route:')) {
        errors.push(`completion blocked: ${family} lacks representative producer_ref`);
      }
    }
  }

  return { errors };
}

module.exports = {
  SCHEMA_VERSION, FAMILIES, EVIDENCE_STATES, PROMOTION_MATRIX, THRESHOLDS,
  HEALTH_STATUSES, EVIDENCE_LAYERS, SOURCE_ROLES, PROMOTED_ROUTE_FAMILIES,
  hashText, evidenceStateOr, roleForPath,
  normalizeIndexValue, promotionQueryKey, createPromotionQueryIndex,
  sourceInventoryRawArtifact, shapeRawArtifact, healthRecord, truncationHealth,
  hasValue, requireFields, requireEnum, requireArray, validatePromotionAtlas,
};
