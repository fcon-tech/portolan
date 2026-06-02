# Research: Clean Start Artifact Guard

## Decision: Use Guidance, Not Cleanup Mutation

Add explicit current-context and stale-artifact rules to generated guidance and
acceptance docs. Do not add a cleanup command.

**Rationale**: The observed failure was an agent reading old artifacts. A
read-only guard directly addresses the failure while preserving Portolan's
boundary.

**Alternatives considered**:

- Delete old `.portolan/stress/*` roots automatically: rejected because prior
  evidence is useful and target deletion is outside this slice.
- Add a stress-harness CLI: rejected because Portolan is not a harness and the
  current goal is navigation evidence, not UX/workflow productization.
- Leave hygiene only in spec 076: rejected because contamination affects any
  comparison lane, while 076 default execution is currently blocked.

## Decision: Treat Contamination As Non-Counting Evidence

A lane that reads forbidden artifacts is `contaminated` and must not count as a
valid baseline/comparison lane.

**Rationale**: This matches the prior stress report and avoids smoothing invalid
evidence into a degraded pass.

**Alternatives considered**:

- Mark contaminated lanes as degraded success: rejected because it permits
  overclaiming.
- Ignore contamination if the answer is useful: rejected because usefulness is
  not evidence cleanliness.
