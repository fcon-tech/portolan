/**
 * Adapter: filesystem atlas-nav-source — the only place target-source reads
 * happen during nav-index generation.
 *
 * Boundary-aware enumeration + deterministic anchor matching (captain-atlas 13
 * §Source Boundaries, §anchor matching).
 *
 *   Bigtop:       enumerate repos/* non-dot dirs as repository subjects; NEVER
 *                 read .portolan/, .cursor/, output/, research/ under the target.
 *   portolan-self: enumerate the six allowed source regions; NEVER read
 *                  openspec/specs/*.md as source truth.
 *
 * Anchor matching (per profile.anchor_candidate):
 *   - single substring match in the declared file -> record line_start/line_end.
 *   - no match -> found:false, 0/0 (build() downgrades route_quality).
 *   - multiple matches -> found:true, 0/0, matchCount>1 (build() records ambiguity).
 *   - missing file -> found:false, 0/0.
 *
 * Adapters layer — depends on the port contract + domain, the only place fs lives.
 */
'use strict';

const fs = require('fs');
const path = require('path');

// Roots to NEVER traverse as evidence (boundary control).
const BIGTOP_FORBIDDEN = new Set(['.portolan', '.cursor', 'output', 'research', 'node_modules', '.git']);

// The six allowed portolan-self source regions (spec §Expected subject enumeration).
const SELF_REGIONS = [
  { id: 'region:go-cli', label: 'Go CLI / internal', rel: ['cmd', 'internal'], expected_by: 'source-region-enumerator' },
  { id: 'region:scripts', label: 'Harness / scripts', rel: ['scripts', 'harness'], expected_by: 'source-region-enumerator' },
  { id: 'region:portolan-core', label: 'JavaScript core (portolan-core)', rel: ['portolan-core'], expected_by: 'source-region-enumerator' },
  { id: 'region:schemas', label: 'Schemas / contracts', rel: ['schema', 'contracts'], expected_by: 'source-region-enumerator' },
  { id: 'region:fixtures', label: 'Fixtures / tests', rel: ['internal/testfixtures', 'tests'], expected_by: 'source-region-enumerator' },
  { id: 'region:docs', label: 'Docs / public-facing files', rel: ['README.md', 'AGENTS.md', 'LICENSE', 'docs'], expected_by: 'source-region-enumerator' },
];

/**
 * Create a filesystem atlas-nav-source bound to a target root.
 * @param {string} targetRoot absolute target root
 */
function createFsAtlasNavSource(targetRoot) {
  const root = path.resolve(targetRoot);

  function abs(rel) { return path.join(root, rel); }

  function exists(rel) {
    try { return fs.existsSync(abs(rel)); } catch { return false; }
  }

  function findFile(name, underRel) {
    try {
      const dir = abs(underRel || '');
      if (!fs.existsSync(dir)) return '';
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      // Sort for deterministic first-match across platforms.
      entries.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
      for (const e of entries) {
        if (e.isFile() && e.name === name) return path.join(underRel || '', name);
      }
      // one-level recursion into subdirs
      for (const e of entries) {
        if (e.isDirectory() && !BIGTOP_FORBIDDEN.has(e.name) && !e.name.startsWith('.')) {
          const sub = path.join(dir, e.name);
          try {
            const subEntries = fs.readdirSync(sub, { withFileTypes: true });
            subEntries.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
            for (const se of subEntries) {
              if (se.isFile() && se.name === name) return path.join(underRel || '', e.name, name);
            }
          } catch { /* ignore unreadable */ }
        }
      }
    } catch { /* ignore */ }
    return '';
  }

  function enumerateSubjects(profileId) {
    if (profileId === 'bigtop') return enumerateBigtop();
    if (profileId === 'portolan-self') return enumerateSelf();
    return [];
  }

  function enumerateBigtop() {
    const reposDir = abs('repos');
    const subjects = [];
    if (!fs.existsSync(reposDir)) return subjects;
    let entries = [];
    try { entries = fs.readdirSync(reposDir, { withFileTypes: true }); } catch { return subjects; }
    // Sort for deterministic, reproducible output across platforms.
    entries.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      if (e.name.startsWith('.')) continue;
      if (BIGTOP_FORBIDDEN.has(e.name)) continue;
      const rel = `repos/${e.name}`;
      subjects.push({
        subject_id: `repo:${e.name}`,
        subject_type: 'repository',
        subject_label: e.name,
        source_path: rel,
        exists: true,
        expected_by: 'bigtop-repos-enumerator',
        promotion_state: 'promoted',
        top_evidence_refs: [],
      });
    }
    // Promoted package/distribution components when discoverable from local
    // source (spec: "plus promoted package/distribution components when
    // discoverable from local source"). The integration hub
    // apache-bigtop-repo/bigtop-packages/ holds per-component recipes.
    const pkgRoot = abs('repos/apache-bigtop-repo/bigtop-packages');
    if (fs.existsSync(pkgRoot)) {
      let pkgEntries = [];
      try { pkgEntries = fs.readdirSync(pkgRoot, { withFileTypes: true }); } catch { pkgEntries = []; }
      pkgEntries.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
      for (const e of pkgEntries) {
        if (!e.isDirectory()) continue;
        if (e.name.startsWith('.')) continue;
        const rel = `repos/apache-bigtop-repo/bigtop-packages/${e.name}`;
        subjects.push({
          subject_id: `package:bigtop:${e.name}`,
          subject_type: 'component',
          subject_label: `bigtop package: ${e.name}`,
          source_path: rel,
          exists: true,
          expected_by: 'bigtop-package-enumerator',
          promotion_state: 'promoted',
          top_evidence_refs: [],
        });
      }
    }
    return subjects;
  }

  function enumerateSelf() {
    const subjects = [];
    for (const region of SELF_REGIONS) {
      // a region exists if ANY of its rel roots exists
      const presentRel = (region.rel || []).find(relPath => exists(relPath));
      subjects.push({
        subject_id: region.id,
        subject_type: 'source_region',
        subject_label: region.label,
        source_path: presentRel || region.rel[0],
        exists: !!presentRel,
        expected_by: region.expected_by,
        promotion_state: presentRel ? 'promoted' : 'missing',
        top_evidence_refs: [],
      });
    }
    return subjects;
  }

  /**
   * Resolve anchor candidates deterministically.
   * Empty substring -> treat as "directory/file exists" check (found iff file exists, matchCount 1, no lines).
   */
  function resolveAnchors(candidates) {
    const out = new Map();
    for (const c of candidates || []) {
      if (!c) continue;
      const key = c.key || `${c.file}\u0000${c.substring}`;
      out.set(key, resolveOne(c));
    }
    return out;
  }

  function resolveOne(candidate) {
    const filePath = abs(candidate.file);
    if (!candidate.substring) {
      // existence-only anchor (e.g. a directory): found iff the path exists.
      const found = exists(candidate.file);
      return { found, lineStart: 0, lineEnd: 0, matchCount: found ? 1 : 0 };
    }
    let content;
    try {
      content = fs.readFileSync(filePath, 'utf8');
    } catch {
      return { found: false, lineStart: 0, lineEnd: 0, matchCount: 0 };
    }
    const lines = content.split(/\r\n|\r|\n/);
    const matches = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(candidate.substring)) matches.push(i + 1); // 1-based
    }
    if (matches.length === 0) return { found: false, lineStart: 0, lineEnd: 0, matchCount: 0 };
    if (matches.length === 1) return { found: true, lineStart: matches[0], lineEnd: matches[0], matchCount: 1 };
    return { found: true, lineStart: 0, lineEnd: 0, matchCount: matches.length };
  }

  return { exists, findFile, enumerateSubjects, resolveAnchors };
}

module.exports = { createFsAtlasNavSource, SELF_REGIONS, BIGTOP_FORBIDDEN };
