# Portolan Agent Guide

Portolan is a local-first evidence substrate for mapping codebases before an
agent makes architecture, dependency, or technical-debt claims.

Use this guide when the user asks you to map, audit, inspect, understand, or
explain a repository. Trigger phrases include:

- `map this repo`
- `map this codebase`
- `map this shit`
- `audit this repo`
- `understand this system`
- `what is going on in this codebase?`

## Ground Rules

- Run local Portolan commands before making broad architecture claims.
- Treat agent conclusions as claims until backed by Portolan artifacts.
- Do not fetch network resources unless the user explicitly approves it.
- Do not mutate the target repository.
- Do not collect credentials, tokens, prompts, provider URLs, or private source
  snippets for reports.
- Preserve weak evidence instead of hiding it.

Allowed evidence states:

- `source-visible`
- `metadata-visible`
- `runtime-visible`
- `claim-only`
- `unknown`
- `cannot_verify`

Use `not_assessed` for a surface you did not check.

## Workflow

1. Confirm Portolan is available:

   ```bash
   portolan doctor
   ```

   If this command is missing or fails, stop and report the blocker. Do not
   replace Portolan with manual repo exploration.

2. Prefer the target map command once it exists:

   ```bash
   portolan map --root . --out .portolan/run
   ```

3. Until `portolan map` is implemented, use current Portolan commands that
   match the available inputs and record the missing one-command map as a
   product gap. Useful current commands include:

   ```bash
   portolan scan --selection <selection.json> --out .portolan/run/graph.json
   portolan packet render --graph .portolan/run/graph.json --out .portolan/run/map.md
   portolan import cyclonedx --in <sbom.json> --out .portolan/run/graph.json
   portolan diff --base <base-graph.json> --head <head-graph.json> --out .portolan/run/diff.json
   ```

   For the immediate Apache Bigtop smoke, use the prepared local corpus profile
   and current commands available in this repository. Do not wait for future
   detectors before recording concrete gaps.

4. Inspect freshness before trusting existing artifacts. Check whether the run
   metadata, graph, findings, and packet correspond to the current repository
   and command inputs.

5. Report only from Portolan artifacts and clearly mark missing coverage.

## Target Artifacts

The target map output directory is:

```text
.portolan/run/
  run.json
  graph.json
  findings.jsonl
  map.md
```

Inspect these artifacts before answering:

- `run.json`: command, Portolan version, root, inputs, skipped surfaces,
  warnings, and freshness.
- `graph.json`: nodes, relationships, evidence states, and source pointers.
- `findings.jsonl`: evidence-backed relationship, duplication, configuration,
  and technical-debt findings.
- `map.md`: human-readable packet derived from the graph and findings.

If an artifact is absent because the current command set cannot produce it yet,
report it as `not_assessed` or `cannot_verify` with the reason.

## Report Shape

Use concise sections:

1. Run status
2. Relationships
3. Duplication
4. Configuration surfaces
5. Technical debt
6. Unknown
7. Cannot verify
8. Not assessed

Each claim row should include:

- finding or claim;
- evidence state;
- source artifact and pointer;
- confidence;
- action or next check.

Do not write unsupported conclusions such as "the service mesh is probably
X", "this is dead code", or "the architecture is clean" unless Portolan
artifacts support that claim.

## Stop Conditions

Stop and report a blocker when:

- `portolan doctor` is missing or fails;
- required local inputs are missing;
- existing artifacts are stale and cannot be regenerated;
- the user asks for network access, mutation, or credentials but has not
  explicitly approved the boundary;
- Portolan cannot verify a surface that the answer depends on.
