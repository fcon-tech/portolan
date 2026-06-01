## Portolan Spec 055 — Review Findings

### Critical
(none)

### Major

1. **`normalizeRuntimeInput` does not preserve the `source` wrapper-node evidence in the conventional shape used by the existing black-box path.** The black-box path calls `inputNode(source.ID, "runtime", graph.RuntimeVisible, ...)`, which never emits an edge from the wrapper to a coverage‑summary unknown node. The new top‑level path injects `source.ID` → `:unknown:runtime-topology` with graph.Unknown state, which is a novel wrapper‑edge convention. This is intentional per the code (it signals partial coverage) but deserves a doc note because external consumers that iterate the graph by source‑node kind will see a new edge shape. Recommend adding a sentence to `docs/runtime-observations.md` confirming that `partial` / `unknown` coverage produces a distinct `unknown` wrapper edge.

2. **Top‑level runtime observation IDs are derived from `observation.From + " -> " + observation.To` when `id` is empty, but `runtimeObservationID` is also used as a label for the `invalid-observation` and `unsafe-observation` nodes.** Those node labels are essentially free‑form (they may include spaces and arrows). This is acceptable because the nodes carry `Kind: "unknown"` and `State: CannotVerify`, but note that the label is not a stable or validated identifier — if downstream tooling relies on label stability for validity tracking it will see variable strings.

### Minor

3. **`runtimeReadErrorState` always returns `graph.CannotVerify` regardless of the error, so the `os.IsNotExist` branch is dead code.** Consider removing the redundant branch or logging the distinction with a reason like "path does not exist" (already used in `runtimeReadErrorReason`).

4. **`unsafeRuntimeSource` only rejects the observation when `observation.Source` is unsafe; the document‑level `doc.Source` rejection path lacks the per‑observation invalid‑node injection.** This is consistent (the document‑level rejection returns `CannotVerify` on the wrapper node and stops) but means a single unsafe `doc.Source` poisons the entire runtime input, while an unsafe per‑observation source leaves the wrapper node valid and only rejects the bad observation. This asymmetry is fine but warrants a one‑line comment so maintainers don’t assume a missing code path on `doc.Source`.

5. **`partialCoverageRecorded` flag is set only once per `normalizeRuntimeInput` call.** If an input file contains multiple different observation sources with varying coverage, the unknown wrapper edge will reference the `observationSource` of whichever observation first triggered the flag. That source may not be the source of the `partial` / `unknown` observation that matters most. For multi‑source files this is a minor evidence‑source accuracy loss.

6. **The fixture constant `internal/app/testfixtures/runtime-security-boundary/` is listed in the updated docs alongside the new `internal/testfixtures/runtime-topology-evidence/`, but the diff only creates the new fixture path.** Verify that `runtime-topology-evidence` is committed; the review packet can’t confirm because it’s not in the diff.

### Evidence‑State Semantics

- **Correct**: Top‑level runtime observations always produce `Graph.RuntimeVisible` nodes/edges. Malformed documents, schema mismatches, unsafe sources, missing `from`/`to`, and unsupported coverage all produce `Graph.CannotVerify`. Missing observations (none) produce a `Graph.RuntimeVisible` wrapper node with no additional nodes, preserving the “known‑unknown” boundary — this is consistent with the spec’s “cannot infer runtime‑visible from static data” rule.
- **No static‑signal leakage**: The new code never promotes dependency, catalog, deployment, or symbol metadata to runtime‑visible. The edge kind is always `"observes"`; the node kind is `"runtime"` or `"unknown"`. No `maprun.go` path crosses from metadata inputs into the runtime normalization path. Evidence‑state hygiene is preserved.
- **Unknown wrapper edge**: As noted in Major §1, the `source.ID` → `:unknown:runtime-topology` edge is a new shape. The edge evidence carries `Graph.Unknown` and cites the observation source file, making the “partial” nature of the topology explicit. This is consistent with the spec’s requirement that partial coverage be marked `unknown`.

### Security & Privacy

- The `unsafeRuntimeSource` heuristic blocks source strings containing `://` or common credential markers (`token=`, `password`, etc.). This is a defense‑in‑depth layer: the top‑level reader is local‑file only, so a source field cannot exfiltrate data, but blocking it prevents accidental inclusion of remote references or raw secrets in graph evidence that consumers might accidentally interpret as safe.
- Because the unsafe‑observation path injects a `Graph.CannotVerify` node but does not emit the corresponding edge, the unsafe observation is visible as a non‑routable graph artifact. Recommend documenting in `docs/runtime-observations.md` that unsafe observation nodes appear as `Kind: "unknown"` with cannot‑verify state so downstream consumers know they represent sanitised input, not analysis gaps.

### Tests & CI

- New tests (`TestGraphAndFindingsForSelectionImportsTopLevelRuntimeObservation`, `TestGraphAndFindingsForSelectionRejectsInvalidTopLevelRuntimeObservation`) cover:
  - Happy path: wrapper node, `api`/`worker` nodes, observation edge with source, reason containing coverage/kind, partial‑coverage unknown edge, and finding state.
  - Malformed JSON → cannot‑verify wrapper node, no edges, malformed finding summary.
  - Unsafe per‑observation source → unsafe observation cannot‑verify node, finding cannot‑verify, observation edge not emitted.
- Test coverage gap (minor): No table‑driven test for the five standard coverage values plus the unsupported‑coverage rejection. The happy‑path test only exercises `"partial"`. A coverage‑enum table would catch regressions in `normalizeRuntimeInputCoverage`.
- The existing test for unsupported schema version is referenced in the docs but not exercised in this diff (the function existed before). The new code path calls the same schema‑version check, so it inherits that coverage. No need for a separate top‑level test.
- No new `go vet` or `staticcheck` issues visible from the diff; no new exported identifiers; the internal helper functions are unexported symbols, so no API‑compatibility concern.

### Maintainability

- The `normalizeRuntimeInput` function is long (~80 lines) but handles a single, well‑scoped responsibility (read + validate + translate). The helper functions (`runtimeObservationID`, `normalizeRuntimeInputCoverage`, `runtimeInputObservationReason`, etc.) are correctly extracted and testable in isolation if needed.
- `runtimeInputDocument` and `runtimeInputObservation` are defined as unexported types, preventing accidental coupling outside the package.
- The doc updates in `docs/runtime-observations.md` clearly explain the new top‑level `"runtime"` selection shape and the contract differences from the black‑box path. The addition of the new test fixture path is noted but not yet verified as committed.

### Verdict

**Approved with minor notes.** The implementation correctly separates runtime‑visible topology from static evidence inputs, handles error cases with proper cannot‑verify states, and includes defence‑in‑depth for unsafe source labels. The two major findings are about documenting an intentional new wrapper‑edge convention and a dead‑code branch — neither is a correctness regression. All spec‑mandated evidence‑state boundaries are preserved.

### Remaining Not Assessed

| Item | Status |
|------|--------|
| GitHub review approval | not_assessed (out of packet scope) |
| Bigtop real runtime observation export | not_assessed (blocked per spec) |
| `internal/testfixtures/runtime-topology-evidence/` fixture content | not_assessed (not in diff) |
| Runtime‑observation path existence failure (`os.IsNotExist` branch redundancy) | minor note only, not a correctness issue |
| Coverage‑enum table‑driven test | recommended minor coverage improvement, not a test regression |


