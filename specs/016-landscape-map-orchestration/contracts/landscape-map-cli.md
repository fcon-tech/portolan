# Contract: Landscape Map CLI

## Command

```bash
portolan map --selection <selection.json> --out <run-dir> [--force]
```

## Compatibility Shortcut

```bash
portolan map --root <repo-dir> --out <run-dir> [--force]
```

`--root` remains supported for single-repository smoke runs. It is equivalent to
a generated one-repository selection and is not the Bigtop acceptance path.

## Required Behavior

- Accept exactly one of `--selection` or `--root`.
- Reject network URLs and unsafe output paths.
- Refuse to overwrite existing output without `--force`.
- Validate selection shape before writing artifacts.
- Validate Bigtop full-corpus gate before the Bigtop acceptance run writes
  artifacts.
- Write `run.json`, `coverage.json`, `graph.json`, `findings.jsonl`, and
  `map.md`.
- Preserve `unknown`, `cannot_verify`, and `not_assessed` instead of inventing
  source facts.

## Bigtop Blind Prompt

```text
Portolan: <absolute path to the Portolan checkout or installed binary>
Landscape: <absolute path to the prepared Bigtop landscape selection.json>
Output: <absolute path to a new run directory>

map this shit.

Do not fetch upstream repositories.
Do not use network.
Do not mutate selected repositories.
Do not infer facts outside Portolan artifacts.
Record every Portolan capability gap you hit.
```

The prompt must not name Bigtop package files, build commands, product file
lists, or hidden expected findings.
