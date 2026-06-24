/**
 * Domain: intake result — the typed artefact produced by the root Portolan
 * skill's conversational intake (charter 08 "Managed intake").
 *
 * Single responsibility: validate and normalize the intake result shape. The
 * intake result is persisted under `.portolan/` and consumed by the
 * deterministic core to build the snapshot; a deterministic rebuild reuses it
 * without re-asking the admiral.
 *
 * Shape (charter 08):
 *   {
 *     target_root: string (path or URL),
 *     anchors: [{ id, kind, location, access_method }],
 *     perimeter: string[] (roots),
 *     architectural_principles: string[] (optional),
 *     generated_at: ISO timestamp (exempt from determinism),
 *   }
 *
 * Pure functions, zero dependencies. Domain layer.
 */
'use strict';

const ANCHOR_KINDS = ['repository', 'docs', 'issue-tracker', 'chat', 'mailing-list', 'deploy'];
const ACCESS_METHODS = ['local', 'api', 'file'];

/**
 * Validate an intake result. Returns an array of error strings (empty = valid).
 * @param {object} r
 * @returns {string[]}
 */
function validateIntakeResult(r) {
  const errors = [];
  if (!r || typeof r !== 'object') return ['intake result must be an object'];
  if (!r.target_root || typeof r.target_root !== 'string') {
    errors.push('intake result missing target_root (non-empty string required)');
  }
  if (!Array.isArray(r.anchors) || r.anchors.length === 0) {
    errors.push('intake result must have at least one anchor');
  } else {
    r.anchors.forEach((a, i) => {
      if (!a.id) errors.push(`anchor[${i}] missing id`);
      if (!ANCHOR_KINDS.includes(a.kind)) errors.push(`anchor[${i}] has invalid anchor kind "${a.kind}" (expected one of: ${ANCHOR_KINDS.join(', ')})`);
      if (!ACCESS_METHODS.includes(a.access_method)) errors.push(`anchor[${i}] has invalid access_method "${a.access_method}" (expected one of: ${ACCESS_METHODS.join(', ')})`);
      if (!a.location || typeof a.location !== 'string') errors.push(`anchor[${i}] missing location`);
    });
  }
  if (r.perimeter != null && !Array.isArray(r.perimeter)) {
    errors.push('intake result perimeter must be an array of strings if present');
  }
  return errors;
}

/**
 * Normalize an intake result: fill defaults (architectural_principles=[],
 * generated_at), trim whitespace in locations. Returns a NEW object; does not
 * mutate the input.
 * @param {object} r
 * @returns {object}
 */
function normalizeIntakeResult(r) {
  const out = JSON.parse(JSON.stringify(r));
  if (!Array.isArray(out.architectural_principles)) out.architectural_principles = [];
  if (!out.generated_at) out.generated_at = new Date().toISOString();
  if (Array.isArray(out.anchors)) {
    out.anchors = out.anchors.map(a => ({ ...a, location: String(a.location || '').trim() }));
  }
  if (typeof out.target_root === 'string') out.target_root = out.target_root.trim();
  if (!Array.isArray(out.perimeter)) out.perimeter = [];
  return out;
}

module.exports = { validateIntakeResult, normalizeIntakeResult, ANCHOR_KINDS, ACCESS_METHODS };
