# Demo Privacy And Freshness Review - 2026-05-30

## Artifact Set

Reviewed:

- `docs/demo.md`
- `docs/test-corpora/apache-bigtop/examples/README.md`
- `docs/test-corpora/apache-bigtop/examples/README.md`
- `docs/test-corpora/apache-bigtop/examples/summary-excerpt.json`
- `docs/test-corpora/apache-bigtop/examples/map-excerpt.md`
- `docs/test-corpora/apache-bigtop/examples/evidence-index-excerpt.jsonl`
- `docs/test-corpora/apache-bigtop/examples/answer-contract-excerpt.md`
- `docs/test-corpora/apache-bigtop/examples/gaps-query-excerpt.json`

Generation command:

```bash
go run ./cmd/portolan context prepare --root <bigtop-root> --out <demo-output>/context --profile cursor
go run ./cmd/portolan map --root <bigtop-root> --out <demo-output>/map
go run ./cmd/portolan query gaps --bundle <demo-output>/map --limit 5
```

Freshness state: historical sample generated on 2026-05-30 from a local Bigtop
landscape and manually redacted.

## Checks

Commands:

```bash
rg -n "/home/|/Users/|/tmp/portolan|token|secret|password|credential|private|customer|client|https?://" docs/demo.md docs/test-corpora/apache-bigtop/examples docs/specs/049-public-demo-showcase/reviews -S
jq empty docs/test-corpora/apache-bigtop/examples/*.json
rg -n "unknown|cannot_verify|not_assessed|failed|blocked" docs/demo.md docs/test-corpora/apache-bigtop/examples -S
```

| Check | State | Evidence |
| --- | --- | --- |
| No private absolute paths in public excerpts | verified | No `/home/` or `/Users/` matches remain in `docs/test-corpora/apache-bigtop/examples/` or `docs/demo.md`. Public `/tmp/portolan-demo` paths are intentional copyable examples. |
| No credentials or secret-looking values | verified | Matches are policy text or "secret reference by name only"; no secret values are committed. |
| No private customer or organization names | verified | Matches are policy text only. |
| No unsupported external service URLs | verified | Only public Apache Bigtop GitHub URL appears in demo setup. |
| Weak evidence states remain visible | verified | `unknown`, `cannot_verify`, and `not_assessed` are present in docs and excerpts. |
| JSON excerpts parse | verified | `jq empty docs/test-corpora/apache-bigtop/examples/*.json` passed. |
| Generated timestamp or staleness note present | verified | `docs/test-corpora/apache-bigtop/examples/README.md` and `summary-excerpt.json` include generation/freshness notes. |

## Publication Decision

Decision: public-safe for the current runbook and redacted excerpt scope.

Blockers: none for the current excerpt set.

Not assessed:

- Full Bigtop output publication.
- Screenshots or terminal recordings.
- Automated redaction tooling.
