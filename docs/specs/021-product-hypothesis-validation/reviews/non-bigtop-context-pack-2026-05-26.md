# Hypothesis Ledger: Non-Bigtop Context Pack

Date: 2026-05-26

## Hypothesis

- ID: H1
- Claim: Cursor-plus-Portolan context preparation reduces false repository-scope
  claims compared with Cursor alone on a multi-repo folder.
- Target user: CTO or engineering leader inspecting an inherited codebase.
- Target question: "What can I safely know about this local multi-repo
  landscape before deeper analysis?"
- Acceptance client: Cursor Agent CLI, plus local Portolan context pack.
- Target root: `internal/testfixtures/landscape-map`
- Required evidence: context pack artifacts and Cursor lane transcript summary.
- Failure condition: the Portolan-assisted lane ignores `gaps.jsonl`, collapses
  local scope into a complete ecosystem claim, or presents missing OSS outputs
  as absence of risk.

## Local Portolan Evidence

Command:

```bash
go run ./cmd/portolan context prepare --root internal/testfixtures/landscape-map --out /tmp/portolan-context --profile cursor --force
```

Observed artifacts:

- `agent-brief.md`
- `query-plan.md`
- `repos.json`
- `tool-registry.json`
- `gaps.jsonl`

Local result:

- The context pack is generated.
- External completeness is represented as `unknown`.
- Missing OSS/tool-output families are represented in `gaps.jsonl`.
- This proves the Portolan side of the hypothesis harness, not Cursor behavior.

## Lanes

| Lane | Prompt Shape | Commands/Artifacts | Result | Evidence State |
| --- | --- | --- | --- | --- |
| Cursor-alone | ask Cursor to answer from the target root without Portolan | `/tmp/portolan-cursor-alone.out` summary | useful direct inspection, but relied on `selection.json` as local evidence and did not use scanner outputs | `claim-only` for synthesized conclusions, source/metadata states when it cited files |
| Cursor-plus-Portolan | ask Cursor to inspect generated context pack before answering | `/tmp/portolan-cursor-plus.out` summary plus `/tmp/portolan-hypothesis-context` | preserved Portolan gaps and external completeness unknown; also exposed that context prep found 0 repos in this fixture because fixture repos are not Git checkouts | `verified` for context pack use; `unknown` for repo completeness |

## Cursor Lane Summaries

Cursor-alone:

- Identified four repositories from the local `selection.json` and target files.
- Correctly kept many surfaces as `unknown` or `not_assessed`.
- Did not use Portolan artifacts, by prompt constraint.
- Because it read the curated selection, it was not a pure messy-folder
  first-run simulation.

Cursor-plus-Portolan:

- Read the context pack and preserved `gap-external-completeness`.
- Reported `gap-repositories-not-found` because `context prepare` found 0 Git
  repositories in the fixture.
- Still used the target's curated selection and tool-output files for deeper
  explanation, which is useful but not proof of blind first-run behavior.
- Found a product gap: the context pack should explain when a target looks like
  a repo fixture or curated selection but lacks `.git` directories.

## Claim Classification

| Claim | Lane | Evidence | Classification | Notes |
| --- | --- | --- | --- | --- |
| Portolan can generate a context pack for the non-Bigtop fixture. | Portolan local | command output and artifact inventory | `verified` | This does not prove Cursor uses it. |
| Cursor-plus-Portolan reduces false claims vs Cursor-alone. | Cursor comparison | lane summaries | `unknown` | Assisted lane preserved more explicit gaps, but the fixture shape gave Cursor-alone a curated selection shortcut. |
| Context preparation can miss non-Git repo-like fixture directories. | Cursor-plus-Portolan | `repos.json` and assisted lane | `verified` | This is an accepted product gap for future root discovery / fixture handling. |

## Decision

- Keep: H1 as the first product validation lane.
- Change: use a real multi-repo Git folder for the next non-Bigtop comparison,
  or create a fixture with `.git` directories.
- Product gap: context preparation should distinguish "no Git repositories
  found" from "repo-like curated fixture exists but is outside discovery
  evidence".
- Next spec/task: evaluate Bigtop context preparation and then run Cursor lanes
  only if transcript size and privacy boundaries are acceptable.

## Follow-Up Implementation

Implemented after this lane:

- `gap-repo-like-structure-without-git` is emitted when `selection.json` or
  `repos/*` exists but no bounded Git repositories are discovered.
- Empty repository and tool lists are encoded as `[]`, not `null`, for agent
  readability.
