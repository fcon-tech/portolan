/**
 * Use-case: build the system-map snapshot from a bundle.
 *
 * Single orchestration: read bundle artifacts via the BundleArtifactReader
 * port -> compose the system-map via the pure domain composer -> persist via
 * the AtlasStore port. Zero filesystem access of its own — all I/O crosses the
 * boundary through ports.
 *
 * Use-case layer — depends on domain + ports, never adapters.
 */
'use strict';

const { composeSystemMap } = require('../domain/system-map-compose');
const { translateMapBundle } = require('../domain/map-bundle-translate');

/**
 * @param {object} args
 * @param {object} args.reader  - BundleArtifactReader port impl
 * @param {object} [args.store] - AtlasStore port impl (optional; skips persist if absent)
 * @param {string} [args.targetRoot]
 * @param {string} [args.generatedAt]
 * @returns {Promise<object>} the composed system-map
 */
async function buildSnapshot({ reader, store, targetRoot, generatedAt }) {
  // Format detection: the Go `portolan map` collector writes graph.json +
  // summary.json (the "map-bundle" dialect); the scan pipeline writes
  // atlas-surfaces.json (the "scan-bundle" dialect). When graph.json is present
  // but atlas-surfaces.json is absent, translate the map-bundle into the
  // scan-bundle artifact shape so the existing composer works unchanged.
  let artifacts;
  if (reader.exists('graph.json') && !reader.exists('atlas-surfaces.json')) {
    artifacts = translateMapBundle({
      graph: reader.readJson('graph.json'),
      summary: reader.readJson('summary.json'),
      findings: reader.readJsonl('findings.jsonl'),
      coverage: reader.readJson('coverage.json'),
    });
  } else {
    const hotspotsName = reader.exists('hotspots-full.jsonl')
      ? 'hotspots-full.jsonl'
      : 'hotspots.jsonl';
    artifacts = {
      atlasSurfaces: reader.readJson('atlas-surfaces.json'),
      atlasFacts: reader.readJson('atlas-facts.json'),
      repoProfiles: reader.readJson('repo-profiles.json'),
      manifest: reader.readJson('manifest.json'),
      relationships: reader.readJsonl('relationships.jsonl'),
      hotspots: reader.readJsonl(hotspotsName),
      gaps: reader.readJsonl('gaps.jsonl'),
      repos: reader.readJson('repos.json'),
    };
  }
  const map = composeSystemMap(artifacts, { targetRoot, generatedAt });
  if (store) await store.saveAtlas(map);
  return map;
}

module.exports = { buildSnapshot };
