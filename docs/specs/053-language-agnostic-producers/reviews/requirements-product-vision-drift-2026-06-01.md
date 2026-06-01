# Requirements And Product-Vision Drift Review

Date: 2026-06-01

Spec: `docs/specs/053-language-agnostic-producers/`

Branch: `codex/053-language-agnostic-producers`

Base: stacked on `codex/052-dependency-symbol-evidence-import` head
`27ccbb95199b7fc021d85f55098f1df40fd41537`

## Decision Gate

- Simpler/Faster: extend context-pack recommendation/evaluation artifacts
  before adding a new command, dependency, producer executor, or UI surface.
- Blocking Edge Cases: mixed PHP/JVM/Scala/TypeScript/shell/deployment estates;
  candidate tools that require network, credentials, daemons, mutation, or
  source export; partial outputs; stale or off-root producer evidence; agents
  overreading recommendations as proof.
- Existing Open Source: use existing producer ecosystems such as CycloneDX/Syft,
  SCIP/LSIF, Serena, Sourcebot/Zoekt, Backstage, OpenAPI, AsyncAPI,
  Structurizr, Semgrep, jscpd, and runtime observation exports as candidate
  producers. Portolan should evaluate and normalize outputs, not reimplement
  scanners by language.

## Requirements Drift

verified:

- Spec 053 directly follows the unresolved 052 closeout gaps: real symbol,
  API/catalog/model, and runtime producer evidence remain `not_assessed`.
- User concern about PHP and mixed-language projects is represented as
  producer-family coverage, not per-language adapter implementation.
- Requirements preserve the difference between recommendation, candidate
  evaluation, normalized local output, and observed evidence.

not_assessed:

- Actual local output compatibility for SCIP/LSIF/Serena/Sourcebot/Zoekt.
- Actual local output compatibility for additional API/catalog/model producers
  beyond existing context summaries.
- Runtime observation contracts beyond prior spec 044 boundaries.

## Product-Vision Drift

verified:

- Local-first/read-only default is preserved.
- No new network, daemon, credential, mutation, or source-export behavior is
  approved.
- OSS composition posture is stronger than a language-owned scanner model.
- `unknown`, `cannot_verify`, and `not_assessed` remain valid states.
- Cursor + Composer 2.5 remains a stress client, not the product boundary.

risks:

- A future implementation could accidentally turn candidate tools into support
  claims. Tasks require tests and answer-contract wording to prevent that.
- A stacked branch includes 052 changes until PR #29 merges. Implementation
  should either wait for 052 merge/rebase or keep all future PRs explicitly
  stacked.

## Recommendation

Proceed with specification and planning only. Do not implement until PR #29
merge/approval status is resolved or the user explicitly accepts a stacked
implementation branch.
