# Contract: Preflight Bundle

The preflight command writes a bounded artifact bundle to the selected output
directory.

## Command Shape

```bash
portolan preflight --root <target-root> --artifacts <existing-artifact-dir> --out <output-dir>
```

`--artifacts` may point to an existing context or map bundle. The command must
not require network access, tool installation, target mutation, global config
writes, MCP registration, daemon startup, or watcher startup.

## Artifact Discovery

`--artifacts` points to one directory. The command checks that directory only
for known Portolan artifact filenames:

- `agent-brief.md`
- `answer-contract.md`
- `query-plan.md`
- `evidence-index.jsonl`
- `repos.json`
- `tool-registry.json`
- `oss-plan.json`
- `gaps.jsonl`
- `summary.json`
- `graph-index.json`
- `findings.jsonl`
- `map.md`

The command does not recurse and does not load full `graph.json` by default.
Missing files become `missing` artifact links and preflight gaps. Malformed
JSON/JSONL becomes an explicit gap and command warning unless it prevents
writing the required bundle.

## Path And Write Boundary

The command resolves `--root`, `--artifacts`, and `--out` to absolute paths
before use. Generated writes must stay inside `--out`. Symlink or traversal
escapes from the selected output directory are rejected. Unreadable input
directories and unwritable output directories fail with explicit errors.

## Required Outputs

```text
<output-dir>/
├── preflight.md
├── toolchain.json
├── agent-handoff.md
└── preflight-gaps.jsonl
```

## Behavioral Contract

- `preflight.md` summarizes target shape, visible artifacts, top gaps, and next
  probes.
- `toolchain.json` records installed, missing, supplied-output,
  approval-required, parked, and rejected tool recommendations.
- `agent-handoff.md` tells coding agents where to start and which claims remain
  bounded.
- `preflight-gaps.jsonl` records missing or blocked evidence families.
- Existing `summary.json`, `graph-index.json`, `findings.jsonl`, `map.md`,
  `tool-registry.json`, `oss-plan.json`, and `gaps.jsonl` are linked as source
  artifacts when present.
- Target-derived names, paths, and labels are escaped or bounded before
  Markdown rendering.
- Raw source snippets, prompt text, credentials, and secret-like payloads are not
  copied into the preflight bundle.

## Non-Contract

- No complete architecture guarantee.
- No runtime topology guarantee.
- No full symbol/reference/call-graph guarantee.
- No default external command execution.
- No merge/release/readiness decision.
