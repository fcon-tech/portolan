# Root Inventory Audit

Date: 2026-06-01
Branch: `codex/051-portolan-quality-boundary`
PR: https://github.com/fcon-tech/portolan/pull/28

## Scope

This audit covers every root-level tracked directory and file in the repository.
The purpose is to prove why each entry belongs at repository root, prove why it
belongs in the repository at all, or mark it for cleanup.

Working-tree local entries such as `.git/` and ignored `.portolan/` are not
repository content. `.portolan/` is a local bootstrap/output cache and is
ignored by `.gitignore`.

## Decision Criteria

Keep at root only when at least one is true:

- language/tooling convention requires the path at root;
- GitHub or community tooling discovers the path at root;
- SpecKit or repository-local agent workflows require the path at root;
- public/product documentation must be discoverable from the repository root;
- tests, schemas, or fixtures are shared by multiple packages and root CLI
  commands.

Move or delete when:

- the path exists only because of one historical target;
- the path is generated output or private runtime state;
- the same evidence can live under a clearer product-owned directory;
- no test, CI, docs route, or workflow contract uses it.

## Root Entries

| Entry | Evidence | Root necessity | Repository necessity | Verdict |
| --- | --- | --- | --- | --- |
| `.agents/` | `AGENTS.md` says generated Spec Kit skills under `.agents/skills/` are committed; `docs/speckit-workflow.md` lists `.agents/skills/speckit-*` as installed surface; `.specify/integrations/codex.manifest.json` hashes these files. | Root path is the repo-local agent skill discovery location. | Needed only for the committed SpecKit/Codex delivery workflow. | keep |
| `.cursor/` | Historical Cursor rule existed for optional Cursor onboarding. User rejected root-level Cursor coupling in this cleanup. | No longer accepted as a root product surface. | Cursor-specific guidance remains historical evidence only; current agent route is `docs/agent/INSTALL-PROMPT.md`. | deleted |
| `.github/` | Contains CI, Pages, issue templates, and PR template; CI runs `go test`, `go vet`, schema checks, diff check, and CLI smoke. `docs/specs/048...` requires GitHub community files and templates. | GitHub requires workflows/templates under `.github/`. | Needed for public repository hygiene, CI, PR review, issue intake, and Pages deploy. | keep |
| `.gitignore` | Ignores `.portolan/`, build outputs, editor files, agent runtime dirs, and non-committed `.agents/*` except skills. | Must be root for Git ignore behavior across repo. | Needed to keep local binary/output state out of commits. | keep |
| `.specify/` | `AGENTS.md` names `.specify/memory/constitution.md` as governing SpecKit contract; `docs/speckit-workflow.md` lists `.specify/` as installed surface; scripts read `.specify/`. | SpecKit expects `.specify/` at root. | Needed if SpecKit remains the planning backbone. | keep |
| `AGENTS.md` | Repository instructions define product boundary, engineering rules, delivery workflow, merge rules, and baseline checks. | Agent tooling discovers root `AGENTS.md`. | Needed for safe agent work in this repo. | keep |
| `CODE_OF_CONDUCT.md` | Required by `docs/specs/048-github-community-discovery/`; GitHub community profile discovers it at root. | GitHub convention. | Needed for public community boundary unless explicitly replaced. | keep |
| `CONTRIBUTING.md` | Required by `docs/specs/048...`; explains SpecKit, baseline checks, evidence labels, and contribution scope. | GitHub convention and README route. | Needed for public contributor workflow. | keep |
| `LICENSE` | Public OSS license. | Standard root convention; GitHub license detection expects it. | Needed for public repository reuse/legal clarity. | keep |
| `README.md` | Primary public route; links install, docs, product claims, quality boundary, contribution/security routes. | Root README is GitHub landing surface. | Needed for product discovery. | keep |
| `SECURITY.md` | Required by `docs/specs/048...`; GitHub security policy route. | GitHub convention. | Needed for vulnerability reporting boundary. | keep |
| `SUPPORT.md` | Required by `docs/specs/048...`; states no-SLA support boundary. | GitHub/community convention. | Needed for public support boundary. | keep |
| `cmd/` | Standard Go command entrypoint; `cmd/portolan/main.go` delegates to `internal/app`. | Go convention for executable commands. | Needed to build `portolan`. | keep |
| `docs/` | Product docs, agent docs, release docs, product claims, quality boundary, public site, and demos. README and specs route here. | Root `docs/` is standard and currently used by README/GitHub Pages. | Needed, but individual docs should remain claim-boundary audited. | keep |
| `examples/` | Root examples contained only Bigtop public-demo excerpts. User rejected root-level examples for this repo shape. | Not required at root. | Retained only as stress-corpus documentation under `docs/test-corpora/apache-bigtop/examples/`. | moved |
| `go.mod` | Go module identity `github.com/fcon-tech/portolan`; CI and bootstrap use it; `go-version-file: go.mod`. | Required at module root. | Needed for Go builds/tests. | keep |
| `go.sum` | Module checksum file for `golang.org/x/mod`. | Required at module root by Go tooling. | Needed for reproducible dependency resolution. | keep |
| `internal/` | Go internal packages implementing CLI behavior; `AGENTS.md` requires `cmd/portolan` thin and behavior in `internal`. | Go `internal` import boundary convention requires this location relative to module. | Needed for implementation. | keep |
| `schema/` | JSON schemas for evidence graph, selection, coverage, OSS adapter, corpus manifest, report quality; CI and docs reference `jq empty schema/*.json`. | Root schema path is used by CI/docs/specs. | Needed for machine-readable contracts. | keep |
| `scripts/` | `scripts/bootstrap-portolan` builds local binary with network disabled by default; README/release/docs reference it. | Root scripts path is public install/dev convention. | Needed for source-checkout bootstrap. | keep |
| `specs/` | SpecKit feature slices, task ledgers, reviews, and PR closeouts previously lived at root. User rejected root-level specs. | Not required at root after workflow scripts are updated. | Retained under `docs/specs/` as delivery documentation and audit trail. | moved |
| `testdata/` | Shared CLI and package fixtures previously lived at root. User rejected root-level testdata as fixture clutter. | Not required at root. | Retained under `internal/testfixtures/` and package-local `internal/app/testfixtures/`; every shared group must stay documented and bounded. | moved |

## Immediate Cleanup Candidates

These are not proven deletion candidates yet; they are the entries that need
human acceptance or a stronger proof before final closeout.

1. `.cursor/`
   - Decision: deleted.
   - Reason: Portolan is explicitly not tied to Cursor, and root-level Cursor
     rules make an optional harness look like a product dependency.

2. `examples/`
   - Decision: moved.
   - Reason: the only examples were Bigtop excerpts, so root-level examples
     over-centered the stress target. They now live under
     `docs/test-corpora/apache-bigtop/examples/`.

3. `specs/`
   - Decision: moved to `docs/specs/`.
   - Reason: specs are documentation/audit trail, not a root product surface.
     SpecKit scripts and repo-local instructions now point to `docs/specs/`.

4. `docs/specs/`
   - Keep argument: SpecKit history, reviews, and closeouts are the delivery
     audit trail.
   - Cleanup argument: old review artifacts can read like current public truth
     if not clearly separated from public docs.
   - Current recommendation: keep `docs/specs/`, but maintain the rule that
     public claims live in `README.md` and current `docs/`, not in historical
     review files.

5. Fixture data
   - Decision: root `testdata/` moved to `internal/testfixtures/`; package-local
     `internal/app/testdata/` moved to `internal/app/testfixtures/`.
   - Reason: fixtures are implementation/test support, not root-level product
     content. They remain needed for tests and CLI smokes.

## Not Tracked

| Entry | Status | Action |
| --- | --- | --- |
| `.git/` | Git metadata, not repository content. | ignore |
| `.portolan/` | Ignored local bootstrap/output cache. | keep ignored; never commit |
