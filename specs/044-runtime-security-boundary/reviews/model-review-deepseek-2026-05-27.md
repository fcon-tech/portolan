## Review: Portolan Spec 044 Runtime Security Boundary Implementation

Based solely on the provided diff and new file contents.

### Findings

| # | Severity | Finding | Evidence | Recommendation | Verdict |
|---|----------|---------|----------|----------------|---------|
| F1 | — | The `blackbox` runtime parser now enforces the documented contract: `schema_version` must be `0.1.0` when present; `from`/`to` required for contract observations; coverage normalization emits `unknown` topology edge for everything except `complete`; graph edge kind stays `observes` while producer `kind` goes into reason. | `blackbox.go` diff: `contractRuntimeFacts`, `partialRuntimeCoverageFacts`, `normalizeRuntimeCoverage`, schema check in `runtimeFacts`. | None needed. | Aligned with spec. |
| F2 | Minor | `maprun.go` calls `blackbox.Normalize(blackBox, nodeIDs)`, but that function is not visible in the supplied diff (not part of `blackbox.go` changes shown). It may exist elsewhere or be a new function outside the diff, but its correctness cannot be verified from this packet. | `maprun.go` diff line `result := blackbox.Normalize(blackBox, nodeIDs)`; no corresponding function in blackbox diff. | Include the `Normalize` change in the review evidence or provide its source. | Cannot verify. |
| F3 | Minor | Edge-case test coverage is not shown for: invalid coverage value (not `complete`/`partial`/etc.), missing `from`/`to`, `from` mismatch producing `cannot_verify`, multiple observations with different coverage aggregating to one unknown edge, or empty runtime file. | Diff only shows the five new tests. | Add tests for the invalid-coverage path (`TestRunScanRuntimeObservationRejectsInvalidCoverage`), missing `from`/`to`, and `from` mismatch to match the contract’s error behaviour. | Not assessed (untested paths). |
| F4 | Low | Prompt-injection escaping test (`TestRunPacketEscapesPromptLikeRuntimeObservationText`) relies on the current packet renderer’s escaping of backtick pairs and newlines. A future renderer change could accidentally break this without failing unrelated tests. | The test checks for exact string `&#39;rm -rf&#39;` inside backticks and absence of raw newline. | Add a broader regression test that validates the packet output against an expected pattern (e.g., no raw Markdown code block that could be interpreted as command) rather than exact strings, or document the escaping contract in the packet renderer. | Verified for current implementation. |
| F5 | Low | Secret-value redaction test (`TestRunMapDoesNotEmitSecretValuesFromConfigurationSurfaces`) only inspects the four map output files. Other outputs (e.g., `packet render` from the graph) are not explicitly tested, though the native configuration detection stores key names, not values, so the risk is low. | `TestRunMapDoesNotEmitSecretValuesFromConfigSurfaces` scans graph, findings, summary, map.md; no packet test. | Either add a packet-level secret-redaction check or document why packet output is safe by construction. | Verified for map outputs; not assessed for packet. |
| F6 | Low | Coverage path resolution in `coverage.ResolveSelectionPaths` now resolves relative paths for black-box runtime, metadata, and claims. This is correct for usability and prevents missing files when selection is in a subdirectory. No security risk introduced (user controls selection file). | `coverage.go` diff adds resolution loops for `BlackBoxes[i].Metadata`, `.Runtime`, `.Claims`. | None. | Aligned. |
| F7 | — | Backward compatibility with old `service`/`endpoint` runtime observations is preserved: the parser still handles those if the new contract fields are missing. | `runtimeFacts` continues the old path when `isContractRuntimeObservation` returns false. | None. | Aligned. |
| F8 | — | Documentation updates (README, product claims, threat model, runtime observations) accurately reflect narrowed security and runtime topology claims. The threat model is concrete and verifiable with the added tests. | New docs `runtime-observations.md`, `security-threat-model.md`; updated README and `product-claims.md`. | Keep future claims within the documented boundary. | Aligned. |

### Not Assessed

- `blackbox.Normalize` implementation (cannot verify from this packet).
- Full contract-observation test matrix (missing invalid coverage, missing from/to, from mismatch, aggregations).
- Packet output for secret-value leakage (not tested here).
- Regression protection for prompt-injection escaping if packet renderer is refactored.
- MCP/query security behaviour (not implemented, out of scope; threat model notes it as `not_assessed`).

### Overall Verdict

The implementation satisfies the spec’s contract for runtime observation handling, partial topology guarding, and focused security tests within the provided evidence. The primary ambiguity is the unseen `blackbox.Normalize` function. Once that piece is confirmed, and the missing edge-case tests are added (or documented as out of scope), the slice can close with the same conservative posture as claimed.

exit_code: 0
