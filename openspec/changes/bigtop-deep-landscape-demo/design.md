# Design — bigtop-deep-landscape-demo

## Decision

Make the flagship showcase deliver what `reading-experience` already promises: a
landscape that reads as a connected system, not a repository inventory. Two
requirements: (1) the landscape view renders typed structural + dependency edges
into legible groupings, with an honest dependency-only fallback; (2) the Apache
Bigtop corpus is the acceptance showcase proving this at JVM-ecosystem depth.

## Current showcase state (the gap)

`docs/site/bigtop/data/bigtop-demo.json` is rich on paper — 18 repos, 93 atlas
nodes, 6019 findings, 74 relationships, narrative, report sections — but **all
74 relationships are `shared-dependency`** (SBOM/syft, `metadata-visible`, e.g.
"Shared dependency slf4j-api (14 repos)"). With no structural edges, the
landscape view can only show "repos that share libraries." That is a dependency
graph dressed up as a system atlas, which is precisely what the spec forbids and
what a C-level reader rejects as "a list of repos."

## Why this depends on symbol-reference-edges

The connected-structure requirement needs typed structural edges (who calls whom,
who implements what) to be more than a dependency cluster. Those edges come from
`symbol-reference-edges` (resolved `references` from SCIP-shaped exports). Until
that producer runs on Bigtop, the showcase operates under the **dependency-only
honesty rule**: it says so plainly and does not fake architectural depth. The
deep showcase "unlocks" once structural edges flow.

## Bigtop as the showcase

Bigtop is already the named stress corpus (`docs/test-corpora/apache-bigtop.md`,
`internal/testfixtures/corpus-manifests/apache-bigtop/`). It is a realistic
multi-component JVM ecosystem (Hadoop, Spark, Hive, HBase, Kafka, Flink, Tez,
Phoenix, Ranger, Solr, ...) with overlapping functionality (Spark/Flink/Tez for
processing; Hive/Phoenix for SQL; Ranger for security) and retired components
(Oozie, Sqoop) for lifecycle honesty. This is exactly the shape that should read
as a connected landscape. The showcase is regenerated from a real scan via
`scripts/export-bigtop-gh-pages-demo.mjs` (which already exports a bundle to the
demo data), not hand-shaped.

## Acceptance: "not a repo list"

The acceptance assertion is concrete: the regenerated showcase's landscape view
contains cross-component **structural** edges (not only shared-dependency
clusters), and `scripts/harness-bigtop-acceptance.sh` enforces this. A reviewer
opening the showcase sees a connected ecosystem. This is the C-level buy-in
surface ("without it C-level won't buy") — architecturally a skin, commercially
load-bearing.

## Reversibility

High. The change is additive on the reading layer and the showcase artifact. The
dependency-only honesty rule means the showcase degrades gracefully (and still
ships) if structural edges are absent.

## Risk if wrong

Low. The main risk is over-claiming structural depth before
`symbol-reference-edges` actually runs on Bigtop — mitigated by the
dependency-only honesty rule, which is mandatory in the delta. A secondary risk
is showcase-generation cost on the full Bigtop corpus; mitigated by regenerating
from a bounded/representative scan and committing the derived fixture.

## Out of scope

- Producing structural edges (`symbol-reference-edges` does that).
- New cartographic visuals or a redesigned UI shell.
- The agent-query surface (agent-atlas base).
- Full-corpus performance tuning of showcase generation.
