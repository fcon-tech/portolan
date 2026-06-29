# Tasks — semantic-evidence-anchors

Recorded spec (19). Implementation is a follow-on slice.

## Spec artifacts

- [x] proposal.md
- [x] design.md
- [x] specs/semantic-investigation/spec.md (ADDED: every claim carries an anchor
      or not_assessed; unanchored claims never render as verified)

## Open implementation questions (design TBD)

- [ ] Anchor shapes: source card, local anchor (path+range), command receipt.
- [ ] Producer-side enforcement (reject or downgrade unanchored claims).
- [ ] BDD binding at implementation time.
