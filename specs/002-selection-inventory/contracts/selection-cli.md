# Contract: Selection CLI

## Validate Selection

```bash
portolan selection validate --selection selection.json
```

Success:

- exit code: `0`
- stdout: includes `selection valid`
- stderr: empty
- side effects: none

Failure:

- exit code: non-zero
- stdout: empty
- stderr: includes `selection:` followed by a deterministic validation message
- side effects: none

## Help

```bash
portolan selection --help
portolan selection validate --help
```

Help output must mention:

- `--selection`;
- local-first behavior;
- no network access;
- no target content reads during validation.
