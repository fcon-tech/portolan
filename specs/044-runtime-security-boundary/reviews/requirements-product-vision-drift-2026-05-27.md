# Requirements And Product Vision Drift Review

Date: 2026-05-27
Spec: `specs/044-runtime-security-boundary/`
Branch: `codex/044-runtime-security-boundary-delivery`

## Decision Gate

- Simpler/Faster: implement the smallest runtime/security boundary slice:
  document the local runtime observation contract, validate it through the
  existing black-box runtime path, and add focused safety tests/docs. Do not add
  observability integrations, daemons, network calls, credentials, or hosted
  indexes.
- Blocking Edge Cases: malformed runtime JSON, partial observations, runtime
  subjects not visible in source, prompt-like text in artifacts, secret-looking
  config values, symlink/path escapes, and future MCP/query exposure must stay
  explicit instead of becoming success.
- Existing Open Source: observability systems and security scanners remain
  external producers. This slice only defines Portolan's local input contract
  and safety boundary; no dependency is justified.

## Requirements Drift

| Surface | Current State | Drift Decision |
| --- | --- | --- |
| Backlog row P5-044 | Ready for implementation; runtime observation inputs and untrusted-artifact security boundaries documented, validated, and reflected in product claims. | aligned |
| `spec.md` | Requires runtime contract, `runtime-visible` only from supplied evidence, partial topology not complete, threat model, secret/path verification, narrow product claims. | aligned |
| `plan.md` | Contract/docs plus focused tests, no new dependency, no observability integration. | aligned |
| `tasks.md` | Concrete tasks T001-T018 exist. | aligned |
| Contract | Supported JSON shape uses `from`, `to`, `kind`, `coverage`, and optional `source`. | implementation drift found |
| Current implementation | Existing black-box runtime parser accepts older `service`/`endpoint` observations and does not parse `coverage`. | accepted finding; fix before closeout |

## Product Vision Drift

- Local-first/read-only: aligned. The slice reads local JSON and writes only
  selected Portolan outputs.
- Evidence-state honesty: aligned only if runtime facts are `runtime-visible`
  from supplied observations and topology completeness remains `unknown` or
  `not_assessed` when coverage is partial.
- Complement, do not replace: aligned. Observability, DAST/SAST, secret
  scanning, and MCP hosting remain external/future surfaces.
- Agent-facing product posture: aligned. The threat model must make untrusted
  target text evidence content, not operational instruction.
- OSS composition posture: aligned. No new dependency is needed; external tools
  can later produce contract-shaped runtime observations.

## SpecKit Pipeline Drift

- `/speckit-clarify`: skipped before this implementation because the scope is
  already bounded by the spec and user request. Non-blocking assumptions are
  documented here and in the implementation disposition.
- `/speckit-plan`: satisfied by existing `plan.md`, `research.md`,
  `data-model.md`, `contracts/`, and `quickstart.md`.
- `/speckit-tasks`: satisfied by concrete `tasks.md`.
- `/speckit-analyze`: manual equivalent required before coding; recorded in
  `analyze-disposition-2026-05-27.md`.
- `/speckit-review-disposition`: this file records the pre-implementation
  drift review; model/local slice review will be recorded after implementation.

## Findings

| ID | Severity | Finding | Disposition |
| --- | --- | --- | --- |
| R1 | major | Runtime contract and current black-box parser use different observation shapes. | accepted; update runtime parser/tests or narrow docs if implementation cannot support the contract |
| R2 | major | Runtime topology completeness can be overread if partial runtime facts are present without an explicit completeness warning. | accepted; docs/product claims and runtime docs must preserve partial coverage limits |
| R3 | major | Security boundary exists in scattered docs/tests but no product-specific threat model names prompt injection, path traversal, secret leakage, future MCP/query exposure, and stale evidence together. | accepted; add `docs/security-threat-model.md` |
| R4 | minor | Current selection/map docs do not give users a concrete runtime observation fixture path. | accepted; add sample fixture and quickstart evidence |

## Implementation Direction

Proceed with a conservative implementation:

1. Add documentation for the supported runtime observation contract and threat
   model.
2. Update the black-box runtime parser only as needed to accept the documented
   local JSON shape while preserving existing fixture compatibility.
3. Add focused tests for runtime evidence state, partial coverage limits,
   prompt-like content handling, secret value redaction, and output boundaries
   where current tests are insufficient.
4. Keep full runtime topology, live telemetry, broad security certification,
   and MCP exposure as `not_assessed` or future work.

## Verification State

- verified: backlog/spec/plan/tasks were inspected on branch
  `codex/044-runtime-security-boundary-delivery`.
- not_assessed: model review lanes, full baseline checks, and PR/GitHub state
  are not assessed at pre-implementation time.
