# Portolan Agent Guide

Portolan is a local-first evidence substrate for mapping local repositories or
directories before an agent makes architecture, dependency, or technical-debt
claims.

Use this guide when the user asks you to map, audit, inspect, understand, or
explain a repository. Trigger phrases include:

- `map this repo`
- `map this codebase`
- `map this shit`
- `audit this repo`
- `understand this system`
- `what is going on in this codebase?`

## Current Reality

These are the real capabilities this guide may rely on today:

- `portolan --version`
- `portolan context prepare --root <dir> --out <context-dir> --profile cursor [--force]`
- `portolan map --selection <selection.json> --out <run-dir> [--force]`
- `portolan map --root <dir> --out <run-dir> [--force]`
- `portolan scan --selection <selection.json> --out <graph.json> [--force]`
- `portolan packet render --graph <graph.json> --out <packet.md> [--force]`
- `portolan import cyclonedx --in <sbom.json> --out <graph.json> [--force]`
- `portolan diff --base <base-graph.json> --head <head-graph.json> --out <diff.json> [--force]`
- local selection files, local metadata, local runtime exports, local claim
  files, and local SBOM/tool exports when the repository provides them.

Current commands can produce one-command map bundles, evidence graphs, packets,
importer-normalized graphs, and graph diffs. The current map implementation
emits basic source inventory, local Go import relationships, local `go.mod`
dependency relationships, and explicit `not_assessed` findings for detector
surfaces that are not implemented yet.

## Target Contract

This target contract is now the preferred first step:

```bash
portolan context prepare --root <target-root> --out <context-dir> --profile cursor
```

If only a Portolan source checkout is available, first build the repo-local
binary from that checkout:

```bash
scripts/bootstrap-portolan
.portolan/bin/portolan context prepare --root <target-root> --out <context-dir> --profile cursor
```

Use `go run` only as a fallback when the bootstrap script cannot be used:

```bash
go run ./cmd/portolan context prepare --root <target-root> --out <context-dir> --profile cursor
```

The context pack is:

```text
.portolan/context/
  agent-brief.md
  query-plan.md
  repos.json
  tool-registry.json
  oss-plan.json
  gaps.jsonl
```

Use the map command after context preparation when you need the evidence graph
and readable map bundle:

```bash
portolan map --root <target-root> --out <run-dir>
```

`map --root` performs bounded local discovery over the target root itself,
direct child Git repositories, and `repos/*` Git repositories. It does not
prove the external ecosystem is complete; inspect `coverage.json` for
`external-completeness: unknown`.

The current map bundle is:

```text
.portolan/run/
  run.json
  coverage.json
  summary.json
  graph.json
  findings.jsonl
  map.md
```

Read `summary.json` before loading `graph.json` into an agent context. It
contains compact graph, finding, coverage, weak-evidence, and file-surface
counts for first-pass triage.

Treat missing detector coverage or `not_assessed` findings as product gaps, not
as evidence that the repository has no relationships, duplication,
configuration surfaces, or technical debt. Relationship detection currently
covers Go source imports and `go.mod` dependencies only; non-Go, runtime, and
inferred service relationships remain not assessed. Duplication detection
currently covers exact source/config file clusters; near-clone and copy/paste
similarity require local jscpd-style evidence from `tool-registry.json` or
remain not assessed. Configuration detection covers file-based env var names,
ports, container/workflow/manifests, feature flags, and secret references; it
does not record secret values and does not perform semantic IaC validation.
`portolan doctor` is still not part of the implemented CLI.

## Guardrails

- Work local-first and read-only.
- Run only Portolan commands that actually exist in the current checkout or
  installed binary.
- Do not fetch network resources unless the user explicitly approves it.
- Do not mutate the target repository.
- Use temporary output paths for current fallback commands unless the user
  explicitly selects another output location.
- Treat build, packaging, configuration, release, smoke-test, and integration
  repositories as valid targets.
- Do not clone or fetch referenced component source repositories unless the
  user explicitly approves that boundary.
- Do not replace missing `portolan map` with unmarked manual analysis.
- Treat agent conclusions as claims until backed by local evidence.
- Preserve weak evidence instead of hiding it.
- Record gaps where Portolan cannot help you fulfill a product promise.

Allowed evidence states:

- `source-visible`
- `metadata-visible`
- `runtime-visible`
- `claim-only`
- `unknown`
- `cannot_verify`

Use `not_assessed` for a surface you did not check.

## Workflow

1. Inventory available local inputs before running scan commands:

   - selection files;
   - metadata files;
   - runtime exports;
   - claim files;
   - SBOMs or exported tool outputs;
   - existing Portolan artifacts.

2. Check available commands when needed:

   ```bash
   portolan --version
   scripts/bootstrap-portolan --help
   portolan map --help
   portolan scan --help
   portolan packet render --help
   portolan import cyclonedx --help
   ```

   If current commands are missing or fail, stop and report the blocker.

3. Run context preparation:

   ```bash
   portolan context prepare --root <target-root> --out <context-dir> --profile cursor
   ```

   Read `agent-brief.md`, `query-plan.md`, `repos.json`,
   `tool-registry.json`, `oss-plan.json`, and `gaps.jsonl`. Treat
   tool-registry summaries and metrics for jscpd, CycloneDX/Syft, Backstage,
   OpenAPI, AsyncAPI, and Structurizr as local evidence candidates, not final
   architecture verdicts. Use `oss-plan.json` to see safe local producer
   commands when evidence is missing; do not run them without approval.

4. Run the map command when graph artifacts are needed. Use `--root` for the
   normal blind/first-run workflow:

   ```bash
   portolan map --root <target-root> --out <run-dir>
   ```

   Treat exact duplicate source/config findings as evidence-backed clusters,
   not as a refactoring order. If the run has no observed duplication finding,
   preserve the `duplication` `not_assessed` state for near-clone coverage
   unless jscpd-style output is present in the context pack.

   Treat configuration findings as local surface inventory. Secret references
   are names only; absence of a value in artifacts is intentional. For semantic
   IaC/config validation, use local Semgrep-style evidence when present or keep
   that surface `not_assessed`.

   Prefer `--selection` only when a curated local selection exists:

   ```bash
   portolan map --selection <selection.json> --out <run-dir>
   ```

   Read `run.json`, `coverage.json`, `summary.json`, `graph.json`,
   `findings.jsonl`, and `map.md` before reporting.

5. Use lower-level commands only when the user or fixture provides matching
   local inputs:

   ```bash
   mkdir -p /tmp/portolan-run
   portolan scan --selection <selection.json> --out /tmp/portolan-run/graph.json --force
   portolan packet render --graph /tmp/portolan-run/graph.json --out /tmp/portolan-run/map.md --force
   portolan import cyclonedx --in <sbom.json> --out /tmp/portolan-run/import-graph.json --force
   portolan diff --base <base-graph.json> --head <head-graph.json> --out /tmp/portolan-run/diff.json --force
   ```

   Run only commands that match real local inputs. Do not invent a selection
   file, SBOM, base graph, or head graph.

6. Inspect freshness before trusting existing artifacts. Check whether each
   artifact corresponds to the current repository and command inputs.

7. Report product categories from exact local evidence and record gaps for
   missing capabilities.

8. For non-source targets, treat observed build, package, configuration, release,
   smoke-test, and integration files as the local evidence boundary. If a
   referenced component source repository is not present locally, record the
   missing source evidence as `unknown`, `cannot_verify`, or `not_assessed`.

## Report Shape

The report is not a generic architecture summary. It must cover Portolan's
product promises:

1. Run status and current-vs-target capability status
2. Relationships
3. Duplication
4. Configuration surfaces
5. Technical debt
6. Unknown and cannot_verify
7. Gap ledger
8. Not assessed

Every finding row must include:

- product category;
- finding or missing capability;
- evidence reference;
- evidence state;
- confidence or status;
- source type: file, command output, generated artifact, or missing capability;
- action or likely next spec.

Do not write unsupported conclusions such as "the service mesh is probably
X", "this is dead code", or "the architecture is clean" unless local Portolan
inputs support that claim.

## Gap Ledger Template

Use this table whenever Portolan cannot support a promised mapping task:

| Gap ID | Repo/Context | Attempted Task | Command/Artifact Used | Observed Limitation | Expected Capability | Affected Product Promise | Evidence State | User Impact | Priority | Likely Spec | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GAP-001 | `<repo or corpus>` | `<task>` | `<command or artifact>` | `<what failed or was absent>` | `<needed behavior>` | `relationships` / `duplication` / `config` / `tech debt` / `evidence` / `UX` | `unknown` / `cannot_verify` / `not_assessed` / other state | `<why it matters>` | P0/P1/P2/P3 | `009` / `010` / `011` / `012` / `013` / other | open |

## Stop Conditions

Stop and report a blocker when:

- all current Portolan command checks fail;
- required local inputs for the attempted command are missing;
- existing artifacts are stale and cannot be regenerated;
- the user asks for network access, mutation, or credentials but has not
  explicitly approved the boundary;
- Portolan cannot verify a surface that the answer depends on and no honest
  `unknown`, `cannot_verify`, or gap entry can represent it.
