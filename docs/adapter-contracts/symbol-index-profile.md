# Symbol Index Adapter Profile

This profile covers SCIP and Serena-style symbol surfaces as future local
inputs. The current slice is profile-only.

## Decision

- SCIP source: https://github.com/scip-code/scip
- Serena source: https://github.com/oraios/serena
- State: accepted as profile/reference inputs; no direct dependency or daemon
  behavior in spec 042.
- License posture: SCIP Apache-2.0 observed; Serena MIT observed. Both remain
  `needs_review` before dependency or distribution changes.

## Supported Evidence Shape

Supported for a future import-only adapter:

- document or file URI/path;
- language identifier;
- symbol ID/name/kind when exported locally;
- definition/reference ranges;
- package/module metadata;
- local index generation metadata when supplied by the producer.

Evidence state:

- local exported symbol identity and ranges: `metadata-visible`;
- source-backed symbol claims: `source-visible` only after Portolan independently
  reads the source/range;
- diagnostics, semantic correctness, and call relationships: `not_assessed`
  unless a future importer validates them.

## Unsupported In This Slice

- Starting language servers.
- Starting Serena MCP or HTTP servers.
- Refactor, rename, move, edit, debug, or memory tools.
- Treating symbol references as complete call graphs.
- Treating IDE/LSP availability as proof of architecture relationships.
- Importing protobuf or MCP protocols directly.

## Privacy And Safety

- Import local export files only.
- Do not collect credentials, editor tokens, or MCP configuration secrets.
- Reject or mark `cannot_verify` paths outside the selected target in a future
  importer.
- Preserve missing language coverage as `not_assessed`; do not collapse it into
  success.

## Profile-Gated Commands

Portolan may document local producer recipes in a future spec, but spec 042
does not add executable recipes. Agents may use external tools separately, then
present local outputs to Portolan after a reviewed adapter contract exists.
