## Context

See proposal.md — Why. Current facts this design builds on:

- `adapters/opencode/install.ts` resolves `REPO_ROOT` at import time and
  writes `[<bun>, <repo>/core/src/server/main.ts, --target, …]` — it only
  works from a clone (verified against opencode 1.18.21's `opencode mcp
  add`; JSONC text surgery keeps user comments, keep that mechanism).
- The repo already has a release discipline: merge-prep commits bump
  `@portolan/core` (now 0.4.3) and update CHANGELOG; CI must be green
  before merge.
- Registry fit details — the official MCP Registry manifest schema, the
  name convention, domain verification, npm trusted publishing for a Bun
  project — are `unsurveyed` until this cycle's explore stage reads the
  primaries. Decisions below name the assumption where one rests on it.

## Goals / Non-Goals

Goals:

- A stranger's agent can install and launch Portolan from a registry with
  one phrase, no clone.
- Every published artifact is anchored to a reviewed commit (versioned
  manifest in-repo, publish gated on the version-bump merge).
- The publish path holds no long-lived secrets and performs no
  account-bound action on its own.

Non-Goals:

- Plugin marketplaces and pi/omp registries (next cycle, own explore).
- Telemetry or download analytics of any kind.
- Bundling ripgrep/ctags (wrap, don't build — MANIFEST).
- Any change to the fourteen tools, the Chart, or the harbor's behavior.

## Explore findings (task 1.1/1.2 — primaries, 2026-09-02)

- Official MCP Registry: `server.json` schema published at
  `https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json`;
  required fields `name`, `description`, `version`; name is reverse-DNS,
  exactly one `/`. GitHub-based auth requires
  `io.github.<username|orgname>/*` → our name:
  `io.github.fcon-tech/portolan`; the Governor must be an Owner of the
  fcon-tech GitHub org. Publication via the `mcp-publisher` CLI
  (`init/login/publish`, `login github` device flow; DNS TXT or
  `.well-known` as alternatives). The registry is in **preview**
  (breaking changes possible — accepted risk, listing is
  re-publishable). npm impersonation guard: `package.json` must carry
  `mcpName: "io.github.fcon-tech/portolan"` matching server.json.
  Versions are immutable per publication; align server.json version with
  the package version (our sync gate enforces it).
- npm: trusted publishing (OIDC) is GA (since 2025-07-31) but the publish
  step needs Node ≥22.14.0 + npm ≥11.5.1 (GitHub-hosted runners have
  both; Bun is fine for everything except that step). Trusted publisher
  is configured once in the package's npm settings by the Governor
  (chicken-and-egg: package must exist first — the first release is
  manual by design). Duplicate name@version is refused by the registry.
  Org `portolan` unavailable (see decision 1).

## Decisions

1. **Monopackage under npm, scope `@fcon-tech` — fallback triggered.** The
   preferred org `portolan` was found taken (org profile live at
   npmjs.com/org/portolan, 0 packages; registry probe
   `/-/org/portolan/package` → 200 — `measured`, 2026-09-02), so the
   Governor-approved fallback applies: package `@fcon-tech/portolan`,
   carrying core + skill + adapters. Split packages rejected, YAGNI. The
   unscoped npm name `portolan` is also taken (wighawag's UI-flow format,
   AGPL) — therefore `bunx portolan` would install a stranger's package:
   every launch line uses
   `bunx --package @fcon-tech/portolan portolan serve …` (spec amended to
   match). Creating the `fcon-tech` npm org (or confirming it exists) is
   a Governor runbook step. *Verified at explore (tasks 1.1/1.2).*

2. **Single bin `portolan` with subcommands.** Alternatives: separate
   bins per CLI — more surface, no consumer; no bins (document raw
   `bunx --package …` incantations) — hostile to a stranger's agent. One
   dispatcher keeps the launch line a fixed shape across harnesses.

3. **`server.json` committed at repo root, versioned by the release-prep
   commit.** Alternative: generate at publish time — the artifact would
   not be reviewable before it goes public. Committed keeps the "every
   fact carries an anchor" property: the registry entry anchors to a
   merge commit. CI owns schema validation and version-sync checking;
   the generator/check is a small deterministic script (arithmetic over
   embedded bytes — Chart discipline applies to our own artifacts too).

4. **Publish = version-gated CI job on merge, trusted publishing (OIDC).
   ** Alternatives: manual local publish — forgettable, depends on one
   machine; manual workflow_dispatch — one more human step for no added
   safety (the version bump already is the Governor's decision, taken in
   review). The version bump at merge is the durable authorization.
   *Assumption:* npm trusted publishing setup works for a Bun-built,
   Bun-run package — verified at explore; if not, fallback is a
   granular npm token in a GitHub secret (never in the repo).

5. **Installer stays JSONC text surgery; only the launch line changes**
   to `["bunx", "portolan", "serve", "--target", <province>]` resolved so
   it does not depend on `REPO_ROOT`. Skill delivery from node_modules:
   the installer prints/copies the skill path inside the installed
   package — exact mechanism (copy vs reference) settled in tasks after
   exploring how pi/omp/opencode resolve skill directories.
   *Assumption to verify at explore.*

6. **First published version `0.4.4`** (Governor's call in the grill):
   continuity with the internal counter; the archive of openspec changes
   and the CHANGELOG stay one version line.

## Risks / Trade-offs

- [Registry requirements differ from assumptions] → explore stage reads
  primaries before specs/tasks are finalized; assumptions tagged above
  are re-checked; spec deltas amended openly if reality disagrees.
- [npm org `portolan` unavailable] → fallback `@fcon-tech/portolan`,
  named in the proposal; one-line change.
- [Accidental publish (version bumped carelessly)] → publish only on
  green CI, exactly-once per version (npm refuses duplicates — a free
  guard); Governor's blocked-steps gate the very first release anyway.
- [npm down / registry outage at merge time] → publish job is
  retryable; merge stays green-checked independently of publish success;
  a failed publish is a loud CI failure, not a silent gap.
- [Skill path in node_modules is fragile across harnesses] → the
  installer is the single place that resolves it; harness differences
  stay in adapters, per the harness spec's boundary. The copy-vs-reference
  decision is in-cycle and must be made against how each target harness
  actually resolves skill directories — explore before tasks.
- [Assumed registry mechanics (name convention, verification, trusted
  publishing for a Bun package)] → every assumption is re-checked against
  primaries in explore before specs/tasks are finalized; the OIDC choice
  is a design preference, not a spec promise — fallback is a granular npm
  token in a GitHub secret.

## Deferrals (nothing silent)

- Plugin marketplaces and pi/omp registry listings — next cycle with its
  own explore. Trigger: a harness maintainer asks, or the marketplace
  becomes the install bottleneck.
- npm unscoped name collision (`portolan` is taken — a UI-flow format,
  v0.1.0, `measured`): no action. Trigger: user confusion around
  `bunx portolan`.
- npm unpublish/rollback procedure — manual, Governor-owned, undocumented
  for now. Trigger: a bad publish actually happens.
- Migration of clone-based launch lines written by the old installer —
  no external users assumed. Trigger: any reported stale install.

## Migration Plan

No data migration. Rollout: (1) explore — registry primaries, org
availability, trusted publishing; (2) packaging + bin + manifest +
CI checks land behind the normal change flow; (3) Governor performs the
blocked list (org, first release 0.4.4, domain verification); (4)
installer + docs switch to the npm path; (5) subsequent merges
auto-publish per the version gate. Rollback: unpublish/deprecate on npm
is manual and Governor-owned; the repo remains the source of truth
throughout.

## Open Questions

- Exact `server.json` schema fields the registry requires beyond name and
  version (explore reads the primaries; does not change the approach).
- Whether opencode's plugin/marketplace channel would accept the same
  package untouched (explicitly deferred with the marketplaces to the
  next cycle).
