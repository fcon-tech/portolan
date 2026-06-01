# Research: Language Agnostic Evidence Producers

## Decision: Organize By Evidence Family, Not Language Adapter

Decision: Recommendations should be keyed by producer family and blocked claim,
not by implementation language.

Rationale: Enterprise landscapes are mixed by default. A PHP project, JVM
project, shell-heavy deployment repo, and black-box service can all need the
same family of evidence: dependencies, symbols, API/catalog, deployment model,
static findings, config, duplication, or runtime observations. Language-specific
adapter names encourage overclaiming and recreate mature scanner work inside
Portolan.

Alternatives considered:

- JVM adapter first: rejected as too narrow and likely to mislead users about
  Portolan owning language semantics.
- PHP adapter first: rejected for the same reason.
- One generic "code intelligence" family: rejected because it hides important
  distinctions between dependency, symbol, API/catalog, model, static finding,
  and runtime evidence.

## Decision: Candidate Tools Are Options Until Locally Evaluated

Decision: Candidate producers may appear in recommendation records only as
options unless a local evaluation record marks them accepted or narrowed.

Rationale: Portolan must not claim broad OSS producer support from reputation or
web research alone. The useful product behavior is saying what kind of local
evidence would reduce a gap and what candidate tools might produce it, while
preserving `not_assessed` until local output or local smoke evidence exists.

Alternatives considered:

- Treat known tools as supported by name: rejected because local execution,
  output shape, license, privacy, and maintenance risks differ per tool and
  version.
- Hide tool names until fully implemented: rejected because agents need useful
  next-action surfaces.

## Decision: Reuse Context Pack Artifacts First

Decision: Implement the first surface through context-pack artifacts and
existing evidence/gap records before adding a new CLI command.

Rationale: `context prepare` is already the agent entrypoint before broad
answers. Recommendations are navigation hints, so they belong near
`evidence-index.jsonl`, `gaps.jsonl`, `tool-registry.json`, `oss-plan.json`, and
`answer-contract.md`.

Alternatives considered:

- New `producer` CLI command: deferred until context-pack use proves the shape.
- Map-only findings: rejected for the first slice because agents need
  next-action recommendations before running or opening a full map bundle.

## Decision: Reject Risky Defaults By Boundary, Not By Tool Brand

Decision: A producer candidate that defaults to network access, credentials,
daemon behavior, target mutation, or source export must be rejected, blocked, or
narrowed for local-only use before appearing as a default recommendation.

Rationale: Portolan's local-first boundary is more important than matching any
specific ecosystem. Some tools may be acceptable in an offline export mode and
unacceptable in a default service mode.

Alternatives considered:

- Per-tool allow/block list only: rejected because versions and modes matter.
- Let the agent decide dynamically: rejected because agent prose can blur
  evidence and approval boundaries.

## Decision: UX Polish Remains Downstream

Decision: This slice should not redesign the report UI or public presentation.
It should produce machine-readable recommendation/evaluation evidence that a
later UX/report slice can render.

Rationale: The active product gap is evidence routing. A prettier report that
still lacks producer-family coverage would preserve the wrong end state.

Alternatives considered:

- Add a human-facing report section now: deferred unless needed to prove the
  machine-readable artifact is usable.
