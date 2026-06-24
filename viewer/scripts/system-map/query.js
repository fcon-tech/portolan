/**
 * Bounded query over a Portolan system map. Single responsibility: serve the
 * `system-map` query family (Feature 6: Agent Q&A) — overview/components/
 * repositories/surfaces/relationships/findings/unknowns/c4 sections with kind,
 * id, and text filters. Never returns the raw full map as the primary
 * interaction.
 *
 * Reads `<bundle>/system-map.json`. Pure given the bundle path + opts.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const SCHEMA_VERSION = '0.1.0';
const DEFAULT_LIMIT = 20;

const MAX_LIMIT = 200;

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

const PLURAL_MAP = {
  component: 'components', components: 'components',
  repository: 'repositories', repositories: 'repositories',
  relationship: 'relationships', relationships: 'relationships',
  finding: 'findings', findings: 'findings',
  unknown: 'unknowns', unknowns: 'unknowns',
  surface: 'surfaces', surfaces: 'surfaces',
};

// Explicit singular forms for id-prefix matching (replaces fragile /s$/ regex).
const KIND_SINGULAR = {
  components: 'component',
  repositories: 'repository',
  relationships: 'relationship',
  findings: 'finding',
  unknowns: 'unknown',
  surfaces: 'surface',
};

// Fields searched by the text filter (avoid matching raw JSON property names).
const SEARCH_FIELDS = ['display_name', 'label', 'summary', 'role', 'purpose',
  'why_present', 'why_it_matters', 'finding_type', 'relationship_type', 'surface_type'];

function querySystemMap(bundlePath, opts = {}) {
  if (!bundlePath || typeof bundlePath !== 'string') {
    throw new Error('querySystemMap: bundlePath must be a non-empty string');
  }
  const limit = parseLimit(opts.limit, DEFAULT_LIMIT);
  const section = (opts.section || 'components').toLowerCase();
  const kind = (opts.kind || opts.object_kind || '').toLowerCase();
  const warnings = [];
  const file = path.join(bundlePath, 'system-map.json');
  if (!fs.existsSync(file)) {
    return wrapResult(
      { family: 'system-map', section },
      [],
      0,
      limit,
      ['system-map.json missing — run a Portolan scan to generate it'],
    );
  }
  let map;
  try {
    map = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return wrapResult(
      { family: 'system-map', section },
      [],
      0,
      limit,
      [`system-map.json is not valid JSON: ${e.message}`],
    );
  }
  const objects = map.objects || {};
  let records;
  if (section === 'overview') {
    records = [{
      target: map.target,
      counts: {
        components: (objects.components || []).length,
        repositories: (objects.repositories || []).length,
        surfaces: (objects.surfaces || []).length,
        relationships: (objects.relationships || []).length,
        findings: (objects.findings || []).length,
        unknowns: (objects.unknowns || []).length,
      },
      c4_families: ((map.c4 && map.c4.families) || []).map((f) => ({
        id: f.id,
        display_name: f.display_name,
        component_count: (f.component_ids || []).length,
      })),
    }];
  } else if (section === 'c4') {
    records = [
      ...((map.c4 && map.c4.context_boxes) || []),
      ...((map.c4 && map.c4.families) || []),
      ...((map.c4 && map.c4.component_boxes) || []),
    ];
  } else {
    const plural = PLURAL_MAP[section] || 'components';
    records = objects[plural] || [];
  }
  // Filter by object kind when provided.
  if (kind) {
    const singular = KIND_SINGULAR[kind] || kind.replace(/s$/, '');
    records = records.filter((r) => {
      const hay = String(
        r.surface_type || r.kind || r.type || r.relationship_type ||
          r.family || r.level || '',
      ).toLowerCase();
      return hay === kind || String(r.id || '').toLowerCase().startsWith(singular + ':');
    });
  }
  // Optional text filter — searches a targeted field allowlist (not raw JSON).
  const q = (opts.q || opts.text || '').toLowerCase();
  if (q) {
    records = records.filter((r) =>
      SEARCH_FIELDS.some((f) => String(r[f] || '').toLowerCase().includes(q)),
    );
  }
  // Optional id filter (exact match).
  if (opts.id) {
    records = records.filter((r) => r.id === opts.id);
  }
  return wrapResult({ family: 'system-map', section, kind }, records, records.length, limit, warnings);
}

module.exports = { querySystemMap, parseLimit, wrapResult };
