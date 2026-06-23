# Bundle query guardrails

Portolan does **not** answer user questions. Agents query the bundle at question time.

## Required workflow

1. Run `portolan-scan` (or read an existing bundle).
2. Before architecture or pain claims, call `portolan-bundle-query` or viewer `/api/*`.
3. Cite every material claim with `hotspot:id`, `gap:id`, `path:line`, or `portolan://` reference from query output.
4. If query returns empty records or warnings about missing indexes, read `gaps.jsonl` and say `not_assessed` / `cannot_verify` — do not invent.

## Query families

| Family | When |
| --- | --- |
| `hotspots` | Duplication, smells, config, deps, symbol-density pain |
| `gaps` | Missing evidence, blocked producers |
| `search` | Text/path discovery (requires `search-index.jsonl`) |
| `symbol` | Definition lookup (requires `symbol-index.jsonl`) |
| `source` | Bounded source snippet |
| `landscape` | Project card / report sections |
| `evidence-index` | Map-bridge relationship hints (optional) |

## MCP

- Use `portolan-bundle-query-mcp` only with `PORTOLAN_BUNDLE_DIR` pointing at a local scan bundle.
- MCP tools return the same JSON as CLI; do not treat tool output as user-facing answers without citations.

## Forbidden

- Treating LLM narrative as `source-visible` evidence.
- Skipping query tools and reading random repo files instead when bundle exists.
- Promoting `not_assessed` gaps to observed facts.
- Claiming call graphs or runtime topology without imported evidence.
