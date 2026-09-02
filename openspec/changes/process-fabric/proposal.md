## Why

The repo is governed by two operating systems that were installed side by
side but never assembled: the OpenSpec cycle (product behavior changes) and
the Portolan province (this repo as a charted target with its harbor queue).
Both claim the session start, neither names the hand-offs between them, and
the routing between the two kinds of work is nowhere written down. The drift
is already visible: a merge silently creates chart drift, an expedition that
finds a product danger has no defined route back into a change, and the
Governor gets two uncoordinated briefings.

## What Changes

- New `docs/workflow.md` — the assembled operating protocol, built from
  rules and pointers, never a manual:
  - J1: the unified session-start briefing — defers to the installer-owned
    harbor block in `AGENTS.md` (proposals first), appends the OpenSpec
    state (`openspec list --json`), one decision round;
  - J4: the routing rule — product behavior → OpenSpec cycle, chart and
    archive state → expedition — with the expedition→change hand-off
    (danger found in product code → Governor's verdict → `/opsx:explore`)
    as its worked example;
  - the merge-to-repair loop as one line with cross-references
    (`docs/engineering.md` §4, `adapters/README.md`);
  - one new role fact: the Cartographer is the main agent's stance
    (`skill/SKILL.md`), not a subagent role;
  - the night watch as a single reference line to `adapters/README.md`
    ("The night watch").
- `AGENTS.md`: the hand-written OpenSpec workflow section collapses into
  brief rules plus a pointer to `docs/workflow.md` (the
  `docs/engineering.md` pattern). The marker-delimited harbor block is
  installer-owned (`adapters/opencode/install.ts`) and is not touched.

## Capabilities

### New Capabilities

- (none — this change alters no served behavior)

### Modified Capabilities

- (none — pure process/docs; `skip_specs: true` is set in `.openspec.yaml`)

## Impact

- `docs/workflow.md` (new), `AGENTS.md` (edited strictly outside the
  installer-owned block). No product code, no specs, no tools, no adapters.
  The harness surface (`~/.zcode/agents/`, `skill/SKILL.md`) is deliberately
  untouched: global roles already cover the cycle, and SKILL.md must stay
  target-generic.
