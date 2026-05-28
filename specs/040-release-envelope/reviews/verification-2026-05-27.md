# Verification Log: Release Envelope

Date: 2026-05-27

## Foundation Checks

### `scripts/bootstrap-portolan --help`

Status: verified

Output summary:

- usage exposes `scripts/bootstrap-portolan [--out <file>]`;
- default output is `.portolan/bin/portolan`;
- network fetching is disabled by default;
- retry with `PORTOLAN_BOOTSTRAP_ALLOW_NETWORK=1` is documented for explicit
  network approval when the local Go module cache is missing dependencies.

## Later Checks

Final baseline and install-smoke results are recorded in
`implementation-disposition-2026-05-27.md`.

## Follow-Up Clean-Checkout Smoke

Date: 2026-05-27

Status: verified

Scope: detached clean worktree from `HEAD` commit `2272ffb` outside the dirty
main checkout.

Commands:

```bash
git worktree add --detach /tmp/portolan-clean-smoke-MG9AqD/repo HEAD
cd /tmp/portolan-clean-smoke-MG9AqD/repo
scripts/bootstrap-portolan
.portolan/bin/portolan --version
.portolan/bin/portolan context prepare --root . --out /tmp/portolan-clean-smoke-MG9AqD/context --profile cursor --force
.portolan/bin/portolan map --root . --out /tmp/portolan-clean-smoke-MG9AqD/map --force
```

Observed result:

- bootstrap wrote `.portolan/bin/portolan`;
- version command returned `portolan dev`;
- context preparation wrote `agent-brief.md`, `answer-contract.md`,
  `query-plan.md`, `evidence-index.jsonl`, `repos.json`, `tool-registry.json`,
  `oss-plan.json`, and `gaps.jsonl`;
- map wrote `run.json`, `coverage.json`, `summary.json`, `graph-index.json`,
  `graph.json`, `findings.jsonl`, and `map.md`;
- required smoke artifact existence checks passed.

Not assessed:

- package-manager install;
- binary release checksums;
- GitHub Actions state for uncommitted follow-up documentation edits;
- clean checkout from a public remote clone with an empty Go module cache.

## Agent Install Documentation Smoke

Date: 2026-05-27

Status: verified

Scope: clean filesystem copy of the current working tree, excluding `.git`,
`.portolan`, and generated Graphify output. This verifies the current
uncommitted agent-facing install/docs state rather than only the older `HEAD`
worktree.

Commands:

```bash
rsync -a --delete --exclude .git --exclude .portolan --exclude graphify-out \
  /home/fall_out_bug/projects/sdp/portolan/ \
  /tmp/portolan-clean-copy-parent-lJJLkx/portolan/
cd /tmp/portolan-clean-copy-parent-lJJLkx/portolan
scripts/bootstrap-portolan
.portolan/bin/portolan --version
.portolan/bin/portolan context prepare --root . --out /tmp/portolan-agent-install-smoke-memDMp/context --profile cursor
.portolan/bin/portolan map --root . --out /tmp/portolan-agent-install-smoke-memDMp/map
.portolan/bin/portolan query gaps --bundle /tmp/portolan-agent-install-smoke-memDMp/map --limit 5
.portolan/bin/portolan query findings --bundle /tmp/portolan-agent-install-smoke-memDMp/map --kind relationships --limit 5
```

Observed result:

- bootstrap wrote `.portolan/bin/portolan`;
- version command returned `portolan dev`;
- context preparation wrote a non-empty `agent-brief.md`,
  `answer-contract.md`, and `evidence-index.jsonl`;
- map wrote a non-empty `summary.json`, `graph-index.json`,
  `findings.jsonl`, and `map.md`;
- bounded `query gaps` and `query findings` commands ran successfully;
- English and Russian install prompt docs exist:
  `docs/agent/INSTALL-PROMPT.md` and
  `docs/agent/INSTALL-PROMPT.ru.md`.

Not assessed:

- package-manager install;
- public remote clone after these uncommitted documentation edits;
- GitHub Actions state for these uncommitted documentation edits;
- real external agent execution from the new prompt docs.

## OpenCode Install Prompt Smoke

Date: 2026-05-27

Status: verified

Scope: OpenCode `1.15.10` with `kimi-for-coding/k2p6`, Portolan self-target,
English install prompt from `docs/agent/INSTALL-PROMPT.md`.

Evidence:

- Lane ledger:
  `specs/041-agent-acceptance-matrix/reviews/opencode-k2p6-install-prompt-lane-2026-05-27.md`
- Output directory:
  `/tmp/portolan-opencode-install-prompt-Rqdw9g`
- OpenCode session:
  `ses_194c81541ffeXfKekbHp2FAAbg`

Observed result:

- OpenCode read `docs/agent/INSTALL.md` and `scripts/bootstrap-portolan`.
- OpenCode ran `./scripts/bootstrap-portolan` and verified
  `.portolan/bin/portolan --version`.
- OpenCode produced context and map artifacts under the requested output path.
- Independent verification confirmed 8 context files, 7 map files, valid JSON
  for the structured artifacts, and preserved `unknown` / `not_assessed`
  states.

Limitations:

- Cursor UI execution is outside the current required acceptance scope.
- External target execution from the install prompt is assessed in later dated
  lanes below.
- OpenCode default-permission external-output behavior is assessed in a later
  dated lane below.

## OpenCode Bigtop Install Prompt Smoke

Date: 2026-05-28

Status: verified

Scope: OpenCode `1.15.10` with `kimi-for-coding/k2p6`, local Bigtop landscape
target, English install prompt from `docs/agent/INSTALL-PROMPT.md`.

Evidence:

- Lane ledger:
  `specs/041-agent-acceptance-matrix/reviews/opencode-k2p6-install-prompt-bigtop-lane-2026-05-28.md`
- Output directory:
  `/tmp/portolan-opencode-install-bigtop-r5W09x`
- OpenCode session:
  `ses_194bf28fbffeij6n37cX57k5VT`

Observed result:

- OpenCode read `docs/agent/INSTALL.md` and `scripts/bootstrap-portolan`.
- OpenCode ran `scripts/bootstrap-portolan` and verified
  `.portolan/bin/portolan --version`.
- OpenCode produced context artifacts under the requested output path.
- OpenCode discovered target-local `selection.json` and used it for map
  generation.
- Independent verification confirmed 8 context files, 7 map files, valid JSON
  for the structured artifacts, 168575 graph nodes, 145467 graph edges, and
  preserved `unknown`, `cannot_verify`, and `not_assessed` states.

Limitations:

- Cursor UI execution is outside the current required acceptance scope.
- Arbitrary external customer targets remain unproven.
- External single-repo install-prompt execution is assessed in later dated
  lanes below.
- OpenCode default-permission external-output behavior is assessed in a later
  dated lane below.

## RU/EN Documentation Install Surface Smoke

Date: 2026-05-28

Status: verified

Scope: current working tree documentation and clean filesystem copy install
path after the RU/EN agent-install documentation updates.

Commands:

```bash
tmp_parent=$(mktemp -d /tmp/portolan-clean-copy-parent-XXXXXX)
out=$(mktemp -d /tmp/portolan-clean-doc-smoke-XXXXXX)
rsync -a --delete --exclude .git --exclude .portolan --exclude graphify-out \
  /home/fall_out_bug/projects/sdp/portolan/ "$tmp_parent/portolan/"
cd "$tmp_parent/portolan"
scripts/bootstrap-portolan
.portolan/bin/portolan --version
.portolan/bin/portolan context prepare --root . --out "$out/context" --profile cursor
.portolan/bin/portolan map --root . --out "$out/map"
.portolan/bin/portolan query gaps --bundle "$out/map" --limit 5
.portolan/bin/portolan query findings --bundle "$out/map" --kind relationships --limit 5
jq empty "$out/context/repos.json" "$out/context/tool-registry.json" \
  "$out/context/oss-plan.json" "$out/map/coverage.json" \
  "$out/map/graph-index.json" "$out/map/graph.json" \
  "$out/map/run.json" "$out/map/summary.json"
```

Observed result:

- clean copy path:
  `/tmp/portolan-clean-copy-parent-bN1sfT/portolan`
- output path:
  `/tmp/portolan-clean-doc-smoke-RsR82r`
- `scripts/bootstrap-portolan` produced `.portolan/bin/portolan`.
- `.portolan/bin/portolan --version` returned `portolan dev`.
- context, map, bounded gap query, and bounded findings query ran
  successfully.
- required bounded artifacts were non-empty.
- structured JSON artifacts passed `jq empty`.

Documentation surfaces checked for the current slice:

- `README.md`
- `docs/agent/INSTALL.md`
- `docs/agent/INSTALL.ru.md`
- `docs/agent/INSTALL-PROMPT.md`
- `docs/agent/INSTALL-PROMPT.ru.md`
- `docs/agent/QUICKSTART.md`
- `docs/ru/README.md`
- `docs/ru/product-boundary.md`
- `docs/product-claims.md`

Not assessed:

- public remote clone after these uncommitted edits;
- package-manager install;
- binary release checksums.

Out of current required scope:

- Cursor UI execution from the copyable install prompt.

## OpenCode External Single-Repo Install Prompt Smoke

Date: 2026-05-28

Status: verified after prompt-doc tightening

Scope: OpenCode `1.15.10` with `kimi-for-coding/k2p6`, external single-repo
target `/home/fall_out_bug/projects/vibe_coding/spec-kit`, English install
prompt block from `docs/agent/INSTALL-PROMPT.md`.

Evidence:

- Lane ledger:
  `specs/041-agent-acceptance-matrix/reviews/opencode-k2p6-install-prompt-external-single-repo-lane-2026-05-28.md`
- Verified output directory:
  `/tmp/portolan-opencode-install-singlerepo-rerun-8RI92u`
- Verified OpenCode session:
  `ses_194b2c3caffeBPOt1mlSSxfNDP`
- Earlier failed/off-contract output directory:
  `/tmp/portolan-opencode-install-singlerepo-7KXnCO`
- Earlier failed/off-contract OpenCode session:
  `ses_194b41b79ffetsoqOJimaoAAtA`

Observed result:

- The first whole-file prompt attempt produced context and map artifacts but
  ended with an off-contract "what would you like me to do" answer. This was
  assessed as a failed attempt, not product evidence.
- The prompt docs were tightened to tell receiving agents to execute the prompt
  block rather than ask whether to proceed.
- The rerun used the copyable prompt block with only `PORTOLAN_PATH`,
  `TARGET_PATH`, and `OUTPUT_PATH` filled in.
- OpenCode verified the Portolan binary, confirmed no target-local
  `selection.json`, ran context preparation, ran map generation, read bounded
  artifacts, and produced the required answer shape.
- Independent verification confirmed 8 context files, 7 map files, valid JSON
  for the structured artifacts, 272 graph nodes, 108 graph edges, 7
  `not_assessed` findings, 1 `unknown` finding, and no `cannot_verify`
  findings.

Not assessed:

- arbitrary external single-repo targets beyond the selected local `spec-kit`
  target.

Out of current required scope:

- Cursor UI execution from the install prompt.

Failed in separate lane:

- OpenCode default-permission external-output behavior without
  `--dangerously-skip-permissions`.

## OpenCode Russian External Single-Repo Install Prompt Smoke

Date: 2026-05-28

Status: verified

Scope: OpenCode `1.15.10` with `kimi-for-coding/k2p6`, external single-repo
target `/home/fall_out_bug/projects/vibe_coding/spec-kit`, Russian install
prompt block from `docs/agent/INSTALL-PROMPT.ru.md`.

Evidence:

- Lane ledger:
  `specs/041-agent-acceptance-matrix/reviews/opencode-k2p6-ru-install-prompt-external-single-repo-lane-2026-05-28.md`
- Output directory:
  `/tmp/portolan-opencode-ru-install-singlerepo-6mOMMm`
- OpenCode session:
  `ses_194af01a0ffeeJro26LFTBUEkj`

Observed result:

- OpenCode read `docs/agent/INSTALL.ru.md`.
- OpenCode ran `scripts/bootstrap-portolan` and verified
  `.portolan/bin/portolan --version`.
- OpenCode confirmed no target-local `selection.json`, ran context preparation,
  ran map generation, read bounded artifacts, and answered in Russian.
- Independent verification confirmed 8 context files, 7 map files, valid JSON
  for the structured artifacts, 272 graph nodes, 108 graph edges, 7
  `not_assessed` findings, 1 `unknown` finding, and no `cannot_verify`
  findings.

Not assessed:

- arbitrary external single-repo targets beyond the selected local `spec-kit`
  target.

Out of current required scope:

- Cursor UI execution from the Russian install prompt.

Failed in separate lane:

- OpenCode default-permission external-output behavior without
  `--dangerously-skip-permissions`.

## OpenCode Default-Permission External Output Smoke

Date: 2026-05-28

Status: failed

Scope: OpenCode `1.15.10` with `kimi-for-coding/k2p6`, English install prompt
block from `docs/agent/INSTALL-PROMPT.md`, external single-repo target
`/home/fall_out_bug/projects/vibe_coding/spec-kit`, external `/tmp` output
path, without `--dangerously-skip-permissions`.

Evidence:

- Lane ledger:
  `specs/041-agent-acceptance-matrix/reviews/opencode-k2p6-default-permission-external-output-lane-2026-05-28.md`
- Output directory:
  `/tmp/portolan-opencode-default-permission-lc7uw2`
- OpenCode session:
  `ses_194ab47fdffeC1oGLavIfDkri5`

Observed result:

- OpenCode read `docs/agent/INSTALL.md`.
- OpenCode ran `scripts/bootstrap-portolan` and verified
  `.portolan/bin/portolan --version`.
- OpenCode attempted to create `/tmp/portolan-opencode-default-permission-lc7uw2`
  and the harness auto-rejected the external directory permission request.
- No context or map artifacts were produced for this lane.

Assessment:

- `failed`: default-permission OpenCode external-output behavior is not
  accepted for the documented install-prompt flow.
- `verified`: the failure reason is explicit and reproducible in the session
  log and stderr.

Not assessed:

- none for OpenCode default-permission output placement: external `/tmp` output
  failed here; repo-local output is assessed in the following lane.

Out of current required scope:

- Cursor UI behavior, which is outside the current required acceptance scope.

## OpenCode Default-Permission Internal Output Smoke

Date: 2026-05-28

Status: verified

Scope: OpenCode `1.15.10` with `kimi-for-coding/k2p6`, English install prompt
block from `docs/agent/INSTALL-PROMPT.md`, external single-repo target
`/home/fall_out_bug/projects/vibe_coding/spec-kit`, repo-local output path
under `.portolan/acceptance`, without `--dangerously-skip-permissions`.

Evidence:

- Lane ledger:
  `specs/041-agent-acceptance-matrix/reviews/opencode-k2p6-default-permission-internal-output-lane-2026-05-28.md`
- Output directory:
  `/home/fall_out_bug/projects/sdp/portolan/.portolan/acceptance/opencode-default-permission-internal-output-1779917367`
- OpenCode session:
  `ses_194a852d0ffenrMcj0txAjVQP5`

Observed result:

- OpenCode read `docs/agent/INSTALL.md`.
- OpenCode ran `scripts/bootstrap-portolan` and verified
  `.portolan/bin/portolan --version`.
- OpenCode wrote context and map artifacts under the repo-local
  `.portolan/acceptance/...` output path without permission bypass.
- OpenCode produced the required final report with artifact paths, weak states,
  next actions, and unsupported claims avoided.
- Independent verification confirmed 8 context files, 7 map files, valid JSON
  for the structured artifacts, 272 graph nodes, 108 graph edges, 7
  `not_assessed` findings, 1 `unknown` finding, and no `cannot_verify`
  findings.

Assessment:

- `verified`: OpenCode default-permission execution works when `OUTPUT_PATH`
  stays inside the Portolan checkout.
- `failed`: OpenCode default-permission execution with external `/tmp`
  `OUTPUT_PATH` remains failed as recorded above.

Out of current required scope:

- Cursor UI behavior, which is outside the current required acceptance scope.

## Acceptance Matrix Scope Reconciliation

Date: 2026-05-28

Status: verified by documentation inspection

Scope: acceptance matrix required lane boundary after CLI-only Cursor decision
and OpenCode default-permission assessment.

Evidence:

- `docs/agent/ACCEPTANCE.md`
- `docs/product-claims.md`
- `docs/release.md`

Observed result:

- Cursor UI is no longer represented as a required acceptance lane; Cursor
  Agent CLI + Composer 2.5 remains the verified Cursor lane.
- Codex is represented as a single-repo control lane, not a requirement to
  repeat every target shape in Codex.
- OpenCode + `kimi-for-coding/k2p6` covers the required single-repo,
  multi-repo, black-box, English/Russian install-prompt, and default-permission
  output-placement lanes with explicit `verified` or `failed` statuses.
- Release notes now distinguish repo-local default-permission output from
  external output paths requiring permission bypass.

Not assessed:

- arbitrary external customer targets beyond the named local targets remain
  unproven limitations, not acceptance blockers.

## OpenCode Russian Install Prompt Smoke

Date: 2026-05-27

Status: verified

Scope: OpenCode `1.15.10` with `kimi-for-coding/k2p6`, Portolan self-target,
Russian install prompt from `docs/agent/INSTALL-PROMPT.ru.md`.

Evidence:

- Lane ledger:
  `specs/041-agent-acceptance-matrix/reviews/opencode-k2p6-ru-install-prompt-lane-2026-05-27.md`
- Output directory:
  `/tmp/portolan-opencode-ru-install-prompt-wodiud`
- OpenCode session:
  `ses_194c3f714ffePF2hL5TipuGMAU`

Observed result:

- OpenCode read `docs/agent/INSTALL.ru.md` and `scripts/bootstrap-portolan`.
- OpenCode ran `./scripts/bootstrap-portolan` and verified
  `.portolan/bin/portolan --version`.
- OpenCode produced context and map artifacts under the requested output path.
- OpenCode answered in Russian and preserved `unknown`, `not_assessed`, and
  explicit absence of `cannot_verify` in the artifact result.
- Independent verification confirmed 8 context files, 7 map files, valid JSON
  for the structured artifacts, and preserved `unknown` / `not_assessed`
  states.

Limitations:

- Cursor UI execution is outside the current required acceptance scope.
- External target execution from the install prompt is assessed in later dated
  lanes above.
- OpenCode default-permission external-output behavior is assessed in the
  failed lane above.
