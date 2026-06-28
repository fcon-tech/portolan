/**
 * Port: source-file access (repo-root sandbox + target source reads).
 *
 * Contract for the security boundary that resolves and reads TARGET source
 * files (not bundle artifacts): declared repo roots, symlink-escape prevention,
 * and bounded source-snippet reads. Decouples the `source` / `selected-code`
 * query families from the filesystem. A use-case depends on this port; an
 * adapter implements it over fs; tests inject a fake.
 *
 * Ports layer — may reference domain types, never adapters.
 *
 * Contract:
 *
 *   SourceFilePort = {
 *     // Declared repo roots (path) plus their realpath, deduped, for one repo.
 *     repoRootsFor(repo): string[],
 *
 *     // All repo roots declared in the bundle (repos.json), optionally filtered
 *     // to a repo id/name. Each entry = declared path + realpath, deduped.
 *     loadAllRepoRoots(repoId?): string[],
 *
 *     // Resolve a free-text repo filter to concrete repo ids, using
 *     // repos.json + atlas-facts.json. `unknown` = no match (caller must NOT
 *     // widen to all repos).
 *     resolveRepoFilterIds(filter): { ids: string[], unknown: boolean },
 *
 *     // Reject symlinks, non-files, and anything whose realpath escapes roots.
 *     isReadableRepoFile(absPath, roots): boolean,
 *
 *     // Resolve a request path (absolute or repo-relative) to an absolute file
 *     // under one of the roots, or null. Enforces the sandbox.
 *     resolveSourcePath(requestPath, roots): string | null,
 *
 *     // Read a target source file's content (UTF-8), or null if unreadable.
 *     readSourceFile(absPath): string | null,
 *   }
 */
'use strict';

function isSourceFilePort(s) {
  return !!(s && typeof s.repoRootsFor === 'function'
    && typeof s.loadAllRepoRoots === 'function'
    && typeof s.resolveRepoFilterIds === 'function'
    && typeof s.isReadableRepoFile === 'function'
    && typeof s.resolveSourcePath === 'function'
    && typeof s.readSourceFile === 'function');
}

module.exports = { isSourceFilePort };
