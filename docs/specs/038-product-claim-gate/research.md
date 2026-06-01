# Research: Product Claim Gate

## Decision: Use A Spec-Local Claim Ledger

Use `docs/specs/038-product-claim-gate/reviews/product-claim-ledger-YYYY-MM-DD.md`
with embedded JSONL-style records for claim inventory and decisions.

Rationale: The current problem is claim discipline, not automation. A compact
ledger is reviewable, diffable, and consistent with recent validation specs.

Alternatives considered:

- New Go command: rejected for the first slice because no user-facing CLI gap is
  proven yet.
- Spreadsheet or external tracker: rejected because it would weaken local-first
  repo evidence and make PR review harder.
- Full evaluation framework: rejected as premature and dependency-heavy.

## Decision: Claim Statuses Mirror Evidence Discipline

Allowed statuses are `accepted`, `narrowed`, `rejected`, `not_assessed`,
`blocked`, and `failed`.

Rationale: These statuses preserve the difference between proven value,
partial proof, missing evidence, blocked validation, and negative validation.

Alternatives considered:

- Boolean pass/fail: rejected because it would collapse partial and unassessed
  evidence.
- Readiness levels: rejected because Portolan is not a readiness gate.

## Decision: Evidence Sources Are Ordered By Validation Strength

Use this order when classifying claims:

1. Real target validation artifacts from specs 034-037.
2. Headless Cursor/agent comparison outputs.
3. Local map/context artifacts with explicit target scope.
4. OSS producer evidence with tool status.
5. Implementation tests and internal docs, which may support capability claims
   but cannot by themselves support product-ready claims.

Rationale: Product claims must describe what validation proved for users, not
what code exists.

Alternatives considered:

- Treat local tests as product proof: rejected by FR-004.
- Treat backlog status as proof: rejected because backlog rows can be stale.

## Decision: Client-Safe Answer Is Derived Only From Accepted Or Narrowed Claims

Generate a short answer artifact in the reviews directory that uses only
accepted/narrowed claims and an explicit limitations section.

Rationale: The user-facing question is "Why Portolan if I already have Cursor?"
The answer must avoid overclaiming UI Cursor, full ecosystem completeness,
runtime topology, near-clone/SBOM duplication, and OSS execution coverage when
those remain unassessed or failed.

Alternatives considered:

- Narrative summary from memory: rejected because it is not auditable.
- Marketing-style positioning: rejected because it hides the boundary the gate
  exists to preserve.

## Decision: Backlog Updates Are Required Only For Product Scope Drift

Update `docs/product-backlog.md` or follow-up specs when a rejected, blocked, or
unassessed claim changes roadmap status or exposes a missing validation slice.
Do not churn backlog wording for every narrowed sentence.

Rationale: The backlog should remain a product index, not duplicate the claim
ledger.

Alternatives considered:

- Always edit backlog for every claim: rejected as noisy.
- Never edit backlog: rejected because missing validation can change product
  sequencing.
