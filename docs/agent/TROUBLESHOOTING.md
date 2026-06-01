# Agent Troubleshooting

## `portolan` Command Not Found

If you have a Portolan source checkout, build the local binary:

```bash
scripts/bootstrap-portolan
.portolan/bin/portolan --version
```

Otherwise report that no Portolan binary is available.

## Bootstrap Cannot Download Dependencies

Default bootstrap avoids network access. If dependency download is required,
ask the user before using:

```bash
PORTOLAN_BOOTSTRAP_ALLOW_NETWORK=1 scripts/bootstrap-portolan
```

## Output Directory Already Exists

Do not overwrite silently. Either choose a fresh output directory or use
`--force` only after the user accepts replacing that Portolan output.

## The Map Is Too Large

Read bounded artifacts first:

- `summary.json`
- `graph-index.json`
- `findings.jsonl`
- `map.md`

Use `portolan graph slice` before loading full `graph.json`.

## The Target Has Missing Repositories

Do not clone or fetch by default. Mark missing source as `unknown`,
`cannot_verify`, or `not_assessed`. Ask for a local selection or manifest if
complete scope matters.

## No Runtime Topology Appears

Runtime topology requires local runtime observations. Without those inputs,
report runtime topology as `not_assessed`.

## No Near-Clone Duplication Appears

Duplication findings require selected local duplication tool output, such as
jscpd/CPD-style JSON. If that evidence is absent, report duplication coverage
as `not_assessed`.

## No Semgrep Or Semantic Config Findings Appear

Portolan does not run network-backed Semgrep configs by default. Use local
Semgrep output only when it exists or the user approves producing it.

## The Agent Wants To Guess

Stop and return to the artifacts. If a claim is not backed by Portolan output
or another local source, label it `claim-only`, `unknown`, `cannot_verify`, or
`not_assessed`.
