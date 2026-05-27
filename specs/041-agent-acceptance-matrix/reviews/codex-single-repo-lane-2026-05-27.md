# Acceptance Lane Ledger: Codex Single Repo

Date: 2026-05-27
Lane ID: `codex-single-repo`
Harness: Codex
Target shape: single-repo
State: `verified`

## Prompt

Prompt source: `docs/agent/ACCEPTANCE.md`, "Blind Acceptance Prompt"

Variables supplied:

```text
PORTOLAN_PATH=/tmp/portolan-041-agent-acceptance-matrix
TARGET_PATH=/tmp/portolan-041-agent-acceptance-matrix
OUTPUT_PATH=/tmp/portolan-041-acceptance/codex-single-repo
```

Hidden scaffolding: none. No target-specific file list, expected finding, or
private answer outline was supplied beyond the reusable prompt and variables.
Prompt isolation note: the prompt was taken from `docs/agent/ACCEPTANCE.md`;
the file SHA-256 at review time was
`30e83bbdc68abe11ca3d3f115cef000eb4ac25cd7ad80f736e977d6e9f6e72ed`.
The hash command was `sha256sum docs/agent/ACCEPTANCE.md`.

Self-target note: `PORTOLAN_PATH` and `TARGET_PATH` intentionally point at the
same local checkout for this first single-repo lane. This verifies the blind
prompt against a local repository, not general behavior on arbitrary external
repositories.

## Commands

```bash
go run ./cmd/portolan context prepare --root /tmp/portolan-041-agent-acceptance-matrix --out /tmp/portolan-041-acceptance/codex-single-repo/context --profile cursor
```

Result: `verified`; command exited 0 and wrote
`/tmp/portolan-041-acceptance/codex-single-repo/context`.

```bash
go run ./cmd/portolan map --root /tmp/portolan-041-agent-acceptance-matrix --out /tmp/portolan-041-acceptance/codex-single-repo/map
```

Result: `verified`; command exited 0 and wrote
`/tmp/portolan-041-acceptance/codex-single-repo/map`.

## Artifacts Read

- `/tmp/portolan-041-acceptance/codex-single-repo/context/agent-brief.md`
- `/tmp/portolan-041-acceptance/codex-single-repo/context/answer-contract.md`
- `/tmp/portolan-041-acceptance/codex-single-repo/context/evidence-index.jsonl`
- `/tmp/portolan-041-acceptance/codex-single-repo/context/gaps.jsonl`
- `/tmp/portolan-041-acceptance/codex-single-repo/map/summary.json`
- `/tmp/portolan-041-acceptance/codex-single-repo/map/graph-index.json`
- `/tmp/portolan-041-acceptance/codex-single-repo/map/findings.jsonl`
- `/tmp/portolan-041-acceptance/codex-single-repo/map/map.md`

## Agent Answer

### 1. Visible Scope And Completeness Limits

Portolan discovered one local repository at
`/tmp/portolan-041-agent-acceptance-matrix`.

Evidence:

- `context/agent-brief.md`: repositories discovered = 1, external ecosystem
  completeness = `unknown`
- `context/evidence-index.jsonl`: `repo-root` is `source-visible`
- `map/summary.json`: coverage includes repository `root` with status
  `visible` and evidence state `source-visible`
- `map/map.md`: `external-completeness` remains `unknown`

Completeness limit: this is a single local repo acceptance run. It does not
prove multi-repo coverage, external inherited-estate completeness, UI
Cursor/Composer behavior, or OpenCode behavior.

### 2. Visible Relationships, Duplication, Configuration, And Debt

Visible relationship evidence:

- `map/summary.json`: 196 source import relationships from Go source files
  and 6 manifest dependency relationships from local `go.mod` files.
- `map/map.md`: source import relationships are `source-visible`; manifest
  dependency relationships are `metadata-visible`.

Visible duplication evidence:

- `map/summary.json`: 23 duplication findings.
- `map/map.md`: 22 exact config duplicate clusters and 1 exact source
  duplicate cluster, all framed as evidence rather than rewrite orders.

Visible configuration evidence:

- `map/summary.json`: 88 config files, 4 container surfaces, 49 environment
  variable references by name, 19 feature flag references, 9 manifest surfaces,
  3 port declarations, 3 secret references by name only, and 1 workflow
  surface.

Visible technical-debt candidates:

- `map/summary.json`: 4 technical-debt findings.
- `map/map.md`: configuration, duplication, and relationship follow-ups are
  debt candidates; unresolved findings remain `unknown`.

### 3. Unknown, Cannot Verify, And Not Assessed

Unknown:

- External ecosystem completeness is `unknown` because no manifest or curated
  inventory was supplied.
- Non-repository children are not assessed as repository candidates.

Not assessed:

- AsyncAPI, Backstage, code-index, CycloneDX, jscpd, OpenAPI, Semgrep, and
  Structurizr outputs are `not_assessed` in `context/gaps.jsonl`.
- Runtime relationship inference and service-topology inference are
  `not_assessed` in `map/map.md`.
- Non-Go source relationship detection, lifecycle modeling, and unsupported
  language relationship detectors are `not_assessed`.
- UI Cursor/Composer, OpenCode, multi-repo, and black-box/metadata-heavy
  acceptance cells are `not_assessed` by this lane.

Cannot verify:

- `cannot_verify` references in the answer: 0. No active `cannot_verify`
  record was produced by this lane. The `cannot_verify` scoring path is
  therefore unexercised by this run; the relevant degraded states for this
  target were `unknown` and `not_assessed`.

### 4. Next Three Useful Local Actions

1. Run the same blind prompt on a real multi-repo local ecosystem target and
   record the matrix cell separately.
2. Run the Cursor UI/Composer single-repo cell using the same prompt to avoid
   generalizing from Codex or prior headless Cursor evidence.
3. Supply a local curated inventory or manifest when completeness matters, then
   rerun `portolan map --selection ...` and compare coverage.

## Scoring

- Unsupported claims: 0
- Unsupported claim examples: none recorded in this lane answer
- Useful next actions: 3
- Useful next action examples: multi-repo lane, UI Cursor/Composer lane,
  curated inventory rerun
- Artifact citation: present
- Explicit `unknown`: present
- Explicit `cannot_verify`: 0 references; no active `cannot_verify` record was
  produced by this target
- Explicit `not_assessed`: present
- Scoring independence: self-scored by the Codex implementation lane, with
  independent review required before treating the score as final product
  evidence beyond this lane ledger

## Claim Impact

This lane supports only a narrow claim: Codex can execute the blind acceptance
prompt on a single local repository and produce/scored Portolan context and map
evidence. It does not broaden claims for UI Cursor/Composer, OpenCode,
multi-repo targets, black-box targets, runtime topology, or complete inherited
estate coverage.

Generalization to non-Portolan single-repo targets remains `not_assessed`.
