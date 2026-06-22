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
const { execFileSync } = require('child_process');

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

const HEALTH_STATUSES = new Set([
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
]);

const EVIDENCE_LAYERS = new Set(['source', 'metadata', 'runtime', 'claim', 'unknown']);

const SOURCE_ROLES = new Set([
  'runtime_product_code',
  'test_code',
  'test_artifact',
  'fixture_data',
  'generated_code',
  'vendor_code',
  'documentation',
  'configuration',
  'deployment_model',
  'build_metadata',
  'ci_cd',
  'secret_reference_surface',
  'runtime_observation',
  'catalog_descriptor',
  'unknown_role',
]);

const PROMOTED_ROUTE_FAMILIES = new Set([
  'source_code',
  'symbol_index',
  'analysis_claim',
]);

const SOURCE_CLASSIFICATION_LIMIT = positiveIntEnv('PORTOLAN_EVIDENCE_SOURCE_CLASSIFICATION_LIMIT', 5000);
const PROMOTED_FACT_ROW_LIMIT = positiveIntEnv('PORTOLAN_EVIDENCE_PROMOTED_FACT_LIMIT', 200);

function positiveIntEnv(name, fallback) {
  const value = Number.parseInt(process.env[name] || '', 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

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

function scanJSONL(file, { limit = 0, onRow = null } = {}) {
  const result = {
    count: 0,
    parse_errors: 0,
    rows: [],
  };
  if (!fs.existsSync(file)) return result;

  const fd = fs.openSync(file, 'r');
  const buffer = Buffer.allocUnsafe(1024 * 1024);
  let carry = '';

  const consumeLine = (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    try {
      const row = JSON.parse(trimmed);
      result.count += 1;
      if (result.rows.length < limit) result.rows.push(row);
      if (onRow) onRow(row, result.count);
    } catch {
      result.parse_errors += 1;
    }
  };

  try {
    for (;;) {
      const bytesRead = fs.readSync(fd, buffer, 0, buffer.length, null);
      if (bytesRead === 0) break;
      const chunk = carry + buffer.toString('utf8', 0, bytesRead);
      const lines = chunk.split('\n');
      carry = lines.pop() || '';
      for (const line of lines) consumeLine(line);
    }
    if (carry) consumeLine(carry);
  } finally {
    fs.closeSync(fd);
  }

  return result;
}

function readJSONLStrict(file, errors) {
  if (!fs.existsSync(file)) {
    errors.push(`missing ${path.basename(file)}`);
    return [];
  }
  const rows = [];
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, index) => {
    if (!line.trim()) return;
    try {
      rows.push(JSON.parse(line));
    } catch (err) {
      errors.push(`${path.basename(file)}:${index + 1} invalid JSON: ${err.message}`);
    }
  });
  return rows;
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

function walkFilesWithMetadata(root, limit = Number.POSITIVE_INFINITY) {
  const out = [];
  let truncated = false;
  const stack = [root];
  while (stack.length) {
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
        if (out.length >= limit) {
          truncated = true;
          break;
        }
        out.push(full);
      }
    }
    if (truncated) break;
  }
  return { files: out, total: out.length, truncated };
}

function walkFiles(root, limit = Number.POSITIVE_INFINITY) {
  return walkFilesWithMetadata(root, limit).files;
}

function fallbackIgnoredRel(rel) {
  if (!rel) return true;
  const normalized = rel.replace(/\\/g, '/').replace(/^\.\//, '');
  if (normalized === '.git' || normalized.includes('/.git/')) return true;
  const parts = normalized.split('/');
  for (const part of parts) {
    if ([
      '.git',
      'node_modules',
      'vendor',
      '.portolan',
      '.codex-subagents',
      '.cursor',
      'portolan-smoke',
      'dist',
      'bin',
      'generated',
      '.DS_Store',
      '.idea',
      '.vscode',
    ].includes(part)) return true;
  }
  if (normalized.startsWith('.agents/') && !normalized.startsWith('.agents/skills/')) return true;
  return false;
}

function listRepoFiles(root, limit = SOURCE_CLASSIFICATION_LIMIT) {
  const absoluteRoot = path.resolve(root);
  if (fs.existsSync(path.join(absoluteRoot, '.git'))) {
    try {
      const stdout = execFileSync('git', ['-C', absoluteRoot, 'ls-files', '-co', '--exclude-standard'], {
        encoding: 'utf8',
        maxBuffer: 256 * 1024 * 1024,
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      const rels = stdout.split('\n').filter(Boolean).sort((a, b) => a.localeCompare(b));
      const files = rels.slice(0, limit).map((rel) => path.resolve(absoluteRoot, rel));
      return {
        root: absoluteRoot,
        files,
        total: rels.length,
        truncated: rels.length > limit,
        inventory_source: 'git_ls_files',
        fallback: false,
      };
    } catch (err) {
      // Fall through to the conservative filesystem fallback below.
    }
  }
  const walked = walkFilesWithMetadata(absoluteRoot, limit);
  const files = walked.files.filter((file) => !fallbackIgnoredRel(path.relative(absoluteRoot, file)));
  return {
    root: absoluteRoot,
    files,
    total: files.length,
    truncated: walked.truncated,
    inventory_source: 'filesystem_fallback',
    fallback: true,
  };
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
  const inventories = [];
  for (const root of roots) {
    if (!root || !fs.existsSync(root)) continue;
    const inventory = listRepoFiles(root);
    inventories.push(inventory);
    for (const file of inventory.files) {
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
  return { rows, inventories };
}

function familyInputs(bundleDir, classifiedSources) {
  const producers = path.join(bundleDir, 'producers');
  const sourceFiles = classifiedSources.map((row) => row.path);
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

function truncationHealth(family, id, reason, observedCount, denominator, threshold, evidenceRefs, producerRef, calculationRule, nextAction) {
  return healthRecord(family, 'non_exhaustive', reason, evidenceRefs, producerRef, {
    id,
    observed_count: observedCount,
    denominator,
    threshold,
    calculation_rule: calculationRule,
    next_action: nextAction,
  });
}

function hasValue(row, field) {
  return row[field] !== undefined && row[field] !== null && row[field] !== '';
}

function requireFields(row, fields, label, errors) {
  for (const field of fields) {
    if (!hasValue(row, field)) errors.push(`${label} missing ${field}`);
  }
}

function requireEnum(row, field, allowed, label, errors) {
  if (hasValue(row, field) && !allowed.has(row[field])) {
    errors.push(`${label} invalid ${field}: ${row[field]}`);
  }
}

function requireArray(row, field, label, errors) {
  if (!Array.isArray(row[field])) errors.push(`${label} ${field} must be an array`);
}

function build(bundleDir, targetRootArg) {
  const manifest = readJSON(path.join(bundleDir, 'manifest.json')) || {};
  const targetRoot = targetRootArg || manifest.target_root || process.cwd();
  const sourceClassification = classifySources(bundleDir, targetRoot);
  const classified = sourceClassification.rows;
  const inputs = familyInputs(bundleDir, classified);
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
  const inventoryDiscoveredFileCount = sourceClassification.inventories.reduce((sum, inventory) => sum + inventory.total, 0);
  const discoveredFileCount = Number.isFinite(manifest.discovered_file_count)
    ? manifest.discovered_file_count
    : Number.isFinite(manifest.source_file_count)
      ? manifest.source_file_count
      : inventoryDiscoveredFileCount || totalSources;
  const nonPromotable = (roleCounts.test_code || 0) + (roleCounts.test_artifact || 0) + (roleCounts.fixture_data || 0) + (roleCounts.generated_code || 0) + (roleCounts.vendor_code || 0);
  const fixtureish = (roleCounts.test_code || 0) + (roleCounts.fixture_data || 0) + (roleCounts.test_artifact || 0);
  const lowConfidence = classified.filter((r) => r.confidence < THRESHOLDS.low_confidence_threshold || r.source_role === 'unknown_role').length;

  const health = FAMILIES.map((family) => {
    const refs = inputs[family].map((f) => path.relative(bundleDir, f));
    if (refs.length) {
      if (!PROMOTED_ROUTE_FAMILIES.has(family)) {
        return healthRecord(family, 'raw_available_only', `Representative ${family} input is addressable, but this slice has no promoted fact route for that family.`, refs, refs[0], {
          next_action: `Keep ${family} as raw/queryable input until a reviewed promotion route is implemented.`,
        });
      }
      return healthRecord(family, 'ok', `Representative ${family} input is visible through a local promotion route.`, refs, refs[0]);
    }
    return healthRecord(family, 'not_assessed', `Route for ${family} exists, but no representative input was supplied in this bundle.`, [], `route:${family}`, {
      next_action: `Provide local ${family} producer output or source artifact.`,
      route_proof: false,
    });
  });

  for (const inventory of sourceClassification.inventories) {
    if (inventory.fallback) {
      health.push(truncationHealth(
        'source_code',
        `promotion-health-source-code-inventory-fallback-${hashText(inventory.root)}`,
        `Source inventory for ${inventory.root} used conservative filesystem fallback instead of git ls-files --exclude-standard.`,
        inventory.files.length,
        null,
        null,
        [`source-inventory:${inventory.root}`],
        'classified-sources.jsonl',
        'git ls-files -co --exclude-standard unavailable; fallback ignore rules are conservative',
        'Run inside a Git worktree or provide a repos.json root with Git metadata.'
      ));
    }
    if (inventory.truncated) {
      health.push(truncationHealth(
        'source_code',
        `promotion-health-source-code-inventory-truncated-${hashText(inventory.root)}`,
        `Source inventory for ${inventory.root} exceeded the classification limit.`,
        inventory.files.length,
        inventory.total,
        SOURCE_CLASSIFICATION_LIMIT,
        [`source-inventory:${inventory.root}`],
        'classified-sources.jsonl',
        'inventory_file_count > PORTOLAN_EVIDENCE_SOURCE_CLASSIFICATION_LIMIT',
        'Increase PORTOLAN_EVIDENCE_SOURCE_CLASSIFICATION_LIMIT or shard the target before relying on completeness.'
      ));
    }
  }

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
      health.push(healthRecord('source_code', 'dominated_by_fixture_data', 'Test, fixture, and test-artifact files exceed 35 percent of classified files.', classified.filter((r) => ['test_code', 'fixture_data', 'test_artifact'].includes(r.source_role)).map((r) => `source-role:${r.id}`), 'classified-sources.jsonl', {
        id: 'promotion-health-source-code-fixtures',
        observed_count: fixtureish,
        denominator: totalSources,
        threshold: THRESHOLDS.dominated_by_fixture_data_ratio,
        calculation_rule: '(test_code + fixture_data + test_artifact) / classified_source_records > 0.35',
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
  let symbolNonPromotable = 0;
  let symbolFixtureish = 0;
  const symbolRows = scanJSONL(path.join(bundleDir, 'symbol-index.jsonl'), {
    limit: PROMOTED_FACT_ROW_LIMIT,
    onRow: (row) => {
      const [role, confidence] = roleForPath(row.path || '');
      if (
        confidence < THRESHOLDS.low_confidence_threshold ||
        ['test_code', 'test_artifact', 'fixture_data', 'generated_code', 'vendor_code', 'configuration', 'deployment_model', 'build_metadata', 'ci_cd', 'documentation', 'unknown_role'].includes(role)
      ) {
        symbolNonPromotable += 1;
      }
      if (['test_code', 'fixture_data', 'test_artifact'].includes(role)) symbolFixtureish += 1;
    },
  });
  if (symbolRows.count > 0) {
    if (symbolNonPromotable / symbolRows.count > THRESHOLDS.polluted_by_non_source_ratio) {
      health.push(healthRecord('symbol_index', 'polluted_by_non_source', 'Non-promotable source roles exceed 50 percent of symbol-index rows.', ['symbol-index.jsonl'], 'symbol-index.jsonl', {
        id: 'promotion-health-symbol-index-pollution',
        observed_count: symbolNonPromotable,
        denominator: symbolRows.count,
        threshold: THRESHOLDS.polluted_by_non_source_ratio,
        calculation_rule: 'non_promotable_symbol_row_roles / symbol_index_rows > 0.5',
      }));
    }
    if (symbolFixtureish / symbolRows.count > THRESHOLDS.dominated_by_fixture_data_ratio) {
      health.push(healthRecord('symbol_index', 'dominated_by_fixture_data', 'Test, fixture, and test-artifact paths exceed 35 percent of symbol-index rows.', ['symbol-index.jsonl'], 'symbol-index.jsonl', {
        id: 'promotion-health-symbol-index-fixtures',
        observed_count: symbolFixtureish,
        denominator: symbolRows.count,
        threshold: THRESHOLDS.dominated_by_fixture_data_ratio,
        calculation_rule: '(test_code + fixture_data + test_artifact symbol rows) / symbol_index_rows > 0.35',
      }));
    }
    if (symbolRows.parse_errors > 0) {
      health.push(healthRecord('symbol_index', 'cannot_verify', 'symbol-index.jsonl contains invalid JSONL rows.', ['symbol-index.jsonl'], 'symbol-index.jsonl', {
        id: 'promotion-health-symbol-index-invalid-jsonl',
        observed_count: symbolRows.parse_errors,
        denominator: symbolRows.count + symbolRows.parse_errors,
        calculation_rule: 'invalid symbol-index JSONL rows > 0',
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

  const rawByFamily = raw.reduce((acc, artifact) => {
    const row = acc[artifact.family] || { size: 0, refs: [] };
    row.size += artifact.size_bytes;
    row.refs.push(artifact.path);
    acc[artifact.family] = row;
    return acc;
  }, {});
  for (const [family, totals] of Object.entries(rawByFamily)) {
    if (totals.size >= THRESHOLDS.oversized_family_bytes) {
      health.push(healthRecord(family, 'oversized', `Raw artifacts for ${family} total at least 500 MiB.`, totals.refs, 'raw-artifacts.jsonl', {
        id: `promotion-health-oversized-family-${family}`,
        observed_count: totals.size,
        denominator: totals.refs.length,
        threshold: THRESHOLDS.oversized_family_bytes,
        calculation_rule: 'sum(raw_artifact_size_bytes by family) >= 500 MiB',
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
  const sourcePromotionCandidates = classified.filter((r) => r.source_role === 'runtime_product_code' && r.confidence >= 0.5);
  if (sourcePromotionCandidates.length > PROMOTED_FACT_ROW_LIMIT) {
    health.push(truncationHealth(
      'source_code',
      'promotion-health-source-code-promoted-facts-truncated',
      'Promoted source facts exceeded the per-family row limit.',
      PROMOTED_FACT_ROW_LIMIT,
      sourcePromotionCandidates.length,
      PROMOTED_FACT_ROW_LIMIT,
      ['classified-sources.jsonl'],
      'promoted-facts.jsonl',
      'runtime_product_code_source_candidate_count > PORTOLAN_EVIDENCE_PROMOTED_FACT_LIMIT',
      'Query classified-sources.jsonl or raise PORTOLAN_EVIDENCE_PROMOTED_FACT_LIMIT before treating promoted source facts as exhaustive.'
    ));
  }
  for (const row of sourcePromotionCandidates.slice(0, PROMOTED_FACT_ROW_LIMIT)) {
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

  if (symbolRows.count > PROMOTED_FACT_ROW_LIMIT) {
    health.push(truncationHealth(
      'symbol_index',
      'promotion-health-symbol-index-promoted-facts-truncated',
      'Promoted symbol facts exceeded the per-family row limit.',
      PROMOTED_FACT_ROW_LIMIT,
      symbolRows.count,
      PROMOTED_FACT_ROW_LIMIT,
      ['symbol-index.jsonl'],
      'promoted-facts.jsonl',
      'symbol_index_row_count > PORTOLAN_EVIDENCE_PROMOTED_FACT_LIMIT',
      'Query symbol-index.jsonl or raise PORTOLAN_EVIDENCE_PROMOTED_FACT_LIMIT before treating promoted symbol facts as exhaustive.'
    ));
  }
  for (const row of symbolRows.rows) {
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

  const claimRows = readJSONL(path.join(bundleDir, 'claims.jsonl'));
  if (claimRows.length > PROMOTED_FACT_ROW_LIMIT) {
    health.push(truncationHealth(
      'analysis_claim',
      'promotion-health-analysis-claim-records-truncated',
      'Claim records exceeded the per-family row limit.',
      PROMOTED_FACT_ROW_LIMIT,
      claimRows.length,
      PROMOTED_FACT_ROW_LIMIT,
      ['claims.jsonl'],
      'promoted-facts.jsonl',
      'claim_row_count > PORTOLAN_EVIDENCE_PROMOTED_FACT_LIMIT',
      'Query claims.jsonl or raise PORTOLAN_EVIDENCE_PROMOTED_FACT_LIMIT before treating claim rows as exhaustive.'
    ));
  }
  for (const claim of claimRows.slice(0, PROMOTED_FACT_ROW_LIMIT)) {
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
    limits: {
      source_classification_limit: SOURCE_CLASSIFICATION_LIMIT,
      promoted_fact_row_limit: PROMOTED_FACT_ROW_LIMIT,
    },
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
    source_inventory: {
      total_discovered_file_count: inventoryDiscoveredFileCount,
      classified_file_count: classified.length,
      fallback_inventory_count: sourceClassification.inventories.filter((inventory) => inventory.fallback).length,
      truncated_inventory_count: sourceClassification.inventories.filter((inventory) => inventory.truncated).length,
      source_classification_limit: SOURCE_CLASSIFICATION_LIMIT,
    },
    promoted_fact_row_limit: PROMOTED_FACT_ROW_LIMIT,
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
  const matrix = readJSON(path.join(bundleDir, 'promotion-matrix.json'));
  const errors = [];
  const health = readJSONLStrict(path.join(bundleDir, 'promotion-health.jsonl'), errors);
  const promoted = readJSONLStrict(path.join(bundleDir, 'promoted-facts.jsonl'), errors);
  const classified = readJSONLStrict(path.join(bundleDir, 'classified-sources.jsonl'), errors);
  const raw = readJSONLStrict(path.join(bundleDir, 'raw-artifacts.jsonl'), errors);

  if (!registry || !Array.isArray(registry.families)) errors.push('missing evidence-families.json registry');
  if (!Array.isArray(matrix?.records)) errors.push('missing promotion-matrix.json records');
  if (!health.length) errors.push('missing promotion-health.jsonl records');
  if (!classified.length) errors.push('missing classified-sources.jsonl records');

  if (Array.isArray(registry?.families)) {
    const seenFamilies = new Set();
    for (const row of registry.families) {
      if (!FAMILIES.includes(row.id)) errors.push(`registry invalid family: ${row.id || '?'}`);
      seenFamilies.add(row.id);
    }
    for (const family of FAMILIES) {
      if (!seenFamilies.has(family)) errors.push(`registry missing canonical family ${family}`);
    }
  }
  if (Array.isArray(registry?.health_statuses)) {
    for (const status of registry.health_statuses) {
      if (!HEALTH_STATUSES.has(status)) errors.push(`registry invalid health status: ${status}`);
    }
  }

  const matrixByFamily = new Map();
  if (Array.isArray(matrix?.records)) {
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
  for (const row of promoted) {
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
