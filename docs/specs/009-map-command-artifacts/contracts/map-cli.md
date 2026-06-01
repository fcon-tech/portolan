# Contract: Map CLI

## Run Map

```bash
portolan map --root . --out .portolan/run [--force]
```

Success:

- exit code: `0`
- stdout: includes `wrote`
- stderr: empty
- side effects: writes only the explicit output directory

Failure:

- exit code: non-zero
- stdout: empty
- stderr: includes `map:` followed by a deterministic error
- no partial artifact bundle is written after startup validation failure

## Required Artifacts

```text
run.json
graph.json
findings.jsonl
map.md
```

## Help

```bash
portolan map --help
```

Help output must mention:

- `--root`;
- `--out`;
- `--force`;
- local-first read-only behavior;
- graph, findings, run metadata, and packet artifacts.
