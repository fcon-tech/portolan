# Quickstart: Relationship Evidence Taxonomy

1. Run the generated context pack smoke test:

```bash
go test -count=1 ./internal/app -run TestRunContextPrepareWritesCursorPack
```

2. Run baseline verification:

```bash
go test ./...
jq empty schema/*.json
git diff --check
```

3. For a manual generated-output check:

```bash
tmp="$(mktemp -d)"
repo="$tmp/repo"
out="$tmp/context"
mkdir -p "$repo/.git"
go run ./cmd/portolan context prepare --root "$repo" --out "$out"
sed -n '/Relationship Evidence Taxonomy/,+40p' "$out/answer-contract.md"
```

Expected result: the generated answer contract separates dependency, declared
service/API, runtime communication, ownership, and lifecycle relationships, and
states that runtime topology remains `not_assessed` without runtime-visible
local observations.
