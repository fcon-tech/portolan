# Apache Bigtop Demo Excerpts

These are archival excerpts from the legacy `context prepare` / `portolan map`
demo route. They are kept as historical evidence only. Current product demos
must use the installable atlas route in `docs/demo-runbook.md` and strict
Bigtop corpus acceptance via `scripts/harness-bigtop-acceptance.sh`.

Freshness: generated from a local Apache Bigtop landscape on 2026-05-30 using
`portolan dev` from commit `195d80d` on branch
`codex/049-public-demo-showcase`.

Generation commands:

```bash
go run ./cmd/portolan context prepare --root <bigtop-root> --out <demo-output>/context --profile cursor
go run ./cmd/portolan map --root <bigtop-root> --out <demo-output>/map
go run ./cmd/portolan query gaps --bundle <demo-output>/map --limit 5
```

Observed local smoke:

- context pack: passed in 0.08s;
- map bundle: passed in 2:25.74;
- map summary: 18 source-visible repositories, 172243 graph nodes, 148714 graph
  edges, 555 findings, and 21 coverage records.

Files:

- `summary-excerpt.json`: redacted summary fields from the map bundle.
- `map-excerpt.md`: redacted first sections of the human-readable map.
- `evidence-index-excerpt.jsonl`: redacted context-pack evidence records.
- `answer-contract-excerpt.md`: redacted answer contract excerpt.
- `gaps-query-excerpt.json`: redacted bounded `query gaps` result.

The full Bigtop output bundle is intentionally not committed.
