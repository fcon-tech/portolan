/**
 * Use-case: build the atlas navigation index for a target.
 *
 * Orchestrates: profile selection (via the domain profiles + the source adapter
 * for capability checks), subject enumeration (adapter), anchor resolution
 * (adapter), then the pure domain buildNavigationBundle. Produces the seven
 * artifacts as plain data, OR a blocked/not_assessed receipt for unsupported
 * targets. Returns a result the adapter/script writes to disk.
 *
 * Use-case layer — depends on domain + ports, never concrete adapters.
 */
'use strict';

const { buildNavigationBundle } = require('../domain/atlas-navigation');
const { selectProfile, stableTargetId } = require('../domain/atlas-navigation-profiles');

/**
 * Build the navigation bundle for a target.
 *
 * @param {object} opts { targetRoot, sourceAdapter, explicitProfile?, manifestId? }
 *   sourceAdapter satisfies the AtlasNavSource port.
 * @returns {object} { profileId, targetId, reason, missingRoots?, unsupported?, bundle }
 *   bundle is the 7-artifact set (from buildNavigationBundle) when supported;
 *   when unsupported, bundle contains only a stub receiptValidation + an empty
 *   frontier-comparison (no content artifacts — the writer must skip them).
 */
function buildAtlasNavigationIndex(opts) {
  const { targetRoot, sourceAdapter, explicitProfile } = opts;
  const sel = selectProfile(targetRoot, sourceAdapter, explicitProfile);
  const manifestId = opts.manifestId || null;
  const targetId = stableTargetId(sel.id, targetRoot, manifestId);

  if (sel.id === 'unsupported_target' || !sel.profile) {
    // Emit a blocked/not_assessed receipt ONLY. No content artifacts.
    const receiptValidation = {
      target_id: targetId,
      artifact_set: 'atlas-navigation-index',
      machine_status: sel.missingRoots && sel.missingRoots.length ? 'blocked' : 'not_assessed',
      agent_self_status: 'not_assessed',
      status_disagreements: [],
      receipt_sources: {
        agent_self_status: 'n/a — no profile selected; agent self-status not evaluated for an unsupported target',
        status_disagreements: 'n/a — no agent run assessed for an unsupported target',
        profile_selection: sel.reason,
      },
      validated_files: ['receipt-validation.json'],
      row_counts: {
        'navigation-index.jsonl': 0, 'coverage-matrix.jsonl': 0, 'atlas-findings.jsonl': 0,
        'unknown-probes.jsonl': 0, 'evidence.jsonl': 0,
      },
      validation_checks: [
        { check_id: 'profile-selection', status: sel.missingRoots && sel.missingRoots.length ? 'blocked' : 'not_assessed',
          summary: sel.reason, detail: sel.missingRoots ? { missingRoots: sel.missingRoots } : undefined },
      ],
    };
    return {
      profileId: 'unsupported_target', targetId, reason: sel.reason,
      missingRoots: sel.missingRoots, unsupported: true,
      bundle: {
        navigationIndex: [], coverageMatrix: [], findings: [],
        unknownProbes: [], evidence: [],
        receiptValidation, frontierComparison:
          `# Frontier Comparison — ${targetId}\n\n> Unsupported target: no navigation artifacts generated.\n`,
      },
    };
  }

  // Supported profile: enumerate subjects + resolve anchors via the adapter.
  const profile = sel.profile;
  const subjects = sourceAdapter.enumerateSubjects(profile.id);

  // Collect every anchor candidate across the profile's route stages.
  const candidateMap = new Map();
  for (const route of profile.routes || []) {
    for (const stage of route.stages || []) {
      if (stage.anchor_candidate) {
        const c = stage.anchor_candidate;
        const key = c.key || `${c.file}\u0000${c.substring}`;
        candidateMap.set(key, c);
      }
    }
  }
  const anchors = sourceAdapter.resolveAnchors([...candidateMap.values()]);

  const enumerated = { targetId, subjects, anchors };
  const bundle = buildNavigationBundle(profile, enumerated);
  // Attach the profile's raw frontier rows so the multi-corpus combiner
  // (combine-multi-corpus.js) can merge them. This is an internal contract
  // between this use-case and the combiner; the leading underscore marks it as
  // non-artifact, non-disk data (buildNavigationBundle renders a per-bundle
  // frontier-comparison.md string separately).
  bundle._frontierRows = profile.frontierRows || [];

  return {
    profileId: sel.id, targetId, reason: sel.reason,
    missingRoots: undefined, unsupported: false, bundle,
  };
}

module.exports = { buildAtlasNavigationIndex };
