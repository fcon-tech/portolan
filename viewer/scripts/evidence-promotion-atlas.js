#!/usr/bin/env node
/**
 * Build and validate the spec 109 evidence-promotion atlas artifacts.
 *
 * This is a local normalizer over already present bundle/producers artifacts.
 * It does not run scanners, fetch networks, mutate targets, or infer secret
 * values.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SCHEMA_VERSION = '0.1.0';

const FAMILIES = [
  'source_code',
  'documentation',
  'build_metadata',
  'dependency_metadata',
  'configuration',
  'deployment_model',
  'ci_cd',
  'runtime_observation',
  'catalog_descriptor',
  'duplication',
  'static_analysis',
  'search_index',
  'symbol_index',
  'semantic_index',
  'analysis_claim',
];

const EVIDENCE_STATES = new Set([
  'source-visible',
  'metadata-visible',
  'runtime-visible',
  'claim-only',
  'unknown',
  'cannot_verify',
  'not_assessed',
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
  family,
  evidence_layer,
  eligible_fact_kinds,
  resolution_limit,
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

function usage() {
  process.stderr.write('usage: evidence-promotion-atlas.js build <bundle-dir> [target-root]\n');
  process.stderr.write('       evidence-promotion-atlas.js validate <bundle-dir> [--completion]\n');
}

function readJSON(file) {
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function readJSONL(file) {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).flatMap((line) => {
    try {
      return [JSON.parse(line)];
    } catch {
      return [];
    }
  });
}

function writeJSON(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function writeJSONL(file, rows) {
  fs.writeFileSync(file, rows.map((row) => JSON.stringify(row)).join('\n') + (rows.length ? '\n' : ''));
}

function sha256File(file) {
  const h = crypto.createHash('sha256');
  h.update(fs.readFileSync(file));
  return h.digest('hex');
}

function hashText(text) {
  return crypto.createHash('sha256').update(String(text)).digest('hex').slice(0, 16);
}

function evidenceStateOr(value, fallback) {
  return EVIDENCE_STATES.has(value) ? value : fallback;
}

function walkFiles(root, limit = 5000) {
  const out = [];
  const stack = [root];
  while (stack.length && out.length < limit) {
    const dir = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const ent of entries) {
      if (ent.name === '.git' || ent.name === 'node_modules' || ent.name === '.portolan') continue;
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        stack.push(full);
      } else if (ent.isFile()) {
        out.push(full);
        if (out.length >= limit) break;
      }
    }
  }
  return out;
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
  if (/(^|\.)(env|ini|conf|config|properties|toml|yaml|yml|json)$/.test(base) || p.includes('/config/')) return ['configuration', 0.6];
  if (/^(package-lock|package|go\.mod|go\.sum|pom\.xml|build\.gradle|settings\.gradle|requirements\.txt|pyproject\.toml|cargo\.toml|cargo\.lock)$/.test(base)) return ['build_metadata', 0.8];
  if (/\.(proto|openapi\.json|openapi\.yaml|graphql|avsc)$/.test(base) || base === 'catalog-info.yaml') return ['catalog_descriptor', 0.75];
  if (/\.(go|js|jsx|ts|tsx|py|java|kt|scala|rb|php|rs|c|cc|cpp|h|hpp|cs)$/.test(base)) return ['runtime_product_code', 0.65];
  return ['unknown_role', 0.35];
}

function rawArtifact(bundleDir, file, producer, family, expansionMode = 'core') {
  const stats = fs.statSync(file);
  return {
    id: `raw-${hashText(`${family}:${file}`)}`,
    stratum: 'raw_evidence',
    evidence_layer: 'metadata',
    evidence_state: 'metadata-visible',
    family,
    producer,
    producer_ref: path.relative(bundleDir, file),
    path: path.relative(bundleDir, file),
    size_bytes: stats.size,
    mtime: stats.mtime.toISOString(),
    content_hash: stats.size <= 50 * 1024 * 1024 ? `sha256:${sha256File(file)}` : undefined,
    expansion_mode: expansionMode,
  };
}

function filesByGlob(dir, predicate) {
  if (!fs.existsSync(dir)) return [];
  return walkFiles(dir, 20000).filter(predicate);
}

function firstExisting(files) {
  return files.find((f) => fs.existsSync(f)) || '';
}

function classifySources(bundleDir, targetRoot) {
  const repos = readJSON(path.join(bundleDir, 'repos.json'));
  const roots = Array.isArray(repos) && repos.length
    ? repos.map((r) => r.path).filter(Boolean)
    : [targetRoot].filter(Boolean);
  const rows = [];
  for (const root of roots) {
    if (!root || !fs.existsSync(root)) continue;
    for (const file of walkFiles(root, 5000)) {
      const [role, confidence] = roleForPath(file);
      rows.push({
        id: `source-role-${hashText(file)}`,
        stratum: 'classified_source',
        family: 'source_code',
        evidence_layer: 'source',
        evidence_state: 'source-visible',
        path: file,
        source_role: role,
        confidence,
        classifier: 'portolan-minimal-path-rules',
        evidence_refs: [`source:${file}`],
      });
    }
  }
  return rows;
}

function familyInputs(bundleDir, targetRoot) {
  const producers = path.join(bundleDir, 'producers');
  const sourceFiles = targetRoot && fs.existsSync(targetRoot) ? walkFiles(targetRoot, 5000) : [];
  const byRole = Object.fromEntries(FAMILIES.map((f) => [f, []]));
  const add = (family, file) => {
    if (file && fs.existsSync(file)) byRole[family].push(file);
  };
  const addMany = (family, files) => files.forEach((f) => add(family, f));

  add('source_code', path.join(bundleDir, 'repos.json'));
  addMany('documentation', sourceFiles.filter((f) => /\.(md|rst|adoc|txt)$/i.test(f)));
  addMany('build_metadata', sourceFiles.filter((f) => /(^|\/)(package\.json|go\.mod|pom\.xml|build\.gradle|requirements\.txt|pyproject\.toml|Cargo\.toml)$/i.test(f)));
  addMany('configuration', sourceFiles.filter((f) => /(^|\/)(\.env|.*\.ya?ml|.*\.toml|.*\.properties|.*\.conf|.*config.*\.json)$/i.test(f)));
  addMany('deployment_model', sourceFiles.filter((f) => /(docker-compose\.ya?ml|\/helm\/|\/kubernetes\/|\.tf)$/i.test(f)));
  addMany('deployment_model', filesByGlob(path.join(producers, 'deployment-model'), (f) => /\.(json|jsonl|ya?ml)$/i.test(f)));
  addMany('ci_cd', sourceFiles.filter((f) => /(\/\.github\/workflows\/|\/\.gitlab-ci\.yml$|\/Jenkinsfile$)/i.test(f)));
  addMany('catalog_descriptor', sourceFiles.filter((f) => /(catalog-info\.ya?ml|openapi\.(json|ya?ml)|\.proto$|\.graphql$)/i.test(f)));
  addMany('catalog_descriptor', filesByGlob(path.join(producers, 'catalog'), (f) => /\.(json|jsonl|ya?ml|proto)$/i.test(f)));
  addMany('dependency_metadata', filesByGlob(path.join(producers, 'syft'), (f) => /cyclonedx.*\.json$/i.test(f)));
  addMany('duplication', filesByGlob(path.join(producers, 'jscpd'), (f) => f.endsWith('.json')));
  addMany('static_analysis', filesByGlob(path.join(producers, 'semgrep'), (f) => f.endsWith('.json')));
  add('search_index', path.join(bundleDir, 'search-index.jsonl'));
  add('symbol_index', path.join(bundleDir, 'symbol-index.jsonl'));
  addMany('semantic_index', filesByGlob(path.join(producers, 'semantic-index'), (f) => /\.(json|jsonl)$/i.test(f)));
  addMany('runtime_observation', filesByGlob(path.join(producers, 'runtime'), (f) => /\.(json|jsonl)$/i.test(f)));
  addMany('analysis_claim', [path.join(bundleDir, 'claims.jsonl')]);
  return byRole;
}

function healthRecord(family, status, reason, evidenceRefs, producerRef, extra = {}) {
  return {
    id: `promotion-health-${family}`,
    stratum: 'promotion_health',
    family,
    scope: 'bundle',
    fact_kind: 'family_route',
    status,
    evidence_state: status === 'cannot_verify' ? 'cannot_verify' : status === 'not_assessed' ? 'not_assessed' : 'metadata-visible',
    evidence_layer: status === 'not_assessed' ? 'unknown' : 'metadata',
    reason,
    observed_count: evidenceRefs.length,
    denominator: extra.denominator ?? null,
    threshold: extra.threshold ?? null,
    calculation_rule: extra.calculation_rule || 'family route has representative local input or terminal state',
    next_action: extra.next_action || '',
    producer: extra.producer || 'portolan-evidence-promotion-atlas',
    producer_ref: producerRef || evidenceRefs[0] || 'promotion-route',
    evidence_refs: evidenceRefs,
    route_proof: evidenceRefs.length > 0,
    ...extra,
  };
}

function build(bundleDir, targetRootArg) {
  const manifest = readJSON(path.join(bundleDir, 'manifest.json')) || {};
  const targetRoot = targetRootArg || manifest.target_root || process.cwd();
  const classified = classifySources(bundleDir, targetRoot);
  const inputs = familyInputs(bundleDir, targetRoot);
  const raw = [];
  for (const family of FAMILIES) {
    for (const file of inputs[family]) {
      if (file.startsWith(bundleDir) || file.includes(`${path.sep}producers${path.sep}`)) {
        raw.push(rawArtifact(bundleDir, file, 'existing-local-artifact', family, 'core'));
      }
    }
  }

  const roleCounts = classified.reduce((acc, row) => {
    acc[row.source_role] = (acc[row.source_role] || 0) + 1;
    return acc;
  }, {});
  const totalSources = classified.length;
  const discoveredFileCount = Number.isFinite(manifest.discovered_file_count)
    ? manifest.discovered_file_count
    : Number.isFinite(manifest.source_file_count)
      ? manifest.source_file_count
      : totalSources;
  const nonPromotable = (roleCounts.test_code || 0) + (roleCounts.test_artifact || 0) + (roleCounts.fixture_data || 0) + (roleCounts.generated_code || 0) + (roleCounts.vendor_code || 0);
  const fixtureish = (roleCounts.fixture_data || 0) + (roleCounts.test_artifact || 0);
  const lowConfidence = classified.filter((r) => r.confidence < THRESHOLDS.low_confidence_threshold || r.source_role === 'unknown_role').length;

  const health = FAMILIES.map((family) => {
    const refs = inputs[family].map((f) => path.relative(bundleDir, f));
    if (refs.length) {
      return healthRecord(family, 'ok', `Representative ${family} input is visible through a local route.`, refs, refs[0]);
    }
    return healthRecord(family, 'not_assessed', `Route for ${family} exists, but no representative input was supplied in this bundle.`, [], `route:${family}`, {
      next_action: `Provide local ${family} producer output or source artifact.`,
      route_proof: false,
    });
  });

  if (totalSources > 0) {
    if (nonPromotable / totalSources > THRESHOLDS.polluted_by_non_source_ratio) {
      health.push(healthRecord('source_code', 'polluted_by_non_source', 'Non-promotable source roles exceed 50 percent of classified files.', classified.filter((r) => ['test_code', 'test_artifact', 'fixture_data', 'generated_code', 'vendor_code'].includes(r.source_role)).map((r) => `source-role:${r.id}`), 'classified-sources.jsonl', {
        id: 'promotion-health-source-code-pollution',
        observed_count: nonPromotable,
        denominator: totalSources,
        threshold: THRESHOLDS.polluted_by_non_source_ratio,
        calculation_rule: 'non_promotable_source_roles / classified_source_records > 0.5',
      }));
    }
    if (fixtureish / totalSources > THRESHOLDS.dominated_by_fixture_data_ratio) {
      health.push(healthRecord('source_code', 'dominated_by_fixture_data', 'Fixture and test-artifact files exceed 35 percent of classified files.', classified.filter((r) => ['fixture_data', 'test_artifact'].includes(r.source_role)).map((r) => `source-role:${r.id}`), 'classified-sources.jsonl', {
        id: 'promotion-health-source-code-fixtures',
        observed_count: fixtureish,
        denominator: totalSources,
        threshold: THRESHOLDS.dominated_by_fixture_data_ratio,
        calculation_rule: '(fixture_data + test_artifact) / classified_source_records > 0.35',
      }));
    }
    if (lowConfidence / totalSources > THRESHOLDS.low_confidence_ratio) {
      health.push(healthRecord('source_code', 'non_exhaustive', 'Low-confidence or unknown source roles exceed 10 percent of classified files.', classified.filter((r) => r.confidence < THRESHOLDS.low_confidence_threshold || r.source_role === 'unknown_role').map((r) => `source-role:${r.id}`), 'classified-sources.jsonl', {
        id: 'promotion-health-source-code-low-confidence',
        observed_count: lowConfidence,
        denominator: totalSources,
        threshold: THRESHOLDS.low_confidence_ratio,
        calculation_rule: 'low_confidence_or_unknown_role / classified_source_records > 0.1',
      }));
    }
    const mismatchCount = Math.abs(discoveredFileCount - totalSources);
    const mismatchThreshold = Math.max(1, Math.min(Math.ceil(discoveredFileCount * THRESHOLDS.inventory_mismatch_ratio), THRESHOLDS.inventory_mismatch_max_threshold_count));
    if (mismatchCount > mismatchThreshold) {
      health.push(healthRecord('source_code', 'inventory_mismatch', 'Discovered file count and classified source count differ beyond the allowed threshold.', ['classified-sources.jsonl'], 'classified-sources.jsonl', {
        id: 'promotion-health-source-code-inventory-mismatch',
        observed_count: mismatchCount,
        denominator: discoveredFileCount,
        threshold: mismatchThreshold,
        calculation_rule: 'abs(discovered_file_count - classified_source_count) > max(1, min(ceil(discovered_file_count * 0.01), 100))',
        discovered_file_count: discoveredFileCount,
        classified_file_count: totalSources,
      }));
    }
  }

  const sourceSnapshotAt = Date.parse(manifest.source_snapshot_at || manifest.source_snapshot_time || '');
  const symbolRows = readJSONL(path.join(bundleDir, 'symbol-index.jsonl'));
  if (symbolRows.length > 0) {
    const classifiedSymbolRows = symbolRows.map((row) => {
      const [role, confidence] = roleForPath(row.path || '');
      return { row, role, confidence };
    });
    const symbolNonPromotable = classifiedSymbolRows.filter((item) =>
      item.confidence < THRESHOLDS.low_confidence_threshold ||
      ['test_code', 'test_artifact', 'fixture_data', 'generated_code', 'vendor_code', 'configuration', 'deployment_model', 'build_metadata', 'ci_cd', 'documentation', 'unknown_role'].includes(item.role)
    ).length;
    const symbolFixtureish = classifiedSymbolRows.filter((item) => ['fixture_data', 'test_artifact'].includes(item.role)).length;
    if (symbolNonPromotable / symbolRows.length > THRESHOLDS.polluted_by_non_source_ratio) {
      health.push(healthRecord('symbol_index', 'polluted_by_non_source', 'Non-promotable source roles exceed 50 percent of symbol-index rows.', ['symbol-index.jsonl'], 'symbol-index.jsonl', {
        id: 'promotion-health-symbol-index-pollution',
        observed_count: symbolNonPromotable,
        denominator: symbolRows.length,
        threshold: THRESHOLDS.polluted_by_non_source_ratio,
        calculation_rule: 'non_promotable_symbol_row_roles / symbol_index_rows > 0.5',
      }));
    }
    if (symbolFixtureish / symbolRows.length > THRESHOLDS.dominated_by_fixture_data_ratio) {
      health.push(healthRecord('symbol_index', 'dominated_by_fixture_data', 'Fixture and test-artifact paths exceed 35 percent of symbol-index rows.', ['symbol-index.jsonl'], 'symbol-index.jsonl', {
        id: 'promotion-health-symbol-index-fixtures',
        observed_count: symbolFixtureish,
        denominator: symbolRows.length,
        threshold: THRESHOLDS.dominated_by_fixture_data_ratio,
        calculation_rule: '(fixture_data + test_artifact symbol rows) / symbol_index_rows > 0.35',
      }));
    }
  }

  for (const artifact of raw) {
    if (artifact.size_bytes >= THRESHOLDS.oversized_artifact_bytes) {
      health.push(healthRecord(artifact.family, 'oversized', `Raw artifact ${artifact.path} is at least 100 MiB.`, [artifact.path], artifact.path, {
        id: `promotion-health-oversized-${hashText(artifact.path)}`,
        observed_count: artifact.size_bytes,
        threshold: THRESHOLDS.oversized_artifact_bytes,
        calculation_rule: 'raw_artifact_size_bytes >= 100 MiB',
      }));
    }
    if (Number.isFinite(sourceSnapshotAt) && artifact.mtime && Date.parse(artifact.mtime) < sourceSnapshotAt) {
      health.push(healthRecord(artifact.family, 'stale', `Raw artifact ${artifact.path} is older than the declared source snapshot.`, [artifact.path], artifact.path, {
        id: `promotion-health-stale-${hashText(artifact.path)}`,
        observed_count: Date.parse(artifact.mtime),
        denominator: sourceSnapshotAt,
        calculation_rule: 'raw_artifact_mtime < manifest.source_snapshot_at',
        source_snapshot_at: manifest.source_snapshot_at || manifest.source_snapshot_time,
        artifact_mtime: artifact.mtime,
      }));
    }
  }

  for (const catalogFile of inputs.catalog_descriptor || []) {
    const catalogRows = catalogFile.endsWith('.jsonl') ? readJSONL(catalogFile) : [readJSON(catalogFile)].filter(Boolean);
    for (const row of catalogRows) {
      const unresolved = row.unresolved_relations || row.unresolved_relationships || [];
      if (Array.isArray(unresolved) && unresolved.length > 0) {
        health.push(healthRecord('catalog_descriptor', 'cannot_verify', 'Catalog descriptor contains unresolved local relationship references.', [path.relative(bundleDir, catalogFile)], path.relative(bundleDir, catalogFile), {
          id: `promotion-health-catalog-unresolved-${hashText(catalogFile)}`,
          observed_count: unresolved.length,
          denominator: unresolved.length,
          calculation_rule: 'descriptor unresolved_relations length > 0',
          unresolved_relations: unresolved,
        }));
      }
    }
  }

  const promoted = [];
  const roleByPath = new Map(classified.map((r) => [path.resolve(r.path), r]));
  for (const row of classified.filter((r) => r.source_role === 'runtime_product_code' && r.confidence >= 0.5).slice(0, 200)) {
    promoted.push({
      id: `fact-source-role-${hashText(row.path)}`,
      stratum: 'promoted_fact',
      family: 'source_code',
      fact_kind: 'source_role',
      evidence_layer: 'source',
      evidence_state: 'source-visible',
      source_refs: [`source-role:${row.id}`],
      producer: 'portolan-evidence-promotion-atlas',
      producer_ref: 'classified-sources.jsonl',
      promotion_basis: `classified_source role=${row.source_role} confidence=${row.confidence}`,
      resolution_limit: PROMOTION_MATRIX.find((m) => m.family === 'source_code').resolution_limit,
      path: row.path,
      source_role: row.source_role,
      confidence: row.confidence,
    });
    promoted.push({
      id: `fact-source-file-${hashText(row.path)}`,
      stratum: 'promoted_fact',
      family: 'source_code',
      fact_kind: 'file_inventory',
      evidence_layer: 'source',
      evidence_state: 'source-visible',
      source_refs: [`source-role:${row.id}`],
      producer: 'portolan-evidence-promotion-atlas',
      producer_ref: 'classified-sources.jsonl',
      promotion_basis: `classified_source role=${row.source_role} confidence=${row.confidence}`,
      resolution_limit: PROMOTION_MATRIX.find((m) => m.family === 'source_code').resolution_limit,
      path: row.path,
    });
  }

  for (const row of readJSONL(path.join(bundleDir, 'symbol-index.jsonl')).slice(0, 200)) {
    const absolute = row.path && path.isAbsolute(row.path) ? path.resolve(row.path) : '';
    const role = absolute ? roleByPath.get(absolute) : null;
    promoted.push({
      id: `fact-symbol-definition-${hashText(`${row.repo_id}:${row.path}:${row.line}:${row.name}`)}`,
      stratum: 'promoted_fact',
      family: 'symbol_index',
      fact_kind: 'definition',
      evidence_layer: 'metadata',
      evidence_state: evidenceStateOr(row.evidence_state, 'metadata-visible'),
      source_refs: [role ? `source-role:${role.id}` : `symbol-index:${row.repo_id || ''}:${row.path}:${row.line}:${row.name}`],
      producer: row.producer || 'ctags',
      producer_ref: 'symbol-index.jsonl',
      promotion_basis: role ? `symbol row plus source role ${role.source_role}` : 'symbol row; source role unavailable in bundle',
      resolution_limit: PROMOTION_MATRIX.find((m) => m.family === 'symbol_index').resolution_limit,
      path: row.path,
      name: row.name,
      line: row.line,
    });
  }

  for (const claim of readJSONL(path.join(bundleDir, 'claims.jsonl')).slice(0, 200)) {
    promoted.push({
      id: `claim-record-${claim.id || hashText(claim.statement || '')}`,
      stratum: 'claim',
      family: 'analysis_claim',
      fact_kind: 'claim_record',
      evidence_layer: 'claim',
      evidence_state: 'claim-only',
      source_refs: claim.cited_refs || [],
      producer: 'import-analysis-claims',
      producer_ref: 'claims.jsonl',
      promotion_basis: 'accepted claim import with resolved cited refs; no promoted fact is created from statement text',
      resolution_limit: PROMOTION_MATRIX.find((m) => m.family === 'analysis_claim').resolution_limit,
      statement: claim.statement || '',
    });
  }

  const familyRegistry = {
    schema_version: SCHEMA_VERSION,
    families: FAMILIES.map((id) => ({ id })),
    health_statuses: [
      'ok',
      'partial',
      'non_exhaustive',
      'oversized',
      'dominated_by_fixture_data',
      'polluted_by_non_source',
      'stale',
      'inventory_mismatch',
      'raw_available_only',
      'unsupported_language',
      'not_integrated',
      'cannot_verify',
      'not_assessed',
    ],
    thresholds: THRESHOLDS,
  };

  writeJSON(path.join(bundleDir, 'evidence-families.json'), familyRegistry);
  writeJSON(path.join(bundleDir, 'promotion-matrix.json'), { schema_version: SCHEMA_VERSION, records: PROMOTION_MATRIX });
  writeJSONL(path.join(bundleDir, 'classified-sources.jsonl'), classified);
  writeJSONL(path.join(bundleDir, 'raw-artifacts.jsonl'), raw);
  writeJSONL(path.join(bundleDir, 'promotion-health.jsonl'), health);
  writeJSONL(path.join(bundleDir, 'promoted-facts.jsonl'), promoted);

  const byStatus = health.reduce((acc, row) => {
    acc[row.status] = (acc[row.status] || 0) + 1;
    return acc;
  }, {});
  const summary = {
    canonical_family_count: FAMILIES.length,
    health_record_count: health.length,
    classified_source_count: classified.length,
    promoted_fact_count: promoted.length,
    raw_artifact_count: raw.length,
    statuses: byStatus,
    unsupported_family_count: health.filter((r) => r.status === 'not_integrated').length,
    not_assessed_family_count: FAMILIES.filter((f) => health.find((r) => r.id === `promotion-health-${f}`)?.status === 'not_assessed').length,
  };
  writeJSON(path.join(bundleDir, 'promotion-summary.json'), { schema_version: SCHEMA_VERSION, ...summary });

  const manifestPath = path.join(bundleDir, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    const updated = { ...manifest, promotion_health: summary };
    writeJSON(manifestPath, updated);
  }
}

function validate(bundleDir, completion) {
  const registry = readJSON(path.join(bundleDir, 'evidence-families.json'));
  const health = readJSONL(path.join(bundleDir, 'promotion-health.jsonl'));
  const promoted = readJSONL(path.join(bundleDir, 'promoted-facts.jsonl'));
  const matrix = readJSON(path.join(bundleDir, 'promotion-matrix.json'));
  const errors = [];

  if (!registry || !Array.isArray(registry.families)) errors.push('missing evidence-families.json registry');
  if (!Array.isArray(matrix?.records)) errors.push('missing promotion-matrix.json records');
  if (!health.length) errors.push('missing promotion-health.jsonl records');

  const healthByFamily = new Map();
  for (const row of health) {
    if (row.stratum !== 'promotion_health') errors.push(`health ${row.id || '?'} missing stratum=promotion_health`);
    if (!row.family) errors.push(`health ${row.id || '?'} missing family`);
    if (!row.status) errors.push(`health ${row.id || '?'} missing status`);
    if (!row.producer_ref) errors.push(`health ${row.id || '?'} missing producer_ref`);
    if (row.id === `promotion-health-${row.family}`) healthByFamily.set(row.family, row);
  }
  for (const family of FAMILIES) {
    if (!healthByFamily.has(family)) errors.push(`missing bundle-level health for canonical family ${family}`);
  }
  for (const row of promoted) {
    for (const field of ['stratum', 'family', 'fact_kind', 'evidence_layer', 'evidence_state', 'source_refs', 'producer', 'producer_ref', 'promotion_basis', 'resolution_limit']) {
      if (row[field] === undefined || row[field] === null || row[field] === '') errors.push(`promoted/claim record ${row.id || '?'} missing ${field}`);
    }
    if (row.stratum === 'promoted_fact' && row.evidence_layer === 'claim') errors.push(`promoted fact ${row.id || '?'} uses claim evidence layer`);
  }
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
  if (errors.length) {
    errors.forEach((e) => process.stderr.write(`validate-evidence-promotion-atlas: ${e}\n`));
    process.exit(1);
  }
  process.stdout.write('validate-evidence-promotion-atlas: ok\n');
}

const [cmd, bundleArg, ...rest] = process.argv.slice(2);
if (!cmd || !bundleArg || ['-h', '--help'].includes(cmd)) {
  usage();
  process.exit(cmd ? 0 : 2);
}
const bundleDir = path.resolve(bundleArg);
if (cmd === 'build') {
  build(bundleDir, rest[0] ? path.resolve(rest[0]) : '');
} else if (cmd === 'validate') {
  validate(bundleDir, rest.includes('--completion'));
} else {
  usage();
  process.exit(2);
}
