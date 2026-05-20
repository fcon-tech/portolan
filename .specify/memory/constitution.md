# Portolan Constitution

## Core Principles

### I. Local-First And Read-Only By Default

Every feature must preserve local execution as the default. Portolan must not
make network calls, start daemons, mutate target repositories, collect
credentials, or write outside its selected output directory unless a spec
explicitly approves that behavior and documents the safety boundary.

### II. Evidence State Honesty

Every graph fact must carry an evidence state. The allowed states are
`source-visible`, `metadata-visible`, `runtime-visible`, `claim-only`,
`unknown`, and `cannot_verify`. Unknown and unverifiable facts are valid outputs,
not errors to hide. `claim-only` must never be upgraded to observed evidence
without a recorded source.

### III. Complement, Do Not Replace

Portolan should compose existing tools before building native scanners. Specs
for importers must compare format stability, license, maintenance health,
privacy posture, local execution, and adapter cost. Portolan is a normalization
layer over mixed evidence, not a replacement for Sourcegraph, CAST, Backstage,
observability platforms, modernization tools, or coding agents.

### IV. SpecKit Before Implementation

Non-trivial product work must start in `specs/<NNN-short-name>/`. The minimum
artifact set for implementation is `spec.md`, `plan.md`, and `tasks.md`. A spec
defines what and why; a plan defines how; tasks define independently testable
slices. Implementation may start only after the relevant tasks are concrete and
verification commands are named.

### V. Test-First For Behavior

Behavior changes require focused tests before implementation. CLI behavior,
schema contracts, import normalization, graph derivation, and packet rendering
must be testable through local commands. Documentation-only backlog changes may
be verified through link, schema, and placeholder checks instead of code tests.

## Product Constraints

- Primary implementation language: Go.
- Runtime default: local CLI.
- Default output: machine-readable evidence graph plus optional human-readable
  packet generated from the same graph.
- Default privacy posture: no raw private source snippets, prompts, credentials,
  provider URLs, or customer-sensitive payloads in committed fixtures.
- Default integration posture: import files and exported tool outputs before
  invoking external tools.

## SpecKit Workflow

Use GitHub Spec Kit artifacts as the product planning source:

1. `/speckit.constitution` or direct constitution edits define global rules.
2. `/speckit.specify` creates or updates `specs/<NNN-short-name>/spec.md`.
3. `/speckit.clarify` is optional when scope, UX, privacy, or evidence semantics
   are ambiguous.
4. `/speckit.plan` creates `plan.md`, `research.md`, `data-model.md`,
   `contracts/`, and `quickstart.md` when needed.
5. `/speckit.tasks` creates `tasks.md`.
6. `/speckit.analyze` or manual cross-check must run before implementation when
   specs touch evidence semantics, privacy, schema compatibility, or external
   tool imports.
7. `/speckit.implement` or manual implementation follows the task list and
   records verification evidence.

Project-local rule: one spec directory represents one product slice. A product
backlog may list many slices, but active implementation should start with one
spec at a time.

## Governance

This constitution supersedes ad hoc workflow preferences inside this repository.
Changes require:

- a short rationale in the modifying commit or spec;
- a migration note if existing specs become stale;
- fresh verification using the baseline checks in `AGENTS.md`.

**Version**: 1.0.0 | **Ratified**: 2026-05-20 | **Last Amended**: 2026-05-20
