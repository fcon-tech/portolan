# Pre-Implementation Analyze: Spec 055

Date: 2026-06-02
Branch: `codex/055-runtime-topology-evidence`

## Scope

Cross-artifact and code reality check across spec 055, runtime observation docs,
selection schema, map behavior, and spec 044 runtime-security implementation.

## Decision Gate

- Simpler/Faster: reuse the existing runtime observation JSON contract and
  `selection.runtime` input instead of adding a new CLI command or telemetry
  collector.
- Blocking Edge Cases: static deployment/API/catalog evidence must not become
  runtime; partial runtime observation coverage must not become complete
  topology; unsafe or missing runtime exports must stay weak.
- Existing Open Source: runtime data should come from existing telemetry,
  service-mesh, trace, log, container, or manually curated local exports.
  Portolan normalizes local files only.

## Findings

| ID | Severity | Finding | Disposition |
| --- | --- | --- | --- |
| A1 | high | Existing black-box runtime observations already emit `runtime-visible` edges, but top-level `selection.runtime` currently only records the file as visible in map output. | Accepted; implement top-level runtime relationship import in `internal/maprun`. |
| A2 | high | Bigtop has no safe local runtime observation export in the current workspace. Running Bigtop services or collecting live telemetry is not approved. | Accepted; Bigtop runtime topology must remain `blocked`/`not_assessed` until a safe local runtime export exists. |
| A3 | medium | Runtime observation `source` strings can contain sensitive hostnames or URLs if operator exports are not redacted. | Accepted; reject obvious URL/credential-shaped source labels in this slice and keep privacy caveat in docs. |
| A4 | medium | Complete runtime topology cannot be inferred from `coverage: complete` unless the selected scope is explicit. | Accepted; `complete` means only the supplied runtime export's captured scope, not whole Bigtop. |

## Implementation Gate

Implementation may proceed for US1/US2 map import and fixture tests. Cursor
stress may proceed only after fresh runtime-visible and no-runtime bundles exist.
