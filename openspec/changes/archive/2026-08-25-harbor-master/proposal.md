## Why

Portolan v3 surveys when the Governor asks. The Governor wants the product
to propose expeditions itself: drift accumulates silently after every
source edit, gaps stay unsurveyed, new repos land — and today nothing
surfaces that until someone remembers to ask. Proposals must be computed
from deterministic chart state, not imagined by the model, or the trust
spine breaks.

## What Changes

- Add the Harbor Master: a deterministic expedition-proposal engine over
  the live Chart.
- New tool `expeditions.propose` — a ranked queue built from exactly three
  inputs: pending-correction drift, recorded gaps, and landscape changes
  since the last survey snapshot; every proposal carries evidence anchors
  and a scope estimate.
- New tool `expeditions.decide` — records the Governor's decision
  (accepted / declined); a declined proposal is not re-proposed unchanged.
- Expedition history (append-only) and a survey-time landscape snapshot
  under `<target>/.portolan/harbor/`.
- The skill surfaces the queue in chat at session start; acceptance is one
  phrase.
- Scheduling/watch behavior becomes an explicit setting, off by default;
  Portolan ships no daemon — a headless propose CLI serves any external
  scheduler, chat-formatted.

## Capabilities

### New Capabilities

- `harbor`: the expedition-proposal contract — deterministic queue inputs,
  evidence and scope on every proposal, survey snapshot semantics,
  decision history with refusal respect, chat surfacing at session start,
  and the off-by-default scheduling setting.

### Modified Capabilities

- `harness`: the served toolset grows from nine to eleven tools
  (`expeditions.propose`, `expeditions.decide`); the completeness
  requirement's tool list is updated.

## Impact

- New code: a harbor module in `core/` (proposals, snapshot, history,
  settings), two registry entries, a headless CLI.
- Skill update: propose-at-session-start behavior and one-phrase acceptance.
- Tests that assert the nine-tool surface must track the new count.
- No changes to the chart ontology, soundings, or the sea-trial gate.
