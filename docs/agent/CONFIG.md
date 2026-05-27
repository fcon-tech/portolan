# Agent Config

Portolan's main configuration is the command line: target root, output
directory, and optional input files.

## Context Preparation

```bash
portolan context prepare --root <target-root> --out <context-dir> --profile cursor
```

Use this first when preparing an agent to answer questions.

## Map Run

```bash
portolan map --root <target-root> --out <run-dir>
```

`map --root` discovers the target root, direct child Git repositories, and
`repos/*` Git repositories. It does not prove the local checkout is the complete
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

Do not run producer commands from `oss-plan.json` without user approval.

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
