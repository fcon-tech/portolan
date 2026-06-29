## Why

`openspec/specs/reading-experience/spec.md` already mandates that the atlas
"reads as a system atlas rather than a repository map" and that the repo graph is
"supporting, not primary." But the flagship showcase does not deliver this at
depth. The Bigtop demo (`docs/site/bigtop/data/bigtop-demo.json`) renders 18
repos, 93 atlas nodes, 6019 findings, and 74 relationships — yet **all 74
relationships are `shared-dependency`** (SBOM/syft, `metadata-visible`). With no
structural edges, the showcase reads as "18 repositories that share libraries,"
which is exactly the flat inventory the spec says the atlas must not be. A C-level
reader opening it sees a repo list with shared-lib clusters, not a connected
code landscape.

## What Changes

- **Landscape view shows connected structure, not a flat inventory.** The atlas
  SHALL render typed relationships — including structural `references` edges (from
  `symbol-reference-edges`) and shared-dependency clusters — connecting
  components into legible groupings, hubs, and cross-cutting flows. When only
  shared-dependency edges are available (no structural edges), the atlas MUST say
  so in plain language and MUST NOT disguise dependency sharing as code-level
  architecture.
- **Bigtop is the deep-landscape acceptance showcase.** The Apache Bigtop corpus
  (a realistic multi-component JVM ecosystem: Hadoop/Spark/Hive/HBase/Kafka/
  Flink/...) SHALL be the showcase proving the landscape reads at depth —
  structural edges, shared-dependency clusters, surfaces, findings, and journeys
  — not a flat list of repositories. The showcase SHALL be regenerable from a
  real scan and SHALL be the artifact a C-level reader opens.
- **Honest dependency-only state.** Until structural edges are produced for a
  target, the showcase and any landscape view SHALL surface the
  dependency-only limitation visibly rather than implying architectural depth that
  the evidence does not support.

## Capabilities

### New Capabilities

- **Connected landscape view.** A landscape rendering that uses typed structural
  + dependency edges to show system shape (clusters, hubs, flows), with an honest
  dependency-only fallback.

### Modified Capabilities

- `reading-experience`: adds the connected-structure requirement and the
  dependency-only honesty rule; names Bigtop as the deep-landscape acceptance
  showcase. Refines the existing "Fleet map is supporting, not primary" and
  "First screen is a system walkthrough" requirements toward a landscape that is
  structural, not merely inventory.

## Impact

- **Depends on**: `agent-atlas-foundation` (the human skin is the JS reading
  layer over the Go-produced snapshot) and `symbol-reference-edges` (the
  structural edges that make the landscape connected). Without
  `symbol-reference-edges`, the dependency-only honesty rule governs.
- **Code**: the JS reading layer (`portolan-core`) renders structural edges and
  groupings in the landscape/Fleet view; `scripts/export-bigtop-gh-pages-demo.mjs`
  is regenerated from a scan that includes structural edges;
  `scripts/harness-bigtop-acceptance.sh` gains a "not a repo list" assertion
  (the landscape view contains cross-component structural edges, not only
  shared-dependency clusters).
- **Demo artifact**: `docs/site/bigtop/` becomes the C-level showcase, regenerated
  from a real Bigtop scan rather than hand-shaped data.
- **Out of scope**: the managed `scip-*` producer; new cartographic visuals; the
  agent-query surface. This change consumes structural edges; it does not produce
  them.
