# Research: Bounded jscpd Profile

## Decision: Use jscpd as an optional local producer

Rationale: `jscpd` is already the selected OSS near-clone producer in the
large-codebase research and spec 035. The previous failure was an unbounded run
shape, not a reason to build a native clone detector.

Alternatives considered:
- Native near-clone detector: rejected because it reimplements a mature scanner
  before validating product value.
- Treat jscpd as permanently failed: rejected because a bounded profile may
  produce useful evidence without the previous generated-file-heavy failure.

## Decision: Bound execution before accepting evidence

Rationale: The full Bigtop invocation emitted unbounded clone output and was
interrupted before JSON was written. A safe profile needs explicit timeout,
include/exclude, output, and result-state handling.

Alternatives considered:
- Run full landscape again with a longer timeout: rejected because it repeats
  the known failure mode and may turn resource exhaustion into process debt.
- Commit large producer outputs: rejected because fixtures and ledgers should
  preserve evidence without storing bulky generated artifacts.

## Decision: Update product claims only after producer evidence exists

Rationale: Specs 038 and `docs/product-claims.md` intentionally keep near-clone
duplication unproven. This feature may narrow or verify that claim only for the
bounded target/profile that actually ran.

Alternatives considered:
- Mark duplication broadly accepted after fixture output: rejected because a
  fixture does not prove Bigtop or arbitrary inherited-estate behavior.
