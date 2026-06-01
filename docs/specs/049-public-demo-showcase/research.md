# Research: Public Demo Showcase

## Decision Gate

### Simpler/Faster

Start with a reproducible `docs/demo.md` and optional checked-in sample outputs.
Do not build a website, video, or interactive UI until the text demo and
artifact bundle are safe and useful.

### Blocking Edge Cases

- Demo outputs can leak absolute local paths or private context.
- A demo can make Portolan look like a readiness gate if unknowns are hidden.
- The Bigtop/Cursor story is valuable but narrow and must not become a broad
  benchmark claim.
- External OSS demo targets introduce license, clone, network, and freshness
  concerns.

### Existing Open Source

- Portolan's own CLI artifacts are the primary demo asset.
- Asciinema or VHS may be useful later for terminal recordings, but recordings
  are secondary to reproducible commands.
- GitHub Pages or a docs site is deferred until the repository has a reliable
  demo story and release path.

## Decisions

### D-001 - Reproducible demo before website

**Decision**: Deliver `docs/demo.md` and optional `docs/test-corpora/apache-bigtop/examples`
artifacts before a public site.

**Rejected Alternatives**: Build a landing page first; publish only a blog-style
case study; rely on screenshots.

**Why Now**: The product is an agent evidence toolbox; artifacts are the proof.

**Reversibility**: High. A site can later wrap the demo.

**Risk If Wrong**: The public story may look less polished for the first launch.

**Confidence**: high

### D-002 - Apache Bigtop is the public demo target

**Decision**: Use Apache Bigtop as the public demo target.

**Rejected Alternatives**: Use Portolan self-map; use a tiny fixture as the
main demo; use a private local landscape; clone a random public repo during
docs.

**Why Now**: Bigtop is already the strongest stress and case-study target in
Portolan's validation history.

**Reversibility**: Medium. Changing demo target later invalidates screenshots
and case-study copy.

**Risk If Wrong**: Private data leakage or unreproducible demo.

**Confidence**: high

### D-004 - Publish runbook plus redacted excerpts first

**Decision**: For the first public showcase, commit the runbook and small
redacted excerpts only, with freshness and privacy review. Generate full outputs
locally during demo validation, but do not commit the full Bigtop bundle in the
first showcase slice.

**Rejected Alternatives**: Commit full map/context outputs immediately; publish
screenshots only; avoid artifacts entirely.

**Why Now**: Bigtop output can be large, stale, path-heavy, and difficult to
review safely.

**Reversibility**: High. Full artifacts can be added after size/privacy review.

**Risk If Wrong**: The demo may be less inspectable before a user runs it.

**Confidence**: high

### D-005 - Defer screenshots and terminal recordings

**Decision**: Keep screenshots and terminal recordings out of scope for the
first public showcase slice.

**Rejected Alternatives**: Add a terminal recording immediately; use screenshots
as the primary demo; create a video before the runbook is stable.

**Why Now**: Text artifacts are easier to inspect, diff, and privacy-review.

**Reversibility**: High.

**Risk If Wrong**: The first showcase is less visually rich.

**Confidence**: high

### D-003 - Case study uses product-claims as the source

**Decision**: Public case-study copy must be derived from `docs/product-claims.md`.

**Rejected Alternatives**: Write a stronger benchmark narrative from raw review
files; claim UI Cursor behavior; generalize Bigtop evidence.

**Why Now**: Popularization pressure makes claim drift likely.

**Reversibility**: High before publication, medium after external sharing.

**Risk If Wrong**: Public trust and product positioning degrade.

**Confidence**: high
