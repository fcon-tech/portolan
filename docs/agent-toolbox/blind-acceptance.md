# Blind Agent Acceptance Protocol

This protocol tests whether an agent can use Portolan as a generic local
toolbox without target-specific scaffolding. The target can be Apache Bigtop or
any other local checkout, but the operator prompt must stay the same shape.

## Allowed Prompt

Use this exact prompt shape, replacing only the paths:

```text
Portolan: <absolute path to the Portolan checkout or installed binary>
Target: <absolute path to the local target checkout>
Output: <absolute path to a new run directory>

map this shit.

Do not fetch upstream repositories.
Do not use network.
Do not mutate the target repository.
Do not infer facts outside Portolan artifacts.
Record every Portolan capability gap you hit.
```

The prompt may add a harness-specific instruction to preserve the transcript or
summary, but it must not add target-specific guidance.

## Forbidden Hints

Do not provide:

- target-specific runbooks, file lists, build commands, package names, module
  names, or architecture hints;
- directions to open a specific internal guide path such as
  `agent/AGENT_GUIDE.md`;
- hidden context about the target's intended relationships, components, or
  expected findings;
- permission to clone repositories, fetch upstream resources, mutate the target,
  or use credentials;
- a prewritten report outline that names target-specific subsystems.
- a prepared Portolan selection path, generated inventory path, or
  `Landscape: <selection.json>` shortcut.

If the evaluator accidentally gives one of these hints, classify the run as
`degraded` or `failed` depending on whether the evidence bundle can still answer
the acceptance question.

## Expected Agent Workflow

The agent should discover Portolan's generic bootstrap surface from the
Portolan path, then prepare context against the supplied target:

```bash
portolan context prepare --root <target-root> --out <context-dir> --profile cursor
```

If no installed binary is available, the agent may run the command from the
Portolan source checkout:

```bash
go run ./cmd/portolan context prepare --root <target-root> --out <context-dir> --profile cursor
```

The agent must inspect these context artifacts before reporting broad claims:

- `<context-dir>/agent-brief.md`
- `<context-dir>/query-plan.md`
- `<context-dir>/repos.json`
- `<context-dir>/tool-registry.json`
- `<context-dir>/oss-plan.json`
- `<context-dir>/gaps.jsonl`

The agent may then run `portolan map` when graph artifacts are needed and must
inspect these artifacts before reporting map-backed claims:

```bash
portolan map --root <target-root> --out <run-dir>
```

`map --root` discovers the target root itself, direct child Git repositories,
and `repos/*` Git repositories. It does not prove that the local checkout set is
the complete external ecosystem; the run must preserve the
`external-completeness` coverage record as `unknown` unless a manifest-backed
slice proves otherwise.

- `<run-dir>/run.json`
- `<run-dir>/coverage.json`
- `<run-dir>/summary.json`
- `<run-dir>/graph.json`
- `<run-dir>/findings.jsonl`
- `<run-dir>/map.md`

Inspect `summary.json` before full `graph.json` in large runs.

Transcript claims are lower authority than Portolan artifacts. Findings that do
not appear in local Portolan inputs must be recorded as `claim-only`, `unknown`,
`cannot_verify`, or `not_assessed`.

## Required Evidence Bundle

Record each run under `specs/015-blind-agent-acceptance/reviews/` using
`specs/015-blind-agent-acceptance/templates/run-ledger.md`.

Each evidence bundle must include:

- agent harness and model, when known;
- exact prompt shown to the agent;
- target root and output directory;
- transcript or concise transcript summary;
- commands attempted and their outcomes;
- Portolan artifact inventory;
- artifact review notes for `run.json`, `coverage.json`, `summary.json`,
  `graph.json`, `findings.jsonl`, and `map.md`;
- report produced by the agent or evaluator;
- gap ledger with generic product gaps only;
- status and stop reason.

Do not commit private target source, credentials, provider URLs, private prompts,
or large raw transcripts. Store summaries or redacted excerpts when needed.

## Status Taxonomy

- `passed`: The agent used the generic prompt shape, discovered Portolan,
  generated the required artifacts, inspected them, and produced an
  evidence-backed report without target-specific help.
- `degraded`: The run produced useful evidence but missed one or more required
  surfaces, needed non-target-specific operator recovery, or had partial command
  execution limits.
- `failed`: The run could execute but violated the protocol, relied on
  unsupported inference, mutated the target, used network unexpectedly, or could
  not produce reviewable Portolan artifacts.
- `not_assessed`: The run did not happen, the local target was absent, the
  harness was unavailable, or the result lacks enough evidence to classify.

Use `blocked` as a stop reason inside the ledger when the absence of a local
target, harness, command execution, or Portolan build prevents the run.

## Target Rules

Apache Bigtop is the first realistic target because it stresses build,
packaging, configuration, runtime, and smoke-test surfaces. A real Bigtop
acceptance run requires a local target root containing the ecosystem checkouts.
If that target is absent, the Bigtop run is `not_assessed`; do not replace it
with fixture success or a prepared selection shortcut.

At least one non-Bigtop control target must use the same prompt shape. The
default control for preflight is `testdata/map-command/repo`, because it is a
small local Go target with a current `portolan map` fixture. That fixture can
prove the command path works, but it cannot prove blind operator acceptance. A
stronger control should be a separate local project outside Portolan when the
operator lane is run.

## Review Procedure

1. Verify the prompt contains no target-specific file names, package names,
   build instructions, or guide paths.
2. Verify the run did not use network, credentials, or target mutation.
3. Inspect `run.json`, `summary.json`, `graph.json`, `findings.jsonl`, and
   `map.md`.
4. Compare the agent's report with the Portolan artifacts.
5. Classify unsupported conclusions as `claim-only`, `unknown`,
   `cannot_verify`, or `not_assessed`.
6. Record generic product gaps only. Do not create target-only backlog work from
   one corpus unless the gap is phrased as a reusable Portolan capability.
