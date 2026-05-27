# Agent Install Prompt

Use this prompt when you want an AI agent to install and run Portolan without
hidden scaffolding.

Copy the prompt block below to the receiving agent. If an agent receives this
whole file instead of only the block, it should execute the prompt block after
the three variables are filled in, not ask what to do next.

Replace the three variables with absolute local paths:

```text
PORTOLAN_PATH=<absolute path to a Portolan checkout or installed portolan binary>
TARGET_PATH=<absolute path to the local codebase or landscape to inspect>
OUTPUT_PATH=<absolute path to an empty output directory>
```

Then send:

```text
Install and use Portolan for a local read-only codebase navigation pass.
Execute these steps now and report the result. Do not ask whether to execute
unless a required local path is missing.

Inputs:
- PORTOLAN_PATH=<absolute path to a Portolan checkout or installed portolan binary>
- TARGET_PATH=<absolute path to the local target>
- OUTPUT_PATH=<absolute path to an empty output directory>

Rules:
- Use only these local paths.
- Do not use network access, credentials, cloning, daemons, or target mutation
  unless I explicitly approve it.
- If your harness rejects writes to OUTPUT_PATH, fall back once to a repo-local
  `.portolan/runs/<target-name>` directory under the Portolan checkout and
  record the original OUTPUT_PATH write as `failed`. Use that fallback
  directory as OUTPUT_PATH for the remaining steps.
- If PORTOLAN_PATH is a binary, verify it with `--version`.
- If PORTOLAN_PATH is a source checkout, follow `docs/agent/INSTALL.md` and
  build the repo-local binary with `scripts/bootstrap-portolan`.
- Prepare context into `OUTPUT_PATH/context`.
- Build a map into `OUTPUT_PATH/map` when the target size is reasonable.
- If `TARGET_PATH/selection.json` exists, validate it and prefer
  `map --selection TARGET_PATH/selection.json --out OUTPUT_PATH/map` for the
  map step. Otherwise use `map --root TARGET_PATH --out OUTPUT_PATH/map`.
- If selection validation fails, record that command as `failed`, then fall
  back to `map --root TARGET_PATH --out OUTPUT_PATH/map`.
- Read bounded artifacts before opening large graph files:
  - `context/agent-brief.md`
  - `context/answer-contract.md`
  - `context/evidence-index.jsonl`
  - `context/gaps.jsonl`
  - `map/summary.json`
  - `map/graph-index.json`
  - `map/findings.jsonl`
  - `map/map.md`
- Preserve `verified`, `failed`, `blocked`, `not_assessed`, `unknown`, and
  `cannot_verify`.
- Cite local artifact paths for every material claim.
- Do not claim complete estate coverage, runtime topology, OSS scanner value,
  or architecture facts unless the local Portolan artifacts prove them.

Answer with:
1. Commands run and whether each was `verified`, `failed`, or `blocked`.
2. Artifact paths created.
3. Visible local scope and completeness limits.
4. Evidence-backed relationships, duplication, configuration surfaces, and
   technical-debt candidates.
5. Explicit `unknown`, `cannot_verify`, and `not_assessed` surfaces.
6. Three useful next local actions.
7. Any unsupported claims you avoided or accidentally made.
```

For Russian-language agent runs, use
[`docs/agent/INSTALL-PROMPT.ru.md`](INSTALL-PROMPT.ru.md).
