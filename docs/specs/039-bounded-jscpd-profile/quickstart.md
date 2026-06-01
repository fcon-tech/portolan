# Quickstart: Bounded jscpd Profile

## Preconditions

```bash
command -v jscpd || true
go test -count=1 ./...
jq empty schema/*.json
```

## Validation Flow

1. Choose a local target or representative fixture.
2. Run the bounded `jscpd` profile into an explicitly selected output
   directory.
3. Record the producer attempt as `verified`, `failed`, `blocked`, or
   `not_assessed`.
4. If verified output exists, rerun the relevant Portolan context/import path so
   the output is visible to agents.
5. Update `docs/product-claims.md` only to the exact scope supported by the
   bounded evidence.
6. Run:

```bash
go test -count=1 ./...
jq empty schema/*.json
git diff --check
```

## Expected Result

Near-clone duplication is either verified for a named bounded target/profile or
kept as failed, blocked, or not_assessed. It is never upgraded from partial or
interrupted output.
