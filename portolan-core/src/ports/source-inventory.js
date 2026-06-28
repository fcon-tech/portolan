/**
 * Port: target source inventory (file enumeration over the scanned target).
 *
 * Contract for enumerating source files under a target root — git-aware
 * (`git ls-files --exclude-standard`) with a conservative filesystem fallback.
 * Used by the evidence-promotion build to classify sources. This is a TARGET
 * concern (not a bundle-artifact concern): it walks the scanned codebase, not
 * the bundle directory.
 *
 * Ports layer — may reference domain types, never adapters.
 *
 * Contract:
 *
 *   SourceInventoryPort = {
 *     listRepoFiles(root): {
 *       root: string,
 *       files: string[],                        // absolute, sorted, bounded by limit
 *       total: number,
 *       truncated: boolean,
 *       inventory_source: 'git_ls_files' | 'filesystem_fallback',
 *       fallback: boolean
 *     }
 *   }
 */
'use strict';

function isSourceInventoryPort(s) {
  return !!(s && typeof s.listRepoFiles === 'function');
}

module.exports = { isSourceInventoryPort };
