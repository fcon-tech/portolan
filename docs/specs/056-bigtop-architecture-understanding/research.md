# Research: Bigtop Architecture Understanding

## Existing Evidence

- Spec 054 verified bounded real producer outputs:
  - Docker Compose deployment-model output for Bigtop provisioner.
  - Helm deployment-model output for Alluxio monitor chart.
  - Bounded Alluxio protobuf descriptor output.
  - Symbol/reference output remains `not_assessed`.
- Spec 055 verified top-level runtime observation import mechanics on a fixture.
  Bigtop runtime topology remains blocked/not_assessed because no selected
  Bigtop runtime observation export exists.

## Evaluation Choice

Use a rubric-based comparison instead of a binary "understands architecture"
claim.

Rejected alternatives:

- Declare architecture understanding from a successful map run: rejected,
  because map output proves evidence availability, not answer quality.
- Require full Bigtop runtime topology before any architecture scoring:
  rejected, because runtime is blocked and would prevent progress on static and
  deployment/API claims that can be honestly scored.
- Implement new scanners in Portolan: rejected for this slice; the product
  direction is to normalize OSS/tool outputs first.

## Evidence Families

- Source/inventory evidence.
- Dependency/component evidence.
- Deployment/model evidence.
- API/catalog evidence.
- Runtime-visible evidence.
- Symbol/reference evidence.
- Duplication/technical-debt evidence.
- Unknown/not_assessed gaps.

## Scoring

Each question gets one status:

- `verified`: answer is correct for the scoped question and cites sufficient
  local evidence.
- `partial`: answer is useful but missing at least one required evidence family
  or has a narrower scope than the question.
- `failed`: answer is wrong or overclaims.
- `blocked`: required local evidence cannot be produced safely in this slice.
- `not_assessed`: evidence or answer is missing.
