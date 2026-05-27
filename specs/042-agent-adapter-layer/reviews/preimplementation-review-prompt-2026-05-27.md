# Pre-Implementation Review Prompt - 2026-05-27

You are an independent Portolan reviewer. Review spec `specs/042-agent-adapter-layer/` before implementation.

Repo rules:

- Portolan is local-first and read-only by default.
- Portolan is not a coding harness and not a replacement for Graphify, Git Nexus, Serena, Repomix, Sourcegraph, or enterprise code intelligence.
- Evidence states must remain honest: `source-visible`, `metadata-visible`, `runtime-visible`, `claim-only`, `unknown`, `cannot_verify`, `not_assessed`.
- Missing, inferred, ambiguous, or producer-only evidence must not be upgraded to observed evidence.
- Prefer importing and normalizing OSS/tool outputs over reimplementing mature scanners.

Feature summary:

- Evaluate first-wave OSS/context inputs: Graphify, SCIP/Serena-style symbol indexes, and Repomix.
- Add a minimal Graphify-style adapter validation path or document a blocker.
- Publish adapter profiles for Graphify, symbol indexes, and Repomix.
- Avoid new dependencies, network behavior, producer execution, target mutation, or full Graphify graph import in this slice.

Proposed pre-coding decision:

- Extend the existing OSS adapter contract with an optional bounded confidence map.
- Validate Graphify-style mapping: `EXTRACTED` -> `metadata-visible`; `INFERRED` -> `claim-only`; `AMBIGUOUS` -> `cannot_verify`.
- Reject mappings that upgrade producer confidence to `source-visible`.
- Keep SCIP/Serena and Repomix as profile/docs first.

Review planes:

- requirements fit;
- evidence semantics;
- local-first/privacy/security;
- schema compatibility;
- UX/DX for agents;
- test gaps.

Output required:

- findings: list severity `critical|major|minor`, evidence, and recommendation;
- verdict: `pass`, `pass_with_findings`, or `block`;
- not_assessed: explicit items you could not verify from this prompt.
