# GitHub Spec Kit Workflow

Portolan uses GitHub Spec Kit as its planning backbone.

Spec Kit gives the repository a repeatable path:

```text
constitution -> spec -> clarify -> plan -> tasks -> analyze -> implement
```

## Installed Surface

Spec Kit was initialized with the Codex skills integration. The local generated
surface is:

- `.specify/` for templates, scripts, workflow metadata, and constitution.
- `.agents/skills/speckit-*` for Codex-compatible Spec Kit skills.
- `specs/<NNN-short-name>/` for product slices.

## Local Rules

- Keep the constitution small and product-specific.
- Use one spec directory per independently valuable product slice.
- Treat `docs/product-backlog.md` as the backlog index, not as a substitute for
  feature specs.
- Do not write implementation code for a non-trivial feature until that feature
  has `spec.md`, `plan.md`, and `tasks.md`.
- Use `unknown` and `cannot_verify` in specs whenever evidence is absent or
  unverifiable.
- Record importer license and privacy review in the relevant plan before adding
  an external tool dependency.

## Feature Directory Contract

Each active feature should contain:

```text
specs/<NNN-short-name>/
├── spec.md
├── plan.md
├── tasks.md
├── quickstart.md       # when manual validation matters
├── data-model.md       # when graph/schema shape changes
└── contracts/          # when output/input contracts change
```

Backlog-only features may start with `spec.md` and graduate to plan/tasks when
selected for implementation.

## Baseline Checks

Run before claiming readiness:

```bash
go test -count=1 ./...
jq empty schema/*.json
git diff --check
```

Some generated Spec Kit templates intentionally contain placeholders under
`.specify/templates/`; do not treat those as product backlog defects.
