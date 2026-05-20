# Contract: Black-Box Profile CLI

## Scan Black-Box Selection

```bash
portolan scan --selection testdata/black-box-profile/selection.json --out graph.json [--force]
```

Success:

- exit code: `0`
- stdout: includes `wrote`
- stderr: empty
- side effects: writes only the explicit graph output file
- graph output: valid evidence graph JSON

Failure:

- exit code: non-zero for invalid selection shape or output write failure
- stdout: empty
- stderr: includes `scan:` followed by a deterministic error
- no target repository, runtime service, catalog, or network endpoint is mutated

## Required Behavior

The scan command must:

- read only local files declared by the selection;
- emit no `source-visible` facts for black-box-derived nodes or edges;
- preserve `metadata-visible`, `runtime-visible`, `claim-only`, `unknown`, and
  `cannot_verify` as distinct states;
- continue past malformed optional black-box inputs when other selected inputs
  remain usable;
- record `cannot_verify` with a reason for malformed selected inputs.

## Help

```bash
portolan scan --help
```

Help output must mention:

- `--selection`;
- `--out`;
- local-first and read-only behavior;
- black-box systems represented from local metadata, runtime exports, and
  claims;
- no live telemetry or network access during default scans.
