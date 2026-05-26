# Implementation Plan: OSS Tool Output Assembly

## Decision Gate

- Simpler/Faster: parse local JSON outputs already discovered by filename;
  do not invoke jscpd, Syft, Semgrep, or any daemon.
- Blocking Edge Cases: malformed files, unsupported schemas, private snippets,
  large outputs, and ambiguous filenames.
- Existing Open Source: jscpd and CycloneDX/Syft remain external producers.
  Portolan only normalizes their local exported files in this slice.

## Technical Approach

- Extend `internal/contextprep.ToolEntry` with `kind`, `status`, `summary`,
  `confidence`, and integer `metrics`.
- For jscpd-style JSON, count `duplicates`.
- For CycloneDX/Syft-as-CycloneDX JSON, require `bomFormat: CycloneDX` and
  count `components` and `dependencies`.
- For malformed candidate JSON, keep the entry with `cannot_verify`.
- Keep YAML/catalog/contract candidates as metadata-visible candidates without
  deep parsing in this slice.

## Verification

Run:

```bash
go test ./...
jq empty schema/*.json
git diff --check
go run ./cmd/portolan context prepare --root testdata/landscape-map --out /tmp/portolan-context --profile cursor --force
```

