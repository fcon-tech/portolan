# Blind Agent Acceptance Run: Cursor Agent Control Target

Date: 2026-05-26
Evaluator: Codex review of Cursor Agent run artifacts
Agent harness: Cursor Agent CLI
Model: Composer, as reported by the generated ledger
Status: degraded
Stop reason: full artifact bundle was produced and inspected, but the parent
Cursor shell rejected direct `go`/`go run`; the run required a workaround and
most product surfaces remained `not_assessed`.

## Target

- Portolan path: `/home/fall_out_bug/projects/sdp/portolan`
- Target root: `/home/fall_out_bug/projects/consensus_tg_bot`
- Output directory: `/tmp/portolan-control-blind-cursor-run`
- Target type: single local Git repository outside Portolan
- Is this Apache Bigtop: no
- Is this a control target: yes

## Exact Prompt

```text
Portolan: /home/fall_out_bug/projects/sdp/portolan
Target: /home/fall_out_bug/projects/consensus_tg_bot
Output: /tmp/portolan-control-blind-cursor-run

map this shit.

Do not fetch upstream repositories.
Do not use network.
Do not mutate the target repository.
Do not infer facts outside Portolan artifacts.
Record every Portolan capability gap you hit.

Harness instruction: preserve a concise transcript summary in your final answer. Do not edit files except Portolan output artifacts under the selected Output directory or temporary context artifacts outside the Target.
```

## Forbidden Hint Check

- target-specific file list: pass
- target-specific build or package instructions: pass
- specific internal guide path named by operator: pass
- hidden target architecture context: pass
- network, mutation, or credential permission: pass
- prepared `selection.json` / `Landscape:` shortcut: pass

## Artifact Inventory

| Artifact | State | Notes |
| --- | --- | --- |
| `context/agent-brief.md` | present | under output directory |
| `context/query-plan.md` | present | under output directory |
| `context/repos.json` | present | 1 repository |
| `context/tool-registry.json` | present | 0 tools |
| `context/gaps.jsonl` | present | 9 records |
| `run.json` | present | command `portolan map` |
| `coverage.json` | present | 3 coverage records |
| `graph.json` | present | 761 nodes, 760 edges |
| `findings.jsonl` | present | 14 findings |
| `map.md` | present | reviewed by Cursor Agent and Codex |

## Artifact Review

- `coverage.json`: one repository record was `visible` /
  `source-visible`; `external-completeness` was `unknown`;
  `non-repository-children` recorded 17 direct child files as not assessed for
  repository discovery.
- `tool-registry.json`: empty; no OSS/tool outputs were detected.
- `findings.jsonl`: one observed inventory finding; relationships,
  duplication, configuration, and technical debt remained `not_assessed`.
- `map.md`: preserved unknown and not-assessed boundaries.

## Transcript Summary

Cursor Agent discovered Portolan workflow artifacts, prepared context, ran
`map --root`, inspected generated artifacts, and produced an artifact-only
summary. It did not inspect target source manually for architecture claims.

## Report Review

- artifact-backed conclusions: one local Git repository visible; file inventory
  graph present; no OSS/tool-output candidates.
- transcript-only claims: parent harness rejected `go`; accepted only as
  harness behavior.
- unsupported or overclaimed conclusions: none accepted.
- unknowns preserved: external completeness and non-repository children.
- cannot-verify states preserved: none triggered.
- not-assessed surfaces preserved: OSS families, non-Go relationships,
  duplication, configuration, and technical debt.

## Gap Ledger

| Gap ID | Generic gap | Evidence | Suggested backlog action |
| --- | --- | --- | --- |
| GAP-HARNESS-GO | Cursor parent shell can block direct `go`/`go run`. | Transcript and generated ledger. | Prefer installed binary path or document reliable source-checkout execution. |
| GAP-OUT-FORCE | Pre-created context/output directories require `--force`. | Generated ledger. | Clarify output bootstrap or tolerate empty output directories. |
| GAP-NO-BINARY | No `portolan` binary on PATH. | Generated ledger. | Add packaging/install slice. |
| GAP-OSS-EMPTY | No OSS/tool-output candidates were found. | `tool-registry.json` tools array empty. | Provide OSS execution/import guidance or examples. |
| GAP-REL-NONGO | Python project relationships remained `not_assessed`. | `findings.jsonl`. | Add Python import/requirements relationship detection. |
| GAP-GRAPH-TYPE | Inventory nodes are `kind: unknown`. | `graph.json` node kinds. | Add file/surface classification summary for agents. |
| GAP-DUP-FINDINGS | Placeholder findings are duplicated in `findings.jsonl` / `map.md`. | Control run map output. | Dedupe map findings. |

## Status Decision

- status: degraded
- reason: blind protocol shape was followed and artifacts were produced, but
  command execution needed a workaround and broad CTO surfaces remained
  `not_assessed`.
- evidence: `/tmp/portolan-control-blind-cursor-transcript.out` and
  `/tmp/portolan-control-blind-cursor-run/`
- follow-up: package/install path, output bootstrap improvement, Python/config
  detectors, graph file classification, and finding dedupe.

