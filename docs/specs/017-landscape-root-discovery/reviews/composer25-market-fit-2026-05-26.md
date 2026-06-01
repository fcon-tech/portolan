# Composer 2.5 Market-Fit Check

Date: 2026-05-26

Scope: product-fit evidence after the user challenged the claim that Cursor
does not know where to look first in a large ecosystem.

Status: market-fit hypothesis narrowed; broad Cursor-replacement thesis failed.

## Inputs

- Cursor Agent CLI: `/home/fall_out_bug/.local/bin/agent`
- Model: `composer-2.5`
- Portolan root: `/home/fall_out_bug/projects/sdp/portolan`
- Bigtop target root: `/home/fall_out_bug/projects/bigtop-landscape/repos`
- Prepared selection path explicitly forbidden for blind runs:
  `/home/fall_out_bug/projects/bigtop-landscape/selection.json`

## Experiments

| ID | Prompt shape | Output | Result |
| --- | --- | --- | --- |
| H1 | Cursor alone maps `/home/fall_out_bug/projects/bigtop-landscape/repos` without Portolan or selection | `/tmp/portolan-agent-verification/composer25-cursor-alone-h1.txt` | Cursor produced a useful CTO-grade first-pass map. It identified the Bigtop integration repo, BOM, package specs, Puppet/deployment surfaces, smoke tests, component roles, BOM-vs-source version drift, and Oozie/Sqoop as legacy-adjacent. |
| H2 | Cursor runs current Portolan with only `Portolan`, `Target`, and `Output`; no selection | `/tmp/portolan-agent-verification/composer25-portolan-h2.txt` and `/tmp/portolan-agent-verification/composer25-portolan-h2-run/` | Portolan completed, but `map --root` collapsed the 18 sibling checkouts into one repository coverage record named `root`. |
| H3 | Cursor reviews H1/H2 plus current Portolan artifacts for product fit | `/tmp/portolan-agent-verification/composer25-market-fit-h3.txt` | The defensible thesis narrowed to a prepared inventory/gap-ledger envelope for agent pipelines, not a general Cursor competitor. |
| H4 | Cursor alone maps `/home/fall_out_bug/projects/vibe_coding` as a real non-Bigtop folder-of-repos with shallow inspection only | `/tmp/portolan-agent-verification/composer25-control-vibecoding-cursor-alone-h4.txt` | Cursor produced a useful cluster map across SDP, agent harnesses, orchestration tools, Faust workspaces, demos, and root harness overlays. It also left shell-checkable uncertainty and some wrong details. |
| H5 | Cursor runs current Portolan against `/home/fall_out_bug/projects/vibe_coding` with a 240-second command timeout and no selection | `/tmp/portolan-agent-verification/composer25-control-vibecoding-portolan-h5.txt` and `/tmp/portolan-agent-verification/composer25-control-vibecoding-portolan-h5-run/` | Portolan completed in the timeout, but collapsed the folder into one repository coverage record and emitted a 672 MB graph for one synthetic root. |
| H6 | Cursor synthesizes market fit after H1-H5 evidence | `/tmp/portolan-agent-verification/composer25-market-fit-h6.txt` | The surviving current fit is prepared multi-repo inventory/gap ledger for agent pipelines. Messy-folder preflight is a future thesis until child-repo discovery and inventory-first UX ship. |

## Verified Local Checks

- `agent models` lists `composer-2.5`.
- `/home/fall_out_bug/projects/bigtop-landscape/repos` contains 18 Git
  repositories with `.git` directories.
- H2 `coverage.json` contains one record:
  `id: root`, `kind: repository`.
- H2 `graph.json` contains one repository node, 232 package nodes, and 147813
  unknown nodes.
- H2 `findings.jsonl` contains 10 findings.
- `/home/fall_out_bug/projects/vibe_coding` contains 30 Git roots at max depth
  two when both `.git` directories and `.git` files are counted.
- H5 `coverage.json` contains one record:
  `id: root`, `kind: repository`.
- H5 `map.md` reports 756764 nodes, 828299 edges, 33 findings, and one coverage
  record.
- H5 `graph.json` is 672719833 bytes.

## Findings

### F1: Cursor-Alone Orientation Is Better Than Previously Claimed

Status: verified by H1, with caveats.

The claim "Cursor does not know where to look first" is not supported in the
Bigtop run. Cursor found strong domain entrypoints without Portolan:

- `apache-bigtop-repo/README.md`
- `apache-bigtop-repo/bigtop.bom`
- RPM spec directories
- Puppet deployment data
- smoke-test surfaces
- root build files in sibling repositories

This invalidates a broad product pitch that Portolan is needed merely because
Cursor cannot orient itself.

### F2: Cursor Narrative Is Useful But Not Reliably Correct

Status: verified by H1 versus local shell checks.

H1 stated that no `.git` metadata was found under the target. Local inspection
found 18 `.git` directories. H1 also reported "19 sibling project directories"
while the local Git checkout count is 18.

This supports a narrower product need: not "Cursor cannot map", but "Cursor
maps by narrative and can include unchecked false facts unless another surface
forces local inventory checks".

### F3: Current Portolan Blind Path Is Not Market-Fit For Bigtop

Status: verified by H2 artifacts.

The current blind path uses `portolan map --root <target>`. Against the Bigtop
`repos/` directory it produces the required five artifacts, but maps only one
repository:

- coverage records: 1
- repository graph nodes: 1
- unknown graph nodes: 147813

This is worse than Cursor-alone orientation for the actual first user question.
P1-017 is therefore a product blocker, not polish.

### F4: Current Portolan Adds Value Only On Prepared Inventory Runs

Status: verified by prior selection-run artifacts and H3 synthesis.

The selection-backed Bigtop run provides a structured coverage matrix and
manifest reconciliation that Cursor prose does not provide by default. That
value depends on a prepared selection/manifest and is not blind-first UX.

### F5: Non-Bigtop Control Repeats The Same Pattern

Status: verified by H4/H5, with target-mutation status not assessed because no
pre-run dirty-state snapshot was taken for every control repository.

`/home/fall_out_bug/projects/vibe_coding` is a real local folder of projects,
not a Bigtop-specific fixture. Cursor-alone produced a useful shallow
orientation over SDP, agent-harness, orchestration, Faust, demo, and harness
overlay clusters. It also made or preserved shell-checkable uncertainty:

- local shell found 30 Git roots at max depth two when `.git` files are counted;
- Cursor reported useful clusters but had uncertainty around worktree/gitfile
  cases such as `faust-workspace-design` and `worktrees/*`;
- direct shell checks resolved some of those cases more precisely than the
  narrative.

Current Portolan on the same root completed under a 240-second timeout, but
collapsed the folder into one `root` coverage record and emitted a 672 MB graph.
This confirms that P1-017 is not Bigtop-specific: normal local project folders
also need bounded child-repository discovery before Portolan can be the default
agent preflight.

## Market-Fit Thesis

Current narrow thesis:

Portolan is a local, read-only inventory and gap-ledger generator for
pre-curated multi-repo landscapes. It is useful when agent workflows need
schema-stable coverage artifacts and explicit `not_assessed` gaps before making
claims. It is not currently a better way than Cursor to understand a large
polyglot ecosystem from a folder of clones.

Revised after the non-Bigtop control:

The narrow fit is stronger for **messy local project folders** than for a
prepared enterprise catalog: Cursor can orient from names and shallow files, but
it leaves repo/worktree identity, dirty state, ignored scratch dirs, and
coverage boundaries as prose or uncertainty. Portolan can own that preflight
surface only after it discovers child repositories and emits a small inventory
artifact before deep graph generation.

Final synthesis after H6:

Current market fit is real only for **prepared** landscapes: users who already
have, or can cheaply generate, a selection/manifest and need a machine-readable
inventory/gap ledger before agent automation. The messy-folder story is more
compelling as a customer problem, but it is **not current product fit** until
P1-017 and an inventory-first path exist.

Future thesis, contingent on implementation:

If landscape root discovery and polyglot importers ship, Portolan can become a
preflight CLI that turns a normal folder of cloned repositories into a stable
local map bundle for Cursor, Codex, Claude, OpenCode, or other agents. Cursor
remains the reasoning surface; Portolan supplies the local inventory and gap
contract.

## Existing Tool Boundary

This fit is intentionally narrower than adjacent tools:

- Cursor/Composer remains the interactive reasoning and coding surface. The
  composer-2.5 run was good enough for first-pass Bigtop orientation, so
  Portolan should not be positioned as "Cursor that understands repos better".
- Sourcegraph already positions itself around code search, code intelligence,
  cross-repository understanding, Cody, Deep Search, insights, and batch
  changes. Portolan should not become a broad code-intelligence platform.
- Backstage already owns the durable service-catalog/developer-portal pattern
  where teams maintain component metadata in source control. Portolan should
  not become an enterprise catalog or ownership system.

The viable lane is therefore local preflight for agents: discover or consume a
bounded local landscape, emit a schema-stable inventory and gap ledger, and let
the agent reason on top of it.

## "Why Portolan If I Already Have Cursor?"

Use Cursor to think, search, explain, and edit. Use Portolan when the workflow
needs a fixed local inventory contract before automated or multi-step agent
runs, especially across many repositories. Cursor can produce a strong first
map, but its output is narrative and can contain shell-falsifiable errors.
Portolan should make later steps gate on local artifacts such as coverage and
gap records instead of trusting one model pass. Today that requires a prepared
selection; tomorrow it should work from a normal parent folder.

## Current Wedge ICP

- Operators of agent or automation pipelines that run over a bounded local
  multi-repo landscape.
- Teams willing to maintain or generate a selection/manifest before running
  agent workflows.
- Users who value explicit `not_assessed` gaps more than a confident
  architecture narrative.

Not current ICP:

- Single-repo exploratory users.
- Users asking Cursor to explain a codebase interactively.
- Teams needing enterprise code search or service catalog ownership.
- Users pointing at a raw folder of clones and expecting Portolan to discover
  the landscape today.

## Required Bets

1. Implement P1-017 so `map --root <ecosystem>` discovers child Git
   repositories and does not collapse a directory of checkouts into one root.
   Include `.git` file worktrees, not only `.git` directories.
2. Add or import polyglot relationship signals for Bigtop-class systems:
   Maven, Gradle, BOM, package specs, Puppet, Python packaging, and runtime
   manifests.
3. Reduce or demote unknown-node graph noise; large graph size is not value if
   most nodes are semantically opaque.
4. Add a fast `inventory` or pre-graph phase for messy local project folders:
   child repo list, gitdir/gitfile/worktree classification, skip rules, dirty
   state status, and target-boundary warnings.
5. Score A/B agent runs with and without Portolan artifacts on false repo
   counts, false completeness, missed legacy components, and unsupported
   architecture claims.
6. Keep positioning explicit: Portolan complements Cursor as a preflight and
   inventory/gap contract. It is not a coding harness, readiness gate, or
   general enterprise catalog replacement.

## Decision

- Decision: continue toward P1-017 and polyglot importer bets before claiming
  Bigtop blind acceptance or broad market fit.
- Rejected alternative: sell Portolan as "Cursor but better at understanding".
  The composer-2.5 Bigtop run does not support that.
- Why now: Bigtop has enough real surface area to falsify vague positioning.
- Reversibility: high; this note records evidence and does not change behavior.
- Risk if wrong: product work may overfocus on agent-pipeline inventory instead
  of a stronger customer segment.
- Confidence: medium for the falsification, low-to-medium for the narrowed
  market-fit thesis until tested outside Bigtop.
