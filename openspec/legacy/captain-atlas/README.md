# Portolan Product Work Packages

This is the active product specification surface for Portolan.

**Start with `08-portolan-product-charter.md`.** It is the governing product
charter for Part 1 (the admiral's atlas). It defines product identity, roles
(admiral, participants, fleet), the discovered ontology, the trust/confidence
contract, the navigation model (graph + zoom, behaviour map primary,
triangulation as a layer, C4 as one optional map), UX principles
(zero-copied-commands install), and the Part 1 / Part 2 boundary.

`07-portolan-core-product-spec.md` is **partially superseded**: it remains the
frozen contract authority for the already-implemented `system-map` schema,
builder, and viewer, but its product concepts are superseded by `08`. See the
"Superseded Concepts" table at the end of `08`.

> **Failed-spike note (Task A).** The previous public graph dashboard (the
> node-link map where repositories, docs, CI, support matrix, mailing lists,
> packages, and runtime surfaces were all equal peer nodes) is a **failed
> spike**. It is retained only as negative evidence. The meaning-first
> system-map UI (`viewer/src/app.js`, driven by
> `schema/system-map.schema.json`) is the product direction. Do not continue
> the graph-first topology by adding another panel or tooltip layer.

The admiral drops a Portolan link to an agent and leans back. The agent
installs Portolan autonomously, runs managed conversational intake with the
admiral, and participants in the expedition (deterministic static analyzers +
agent producers) build a snapshot. `/portolan:map` opens the behaviour map.
The admiral reads units, typed edges, surfaces, and confidence; drills into
dossiers; and enables triangulation to see where the three truths disagree.

For automated acceptance, Cursor means the terminal/headless Cursor Agent lane
(`cursor-agent` or `cursor agent`) using the same instructions a Composer user
receives. GUI Cursor behavior is useful confirmation, not the primary product
gate.

These files are designed for parallel agents, but they are not equal sources of
truth. Authority is **two-dimensional**: `08` wins on **product concepts**;
`07` wins on the **frozen 0.1.0 system-map contract** (schema, builder, viewer)
until a 0.2.0 migration reconciles them. `00`–`06` are supporting notes
subordinate to both.

If `00-product-contract.md` through `06-oss-kill-gates.md` contradict `08` or
`07`, use `08`/`07`. Treat the older package files as supporting notes until
they are reconciled.

## Work Packages

| Package | Agent Role | First Implementation Artifact |
| --- | --- | --- |
| `00-product-contract.md` | Orchestrator | Supporting scorecard and claim boundary for the agent first-run result. |
| `01-cursor-composer-first-run.md` | Harness agent | Supporting Cursor first-run prompt, transcript, and scorecard notes. |
| `02-atlas-app-shell.md` | Product UI agent | Supporting UI shell notes; `08` wins on product concepts, `07` on the frozen contract. |
| `03-landscape-intelligence-producers.md` | Data agent | Supporting fact-family matrix mapped to local producers and bundle fields. |
| `04-agent-qna-drilldown.md` | Agent UX agent | Supporting bounded query contract for answers and selected-code lookup. |
| `05-packaging-qol-security.md` | Platform agent | Supporting doctor/dry-run/receipt/status contract for the target-local run. |
| `06-oss-kill-gates.md` | Competitive agent | Supporting kill / pack / build scorecard for every major capability. |
| `07-portolan-core-product-spec.md` | Contract agent | Frozen system-map contract (schema, builder, viewer). Product concepts superseded by `08`. |
| `08-portolan-product-charter.md` | Goal agent | **Governing** product charter for Part 1: identity, roles, ontology, trust, navigation, UX, Part 1/2 boundary. |
| `10-agent-frontier-to-spec-roadmap.md` | Product research agent | Governing loop from clean agent frontier runs to shaped artifacts, delta analysis, ranked roadmap, and selected one-day specs. |
| `11-bigtop-route-index-coverage-matrix.md` | Route-index agent | Validated candidate Bigtop slice: source-anchored component routes, coverage matrix, and validation gates. |
| `12-source-boundary-ledger.md` | Boundary agent | Research-control spec: machine-readable source boundary ledger and safe inventory for clean frontier runs; not a selected product-scope slice. |
| `13-atlas-navigation-index.md` | Atlas-index agent | Product-scope candidate from Bigtop plus Portolan-self: generated routes, coverage, findings, unknown probes, evidence, and receipt validation. |
| `14-atlas-navigation-index-acceptance-review.md` | Review agent | Acceptance and product review of the first Atlas Navigation Index implementation, including verified checks, blocked `/portolan:map`, and known risks. |
| `15-atlas-reading-experience.md` | Reading-experience agent | UX-first correction: Bigtop must read as a system atlas with journeys, route diagrams, dossiers, evidence snippets, risks, unknowns, and next probes; the repo graph becomes a secondary Fleet map. |
| `16-atlas-drilldown-decision-semantics.md` | Drill-down agent | Decision-semantics correction: reader-facing navigation labels, meaningful click targets, relationship/probe/evidence details, honest-empty C4, and evidence usability separate from artifact validation. |
| `17-semantic-component-investigation-contract.md` | Semantic atlas agent | Product correction: selected component investigations must explain ecosystem placement, purpose, internal model, integrations, risks, and overlaps without hardcoding the product around named example technologies. |

## Package Ownership

Each work package must name:

- owned surfaces and out-of-scope surfaces;
- first vertical slice that can be implemented and reviewed independently;
- generated artifact or scorecard that proves the slice;
- exact verification command, harness run, or manual check;
- kill / pack / build recommendation when existing tools may win.

## Parallel Work Protocol

Each agent must return:

- scenario verdict: `verified`, `failed`, `blocked`, or `not_assessed`;
- commands or manual steps actually run;
- files or surfaces changed;
- user-visible demo evidence;
- top product gaps;
- kill / pack / build recommendation for its package.

Do not use historical backlog/spec directories as authority. They were removed
from the active product surface because they encoded stale tracks and drifted
away from the current Portolan first-run scenario.

## Global Acceptance Bar

Portolan is not demo-ready until this path works:

```text
Captain opens Cursor Composer or Cursor Agent CLI
Captain says: here is Portolan, here is my multi-repo ecosystem, build the Portolan result
Cursor installs or prepares Portolan
Cursor runs Portolan without target-specific handholding or prebuilt answers
Portolan generates a local UI and data bundle
Captain opens the UI and understands repos, components, relationships, risks,
gaps, and drill-down routes
Agent can answer follow-up questions from the Portolan bundle
The same path repeats on a second OSS ecosystem
```

Any work that does not improve this path is secondary.
