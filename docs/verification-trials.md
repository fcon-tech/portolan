# Verification-property trials — Serena & Sourcegraph MCP

Trial date: 2026-08-31. Method: official docs, repo READMEs, and published
tool lists — no product installs. This page is the receipt behind the
differentiation claims in [README](../README.md) and the landing page: read
it before quoting them.

**Decay trigger (design.md, decision 5):** re-run these trials before any
release that repeats the differentiation claim; if the claim no longer
holds, drop the claim instead of aging this page silently.

## What was checked, per product

Four properties — the ones Portolan markets as its spine:

| Property | Question asked |
| --- | --- |
| Anchors | Do tool outputs tie facts to verifiable file/line evidence a consumer can re-check? |
| Trust labels | Is fact confidence graded in a closed vocabulary? |
| Receipts | Is there an append-only audit of agent actions, queryable as a property? |
| Staleness | Are previously produced facts marked outdated when the source changes? |

## Results

| Product | Property | Marketed? | Served? | Evidence (URL + quote) | Label |
|---|---|---|---|---|---|
| Serena | Anchors | No — explicitly positions against line-level grounding | Not demonstrated in fetched sources | README: "distinguishing it from approaches that rely on low-level concepts like line numbers"; tools docs describe `find_symbol` without an output spec | `measured` |
| Serena | Trust labels | No | No — no confidence vocabulary in README or tools docs | Tools docs: tool descriptions contain no grading terms | `measured` |
| Serena | Receipts | No | Neighbor only: optional local dashboard ("logs, session information, and tool usage statistics"), not a queryable append-only property; no MCP tool exposes an action log | Tools docs page | `measured` |
| Serena | Staleness | No | No — persistent memories have no invalidation on source change | Tools docs: memory tools are write/read/list/edit/rename/delete | `measured` |
| Sourcegraph MCP | Anchors | **Yes** — file/line ranges are a marketed headline of Code Finder | Demoed on the official page; no output schema published | sourcegraph.com/mcp: "returns the matching file paths and line ranges with a short note on what each one does"; example "internal/limiter/rate.go L41–88" | `measured` |
| Sourcegraph MCP | Trust labels | No | No — only a comparison graphic ("Confidence 0%") about agents, not a fact-grading vocabulary | sourcegraph.com/mcp | `measured` |
| Sourcegraph MCP | Receipts | No | No — retrieval layer "authenticates requests, lists available tools, and routes each call"; no audit log described | sourcegraph.com/mcp; curated-tools changelog | `measured` |
| Sourcegraph MCP | Staleness | No | No — history/diff tools search the past; no stale-marking of prior outputs | sourcegraph.com/mcp | `measured` |

## Findings

1. The gap holds **as worded**: neither surveyed product markets trust
   labels, receipts, or staleness for codebase facts. All three are absent
   from every fetched primary surface, and both products' persistence
   features cut the other way — Serena's memories and Sourcegraph's history
   search store or retrieve facts with no pending-correction state.
2. **Anchors alone are commodity.** Sourcegraph Code Finder markets and
   demos verifiable file/line anchors. Portolan's differentiation claim is
   therefore never "we cite lines" — it is the closed trust vocabulary plus
   re-checkable evidence binding (deterministic re-sounding), receipts, and
   staleness, together.
3. A skeptic's second nuance: Serena's optional dashboard exposes "logs,
   session information, and tool usage statistics" — a neighbor of
   receipts, though a local GUI diagnostic rather than a queryable
   append-only property of the tool surface.

## Scope and limits

This is an argument from absence over two surveyed products, verified by
surface inspection only — no installs, no API trials. The dedicated
Sourcegraph MCP docs subpage is a JS-rendered shell and returned no
substantive content, so its negative findings rest on the official product
page and the curated-tools changelog, not on full tool schemas. The honest
form of the claim is "no surveyed tool markets this", never "no tool does".

## Sources

- https://github.com/oraios/serena (README)
- https://raw.githubusercontent.com/oraios/serena/main/README.md (raw)
- https://oraios.github.io/serena/01-about/035_tools.html (tools docs)
- https://github.com/oraios/serena/discussions/512 (user-proposed output format, not actual output)
- https://sourcegraph.com/mcp (product page)
- https://sourcegraph.com/changelog/mcp-curated-default-tools (changelog)
- https://docs.sourcegraph.com/mcp (redirect; JS shell, no content)
