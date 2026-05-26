# Data Model: Landscape Map Orchestration

## Landscape Selection

Extends the existing `selection.schema.json` intent from one or more local
targets into the primary map input.

Required existing fields:

- `schema_version`
- `targets[]`
- `metadata[]`
- `runtime[]`
- `claims[]`
- `black_boxes[]`

New or extended concepts required by this slice:

- imported tool outputs selected as local metadata inputs or a dedicated
  `tool_outputs[]` collection if schema compatibility requires an explicit
  category;
- optional corpus binding that says which corpus manifest defines full coverage;
- per-input role labels used in `coverage.json` and `map.md`.

## Coverage Ledger

`coverage.json` is generated for every `map --selection` run.

Required top-level fields:

- `schema_version`
- `generated_by`
- `scope`
- `records[]`
- `summary`

`scope` includes:

- `selection_path`, omitted for the `map --root` shortcut
- `corpus_manifest`, omitted when no corpus manifest is bound
- `require_full_corpus`

Each `records[]` entry includes:

- `id`
- `kind`: repository, metadata, runtime, claim, black-box, tool-output, corpus
  manifest, or manifest inventory kind
- `status`: visible, represented, missing, cannot_verify, unknown,
  not_assessed, or blocked
- `evidence_state`
- `source`
- `reason`

`summary` is a deterministic count map keyed by `total`, `status:<status>`, and
`evidence_state:<state>`.

For Bigtop acceptance, any active or external product repository target that is
not represented as a local `source-visible` repository makes coverage
`blocked`. Metadata-only, retired, runtime, Docker, binary repository, and
internal support entries must still be represented, but they cannot waive a
missing product source repository.

## Imported Tool Output

An imported tool-output record represents a local output file from a mature OSS
scanner or inventory tool.

Required fields after normalization:

- `id`
- `tool_name`
- `tool_version`, nullable
- `input_path`
- `format`
- `subject_selection_id`
- `evidence_state`
- `limitations[]`
- generated graph node ids, edge ids, or finding ids

Minimum supported evidence families:

- SBOM/dependency;
- code-size/language inventory;
- duplication;
- configuration or contract surfaces.

## Landscape Artifact Bundle

Every successful startup produces or blocks before writing:

```text
run.json
coverage.json
graph.json
findings.jsonl
map.md
```

`map.md` is a derived view. It cannot introduce facts absent from machine
artifacts.
