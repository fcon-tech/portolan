# Spec 054 PR Readiness Review

**Branch**: `codex/054-bigtop-architecture-proof`
**Review date**: 2026-06-01
**Reviewer scope**: Evidence semantics, path/output safety, schema compatibility, CLI UX, tests, overclaim risk

---

## Findings Ordered by Severity

### 1. 🔴 Verified producer-run records require target_root-relative output_path to be a real file on disk

| Field | Value |
|---|---|
| **Severity** | High |
| **Evidence** | `validateVerifiedProducerRun` calls `os.Lstat(cleanOutput)` and rejects the record if the file doesn't exist or isn't a regular non-symlink file. This means producer-run records with `status: "verified"` are **non-portable**: a record validated on one machine with `/home/fall_out_bug/projects/bigtop-landscape/.portolan/...` will fail validation on another machine where the file doesn't exist. Test fixtures use `t.TempDir()` so CI is fine, but the Bigtop smoke records reference absolute paths on the developer's machine. The JSONL template file (`producer-runs.template.jsonl`) uses `$ROOT` placeholders, suggesting awareness of this, but the actual validation path means you cannot replay verified records without the referenced output files present. |
| **Recommendation** | Consider either: (a) accepting `verified` records without file-existence checks when the output is outside the current target root (e.g., in a different mount), making `os.Lstat` a warning/cannot_verify downgrade rather than a hard rejection; or (b) explicitly documenting that verified records are machine-scoped and that replay requires file presence. For PR readiness, at minimum add a doc comment on `ValidateProducerRun` stating the file-existence requirement and its portability implications. |
| **Verdict** | `cannot_verify` — may be intentional design, but no doc/comment explains the portability trade-off. |
| **not_assessed** | Whether the Bigtop smoke records will be committed (they reference `/home/fall_out_bug/...` absolute paths). |

---

### 2. 🟡 `commandLooksUnsafe` blocklist is lexical, easily bypassed

| Field | Value |
|---|---|
| **Severity** | Medium |
| **Evidence** | The function checks for literal substrings like `"http://"`, `"docker run"`, `"kubectl apply"`. A command like `"DOCKER_RUN=1 ./scan.sh"` or `"curl ftp://..."` or `"kubectl  apply"` (double space) would pass. The blocklist is also case-insensitive but only for ASCII lowercasing; Unicode homoglyphs or `HTTP://` (upper) are handled but `curl -sSf` (no `://`) is not flagged despite being network access. |
| **Recommendation** | The function is a reasonable defense-in-depth guard for recorded metadata, not a sandbox. Add a comment stating this is a **heuristic**, not a security boundary. For PR readiness this is acceptable if documented. If the project wants stronger guarantees, consider a positive-allowlist model instead. |
| **Verdict** | `verified` as heuristic; `cannot_verify` as security boundary. |
| **not_assessed** | Whether the spec intended this as a security boundary or a consistency check. |

---

### 3. 🟡 `decodeProducerRunStrict` uses `DisallowUnknownFields` — schema evolution risk

| Field | Value |
|---|---|
| **Severity** | Medium |
| **Evidence** | `json.Decoder.DisallowUnknownFields()` means any new field added to the JSONL schema (e.g., by a future spec) will cause all existing records to fail validation. The existing evidence-index records elsewhere use a more lenient decoder. This creates a strict/lenient split where producer-run records are harder to evolve than other record types. |
| **Recommendation** | Either (a) document that producer-run JSONL is a frozen contract where new fields require a schema version bump, or (b) switch to lenient decoding and validate required fields manually (which is already done in `ValidateProducerRun`). Option (b) is safer for forward compatibility. |
| **Verdict** | `cannot_verify` — may be intentional strictness, but no spec/doc states this is a frozen schema. |
| **not_assessed** | Whether specs 055/056 plan to add fields to producer-run records. |

---

### 4. 🟡 Test fixture `producer-runs.template.jsonl` uses `$ROOT` but no substitution is tested

| Field | Value |
|---|---|
| **Severity** | Medium |
| **Evidence** | The template file contains `$ROOT` placeholders, but the app test uses `strings.ReplaceAll(..., "$ROOT", root)` to do substitution inline. The template file itself is never loaded or tested by the test suite — it serves as human documentation. However, there is no test that validates the template file parses correctly after substitution, meaning the template could drift from what the code expects. |
| **Recommendation** | Add a test that loads `producer-runs.template.jsonl`, performs `$ROOT` substitution against a temp dir with the expected output files, and validates it through `ValidateProducerRunJSONLFile`. This catches template drift. |
| **Verdict** | `cannot_verify` — no test covers the template fixture itself. |
| **not_assessed** | Whether the template is intended as a tested artifact or purely human-readable documentation. |

---

### 5. 🟡 `not_assessed` status requires `not_assessed` evidence_state, but other status→state pairings are unvalidated

| Field | Value |
|---|---|
| **Severity** | Low-Medium |
| **Evidence** | The validator enforces `not_assessed status → not_assessed evidence_state` but does not enforce, e.g., `verified status → observed/metadata-visible/source-visible evidence_state` (only that it can't be `not_assessed/unknown/cannot_verify`). Similarly, `failed` or `blocked` have no required evidence_state. This asymmetry means `failed` + `observed` is valid, which may be semantically confusing. |
| **Recommendation** | Either add cross-validation rules for other status→state pairs or document that only the `not_assessed` pairing is enforced and others are best-effort. |
| **Verdict** | `verified` — the existing rule prevents the most dangerous overclaim (`not_assessed` with a strong state). |
| **not_assessed** | Whether the spec intended stricter cross-validation. |

---

### 6. 🟡 `privacy_review` is required but only validates against an enum

| Field | Value |
|---|---|
| **Severity** | Low-Medium |
| **Evidence** | `privacy_review` is a required field validated against `allowedProducerRunPrivacy`, but the fixture records and Bigtop smoke records all use `"privacy_review": "not_assessed"`. There is no test for `local_safe` or `redacted` values, and no logic that acts on the `privacy_review` value (e.g., to redact paths in agent-brief output). The field exists but is effectively a placeholder. |
| **Recommendation** | Add at least one test with `privacy_review: "local_safe"` and consider whether agent-brief or evidence-index output should sanitize paths when `privacy_review != "local_safe"`. If this is deferred, mark it as a known gap in the spec. |
| **Verdict** | `cannot_verify` — field exists but has no behavioral effect. |
| **not_assessed** | Whether FR-008 (no private paths in public/committed excerpts) is actually enforced by code or relies on operator discipline. |

---

### 7. 🟢 No `portolan produce` command introduced — execution boundary holds

| Field | Value |
|---|---|
| **Severity** | N/A (positive finding) |
| **Evidence** | The diff adds `internal/producerfamily/` (validation only), `internal/contextprep/` integration (reading JSONL files), and test fixtures. No new `cmd/` entry, no Docker/Helm/protoc execution wrapper, no network calls. The US2 review confirmed via `rg` that no new execution commands were added. The answer contract explicitly states "they do not imply a `portolan produce` command exists." |
| **Recommendation** | None needed. |
| **Verdict** | `verified`. |
| **not_assessed** | N/A. |

---

### 8. 🟢 Runtime overclaim prevention is thorough

| Field | Value |
|---|---|
| **Severity** | N/A (positive finding) |
| **Evidence** | Multiple layers prevent runtime overclaim: (1) `ValidateProducerRun` rejects `runtime-visible` evidence_state for non-runtime families; (2) `gaps.jsonl` explicitly records `symbol-index` and `runtime-observation` as `not_assessed`; (3) agent-brief states metadata-visible records "do not prove runtime topology"; (4) answer contract has a "Hard Boundaries" section; (5) the app test asserts no static producer run overclaims `runtime-visible`. Cursor stress test confirmed all overclaim surfaces are `verified`. |
| **Recommendation** | None needed. |
| **Verdict** | `verified`. |
| **not_assessed** | N/A. |

---

### 9. 🟢 Symlink safety is enforced

| Field | Value |
|---|---|
| **Severity** | N/A (positive finding) |
| **Evidence** | Both `isSafeProducerRecordDir` and `isSafeProducerRecordFile` reject symlinks via `os.Lstat` + `ModeSymlink` check. `validateVerifiedProducerRun` also rejects symlink output files. Test `TestRunContextPrepareSkipsSymlinkedProducerEvaluationFiles` confirms symlinked records are skipped. |
| **Recommendation** | None needed. |
| **Verdict** | `verified`. |
| **not_assessed** | N/A. |

---

### 10. 🟢 Path traversal protection for verified output_path

| Field | Value |
|---|---|
| **Severity** | N/A (positive finding) |
| **Evidence** | `isWithinPath` correctly resolves relative paths and rejects `..` traversal. The verified-run validation resolves relative output paths against `target_root` before checking containment. |
| **Recommendation** | None needed. |
| **Verdict** | `verified`. |
| **not_assessed** | N/A. |

---

### 11. 🟢 Specs 055/056 are forward-referenced but not implemented

| Field | Value |
|---|---|
| **Severity** | Info |
| **Evidence** | The diff adds `docs/specs/055-runtime-topology-evidence/` and `docs/specs/056-bigtop-architecture-understanding/` with spec.md and requirements.md files, but no implementation code. The task list and US3 review correctly mark runtime topology, symbol-index, and full architecture understanding as `not_assessed` and deferred to those specs. |
| **Recommendation** | Ensure the PR description scopes the claim to "narrowed proof" and explicitly lists what is deferred. |
| **Verdict** | `verified` — forward specs are correctly scoped as future work. |
| **not_assessed** | Whether the 055/056 spec files are mature enough to merge (they may be draft placeholders). |

---

### 12. 🟢 CLI UX — no new CLI commands or flags

| Field | Value |
|---|---|
| **Severity** | Info |
| **Evidence** | The implementation uses existing `portolan context prepare` and `portolan map` commands. Producer-run records are discovered from conventional file locations (`producer-runs.jsonl`, `producer-run-records.jsonl`) in `.portolan/`, `reports/`, and repository roots. No new flags or subcommands. |
| **Recommendation** | None needed. |
| **Verdict** | `verified`. |
| **not_assessed** | Whether documentation should describe the conventional file locations for operator discovery. |

---

## Summary Verdict Table

| # | Finding | Severity | Verdict | not_assessed |
|---|---|---|---|---|
| 1 | File-existence requirement for verified records limits portability | 🔴 High | `cannot_verify` | Whether Bigtop smoke records will be committed |
| 2 | `commandLooksUnsafe` is lexical heuristic only | 🟡 Medium | `verified` as heuristic | Whether intended as security boundary |
| 3 | `DisallowUnknownFields` blocks schema evolution | 🟡 Medium | `cannot_verify` | Whether 055/056 add fields |
| 4 | Template fixture untested for drift | 🟡 Medium | `cannot_verify` | Whether template is tested artifact |
| 5 | Incomplete status→evidence_state cross-validation | 🟡 Low-Med | `verified` | Whether spec intended stricter rules |
| 6 | `privacy_review` field has no behavioral effect | 🟡 Low-Med | `cannot_verify` | Whether FR-008 is code-enforced |
| 7 | No execution wrapper introduced | 🟢 | `verified` | — |
| 8 | Runtime overclaim prevention | 🟢 | `verified` | — |
| 9 | Symlink safety enforced | 🟢 | `verified` | — |
| 10 | Path traversal protection | 🟢 | `verified` | — |
| 11 | Specs 055/056 forward-referenced | 🟢 Info | `verified` | Maturity of draft specs |
| 12 | No new CLI surface | 🟢 Info | `verified` | Whether file conventions need docs |

---

## Overall PR Readiness

**Verdict**: **Conditionally ready** — the implementation is disciplined, well-tested, and does not overclaim. The three `cannot_verify` items (portability, schema evolution, template drift) are documentation/comment gaps rather than correctness bugs. They can be addressed as either:

- (a) Pre-merge: add doc comments and a template-drift test (≈30 min work), or
- (b) Follow-up: file as tracked issues before merge.

The implementation correctly scopes itself as a "narrowed proof" and does not claim Bigtop architecture understanding or runtime topology from static metadata. No blockers found.
