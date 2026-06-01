## Review Findings

### 🟢 Low — No Issues Found

**L1: Exclude pattern double-coverage is minor but harmless**
- `.portolan/**` and `.run/**` overlap in intent (both filter tooling artifacts), but `run/**` targets a sibling directory while `.portolan/**` covers the portolan cache. No semantic conflict. Acceptable.

**L2: `--exclude` flag ordering is positional but stable**
- Syft treats `--exclude` as a repeatable flag; order of the two exclusions doesn't affect behavior. Fine as-is.

---

### 🟡 Medium — Observations (Non-Blocking)

**M1: Exclude patterns are relative to Syft's working directory assumption**
- The patterns `./.portolan/**` and `./run/**` assume Syft is invoked with `root` as the scan target and that Syft resolves relative paths from that root. This matches Syft's documented behavior (`--exclude` patterns are relative to the source location). However, if `root` is an absolute path, the `./` prefix still works because Syft normalizes. **Verified correct** by the successful run `20260601-154329`.

**M2: No `--scope` flag to constrain traversal depth**
- Syft defaults to `Squashed` scope (single-layer). If a user later needs `AllLayers` for Docker images, excludes become more critical. Not a blocker for the current filesystem-source use case, but worth a code comment if the intent is strictly local-only.

---

### 🔴 Critical / Blockers

**None.**

---

## Verdict: ✅ APPROVED

| Check | Status |
|-------|--------|
| Generated command read-only? | ✅ `MutatesTarget: false`, reads `root`, writes only to `toolOutputDir` |
| Excludes clean for fresh runs? | ✅ Filters `.portolan` and `run` artifacts from SBOM source |
| Path portability risk? | ✅ Relative patterns verified against Syft; absolute tried and rejected (correctly) |
| Tests cover new behavior? | ✅ Asserts both `--exclude` args and `limits` text |
| Gate commands pass? | ✅ `go test`, `go vet`, `jq empty`, `git diff --check` |

---

## not_assessed

The change modifies evidence-generation commands (`plan.Commands`) but does not alter the `EvidenceState` assignment logic. `plan.EvidenceState` remains `"not_assessed"` after plan construction, consistent with the approval-gated workflow where the agent must request user confirmation before execution. **No regression.**

---

## Recommendation

Ship as-is. The excludes are the minimal correct set for the observed stale-artifact drift. If future Bigtop runs introduce additional cache directories (e.g., `.gradle`, `.m2`), extend the excludes list at that time rather than over-anticipating.
