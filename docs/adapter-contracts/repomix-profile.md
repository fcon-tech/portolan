# Repomix Adapter Profile

Repomix is accepted as an agent-context pack producer, not as architecture
evidence and not as a Portolan scanner replacement.

## Decision

- Source: https://github.com/yamadashy/repomix
- State: accepted as context-pack profile and bounded file-inventory import.
- License posture: MIT observed, `needs_review` before dependency or
  distribution changes.
- Current Portolan behavior: invoke installed Repomix as a local producer,
  import local packed-output file paths as inventory metadata, no remote
  packing, no MCP behavior, and no source-content architecture parsing.

## Supported Evidence Shape

Supported for the current producer/import adapter:

- local packed output path;
- `<file path="...">` inventory from Repomix XML-style packed output;
- directory structure when available;
- disabled-security-check warning detection.

Evidence state:

- file inventory, token counts, and pack metadata: `metadata-visible`;
- packed source snippets: context only, not architecture truth;
- disabled security-check pack source: `cannot_verify`;
- inferred summaries or AI instructions embedded in a pack: `claim-only` or
  `cannot_verify`;
- absence of a file from a pack: not proof that the source tree lacks it unless
  the pack configuration and selected target are verified.

## Unsupported In This Slice

- Remote repository packing.
- Repomix MCP server behavior.
- Parsing packed source content into Portolan graph facts.
- Token counts, split-output metadata, security scan summaries, and pack
  configuration semantics.
- Treating token-heavy files or file order as technical-debt findings.

## Privacy And Safety

Repomix outputs commonly include source snippets and may include sensitive
content if security checks are disabled or incomplete. The current importer
does not parse source snippets into facts. Future broader adapters must:

- require redaction for committed/shared fixtures;
- preserve security scan failures as `cannot_verify` or `blocked`;
- keep remote packing outside Portolan's default local-first path;
- record pack configuration so agents can see what was included or excluded.

## Validation

```bash
go test -count=1 ./internal/app ./internal/importer
go run ./cmd/portolan produce repomix --root /tmp/portolan-repomix-local/target --out /tmp/portolan-repomix-local/out/repomix-output.xml --style xml --force
go run ./cmd/portolan import repomix --in testdata/importer-normalization/repomix-output.xml --out /tmp/portolan-repomix-import.json --force
```

Future producer recipes should prefer local-only output, security checks
enabled, explicit include/exclude patterns, and bounded split output.
