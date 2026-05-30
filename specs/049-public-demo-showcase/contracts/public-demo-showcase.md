# Contract: Public Demo Showcase

## Demo Contract

The public demo is acceptable only when:

- target data is Apache Bigtop and the acquisition/setup path is documented;
- commands are copyable from a fresh checkout;
- output path is explicit;
- generated artifacts include `summary.json`, `map.md`,
  `evidence-index.jsonl`, `answer-contract.md`, and one bounded query or slice;
- docs explain visible evidence and gaps;
- weak states remain visible.

Full generated Bigtop outputs are not part of the first public showcase
contract. The public artifact set is:

- runbook;
- command snippets;
- small redacted excerpts;
- privacy/freshness review.

Screenshots and terminal recordings are also out of scope for the first public
showcase slice unless separately approved.

## Case Study Contract

The public case study is acceptable only when:

- every positive claim maps to `docs/product-claims.md`;
- Bigtop wording says Apache Bigtop demo or fixed local Bigtop comparison when
  applicable;
- Cursor wording says headless Cursor Agent CLI / Composer when applicable;
- UI Cursor/Composer remains outside the validated scope;
- arbitrary external targets remain unproven unless separately verified;
- unsupported claims are listed as limits, not converted into success.

## Privacy Contract

Committed demo artifacts, screenshots, and recordings are acceptable only when
a review records:

- no private absolute paths;
- no credentials or secret values;
- no private customer names;
- no unsupported external service URLs;
- generation command and source version;
- freshness or staleness status.
