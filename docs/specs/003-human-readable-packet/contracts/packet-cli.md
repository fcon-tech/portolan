# Contract: Packet CLI

## Render Packet

```bash
portolan packet render --graph graph.json --out packet.md [--force]
```

Success:

- exit code: `0`
- stdout: includes `wrote`
- stderr: empty
- side effects: writes only the explicit packet file

Failure:

- exit code: non-zero
- stdout: empty
- stderr: includes `packet:` followed by a deterministic error
- no partial packet is written for malformed graph input

## Help

```bash
portolan packet --help
portolan packet render --help
```

Help output must mention:

- `--graph`;
- `--out`;
- Markdown;
- graph-only input;
- no network access.
