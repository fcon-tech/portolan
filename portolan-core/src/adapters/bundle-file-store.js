/**
 * Adapter: bundle-file atlas store.
 *
 * Implements the AtlasStore port. Reads/writes the system-map.json snapshot
 * from a bundle directory on the local filesystem. This is the Part-1 storage
 * medium; Part 2 may add an index-backed store.
 *
 * Adapters layer — the only place fs I/O lives.
 */
'use strict';

const fs = require('fs');
const path = require('path');

function createBundleFileStore(bundleDir) {
  const file = path.join(bundleDir, 'system-map.json');
  return {
    async loadAtlas() {
      try {
        const raw = fs.readFileSync(file, 'utf8');
        return JSON.parse(raw);
      } catch (e) {
        return null;
      }
    },
    async saveAtlas(map) {
      fs.writeFileSync(file, JSON.stringify(map, null, 2));
    },
    async hasAtlas() {
      return fs.existsSync(file);
    },
  };
}

module.exports = { createBundleFileStore };
