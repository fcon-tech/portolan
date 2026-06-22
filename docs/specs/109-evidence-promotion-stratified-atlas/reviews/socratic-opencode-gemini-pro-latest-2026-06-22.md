# Socratic Review: Gemini Pro Latest via OpenCode

**Date**: 2026-06-22
**Model**: `openrouter/~google/gemini-pro-latest`
**Command**: `opencode run ... --model openrouter/~google/gemini-pro-latest`
**Scope**: `spec.md`, `plan.md`, `tasks.md`
**Review status**: assessed

## Critical Findings

**1. Loophole for false completion via `not_integrated`**

`spec.md` forbids calling the capability complete if only one producer family is
covered, but `tasks.md` allowed completion when every surface either implements
the strata or exposes `not_integrated`. This could let a team implement two
families, hardcode permanent `not_integrated` for the rest, and mark the spec
complete.

**2. Custom scanner reimplementation contradiction**

`plan.md` said to build a path and metadata based classifier using local rules
first. The reviewer flagged this as conflicting with the stated preference for
mature OSS rules such as Linguist/go-enry and with Portolan's boundary against
reimplementing scanners.

## Major Findings

**3. Undefined thresholds in acceptance scenarios**

The BDD scenarios depend on phrases such as "more than half", "when thresholds
are crossed", and "hundreds of megabytes" without a concrete threshold contract.

**4. Missing mapping of evidence to fact kinds**

The spec says facts are promoted only from layers that justify the fact kind,
but it does not define which layers justify which fact kinds.

## Minor Findings

**5. Missing read-only/security enforcement task**

FR-012 requires read-only defaults and approval gating, but the task list did
not include a corresponding implementation or verification task.

**6. Superficial agent acceptance**

The tasks add JSON fields to MCP responses, but no acceptance test proves an
agent can navigate or recover from `not_integrated` or
`polluted_by_non_source`.

## Recommendation

`proceed after fixes`
