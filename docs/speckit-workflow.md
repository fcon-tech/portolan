# GitHub Spec Kit Workflow

Portolan uses GitHub Spec Kit as its planning backbone.

Spec Kit gives the repository a repeatable planning and implementation path:

```text
constitution -> spec -> clarify -> plan -> tasks -> analyze -> implement
```

Portolan adds a delivery closeout layer on top:

```text
implement -> review disposition -> PR review cycle -> PR readiness closeout -> merge closeout
```

For end-to-end feature delivery, use the orchestrator:

```text
worktree -> specify/clarify -> plan -> tasks -> analyze -> implement -> review-fix -> PR review-fix -> PR readiness -> merge closeout
```

## Installed Surface

Spec Kit was initialized with the Codex skills integration. The local generated
surface is:

- `.specify/` for templates, scripts, workflow metadata, and constitution.
- `.agents/skills/speckit-*` for Codex-compatible Spec Kit skills.
- `.specify/extensions/git/` plus `speckit-git-*` skills for the bundled
  Spec Kit git extension: branch creation, branch validation, remote detection,
  repository initialization, and optional auto-commit hooks.
- Repo-local delivery skills:
  - `.agents/skills/speckit-delivery-orchestrator/`
  - `.agents/skills/speckit-review-disposition/`
  - `.agents/skills/speckit-pr-review-cycle/`
  - `.agents/skills/speckit-pr-readiness-closeout/`
  - `.agents/skills/speckit-merge-closeout/`
- `specs/<NNN-short-name>/` for product slices.

The git extension is installed, but auto-commit hooks are disabled by default in
`.specify/extensions/git/git-config.yml`. Portolan still requires explicit
review, verification, and readiness boundaries from `AGENTS.md`; any
auto-commit behavior must be enabled deliberately and is not a substitute for
review or merge approval.

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
|-- spec.md
|-- plan.md
|-- tasks.md
|-- quickstart.md       # when manual validation matters
|-- data-model.md       # when graph/schema shape changes
`-- contracts/          # when output/input contracts change
```

Backlog-only features may start with `spec.md` and graduate to plan/tasks when
selected for implementation.

## Delivery Closeout Contract

Use `/speckit-delivery-orchestrator` when the user wants a full lifecycle
instead of a single SpecKit step. The orchestrator must create a dedicated
worktree, choose or create the nearest open spec, run the user through
specification and clarification, execute plan/tasks/analyze/implement, run
review-fix and PR review-fix loops, create a PR readiness closeout, and merge
only on explicit approval.

Implementation is not closed at `/speckit-implement`. For a feature to be
ready-for-review, the spec directory should contain:

```text
specs/<NNN-short-name>/reviews/
|-- implementation-disposition-YYYY-MM-DD.md
|-- review-disposition-YYYY-MM-DD.md
|-- pr-review-disposition-YYYY-MM-DD.md
`-- pr-readiness-closeout-YYYY-MM-DD.md
```

Merge requires a separate explicit approval and a post-merge closeout:

```text
specs/<NNN-short-name>/reviews/merge-closeout-YYYY-MM-DD.md
```

Use the exact surface names in reports:

- local implementation;
- draft PR;
- ready-for-review PR;
- ready-to-merge PR.

Do not collapse absent checks, absent UI lanes, absent review approval, or
unverified runtime evidence into success. Use `not_assessed`, `unknown`,
`blocked`, or `cannot_verify` as appropriate.

## Baseline Checks

Run before claiming readiness:

```bash
go test -count=1 ./...
jq empty schema/*.json
git diff --check
```

Some generated Spec Kit templates intentionally contain placeholders under
`.specify/templates/`; do not treat those as product backlog defects.
