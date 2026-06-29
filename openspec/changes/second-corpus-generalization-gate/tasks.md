# Tasks — second-corpus-generalization-gate

Recorded spec (23). Implementation is a follow-on slice.

## Spec artifacts

- [x] proposal.md
- [x] design.md
- [x] specs/engineering-standards/spec.md (ADDED: second-corpus generalization
      gate; Bigtop-only contracts are not-generalized)

## Open implementation questions (design TBD)

- [ ] Select the second corpus (maximize divergence from Bigtop: non-JVM,
      non-big-data).
- [ ] Harness wiring to run existing smokes/contracts on the second corpus.
- [ ] The `not-generalized` flag surface (CI, coverage, receipt).
- [ ] BDD binding at implementation time.
