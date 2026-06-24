# Cold-Reader Check + Known Limitations (Gate 5)

Gate 5 requires: cold-reader check passes; live/local browser screenshot set
exists; known limitations are short and concrete; no maintainer narration
required to understand the first screen.

## Cold-reader check

**Method**: the Overview screen (default route `#/overview`) was evaluated
against the cold-reader criterion — can a person unfamiliar with Portolan
understand what exists, why it matters, and where to click, with no narration?

**Screenshot evidence**: `docs/captain-atlas/viewer-screenshots/overview.png`
(wide desktop 1600×1000).

### What the cold reader sees on first paint (Overview)

1. **Target identity** — the panel title names the inspected target root, with
   the root path underneath in monospace. Answers "what did Portolan inspect?"
2. **Metric strip** — six cards: Target, Components, Relationships, Findings,
   Surfaces, Unknowns. Answers "how big is this estate?" at a glance.
3. **Main components** — the highest-activity components as cards, each with a
   lifecycle badge, C4 family, and evidence dot. Answers "what matters most?"
4. **Role of this target** — one prose line naming the integrator/platform.
5. **Important relationships** — component→component chips.
6. **What is risky or suspicious** — finding chips.
7. **What is missing or unknown** — honest gap list with evidence dots
   (amber = unknown).
8. **What to click next** — five explicit routes (Components, C4, Map, Risks,
   Surfaces).

### Cold-reader verdict

- **No maintainer narration required**: every section is self-labeled with a
  plain-English kicker; the evidence-dot legend is implicit (source=blue,
  metadata=lavender, gap=amber, risk=coral).
- **Every card is clickable** to a dossier that explains why the object exists.
- **Honest states visible**: unknowns and not-assessed areas appear on the first
  screen, not hidden.

**Verdict: PASS.**

## Browser screenshot set

Wide-desktop (1600×1000) screenshots captured for every primary view:

| File | View |
|------|------|
| `viewer-screenshots/overview.png` | Overview (default) |
| `viewer-screenshots/c4-families.png` | C4 → Families |
| `viewer-screenshots/c4-components-data-systems.png` | C4 → Components (selected family) |
| `viewer-screenshots/map.png` | Map (meaningful components only) |
| `viewer-screenshots/components.png` | Components list |
| `viewer-screenshots/risks.png` | Risks (findings grouped by component) |
| `viewer-screenshots/surfaces.png` | Surfaces (by type) |
| `viewer-screenshots/dossier-sqoop.png` | Apache Sqoop dossier (retired/legacy regression) |

## Real gaps (fixed)

These were genuine defects introduced in the first UI pass; both are now fixed
and re-verified by browser probe:

- ~~**Map relationship list capped at 40**~~ — FIXED: the Map relationship list
  now renders every relationship with an honest count in the section header
  (e.g. "RELATIONSHIPS (24)"). Browser probe confirms all 24 chips render.
- ~~**Search filtered only the Components view**~~ — FIXED: there is now a
  dedicated `#/search` view that matches across **all object kinds**
  (components, repositories, surfaces, relationships, findings, unknowns) per
  Feature 9. Browser probe: "sqoop" returns component + surface + relationship
  results; "mailing" returns 2 mailing-list surfaces.

## Honest design boundaries (NOT defects — these are spec compliance / out-of-scope)

These are recorded here so a cold reader does not mistake spec-mandated behavior
for missing features:

- **Dependency graph unknown without a dependency producer**: when no
  `syft`/CycloneDX producer runs, the dependency topology is `gap-deps`
  (unknown). This is **required** by the spec: "Unknown is not failure; hiding
  unknowns is failure." The gap is surfaced, not hidden.
- **C4 is a role-based lens, not observed runtime topology**: the spec
  (line 195) explicitly forbids claiming runtime truth Portolan did not
  observe. Components with no role signal are classified `unknown` by design.
- **Retired-component detection is metadata-driven**: a component is marked
  retired only when the corpus/bundle declares `lifecycle: retired`. Inferring
  retirement from source alone would be the unsupported claim the spec bans.
- **No mobile layout**: the spec states "mobile is not a priority." The UI is
  desktop-first; the minimal `@media` block is for legibility, not full mobile.
- **Single-target scope**: one scan covers one target root. Cross-target
  federation is out of scope (spec: "hosted services; remote SaaS ingestion"
  are out of scope).
