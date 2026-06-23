# Agent Config

Portolan's main configuration is the command line: target root, output
directory, and optional input files.

## Atlas Bundle First Run

```bash
<target-root>/.portolan/bin/portolan-scan.sh --doctor <target-root> <bundle-dir> --skip-install --no-viewer
<target-root>/.portolan/bin/portolan-scan.sh --dry-run <target-root> <bundle-dir> --skip-install --no-viewer
<target-root>/.portolan/bin/portolan-scan.sh <target-root> <bundle-dir> --yes --skip-install --no-viewer
<target-root>/.portolan/bin/portolan-scan.sh --status <target-root> <bundle-dir>
<target-root>/.portolan/bin/portolan-viewer.sh
```

Use this sequence after install when preparing Cursor, OpenCode, or another
coding-agent harness to answer broad codebase questions. Remove
`--skip-install` only after explicit approval to install missing local OSS
tools.

The default installed bundle path is `<target-root>/.portolan/atlas`.

Scan shorthand is acceptable only after doctor and dry-run have succeeded or
their blockers are recorded.

Run `--status` after scan. Do not replace it with `ls`; status reports bundle
compatibility, receipt state, reusability, and local-first flags as JSON.

## Query Bundle

```bash
<target-root>/.portolan/bin/portolan-bundle-query.sh repos --bundle <bundle-dir> --limit 20
<target-root>/.portolan/bin/portolan-bundle-query.sh relationships --bundle <bundle-dir> --limit 20
<target-root>/.portolan/bin/portolan-bundle-query.sh hotspots --bundle <bundle-dir> --limit 20
<target-root>/.portolan/bin/portolan-bundle-query.sh gaps --bundle <bundle-dir> --limit 20
<target-root>/.portolan/bin/portolan-bundle-query.sh search --bundle <bundle-dir> --q "<term>" --limit 20
<target-root>/.portolan/bin/portolan-bundle-query.sh source --bundle <bundle-dir> --repo <repo-id> --path <path> --line 1
```

Use bounded queries before loading large bundle files.

## Legacy Compatibility Preparation

Use only when the operator explicitly asks for the legacy compatibility route:

```bash
portolan context prepare --root <target-root> --out <context-dir> --profile agent
```

## Legacy Compatibility Map Run

```bash
portolan map --root <target-root> --out <run-dir>
```

`map --root` discovers the target root, direct child Git repositories, and
`repos/*` Git repositories. It does not prove the local target is the complete
external ecosystem.

## Curated Selection

Use a selection only when the user provides one:

```bash
portolan selection validate --selection <selection.json>
portolan map --selection <selection.json> --out <run-dir>
```

Do not invent a selection file.

## Existing OSS Outputs

Portolan can summarize local tool outputs when they already exist. Check:

- `tool-registry.json`
- `oss-plan.json`
- `evidence-index.jsonl`

Do not run native OSS CLI, skill, or MCP recipes from `oss-plan.json` without
user approval.

## Output Replacement

Use `--force` only when the selected output directory already exists and the
user accepts replacing that Portolan run output.

## Evidence States

Preserve these states in any answer:

- `source-visible`
- `metadata-visible`
- `runtime-visible`
- `claim-only`
- `unknown`
- `cannot_verify`
- `not_assessed`
