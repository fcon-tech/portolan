/**
 * Adapter: filesystem target source inventory.
 *
 * Implements the SourceInventoryPort over the local target root: git-aware
 * enumeration (`git ls-files -co --exclude-standard`) when the root is a git
 * repo, falling back to a conservative recursive walk that excludes
 * `.git`/`node_modules`/`vendor`/build dirs. Adapters layer — the only place
 * git/child_process + target-tree walks live.
 *
 * `fallbackIgnoredRel` is a pure path rule co-located here because it only
 * governs the fs-fallback walk.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

function fallbackIgnoredRel(rel) {
  if (!rel) return true;
  const normalized = rel.replace(/\\/g, '/').replace(/^\.\//, '');
  if (normalized === '.git' || normalized.includes('/.git/')) return true;
  const parts = normalized.split('/');
  for (const part of parts) {
    if ([
      '.git', 'node_modules', 'vendor', '.portolan', '.codex-subagents',
      '.cursor', 'portolan-smoke', 'dist', 'bin', 'generated',
      '.DS_Store', '.idea', '.vscode',
    ].includes(part)) return true;
  }
  if (normalized.startsWith('.agents/') && !normalized.startsWith('.agents/skills/')) return true;
  return false;
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
    } catch (e) {
      continue;
    }
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const ent of entries) {
      if (ent.name === '.git' || ent.name === 'node_modules' || ent.name === '.portolan') continue;
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        stack.push(full);
      } else if (ent.isFile()) {
        if (out.length >= limit) { truncated = true; break; }
        out.push(full);
      }
    }
    if (truncated) break;
  }
  return { files: out, total: out.length, truncated };
}

function createSourceInventoryFs(defaultLimit = Number.POSITIVE_INFINITY) {
  function listRepoFiles(root, limit = defaultLimit) {
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
          root: absoluteRoot, files, total: rels.length,
          truncated: rels.length > limit, inventory_source: 'git_ls_files', fallback: false,
        };
      } catch (err) {
        // Fall through to the conservative filesystem fallback below.
      }
    }
    const walked = walkFilesWithMetadata(absoluteRoot, limit);
    const files = walked.files.filter((file) => !fallbackIgnoredRel(path.relative(absoluteRoot, file)));
    return {
      root: absoluteRoot, files, total: files.length,
      truncated: walked.truncated, inventory_source: 'filesystem_fallback', fallback: true,
    };
  }
  return { listRepoFiles };
}

module.exports = { createSourceInventoryFs, fallbackIgnoredRel, walkFilesWithMetadata };
