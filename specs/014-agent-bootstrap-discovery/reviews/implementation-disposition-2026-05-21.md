# Implementation Disposition: Agent Bootstrap Discovery

Date: 2026-05-21

## Implementation State

Implemented the spec 014 bootstrap surface:

- added root-discoverable `agent/START_HERE.md`;
- added portable skill artifact `agent/skills/portolan-map/SKILL.md`;
- updated root README navigation;
- updated `docs/agent-toolbox/README.md` to define the bootstrap contract;
- updated `.cursor/rules/portolan-map.mdc` to delegate to `START_HERE` and
  remove the stale `portolan doctor` instruction;
- updated `agent/AGENT_GUIDE.md` for explicit target roots, source-checkout
  execution, and non-source target handling;
- updated `agent/examples/map-report.md` for the current `portolan map` bundle;
- updated `docs/product-backlog.md` and this task ledger to mark spec 014
  implemented.

## Review Disposition

### Pre-implementation local review

Accepted findings from
`specs/014-agent-bootstrap-discovery/reviews/pre-implementation-review-disposition-2026-05-21.md`
were fixed:

- root-discoverable bootstrap file added;
- stale Cursor `portolan doctor` instruction removed;
- portable skill artifact added;
- stale example report updated;
- non-source target guidance made explicit.

### Independent review lanes

- `minimax/MiniMax-M2.7`: no blocking findings. Minor concern that untracked new
  files were not shown in the first diff prompt; addressed by local file
  inspection and final diff-scope verification.
- `zai/glm-5.1`: no blocking findings. Minor suggestion to define evidence
  states in the portable skill; accepted and fixed.
- `kimi-coding/kimi-for-coding`: degraded to `not_assessed`; the lane did not
  return a substantive review result before timing out.

## Verification

- verified: `go test ./...`
- verified: `jq empty schema/*.json`
- verified: `git diff --check`
- verified: `go run ./cmd/portolan map --help`
- verified: local fixture command produced `run.json`, `graph.json`,
  `findings.jsonl`, and `map.md` under `/tmp/portolan-014-map-run`.
- verified: `agent/START_HERE.md` and `agent/skills/portolan-map/SKILL.md` do
  not contain Bigtop-specific choreography.

## Remaining Risks

- not_assessed: blind agent trial; this belongs to spec 015.
- not_assessed: GitHub PR checks until a PR exists.
- risk: weak agents may still need the blind acceptance protocol to reveal
  whether `START_HERE` is short enough in practice.
