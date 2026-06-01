# Contract: Portolan Quality Boundary

## Required Quality Documents

The implementation must provide or update:

- product quality boundary;
- maturity matrix;
- report-quality contract;
- claim wording or claim-check route.

## Canonical Guarantee Shape

Each guarantee must state:

- what is guaranteed;
- required inputs;
- mechanism;
- verification command or artifact;
- limitations.

## Canonical Non-Guarantee Shape

Each non-guarantee must state:

- unsupported claim;
- why it is unsupported;
- what evidence would be required to support it;
- how reports should label the surface today.

## Report Quality Minimum

A report-quality check passes only when:

- every required section is present;
- every positive claim has a local evidence reference;
- weak states from the evidence bundle remain visible;
- unsupported positive claims are zero;
- optional producer absence is visible as a gap or next action.

## Maturity Classes

- `stable-first-run`: safe to put in first-run docs and agent instructions.
- `tooling`: useful for operators or maintainers, not the first-run promise.
- `local-only`: development, review, or demo helper not published as product
  surface.
- `experimental`: implemented or planned exploration with limited guarantees.
- `future`: product direction or reserved namespace without implementation.

## Harness Readiness Rule

Harness adapter presence and runtime readiness are separate. A Cursor,
OpenCode, Codex, Pi, or other adapter file may be `verified` for static parity
while runtime E2E behavior remains `not_assessed`.
