## Review Findings

### Critical — (none)

### High — (none)

### Medium

1. **Exclude patterns are root-relative; correctness depends on Syft invocation from target root.** The `Args` slice uses `root` as the first positional source argument *and* relative `./.portolan/**` excludes. Syft resolves excludes relative to its scanning root. If `root` is absolute (the common case) and the Syft process CWD differs from `root`, Syft still resolves the exclude against the scan root — so this is correct. However, if anyone ever passes a relative `root`, the exclude semantics become CWD-dependent. The test doesn't assert on the relationship between `root` and the exclude prefixes. **Low practical risk** since `prepare` always resolves `root` to an absolute path, but worth a defensive `filepath.Abs(root)` or a comment.

2. **Single-element excludes slice limits test fidelity.** The test checks that `--exclude` and both patterns appear in the formatted args string, but doesn't verify the *pairing* — i.e., that each `--exclude` flag is immediately followed by its pattern, or that the total arg count is correct. `strings.Contains` on a `fmt.Sprint` of `[]any` could pass if both patterns appear but are in the wrong positions. Consider checking exact arg count or indexing.

### Low

1. **Hard-coded exclude list.** `excludes` is a local literal with no way for callers or future plan generators to extend it. If a new contaminant directory appears (e.g., `.cache`), this requires a code change. A minor maintainability note, not a blocker.

2. **`Limits` string duplicates exclude semantics in prose.** The `Limits` field says "exclude .portolan outputs and root-level run artifacts" which is informational and matches the actual excludes. This is fine for human readers but isn't machine-enforceable. Acceptable as-is.

---

## Verdict

**Clean — no blocker.** The change is correct and minimal. It preserves the local-first, read-only, non-mutating, approval-gated contract. The exclude patterns (`./.portolan/**`, `./run/**`) are the right scope to prevent stale artifact contamination, and relative patterns are the correct Syft idiom (absolute patterns are rejected by Syft, which the verification confirms was already discovered and handled).

## not_assessed

Preserved correctly. `plan.EvidenceState = "not_assessed"` is untouched by this change. The status remains `available_not_run` until explicit user approval and execution — no implicit state promotion.

## Recommendation

**Ship as-is.** Optionally, in a follow-up:
- Assert exact arg count or positional pairing in the test (Medium-2).
- Add a brief comment above `excludes` documenting the Syft-relative-resolution semantics and why patterns must be relative (Medium-1).
