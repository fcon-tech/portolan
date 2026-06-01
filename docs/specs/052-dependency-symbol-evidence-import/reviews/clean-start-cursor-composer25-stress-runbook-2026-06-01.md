# Clean-Start Cursor + Composer 2.5 Stress Runbook

Date: 2026-06-01

Status: prepared; Cursor lane not run in this artifact

## Clean Start

Use a new run ID and remove stale comparison artifacts before each lane:

```bash
RUN_ID=$(date -u +%Y%m%d-%H%M%S)
rm -rf <target-root>/.portolan/stress/$RUN_ID
rm -rf <target-root>/run
test ! -e <target-root>/run
```

For the no-Portolan baseline, the prompt must forbid reading:

- `<target-root>/.portolan/`
- `<target-root>/run`
- previous `map.md`
- previous `graph.json`
- previous `coverage.json`
- previous `findings.jsonl`
- Portolan review ledgers

If a baseline lane reads any forbidden artifact, record it as contaminated and
do not count it as clean comparison evidence.

## Producer Output Refresh Guard

When the Portolan-enabled lane follows `oss-plan.json` and runs a native
producer such as Syft into `<context-dir>/tool-outputs/`, rerun
`portolan context prepare` into the same context directory before giving the
bundle to Cursor + Composer 2.5.

The refreshed context must show the producer output in `tool-registry.json`.
If the producer file exists but `tool-registry.json` still lacks the matching
family, the lane is using stale context metadata and must be refreshed before
it counts as clean Portolan-enabled evidence.

## Portolan-Enabled Prompt Shape

Ask Cursor + Composer 2.5 to answer the same landscape question after first
running or reading the generic Portolan context path:

```text
You are working on a local inherited software landscape at <target-root>.
Before making architecture or dependency claims, use Portolan's local-first
context workflow. Start from the generated context pack if present, otherwise
run the documented local command into a fresh output path under
<target-root>/.portolan/stress/<run-id>/.

Preserve unknown, cannot_verify, and not_assessed. For dependency, symbol, or
service relationship claims, cite local artifacts and distinguish:
- source-visible evidence
- metadata-visible dependency/SBOM evidence
- metadata-visible symbol-index evidence
- runtime-visible evidence
- claim-only evidence
- not_assessed gaps

Do not claim that Portolan has native PHP, JVM, Scala, or other language
semantics. Dependency and symbol records are local producer evidence only.
```

## Expected 052 Checks

The lane should mention:

- dependency/SBOM producer outputs when present in `tool-registry.json`,
  `evidence-index.jsonl`, or selected map `tool_outputs`;
- symbol-index producer outputs when present;
- `gap-symbol-index-not-assessed` when no local symbol producer output is
  detected in context preparation;
- `finding-relationships-symbol-evidence-not-assessed` when no selected
  symbol-index output is supplied to map;
- no runtime topology claim from dependency or symbol metadata alone.
