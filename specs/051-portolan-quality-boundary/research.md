# Research: Portolan Quality Boundary

## Decision Gate

### Simpler/Faster

Start with explicit quality docs and contract fixtures. Do not build a broad
governance engine or copy SDP's operator model.

### Blocking Edge Cases

- Portolan can be technically correct and still unhelpful if reports are too
  thin.
- Portolan can be helpful and still unsafe if reports overclaim weak evidence.
- Harness adapter files can exist without verified runtime behavior.
- Public demo success on one target does not prove broad stack coverage.

### Existing Open Source

No new OSS dependency is needed for this quality-boundary slice. Existing
schema validation with JSON Schema and project-local Go tests are enough if a
machine-checkable quality gate is implemented.

## SDP Lab Distillation

Inspected source repo: `/home/fall_out_bug/projects/sdp/sdp_lab`

Portable patterns:

- `docs/reference/trust-guarantees.md`: canonical guarantees and
  non-guarantees prevent product copy from inventing trust.
- `docs/reference/maturity-matrix.md`: stable/tooling/local-only/experimental
  classification prevents every implemented command from becoming a first-run
  promise.
- `docs/reference/harness-parity-matrix.md`: static adapter parity is not
  runtime readiness.
- `internal/scout/types.go`: stable JSON contract with explicit unknown/null
  states is safer than free-form prose.
- `docs/reference/FALLBACK_MODE.md`: fallback execution must preserve artifact
  quality.

Rejected transfers:

- Beads and workstream governance.
- Phase gates and delivery orchestration.
- Full SDP manifest complexity.
- Model gateway and provider cascade.

## Decisions

### D1: Quality Boundary Before UX Report Polish

- **Decision**: Implement a quality boundary spec before treating first-report
  UX as product-ready.
- **Rejected alternatives**: Polish the UX report first and retrofit claim
  controls later.
- **Why now**: The customer feedback asks for usefulness, but usefulness cannot
  come from unsupported claims.
- **Reversibility**: Medium. Later specs can extend the boundary but should not
  bypass it.
- **Risk if wrong**: It may slow UX implementation slightly; the tradeoff is
  acceptable because trust is central to Portolan.
- **Confidence**: high

### D2: Zero Unsupported Positive Claims For Acceptance

- **Decision**: Acceptance lanes use an unsupported positive claim budget of
  zero.
- **Rejected alternatives**: Allow a small unsupported-claim budget for
  "helpfulness."
- **Why now**: Portolan's boundary is evidence discipline; helpful hallucinated
  reports are product failure.
- **Reversibility**: Medium. A future exploratory mode could opt into looser
  budgets with explicit labeling.
- **Risk if wrong**: Some thin reports may feel less impressive; that is better
  than false certainty.
- **Confidence**: high

### D3: Maturity Labels Are Product Controls

- **Decision**: Every user-facing surface needs a maturity/release role label.
- **Rejected alternatives**: Keep maturity implicit in backlog rows and PR
  closeouts.
- **Why now**: The next UX work will expose a simpler surface; hidden maturity
  differences would mislead users.
- **Reversibility**: High. Labels can graduate with evidence.
- **Risk if wrong**: Classification maintenance becomes a chore; the scope is
  bounded to user-facing surfaces.
- **Confidence**: high
