/**
 * Adapter: filesystem source-file access (repo-root sandbox + target reads).
 *
 * Implements the SourceFilePort over the local filesystem + a bundle artifact
 * reader (for repos.json / atlas-facts.json lookups). Adapters layer — the only
 * place realpath / lstat / target-source reads live.
 *
 * Security boundary: a requested source path must (a) not be a symlink, (b) be
 * a regular file, and (c) have its realpath stay under a declared repo root.
 * This prevents symlink-escape and arbitrary file reads.
 */
'use strict';

const fs = require('fs');
const path = require('path');

function isPathUnderRoot(filePath, root) {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(filePath);
  return resolved === resolvedRoot || resolved.startsWith(resolvedRoot + path.sep);
}

function isUnderRepoRoot(filePath, repoRoots) {
  const resolved = path.resolve(filePath);
  return repoRoots.some((root) => isPathUnderRoot(resolved, root));
}

function createSourceFilePort({ reader, targetRoot }) {
  function repoRootsFor(repo) {
    if (!repo || typeof repo.path !== 'string' || !repo.path.trim()) return [];
    const roots = [path.resolve(repo.path)];
    try {
      roots.push(fs.realpathSync(roots[0]));
    } catch (e) {
      /* declared root is enough for path matching */
    }
    return [...new Set(roots)];
  }

  function loadAllRepoRoots(repoId = '') {
    const repos = reader.readJson('repos.json');
    if (!Array.isArray(repos)) return [];
    const filter = repoId
      ? resolveRepoFilterIds(repoId)
      : { ids: [], unknown: false };
    const roots = [];
    repos
      .filter((r) => r && typeof r.path === 'string' && r.path.trim())
      .filter((r) => !repoId || r.id === repoId || r.name === repoId || filter.ids.includes(r.id))
      .forEach((r) => {
        const declared = path.resolve(r.path);
        roots.push(declared);
        try {
          roots.push(fs.realpathSync(declared));
        } catch (e) {
          /* keep declared root; later file checks will fail closed */
        }
      });
    return [...new Set(roots)];
  }

  function resolveRepoFilterIds(repoFilter = '') {
    const filter = String(repoFilter || '').trim();
    if (!filter) return { ids: [], unknown: false };
    const ids = new Set();
    const repos = reader.readJson('repos.json');
    if (Array.isArray(repos)) {
      repos.forEach((repo) => {
        if (!repo) return;
        const candidates = [
          repo.id,
          repo.name,
          repo.path ? path.basename(repo.path) : '',
        ].filter(Boolean);
        if (candidates.includes(filter)) ids.add(repo.id);
      });
    }
    const facts = reader.readJson('atlas-facts.json');
    if (Array.isArray(facts && facts.components)) {
      facts.components.forEach((component) => {
        const repoId = component.repo_id || component.repoId || '';
        if (!repoId) return;
        const candidates = [
          component.target_id,
          component.targetId,
          component.id,
          component.label,
          repoId,
        ].filter(Boolean);
        if (candidates.includes(filter)) ids.add(repoId);
      });
    }
    return { ids: [...ids], unknown: ids.size === 0 };
  }

  function isReadableRepoFile(filePath, roots) {
    let stats;
    try {
      stats = fs.lstatSync(filePath);
    } catch (e) {
      return false;
    }
    if (stats.isSymbolicLink()) return false;
    if (!stats.isFile()) return false;
    let realPath;
    try {
      realPath = fs.realpathSync(filePath);
    } catch (e) {
      return false;
    }
    return isUnderRepoRoot(realPath, roots);
  }

  function resolveSourcePath(requestPath, roots) {
    if (!requestPath || typeof requestPath !== 'string') return null;
    const raw = requestPath.trim();
    if (!raw || raw.includes('\0')) return null;

    if (path.isAbsolute(raw)) {
      const resolved = path.resolve(raw);
      if (!isUnderRepoRoot(resolved, roots)) return null;
      return isReadableRepoFile(resolved, roots) ? resolved : null;
    }

    for (const root of roots) {
      const candidate = path.resolve(root, raw);
      if (!isPathUnderRoot(candidate, root)) continue;
      if (isReadableRepoFile(candidate, roots)) return candidate;
    }
    return null;
  }

  function readSourceFile(absPath) {
    try {
      return fs.readFileSync(absPath, 'utf8');
    } catch (e) {
      return null;
    }
  }

  return { repoRootsFor, loadAllRepoRoots, resolveRepoFilterIds, isReadableRepoFile, resolveSourcePath, readSourceFile };
}

module.exports = { createSourceFilePort, isPathUnderRoot, isUnderRepoRoot };
