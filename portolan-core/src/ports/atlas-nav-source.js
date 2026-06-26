/**
 * Port: atlas navigation source — the read-only target-source interface.
 *
 * Contract for the only place target-source reads happen during nav-index
 * generation. Decouples the generator use-case from the filesystem: a real fs
 * adapter in production, an in-memory fake in tests.
 *
 * The source adapter is boundary-aware: it enumerates ONLY allowed subjects and
 * reports anchor matches deterministically (single/no/multiple). It never reads
 * forbidden roots (.portolan, .cursor, output, research under Bigtop; active
 * product docs as source truth for portolan-self).
 *
 * Ports layer — may reference domain types, never adapters.
 *
 * Contract:
 *
 *   AtlasNavSource = {
 *     // Resolve a target-relative path to whether it exists.
 *     exists(relPath): boolean,
 *
 *     // Find a named file under a target-relative directory (one level of glob;
 *     // returns the first match's target-relative path or '' if none).
 *     findFile(name, underRelPath): string,
 *
 *     // Enumerate the expected coverage subjects for the selected profile.
 *     // Each subject carries source-derived truth (existence, source_path).
 *     // Returns [{ subject_id, subject_type, subject_label, source_path,
 *     //            exists, expected_by, promotion_state, top_evidence_refs? }].
 *     enumerateSubjects(profileId): Subject[],
 *
 *     // Resolve a set of anchor candidates to match truth. Returns a Map keyed
 *     // by candidate.key (or file+substring) -> { found, lineStart, lineEnd,
 *     // matchCount }. Deterministic substring matching per captain-atlas 13.
 *     resolveAnchors(candidates: AnchorCandidate[]): Map<string, AnchorResult>,
 *   }
 *
 *   AnchorCandidate = { key:string, file:string, substring:string }
 *   AnchorResult    = { found:boolean, lineStart:number, lineEnd:number, matchCount:number }
 */
'use strict';

function isAtlasNavSource(s) {
  return !!(s
    && typeof s.exists === 'function'
    && typeof s.findFile === 'function'
    && typeof s.enumerateSubjects === 'function'
    && typeof s.resolveAnchors === 'function');
}

module.exports = { isAtlasNavSource };
