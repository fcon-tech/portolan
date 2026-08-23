## Context

See proposal.md — Why. The toolset (probe-tools, soundings), the chart
foundation, and the MCP delivery are specified elsewhere; this change is
the taught method that drives them. The first-run contract, the permission
model (one approval; builds/tests yes; writes under `.portolan/`; never
mutate source), and the glossary are settled in docs/MANIFEST.md — the
skill restates them as instructions to the Cartographer, it does not
renegotiate them.

## Goals / Non-Goals

**Goals:**

- Skill content (markdown, harness-portable) that fully determines the
  behaviors in specs/expedition/spec.md: launch, one approval, survey
  order, verify loop, honesty, brief format.
- A Sailing Directions template stable enough that the Governor knows what
  shape the brief takes on every target.

**Non-Goals:**

- Enforcement machinery (no step trackers, checklists in code, or progress
  daemons — the chart store's rejections and the sea trial's gate are the
  enforcement).
- Any per-harness variant of the method; one skill text, adapter-shipped.
- v1.1 concerns (smell scanners, `run`).

## Decisions

1. **The skill is plain markdown under `skill/`, one document plus a brief
   template.** Behavior lives in taught instructions to a frontier model,
   not in code — that is the manifest's core bet (the model is the
   cartographer; determinism only verifies). Alternative: encode the survey
   order as a state machine in the server — rejected: re-builds the v2
   pipeline corpse and fights the model instead of directing it.
2. **The single approval is one Governor-facing message covering network +
   external tool installation, phrased by the skill verbatim.** Builds and
   tests are not re-asked (the manifest grants them), but every executed
   command is receipted via `log.append` so the log shows what ran.
   Alternative: per-action approvals — rejected: violates the first-run
   contract's one-phrase promise.
3. **Survey order fixed, cheapest evidence first.** Manifests and entry
   points yield vessels and fairways before any file is read closely;
   each pass writes entries immediately so interruption leaves a valid
   partial Chart (the spec's interruption scenario). Alternative:
   analyze-everything-then-write — rejected: a Bigtop-scale expedition may
   be cut short, and a Chart that only exists at the end is a Chart that
   may never exist.
4. **Verify loop is taught as assert → sound → write-with-verdict.** The
   Cartographer sounds each asserted fairway and each cited anchor, and the
   verdict shapes the trust label it writes (`refuted` → correct or
   `doubtful`; `unconfirmed` → no stronger than the remaining evidence
   supports). Trust changes stay Cartographer writes, honoring the
   soundings contract.
5. **Sailing Directions are delivered in the conversation and archived at
   `<target>/.portolan/sailing-directions.md`.** The conversation copy is
   the Governor's desk; the archived copy makes later sessions diff what
   the last expedition claimed. Alternative: conversation only — rejected:
   the Chart survives sessions; its summary should too.
6. **Unsurveyed is taught as a first-class output, not a failure.** The
   skill instructs an explicit unsurveyed list per vessel sheet and in the
   brief, matching the trust vocabulary's honesty rule.

## Risks / Trade-offs

- [A model skips the taught order or the verify loop] → The chart store
  rejects label-less entries; unverified anchors die at the sea trial's
  fabricated-anchor rule; the method stays taught, not policed.
- [Skill portability across harness skill formats] → One canonical text in
  `skill/`; adapters wrap format, never wording (mirrors mcp-delivery's
  thin-shim rule).
- [Approval phrasing variance across harnesses] → The skill pins the
  message content; only the prompt chrome differs per harness.

## Migration Plan

Greenfield (`skill/` does not exist yet). Rollback = delete the directory;
nothing depends on it at runtime.
