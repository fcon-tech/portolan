# Portolan Product Charter — Part 1 (The Admiral's Atlas)

## Reader And Goal

Reader: an implementation agent, a reviewer, or an admiral (the product's human)
deciding what Portolan is and is not.

Post-read action: align every Part-1 implementation, migration, and review to
this charter. Where an older document (notably `07-portolan-core-product-spec.md`)
contradicts this charter on the concepts this file owns, this file wins. The
already-built `system-map` contract artifacts remain valid until migrated; only
the conceptual framing is superseded here.

This document is the governing product charter for Part 1. Part 2 (the live
fleet index/navigation) is out of scope and will be specified separately.

## Authority Rule

- This charter supersedes `07` and earlier work-package files **for the product
  concepts it owns**: product identity, roles, ontology, intake model,
  confidence/trust contract, navigation model, C4-as-map, UX principles, and the
  Part 1 / Part 2 boundary.
- `07-portolan-core-product-spec.md` remains the **frozen contract authority** for
  the already-implemented `system-map` schema, builder, and viewer surfaces until
  a migration task reconciles them with this charter. Its superseded concepts are
  listed at the end of this file.
- Older package files (`00`–`06`) remain supporting notes, subordinate to both
  `08` (concepts) and `07` (frozen contract).

## Product Identity

Portolan is a **local-first cartographic atlas of a code landscape**.

An admiral (the human, formerly "the user" or "the CTO") points Portolan at what
they have. Participants in the expedition (deterministic static analyzers and
agent skills) discover the structure and connections inside what the admiral
named. The admiral receives a **behaviour map** — a map of what the codebase
actually *is* — as the primary artefact of the expedition. Triangulation against
intentions (tickets, roadmaps) and representations (documentation) is an
**additional axis**, not the goal: it shows where the three versions of the truth
disagree.

Every assertion in the atlas is signed with a confidence level and evidence.
This trust contract is the product's spine, not a feature.

The expedition is a **one-shot artefact**: a snapshot. **Determinism applies to the
ironclad-fact layer only** — the same landscape rebuilt produces the same
deterministic core (units, edges, surfaces, manifest dependencies). The
agent-producer layers (hypotheses, triangulation findings) are **explicitly
non-reproducible across rebuilds** unless their raw model output is cached in
the snapshot. To keep a full rebuild deterministic, an agent producer that uses
an LLM must cache its raw model output in the snapshot; a rebuild replays the
cache rather than re-querying the model. Drift detection, live indexing, and
concurrent fleet navigation are **Part 2** and out of scope.

## Roles

- **Admiral** — the human. Reads the map, directs the expedition, drills down.
  Identifies as an admiral, not a job title. UI copy, agent instructions, and
  documentation use this role language.
- **Participants in the expedition** (Part 1) — two kinds, working together in a
  single snapshot build:
  - **Deterministic core** — static analyzers that discover units, edges,
    surfaces, and manifest dependencies. These produce ironclad facts.
  - **Agent producers** — agent skills that search for evidence, triangulate, and
    mark duplication, dead code, and architectural-principle violations. These
    produce hypotheses with evidence. **Architectural principles** are sourced
    from the admiral at intake (named explicitly) or, if none are given, no
    principle-violation checking is performed — Portolan does not invent
    principles to enforce.
- **Fleet** (Part 2) — coding tools (ships) with agents (crews) that navigate a
  live index after the first expedition. Out of scope here.

**Producer data path:** the snapshot is a single normalised artefact. The
deterministic core writes units, edges, surfaces (ironclad). Agent producers
write **findings** and **assertions** (hypotheses) into the same snapshot under
a distinct producer-family tag, each carrying a confidence level per the Trust
Contract. The deterministic core and agent producers are **distinct, named
producer families** in the schema (`created_by_producer_family` already exists
in the frozen contract); the 0.2.0 migration adds the `confidence` field that
binds family → allowed levels. Agent producers operate **inside the snapshot
build only**: read-only, within the explicit perimeter, same as the
deterministic core. Live re-analysis and drift detection are Part 2.

## The Three Truths

The landscape is understood through three versions of the truth:

- **Behaviour** — what the code actually does, declares, and depends on. This is
  the **primary truth** and the backbone of the atlas.
- **Intentions** — what was planned: tickets, roadmaps, planning artefacts.
- **Representations** — how the system is described: documentation, architecture
  notes.

Portolan's uniqueness is not any single truth; it is **triangulation**: where
behaviour, intentions, and representations agree, there is reliable ground;
where they disagree, there is a finding. Triangulation is a **highlight layer**
applied on top of any map, not a separate audit product and not the entry point.

**Graceful degradation (the degenerate one-truth case):** triangulation
requires intentions and/or representations to be ingested. If the admiral names
only repositories (no tickets, no docs), the atlas is **behaviour-only** — and
this is **not a failure**, it is a complete, valid Part-1 result. The
triangulation overlay is simply absent or shows "no intentions/representations
ingested; behaviour-only atlas." The acceptance bar's triangulation step is
conditional on the relevant truths being present in intake.

**Data contract for triangulation:** intentions (tickets, roadmaps) and
representations (documentation) enter the snapshot through intake as **sources**
that feed deterministic producers (parse ticket metadata, index doc text). A
triangulation finding links a behaviour assertion to a conflicting or stale
intention/representation via resolvable evidence pointers. This requires a
**0.2.0 schema addition** for intention/representation objects and a finding
shape that references both sides; until that migration, triangulation is
target-state and the behaviour-only atlas is the shippable Part-1 minimum.

## Ontology (Discovered, With A Minimal Kernel)

The landscape is **terra incognita**: structure is discovered, not prescribed.
Portolan does **not** impose a fixed taxonomy like Backstage's
`Domain → System → Component`. But pure untyped graphs are unreadable noise
(rejected from prior prototype experience). The atlas uses a **minimal
ontological kernel**:

- **Landscape unit** — a distinct entity the admiral named or Portolan found.
  A unit is *promoted* from raw source material when the deterministic core can
  name it and locate it (a repository path, a package coordinate, a service
  identifier). A **repository is a unit**, not a surface: the repository is the
  primary source-of-truth a unit is backed by. A **unit's sub-type** is drawn
  from a closed vocabulary (`application`, `library`, `platform`, `package`,
  `deployment`, `runtime`, `external`, `unknown`) inherited from the frozen
  schema; it is set only when the deterministic core has evidence for it,
  otherwise `unknown`. Honesty over false precision. A **repository-unit is
  self-backing**: its evidence is its own source tree. All other units name
  their backing repository-unit(s).
- **Surface** — how a unit manifests in the world: docs, issue tracker, chat,
  mailing list, deploy target. Surfaces **attach to** a unit (their owner);
  they are never peer nodes on the behaviour map. (A *repository* is a unit, not
  a surface; a *repo source* is the backing evidence for a unit, referenced from
  the unit, not modelled as a surface.)
- **Finding** — a discovered problem or signal attached to one or more units:
  duplication, dead code, an architectural-principle violation, a confidence
  disagreement. Findings are produced by both the deterministic core (e.g.
  "no backing repository" — ironclad) and agent producers (e.g. "appears
  abandoned" — hypothesis). A finding carries its own confidence level. The
  finding type is inherited from the frozen schema's finding vocabulary.
- **External node** — a unit that lies outside the expedition perimeter (a
  dependency, an upstream system, a third-party service referenced but not
  inspected). External nodes are **inferred from `depends-on`/`references` edges
  whose target resolves outside the perimeter** (e.g. a dependency on
  `org.apache:commons-lang3` when that source is not under the named roots).
  They are recorded with an `external` flag so the map shows the boundary of
  knowledge; they are not crawled. An external node is a unit, not a separate
  kernel member.
- **Grouping** — emerges from ownership and dependency density. Groupings are
  discovered, not declared. **Mechanism:** groupings are the connected
  components of the `depends-on`/`references` edge graph among units, further
  bucketed by dominant unit sub-type within each component. The grouping is a
  **deterministic computation over the behaviour map**, not a separate taxonomy.
  The legacy role taxonomy (`data-systems`, `compute-processing`, …) from the
  frozen contract **survives as one optional grouping lens** layered on top of
  units; it is not computed as the spine and is not required.
- **Typed edges** — `depends-on`, `references`, `deployed-on`. Edge type is
  always set; an edge whose type cannot be resolved is `unknown`, not a guess.

**Producer priority for conflicts:** when the deterministic core and an agent
producer disagree on a unit's type, an edge, or a grouping, the **deterministic
core wins on its domain** (it is the ironclad-fact authority). The disagreement
is recorded as a **finding** with the agent's claim attached at `hypothesis`
confidence, so the admiral sees both and the disagreement is not silently
dropped.

## Trust Contract (Mandatory Confidence Levels)

Every assertion in the atlas carries a confidence level. This is not optional
and not the same as evidence source. The spectrum:

| Level | Producer family | Meaning | Example |
| --- | --- | --- | --- |
| **Ironclad fact** | Deterministic analyzer | Repeatable, machine-derived | "HBase depends-on Hadoop" from `pom.xml` |
| **Hypothesis with facts** | Agent + cited evidence | Agent claim backed by a cited, resolvable evidence pointer | "This doc describes a service removed in commit X" (commit cited) |
| **Hypothesis** | Agent, no hard evidence | Agent inference without a resolvable evidence pointer | "This module appears abandoned" |
| **Speculation** | Agent guessing | Guess without evidence | "Possibly dead code" |

**Assignment rule (who decides the level):** the level is **bound to the
producer family by contract, not self-declared arbitrarily.** A deterministic
producer may emit **only** `ironclad`. An agent producer may emit any of the
other three, and must emit `hypothesis-with-facts` only when its assertion
carries a resolvable evidence pointer (`evidence.source` non-empty and
resolvable to an artifact in the snapshot). An agent asserting
`hypothesis-with-facts` with an empty or unresolvable source is a **validation
failure** and is downgraded to `hypothesis`.

**Merge/dispute rule:** when a deterministic producer and an agent producer
assert about the same object (a unit's type, an edge), the deterministic
producer's assertion is authoritative; the agent's is recorded as a finding
(`hypothesis` confidence) so the disagreement is visible. Two agent producers
asserting about the same fact: the **higher** confidence wins (the better-
evidenced claim is more trustworthy), and the disagreement is recorded as a
finding so the admiral sees both claims. "Conservative" does not mean "least
evidenced wins" — it means disagreements are never silently dropped.

**Schema migration:** the frozen 0.1.0 `system-map` schema has `evidence.state`
but **no `confidence` field.** The confidence contract is **target-state** for
Part 1; it requires a **0.2.0 schema migration** that adds a `confidence` enum
field (`ironclad` | `hypothesis-with-facts` | `hypothesis` | `speculation`) to
every assertion-bearing object, bound to the producer-family rule above. Until
that migration ships, the confidence contract is *aspirational* and the frozen
0.1.0 contract stands. The migration is a named Part-1 task, not an afterthought.

The existing `evidence.state` (`source-visible`, `metadata-visible`, …) describes
the **source** of an observation; the confidence level describes the
**trustworthiness of an assertion**. Both are required and orthogonal. The
`claim-only` evidence state and the `speculation`/`hypothesis` confidence levels
are related but distinct: `claim-only` says "we saw a claim but no source code";
`speculation` says "an agent guessed with no evidence at all." Do not conflate
them.

**Compatibility matrix (valid combinations at 0.2.0):**

| `evidence.state` | allowed `confidence` |
| --- | --- |
| `source-visible` | `ironclad` (deterministic) or `hypothesis-with-facts` (agent citing source) |
| `metadata-visible` | `ironclad` or `hypothesis-with-facts` |
| `runtime-visible` | `ironclad` |
| `claim-only` | `hypothesis-with-facts`, `hypothesis`, or `speculation` |
| `unknown` / `cannot_verify` | `hypothesis` or `speculation` |

An `ironclad` assertion must carry `evidence.state` in {`source-visible`,
`metadata-visible`, `runtime-visible`}; a `speculation` assertion may carry any
evidence state but typically `claim-only`/`unknown`. The 0.2.0 schema validator
enforces this.

## Navigation Model

The atlas is **a collection of maps and descriptions**. The map is primary;
depth is the admiral's choice.

### First Screen (`/portolan:map`)

`/portolan:map` opens the atlas at an **annotated overview map**, not an
undifferentiated node-link graph. This reconciles with the frozen `07` rule
("default route is Overview, not Map"; "no undifferentiated graph as first
screen"). The first screen shows: the landscape's shape at a glance (target
identity, unit count, dominant groupings, a small donut/distribution of unit
sub-types), the most connected units as entry points, and a clear affordance to
open the full behaviour graph. The full node-link behaviour map is one click
deeper. The behaviour map is the *primary artefact* (the data spine); the
overview is its *entry rendering* — they are not in conflict.

### Maps (enumerated)

The atlas contains these discrete maps:

1. **Overview map** — first screen, annotated summary (above).
2. **Behaviour map** — full node-link graph of units + typed edges, discovered
   by the deterministic core. The data spine. Supports zoom within (detail/
   clutter control: at low zoom show groups + hubs; at high zoom show all units
   + edges + labels).
3. **C4 map** — optional, nested decomposition with honest-empty levels (below).
4. **Surfaces view** — surfaces grouped by type, attached to their owning units.
5. **Findings/Risks view** — findings grouped by unit, when present.

Switching between maps is a discrete gesture (nav/tab); within a map, zoom
adjusts detail. The "deeper map" for a given unit is its **dossier** (a
drill-down surface, not a separate map) and, one level further, the unit's
backing evidence (repository).

### Navigation gestures

- **Switch map** — discrete (tab/nav). Like taking a different sheet off the
  atlas shelf.
- **Zoom within a map** — continuous-ish, adjusts detail/clutter (see Behaviour
  map zoom levels above). Bounded per map.
- **Drill into a unit** — opens the unit's dossier.
- **Zoom past the deepest view** — hands the admiral to the unit's backing
  evidence (typically the source repository) directly: "the code is the ground
  truth from here." For a unit with no backing repository (external node,
  inferred unit), zoom-past opens the dossier's evidence section.

### C4 map (optional, nested decomposition)

C4 is **one optional map** in the atlas, a familiar gesture to an admiral who
knows C4. **It is nested decomposition (Context ⊃ Container ⊃ Component), with
honest-empty levels:** Context is always present (the target + true external
systems); Container is present **only when runtime/deploy evidence exists** in
the perimeter (Dockerfiles, systemd units, k8s manifests, process definitions)
— without that evidence the Container level is honestly empty with an
explanation, never fabricated from naming; Component is present only for
promoted units; Code is out of scope ("into the repo you go"). Within the
Container level, grouping is by **observed deployment topology** (pods,
containers, services), not by the legacy role taxonomy. The legacy family
taxonomy is only used outside C4 as the optional grouping lens. The C4 map's
navigation affordance when Container is empty: the level appears greyed-out
with the explanation, not hidden — the admiral sees that Portolan looked and
found no runtime evidence, which is itself information.

### Triangulation layer

Triangulation is a **highlight layer** applied on top of any map (when Part-1b
data exists). A conflict without structure is noise; the same conflict glowing
on a map node is insight.

### Dossier

Every unit has a drill-down surface: what it is, why it is present, where it
sits, backing evidence, related units, surfaces, findings, unknowns, and next
actions. **Confidence display** in the dossier is a Part-1b feature (gated on
the 0.2.0 schema); until then the dossier shows `evidence.state`. **Next
actions** are generated by the deterministic core from the unit's findings and
relationships (e.g. "this unit has 3 unattached surfaces — inspect ownership");
if none can be derived, the section is omitted.

## Two Display Styles

The atlas can be rendered in two switchable styles:

- **Cartographic** — compass, parchment-toned palette, region borders,
  map-like chrome. The atlas looks like an atlas, not a dashboard.
- **Plain** — clean structural SVG, minimal chrome, for when the admiral wants
  raw structure without the cartographic framing.

Both styles render the same data; the toggle is presentation only.

## UX Principles (Product, Not Feature)

UX is not polish applied after architecture. It is the first thing designed.

- **Zero copied commands.** The admiral drops a Portolan link to an agent and
  leans back. The agent installs Portolan autonomously. Reference product:
  Oh My OpenAgent — "give the agent this link and lean back."
  *Passes when:* a fresh agent given only the Portolan link reaches
  `/portolan:map` with no command the admiral typed beyond the initial prompt;
  approval prompts for target mutation (writes under `.portolan/`, network
  access) are allowed and expected, but no command is copied from docs.
- **Conversational intake.** The agent *asks* the admiral what they have
  ("repos here? tickets where? docs?"), it does not demand a filled-in YAML
  manifest. Managed intake is a dialogue.
  *Passes when:* the intake dialogue produces a **typed intake result** (an
  artefact under `.portolan/` naming the anchors and their access methods) that
  the deterministic core consumes without re-asking the admiral; a deterministic
  rebuild reuses this intake result and does not re-open the dialogue.
- **One entry point.** `/portolan:map` opens the atlas. Not "configure a server,
  open localhost, navigate." `/portolan:map` is the agent-side command that
  builds the snapshot (if stale) and opens the behaviour map in the local UI. It
  is additive to the existing `#/...` hash routes; it does not replace the
  dossier/detail route contract.
- **Agentic instructions are self-contained.** Every YAML, script, command, and
  toolchain is embedded in the agent instructions. The agent never has to
  search, invent, or copy from docs. This kills a whole class of first-run
  failures.
- **Visual quality is part of the product.** Dark map, colour hierarchy,
  interactive SVG. What is already being built in the viewer is the direction,
  not a bonus.

## Intake Model

Start of every expedition: **managed intake** via the **root Portolan skill** —
the single entry-point skill whose identity is fixed at install time (named in
the agent instructions; not a registry lookup). It is a conversational intake
where the agent asks the admiral what they have. The admiral names anchors even
in full ignorance: a filesystem path, a repo URL, a docs location, a ticket
source (API or local file). Everything else Portolan discovers.

The intake dialogue **persists a typed intake result** (an artefact under
`.portolan/` listing anchors + access methods + perimeter). This artefact is
part of the snapshot; a deterministic rebuild reuses it without re-intake. The
intake result has this shape:

| field | type | notes |
| --- | --- | --- |
| `target_root` | string (path or URL) | the expedition's primary anchor |
| `anchors` | array of `{id, kind, location, access_method}` | each named source: `kind` ∈ `repository`/`docs`/`issue-tracker`/`chat`/`mailing-list`/`deploy`; `location` is a path/URL; `access_method` ∈ `local`/`api`/`file` |
| `perimeter` | array of strings (roots) | explicit boundaries; anything outside is external |
| `architectural_principles` | array of strings | optional; named by admiral, drives principle-violation checking (none → no checking) |
| `generated_at` | ISO timestamp | exempt from determinism |

Validation: a fresh agent consumes this without re-asking the admiral. If the
deterministic core cannot resolve an anchor's `location`/`access_method`, it
records an unknown rather than prompting mid-build.

The boundary of the expedition is **the explicit perimeter**: what the admiral
named. Links leading outside the perimeter are recorded as **external nodes**
(flagged units, not crawled) but not crawled without permission.

**Out of scope:** autodiscovery from a single URL ("here is a URL, figure it
all out"). This is an intentional scope limit, not a gap.

## Part 1 / Part 2 Boundary

**Part 1 (this charter governs):** intake, deterministic core, agent producers
of the snapshot, behaviour map, triangulation highlight layer, C4 projection,
confidence contract, cartographic/plain styles, dossiers, UX-driven install.
One-shot snapshot with deterministic rebuild.

**Part 2 (separate, out of scope here):** the live index and navigation system
for the fleet. After the first expedition, coding tools (ships) with agents
(crews) navigate a live, evolving index: drift detection, concurrent
navigation, live evidence finding. Do not design Part 2 behaviour into Part 1.

The bridge between parts: agent skills that *build* hypotheses-with-evidence for
the snapshot are Part 1 (producers). Agent skills that *navigate* a live index
during fleet work are Part 2.

**Scope rule for the boundary:** Part-1 artefacts must **not** include fields or
behaviour whose only consumer is a Part-2 feature (no drift-scaffolding, no
live-index hooks). A skill is classified by what it does in a given run: if it
writes into the snapshot build, it is a Part-1 producer for that run; if it
reads a live index during fleet work, it is Part-2. A skill may be *capable* of
both, but a Part-1 expedition invokes only its producer behaviour.

## Decision Gate

This section is **owned by this charter**; `AGENTS.md` mirrors it and defers to
`08` on conflict. Before proposing product, design, implementation, dependency,
or workflow changes, answer:

1. **Simpler/Faster** — can the Part-1 expedition be solved with less code,
   fewer moving parts, fewer dependencies, less process, or a smaller change?
2. **Blocking Edge Cases** — what scale, security, privacy, install, harness,
   compatibility, data-quality, or UX constraints prevent that simpler answer?
3. **Existing Open Source** — does an existing OSS or commercial tool solve the
   Part-1 expedition well enough that Portolan should integrate, wrap, or die
   instead of building?

Do not turn this into market theatre.

## Superseded Concepts In `07`

The following concepts in `07-portolan-core-product-spec.md` are **superseded**
by this charter. The frozen `system-map` contract artifacts (schema, builder,
viewer) remain valid **until a 0.2.0 migration** reconciles them; the table
marks each as Superseded (concept dead), Legacy-required (still in the 0.1.0
schema/builder as a required field, removed at 0.2.0), or Clarified (kept,
re-framed).

| `07` concept | Status | Replacement |
| --- | --- | --- |
| Corpus manifest as the mandatory start | Superseded | Managed conversational intake; manifest is one optional input, not the only start |
| C4 as the skeleton / lens spine | Superseded | Behaviour map is the spine; C4 is one optional map projection (nested decomposition, honest-empty levels) |
| Role taxonomy (`data-systems`, …) as canonical grouping | Legacy-required | `component.c4_family` is **required** in the frozen 0.1.0 schema (every component must carry it) and the builder assigns it via `assignC4Family`. It is **legacy-required until 0.2.0**: conceptually an optional grouping lens, but still mandatory in code. 0.2.0 makes it optional. Grouping itself is discovered (connected components of edges, bucketed by dominant unit sub-type). |
| Component Promotion Rule (two-signal independence, tie-breaker) | Legacy-required | Still drives promotion in the 0.1.0 builder. Conceptually retained: a unit is promoted when the deterministic core can name and locate it. The detailed 07 algorithm stands until 0.2.0; this charter does not require its replacement before then. |
| `evidence.state` conflated with trust | Clarified | Confidence spectrum (ironclad / hypothesis-with-facts / hypothesis / speculation) is orthogonal to evidence source. `evidence.state` is kept; `confidence` is added at 0.2.0. `claim-only` (evidence state) ≠ `speculation` (confidence). |
| "Containers/Families" as one level | Superseded | Container-level requires runtime/deploy evidence; never fabricated from naming. Container map is honest-empty without evidence. Family ≠ container. |
| Retired components as "external" context | Clarified | Retired ≠ external. Context = target + true external systems. The frozen 0.1.0 schema/builder still emit retired components as context boxes (`lifecycle: retired` and `type: external` enums persist); this is legacy behaviour until 0.2.0. |
| First-run via manual CLI/script steps | Superseded | Zero-copied-commands install; agent instructions are self-contained |
| BDD Feature 3 "Container view groups components by role" | Conceptually superseded | Still runnable against the frozen contract. Conceptually superseded: the C4 map is not role-grouping. Remains a regression check for the frozen contract, not a Part-1 product gate. |
| BDD Features 1–9 generally | Retained for frozen contract | The 07 BDD features remain authoritative for the **frozen 0.1.0 contract** until 0.2.0. New Part-1 product behaviour (intake, confidence, triangulation, `/portolan:map`) gets new acceptance criteria defined here, not inherited from 07. |

**`chat` as a surface type:** the frozen 0.1.0 `surface_type` enum has no
`chat`. It is added at the 0.2.0 schema migration. Until then, chat surfaces
are recorded as `other` with a `chat` sub-label. **Known Part-1 limitation:**
type-based surface filters will not match chat surfaces until 0.2.0; the
Surfaces view must filter on the sub-label to include them.

**`generated_at` determinism exemption:** the snapshot carries a `generated_at`
timestamp; it is **exempt from the determinism guarantee** (two rebuilds differ
in timestamp but are structurally identical).

## BDD Features For New Part-1 Concepts

The frozen `07` BDD features remain authoritative for the 0.1.0 contract. The
following Gherkin features govern the **new** Part-1 behaviour. An
implementation is not Part-1a ready until these pass.

### Feature: Managed intake

```gherkin
Feature: Managed intake records what the admiral has
  Scenario: Admiral names repositories only
    Given the admiral drops a Portolan link to an agent
    When the agent runs managed intake
    Then the agent asks what anchors the admiral has
    And the admiral names one or more repository roots
    And a typed intake result is persisted under .portolan/
    And a deterministic rebuild reuses that intake result without re-asking
  Scenario: Admiral names repos, docs, and a ticket source
    Given the admiral names a repository root, a docs location, and a ticket API
    When intake completes
    Then the intake result records all three anchors with their access methods
    And the perimeter is the union of the named roots
```

### Feature: /portolan:map entry

```gherkin
Feature: /portolan:map opens the atlas
  Scenario: First screen is an annotated overview, not an undifferentiated graph
    Given a snapshot exists
    When the agent opens /portolan:map
    Then an annotated overview map renders
    And it shows target identity, unit count, and dominant groupings
    And it does not show an undifferentiated node-link graph as the first screen
    And a clear affordance opens the full behaviour map
```

### Feature: Behaviour map

```gherkin
Feature: The behaviour map shows units and typed edges
  Scenario: Admiral opens the full behaviour graph
    Given the overview is visible
    When the admiral opens the behaviour map
    Then units and their typed edges render as an interactive graph
    And each unit carries its evidence.state
    And clicking a unit opens its dossier
  Scenario: Zoom controls detail without losing structure
    Given the behaviour map is visible
    When the admiral zooms out
    Then low-importance units are elided into groups and hubs remain
    And when the admiral zooms in all units, edges, and labels are shown
```

### Feature: Honest absence (Part-1b gating)

```gherkin
Feature: Absent truths degrade gracefully
  Scenario: Behaviour-only atlas when no intentions/representations ingested
    Given intake named only repositories
    When the snapshot builds
    Then the atlas is behaviour-only
    And the triangulation overlay is absent with a clear "behaviour-only" state
    And this is a valid complete Part-1 result
  Scenario: Container level honest-empty without runtime evidence
    Given the perimeter has no runtime/deploy evidence
    When the admiral opens the C4 map
    Then the Container level renders honestly empty with an explanation
    And it is greyed-out, not hidden
```

## Global Acceptance Bar (Part 1)

Portolan Part 1 ships in two stages against the frozen/migrating contract. Each
has its own gate.

**Part 1a (shippable against the frozen 0.1.0 contract):**

```text
Admiral drops a Portolan link to an agent and leans back
Agent installs Portolan autonomously (zero copied commands)
Agent runs managed intake conversation with the admiral
Participants (deterministic core) build the snapshot
/portolan:map opens the annotated overview map (see First Screen, above)
Admiral reads the map: units, typed edges, surfaces, evidence.state
Admiral drills into a dossier and sees what/why/where + evidence
The same path repeats on a second landscape with no target-specific handholding
```

**Part 1b (requires the 0.2.0 schema migration):**

```text
Agent producers contribute findings/hypotheses into the snapshot (confidence-tagged)
Admiral reads confidence levels on map and in dossiers
IF intentions or representations were ingested at intake:
  Admiral enables triangulation overlay and sees where truths disagree
ELSE:
  Atlas is behaviour-only and is a valid, complete result
```

`confidence` rendering and the triangulation overlay are **Part-1b gates**, not
Part-1a. An implementation is a valid Part-1 ship when 1a passes; 1b is the
named 0.2.0 follow-on.

Any work that does not improve this path is secondary.

## Non-Goals (Part 1)

- Hosted services, remote SaaS ingestion, or any network dependency not
  explicitly approved.
- Target mutation outside approved Portolan outputs.
- Replacing coding-agent harnesses as the first-run client.
- Live fleet indexing, drift detection, concurrent multi-agent navigation (Part 2).
- Autodiscovery from a single URL with no named anchors.
- A separate audit product. Triangulation is a layer, not a product.
