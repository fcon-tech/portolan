#!/usr/bin/env node
/**
 * Thin CLI driver: build a normalized system-map.json from bundle artifacts.
 *
 * Composition root only — wires the fs bundle-artifact-reader adapter and the
 * bundle-file atlas-store to the build-snapshot use-case, which delegates to
 * the pure domain composer (src/domain/system-map-compose.js). Mirrors the
 * legacy viewer/scripts/build-system-map.js behaviour exactly; this is the
 * OpenSpec migrate-viewer-to-portolan-core replacement.
 *
 * Usage: node build-system-map.mjs build <bundle-dir> [target-root]
 */
'use strict';

import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createBundleArtifactReader } = require('../src/adapters/bundle-artifact-reader.js');
const { createBundleFileStore } = require('../src/adapters/bundle-file-store.js');
const { buildSnapshot } = require('../src/use-cases/build-snapshot.js');

function main() {
  const [, , mode, bundleDir, targetRoot] = process.argv;
  if (mode !== 'build' || !bundleDir) {
    console.error('usage: build-system-map.mjs build <bundle-dir> [target-root]');
    process.exit(2);
  }

  const reader = createBundleArtifactReader(bundleDir);
  const store = createBundleFileStore(bundleDir);
  buildSnapshot({ reader, store, targetRoot: targetRoot || '' })
    .then((map) => {
      const { components, surfaces, relationships } = map.objects;
      console.error(
        `system-map: ${path.join(bundleDir, 'system-map.json')} ` +
        `(${components.length} components, ${surfaces.length} surfaces, ${relationships.length} relationships)`,
      );
    })
    .catch((e) => {
      console.error('error: system-map build failed.');
      console.error(e.stack || e);
      process.exit(1);
    });
}

main();
