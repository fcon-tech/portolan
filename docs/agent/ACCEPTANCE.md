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
| Codex | A shell-capable coding agent can run Portolan from documented instructions and answer from artifacts. | Proving UI Cursor/Composer behavior. |
| Cursor UI/Composer | A popular agentic IDE can use the same blind prompt without hidden local scaffolding. | Treating prior headless Cursor evidence as UI evidence. |
| OpenCode | A non-Cursor harness can use the portable instructions and preserve gaps. | Making Portolan depend on OpenCode. |

Additional lanes such as Claude, Cline, Roo Code, Goose, pi, or OpenHands may
be added, but they do not replace the three planned lanes above.

## Target Shapes

| Target shape | Minimum local input | What stays limited |
| --- | --- | --- |
| Single repo | One local repository path. | No claim of multi-repo or external estate completeness. |
| Multi repo | A local ecosystem directory or curated selection. | Repository counts do not prove complete inherited-estate coverage. |
| Black-box/metadata-heavy | Local metadata, runtime observations, manifests, or claim files with partial or absent source. | Runtime topology and source behavior stay `not_assessed` without local evidence. |

## Acceptance Matrix

| Cell ID | Harness | Target shape | State | Reason |
| --- | --- | --- | --- | --- |
| `codex-single-repo` | Codex | single-repo | `not_assessed` | Lane not run in this matrix yet. |
| `codex-multi-repo` | Codex | multi-repo | `not_assessed` | Lane not run in this matrix yet. |
| `codex-black-box` | Codex | black-box/metadata-heavy | `not_assessed` | Lane not run in this matrix yet. |
| `cursor-ui-single-repo` | Cursor UI/Composer | single-repo | `not_assessed` | UI lane not run in this matrix yet. |
| `cursor-ui-multi-repo` | Cursor UI/Composer | multi-repo | `not_assessed` | UI lane not run in this matrix yet. |
| `cursor-ui-black-box` | Cursor UI/Composer | black-box/metadata-heavy | `not_assessed` | UI lane not run in this matrix yet. |
| `opencode-single-repo` | OpenCode | single-repo | `not_assessed` | Lane not run in this matrix yet. |
| `opencode-multi-repo` | OpenCode | multi-repo | `not_assessed` | Lane not run in this matrix yet. |
| `opencode-black-box` | OpenCode | black-box/metadata-heavy | `not_assessed` | Lane not run in this matrix yet. |

Spec-local ledgers may update a cell to `verified`, `failed`, `blocked`, or
`unknown` for a dated run. This page remains the reusable acceptance contract.

## Blind Acceptance Prompt

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
wording. If one lane passes, name that harness and target shape. If UI
Cursor/Composer is not run, keep UI Cursor/Composer `not_assessed`.
