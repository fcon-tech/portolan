# Hypothesis Ledger: Bigtop Cursor Comparison

Date: 2026-05-26

## Hypothesis

- ID: H1/H3
- Claim: Cursor-plus-Portolan context preparation reduces false
  repository-scope and service-relationship claims compared with Cursor alone
  on a large multi-repo OSS landscape.
- Target user: CTO or engineering leader inspecting inherited multi-repo
  infrastructure.
- Target question: "What can I safely know about this local Apache Bigtop
  ecosystem before deeper analysis?"
- Acceptance client: Cursor Agent CLI.
- Target root: `/home/fall_out_bug/projects/bigtop-landscape`
- Required evidence: Cursor-alone summary, Cursor-plus-Portolan summary,
  Portolan context pack artifacts.
- Failure condition: the assisted lane ignores `gaps.jsonl`, invents service
  relationships, treats local checkout completeness as complete ecosystem
  evidence, or cannot use the context pack.

## Portolan Context Precondition

Command:

```bash
go run ./cmd/portolan context prepare --root /home/fall_out_bug/projects/bigtop-landscape --out /tmp/portolan-bigtop-context --profile cursor --force
```

Result:

- `repos.json`: 18 discovered repositories.
- `tool-registry.json`: 0 tool-output candidates, encoded as an empty array.
- `gaps.jsonl`: 9 gaps.
- `gap-external-completeness`: `unknown`.
- OSS/tool-output families for jscpd, CycloneDX/Syft, Semgrep, Backstage,
  OpenAPI, AsyncAPI, Structurizr, and code indexes: `not_assessed`.

## Lanes

| Lane | Prompt Shape | Output | Result | Evidence State |
| --- | --- | --- | --- | --- |
| Cursor-alone | inspect Bigtop root without Portolan context, no network, no mutation, no large source reads | `/tmp/portolan-bigtop-cursor-alone.out` | Useful but mixed direct inspection with `selection.json`, Bigtop BOM hints, and prior `run/` artifacts; made plausible relationship/duplication risk statements while marking them not assessed | mixed local evidence and agent synthesis |
| Cursor-plus-Portolan | inspect `/tmp/portolan-bigtop-context` first, then use quick local clarification only | `/tmp/portolan-bigtop-cursor-plus.out` | Preserved 18-repo local scope, empty tool registry, explicit gaps, external completeness unknown, and refused duplication/service-topology claims without tool evidence | verified context-pack use plus unknown/not_assessed preservation |

## Claim Classification

| Claim | Lane | Evidence | Classification | Notes |
| --- | --- | --- | --- | --- |
| Bigtop local root has 18 discovered Git repositories under `repos/`. | Portolan + assisted Cursor | `repos.json`, assisted lane output | `verified` | Local checkout scope only. |
| Local checkout proves complete Bigtop ecosystem coverage. | both | `gap-external-completeness` | `unknown` | Correctly not proven. |
| Duplicate components can be identified from current context pack. | assisted Cursor | `tool-registry.json`, `gaps.jsonl` | `not_assessed` | No jscpd/SBOM outputs registered. |
| Service relationships can be described from current context pack. | assisted Cursor | `gaps.jsonl` | `not_assessed` | No Backstage/OpenAPI/AsyncAPI/Structurizr/index input. |
| Cursor-plus-Portolan reduced unsupported claims compared with Cursor-alone. | comparison | lane outputs | `verified` for this run | Assisted lane avoided BOM/selection-derived relationship speculation and stayed inside pack gaps. |

## Product Findings

- Positive: the context pack gave Cursor a crisp local-scope boundary and made
  the missing OSS families explicit.
- Positive: the empty-array `tool-registry.json` shape avoided the previous
  `tools: null` ambiguity after the implementation fix.
- Gap: the pack currently detects candidate tool outputs but does not import or
  run the OSS tools that matter for the CTO questions.
- Gap: the assisted lane still required the prompt to name the context pack;
  blind `.cursor` rule discovery remains not assessed.

## Decision

- Keep H1/H3 alive: Bigtop comparison supports the agent-augmentation thesis.
- Next implementation priority: OSS adapter/execution policy for jscpd and
  CycloneDX/Syft outputs, then Backstage/OpenAPI/AsyncAPI/Structurizr
  relationship surfaces.
- Do not claim Bigtop market fit is complete. The useful result is narrower:
  Cursor-plus-Portolan improves evidence discipline and scope control.

