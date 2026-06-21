# Apache Bigtop Stress Example

This page is a named stress example for Portolan, not the primary product
route. The primary route is target-agnostic: install Portolan wrappers into a
local target, build an atlas bundle, and answer from bounded bundle queries.

The example shows Portolan as a local evidence-preparation step before an agent
answers questions about a larger software landscape. It is not a benchmark, a
readiness gate, or proof of complete Apache Bigtop ecosystem coverage.

Apache Bigtop is useful here because it is an Apache 2.0 integration project
for packaging, testing, and configuring open source big-data components. It is
one target-specific example, not the default workflow and not a special
Portolan product mode.

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
`internal/testfixtures/corpus-manifests/apache-bigtop/manifest.json`, and the background notes are in
`docs/test-corpora/apache-bigtop.md`.

Portolan itself does not clone repositories, call upstream services, start a
daemon, or mutate the target. The `git clone` step above is an explicit user
setup step before Portolan reads local files.

## Run The Stress Example

From the Portolan checkout:

```bash
export BIGTOP_ROOT=/tmp/portolan-demo/bigtop-landscape
export BUNDLE_DIR=/tmp/portolan-demo/portolan-output/atlas

scripts/portolan-install.sh "$BIGTOP_ROOT" --harness all --bundle-dir "$BUNDLE_DIR"

"$BIGTOP_ROOT/.portolan/bin/portolan-scan.sh" \
  "$BIGTOP_ROOT" \
  "$BUNDLE_DIR" \
  --yes --skip-install --no-viewer
```

Expected atlas artifacts:

```text
atlas/
  manifest.json
  repos.json
  repo-profiles.json
  atlas-facts.json
  atlas-surfaces.json
  atlas-surface-content.json
  relationships.jsonl
  hotspots.jsonl
  hotspots-full.jsonl
  gaps.jsonl
```

Read `manifest.json`, `repo-profiles.json`, `relationships.jsonl`,
`hotspots*.jsonl`, and `gaps.jsonl` before making broad claims.

## Ask A Bounded Question

Use bounded queries before loading the full graph:

```bash
"$BIGTOP_ROOT/.portolan/bin/portolan-bundle-query.sh" gaps --bundle "$BUNDLE_DIR" --limit 20
"$BIGTOP_ROOT/.portolan/bin/portolan-bundle-query.sh" relationships --bundle "$BUNDLE_DIR" --limit 20
"$BIGTOP_ROOT/.portolan/bin/portolan-bundle-query.sh" hotspots --bundle "$BUNDLE_DIR" --limit 20
```

The important result is not an all-green report. A useful demo should still
show `unknown`, `cannot_verify`, and `not_assessed` records where local evidence
is missing or bounded.

## Local Acceptance Evidence

The maintained product check is `scripts/portolan-product-acceptance.sh`. When
given a prepared Bigtop corpus bundle, it validates the installable wrapper route,
live Cursor/OpenCode runtime lanes, the viewer, bundle queries, schema checks,
and strict Bigtop acceptance:

```bash
scripts/portolan-product-acceptance.sh \
  --require-agent-runtime \
  --bigtop-bundle <bigtop-bundle-dir>
```

Strict Bigtop corpus acceptance can also be run directly:

```bash
scripts/harness-bigtop-acceptance.sh <bigtop-bundle-dir>
```

These checks are local machine observations, not a promise that every machine or
checkout finishes under the same time.

## Case Study Boundary

The validated product claim is narrow: in one named local Bigtop headless
Cursor comparison, the Portolan-assisted lane reduced unsupported claims from
12 to 0 and produced equal or better next actions across the tested questions.

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
`docs/test-corpora/apache-bigtop/examples/`. Current redaction is manual: replace private
root/output prefixes with `<bigtop-root>` and `<demo-output>`, then run the
privacy scan recorded under the spec reviews.
