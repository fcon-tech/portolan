# Portolan PR #58 Review — Spec 080 Post-Cursor Stress Update

## Findings

### CRITICAL — None.

---

### MAJOR — None.

---

### MINOR

**M1. `TargetRoot` preserved on scrubbed records**
- **Severity**: Minor
- **Evidence**: In `producerRunEvidenceRecord`, when `isStaleSiblingStressOutput` triggers scrubbing, `Command`, `Path`, and `OutputPath` are zeroed, but `TargetRoot` retains `run.TargetRoot`. If `TargetRoot` encodes the sibling run path (e.g., `.../.portolan/stress/old-run/...`), it partially leaks the stale location the scrub is designed to hide.
- **Recommendation**: Consider whether `TargetRoot` should also be scrubbed or replaced with the current context root when the record is downgraded. If intentional (it describes scope, not output), document the rationale in a code comment.

**M2. `appendReason` does not deduplicate**
- **Severity**: Minor
- **Evidence**: `appendReason` is a simple concatenator. If called multiple times on the same record (not current, but future risk), it could produce redundant suffixes.
- **Recommendation**: Low priority; acceptable for a single-call helper.

**M3. T020 open — PR status says "in progress"**
- **Severity**: Minor
- **Evidence**: `tasks.md` shows T020 (refresh baseline, push, GitHub check refresh) unchecked. `spec.md` status confirms "full baseline, independent re-review, and GitHub check refresh pending."
- **Recommendation**: Block merge on T020 completion; current review covers code and stress evidence only.

**M4. Scope of `not_assessed` downgrade limited to `verified` status**
- **Severity**: Minor
- **Evidence**: The guard fires only when `run.Status == "verified"`. Records already `not_assessed` or in other states pass through unmodified, including potentially stale `Path`/`OutputPath`/`Command` fields.
- **Recommendation**: Explicitly decide: should non-verified stale-sibling records also have their path/command scrubbed? If not, add a comment explaining why only `verified` needs protection.

---

### NOT ASSESSED

| Surface | Reason |
|---|---|
| GitHub CI/check state | Packet contains no CI results; T020 pending |
| Independent re-review by a second reviewer | Explicitly deferred per spec status |
| `TargetRoot` leak concern (M1) | Needs design intent confirmation |
| Non-verified stale-sibling records (M4) | Needs explicit accept-or-fix decision |
| Race between concurrent `context prepare` writes to the same output | Not in scope but not assessed |
| Full regression suite beyond `./internal/contextprep` and `./...` | Stated as passing but raw output not in packet |

---

## Requirements Fit

| Requirement | Status | Evidence |
|---|---|---|
| FR-001 artifact boundary explicit | ✅ Pass | `agent-brief.md` names `Current context output` directory; test asserts presence |
| FR-002 forbidden artifacts contaminated | ✅ Pass | Guidance names sibling stress roots and `run/`; Cursor stress confirms no forbidden reads |
| FR-003 guidance reads `Current context output` | ✅ Pass | `answer-contract.md` and `query-plan.md` scoped in test |
| FR-004 contaminated evidence non-counting | ✅ Pass | Scrubbed records become `not_assessed`; summary counts 0 verified, N not_assessed |
| FR-005 no target deletion/network/daemon | ✅ Pass | Code is read-only normalization; no `os.Remove`, no HTTP, no goroutine spawn |
| FR-006 no new dependencies | ✅ Pass | Only stdlib `path/filepath`, `strings`, `fmt` added |
| FR-007 fresh stress context → no stale promotion | ✅ Pass | `isStaleSiblingStressOutput` + `currentStressRunRoot` gate; test asserts `not_assessed`, scrubbed paths, scrubbed command |

---

## Evidence-State Honesty

- **Generated records**: Stale verified records are correctly downgraded to `not_assessed` with explicit reason text. The agent brief summary now counts from actual record statuses rather than asserting all are verified. This is a genuine honesty improvement.
- **Cursor stress**: Correctly reports `cannot_verify` for physical disk state outside the boundary and `not_assessed` for scrubbed producer runs. No unsupported claims.
- **Schema compliance**: `jq empty schema/*.json` reported passing (per verification statement). No schema changes in the diff.

---

## Stale Path/Output Safety

- `Path`, `OutputPath`, and `Command` are zeroed on scrubbed records. ✅
- `SourceArtifact` (the `.portolan/producer-runs.jsonl` path) is intentionally preserved — this is the metadata source, not a stale output. ✅
- `TargetRoot` is preserved (see M1). ⚠️
- `currentStressRunRoot` correctly extracts the stress run identifier (`parts[0]`) from the output path relative to `.portolan/stress/`. The `rel == "."`, `rel == ".."`, and `..` prefix guards prevent false positives when `out` is not under stress. ✅
- `isWithinPathBoundary` uses canonical `filepath.Rel` comparison. ✅

---

## Generated Agent Guidance

- `agent-brief.md` now shows `(N verified current records; M not_assessed)` instead of the ambiguous `verified` blanket statement. ✅
- Test explicitly asserts the old ambiguous string is absent. ✅
- Artifact boundary rules remain clear and unchanged from prior phase. ✅

---

## Test Coverage

- **`TestRunWritesFreshArtifactBoundaryGuidance`** is substantially extended: writes a stale sibling producer output + a `producer-runs.jsonl` with a verified record pointing at the sibling, then asserts:
  - Brief contains `0 verified current records; 1 not_assessed`
  - No stale path strings in any generated artifact
  - Old ambiguous summary string absent
  - `evidence-index.jsonl` contains the record with `not_assessed` status and reason text
- Edge cases not tested: non-stress output paths (should pass through unmodified), non-verified stale records, output path outside `.portolan/stress` hierarchy. These are lower risk but worth noting.

---

## Regression Risk

- **Low**. The change is confined to `detectProducerRuns` → `producerRunEvidenceRecord` path and the brief summary line. The `appendReason`, `isStaleSiblingStressOutput`, `currentStressRunRoot`, and `isWithinPathBoundary` functions are pure with no side effects.
- The guard is defensive: when `out` is not under `.portolan/stress/`, `currentStressRunRoot` returns `false` and no scrubbing occurs, preserving existing behavior for non-stress invocations.
- Existing tests (`go test ./...`) pass per verification statement.

---

## Verdict

**Approve with minor conditions.** The core mechanism (stale sibling detection → downgrade + scrub) is correct, well-tested, and honest. The four minor findings (M1–M4) are non-blocking for code review but M1 (`TargetRoot` retention) and M4 (non-verified stale records) deserve explicit accept-or-fix decisions before merge. T020 must complete before merge.
