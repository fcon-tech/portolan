# Hypothesis Precondition: Bigtop Context Preparation

Date: 2026-05-26

## Purpose

Check whether Portolan context preparation can discover the local Bigtop
ecosystem root without using `/home/fall_out_bug/projects/bigtop-landscape/selection.json`.

This is not a Cursor product-validation lane. It is a precondition check for
running the Bigtop hypothesis comparison later.

## Command

```bash
go run ./cmd/portolan context prepare --root /home/fall_out_bug/projects/bigtop-landscape --out /tmp/portolan-bigtop-context --profile cursor --force
```

## Result

- Context pack written to `/tmp/portolan-bigtop-context`.
- `repos.json` contains 18 discovered repositories.
- `agent-brief.md` reports:
  - repositories discovered: 18
  - local tool-output candidates: 0
  - gap records: 9
  - external ecosystem completeness: `unknown`

## Classification

| Claim | Evidence | Classification | Notes |
| --- | --- | --- | --- |
| Bigtop context preparation can run without a selection shortcut. | command output and `/tmp/portolan-bigtop-context/repos.json` | `verified` | This proves local Portolan precondition only. |
| Cursor-plus-Portolan outperforms Cursor-alone on Bigtop. | no Cursor comparison run | `not_assessed` | Requires controlled Cursor lanes. |
| Local Bigtop checkout is a complete ecosystem. | no manifest comparison in context pack | `unknown` | Correctly not claimed. |

