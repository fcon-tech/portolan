# Contract: Release Envelope

## CI Contract

The default CI workflow must run:

```bash
go test -count=1 ./...
jq empty schema/*.json testdata/oss-adapter-contract/*.json
git diff --check
go run ./cmd/portolan --help
```

If a command fails, the workflow fails. If GitHub checks are absent from a PR closeout, closeout text must say `not_assessed`.

## Install Contract

The documented clean-checkout smoke is:

```bash
scripts/bootstrap-portolan
.portolan/bin/portolan --version
.portolan/bin/portolan context prepare --root . --out /tmp/portolan-context-smoke --profile cursor --force
.portolan/bin/portolan map --root . --out /tmp/portolan-map-smoke --force
```

## Release Checklist Contract

Release docs must require:

- version or tag;
- local baseline commands;
- GitHub check state;
- artifact checksum when artifacts are published;
- review of `docs/product-claims.md`;
- explicit limitations for `not_assessed` surfaces.
