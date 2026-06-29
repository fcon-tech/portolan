# Design — second-corpus-generalization-gate

## Decision

Add a generalization gate: every executable contract runs on at least one
second, independent OSS landscape beyond Bigtop; Bigtop-only contracts are
`not-generalized`, not done.

## Status

Recorded intent (spec-level). Corpus selection, harness wiring, and the
divergence target (a non-JVM, non-big-data landscape maximizes divergence from
Bigtop) are design-TBD.

## Reversibility

High. Additive validation standard; absent second corpus yields
`not-generalized` flags, not silence.
