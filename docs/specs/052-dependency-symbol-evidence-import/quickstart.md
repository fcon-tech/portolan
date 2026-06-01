# Quickstart: Dependency And Symbol Evidence Import

## Fixture Smoke

```bash
go test -count=1 ./internal/selection ./internal/maprun ./internal/contextprep ./internal/app
jq empty schema/*.json internal/testfixtures/oss-adapter-contract/*.json
git diff --check
```

## Clean Local Map Run

Use a fresh output directory for every stress pass:

```bash
RUN_ID=$(date -u +%Y%m%d-%H%M%S)
OUT=/tmp/portolan-052-$RUN_ID
rm -rf "$OUT"
go run ./cmd/portolan selection validate --selection <selection-with-local-producer-outputs.json>
go run ./cmd/portolan map --selection <selection-with-local-producer-outputs.json> --out "$OUT/map" --force
go run ./cmd/portolan query findings --bundle "$OUT/map" --kind relationships --limit 20
go run ./cmd/portolan query gaps --bundle "$OUT/map" --limit 20
```

If an existing target-root `selection.json` points at a missing
`corpus_manifest`, treat that as a blocked stale selection and regenerate or
repair the selection. Do not disable the full-corpus gate to make the stress
run pass.

Expected result:

- dependency or symbol producer outputs become relationship evidence only for
  their declared scope;
- context `evidence-index.jsonl` may include source-visible
  `relationship-candidate` records for build/deploy files, but these remain
  navigation hints and not parsed topology;
- absent producer families remain `not_assessed`;
- malformed producer outputs become `cannot_verify`;
- output remains local and bounded.

## Clean Cursor + Composer 2.5 Stress Protocol

Before a Cursor + Composer comparison lane:

```bash
rm -rf <target-root>/.portolan/stress/<run-id>
rm -rf <target-root>/run
test ! -e <target-root>/run
```

For no-Portolan baseline prompts, explicitly forbid:

- `.portolan/`
- root-level `run/`
- previously generated `map.md`, `graph.json`, `coverage.json`, and
  `findings.jsonl`

If the agent reads any forbidden artifact, or if these artifacts cannot be
removed before the run, mark the lane contaminated and rerun from a fresh output
path.

When generating Syft/CycloneDX producer output from the target root, exclude
Portolan and root run artifacts so the SBOM does not include prior stress
outputs:

```bash
syft <target-root> \
  --exclude './.portolan/**' \
  --exclude './run/**' \
  -o cyclonedx-json=<context-dir>/tool-outputs/syft.cyclonedx.json
```

After a native producer writes any file under `<context-dir>/tool-outputs/`,
rerun context preparation into the same context directory before handing the
bundle to Cursor or another agent:

```bash
go run ./cmd/portolan context prepare \
  --root <target-root> \
  --out <context-dir> \
  --profile agent \
  --force

jq '.tools[] | select(.family=="cyclonedx")' \
  <context-dir>/tool-registry.json
```

Without this refresh, `tool-registry.json`, `evidence-index.jsonl`, and
`gaps.jsonl` may still describe the pre-producer state even though the selected
map run can ingest the fresh `tool_outputs` file.
