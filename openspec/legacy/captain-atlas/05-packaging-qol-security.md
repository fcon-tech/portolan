# BDD Work Package: Packaging, QoL, And Local-First Safety

> Supporting note only. For the next implementation pass,
> `07-portolan-core-product-spec.md` is the controlling specification. If this
> file conflicts with `07`, follow `07`.

## Agent Assignment

Make Portolan reliable enough that an agent can install, run, monitor, resume,
and explain it in a real target ecosystem.

## Product Question

What must exist so the first run feels like a product instead of a fragile script
chain?

## Scope

- Install route.
- Doctor/preflight.
- Dry-run plan.
- Progress and cancellation guidance.
- Resume/status/clean.
- First-run receipt.
- Local-first and read-only checks.
- Offline or corporate environment behavior.

## Out Of Scope

- Hosted SaaS.
- Credential management.
- Starting target services by default.
- Silent target mutation.

## Implementation Slice

- Owned surfaces: install route, doctor/dry-run/status/receipt contracts,
  progress semantics, and local-first safety checklist.
- First vertical slice: target-local run receipt plus status output that an
  agent can use after a completed, failed, or partial atlas build.
- Artifact: example receipt/status JSON shape with command line, versions,
  target identity, output paths, producer states, failures, warnings, and safety
  checks.
- Verify: run the install/scan path on a clean local target and prove generated
  files stay under the approved output root.
- Out of scope: credential storage, daemon behavior, target service startup, and
  network access without explicit approval.

## BDD

```gherkin
Feature: Portolan first run is operable

Scenario: Agent runs doctor before building
  Given a target ecosystem
  When the agent runs Portolan doctor
  Then the output reports target shape, writable output path, available tools, missing tools, likely scan size, and risks
  And the doctor does not mutate target source files

Scenario: Agent can show a dry-run plan
  Given the captain asks what Portolan will do
  When the agent runs dry-run
  Then Portolan lists reads, writes, tool commands, estimated outputs, network expectations, and approval-required actions
  And the captain can approve or reject the run

Scenario: Long runs show progress and partial results
  Given a large multi-repo target
  When Portolan runs longer than a short command
  Then the agent can report current phase, completed producers, failed producers, output path, and next expected step
  And partial successful output remains usable

Scenario: Receipt records the run
  Given a first run completes or fails
  When Portolan writes the receipt
  Then it records command line, versions, target identity, bundle path, app path, duration, producer states, failures, warnings, and local-first checks

Scenario: Resume and clean are safe
  Given a previous atlas bundle exists
  When the agent runs status
  Then Portolan reports whether the bundle is fresh, stale, reusable, or incompatible
  And clean removes generated Portolan outputs without deleting target source

Scenario: Local-first safety is explicit
  Given a corporate or offline environment
  When Portolan needs a tool, network, runtime capture, or external write
  Then it reports the approval-required action
  And it does not perform that action by default
```

## Deliverables

- Doctor output contract.
- Dry-run output contract.
- Receipt schema or JSON shape.
- Status/resume/clean command design.
- Safety checklist for local-first behavior.

## Acceptance

Pass when a shell-capable agent can explain, start, monitor, stop, resume, and
clean a run without needing unstated Portolan knowledge.
