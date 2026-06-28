/**
 * Adapter: filesystem bundle artifact reader.
 *
 * Implements the BundleArtifactReader port over a local bundle directory.
 * Adapters layer — the only place fs I/O over bundle artifacts lives. Use-cases
 * receive this through the port and never touch fs directly.
 *
 * `iterateJsonl` is a true streaming generator (chunked read + carry buffer,
 * mirroring the legacy scanJSONL): callers that `break` out early stop reading,
 * which preserves the streaming memory bound AND the lower_bound total semantics
 * the bounded-query contract depends on.
 *
 * Read-only: no artifact is ever written here.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function createBundleArtifactReader(bundleDir) {
  const abs = path.resolve(bundleDir);
  const resolve = (name) => path.join(abs, name);

  function* iterateJsonl(name) {
    const file = resolve(name);
    if (!fs.existsSync(file)) return;
    const fd = fs.openSync(file, 'r');
    const buffer = Buffer.allocUnsafe(1024 * 1024);
    let carry = '';
    try {
      while (true) {
        const bytes = fs.readSync(fd, buffer, 0, buffer.length, null);
        if (bytes <= 0) break;
        const chunk = carry + buffer.toString('utf8', 0, bytes);
        const lines = chunk.split('\n');
        carry = lines.pop() || '';
        for (const line of lines) {
          const t = line.trim();
          if (!t) continue;
          try { yield JSON.parse(t); } catch (e) { /* skip malformed line */ }
        }
      }
      const tail = carry.trim();
      if (tail) {
        try { yield JSON.parse(tail); } catch (e) { /* skip malformed line */ }
      }
    } finally {
      fs.closeSync(fd);
    }
  }

  function readJson(name) {
    try {
      return JSON.parse(fs.readFileSync(resolve(name), 'utf8'));
    } catch (e) {
      return null;
    }
  }

  function readJsonl(name) {
    const out = [];
    for (const r of iterateJsonl(name)) out.push(r);
    return out;
  }

  function readJsonlHead(name, limit) {
    const records = [];
    let truncated = false;
    for (const r of iterateJsonl(name)) {
      if (records.length >= limit) { truncated = true; break; }
      records.push(r);
    }
    return { records, truncated };
  }

  function exists(name) {
    return fs.existsSync(resolve(name));
  }

  function size(name) {
    try {
      return fs.statSync(resolve(name)).size;
    } catch (e) {
      return null;
    }
  }

  function stat(name) {
    try {
      const s = fs.statSync(resolve(name));
      return { size: s.size, mtimeMs: s.mtimeMs };
    } catch (e) {
      return null;
    }
  }

  function sha256(name) {
    try {
      const hash = crypto.createHash('sha256');
      hash.update(fs.readFileSync(resolve(name)));
      return hash.digest('hex');
    } catch (e) {
      return null;
    }
  }

  function listProducerFiles(dir, predicate) {
    const root = resolve(path.join('producers', dir));
    const out = [];
    function walk(d) {
      let entries;
      try {
        entries = fs.readdirSync(d, { withFileTypes: true });
      } catch (e) {
        return;
      }
      for (const ent of entries) {
        const full = path.join(d, ent.name);
        if (ent.isDirectory()) {
          walk(full);
        } else if (ent.isFile()) {
          const rel = path.relative(abs, full);
          if (!predicate || predicate(rel)) out.push(rel);
        }
      }
    }
    walk(root);
    return out;
  }

  function listProducerDirs() {
    try {
      return fs.readdirSync(resolve('producers'), { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);
    } catch (e) {
      return [];
    }
  }

  return { readJson, readJsonl, readJsonlHead, iterateJsonl, exists, size, stat, sha256, listProducerFiles, listProducerDirs, bundleDir: abs };
}

module.exports = { createBundleArtifactReader };
