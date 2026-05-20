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

## Delivery Workflow Rules

When asked to take the next ready spec into implementation:

- Work in a dedicated worktree and branch. Do not implement from a dirty main
  checkout.
- Select the next spec from `docs/product-backlog.md` that is marked ready and
  has concrete `spec.md`, `plan.md`, and `tasks.md`.
- Start with review, not coding. Review the spec/plan/tasks against the
  constitution, backlog order, schemas, CLI contract, and product boundary.
- Record review evidence under `specs/<NNN-short-name>/reviews/`; do not create
  root-level review clutter.
- Treat empty, hung, malformed, stale, or off-topic model output as
  `not_assessed`. Do not count it as review evidence.
- Ordinary implementation slice reviews must use `pi` subscription lanes first:
  `kimi-coding/kimi-for-coding`, `minimax/MiniMax-M2.7`, and `zai/glm-5.1`.
  If one is unavailable, record that lane as `not_assessed` and explain the
  substitution or omission in the review disposition.
- Fix accepted review findings in the spec/task contract before implementation
  when they affect scope, safety, evidence semantics, or testability.
- Implement in task slices. Each slice must have focused tests or an explicit
  documented reason when only docs/schema checks apply.
- After every implementation slice, run an independent review cycle and record
  accepted, rejected, fixed, and `not_assessed` findings in a review
  disposition file.
- Re-run focused reviewers after fixes when findings touch evidence state
  semantics, graph identity, path/output safety, schema compatibility, or CLI
  user behavior.
- Do not mark a PR ready only because local tests passed. PR state, review
  artifacts, and any GitHub checks must agree.

When asked to review and improve an existing PR:

- Reconstruct the current PR head, diff, draft state, merge state, check state,
  and review artifacts first.
- Use at least two independent review lanes when the PR touches evidence
  semantics, path/output safety, schemas, or CLI behavior. Default PR review
  lanes are `deepseek/deepseek-v4-pro`, `qwen/qwen3.6-plus`, and
  Gemini Flash 3.5 through `pi`, plus a repo-grounded local review lane. Verify
  exact enabled model IDs from `~/.pi/agent/settings.json` before launch; if
  Gemini Flash 3.5 is not available, record the lane as `not_assessed` or use
  the closest configured Gemini only with an explicit substitution note.
- Verify every accepted finding locally before editing. Do not patch from model
  text alone.
- Record degraded review lanes explicitly. A missing Claude/Gemini result is
  `not_assessed`, not a clean review.
- Keep PRs draft while blockers remain. Mark ready only after fixes, local
  verification, review disposition, and current PR state are coherent.

Merge rules:

- Merge only after the user explicitly asks to merge or after a separate
  human/GitHub approval authorizes it.
- Before merge, re-check PR state and report absent CI as `not_assessed`, not
  green.
- After merge, confirm the merge commit and clean up the remote feature branch
  when requested or when the merge command was intended to delete it.

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
