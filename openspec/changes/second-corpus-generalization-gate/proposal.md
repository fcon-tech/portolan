## Why

Every Portolan contract today is proven on Apache Bigtop alone. A contract that
holds only on Bigtop is not a contract — Bigtop has become a hidden, hand-staged
fixture. To prove the product generalizes, the same contracts SHALL be verified
on at least one second, independent OSS landscape; a Bigtop-only contract SHALL
be flagged as not-generalized.

## What Changes

- Add a generalization gate: every executable scenario / contract SHALL be run
  against at least one second OSS landscape beyond Bigtop.
- A contract that passes on Bigtop but not on the second corpus SHALL be flagged
  `not-generalized` and MUST NOT be called done.

## Capabilities

### Modified Capabilities

- `engineering-standards`: adds the second-corpus generalization gate as a
  validation standard.

## Impact

- Requires selecting and wiring a second corpus (design TBD).
- Out of scope: which corpus (design TBD — e.g., a non-JVM, non-big-data
  landscape to maximize divergence from Bigtop).
