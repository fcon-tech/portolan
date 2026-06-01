# Portolan evaluation: spec-kit (blind Cursor profile)

**Mode:** REVIEW (read-only, no network, no target mutation)  
**Portolan command:** `/home/fall_out_bug/projects/sdp/portolan-051-portolan-quality-boundary/.portolan/bin/portolan` (`portolan dev`) via `scripts/bootstrap-portolan` — no system-wide `portolan` binary  
**Runs:** `context prepare --profile cursor` and `map --root` both succeeded

**Artifacts cited:**  
`context/agent-brief.md`, `context/answer-contract.md`, `context/evidence-index.jsonl`, `context/gaps.jsonl`, `map/summary.json`, `map/graph-index.json`, `map/findings.jsonl`, `map/map.md` (also `context/repos.json`, `context/oss-plan.json`, `map/coverage.json` for scope/next steps)

---

## 1. Local scope and completeness limits

**Answer:** One locally visible Git repository (`root` → `/home/fall_out_bug/projects/vibe_coding/spec-kit`) with bounded file/config inventory; ecosystem completeness and most cross-service semantics are explicitly incomplete.

**Evidence:**
- **Repositories:** 1 discovered (`context/agent-brief.md`, `context/repos.json` → `repo-root`)
- **Map graph:** 272 nodes, 108 edges, all `source-visible` (`map/summary.json`, `map/graph-index.json`)
- **File surfaces (sampled):** 15 config, 44 doc, 16 workflow, 13 source, 1 manifest, 19 unknown (`map/summary.json` → `file_surfaces`)
- **Structural graph:** Repository `root` has 108 `observes` edges to individual source files (`map/graph-index.json` → `edge_slices` / `high_degree_nodes`) — inventory containment, not service coupling

**Completeness limits:**
| Limit | Status | Source |
| --- | --- | --- |
| External ecosystem completeness | `unknown` | `gap-external-completeness` in `context/gaps.jsonl`, `map/coverage.json` |
| 11 direct child paths as repo candidates | `not_assessed` | `map/coverage.json` → `non-repository-children` |
| No manifest / `selection.json` | discovery-only scope | `context/answer-contract.md`, `map/summary.json` warnings |
| OSS/tool outputs in context | 0 observed, 2 producers available-not-run | `context/agent-brief.md`, `context/oss-plan.json` |
| Graph index truncation | 143/163 config nodes, 88/108 unknown nodes not in samples | `map/graph-index.json` → `truncated` |

**Next local command (smallest high-value read):**  
`portolan query gaps --bundle …/map --limit 20` (per `context/answer-contract.md`) before opening `graph.json`.

---

## 2. Relationships, duplication, configuration, technical debt

### Relationships (`source-visible` inventory only)

| Finding | Status | Meaning |
| --- | --- | --- |
| `finding-inventory-root` | observed | Repo path visible |
| 108× `observes` edges | source-visible | Root → file inventory (`map/graph-index.json`) |
| Go import / go.mod relationships | `not_assessed` | No Go relationship inputs (`finding-relationships-not-assessed`) |
| Non-Go source, runtime, service topology, lifecycle | `not_assessed` | Placeholders in `map/findings.jsonl` |

**Cannot claim:** Python/bash module coupling, “what talks to what” in production, or microservice topology from these artifacts.

### Duplication

| Finding | Status |
| --- | --- |
| `finding-duplication-not-assessed` | `not_assessed` — no native duplicate clusters or jscpd output (`map/findings.jsonl`, `map/map.md`) |

### Configuration surfaces (`source-visible`, names only where applicable)

From `map/findings.jsonl` / `map/map.md`:

| Surface | Count | Example evidence |
| --- | --- | --- |
| Config files | 15 | `.devcontainer/devcontainer.json`, `extensions/catalog.json`, issue templates |
| Env var references | 117 | `AGENT_CONFIG`, `AGENT_TYPE`, `AGENT_SKILLS_DIR_OVERRIDES` (`graph-index.json` samples) |
| Feature flags | 13 | Bash scripts under `scripts/bash/` |
| Manifests | 1 | `pyproject.toml` |
| Secret references | 1 | `.github/workflows/release-trigger.yml`, `release.yml` (values not recorded) |
| CI/CD workflows | 16 | `codeql.yml`, `release.yml`, `lint.yml`, etc. |

163 configuration-kind graph nodes (`map/summary.json`).

### Technical-debt candidates (not verdicts)

| ID | Status | Summary |
| --- | --- | --- |
| `finding-technical-debt-configuration-follow-up` | observed (`metadata-visible`) | Review 6 configuration surface findings as operational debt candidates |
| `finding-technical-debt-unresolved-findings` | `unknown` | 11 findings still `not_assessed` / `unknown` — do not draw architecture conclusions yet |

Per `context/answer-contract.md`: these are review prompts, not modernization or readiness decisions.

---

## 3. Must remain `unknown`, `cannot_verify`, or `not_assessed`

### `unknown`
- **External ecosystem completeness** — no manifest/inventory (`context/gaps.jsonl` → `gap-external-completeness`; `map/coverage.json`)
- **`finding-technical-debt-unresolved-findings`** — aggregate unresolved finding states (`map/findings.jsonl`)

### `not_assessed` (context gaps — no local OSS/tool output)
From `context/gaps.jsonl` / `context/evidence-index.jsonl`: asyncapi, backstage, code-index, cyclonedx, jscpd, openapi, semgrep, structurizr.

### `not_assessed` (map / detector limits)
From `map/findings.jsonl` and `map/summary.json` → `skipped_surfaces`:
- Duplication (exact clusters + jscpd)
- Near-clone / semantic config analysis
- Non-Go source relationships, runtime inference, service topology, lifecycle modeling
- Go import relationships (no `go.mod`/Go inputs observed)
- **11 direct child files** as repository candidates (`map/coverage.json`)

### `cannot_verify`
- **0** `cannot_verify` tool-output records in this run (`context/agent-brief.md`)
- Secret **values**, runtime behavior, production topology, semantic IaC correctness — not in artifacts; treat as `not_assessed` unless user supplies OSS outputs or runtime observations

---

## 4. Next three useful local actions (maintainer)

1. **Run approved OSS producers into the context output dir, then refresh context**  
   Use exact commands from `context/oss-plan.json`: **jscpd** (duplication) and **syft → CycloneDX** (component/dependency identity). After each:  
   `portolan context prepare --root …/spec-kit --out …/context --profile cursor --force`

2. **Remap after tool outputs exist**  
   `portolan map --root …/spec-kit --out …/map --force`  
   Then re-read `map/findings.jsonl` and `map/summary.json` for duplication/configuration deltas.

3. **Bounded drill-down before `graph.json`**  
   `portolan graph slice --bundle …/map --finding-kind configuration --out …/slice-config.json`  
   or `portolan query findings --bundle …/map --kind configuration --limit 20`  
   to prioritize env vars, workflows, and secret references without loading the full graph.

**Optional fourth (only if multi-repo estate matters):** add a curated `selection.json` at the target root and use `portolan map --selection …` to reduce `external-completeness` = `unknown`.

---

## Unsupported claims avoided

| Avoided claim | Why |
| --- | --- |
| Complete service/component inventory | `external-completeness` = `unknown` |
| Python/bash dependency or call graph | `finding-relationships-non-go-source-not-assessed`, `finding-unsupported-languages-not-assessed` |
| Runtime / production “what talks to what” | All relationship runtime/topology findings `not_assessed` |
| Copy-paste or near-duplicate code | `finding-duplication-not-assessed` |
| SBOM / transitive dependency truth | `gap-cyclonedx-not-assessed`; syft not run |
| API/async/architecture catalog facts | openapi/asyncapi/backstage/structurizr gaps `not_assessed` |
| Security/static-analysis posture | `gap-semgrep-not-assessed` |
| Ready to refactor / release / modernize | Answer contract + debt findings are candidates only |
| Secret values or credential exposure | Only name-level secret references recorded |

---

## Run status

| Step | Result |
| --- | --- |
| Bootstrap + version | OK (`portolan dev`) |
| `context prepare --profile cursor` | OK |
| `map --root` | OK (~9.2M target, 134 files — reasonable) |
| Blockers | None for artifact generation; **7 of 16 findings** `not_assessed`, **1** `unknown` on debt rollup |

Portolan works well here as a **bounded, evidence-tagged briefing layer**: scope inventory, configuration surface enumeration, and explicit gap ledger for a Python/bash/GitHub-actions CLI repo. It does **not** yet support blind architecture Q&A for relationships or duplication on this target without approved local OSS producer runs or curated inventory.
