/**
 * Port: bundle artifact reader interface.
 *
 * Contract for reading normalized producer artifacts (JSON / JSONL) from a
 * Portolan bundle directory. Decouples atlas normalizers and queries from the
 * filesystem: a use-case depends on this port, an adapter implements it over
 * fs, tests inject an in-memory fake.
 *
 * Ports layer — may reference domain types, never adapters.
 *
 * Contract:
 *
 *   BundleArtifactReader = {
 *     // Parsed JSON artifact, or null if the file is absent/unparseable.
 *     readJson(name): object | null,
 *
 *     // All parsed JSONL records ([] if the file is absent).
 *     readJsonl(name): object[],
 *
 *     // First `limit` records plus a truncation flag (cheap: stops reading
 *     // once the limit is reached). Used for bounded previews/sampling.
 *     readJsonlHead(name, limit): { records: object[], truncated: boolean },
 *
 *     // Streaming JSONL iterator. Callers MAY `break` out early to stop
 *     // reading (preserves the streaming memory bound). Malformed lines are
 *     // skipped. Sustains the lower_bound total semantics of bounded queries.
 *     iterateJsonl(name): Iterable<object>,
 *
 *     // Whether an artifact file exists in the bundle.
 *     exists(name): boolean,
 *
 *     // Artifact byte size (null if absent). Used to validate precomputed
 *     // indexes are still fresh against the source artifact.
 *     size(name): number | null,
 *
 *     // Artifact stat (size + mtime), or null if absent. Used for the stale
 *     // health rule and index freshness cross-checks.
 *     stat(name): { size: number, mtimeMs: number } | null,
 *
 *     // SHA-256 hex of an artifact's bytes (null if absent/unreadable). Used
 *     // for raw-artifact content hashes on bounded bundle files.
 *     sha256(name): string | null,
 *
 *     // Files under producers/<dir>/ matching predicate (relative to bundle),
 *     // bounded; [] if the producer dir is absent.
 *     listProducerFiles(dir, predicate?): string[],
 *
 *     // Names of producer subdirectories under producers/ ([] if absent).
 *     listProducerDirs(): string[],
 *
 *     // Absolute bundle directory path (for path-aware callers).
 *     bundleDir: string,
 *   }
 *
 * Names are relative paths within the bundle dir (e.g. 'manifest.json',
 * 'relationships.jsonl', 'map-bridge/evidence-index.jsonl').
 */
'use strict';

function isBundleArtifactReader(r) {
  return !!(r && typeof r.readJson === 'function'
    && typeof r.readJsonl === 'function'
    && typeof r.readJsonlHead === 'function'
    && typeof r.iterateJsonl === 'function'
    && typeof r.exists === 'function'
    && typeof r.size === 'function'
    && typeof r.stat === 'function'
    && typeof r.sha256 === 'function'
    && typeof r.listProducerFiles === 'function'
    && typeof r.listProducerDirs === 'function'
    && typeof r.bundleDir === 'string');
}

module.exports = { isBundleArtifactReader };
