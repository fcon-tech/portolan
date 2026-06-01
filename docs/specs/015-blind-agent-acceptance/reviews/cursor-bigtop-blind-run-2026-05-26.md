# Blind Agent Acceptance Run: Cursor Agent On Bigtop

Date: 2026-05-26
Evaluator: Codex review of Cursor Agent run artifacts
Agent harness: Cursor Agent CLI
Model: Composer 2.5 Fast, as reported by the generated ledger
Status: degraded
Stop reason: full artifact bundle was produced and inspected, but the parent
Cursor shell rejected direct `go`/`go run`; the agent recovered through a
subagent using the full Go path. Most CTO surfaces remained `not_assessed`.

## Target

- Portolan path: `/home/fall_out_bug/projects/sdp/portolan`
- Target root: `/home/fall_out_bug/projects/bigtop-landscape`
- Output directory: `/tmp/portolan-bigtop-blind-cursor-run`
- Context directory: `/tmp/portolan-bigtop-blind-cursor-context`
- Target type: local multi-repo Apache Bigtop landscape root
- Is this Apache Bigtop: yes
- Is this a control target: no

## Exact Prompt

```text
Portolan: /home/fall_out_bug/projects/sdp/portolan
Target: /home/fall_out_bug/projects/bigtop-landscape
Output: /tmp/portolan-bigtop-blind-cursor-run

map this shit.

Do not fetch upstream repositories.
Do not use network.
Do not mutate the target repository.
Do not infer facts outside Portolan artifacts.
Record every Portolan capability gap you hit.

Harness instruction: preserve a concise transcript summary in your final answer. Do not edit files except Portolan output artifacts under the selected Output directory or temporary context artifacts outside the Target.
```

The harness instruction preserved the transcript summary and did not provide
target-specific file names, build commands, package names, or a selection path.

## Forbidden Hint Check

- target-specific file list: pass
- target-specific build or package instructions: pass
- specific internal guide path named by operator: pass
- hidden target architecture context: pass
- network, mutation, or credential permission: pass
- prepared `selection.json` / `Landscape:` shortcut: pass

## Commands Attempted

The generated ledger reported:

```bash
cd /home/fall_out_bug/projects/sdp/portolan && \
  /home/fall_out_bug/go/bin/go run ./cmd/portolan context prepare \
  --root /home/fall_out_bug/projects/bigtop-landscape \
  --out /tmp/portolan-bigtop-blind-cursor-context --profile cursor --force

cd /home/fall_out_bug/projects/sdp/portolan && \
  /home/fall_out_bug/go/bin/go run ./cmd/portolan map \
  --root /home/fall_out_bug/projects/bigtop-landscape \
  --out /tmp/portolan-bigtop-blind-cursor-run --force
```

Both commands exited 0 according to the Cursor Agent transcript and generated
artifacts.

## Artifact Inventory

| Artifact | State | Notes |
| --- | --- | --- |
| `agent-brief.md` | present | `/tmp/portolan-bigtop-blind-cursor-context/agent-brief.md` |
| `query-plan.md` | present | `/tmp/portolan-bigtop-blind-cursor-context/query-plan.md` |
| `repos.json` | present | 18 repositories |
| `tool-registry.json` | present | 0 tools |
| `gaps.jsonl` | present | OSS families `not_assessed`, external completeness `unknown` |
| `run.json` | present | command `portolan map` |
| `coverage.json` | present | 21 coverage records |
| `graph.json` | present | 148102 nodes, 148714 edges, about 124 MB |
| `findings.jsonl` | present | 118 findings |
| `map.md` | present | reviewed by Cursor Agent and Codex |

## Artifact Review

- `coverage.json`: 18 repository records were `visible` /
  `source-visible`; `external-completeness` was `unknown`; root-level
  `non-git-child-directories` and `non-repository-children` gaps were recorded.
- `tool-registry.json`: empty; no jscpd, CycloneDX/Syft, Semgrep, Backstage,
  OpenAPI, AsyncAPI, Structurizr, or code-index candidate outputs were found.
- `findings.jsonl`: observed relationship findings existed only for Go-capable
  repositories (`alluxio`, `apache-airflow`); 93 relationship findings remained
  `not_assessed`; duplication, configuration, and technical-debt findings were
  `not_assessed`.
- `map.md`: preserved `external-completeness: unknown` and did not claim a
  complete production service topology.

## Transcript Summary

Cursor Agent discovered the generic Portolan protocol from repository artifacts,
prepared context, ran `map --root`, inspected the required artifacts, and
reported from artifacts rather than from manual Bigtop knowledge. It did not use
the local `selection.json` as operator input.

## Report Review

- artifact-backed conclusions: 18 local repositories visible; external
  completeness unknown; no OSS/tool-output candidates; Go relationships
  observed only where local Go inputs existed.
- transcript-only claims: parent harness rejected bare `go`/`go run`; accepted
  as a harness observation, not a Portolan artifact claim.
- unsupported or overclaimed conclusions: none accepted.
- unknowns preserved: external completeness and repository-discovery gaps.
- cannot-verify states preserved: none triggered.
- not-assessed surfaces preserved: OSS families, duplication, configuration,
  technical debt, non-Go/runtime/lifecycle/service-topology relationships.

## Gap Ledger

| Gap ID | Generic gap | Evidence | Suggested backlog action |
| --- | --- | --- | --- |
| GAP-HARNESS-GO | Cursor parent shell can block direct `go`/`go run`. | Transcript and generated ledger. | Prefer installed binary path or document reliable source-checkout execution. |
| GAP-NO-BINARY | No `portolan` binary on PATH. | Cursor Agent used `/home/fall_out_bug/go/bin/go run`. | Add packaging/install slice. |
| GAP-OSS-EMPTY | No OSS/tool-output candidates were found. | `tool-registry.json` tools array empty. | Provide OSS execution/import guidance or examples. |
| GAP-REL-NONGO | Relationship detection is Go-only for this run. | 16/18 repos had no supported relationship signal. | Add non-Go/manifest relationship detection. |
| GAP-DUP-CFG-DEBT | Duplication, configuration, and technical-debt detectors are not implemented. | `run.json` skipped surfaces and `findings.jsonl`. | Continue P2 detector specs. |
| GAP-GRAPH-SCALE | `graph.json` was about 124 MB and impractical for in-prompt review. | `wc -c` and Cursor Agent report. | Add map summary/index artifact for agents. |

## Status Decision

- status: degraded
- reason: blind protocol shape was followed and artifacts were produced, but
  command execution needed a workaround and broad CTO surfaces remained
  `not_assessed`.
- evidence: `/tmp/portolan-bigtop-blind-cursor-transcript.out`,
  `/tmp/portolan-bigtop-blind-cursor-context/`, and
  `/tmp/portolan-bigtop-blind-cursor-run/`
- follow-up: package/install path, OSS execution/import guidance, non-Go
  relationship/config/duplication/debt detectors, and agent-scale map summaries.

