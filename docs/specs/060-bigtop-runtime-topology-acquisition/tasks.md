# Tasks: Bigtop Runtime Topology Acquisition

## Phase 1: Setup

- [x] T001 Create feature branch `codex/060-bigtop-runtime-topology-acquisition`
- [x] T002 Update `.specify/feature.json`
- [x] T003 Update AGENTS.md SpecKit pointer
- [x] T004 Update backlog and add initial spec/plan/tasks
- [x] T005 Record PR #37 status reconstruction and stale-status fix

## Phase 2: Runtime Probes

- [x] T006 Probe `selection.json` and existing Portolan runtime artifacts
- [x] T007 Probe Docker containers/images/networks read-only
- [x] T008 Probe Kubernetes contexts/namespaces/pods/services read-only
- [x] T009 Probe local processes for Bigtop-related runtime names read-only
- [x] T010 Classify runtime topology as `runtime-visible`, `not_assessed`, or `cannot_verify`

## Phase 3: Cursor Stress

- [x] T011 Build Cursor + Portolan runtime-boundary prompt
- [x] T012 Run Cursor stress and record output, including adversarial boundary prompts
- [x] T013 Score without upgrading static evidence or unrelated runtime state

## Final Phase

- [x] T014 Run local verification
- [x] T015 Run independent review lanes and record disposition
- [x] T016 Create or update PR and readiness closeout
