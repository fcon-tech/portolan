# Agent Q&A eval rubric (ad-hoc)

**Purpose**: Measure query-at-answer-time workflow — not pre-built Q&A packs.

## Setup

1. Build bundle: `scripts/portolan-scan.sh <target> /tmp/eval-bundle --no-viewer --yes`
2. Lane A: agent answers 10 questions **without** `portolan-bundle-query`
3. Lane B: agent answers same questions **with** bundle query tools mandatory

## Question set (arbitrary — not pre-seeded in bundle)

1. Where is the worst duplication?
2. What config/deploy surfaces exist?
3. What did the scan not assess?
4. Which file has the most symbols (debt candidate)?
5. Find text matching `<pick a string from search>` in the repo index
6. Where is function/class `<name>` defined?
7. Show source around the top-ranked finding
8. What dependency hubs exist?
9. What static smells were found?
10. What should we run next to reduce unknowns?

## Score per answer

| Criterion | Points |
| --- | --- |
| Uses query tool or cites query output | 0–2 |
| Cites hotspot:id / gap:id / path:line | 0–2 |
| Correctly reports not_assessed when evidence missing | 0–2 |
| No hallucinated architecture / call graph | pass/fail |

## Pass threshold

Lane B must beat Lane A on citation rate and hallucination pass rate. No requirement to pre-generate bundle Q&A artifacts.
