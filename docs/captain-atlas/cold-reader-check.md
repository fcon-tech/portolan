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

## Known limitations (short and concrete)

1. **Dependency graph unknown without Syft**: when the `syft`/CycloneDX producer
   is not installed or skipped (`--core-only --producers config,ctags`), the
   dependency topology is recorded as `gap-deps` (unknown), not assessed. This
   is honest, not a bug.
2. **C4 is a role-based lens, not observed runtime topology**: family assignment
   is deterministic from component role/kind metadata. Components with no role
   signal are classified `unknown` and grouped under "Unclassified."
3. **Map relationship list is capped at 40**: surplus relationships are hidden
   silently in the map edge list (use the Overview "Important relationships" or
   the relationship dossier for the full set).
4. **Search filters the Components view only**: global search does not yet
   filter Surfaces or Findings in-place.
5. **No mobile layout**: the UI is desktop-first by spec ("mobile is not a
   priority"). The `@media (max-width: 720px)` block is minimal.
6. **Single-target scope**: one scan covers one target root; cross-target
   federation is out of scope for this spec.
7. **Retired-component detection is metadata-driven**: a component is marked
   retired only when the corpus manifest / bundle declares `lifecycle: retired`.
   Source-only targets without a corpus manifest cannot infer retirement.
