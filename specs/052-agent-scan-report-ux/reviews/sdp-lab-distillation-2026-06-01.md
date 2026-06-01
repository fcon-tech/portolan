# SDP Lab Distillation For Portolan 052

Date: 2026-06-01

Mode: DESIGN_REVIEW

## Source Inspected

Repository: `/home/fall_out_bug/projects/sdp/sdp_lab`

Files inspected:

- `README.md`
- `AGENTS.md`
- `docs/START_HERE.md`
- `docs/reference/product-surface.md`
- `docs/reference/commands.md`
- `docs/reference/harness-parity-matrix.md`
- `docs/reference/agent-skill-entry-map.md`
- `docs/reference/FALLBACK_MODE.md`
- `docs/runbooks/onboarding-downstream-repo.md`
- `sdp.manifest.yaml`
- `cmd/sdp/cmd_scout.go`
- `internal/scout/types.go`
- `internal/scout/format.go`
- `internal/scout/scout.go`

## Distilled Patterns

1. **First-run promise must stay narrow.** SDP explicitly makes first-run value
   repo inspection plus evidence/limits/next actions, not full operator mode.
   Portolan 052 should likewise sell "first useful report", not complete
   architecture intelligence.

2. **Humans ask through intents.** SDP maps many command/skill surfaces into a
   small human menu. Portolan's user intent should be one phrase: scan this
   repo/folder and prepare the first report.

3. **One source of truth prevents harness drift.** SDP uses a manifest and
   generated adapters. Portolan should not hand-maintain divergent Cursor,
   OpenCode, Codex, Pi, and docs instructions for the scan-report flow.

4. **Static parity is not runtime readiness.** SDP's parity matrix separates
   generated adapter presence from harness execution readiness. Portolan 052
   should use the same distinction for harness examples.

5. **Stable machine contract plus readable rendering.** `sdp scout` uses a
   ProjectCard JSON contract with text/card renderers. Portolan 052 should use
   `report-summary.json` as the stable contract and `first-report.md` as the
   human rendering.

6. **Fallback mode is slower, not lower quality.** When a harness cannot run
   the preferred flow, the fallback checklist still must produce the same
   artifacts and acceptance evidence.

## Applied To Spec 052

- Added requirements for canonical harness instruction source, adapter parity,
  Markdown report relay, and Mermaid v1 diagrams.
- Added research decisions D4 and D5.
- Added tasks for canonical workflow source, adapter parity validation, and
  fallback-mode instructions.

## Not Copied

- SDP's Beads/workstream/operator model. Portolan 052 is a first-report product
  workflow, not a delivery governance system.
- SDP's full manifest schema. Portolan may later need a smaller manifest or
  generation contract, but copying SDP's whole model would be overbuilt.
- SDP's `scout` field set verbatim. The useful pattern is stable contract plus
  renderers, not the exact domain model.
