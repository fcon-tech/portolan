# Acceptance Lane Ledger: OpenCode Kimi Single Repo

Date: 2026-05-27
Lane ID: `opencode-single-repo`
Harness: OpenCode
Model: `kimi-for-coding/k2p6`
Target shape: single-repo
State: `verified` with caveats

## Prompt

Prompt source: `docs/agent/ACCEPTANCE.md`, "Blind Acceptance Prompt"

Variables supplied as prompt text:

```text
PORTOLAN_PATH=/tmp/portolan-opencode-k2p6-lane-mZmHrz/portolan
TARGET_PATH=/tmp/portolan-opencode-k2p6-lane-mZmHrz/portolan
OUTPUT_PATH=/tmp/portolan-opencode-k2p6-lane-mZmHrz/out
```

Hidden scaffolding: none. No target-specific file list, expected finding, or
private answer outline was supplied.

Harness execution caveat: OpenCode required
`--dangerously-skip-permissions` to allow writes to the supplied external
`OUTPUT_PATH`. A prior run without that flag created the map but rejected
context creation because of OpenCode's external-directory permission gate. The
successful lane therefore validates OpenCode + `kimi-for-coding/k2p6` behavior
under explicit permission bypass, not default OpenCode permissions.

Self-target note: `PORTOLAN_PATH` and `TARGET_PATH` intentionally point at the
same detached Portolan checkout for this first OpenCode lane. This verifies
the blind prompt against a local repository, not general behavior on arbitrary
external repositories.

## Commands

```bash
git worktree add --detach /tmp/portolan-opencode-k2p6-lane-mZmHrz/portolan HEAD
opencode run \
  --model kimi-for-coding/k2p6 \
  --dir /tmp/portolan-opencode-k2p6-lane-mZmHrz/portolan \
  --format json \
  --dangerously-skip-permissions \
  "$PROMPT"
```

The lane resolved the source checkout through `docs/agent/QUICKSTART.md`,
built the repo-local binary, and verified it:

```bash
cd /tmp/portolan-opencode-k2p6-lane-mZmHrz/portolan
./scripts/bootstrap-portolan
/tmp/portolan-opencode-k2p6-lane-mZmHrz/portolan/.portolan/bin/portolan --version
```

Result: `verified`; bootstrap wrote `.portolan/bin/portolan` and version output
was `portolan dev`.

The lane created the context and map artifacts:

```bash
/tmp/portolan-opencode-k2p6-lane-mZmHrz/portolan/.portolan/bin/portolan context prepare --root /tmp/portolan-opencode-k2p6-lane-mZmHrz/portolan --out /tmp/portolan-opencode-k2p6-lane-mZmHrz/out/context --profile cursor --force
/tmp/portolan-opencode-k2p6-lane-mZmHrz/portolan/.portolan/bin/portolan map --root /tmp/portolan-opencode-k2p6-lane-mZmHrz/portolan --out /tmp/portolan-opencode-k2p6-lane-mZmHrz/out/map --force
```

Result: `verified`; both commands exited 0 and wrote artifacts.

## Artifact Checks

Verified by local existence checks after the lane:

- `/tmp/portolan-opencode-k2p6-lane-mZmHrz/out/context/agent-brief.md`
- `/tmp/portolan-opencode-k2p6-lane-mZmHrz/out/context/answer-contract.md`
- `/tmp/portolan-opencode-k2p6-lane-mZmHrz/out/context/evidence-index.jsonl`
- `/tmp/portolan-opencode-k2p6-lane-mZmHrz/out/context/gaps.jsonl`
- `/tmp/portolan-opencode-k2p6-lane-mZmHrz/out/map/summary.json`
- `/tmp/portolan-opencode-k2p6-lane-mZmHrz/out/map/graph-index.json`
- `/tmp/portolan-opencode-k2p6-lane-mZmHrz/out/map/findings.jsonl`
- `/tmp/portolan-opencode-k2p6-lane-mZmHrz/out/map/map.md`

Map summary:

- graph nodes: 957
- graph edges: 924
- findings: 40
- coverage records: 3
- finding statuses: 34 `observed`, 5 `not_assessed`, 1 `unknown`

## Agent Answer Assessment

The final OpenCode answer cited these artifact families:

- `context/agent-brief.md`
- `context/answer-contract.md`
- `context/evidence-index.jsonl`
- `context/gaps.jsonl`
- `context/repos.json`
- `context/tool-registry.json`
- `context/oss-plan.json`
- `context/query-plan.md`
- `map/summary.json`
- `map/graph-index.json`
- `map/findings.jsonl`
- `map/map.md`
- `map/coverage.json`
- `map/run.json`

Evidence-state preservation:

- explicit `unknown`: present for external ecosystem completeness, unresolved
  findings, and direct child file assessment;
- explicit `not_assessed`: present for OSS/tool families, skipped relationship
  surfaces, near-clone detection, semantic config analysis, and Semgrep;
- explicit `cannot_verify`: present as "no explicit `cannot_verify` records";
  runtime topology and production behavior were described as unverifiable from
  source-visible and metadata-visible evidence alone.

Useful next actions:

- run available OSS producers from `oss-plan.json`;
- review exact duplicate testdata/config clusters;
- implement or document skipped relationship detectors.

Unsupported claim scoring:

- unsupported claims: 0 material product claims found in the final answer.
- caveat: the answer recommended running Syft and jscpd to upgrade available
  OSS evidence. That is supported only for the CycloneDX/Syft and jscpd gaps
  listed in `oss-plan.json`, not for all unassessed OSS families.

## Disposition

Claim impact: supports a narrow claim that OpenCode with
`kimi-for-coding/k2p6` can execute the blind acceptance protocol on a Portolan
single-repo self-target, create Portolan context and map artifacts, cite those
artifacts, and preserve `unknown` / `not_assessed` states. An earlier
OpenRouter Kimi run used the wrong model for this lane and is not counted as
acceptance evidence.

Not assessed:

- OpenCode + `kimi-for-coding/k2p6` on an external single-repo target;
- OpenCode + `kimi-for-coding/k2p6` on a multi-repo or black-box target;
- OpenCode default-permission behavior without `--dangerously-skip-permissions`;
- UI Cursor/Composer behavior;
- whether a human reviewer would accept the useful-next-action ranking.
