# Packet Review: 055-runtime-topology-evidence

## Findings

### Major

**M1. `runtimeSubjectID` collision when `stableID` produces `"unknown"`**
`runtimeSubjectID` maps *any* subject whose `stableID` hash equals `"unknown"` to the single ID `"runtime-subject"`. Two distinct runtime subjects that both hash to `"unknown"` will overwrite each other in `nodesByID`, silently dropping nodes and edges. This is a correctness bug whenever it occurs.
```go
func runtimeSubjectID(value string) string {
    id := stableID(value)
    if id == "unknown" {
        return "runtime-subject"  // all such subjects collide
    }
    return id
}
```
**Fix:** Return a disambiguated ID like `"runtime-subject:" + stableID(value)` or `"runtime-subject-" + stableID(value)` so distinct subjects remain distinct even when the label is "unknown".

**M2. Observation node overwrites subject node when `from`/`to` matches an invalid observation ID**
`runtimeInvalidObservationNode` produces IDs like `"sourceID:prefix:runtimeSubjectID(label)"`. If an invalid observation's label (used for `runtimeSubjectID`) collides with a valid observation's `from`/`to` subject ID, the later map-write in `nodesByID` silently replaces the invalid-observation node with the valid runtime-visible node, or vice versa depending on ordering. The prefix scheme should guarantee namespace separation, but `runtimeSubjectID` may strip it for "unknown" values (same collision as M1).

### Minor

**m1. `runtimeReadErrorState` always returns `CannotVerify`**
Both branches return the same value. This is technically correct but the function is misleading—the `os.IsNotExist` branch is dead logic:
```go
func runtimeReadErrorState(err error) graph.EvidenceState {
    if os.IsNotExist(err) {
        return graph.CannotVerify
    }
    return graph.CannotVerify
}
```
Either remove the function (inline `CannotVerify`) or preserve it for a future distinction (e.g., `NotAssessed` for permission errors).

**m2. No test for schema version mismatch on top-level runtime**
Black-box runtime has `TestRunScanRuntimeObservationRejectsUnsupportedSchemaVersion`; top-level runtime has no equivalent test for the `doc.SchemaVersion != selection.SchemaVersion` branch.

**m3. No test for valid observation with `coverage: "complete"` (no unknown node)**
The existing test covers `partial` coverage which creates the unknown-node edge. The `complete` path—where no unknown node should be emitted—is untested. This is a gap in branch coverage for a safety-critical distinction.

**m4. No test for missing file / read error path**
`normalizeRuntimeInput` has a full `os.ReadFile` error branch returning `runtimeReadErrorState`/`runtimeReadErrorReason`, but no test exercises a non-existent path for a top-level runtime source.

**m5. `unsafeRuntimeSource` marker list is not documented as configurable or exhaustive**
The hardcoded list (`token=`, `password`, `credential`, `authorization`, `bearer `, `secret`) is reasonable but not referenced in `docs/runtime-observations.md`. Future maintainers may not know to update it.

## Requirements Fit

| Requirement | Status |
|---|---|
| Top-level `selection.runtime` imports explicit local runtime observation JSON | ✅ Verified in code and test |
| Runtime-visible observes edges produced | ✅ |
| Static dependency/catalog/producers remain metadata-visible, not runtime topology | ✅ No change to existing dependency/catalog paths |
| Evidence states preserved (runtime-visible, metadata-visible, unknown, cannot_verify, not_assessed) | ✅ All five states are representable; no state corruption observed |
| Missing Bigtop runtime export stays blocked/not_assessed | ✅ Product backlog explicitly states this; no Bigtop fixture added |
| Unsafe source labels rejected | ✅ `unsafeRuntimeSource` + test |

## Verdict

**Conditional pass.** The design is sound, evidence-state semantics are correct, and the Bigtop runtime remains properly blocked. However, **M1** (`runtimeSubjectID` collision) is a real correctness bug that should be fixed before merge—it will produce silent graph corruption for any subject hashing to `"unknown"`. **m2–m4** represent test-coverage gaps on safety-relevant branches that should be addressed. The rest is clean and well-structured.

**Not-assessed items remain correctly scoped:** GitHub review approval, symbol/reference coverage beyond 052, full API/catalog/model coverage, and Bigtop runtime topology all remain `not_assessed` in the backlog, consistent with the spec's scope.
