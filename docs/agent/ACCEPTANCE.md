# Agent Acceptance

Use this page to validate whether a Portolan artifact workflow helps an agent
answer CTO-level questions across different harnesses and target shapes.

The matrix is an acceptance contract, not a product claim. A lane is product
evidence only after its prompt, commands, outputs, answer, unsupported claims,
useful next actions, and degraded surfaces are recorded.

## State Rules

Allowed lane states:

- `verified`: the lane ran, produced Portolan artifacts, answered the question
  set, and its scoring is recorded.
- `failed`: the lane ran but violated the acceptance contract.
- `blocked`: the lane could not run for an external or environmental reason
  and the blocker is recorded.
- `unknown`: the lane ran but the target evidence cannot prove the requested
  scope, such as complete inherited-estate coverage.
- `not_assessed`: the lane was not run, produced empty/off-topic output, or
  lacks enough evidence to score.

Do not convert `blocked`, `unknown`, or `not_assessed` into success. Do not
generalize from one harness or target shape to another.

## Planned Harness Lanes

| Harness lane | What it validates | Non-goal |
| --- | --- | --- |
| Codex control | A shell-capable control lane can run Portolan from documented instructions and answer from artifacts. | Requiring every target shape to be repeated in Codex. |
| Cursor Agent CLI + Composer | Cursor's CLI agent path can use the same blind prompt without hidden local scaffolding. | Proving Cursor UI behavior. |
| OpenCode | A non-Cursor harness can use the portable instructions and preserve gaps. | Making Portolan depend on OpenCode. |

Cursor UI is not a required acceptance lane for the current release envelope.
If it is tested later, record it as additional evidence and do not generalize
from CLI evidence to UI behavior.

Additional lanes such as Claude, Cline, Roo Code, Goose, pi, or OpenHands may
be added, but they do not replace the planned CLI lanes above.

## Target Shapes

| Target shape | Minimum local input | What stays limited |
| --- | --- | --- |
| Single repo | One local repository path. | No claim of multi-repo or external estate completeness. |
| Multi repo | A local ecosystem directory or curated selection. | Repository counts do not prove complete inherited-estate coverage. |
| Black-box/metadata-heavy | Local metadata, runtime observations, manifests, or claim files with partial or absent source. | Runtime topology and source behavior stay `not_assessed` without local evidence. |

## Acceptance Matrix

| Cell ID | Harness | Target shape | State | Reason |
| --- | --- | --- | --- | --- |
| `codex-single-repo-control` | Codex | control / single-repo | `verified` | Ran locally with the blind prompt contract against the Portolan repository as a self-target; scoring is self-scored and independently reviewed only through slice review lanes. This is a control lane, not a requirement to repeat every target shape in Codex; see `specs/041-agent-acceptance-matrix/reviews/codex-single-repo-lane-2026-05-27.md`. |
| `cursor-agent-bigtop` | Cursor Agent CLI + Composer 2.5 | multi-repo | `verified` | Ran the blind Bigtop operator protocol locally against `/home/fall_out_bug/projects/bigtop-landscape`; produced context and map artifacts through the generic workflow and preserved weak evidence states. This is not UI Cursor evidence; see `specs/007-apache-bigtop-corpus/reviews/cursor-composer25-bigtop-lane-2026-05-27.md`. |
| `opencode-single-repo` | OpenCode + `kimi-for-coding/k2p6` | single-repo | `verified` | Ran locally with the blind prompt contract against the Portolan repository as a self-target; required OpenCode permission bypass for the external output path; see `specs/041-agent-acceptance-matrix/reviews/opencode-kimi-single-repo-lane-2026-05-27.md`. |
| `opencode-multi-repo` | OpenCode + `kimi-for-coding/k2p6` | multi-repo | `verified` | Ran locally with the blind prompt contract against `/home/fall_out_bug/projects/bigtop-landscape`; produced context and map artifacts through generic root discovery and preserved weak evidence states; see `specs/041-agent-acceptance-matrix/reviews/opencode-k2p6-multi-repo-bigtop-lane-2026-05-27.md`. |
| `opencode-black-box` | OpenCode + `kimi-for-coding/k2p6` | black-box/metadata-heavy | `verified` | Ran locally with a black-box selection target; produced a map bundle with `metadata-visible`, `runtime-visible`, `claim-only`, `unknown`, and `not_assessed` evidence while refusing runtime-topology claims; see `specs/041-agent-acceptance-matrix/reviews/opencode-k2p6-black-box-lane-2026-05-27.md`. |
| `opencode-install-prompt-self` | OpenCode + `kimi-for-coding/k2p6` | install prompt / single-repo | `verified` | Ran the copyable `docs/agent/INSTALL-PROMPT.md` contract against the Portolan repository as a self-target; OpenCode installed from source, produced context/map artifacts, cited artifact paths, and preserved weak states; required OpenCode permission bypass for the external output path; see `specs/041-agent-acceptance-matrix/reviews/opencode-k2p6-install-prompt-lane-2026-05-27.md`. |
| `opencode-ru-install-prompt-self` | OpenCode + `kimi-for-coding/k2p6` | Russian install prompt / single-repo | `verified` | Ran the copyable `docs/agent/INSTALL-PROMPT.ru.md` contract against the Portolan repository as a self-target; OpenCode installed from source, produced context/map artifacts, answered in Russian with artifact paths, and preserved weak states; required OpenCode permission bypass for the external output path; see `specs/041-agent-acceptance-matrix/reviews/opencode-k2p6-ru-install-prompt-lane-2026-05-27.md`. |
| `opencode-install-prompt-bigtop` | OpenCode + `kimi-for-coding/k2p6` | install prompt / multi-repo | `verified` | Ran the copyable `docs/agent/INSTALL-PROMPT.md` contract against `/home/fall_out_bug/projects/bigtop-landscape`; OpenCode installed from source, used the target-local `selection.json` for map generation, produced context/map artifacts, cited artifact paths, and preserved weak states; required OpenCode permission bypass for the external output path; see `specs/041-agent-acceptance-matrix/reviews/opencode-k2p6-install-prompt-bigtop-lane-2026-05-28.md`. |
| `opencode-install-prompt-external-single-repo` | OpenCode + `kimi-for-coding/k2p6` | install prompt / external single-repo | `verified` | Ran the copyable prompt block from `docs/agent/INSTALL-PROMPT.md` against `/home/fall_out_bug/projects/vibe_coding/spec-kit`; OpenCode used the existing repo-local Portolan binary, produced context/map artifacts, cited artifact paths, and preserved `unknown` / `not_assessed`; required OpenCode permission bypass for the external output path. An earlier whole-file prompt attempt produced artifacts but ended off-contract, so the prompt doc was tightened; see `specs/041-agent-acceptance-matrix/reviews/opencode-k2p6-install-prompt-external-single-repo-lane-2026-05-28.md`. |
| `opencode-ru-install-prompt-external-single-repo` | OpenCode + `kimi-for-coding/k2p6` | Russian install prompt / external single-repo | `verified` | Ran the copyable prompt block from `docs/agent/INSTALL-PROMPT.ru.md` against `/home/fall_out_bug/projects/vibe_coding/spec-kit`; OpenCode built Portolan from source, produced context/map artifacts, answered in Russian with artifact paths, and preserved `unknown` / `not_assessed`; required OpenCode permission bypass for the external output path; see `specs/041-agent-acceptance-matrix/reviews/opencode-k2p6-ru-install-prompt-external-single-repo-lane-2026-05-28.md`. |
| `opencode-default-permission-external-output` | OpenCode + `kimi-for-coding/k2p6` | install prompt / external output permissions | `failed` | Ran the English install prompt block without `--dangerously-skip-permissions`; OpenCode read install docs and built Portolan, then auto-rejected creating the external `/tmp` output directory. This proves default-permission external output behavior is not accepted for this lane; see `specs/041-agent-acceptance-matrix/reviews/opencode-k2p6-default-permission-external-output-lane-2026-05-28.md`. |
| `opencode-default-permission-internal-output` | OpenCode + `kimi-for-coding/k2p6` | install prompt / repo-local output permissions | `verified` | Ran the English install prompt block without `--dangerously-skip-permissions` using `.portolan/acceptance/...` under the Portolan checkout as `OUTPUT_PATH`; OpenCode produced context/map artifacts, cited artifact paths, and preserved weak states. This is the recommended OpenCode default-permission path; see `specs/041-agent-acceptance-matrix/reviews/opencode-k2p6-default-permission-internal-output-lane-2026-05-28.md`. |

Spec-local ledgers may update a cell to `verified`, `failed`, `blocked`, or
`unknown` for a dated run. This page remains the reusable acceptance contract.

## Blind Acceptance Prompt

For a reusable installation-and-run prompt, use
`docs/agent/INSTALL-PROMPT.md` or `docs/agent/INSTALL-PROMPT.ru.md`. The matrix
contract below is the scoring version of the same no-hidden-scaffolding
boundary.

Give the agent only these variables:

```text
PORTOLAN_PATH=<absolute path to the Portolan checkout or installed binary>
TARGET_PATH=<absolute path to the local target>
OUTPUT_PATH=<absolute path to an empty output directory>
```

Then send this prompt:

```text
You are evaluating Portolan as a local evidence-preparation layer for an AI
agent. Use only the provided PORTOLAN_PATH, TARGET_PATH, and OUTPUT_PATH. Do
not use network access, credentials, cloning, or target mutation.

1. Resolve a Portolan command from PORTOLAN_PATH. Prefer an installed binary if
   PORTOLAN_PATH is a binary. If it is a source checkout, use the documented
   source-checkout path from docs/agent/QUICKSTART.md.
2. Prepare agent context for TARGET_PATH into OUTPUT_PATH/context.
3. Create a map for TARGET_PATH into OUTPUT_PATH/map when the command is
   available and the target size is reasonable.
4. Read bounded artifacts before full graph files:
   - context/agent-brief.md
   - context/answer-contract.md
   - context/evidence-index.jsonl
   - context/gaps.jsonl
   - map/summary.json
   - map/graph-index.json
   - map/findings.jsonl
   - map/map.md
5. Answer the question set below. Cite the artifact paths you used. Preserve
   `unknown`, `cannot_verify`, and `not_assessed`.
6. At the end, list unsupported claims you avoided or accidentally made, and
   useful next actions.

Question set:
1. What local scope is visible, and what completeness limits remain?
2. What relationships, duplication, configuration surfaces, or technical-debt
   candidates are visible from Portolan artifacts?
3. What must remain unknown, `cannot_verify`, or `not_assessed`?
4. What are the next three useful local actions a maintainer should take?
```

The prompt must not include target-specific file lists, expected findings, or
private scaffolding. A lane that needs extra hidden instructions is not assessed
by this protocol.

## Scoring

For each lane, record:

- commands attempted;
- artifact paths created or missing;
- whether the answer cited Portolan artifacts;
- unsupported-claim count and examples;
- whether scoring was self-scored by the lane or independently checked;
- useful-next-action count and examples;
- explicit `unknown`, `cannot_verify`, and `not_assessed` surfaces;
- final state and reason.

Unsupported claims and useful next actions are separate scores. A helpful
answer with unsupported claims is still risky; a cautious answer with no next
actions may still be poor UX.

If the same harness both runs the lane and scores the answer, record the lane
as self-scored. Self-scored evidence is valid for the lane ledger, but should
not be broadened into cross-harness product evidence without independent
review.

## Product Claim Gate

Update `docs/product-claims.md` only when the lane evidence supports the
wording. If one lane passes, name that harness and target shape. Cursor UI is
outside the current required acceptance scope; do not claim UI behavior from CLI
evidence.
