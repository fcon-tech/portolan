/**
 * Use-case: run managed intake — build a typed intake result from raw admiral
 * answers (charter 08 "Managed intake").
 *
 * The root Portolan skill conducts a conversational intake, then calls this
 * use-case to produce the typed artefact persisted under `.portolan/`. The
 * deterministic core consumes it to build the snapshot; a rebuild reuses it
 * without re-asking.
 *
 * PURE: takes raw answers, returns a validated+normalized intake result. The
 * I/O (writing .portolan/intake.json) is an adapter concern.
 *
 * Use-case layer — depends on domain.
 */
'use strict';

const { validateIntakeResult, normalizeIntakeResult } = require('../domain/intake-result');
const crypto = require('crypto');

/**
 * Deterministic anchor id from kind + location (stable across rebuilds).
 * @param {string} kind
 * @param {string} location
 * @returns {string}
 */
function anchorId(kind, location) {
  return crypto.createHash('sha1').update(`${kind}:${location}`).digest('hex').slice(0, 12);
}

/**
 * Build a typed intake result from raw admiral answers.
 *
 * @param {object} input - { target_root, anchors: [{kind,location,access_method}], perimeter?, architectural_principles? }
 * @returns {object} validated, normalized intake result
 * @throws if the result is invalid (per validateIntakeResult)
 */
function runIntake(input) {
  const target_root = input && input.target_root;
  const rawAnchors = (input && input.anchors) || [];
  const anchors = rawAnchors.map(a => ({
    id: anchorId(a.kind, String(a.location)),
    kind: a.kind,
    location: String(a.location),
    access_method: a.access_method,
  }));
  const perimeter = (input && Array.isArray(input.perimeter) && input.perimeter.length)
    ? input.perimeter
    : (target_root ? [target_root] : []);
  const result = {
    target_root,
    anchors,
    perimeter,
    architectural_principles: (input && input.architectural_principles) || [],
  };
  const errors = validateIntakeResult(result);
  if (errors.length) throw new Error(`invalid intake result: ${errors.join('; ')}`);
  return normalizeIntakeResult(result);
}

/**
 * Convenience builder from a terse anchor list.
 * @param {string} targetRoot
 * @param {Array} anchorTuples - [[kind, location, access_method], ...]
 * @returns {object}
 */
function intakeFromAnchors(targetRoot, anchorTuples) {
  return runIntake({
    target_root: targetRoot,
    anchors: anchorTuples.map(([kind, location, access_method]) => ({ kind, location, access_method })),
  });
}

module.exports = { runIntake, intakeFromAnchors, anchorId };
