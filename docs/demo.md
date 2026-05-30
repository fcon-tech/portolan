# Public Demo: Apache Bigtop

This demo shows Portolan as a local evidence-preparation step before an agent
answers questions about a large software landscape. It is not a benchmark, a
readiness gate, or proof of complete Apache Bigtop ecosystem coverage.

The public target is Apache Bigtop because it is an Apache 2.0 integration
project for packaging, testing, and configuring open source big-data
components. A Portolan self-map was rejected as the primary public demo because
it would overfit to this repository's own structure.

## Prepare The Target

Use a local directory outside the Portolan checkout. The examples below use
`/tmp/portolan-demo/bigtop-landscape`; choose a path that is safe to create and
delete on your machine.

```bash
mkdir -p /tmp/portolan-demo/bigtop-landscape/repos
cd /tmp/portolan-demo/bigtop-landscape/repos
git clone https://github.com/apache/bigtop.git apache-bigtop-repo
```

For a broader local stress run, add component repositories under the same
`repos/` directory. The maintained corpus reference is
`corpora/apache-bigtop/manifest.json`, and the background notes are in
`docs/test-corpora/apache-bigtop.md`.

Portolan itself does not clone repositories, call upstream services, start a
daemon, or mutate the target. The `git clone` step above is an explicit user
setup step before Portolan reads local files.

## Run The Demo

From the Portolan checkout:

```bash
scripts/bootstrap-portolan
.portolan/bin/portolan --version

export BIGTOP_ROOT=/tmp/portolan-demo/bigtop-landscape
export DEMO_OUT=/tmp/portolan-demo/portolan-output

.portolan/bin/portolan context prepare \
  --root "$BIGTOP_ROOT" \
  --out "$DEMO_OUT/context" \
  --profile cursor

.portolan/bin/portolan map \
  --root "$BIGTOP_ROOT" \
  --out "$DEMO_OUT/map"
```

Expected context artifacts:

```text
context/
  agent-brief.md
  answer-contract.md
  evidence-index.jsonl
  gaps.jsonl
  oss-plan.json
  query-plan.md
  repos.json
  tool-registry.json
```

Expected map artifacts:

```text
map/
  coverage.json
  findings.jsonl
  graph-index.json
  graph.json
  map.md
  run.json
  summary.json
```

Read `context/answer-contract.md` first when an agent will answer broad
questions. Read `map/summary.json`, `map/graph-index.json`, and `map.md` before
opening full `graph.json`.

## Ask A Bounded Question

Use bounded queries before loading the full graph:

```bash
.portolan/bin/portolan query gaps --bundle "$DEMO_OUT/map" --limit 20
.portolan/bin/portolan query findings --bundle "$DEMO_OUT/map" --kind relationships --limit 20
```

The important result is not an all-green report. A useful demo should still
show `unknown`, `cannot_verify`, and `not_assessed` records where local evidence
is missing or bounded.

## Local Smoke Evidence

This branch ran two local smokes on 2026-05-30. The first follows the documented
primary setup by cloning only `apache/bigtop` into `/tmp`. The second reuses a
larger existing local Bigtop landscape to show the multi-repo excerpt shape.
The committed excerpts redact private machine paths manually.

Observed cold-start primary setup:

- `git clone --depth 1 https://github.com/apache/bigtop.git apache-bigtop-repo`: passed in 0:04.01.
- `portolan context prepare --root <bigtop-root> --out <out>/context --profile cursor`: passed in 0.07s.
- `portolan map --root <bigtop-root> --out <out>/map`: passed in 0.40s.
- `portolan query gaps --bundle <out>/map --limit 5`: passed.

Observed larger existing-landscape smoke:

- `portolan context prepare --root <bigtop-root> --out <out>/context --profile cursor`: passed in 0.08s.
- `portolan map --root <bigtop-root> --out <out>/map`: passed in 2:25.74.
- Map output: 18 source-visible repositories, 172243 graph nodes, 148714 graph
  edges, 555 findings, and 21 coverage records.
- Finding states included 430 observed, 118 `not_assessed`, 6
  `cannot_verify`, and 1 `unknown`.

These timings are local machine observations and may benefit from local network,
disk, and filesystem-cache conditions. They are not a promise that every
machine or checkout will finish under the same time.

## Case Study Boundary

The validated product claim is narrow: in a fixed local Bigtop headless Cursor
comparison, the Portolan-assisted lane reduced unsupported claims from 12 to 0
and produced equal or better next actions across the tested questions.

That does not validate UI Cursor/Composer generally, arbitrary external
targets, complete inherited-estate coverage, complete runtime topology, or broad
OSS producer value. Use `docs/product-claims.md` as the maintained source of
truth before reusing this case study in public copy.

## Sharing Artifacts

Full local outputs can include absolute local paths. Do not commit, publish, or
send generated Bigtop outputs until a privacy/freshness review checks:

- private absolute paths;
- credentials or secret-looking values;
- customer or private organization names;
- unsupported external service URLs;
- stale timestamps presented as current verification.

This repository commits only small redacted excerpts under
`examples/public-demo/bigtop/`. Current redaction is manual: replace private
root/output prefixes with `<bigtop-root>` and `<demo-output>`, then run the
privacy scan recorded under the spec reviews.
