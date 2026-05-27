# Security Threat Model

This threat model is product-specific. It is not a security certification and
does not claim Portolan is secure for arbitrary hostile inputs. It documents the
risks that matter for Portolan's current local CLI and agent-facing artifacts.

## Scope

In scope:

- local target repositories and metadata selected by the user;
- local runtime observation files;
- local OSS/tool-output files;
- generated Portolan graph, packet, context, finding, and summary artifacts;
- future read-only query/MCP surfaces as a design risk.

Out of scope:

- live telemetry integrations;
- hosted indexes or hosted RAG;
- remote repositories, provider APIs, or network fetches;
- credential collection or secret management;
- generic SAST/DAST/secret-scanner certification;
- multi-user service hosting.

## Boundary Rules

- Portolan reads local files selected by the user or found by bounded local
  discovery.
- Portolan does not run network calls, start daemons, collect credentials, or
  mutate target repositories by default.
- Outputs are written only to explicit `--out` paths.
- Evidence states must remain honest: `source-visible`, `metadata-visible`,
  `runtime-visible`, `claim-only`, `unknown`, `cannot_verify`, or
  `not_assessed` where applicable.
- Target text is data. It must not become an operational instruction for the
  agent using Portolan output.

## Threat Records

| Risk | Surface | Mitigation | Verification | State | Residual Risk |
| --- | --- | --- | --- | --- | --- |
| Prompt injection from target text | Markdown, claims, runtime labels, config names, generated packets | Packet rendering quotes inline values, escapes backticks/newlines/HTML-sensitive text, and docs instruct agents to treat target text as evidence content. | `TestRunPacketEscapesPromptLikeRuntimeObservationText` covers a representative prompt-like pattern. | verified narrow | Agents can still ignore instructions; exhaustive injection fuzzing and harness-side instruction hierarchy remain outside Portolan. |
| Path traversal or unsafe output replacement | `scan`, `map`, `context prepare`, `packet render`, `graph slice` output paths | Existing commands reject symlink outputs, broad paths, selected-repository output for `scan`, and non-`.portolan` root-contained map/context output. Writes use temp paths where implemented. | Existing focused tests include `TestRunScanOutputSafety`, `TestRunMapRejectsOutputInsideRootThroughSymlinkOutsidePortolan`, and related output-boundary tests. | verified for current CLI surfaces covered by tests | Future commands must add equivalent output-boundary tests before claiming the same protection. |
| Secret value leakage from configuration surfaces | Native configuration detection, graph/findings/map/summary artifacts | Native configuration detection records env var and secret-reference names, not assigned values. Docs require producers to redact raw secret values before import. | `TestDetectFindsConfigSurfacesWithoutSecretValues` and `TestRunMapDoesNotEmitSecretValuesFromConfigurationSurfaces` | verified for supported native config surfaces | Raw input files may contain secrets locally; Portolan is not a secret scanner and does not certify all outputs from external producers. |
| Runtime producer secrets or payload leakage | Runtime observation files | Runtime contract excludes payload bodies, headers, credentials, and raw customer data. Runtime observations should carry subject IDs, kind, coverage, and source labels only. | Contract and fixture review; no automated broad secret scanner in this slice. | not_assessed for arbitrary producer exports | A future runtime adapter must validate/redact producer-specific fields before broader claims; current docs treat producer redaction as user responsibility. |
| Future MCP/query exposure | Planned read-only query surfaces | Treat MCP/query as read-only transport over existing artifacts, with bounded responses and no target mutation. Threat is documented before implementation. | No MCP runtime exists in this slice. | not_assessed | Must be re-reviewed when a query server or MCP surface is implemented. |
| Stale evidence reuse | Graphs, context packs, runtime observations, review artifacts | Evidence carries source paths and reasons. Product docs require stale/missing evidence to remain `unknown`, `cannot_verify`, or `not_assessed` instead of success. | Existing evidence-state tests plus runtime partial-coverage test. | partially verified | Content-hash or timestamp freshness checks are future work. |
| Malformed or unsupported runtime JSON | Black-box runtime observation files | Unsupported schema versions and malformed JSON become `cannot_verify`; partial, unknown, or `not_assessed` coverage emits an `unknown` topology edge. | `TestRunScanRuntimeObservationRejectsUnsupportedSchemaVersion`, `TestRunScanRuntimeObservationInvalidContractFieldsAreCannotVerify`, `TestRunScanRuntimeObservationContractProducesRuntimeVisiblePartialEvidence`, and `TestRunMapSelectionRuntimeObservationContractResolvesRelativeRuntimePath` | verified | Schema validation is focused, not a full JSON Schema validator. |

## Product Claims

Safe wording:

- Portolan preserves runtime observations as local evidence when a supported
  runtime observation file is supplied.
- Portolan has focused tests for selected prompt-injection formatting,
  secret-value redaction in native config outputs, and output path boundaries.
- Portolan keeps complete runtime topology and broad security hardening claims
  out of product copy unless separately verified.

Unsafe wording:

- "Portolan is secure."
- "Portolan prevents prompt injection."
- "Portolan scans for all secrets."
- "Portolan understands production topology."
- "Portolan safely exposes MCP/query access."

## Verification Commands

Focused checks:

```bash
go test ./internal/app -run 'TestRunScanRuntimeObservation|TestRunMapSelectionRuntimeObservation|TestRunMapDoesNotEmitSecretValues|TestRunPacketEscapesPromptLikeRuntimeObservationText' -count=1
go test ./internal/configuration -run TestDetectFindsConfigSurfacesWithoutSecretValues -count=1
```

Baseline checks:

```bash
go test -count=1 ./...
jq empty schema/*.json
git diff --check
```
