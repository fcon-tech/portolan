# Go CLI Freeze Policy

Effective: 2026-06-10 (spec 087 harness-first pivot)

## Policy

The existing Go CLI (`cmd/portolan`, `internal/*`) is **frozen for new product
features** until the Go decision gate in
[`docs/adr/001-go-cli-fate.md`](../adr/001-go-cli-fate.md) is resolved.

## Allowed changes

- Bug fixes with regression tests.
- Security fixes for path handling and untrusted artifact imports.
- Documentation corrections.
- Bridge commands/scripts that export legacy map output to `orient/` bundles.
- Dependency patches required for `go test ./...` on supported Go versions.

## Not allowed without a new spec and Go gate outcome

- New commands or flags in `internal/app`.
- Growth of `internal/contextprep` markdown generators (`answer-contract`, etc.).
- New native scanners or language-specific detectors in Go.
- New importer formats unless the gate keeps Go as the normalization layer.

## Primary product path

Use [`harness/SKILL.md`](../../harness/SKILL.md):

1. Run OSS recipes from `harness/recipes/`.
2. Build `orient/` with `scripts/build-orient-bundle.sh`.
3. Open the local viewer from `viewer/`.

Optional legacy bridge:

```bash
go run ./cmd/portolan map --root <target> --out <map-dir>
scripts/orient-export-from-map.sh <map-dir> <orient-dir>
```

## Review

Revisit when Phase 5 smoke completes and ADR 001 is accepted.
