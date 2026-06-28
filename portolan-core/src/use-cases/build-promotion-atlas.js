/**
 * Use-case: build the evidence-promotion atlas artifacts.
 *
 * Reads bundle artifacts via the reader port + enumerates target sources via
 * the source-inventory port, classifies roles (domain), computes promotion
 * health, shapes promoted facts (buffered), and returns the artifact set for
 * the driver to persist. No fs/child_process inside — all I/O crosses ports.
 *
 * Mirrors the legacy viewer/scripts/evidence-promotion-atlas.js build() body,
 * byte-faithful except the symbol-index parse-error count (low-value signal;
 * reader.iterateJsonl skips malformed lines silently).
 *
 * Use-case layer — depends on domain + ports (via args).
 */
'use strict';

const path = require('path');
const P = require('../domain/promotion-atlas');

function classifySources(reader, inventory, targetRoot, bundlePath) {
  const repos = reader.readJson('repos.json');
  const roots = Array.isArray(repos) && repos.length
    ? repos.map((r) => r.path).filter(Boolean)
    : [targetRoot].filter(Boolean);
  const rows = [];
  const inventories = [];
  for (const root of roots) {
    if (!root) continue;
    const inv = inventory.listRepoFiles(root);
    inventories.push(inv);
    for (const file of inv.files) {
      const [role, confidence] = P.roleForPath(file);
      rows.push({
        id: `source-role-${P.hashText(file)}`,
        stratum: 'classified_source', family: 'source_code',
        evidence_layer: 'source', evidence_state: 'source-visible',
        path: file, source_role: role, confidence,
        classifier: 'portolan-minimal-path-rules', evidence_refs: [`source:${file}`],
      });
    }
  }
  return { rows, inventories };
}

function familyInputs(reader, classifiedSources, bundlePath) {
  const sourceFiles = classifiedSources.map((row) => row.path);
  const byRole = Object.fromEntries(P.FAMILIES.map((f) => [f, []]));
  const addBundle = (family, name) => { if (reader.exists(name)) byRole[family].push(path.join(bundlePath, name)); };
  const addMany = (family, files) => files.forEach((f) => { if (f && reader.exists(path.relative(bundlePath, f)) === false && false) ; byRole[family].push(f); });

  addBundle('source_code', 'repos.json');
  addBundle('source_code', 'source-inventory.json');
  sourceFiles.filter((f) => /\.(md|rst|adoc|txt)$/i.test(f)).forEach((f) => byRole['documentation'].push(f));
  sourceFiles.filter((f) => /(^|\/)(package\.json|go\.mod|pom\.xml|build\.gradle|requirements\.txt|pyproject\.toml|Cargo\.toml)$/i.test(f)).forEach((f) => byRole['build_metadata'].push(f));
  sourceFiles.filter((f) => /(^|\/)(\.env|.*\.ya?ml|.*\.toml|.*\.properties|.*\.conf|.*config.*\.json)$/i.test(f)).forEach((f) => byRole['configuration'].push(f));
  sourceFiles.filter((f) => /(docker-compose\.ya?ml|\/helm\/|\/kubernetes\/|\.tf)$/i.test(f)).forEach((f) => byRole['deployment_model'].push(f));
  reader.listProducerFiles('deployment-model', (f) => /\.(json|jsonl|ya?ml)$/i.test(f)).forEach((rel) => byRole['deployment_model'].push(path.join(bundlePath, rel)));
  sourceFiles.filter((f) => /(\/\.github\/workflows\/|\/\.gitlab-ci\.yml$|\/Jenkinsfile$)/i.test(f)).forEach((f) => byRole['ci_cd'].push(f));
  sourceFiles.filter((f) => /(catalog-info\.ya?ml|openapi\.(json|ya?ml)|\.proto$|\.graphql$)/i.test(f)).forEach((f) => byRole['catalog_descriptor'].push(f));
  reader.listProducerFiles('catalog', (f) => /\.(json|jsonl|ya?ml|proto)$/i.test(f)).forEach((rel) => byRole['catalog_descriptor'].push(path.join(bundlePath, rel)));
  reader.listProducerFiles('syft', (f) => /cyclonedx.*\.json$/i.test(f)).forEach((rel) => byRole['dependency_metadata'].push(path.join(bundlePath, rel)));
  reader.listProducerFiles('jscpd', (f) => f.endsWith('.json')).forEach((rel) => byRole['duplication'].push(path.join(bundlePath, rel)));
  reader.listProducerFiles('semgrep', (f) => f.endsWith('.json')).forEach((rel) => byRole['static_analysis'].push(path.join(bundlePath, rel)));
  addBundle('search_index', 'search-index.jsonl');
  addBundle('symbol_index', 'symbol-index.jsonl');
  reader.listProducerFiles('semantic-index', (f) => /\.(json|jsonl)$/i.test(f)).forEach((rel) => byRole['semantic_index'].push(path.join(bundlePath, rel)));
  reader.listProducerFiles('runtime', (f) => /\.(json|jsonl)$/i.test(f)).forEach((rel) => byRole['runtime_observation'].push(path.join(bundlePath, rel)));
  addBundle('analysis_claim', 'claims.jsonl');
  return byRole;
}

function buildPromotionAtlas({ reader, inventory, targetRoot, generatedAt, limits }) {
  const sourceClassificationLimit = (limits && limits.sourceClassificationLimit) || Number.POSITIVE_INFINITY;
  const promotedFactRowLimit = (limits && limits.promotedFactRowLimit) || 200;
  const querySampleLimit = (limits && limits.querySampleLimit) || 200;
  const bundlePath = reader.bundleDir;
  const genAt = generatedAt || new Date().toISOString();

  const manifest = reader.readJson('manifest.json') || {};
  const resolvedTargetRoot = targetRoot || manifest.target_root || process.cwd();
  const sourceClassification = classifySources(reader, inventory, resolvedTargetRoot, bundlePath);
  const classified = sourceClassification.rows;
  const sourceInventoryRecords = sourceClassification.inventories.map((inv) => ({
    id: `source-inventory-${P.hashText(path.resolve(inv.root || ''))}`,
    root: path.resolve(inv.root || ''),
    inventory_source: inv.inventory_source || 'unknown',
    total_file_count: inv.total || 0,
    classified_file_count: (inv.files || []).length,
    truncated: Boolean(inv.truncated),
    fallback: Boolean(inv.fallback),
    source_classification_limit: sourceClassificationLimit,
    expansion_mode: inv.truncated ? 'query_source_root' : 'classified_sources_rows',
    resolution_limit: inv.truncated
      ? 'Portolan retained a bounded classified source sample. Use the local source root or raise PORTOLAN_EVIDENCE_SOURCE_CLASSIFICATION_LIMIT for exhaustive source-role rows.'
      : 'classified-sources.jsonl retains the source-role rows for this root within the configured limit.',
  }));

  const inputs = familyInputs(reader, classified, bundlePath);
  const raw = [];
  for (const family of P.FAMILIES) {
    for (const file of inputs[family]) {
      const rel = path.relative(bundlePath, file);
      const isBundle = file.startsWith(bundlePath) || rel.startsWith('producers') || rel.includes(`${path.sep}producers${path.sep}`);
      if (!isBundle) continue;
      const stat = reader.stat(rel);
      if (!stat) continue;
      const contentHash = reader.sha256(rel);
      const stats = { size: stat.size, mtime: new Date(stat.mtimeMs).toISOString() };
      raw.push(P.shapeRawArtifact(bundlePath, file, 'existing-local-artifact', family, stats, contentHash, 'core'));
    }
  }
  raw.push(...sourceClassification.inventories.map((inv) => P.sourceInventoryRawArtifact(bundlePath, inv)));

  const roleCounts = classified.reduce((acc, row) => { acc[row.source_role] = (acc[row.source_role] || 0) + 1; return acc; }, {});
  const totalSources = classified.length;
  const inventoryDiscoveredFileCount = sourceClassification.inventories.reduce((sum, inv) => sum + inv.total, 0);
  const discoveredFileCount = Number.isFinite(manifest.discovered_file_count)
    ? manifest.discovered_file_count
    : Number.isFinite(manifest.source_file_count)
      ? manifest.source_file_count
      : inventoryDiscoveredFileCount || totalSources;
  const nonPromotable = (roleCounts.test_code || 0) + (roleCounts.test_artifact || 0) + (roleCounts.fixture_data || 0) + (roleCounts.generated_code || 0) + (roleCounts.vendor_code || 0);
  const fixtureish = (roleCounts.test_code || 0) + (roleCounts.fixture_data || 0) + (roleCounts.test_artifact || 0);
  const lowConfidence = classified.filter((r) => r.confidence < P.THRESHOLDS.low_confidence_threshold || r.source_role === 'unknown_role').length;

  const health = P.FAMILIES.map((family) => {
    const refs = inputs[family].map((f) => path.relative(bundlePath, f));
    if (refs.length) {
      if (!P.PROMOTED_ROUTE_FAMILIES.has(family)) {
        return P.healthRecord(family, 'raw_available_only', `Representative ${family} input is addressable, but this slice has no promoted fact route for that family.`, refs, refs[0], { next_action: `Keep ${family} as raw/queryable input until a reviewed promotion route is implemented.` });
      }
      return P.healthRecord(family, 'ok', `Representative ${family} input is visible through a local promotion route.`, refs, refs[0]);
    }
    return P.healthRecord(family, 'not_assessed', `Route for ${family} exists, but no representative input was supplied in this bundle.`, [], `route:${family}`, { next_action: `Provide local ${family} producer output or source artifact.`, route_proof: false });
  });

  for (const inv of sourceClassification.inventories) {
    if (inv.fallback) {
      health.push(P.truncationHealth('source_code', `promotion-health-source-code-inventory-fallback-${P.hashText(inv.root)}`, `Source inventory for ${inv.root} used conservative filesystem fallback instead of git ls-files --exclude-standard.`, inv.files.length, null, null, [`source-inventory:${inv.root}`], 'classified-sources.jsonl', 'git ls-files -co --exclude-standard unavailable; fallback ignore rules are conservative', 'Run inside a Git worktree or provide a repos.json root with Git metadata.'));
    }
    if (inv.truncated) {
      health.push(P.truncationHealth('source_code', `promotion-health-source-code-inventory-truncated-${P.hashText(inv.root)}`, `Source inventory for ${inv.root} exceeded the classification limit.`, inv.files.length, inv.total, sourceClassificationLimit, [`source-inventory:${inv.root}`], 'classified-sources.jsonl', 'inventory_file_count > PORTOLAN_EVIDENCE_SOURCE_CLASSIFICATION_LIMIT', 'Increase PORTOLAN_EVIDENCE_SOURCE_CLASSIFICATION_LIMIT or shard the target before relying on completeness.'));
    }
  }

  if (totalSources > 0) {
    if (nonPromotable / totalSources > P.THRESHOLDS.polluted_by_non_source_ratio) {
      health.push(P.healthRecord('source_code', 'polluted_by_non_source', 'Non-promotable source roles exceed 50 percent of classified files.', classified.filter((r) => ['test_code', 'test_artifact', 'fixture_data', 'generated_code', 'vendor_code'].includes(r.source_role)).map((r) => `source-role:${r.id}`), 'classified-sources.jsonl', { id: 'promotion-health-source-code-pollution', observed_count: nonPromotable, denominator: totalSources, threshold: P.THRESHOLDS.polluted_by_non_source_ratio, calculation_rule: 'non_promotable_source_roles / classified_source_records > 0.5' }));
    }
    if (fixtureish / totalSources > P.THRESHOLDS.dominated_by_fixture_data_ratio) {
      health.push(P.healthRecord('source_code', 'dominated_by_fixture_data', 'Test, fixture, and test-artifact files exceed 35 percent of classified files.', classified.filter((r) => ['test_code', 'fixture_data', 'test_artifact'].includes(r.source_role)).map((r) => `source-role:${r.id}`), 'classified-sources.jsonl', { id: 'promotion-health-source-code-fixtures', observed_count: fixtureish, denominator: totalSources, threshold: P.THRESHOLDS.dominated_by_fixture_data_ratio, calculation_rule: '(test_code + fixture_data + test_artifact) / classified_source_records > 0.35' }));
    }
    if (lowConfidence / totalSources > P.THRESHOLDS.low_confidence_ratio) {
      health.push(P.healthRecord('source_code', 'non_exhaustive', 'Low-confidence or unknown source roles exceed 10 percent of classified files.', classified.filter((r) => r.confidence < P.THRESHOLDS.low_confidence_threshold || r.source_role === 'unknown_role').map((r) => `source-role:${r.id}`), 'classified-sources.jsonl', { id: 'promotion-health-source-code-low-confidence', observed_count: lowConfidence, denominator: totalSources, threshold: P.THRESHOLDS.low_confidence_ratio, calculation_rule: 'low_confidence_or_unknown_role / classified_source_records > 0.1' }));
    }
    const mismatchCount = Math.abs(discoveredFileCount - totalSources);
    const mismatchThreshold = Math.max(1, Math.min(Math.ceil(discoveredFileCount * P.THRESHOLDS.inventory_mismatch_ratio), P.THRESHOLDS.inventory_mismatch_max_threshold_count));
    if (mismatchCount > mismatchThreshold) {
      health.push(P.healthRecord('source_code', 'inventory_mismatch', 'Discovered file count and classified source count differ beyond the allowed threshold.', ['classified-sources.jsonl'], 'classified-sources.jsonl', { id: 'promotion-health-source-code-inventory-mismatch', observed_count: mismatchCount, denominator: discoveredFileCount, threshold: mismatchThreshold, calculation_rule: 'abs(discovered_file_count - classified_source_count) > max(1, min(ceil(discovered_file_count * 0.01), 100))', discovered_file_count: discoveredFileCount, classified_file_count: totalSources }));
    }
  }

  // Symbol-index stats pass (parse_errors signal lost; reader skips malformed).
  const sourceSnapshotAt = Date.parse(manifest.source_snapshot_at || manifest.source_snapshot_time || '');
  let symbolNonPromotable = 0;
  let symbolFixtureish = 0;
  let symbolCount = 0;
  if (reader.exists('symbol-index.jsonl')) {
    for (const row of reader.iterateJsonl('symbol-index.jsonl')) {
      symbolCount += 1;
      const [role] = P.roleForPath(row.path || '');
      if (['test_code', 'test_artifact', 'fixture_data', 'generated_code', 'vendor_code', 'configuration', 'deployment_model', 'build_metadata', 'ci_cd', 'documentation', 'unknown_role'].includes(role)) symbolNonPromotable += 1;
      if (['test_code', 'fixture_data', 'test_artifact'].includes(role)) symbolFixtureish += 1;
    }
  }
  if (symbolCount > 0) {
    if (symbolNonPromotable / symbolCount > P.THRESHOLDS.polluted_by_non_source_ratio) {
      health.push(P.healthRecord('symbol_index', 'polluted_by_non_source', 'Non-promotable source roles exceed 50 percent of symbol-index rows.', ['symbol-index.jsonl'], 'symbol-index.jsonl', { id: 'promotion-health-symbol-index-pollution', observed_count: symbolNonPromotable, denominator: symbolCount, threshold: P.THRESHOLDS.polluted_by_non_source_ratio, calculation_rule: 'non_promotable_symbol_row_roles / symbol_index_rows > 0.5' }));
    }
    if (symbolFixtureish / symbolCount > P.THRESHOLDS.dominated_by_fixture_data_ratio) {
      health.push(P.healthRecord('symbol_index', 'dominated_by_fixture_data', 'Test, fixture, and test-artifact paths exceed 35 percent of symbol-index rows.', ['symbol-index.jsonl'], 'symbol-index.jsonl', { id: 'promotion-health-symbol-index-fixtures', observed_count: symbolFixtureish, denominator: symbolCount, threshold: P.THRESHOLDS.dominated_by_fixture_data_ratio, calculation_rule: '(test_code + fixture_data + test_artifact symbol rows) / symbol_index_rows > 0.35' }));
    }
  }

  for (const artifact of raw) {
    if (artifact.size_bytes >= P.THRESHOLDS.oversized_artifact_bytes) {
      health.push(P.healthRecord(artifact.family, 'oversized', `Raw artifact ${artifact.path} is at least 100 MiB.`, [artifact.path], artifact.path, { id: `promotion-health-oversized-${P.hashText(artifact.path)}`, observed_count: artifact.size_bytes, threshold: P.THRESHOLDS.oversized_artifact_bytes, calculation_rule: 'raw_artifact_size_bytes >= 100 MiB' }));
    }
    if (Number.isFinite(sourceSnapshotAt) && artifact.mtime && Date.parse(artifact.mtime) < sourceSnapshotAt) {
      health.push(P.healthRecord(artifact.family, 'stale', `Raw artifact ${artifact.path} is older than the declared source snapshot.`, [artifact.path], artifact.path, { id: `promotion-health-stale-${P.hashText(artifact.path)}`, observed_count: Date.parse(artifact.mtime), denominator: sourceSnapshotAt, calculation_rule: 'raw_artifact_mtime < manifest.source_snapshot_at', source_snapshot_at: manifest.source_snapshot_at || manifest.source_snapshot_time, artifact_mtime: artifact.mtime }));
    }
  }

  const rawByFamily = raw.reduce((acc, artifact) => {
    const row = acc[artifact.family] || { size: 0, refs: [] };
    row.size += artifact.size_bytes; row.refs.push(artifact.path); acc[artifact.family] = row; return acc;
  }, {});
  for (const [family, totals] of Object.entries(rawByFamily)) {
    if (totals.size >= P.THRESHOLDS.oversized_family_bytes) {
      health.push(P.healthRecord(family, 'oversized', `Raw artifacts for ${family} total at least 500 MiB.`, totals.refs, 'raw-artifacts.jsonl', { id: `promotion-health-oversized-family-${family}`, observed_count: totals.size, denominator: totals.refs.length, threshold: P.THRESHOLDS.oversized_family_bytes, calculation_rule: 'sum(raw_artifact_size_bytes by family) >= 500 MiB' }));
    }
  }

  for (const catalogFile of inputs.catalog_descriptor || []) {
    const rel = path.relative(bundlePath, catalogFile);
    const catalogRows = rel.endsWith('.jsonl') ? reader.readJsonl(rel) : [reader.readJson(rel)].filter(Boolean);
    for (const row of catalogRows) {
      const unresolved = row.unresolved_relations || row.unresolved_relationships || [];
      if (Array.isArray(unresolved) && unresolved.length > 0) {
        health.push(P.healthRecord('catalog_descriptor', 'cannot_verify', 'Catalog descriptor contains unresolved local relationship references.', [rel], rel, { id: `promotion-health-catalog-unresolved-${P.hashText(catalogFile)}`, observed_count: unresolved.length, denominator: unresolved.length, calculation_rule: 'descriptor unresolved_relations length > 0', unresolved_relations: unresolved }));
      }
    }
  }

  // Promoted facts (buffered, bounded).
  const promoted = [];
  const queryIndex = P.createPromotionQueryIndex(querySampleLimit, genAt);
  const writePromotedFact = (row) => { promoted.push(row); queryIndex.addRow('promoted-facts.jsonl', row); };
  const roleByPath = new Map(classified.map((r) => [path.resolve(r.path), r]));
  const sourcePromotionCandidates = classified.filter((r) => r.source_role === 'runtime_product_code' && r.confidence >= 0.5);
  if (sourcePromotionCandidates.length > promotedFactRowLimit) {
    health.push(P.truncationHealth('source_code', 'promotion-health-source-code-promoted-facts-truncated', 'Promoted source facts exceeded the per-family row limit.', promotedFactRowLimit, sourcePromotionCandidates.length, promotedFactRowLimit, ['classified-sources.jsonl'], 'promoted-facts.jsonl', 'runtime_product_code_source_candidate_count > PORTOLAN_EVIDENCE_PROMOTED_FACT_LIMIT', 'Query classified-sources.jsonl or raise PORTOLAN_EVIDENCE_PROMOTED_FACT_LIMIT before treating promoted source facts as exhaustive.'));
  }
  for (const row of sourcePromotionCandidates.slice(0, promotedFactRowLimit)) {
    writePromotedFact({ id: `fact-source-role-${P.hashText(row.path)}`, stratum: 'promoted_fact', family: 'source_code', fact_kind: 'source_role', evidence_layer: 'source', evidence_state: 'source-visible', source_refs: [`source-role:${row.id}`], producer: 'portolan-evidence-promotion-atlas', producer_ref: 'classified-sources.jsonl', promotion_basis: `classified_source role=${row.source_role} confidence=${row.confidence}`, resolution_limit: P.PROMOTION_MATRIX.find((m) => m.family === 'source_code').resolution_limit, path: row.path, source_role: row.source_role, confidence: row.confidence });
    writePromotedFact({ id: `fact-source-file-${P.hashText(row.path)}`, stratum: 'promoted_fact', family: 'source_code', fact_kind: 'file_inventory', evidence_layer: 'source', evidence_state: 'source-visible', source_refs: [`source-role:${row.id}`], producer: 'portolan-evidence-promotion-atlas', producer_ref: 'classified-sources.jsonl', promotion_basis: `classified_source role=${row.source_role} confidence=${row.confidence}`, resolution_limit: P.PROMOTION_MATRIX.find((m) => m.family === 'source_code').resolution_limit, path: row.path });
  }

  if (symbolCount > promotedFactRowLimit) {
    health.push(P.truncationHealth('symbol_index', 'promotion-health-symbol-index-promoted-facts-truncated', 'Promoted symbol facts exceeded the per-family row limit.', promotedFactRowLimit, symbolCount, promotedFactRowLimit, ['symbol-index.jsonl'], 'promoted-facts.jsonl', 'symbol_index_row_count > PORTOLAN_EVIDENCE_PROMOTED_FACT_LIMIT', 'Query symbol-index.jsonl or raise PORTOLAN_EVIDENCE_PROMOTED_FACT_LIMIT before treating promoted symbol facts as exhaustive.'));
  }
  if (reader.exists('symbol-index.jsonl') && promotedFactRowLimit > 0) {
    let index = 0;
    for (const row of reader.iterateJsonl('symbol-index.jsonl')) {
      index += 1;
      if (index > promotedFactRowLimit) break;
      const absolute = row.path && path.isAbsolute(row.path) ? path.resolve(row.path) : '';
      const role = absolute ? roleByPath.get(absolute) : null;
      writePromotedFact({ id: `fact-symbol-definition-${P.hashText(`${row.repo_id}:${row.path}:${row.line}:${row.name}`)}`, stratum: 'promoted_fact', family: 'symbol_index', fact_kind: 'definition', evidence_layer: 'metadata', evidence_state: P.evidenceStateOr(row.evidence_state, 'metadata-visible'), source_refs: [role ? `source-role:${role.id}` : `symbol-index:${row.repo_id || ''}:${row.path}:${row.line}:${row.name}`], producer: row.producer || 'ctags', producer_ref: 'symbol-index.jsonl', promotion_basis: role ? `symbol row plus source role ${role.source_role}` : 'symbol row; source role unavailable in bundle', resolution_limit: P.PROMOTION_MATRIX.find((m) => m.family === 'symbol_index').resolution_limit, path: row.path, name: row.name, line: row.line });
    }
  }

  const claimRows = reader.readJsonl('claims.jsonl');
  if (claimRows.length > promotedFactRowLimit) {
    health.push(P.truncationHealth('analysis_claim', 'promotion-health-analysis-claim-records-truncated', 'Claim records exceeded the per-family row limit.', promotedFactRowLimit, claimRows.length, promotedFactRowLimit, ['claims.jsonl'], 'promoted-facts.jsonl', 'claim_row_count > PORTOLAN_EVIDENCE_PROMOTED_FACT_LIMIT', 'Query claims.jsonl or raise PORTOLAN_EVIDENCE_PROMOTED_FACT_LIMIT before treating claim rows as exhaustive.'));
  }
  for (const claim of claimRows.slice(0, promotedFactRowLimit)) {
    writePromotedFact({ id: `claim-record-${claim.id || P.hashText(claim.statement || '')}`, stratum: 'claim', family: 'analysis_claim', fact_kind: 'claim_record', evidence_layer: 'claim', evidence_state: 'claim-only', source_refs: claim.cited_refs || [], producer: 'import-analysis-claims', producer_ref: 'claims.jsonl', promotion_basis: 'accepted claim import with resolved cited refs; no promoted fact is created from statement text', resolution_limit: P.PROMOTION_MATRIX.find((m) => m.family === 'analysis_claim').resolution_limit, statement: claim.statement || '' });
  }

  const familyRegistry = {
    schema_version: P.SCHEMA_VERSION,
    families: P.FAMILIES.map((id) => ({ id })),
    health_statuses: ['ok', 'partial', 'non_exhaustive', 'oversized', 'dominated_by_fixture_data', 'polluted_by_non_source', 'stale', 'inventory_mismatch', 'raw_available_only', 'unsupported_language', 'not_integrated', 'cannot_verify', 'not_assessed'],
    thresholds: P.THRESHOLDS,
    limits: { source_classification_limit: sourceClassificationLimit, promoted_fact_row_limit: promotedFactRowLimit },
  };

  queryIndex.addRows('classified-sources.jsonl', classified);
  queryIndex.addRows('raw-artifacts.jsonl', raw);
  queryIndex.addRows('promotion-health.jsonl', health);

  const byStatus = health.reduce((acc, row) => { acc[row.status] = (acc[row.status] || 0) + 1; return acc; }, {});
  const summary = {
    canonical_family_count: P.FAMILIES.length,
    health_record_count: health.length,
    classified_source_count: classified.length,
    promoted_fact_count: promoted.length,
    raw_artifact_count: raw.length,
    statuses: byStatus,
    source_inventory: {
      total_discovered_file_count: inventoryDiscoveredFileCount,
      classified_file_count: classified.length,
      fallback_inventory_count: sourceClassification.inventories.filter((inv) => inv.fallback).length,
      truncated_inventory_count: sourceClassification.inventories.filter((inv) => inv.truncated).length,
      source_classification_limit: sourceClassificationLimit,
    },
    promoted_fact_row_limit: promotedFactRowLimit,
    unsupported_family_count: health.filter((r) => r.status === 'not_integrated').length,
    not_assessed_family_count: P.FAMILIES.filter((f) => health.find((r) => r.id === `promotion-health-${f}`) && health.find((r) => r.id === `promotion-health-${f}`).status === 'not_assessed').length,
  };

  return {
    jsonArtifacts: {
      'source-inventory.json': { schema_version: P.SCHEMA_VERSION, generated_at: genAt, records: sourceInventoryRecords },
      'evidence-families.json': familyRegistry,
      'promotion-matrix.json': { schema_version: P.SCHEMA_VERSION, records: P.PROMOTION_MATRIX },
      'promotion-summary.json': { schema_version: P.SCHEMA_VERSION, ...summary },
    },
    jsonlArtifacts: {
      'classified-sources.jsonl': classified,
      'raw-artifacts.jsonl': raw,
      'promotion-health.jsonl': health,
      'promoted-facts.jsonl': promoted,
    },
    // queryIndex returned (not serialized): size_bytes must be computed AFTER
    // the driver writes the artifacts, so toJSON(sizeOf) sees real file sizes.
    queryIndex,
    manifestPatch: { promotion_health: summary },
    summary,
  };
}

module.exports = { buildPromotionAtlas };
