# Architecture Synthesis Ledger: Spec 069

Date: 2026-06-02
Branch: `codex/069-bigtop-architecture-synthesis`
Model: Cursor Agent `composer-2.5`

## Stress Evidence

| Lane | Prompt | Output | Status |
| --- | --- | --- | --- |
| Cursor plus Portolan synthesis | `stress/cursor-architecture-synthesis-prompt-2026-06-02.md` | `stress/cursor-architecture-synthesis-output-2026-06-02.md` | assessed |

The lane completed with:

```bash
cursor-agent --print --mode ask --model composer-2.5 --trust "$(cat docs/specs/069-bigtop-architecture-synthesis/stress/cursor-architecture-synthesis-prompt-2026-06-02.md)"
```

No Bigtop services were started. No Kubernetes cluster was contacted. The
synthesis packet used repo-local ledgers and backlog summaries.

## Review Lane Evidence

| Lane | Model | Status | Notes |
| --- | --- | --- | --- |
| Review lane 1 | `openrouter/deepseek/deepseek-v4-pro` | assessed | Produced usable findings. Accepted clarifications are dispositioned in `review-disposition-2026-06-02.md`. |
| Review lane 2 | `kimi-coding/kimi-for-coding` | not_assessed | Off-task no-tools lane; it requested file/tool access instead of reviewing the supplied packet. |
| Replacement lane 2 | `openrouter/xiaomi/mimo-v2.5-pro` | assessed | Explicit replacement for the degraded Kimi lane. |
| Review lane 3 | `zai/glm-5.1` | assessed | Produced usable findings. Accepted clarifications are dispositioned in `review-disposition-2026-06-02.md`. |

The three assessed independent non-GPT review lanes for FR-007 are DeepSeek,
MiMo, and GLM. Kimi is recorded as `not_assessed` and does not count.

## C1-C9 Scoring After PR #46

| Criterion | State after spec 058 | State after PR #46 | Decision |
| --- | --- | --- | --- |
| C1 Landscape scope and role map | partial | partial | No upgrade. Ctags breadth improves inventory-like evidence but does not verify a complete role map for the full checkout. |
| C2 Static dependency and relationship graph | partial | partial | No upgrade. Semgrep and existing graph slices add metadata/source findings, not a complete queryable relationship graph. |
| C3 Deployment model | partial | verified bounded `metadata-visible` | Upgraded for bounded static deployment-model evidence: Compose config and Helm render are real producer outputs with evidence-state boundaries. This is not runtime topology. |
| C4 Runtime topology | not_assessed / cannot_verify | cannot_verify | No runtime topology verification. Read-only probes found no Bigtop runtime surface; provisioner execution remains blocked pending explicit approval. Helm render and Compose config provide static declarations, not live pod/container/service/process observations. |
| C5 API/catalog/model surfaces | partial | partial, stronger | Protobuf descriptor sets, Semgrep, Compose, and Helm widen bounded source-visible and metadata-visible API/catalog/model evidence beyond Syft/CycloneDX, but blocked proto groups and incomplete catalog/model coverage prevent full verification. Runtime-resolved API/catalog state remains `cannot_verify` without live service connectivity. |
| C6 Symbol/reference graph | not_assessed / thin partial | partial | Upgraded from thin selected-file symbol evidence to broad ctags definition evidence, but definitions-only output does not prove references or call graph. C6 references and call graph remain `cannot_verify`; cross-reference resolution was not produced. |
| C7 Evidence-state discipline | partial | partial, stronger | Producer ledgers are better, and the synthesis preserves boundaries; not every architecture answer is canonical queryable graph evidence. |
| C8 Cursor augmentation value | partial | partial | No post-wave paired Cursor-only vs Cursor-plus-Portolan full rubric rerun exists in this slice. Existing paired evidence still supports bounded improvement only; the post-wave value-add delta is not isolated by a fresh Cursor-only control lane. |
| C9 Enterprise parity threshold | cannot_verify | cannot_verify | No upgrade. C4 runtime topology and full C6 symbol/reference graph are not verified. Static deployment/API/model outputs improve bounded reasoning but do not satisfy enterprise/human parity. |

Consolidated parity statement:

- Human/enterprise architecture parity: `cannot_verify`. The slice verifies
  stronger bounded producer evidence and better claim discipline, but does not
  verify runtime topology, references, call graph, or a post-wave paired
  Cursor-only control comparison.

## What Changed After PR #46

verified:

- Bounded deployment-model evidence is materially stronger than spec 058:
  Docker Compose config from spec 067 and Helm rendered manifests from spec 068
  are real producer outputs with explicit `metadata-visible` boundaries.
- Bounded API/catalog/model evidence is stronger:
  spec 066 generated Hadoop HDFS/common, Hadoop YARN API/common, and HBase REST
  descriptor sets with counts for files, messages, enums, services, and methods.
- Bounded symbol evidence is stronger:
  spec 059 recorded Universal Ctags definition output across 15 selected Bigtop
  targets.
- Runtime absence and approval gates are clearer:
  specs 060-065 recorded read-only absence probes, provisioner approval,
  preflight, and exact execution gate.

cannot_verify:

- Bigtop runtime topology remains unverified because no live
  process/container/orchestrator observation exists.
- Full symbol/reference graph remains unverified because broad ctags output is
  definition evidence only and reference-capable producers were absent or
  blocked.
- Call graph remains unverified.
- Human or enterprise code-intelligence parity remains unverified.

## Producer Families Beyond Syft/CycloneDX

| Family | Evidence status | Claim boundary |
| --- | --- | --- |
| Universal Ctags definitions | verified bounded | Broad definitions for selected Bigtop targets; not references or call graph. |
| Semgrep local rules | verified bounded | Source/metadata findings; not runtime, corpus completeness, or call graph. |
| `protoc` descriptors | verified bounded | API/catalog metadata for selected Hadoop/HBase proto scopes; blocked groups remain. |
| Docker Compose `config` | verified bounded `metadata-visible` | Desired deployment model; not running containers. |
| Helm `template` render | verified bounded `metadata-visible` | Desired Kubernetes model; not live pods/services/endpoints. |
| Runtime probes | verified as absence/gate evidence | Proves inspected runtime topology cannot be verified, not runtime topology itself. |
| Full def/ref or call graph producer | cannot_verify | No reference-capable graph output exists for the declared scope. |
| Runtime capture producer | blocked / cannot_verify | Requires explicit approval to start and capture a runtime. |

## Claim Decision

Allowed wording:

> After PR #46, Cursor plus Portolan has materially stronger bounded evidence
> discipline for Bigtop architecture reasoning. Portolan now has verified
> bounded producer outputs, verified as bounded rather than fully complete,
> beyond Syft/CycloneDX for static deployment models, API/catalog descriptors,
> local source/metadata findings, and broad symbol definitions, while preserving
> explicit evidence states.

## Prohibited Action Check

verified for this slice:

- No Bigtop services were started.
- No Kubernetes cluster was contacted.
- No Helm release was installed or upgraded.
- No target repository mutation was performed.
- No network-dependent producer was added.

not_assessed:

- Current live Docker/Kubernetes/process state was not reprobed by this docs
  synthesis slice; it relies on the recorded probes from specs 060 and 065.

Disallowed wording:

> Portolan plus Cursor understands Bigtop architecture like a human architect or
> enterprise code intelligence system.

> Portolan verifies Bigtop runtime topology.

> Portolan has a full Bigtop symbol/reference graph or call graph.

## Next Evidence Required

1. Runtime topology can move to `verified` only after an explicitly approved
   runtime-visible capture observes running Bigtop processes, containers,
   services, pods, endpoints, ports, or equivalent orchestrator state.
2. Full symbol/reference can move to `verified` only after a reference-capable
   producer produces definitions and references for a declared scope, with
   coverage and validation evidence.
3. Enterprise parity can be reconsidered only after C4 and C6 are verified or
   the claim is explicitly narrowed so it no longer says enterprise/human
   architecture parity.
