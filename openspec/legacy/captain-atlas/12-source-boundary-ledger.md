# Research Control Spec: Source Boundary Ledger

> **Status:** evidence-backed research-control spec; validates only when
> acceptance passes. Not the whole Portolan roadmap and not the selected
> product-scope implementation candidate.
>
> **Authority:** `08-portolan-product-charter.md` governs product concepts.
> `10-agent-frontier-to-spec-roadmap.md` governs why this control is needed
> before more clean frontier runs can be trusted.

## Reader And Goal

Reader: a research or implementation agent preparing the next Portolan frontier
experiment.

Post-read action: generate or use a machine-readable source-boundary ledger for
a target so clean agent frontier lanes can run without forbidden source
exposure.

## Why This Spec Exists

The `portolan-self` clean-v2 lanes all contaminated through forbidden path-name
exposure before agents read forbidden file contents. The failure was not model
quality. It was process fragility: agents had to improvise denylist-safe
inventory commands in a repo containing active specs, historical docs, generated
outputs, prior agent artifacts, and dependencies.

The research harness must own this boundary before asking agents to explore.
Whether this becomes a user-visible Portolan product feature remains an open
roadmap question.

## Decision Gate

**Simpler/Faster:** for the current research loop, write one local JSON boundary
ledger plus a shell-safe inventory recipe from the target manifest. Do not
introduce a daemon, database, hosted service, or generic workflow engine.

**Blocking Edge Cases:** clean frontier runs are invalid if forbidden file
contents or forbidden path names leak. Repos frequently contain generated
artifacts, hidden agent state, old research, dependency trees, build outputs,
and active product specs beside source. Agents cannot reliably hand-roll the
right prune set under time pressure.

**Existing Open Source:** `find`, `rg`, `git ls-files`, `.gitignore`, and
language/package ignore conventions are useful inputs. They do not replace the
research boundary contract because the ledger must also encode experiment-mode
rules, allowed support files, forbidden prior research, generated atlas
artifacts, runtime/build permissions, and contamination policy.

## Output Contract

The slice must produce:

```text
boundary-ledger.json
boundary-inventory.sh
boundary-ledger.md
```

For the current research loop, the ledger lives in the run package. If later
promoted into the generated atlas bundle, that promotion needs a separate
product decision. For clean frontier lanes, copy it into each lane output
directory as:

```text
boundary-ledger-used.json
```

### `boundary-ledger.json`

Required shape:

```json
{
  "target_id": "portolan-self",
  "target_root": "/home/fall_out_bug/projects/sdp/portolan",
  "mode": "clean-frontier",
  "allowed_roots": ["."],
  "allowed_support_files": [
    "/home/fall_out_bug/projects/sdp/portolan-lab/research/agent-frontier-2026-06/target-manifests/portolan-self.json",
    "/home/fall_out_bug/projects/sdp/portolan-lab/research/agent-frontier-2026-06/brief/artifact-pack-schema.md"
  ],
  "forbidden_paths": [
    ".portolan",
    ".cursor",
    ".codex-subagents",
    "docs/captain-atlas",
    "docs/site",
    "docs/research",
    "docs/superpowers",
    "output",
    "node_modules"
  ],
  "forbidden_path_name_exposure": "contaminates",
  "forbidden_content_read": "contaminates",
  "network": "blocked",
  "builds": "blocked",
  "runtime_probes": "blocked",
  "scratch_policy": "run-directory-only",
  "inventory_command": "find ...",
  "validation_command": "..."
}
```

Rules:

- `forbidden_path_name_exposure` is one of `allowed`, `warning`,
  `contaminates`.
- For clean frontier, default is `contaminates`.
- `inventory_command` must be executable by a shell-capable agent.
- The command must not print forbidden path names when run from `target_root`.
- The ledger must preserve degraded states: `blocked`, `not_assessed`,
  `cannot_verify`.

### `boundary-inventory.sh`

The generated script must:

- run from the target root;
- list allowed files or directories only;
- avoid forbidden path names in stdout;
- write no scratch files outside the run directory;
- exit non-zero if a forbidden path appears in output;
- record command output in the run directory when invoked by an agent.

### `boundary-ledger.md`

The human-readable ledger must explain:

- what is in scope;
- what is out of scope;
- what contaminates a run;
- which runtime/build/network probes are blocked;
- how to rerun the safe inventory.

## Minimum First Target

First target:

```text
/home/fall_out_bug/projects/sdp/portolan
```

The first slice must include these forbidden paths:

- `.portolan`;
- `.cursor`;
- `.codex-subagents`;
- `docs/captain-atlas`;
- `docs/site`;
- `docs/research`;
- `docs/superpowers`;
- `output`;
- `portolan-lab`;
- `node_modules`;
- generated atlas artifacts.

The control may be target-specific first. Generalization comes after it proves
that clean lanes stay clean and after the roadmap decides whether this belongs
in the product or only in the research harness.

## BDD

```gherkin
Feature: Source boundary ledger protects clean frontier runs

Scenario: Safe inventory hides forbidden path names
  Given a target contains forbidden paths
  When the generated boundary inventory command runs
  Then stdout contains no forbidden path names
  And the command exits successfully

Scenario: Forbidden output contaminates the run
  Given a candidate inventory command prints a forbidden path name
  When the boundary validator checks the command output
  Then validation fails
  And the run is marked contaminated

Scenario: Clean frontier records its boundary
  Given an agent runs a clean frontier lane
  When it writes the required artifact pack
  Then boundary-ledger-used.json is present
  And manifest.json records the boundary ledger id

Scenario: Runtime probes remain blocked
  Given network, builds, Docker, CI, package installs, or runtime probes are not allowed
  When the boundary ledger is generated
  Then those permissions are recorded as blocked
  And agents cannot mark runtime/build status verified from source visibility
```

## Validation

Minimum validation command set:

```bash
git diff --check
jq empty boundary-ledger.json
bash boundary-inventory.sh > "$RUN_DIR/inventory.txt"
! rg -n '(^|/)(\\.portolan|\\.cursor|\\.codex-subagents|docs/captain-atlas|docs/site|docs/research|docs/superpowers|output|node_modules)(/|$)' "$RUN_DIR/inventory.txt"
```

The implementation may provide a Node validator, but it must prove the same
properties: parse, no forbidden output, run-directory-only scratch policy, and
recorded blocked runtime/build/network permissions.

## Acceptance

Pass when:

1. `boundary-ledger.json`, `boundary-inventory.sh`, and `boundary-ledger.md`
   are generated for `portolan-self`.
2. The inventory command does not print forbidden path names.
3. A low, medium, and high clean frontier prompt can use the ledger without
   path-name exposure contamination.
4. Each clean lane writes `boundary-ledger-used.json`.
5. Runtime/build/network probes remain `blocked` unless explicitly approved.

Fail when:

- the ledger allows forbidden path-name exposure in clean-frontier mode;
- agents still need to hand-roll prune logic before inventory;
- scratch files leave the run directory;
- `.portolan`, `.cursor`, `.codex-subagents`, active specs, generated output,
  prior research, or dependency directories appear in clean-lane inventory
  output;
- the result is treated as a generic scanner rather than a boundary contract.

## Handoff Prompt If This Control Is Selected

```text
Use docs/captain-atlas/12-source-boundary-ledger.md as research-control
scaffolding.

Work from:
- docs/captain-atlas/08-portolan-product-charter.md
- docs/captain-atlas/10-agent-frontier-to-spec-roadmap.md
- docs/captain-atlas/12-source-boundary-ledger.md

Target:
/home/fall_out_bug/projects/sdp/portolan

Build or use a machine-readable boundary ledger and safe inventory command for
clean agent frontier runs. The control passes only if the safe inventory does
not print forbidden path names and future clean lanes can record
boundary-ledger-used.json.
```
