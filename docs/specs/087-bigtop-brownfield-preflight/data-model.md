# Data Model: Bigtop Brownfield Preflight

## PreflightBundle

- `target`: `TargetShape`
- `toolchain`: list of `ToolchainRecommendation`
- `gaps`: list of `PreflightGap`
- `artifacts`: list of `ArtifactLink`
- `handoff`: `AgentHandoff`

Validation rules:

- Must be generated from local inputs.
- Must not contain raw private source snippets, prompt text, credentials, or
  secret-like values copied from target files.
- Must not assert complete architecture, runtime topology, or call graph unless
  local evidence supports that claim.
- Must treat target-derived names, paths, manifest keys, and finding text as
  untrusted display strings.

## TargetShape

- `root`: local target root or artifact root.
- `scope`: `single-repo`, `partial-multi-repo`, `curated-landscape`, or
  `unknown`.
- `repositories`: bounded repository names/counts when visible.
- `ecosystem_signals`: languages, manifests, deployment/config surfaces.
- `source_artifacts`: links to existing context/map artifacts used.

Validation rules:

- Repository counts are local visibility, not complete inherited-estate proof.
- Missing/stale artifacts must be recorded as gaps.
- Display values must be escaped, bounded, and rendered as data rather than
  instructions.

## ToolchainRecommendation

- `tool`: stable tool name.
- `job`: what the tool helps answer.
- `status`: `installed`, `missing`, `supplied-output`, `approval-required`,
  `parked`, or `rejected`.
- `evidence_family`: potential evidence family unlocked by local output.
- `approval_boundary`: network/install/mutation/global-config/daemon/watcher
  requirements.
- `risk`: license, privacy, stale-output, or compatibility notes.
- `next_action`: safe next step.
- `evidence_state`: omitted or `not_evidence` until output is imported.

Validation rules:

- Candidate tools must not become graph evidence.
- Any network, install, mutation, daemon, watcher, MCP registration, or global
  config action requires explicit approval.

## PreflightGap

- `id`: stable gap id.
- `evidence_family`: missing or blocked evidence family.
- `reason`: why the evidence is missing or blocked.
- `next_probe`: safe local next step or approval-required action.
- `status`: `unknown`, `cannot_verify`, `not_assessed`, or `blocked`.

Validation rules:

- Gaps are preserved, not collapsed into success.
- `cannot_verify` is used only when evidence exists but cannot verify the
  requested claim.

## ArtifactLink

- `kind`: context, map, summary, graph-index, findings, oss-plan, gaps,
  tool-registry, preflight, handoff, or other bounded artifact type.
- `path`: local path relative to output directory when possible.
- `status`: present, missing, stale, or not_assessed.

Validation rules:

- Links route to existing truth sources instead of duplicating graph facts.
- Paths must not escape the selected output directory for generated writes.

## AgentHandoff

- `start_here`: ordered artifact list.
- `allowed_claims`: bounded claim guidance.
- `blind_spots`: top gaps the agent must preserve.
- `approval_required`: actions the agent must not run without explicit
  operator approval.

Validation rules:

- Must be useful to Cursor, Codex, OpenCode, pi, or another coding agent without
  Portolan orchestrating the coding loop.
- Must render target-derived strings as quoted or escaped data and avoid raw
  snippets from target files.
