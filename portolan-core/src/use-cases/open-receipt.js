/**
 * Use-case: open the receipt-validation dossier view-model.
 *
 * Shapes the raw receipt into the lists the shell renders: machine status,
 * agent self-status, disagreements (with receipt sources), row counts, failed
 * and blocked checks. Captain-atlas 16: ALSO returns the three-axis evidence
 * usability report (artifact validation / evidence usability / runtime
 * assessment) so the Run Log can show them SEPARATELY — artifact validation
 * must never imply evidence depth.
 *
 * PURE. Use-case layer — depends on domain only.
 */
'use strict';

const { evidenceUsabilityReport } = require('../domain/atlas-evidence-usability');

function openReceipt(receiptValidation, navAtlas) {
  const rv = receiptValidation || {};
  const checks = rv.validation_checks || [];
  // Three-axis evidence usability (captain-atlas 16). navAtlas is optional for
  // backwards compatibility; without it only the artifact axis is meaningful.
  const eu = navAtlas ? evidenceUsabilityReport(navAtlas) : null;
  return {
    targetId: rv.target_id || '',
    artifactSet: rv.artifact_set || 'atlas-navigation-index',
    machineStatus: rv.machine_status || 'not_assessed',
    agentSelfStatus: rv.agent_self_status || 'not_assessed',
    disagreements: rv.status_disagreements || [],
    receiptSources: rv.receipt_sources || {},
    rowCounts: rv.row_counts || {},
    validatedFiles: rv.validated_files || [],
    validationChecks: checks,
    failedChecks: checks.filter(c => c.status === 'failed'),
    blockedChecks: checks.filter(c => c.status === 'blocked'),
    verifiedChecks: checks.filter(c => c.status === 'verified'),
    hasDisagreement: (rv.status_disagreements || []).length > 0,
    // captain-atlas 16: separate axes, never collapsed.
    evidenceUsability: eu,
  };
}

module.exports = { openReceipt };
