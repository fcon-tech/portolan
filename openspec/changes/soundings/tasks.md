## 1. Verdict shape

- [ ] 1.1 Implement the shared sounding result (verdict enum
      `confirmed`/`refuted`/`unconfirmed` plus anchored evidence list,
      reusing the core-foundation Anchor type) and verify a unit test
      rejects constructing a `confirmed` result with an empty evidence list
- [ ] 1.2 Add the determinism harness (run a sounding twice on an unchanged
      fixture, deep-compare results) and verify it passes for both
      operations

## 2. sound.anchor

- [ ] 2.1 Implement file-anchor verification (exists, line range within
      file, cited content present at range) and verify fixture tests cover
      the confirmed, fabricated-file, content-drift, and out-of-range
      scenarios from the spec delta
- [ ] 2.2 Implement manifest-key and receipt-id anchor verification and
      verify tests confirm a live key/receipt and refute a dead one by id

## 3. sound.edge

- [ ] 3.1 Implement the manifest-declaration means (source vessel's
      manifests, dependency match against the target vessel) and verify a
      fixture test confirms a declared fairway citing file + key
- [ ] 3.2 Implement the source-reference means (name-based sweep scoped to
      the source vessel's paths) and verify a fixture test confirms a
      manifest-silent fairway citing file paths and lines
- [ ] 3.3 Implement the both-negative path and verify a test returns
      `unconfirmed` reporting each means's negative result with no
      absence claim in the output

## 4. Read-only invariants

- [ ] 4.1 Add the no-write guarantee test (run confirmed, refuted, and
      unconfirmed soundings against a written chart fixture and
      snapshot-compare the chart directory byte-for-byte) and verify the
      chart is unchanged after every verdict kind
- [ ] 4.2 Add an API-surface test asserting the sounding entry points
      expose no chart-write or trust-mutation path, and verify the chart
      store's write counters show zero calls after a sounding battery
