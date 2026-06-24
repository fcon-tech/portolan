/**
 * Port: atlas store interface.
 *
 * Contract for loading/persisting the atlas (system-map snapshot). Decouples
 * use-cases from the storage medium: bundle-file (today), in-memory (tests),
 * or a future index (Part 2 fleet).
 *
 * Ports layer — may reference domain types, never adapters.
 *
 * Contract:
 *
 *   AtlasStore = {
 *     // Load the atlas snapshot. Resolves to a parsed system-map object, or
 *     // null if no snapshot exists yet.
 *     loadAtlas(): Promise<object|null>,
 *
 *     // Persist an atlas snapshot (adapter decides the medium).
 *     saveAtlas(map): Promise<void>,
 *
 *     // Whether a snapshot exists without loading it fully.
 *     hasAtlas(): Promise<boolean>,
 *   }
 */
'use strict';

function isAtlasStore(s) {
  return !!(s && typeof s.loadAtlas === 'function' && typeof s.saveAtlas === 'function' && typeof s.hasAtlas === 'function');
}

module.exports = { isAtlasStore };
