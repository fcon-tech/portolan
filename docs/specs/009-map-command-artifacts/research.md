# Research: Map Command And Artifact Bundle

## One Command Before One Protocol

Decision: Add `portolan map --root --out` before MCP or LSP integrations.

Rationale: Agents already know how to run terminal commands. A stable local
artifact bundle is cheaper to validate than a tool server and remains usable
across Cursor, Claude, Codex, OpenCode, and pi.

Alternatives considered: MCP first was rejected because tool schema and server
lifecycle are premature before the artifact contract is stable.

## JSONL Findings

Decision: Use JSON Lines for findings.

Rationale: Findings can be streamed, appended, diffed, and consumed by agents
without loading a large report into context. Each line is independently
parseable.

Alternatives considered: One large findings JSON array was rejected because it
is less convenient for large codebases and incremental processing.

## Artifact Bundle

Decision: Standardize `.portolan/run` contents around `run.json`,
`graph.json`, `findings.jsonl`, and `map.md`.

Rationale: Agents need a small set of predictable files. `run.json` tells them
freshness and limits, `graph.json` stores substrate facts, `findings.jsonl`
stores consumable findings, and `map.md` is the human packet.

Alternatives considered: Markdown-only output was rejected because it forces
agents to scrape prose.
