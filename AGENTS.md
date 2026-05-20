# Agent Instructions

Portolan is a local-first evidence graph builder for multi-repo and black-box
software landscapes.

## Boundary

Portolan is not:

- another coding harness;
- a manual consulting report generator;
- a replacement for enterprise code intelligence, modernization, service
  catalog, or observability tools;
- a readiness gate;
- a source of truth for claims it cannot verify.

Portolan is:

- a read-only local scout;
- a normalizer for source, metadata, runtime, and claim evidence;
- a machine-readable evidence graph;
- a human-readable packet derived from that graph;
- a complement to existing tools.

## Product Rules

- Keep local-first and read-only defaults.
- Do not add network access, daemon behavior, mutation, or credentials without
  explicit design approval.
- Preserve evidence states: `source-visible`, `metadata-visible`,
  `runtime-visible`, `claim-only`, `unknown`, and `cannot_verify`.
- Unknown is a valid result. Do not collapse unknown or unverifiable evidence
  into success.
- Prefer importing and normalizing OSS/tool outputs over reimplementing mature
  scanners.

## Engineering Rules

- Primary implementation language: Go.
- Keep `cmd/portolan` thin; put behavior in internal packages.
- Add focused tests before behavior changes.
- Do not add dependencies unless the product boundary and integration cost are
  documented.
- Keep docs and schemas aligned with the CLI contract.

## SpecKit Rules

- Use `.specify/memory/constitution.md` as the governing SpecKit contract.
- Use `docs/product-backlog.md` as the backlog index.
- Use `specs/<NNN-short-name>/` for feature slices.
- Do not implement a non-trivial feature until its `spec.md`, `plan.md`, and
  `tasks.md` are concrete.
- Backlog-only specs may start with `spec.md`; active work needs plan and tasks.
- Generated Spec Kit skills under `.agents/skills/` are committed; do not store
  credentials or private runtime state under `.agents/`.

## Baseline Checks

Run:

```bash
go test ./...
jq empty schema/*.json
git diff --check
```

For CLI changes, also run the affected command, for example:

```bash
go run ./cmd/portolan scan --help
```

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
<!-- SPECKIT END -->
