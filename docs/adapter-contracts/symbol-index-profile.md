# Symbol Index Adapter Profile

This profile covers SCIP and Serena-style symbol surfaces as local producer
exports. The current importer supports a bounded JSON export contract, not SCIP
protobuf parsing or Serena daemon integration.

## Decision

- SCIP source: https://github.com/scip-code/scip
- Serena source: https://github.com/oraios/serena
- State: accepted as profile/reference inputs and bounded JSON symbol-index
  import; no direct dependency or daemon behavior.
- License posture: SCIP Apache-2.0 observed; Serena MIT observed. Both remain
  `needs_review` before dependency or distribution changes.

## Supported Evidence Shape

Supported for the current import-only adapter:

- document or file URI/path;
- language identifier;
- symbol ID/name/kind when exported locally;
- definition/reference ranges;
- producer name.

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
- Package/module metadata and local index generation metadata beyond preserving
  producer name.

## Privacy And Safety

- Import local export files only.
- Do not collect credentials, editor tokens, or MCP configuration secrets.
- Reject or mark `cannot_verify` paths outside the selected target in a future
  importer.
- Preserve missing language coverage as `not_assessed`; do not collapse it into
  success.

## Validation

```bash
go test -count=1 ./internal/app ./internal/importer
go run ./cmd/portolan import symbol-index --in testdata/importer-normalization/symbol-index.json --out /tmp/portolan-symbol-index-import.json --force
```

Agents may use external SCIP or Serena tooling separately, then present local
exports to Portolan. Portolan does not start indexers, language servers, MCP
servers, or HTTP servers.
