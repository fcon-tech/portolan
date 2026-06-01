**Verdict:** No blocking findings. The diff respects repo rules: `cmd/portolan` stays thin, CLI wiring uses only the stdlib (`flag`, `encoding/json`), read-only/local-first semantics are preserved, and all four evidence states are exercised.

---

### Severity Findings

**Low — `internal/app/app.go` (line ~47): `--help` returns exit code 2 when combined with flags**
- `flags.Parse(args)` returns `flag.ErrHelp` for `-h`/`--help`, which the code treats as a fatal error (`return 2`).  
- Example: `portolan scan --selection x.json --help` will exit 2 instead of 0.  
- **Fix:** check `errors.Is(err, flag.ErrHelp)` and return 0 before the generic `return 2`.

**Low — `internal/app/app.go` (line ~69): progress byte count may not match written file**
- After `scan.Write` persists the graph, `runScan` calls `json.Marshal(g)` to print a byte count.  
- If `scan.Write` uses indented/structured formatting, the logged byte count will differ from the actual file size, producing a misleading summary.  
- **Fix:** use the bytes written by `scan.Write` (or `os.Stat` the output file) instead of re-marshaling.

**Low — `internal/app/app_test.go` (`TestRunScanRecordsOutsideSymlinkAsCannotVerify`): unused symlink / mismatched test intent**
- The test creates `repo/outside-link` (a symlink to a directory outside the repo) but never references it in the selection JSON.  
- The selection instead uses a `../repo` lexical path. The symlink is dead code, and the test name implies a scenario that the body does not execute.  
- **Fix:** either reference the symlink in the selection or rename the test to reflect the `..` canonicalization path it actually exercises.

**Low — `internal/app/app_test.go` (`TestRunScanRejectsInvalidInputs`): missing coverage for empty `--selection`**
- The invalid-input matrix tests missing `--out` but does not assert behavior when `--selection` is omitted, despite usage implying both are required.  
- **Fix:** add a case for `args: []string{"scan", "--out", out}` expecting a clear error about missing selection.

---

### Evidence Gaps

- `internal/scan` implementation is not in diff scope; the review assumes the unshown package correctly implements the safety contracts (symlink refusal, directory refusal, parent-existence checks, canonical path hardening) that the new tests assert.
- The diff does not show whether `scan.Run` validates an empty `SelectionPath` before opening it; the CLI layer does not guard against `""`.

---

### Recommendations

1. Handle `flag.ErrHelp` explicitly in `runScan` so help always exits 0.  
2. Use the actual written payload length for the “wrote … (N bytes)” summary.  
3. Align `TestRunScanRecordsOutsideSymlinkAsCannotVerify` with its stated intent (symlink) or rename it.  
4. Add a missing-`--selection` test case to close the CLI-validation gap.  

None of the above block merge; they can be addressed in a fast-follow.
