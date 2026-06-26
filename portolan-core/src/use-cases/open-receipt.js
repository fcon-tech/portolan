/**
 * Use-case: open the receipt-validation dossier view-model.
 *
 * Shapes the raw receipt into the lists the shell renders: machine status,
 * agent self-status, disagreements (with receipt sources), row counts, failed
 * and blocked checks. PURE. Use-case layer.
 */
'use strict';

function openReceipt(receiptValidation) {
  const rv = receiptValidation || {};
  const checks = rv.validation_checks || [];
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
  };
}

module.exports = { openReceipt };
