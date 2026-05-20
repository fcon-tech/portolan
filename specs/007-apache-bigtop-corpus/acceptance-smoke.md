# Acceptance Smoke: Bigtop After Skills

Run this only after `specs/008-agent-skill-pack/` is implemented.

## Purpose

Use Apache Bigtop immediately after the skill pack to discover real product
gaps. Do not wait for `portolan map`, relationship detectors, duplication
detectors, configuration scanners, or debt rules to be implemented first.

## Inputs

- portable Portolan agent guide;
- Cursor rule wrapper;
- current Portolan CLI;
- `corpora/apache-bigtop/manifest.json`;
- prepared local fixture files only:
  `testdata/apache-bigtop-smoke/selection.json`.

## Local Fallback Smoke

Run this when the external Cursor + Composer 2.5 operator lane is unavailable.
This does not replace the operator smoke; it only proves the current Portolan
artifact path and records gaps without network access.

```bash
tmpdir="$(mktemp -d)"
go run ./cmd/portolan scan \
  --selection testdata/apache-bigtop-smoke/selection.json \
  --out "$tmpdir/graph.json" \
  --force
go run ./cmd/portolan packet render \
  --graph "$tmpdir/graph.json" \
  --out "$tmpdir/map.md" \
  --force
go run ./cmd/portolan map --root testdata/apache-bigtop-smoke/repo --out "$tmpdir/run"
jq empty "$tmpdir/graph.json"
```

Expected result today:

- `scan` succeeds against local fixture inputs.
- `packet render` succeeds from the generated graph.
- `map` writes the target artifact bundle after spec 009.
- `findings.jsonl` records detector surfaces that remain `not_assessed`.
- missing Oozie local inputs remain `unknown` or `cannot_verify`.
- Cursor + Composer usability remains `not_assessed` until the external
  operator lane is run.

## Cursor Prompt

```text
Read the Portolan agent guide in this repository.
Use it on the Apache Bigtop corpus fixture.
map this shit.

Do not fetch upstream repositories.
Do not use network.
Do not infer facts outside Portolan artifacts.
Record every Portolan capability gap you hit.
```

## Required Gap Ledger

Record the smoke result under `specs/007-apache-bigtop-corpus/reviews/`.

The ledger must include:

- agent workflow failures;
- missing one-command map support;
- missing relationship detection;
- missing duplication detection;
- missing configuration surface detection;
- missing technical-debt findings;
- packet usefulness gaps;
- unsupported agent inferences;
- unknown and cannot-verify evidence that was correctly preserved.

## Stop Rule

After the smoke, update `docs/product-backlog.md` only with gaps proven by the
run. Do not start broad detector implementation from assumptions.
