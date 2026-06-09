# Research: Bigtop Brownfield Preflight

## Decision: Add A Preflight Command, Not A Dashboard Or Scanner

Rationale: The product gap is first-run orientation before AI work. A local CLI
command that composes existing artifacts is the smallest surface that can make
Cursor/Codex/OpenCode/pi behavior visibly different without competing with
Graphify, Understand Anything, GitNexus, Sourcegraph, or modernization tools.

Alternatives considered:

- Static HTML report: rejected because it duplicates better graph/exploration
  products and does not create the promised tool-integration behavior.
- New scanner: rejected because existing Portolan context/map outputs and OSS
  tools already cover the useful first slice.
- Agent harness/orchestrator: rejected because Portolan should improve context
  and tool selection, not own coding loops or model routing.

## Decision: Candidate Tools Are Recommendations Until Output Is Imported

Rationale: A tool plan, missing binary, or approval-required command is not
evidence. The preflight can say "Semgrep would unlock config/security-pattern
evidence" or "ast-index may unlock symbol/reference gaps", but graph facts
remain unchanged until local outputs are saved and normalized.

Alternatives considered:

- Treat planned tool outputs as `unknown` graph facts: rejected because it
  pollutes graph evidence with future actions.
- Treat installed tools as `metadata-visible` evidence: rejected unless the
  installed tool has produced a local output artifact relevant to the target.

## Decision: Use Bigtop As Demonstration Target, Not Product Mode

Rationale: Bigtop is messy and has prior local evidence, so it is a good first
stress target. The implementation should still read generic context/map artifact
directories and avoid hidden Bigtop-specific file lists.

Alternatives considered:

- Generalize the first slice to arbitrary enterprise landscapes: rejected as
  too broad and likely to recreate SDP-style ambition drift.
- Hard-code Bigtop repositories: rejected because it makes the demo impressive
  but the product false.

## Decision: Standard Library Only

Rationale: JSON, JSONL, Markdown rendering, path handling, and CLI dispatch can
be implemented with existing project patterns and Go standard library.

Alternatives considered:

- Add Markdown/schema helper libraries: rejected because the formatting and
  validation needs are small and do not justify dependency/license review.

## Decision: Contract Schema Plus Manual Go Validation

Rationale: `toolchain.json` is the machine-readable artifact most likely to be
consumed by agents and later tool-doctor/import loops. The JSON Schema documents
the external contract, while the implementation uses explicit Go validation
checks for required fields and enum values to preserve the no-new-dependency
decision.

Alternatives considered:

- Schema every emitted artifact: rejected as process-heavy for the first slice.
- Runtime JSON Schema validation dependency: rejected because the first slice can
  enforce the needed contract with explicit Go checks and repository-level `jq`
  syntax validation.
- No schema: rejected because tool recommendation/evidence boundaries need a
  documented machine-readable contract.

## Decision: Escape And Bound Target-Derived Strings

Rationale: Repository names, paths, manifest keys, and finding titles may
contain prompt-injection text or secret-like payloads. Preflight Markdown is an
agent-facing artifact, so target-derived values are untrusted display data.

Alternatives considered:

- Render raw target strings for maximum fidelity: rejected because it can turn a
  malicious filename or manifest key into downstream agent instruction text.
- Full secret scanner in preflight: rejected for this slice because Portolan
  should not add a new scanner. The first slice avoids raw snippets/payloads and
  links existing artifacts instead.
