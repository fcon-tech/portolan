# BDD Work Package: Cursor Composer First Run

## Agent Assignment

Prove or falsify that Cursor Composer can be handed Portolan and a target
ecosystem, then build the first atlas without hidden handholding.

## Product Question

Can the captain say this and get a working atlas?

```text
Here is Portolan. Here is my project root. Install it and build my atlas.
```

## Scope

- Cursor Composer is the primary harness.
- OpenCode and Codex are comparison lanes only after the Cursor lane is clear.
- The target output should default to `<target-root>/.portolan/atlas`.
- The agent should ask at most two clarifying questions before running.

## Out Of Scope

- New analysis producers.
- New graph UI design.
- Broad harness matrix claims.
- Manual Portolan-author steering during the run.

## Implementation Slice

- Owned surfaces: Cursor first-run prompt, install instructions, run transcript,
  and scorecard.
- First vertical slice: Cursor starts from `PORTOLAN` and `TARGET_ROOT`, finds
  this package, installs target-local wrappers, builds a usable atlas, and
  reports the bundle plus viewer launch path.
- Artifact: dated scorecard with prompt, commands, manual interventions,
  runtime, bundle path, app path, first useful finding, and blockers.
- Verify: replay the prompt on one large local target; mark unavailable Cursor
  UI or CLI behavior as `not_assessed`, not success.
- Out of scope: target-specific expected findings and broad claims about every
  Cursor mode.

## BDD

```gherkin
Feature: Cursor Composer builds the first atlas

Scenario: Cursor discovers the first-run instructions
  Given a clean target ecosystem
  And a Portolan URL or local checkout path
  When the captain asks Cursor Composer to install Portolan and build an atlas
  Then Cursor finds the captain-atlas instructions
  And Cursor identifies the target root and default bundle path
  And Cursor asks no more than two necessary clarifying questions

Scenario: Cursor installs target-local Portolan commands
  Given the captain approves the install location
  When Cursor runs the install path
  Then target-local Portolan commands exist under the target root
  And the target repository source files are not modified except approved Portolan metadata
  And the command path does not depend on a private local checkout after install

Scenario: Cursor runs the atlas build
  Given target-local Portolan commands are installed
  When Cursor starts the atlas build
  Then progress is visible during long work
  And failures are reported with next actions
  And the result includes a bundle path and viewer launch path

Scenario: Cursor opens or hands off the atlas app
  Given the atlas bundle exists
  When Cursor finishes the run
  Then Cursor provides a local app URL or exact launch command
  And Cursor summarizes what the captain can inspect first
  And Cursor does not claim unsupported landscape facts before reading the bundle

Scenario: Cursor first-run scorecard is recorded
  Given the run completes or fails
  When the agent writes its result
  Then the scorecard records manual interventions, commands, runtime, failures, bundle path, app path, and first user-visible value
```

## Deliverables

- First-run prompt for Cursor Composer.
- Cursor run scorecard template.
- Gap list grouped by install, instructions, command shape, scan runtime,
  viewer launch, and answer quality.
- Recommended product fixes, ordered by captain impact.

## Acceptance

Pass only if Cursor Composer can complete the first run on Bigtop or another
large local ecosystem without target-specific hidden choreography.

If Cursor cannot do this, classify the blocker:

- unclear instructions;
- install fragility;
- permissions;
- long-running scan UX;
- missing command;
- weak generated atlas;
- weak agent answer;
- other.
