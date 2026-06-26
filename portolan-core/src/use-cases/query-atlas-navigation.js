/**
 * Use-case: query the navigation atlas (follow-up-agent query surface).
 *
 * A small, bounded query API over the parsed nav-atlas, returning the uniform
 * envelope shape { schema_version, query, records, total_records, ... } already
 * used by query-atlas.js. Eight operations (captain-atlas 13 §Agent Handoff):
 *
 *   list-routes        [--family] [--subject]
 *   route              --id <route_id>
 *   findings-by-route  --id <route_id>
 *   probes-by-route    --id <route_id>
 *   list-findings      [--type] [--severity]
 *   list-probes        [--state]
 *   coverage-by-subject --subject <subject_id>
 *   receipt
 *
 * PURE — operates on an already-parsed bundle object. The CLI adapter parses
 * the JSONL files and calls this. Use-case layer.
 */
'use strict';

const SCHEMA_VERSION = 'atlas-navigation-index/v1';

function wrapResult(query, records, opts) {
  const limit = (opts && Number.isFinite(opts.limit) && opts.limit >= 0) ? Math.floor(opts.limit) : records.length;
  const truncated = records.length > limit;
  const page = truncated ? records.slice(0, limit) : records;
  return {
    schema_version: SCHEMA_VERSION,
    query,
    records: page,
    total_records: records.length,
    total_records_relation: 'exact',
    truncated,
    truncated_records: truncated ? records.length - limit : 0,
  };
}

/**
 * Run a query operation over a parsed nav-atlas.
 * @param {object} navAtlas parsed artifact set
 * @param {string} op one of the 8 operations
 * @param {object} [opts] { id?, subject?, family?, type?, severity?, state?, limit? }
 * @returns {object} envelope
 */
function queryAtlasNavigation(navAtlas, op, opts) {
  opts = opts || {};
  const ni = (navAtlas && navAtlas.navigationIndex) || [];
  const cm = (navAtlas && navAtlas.coverageMatrix) || [];
  const fi = (navAtlas && navAtlas.findings) || [];
  const up = (navAtlas && navAtlas.unknownProbes) || [];

  switch (op) {
    case 'list-routes': {
      // collapse stages to one record per route. Filter by family first, then
      // aggregate; a subject filter keeps a route iff it has >=1 stage matching
      // that subject (it is NOT removed when a non-matching stage is seen).
      const filtered = ni.filter(s => !(opts.family && s.route_family !== opts.family));
      const routesMap = new Map();
      for (const s of filtered) {
        if (!routesMap.has(s.route_id)) {
          routesMap.set(s.route_id, {
            route_id: s.route_id, route_family: s.route_family, route_title: s.route_title,
            route_quality: s.route_quality, stage_count: 0,
            finding_ids: new Set(), unknown_probe_ids: new Set(), subject_ids: new Set(),
          });
        }
        const r = routesMap.get(s.route_id);
        r.stage_count++;
        for (const f of s.finding_refs || []) r.finding_ids.add(f);
        for (const p of s.unknown_probe_refs || []) r.unknown_probe_ids.add(p);
        r.subject_ids.add(s.subject_id);
      }
      let records = [...routesMap.values()].map(r => ({
        ...r, finding_ids: [...r.finding_ids], unknown_probe_ids: [...r.unknown_probe_ids],
        subject_ids: [...r.subject_ids],
      }));
      if (opts.subject) records = records.filter(r => r.subject_ids.includes(opts.subject));
      return wrapResult({ op, family: opts.family, subject: opts.subject }, records, opts);
    }
    case 'route': {
      const stages = ni.filter(s => s.route_id === opts.id).sort((a, b) => a.stage_index - b.stage_index);
      return wrapResult({ op, id: opts.id }, stages, opts);
    }
    case 'findings-by-route': {
      const stages = ni.filter(s => s.route_id === opts.id);
      const ids = new Set();
      for (const s of stages) for (const f of s.finding_refs || []) ids.add(f);
      const records = fi.filter(f => ids.has(f.finding_id));
      return wrapResult({ op, id: opts.id }, records, opts);
    }
    case 'probes-by-route': {
      const stages = ni.filter(s => s.route_id === opts.id);
      const ids = new Set();
      for (const s of stages) for (const p of s.unknown_probe_refs || []) ids.add(p);
      const records = up.filter(u => ids.has(u.unknown_id));
      return wrapResult({ op, id: opts.id }, records, opts);
    }
    case 'list-findings': {
      let records = fi;
      if (opts.type) records = records.filter(f => f.finding_type === opts.type);
      if (opts.severity) records = records.filter(f => f.severity === opts.severity);
      return wrapResult({ op, type: opts.type, severity: opts.severity }, records, opts);
    }
    case 'list-probes': {
      let records = up;
      if (opts.state) records = records.filter(u => u.state === opts.state);
      return wrapResult({ op, state: opts.state }, records, opts);
    }
    case 'coverage-by-subject': {
      const record = cm.find(c => c.subject_id === opts.subject) || null;
      return wrapResult({ op, subject: opts.subject }, record ? [record] : [], opts);
    }
    case 'receipt': {
      const rv = (navAtlas && navAtlas.receiptValidation) || {};
      return wrapResult({ op }, [rv], opts);
    }
    default:
      throw new Error(`unknown query op: ${op}`);
  }
}

module.exports = { queryAtlasNavigation, SCHEMA_VERSION };
