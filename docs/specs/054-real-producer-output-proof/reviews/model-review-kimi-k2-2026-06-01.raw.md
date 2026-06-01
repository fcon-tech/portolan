# Spec 054 PR Readiness Review

Findings ordered by severity.

---

## 1. CRITICAL — T025/T026/T027/T028 remain incomplete; PR readiness checklist not executed

| field | value |
|---|---|
| **severity** | critical |
| **evidence** | tasks.md Final Phase lists T025-T028 as `[ ]` open; T028 (PR creation/closeout) is the explicit PR readiness gate. No evidence of local verification (`go test -count=1 ./...`, `go vet ./...`, `jq empty schema/*.json`, `git diff --check`), independent review lanes, or PR closeout present in this packet. |
| **recommendation** | Execute T025 at minimum before PR. Run full suite to detect cross-package regressions from `internal/contextprep` expansion. |
| **verdict** | cannot_verify (insufficient evidence) |
| **not_assessed** | T025-T028 individual pass/fail states |

---

## 2. HIGH — `producer_run.go` path traversal safety: symlink race between `isWithinPath` and `os.Lstat` on output file

| field | value |
|---|---|
| **severity** | high |
| **evidence** | `validateVerifiedProducerRun` joins `OutputPath` to `TargetRoot`, cleans both, calls `isWithinPath`, then calls `os.Lstat(cleanOutput)`. `isWithinPath` uses `filepath.Rel(root, path)` which follows semantics of `filepath.Rel`; `os.Lstat` separately dereferences. A symlink could point outside `TargetRoot` after `isWithinPath` succeeds but before `os.Lstat` reads it. However, `isSafeProducerRecordFile` in `contextprep.go` already checks `!os.ModeSymlink` via `Lstat` before calling validation. Validator itself also checks `ModeSymlink != 0` and rejects. The race window is narrow but the defense is layered; not a clear exploit. |
| **recommendation** | Document the layered defense in code comments. Consider atomic `open(O_NOFOLLOW)` + `fstat` pattern if elevated to stronger guarantee. |
| **verdict** | bounded_safe (mitigated by caller + validator double-check) |
| **not_assessed** | formal security audit, Windows behavior |

---

## 3. HIGH — Evidence semantics: `commandLooksUnsafe` is heuristic-only; no allowlist or signature path

| field | value |
|---|---|
| **severity** | high |
| **evidence** | `commandLooksUnsafe` uses substring matching (`http://`, `kubectl apply`, `docker run`, etc.). It will false-positive on legitimate local-safe commands (e.g., `cat docs/why-docker-run-is-bad.md`) and false-negative on obfuscated commands (`c\${url}url http://evil`, base64-encoded payloads). This is acknowledged in spec FR-002 as "record command/source" but leaves safe-command assessment as metadata, not enforced runtime security boundary. |
| **recommendation** | Document heuristic limitations in answer-contract and spec. Do not treat `commandLooksUnsafe` as a security gate; treat it as PR-review hygiene signal. Add `blocked` status documentation for human reviewer escalation. |
| **verdict** | cannot_verify (heuristic cannot formally prove safety) |
| **not_assessed** | formal command parsing, allowlist design |

---

## 4. HIGH/MEDIUM — Schema compatibility: `allowedEvidenceStates` defined in `producer_run.go` but not shown in this packet; risk of drift from canonical schema

| field | value |
|---|---|
| **severity** | high/medium |
| **evidence** | Validator references `allowedEvidenceStates[record.EvidenceState]` but this variable is not defined in the included `producer_run.go` snippet. Assumed defined elsewhere in the same package. No JSON Schema file for producer-run records is referenced in the diff stat (no `schema/` changes). T006 claims "Add schema or schema-adjacent validation coverage for producer-run JSONL in `schema/` or `internal/producerfamily/producer_run_test.go`" but diff stat shows no new `schema/` files. |
| **recommendation** | Confirm `allowedEvidenceStates` source and add explicit JSON Schema for producer-run JSONL to prevent schema drift across spec versions. |
| **verdict** | cannot_verify |
| **not_assessed** | full package scope, schema/ directory contents |

---

## 5. MEDIUM — CLI UX: new `producer-run` records surface in `evidence-index.jsonl` but no `portolan query` examples shown for producer-run filtering

| field | value |
|---|---|
| **severity** | medium |
| **evidence** | `agent-brief.md` mentions `portolan query gaps` for weak records. No test or doc shows `portolan query producer-run --family deployment-model` or equivalent. Users must grep `evidence-index.jsonl` directly. |
| **recommendation** | Add CLI query example to quickstart.md or document intentional absence. If query subcommand lacks family filter, note as known gap. |
| **verdict** | not_assessed |
| **not_assessed** | `portolan query` implementation surface, quickstart completeness |

---

## 6. MEDIUM — Data-model: `ProducerRunScope.CoveredUnits` is `[]string` with no unit-type taxonomy; risk of inconsistent labeling

| field | value |
|---|---|
| **severity** | medium |
| **evidence** | `CoveredUnits []string` allows freeform values like `service:bigtop`, `kind:Deployment`, `grpc/common.proto`. No enum, prefix convention, or taxonomy enforced. Cross-tool comparison of coverage will be string-matching fragile. |
| **recommendation** | Document prefix convention in `data-model.md`. Future spec should add typed unit kinds or validate known prefixes. |
| **verdict** | cannot_verify (no enforcement) |
| **not_assessed** | downstream consumption, agent parsing robustness |

---

## 7. MEDIUM — Tests: `TestRunContextPrepareProducerRuns` uses `strings.ReplaceAll` for fixture substitution; fragile template pattern

| field | value |
|---|---|
| **severity** | medium |
| **evidence** | `mustWrite(..., strings.ReplaceAll(..., "$ROOT", root))` — if root contains characters that collide with JSON escaping or if `$ROOT` appears in a real path value, substitution is wrong-tool. Standard approach is `fmt.Sprintf` with `%q` or template struct. |
| **recommendation** | Refactor to `fmt.Sprintf` or `text/template` with explicit struct. Preserve current behavior as retroactively understood. |
| **verdict** | cannot_verify (works for known inputs, not robust) |
| **not_assessed** | full test edge-case matrix |

---

## 8. MEDIUM — Overclaim risk: spec title "Real Producer Output Proof" vs. bounded scope; marketing pressure on maintainers

| field | value |
|---|---|
| **severity** | medium |
| **evidence** | Spec title implies verified real outputs; actual US3 Cursor verdict is `narrowed`, not `verified`, for architecture understanding. Status notes "symbol/reference, full API/catalog/model coverage, runtime topology, and human/enterprise-intelligence parity remain `not_assessed`". This is correctly scoped in body text but the title is aspirational. |
| **recommendation** | No code change required. Ensure PR description and commit message repeat the `narrowed`/`not_assessed` boundary so title is not interpreted as broader proof. |
| **verdict** | verified (correctly scoped in content, title risk is comms) |
| **not_assessed** | external reader interpretation |

---

## 9. LOW — `contextprep.go` mixed concerns: `producerEvaluationRecord` renamed/retained alongside new `producerRunEvidenceRecord`

| field | value |
|---|---|
| **severity** | low |
| **evidence** | `producerEvaluationRecord` (old eval-based) and `producerRunEvidenceRecord` (new run-based) coexist. The former maps `producerfamily.EvaluationRecord` which is not in this packet's diff. Risk of naming confusion: "evaluation" vs "run" terminology drifts. |
| **recommendation** | Add deprecation comment to `producerEvaluationRecord` if evaluations are superseded by runs, or document dual-track intent. |
| **verdict** | cannot_verify |
| **not_assessed** | evaluation record future roadmap |

---

## 10. LOW — `invalid-runtime-visible-static.jsonl` fixture name is misleading

| field | value |
|---|---|
| **severity** | low |
| **evidence** | Fixture file named `invalid-runtime-visible-static.jsonl` but per producer_run.go validator, non-runtime families with `runtime-visible` are rejected. The "static" in the filename suggests static analysis, but the invalidness is the `evidence_state`/`family` mismatch, not the file content being static. Minor naming friction for future maintainers. |
| **recommendation** | Rename to `invalid-evidence-state-family-mismatch.jsonl` or add one-line comment in fixture README. |
| **verdict** | not_assessed |
| **not_assessed** | — |

---

## 11. LOW — `AGENTS.md` and `.specify/feature.json` changed but no diff content shown

| field | value |
|---|---|
| **severity** | low |
| **evidence** | Both files show `M` in diff stat but no content included in packet. Cannot verify whether feature pointer or agent instructions drift. |
| **recommendation** | Include AGENTS.md diff in PR description or confirm no semantic change (e.g., only branch name update). |
| **verdict** | cannot_verify |
| **not_assessed** | file contents |

---

## 12. LOW — `docs/specs/055-runtime-topology-evidence/` and `056-bigtop-architecture-understanding/` added as forward specs

| field | value |
|---|---|
| **severity** | low |
| **evidence** | Two future specs added with `checklists/requirements.md` + `spec.md` but no implementation. They are correctly scoped as placeholders. Risk: reviewers may assume 054 enables 055/056 claims. |
| **recommendation** | Ensure 055/056 specs contain explicit "depends on 054 merged" note and do not claim enablement from 054 alone. |
| **verdict** | not_assessed |
| **not_assessed** | 055/056 spec contents |

---

## Overall Assessment: Bigtop Architecture Overclaim

| claim | verdict | evidence |
|---|---|---|
| Portolan understands Bigtop architecture like human/enterprise CI | **not_assessed** | US3 Cursor returned `narrowed`; spec explicitly scopes this to future specs 055/056 |
| Portolan executes producers natively | **verified false** | No `portolan produce` command; records are externally generated |
| Static Compose/Helm/protoc outputs prove runtime topology | **verified false** | Validator enforces `metadata-visible` for non-runtime families; answer-contract explicitly forbids |
| Cursor uses real producer-run IDs correctly | **verified** | US3 review shows correct citation with bounded limitations |
| Runtime topology from this slice | **not_assessed** | No runtime-observation records supplied; map skips runtime inference |
| Symbol/reference coverage from this slice | **not_assessed** | Symbol-index producer-run records are `not_assessed` |
| Full API/catalog/model coverage | **not_assessed** | Protoc evidence bounded to two Alluxio proto files |
| Two+ non-Syft/CycloneDX families dispositioned with durable evidence | **verified** | `deployment-model` (2 runs) + `api-catalog` (1 run) = 2 families, plus `runtime-observation` and `symbol-index` explicitly `not_assessed` |

Implementation **does not overclaim** Bigtop architecture/runtime. The narrow proof is honest. PR readiness is **blocked on T025-T028 execution**.
