# Execution Gate

Spec: `docs/specs/076-cursor-enterprise-parity-validation/`

Date: 2026-06-02

## Default Paired Cursor Stress

blocked:

- Spec 074 runtime-health execution is still approval-gated.
- No spec 074 service-health, daemon-log, smoke-probe, or cleanup evidence
  exists.
- Therefore C4 runtime topology cannot be verified for default
  human/enterprise parity validation.

## Current Evidence Inputs

verified:

- Spec 075 is merged and provides bounded producer-output coverage.
- Spec 077 is merged and records that no safe full resolved graph/callgraph
  producer is currently available locally.
- The 2026-06-01 stress report found Portolan materially useful but incomplete,
  with Java/Scala/Maven graph evidence and large-landscape duplication still
  weak.
- Evidence input state has been reconstructed in
  `reviews/evidence-input-state-ledger-2026-06-02.md`.
- Clean-start and forbidden-artifact controls have been reconstructed in
  `reviews/artifact-hygiene-ledger-2026-06-02.md`.

cannot_verify:

- Complete Bigtop runtime topology.
- Full Bigtop symbol/reference graph.
- Bigtop call graph.
- Cursor plus Portolan broad human/enterprise parity.

not_assessed:

- Spec 076 paired Cursor Composer 2.5 stress.
- Spec 074 runtime-health command sequence.

## Allowed Work Without Additional Approval

- Planning artifacts.
- Review of requirements/product-vision drift.
- Prompt and scoring rubric preparation.
- Evidence-input and artifact-hygiene ledger preparation.
- Baseline repository checks.

## Work Requiring Additional Approval

- Any spec 074 runtime-health command sequence.
- Any spec 076 current-evidence rejection run while spec 074 remains blocked.
- Any deletion or archival of old stress artifacts beyond transient files
  created by the active run.

## Required Approval Text For Default Runtime Evidence Dependency

Spec 074 run approval should explicitly refer to spec 074, for example:

```text
разрешаю 074
```

The approval must accept the command sequence documented in
`docs/specs/074-bigtop-runtime-topology-health-capture/runbook.md`.
