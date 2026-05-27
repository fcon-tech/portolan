# Repomix Adapter Profile

Repomix is accepted as an agent-context pack producer, not as architecture
evidence and not as a Portolan scanner replacement.

## Decision

- Source: https://github.com/yamadashy/repomix
- State: accepted as context-pack profile only.
- License posture: MIT observed, `needs_review` before dependency or
  distribution changes.
- Current Portolan behavior: no parser, no invocation, no committed packed
  source fixture.

## Supported Evidence Shape

Supported for a future import-only adapter:

- local output path and format (`json`, `xml`, `markdown`, or plain text);
- file inventory when available;
- directory structure when available;
- token counts and split-output metadata when available;
- security scan summary when available;
- pack configuration metadata.

Evidence state:

- file inventory, token counts, and pack metadata: `metadata-visible`;
- packed source snippets: context only, not architecture truth;
- inferred summaries or AI instructions embedded in a pack: `claim-only` or
  `cannot_verify`;
- absence of a file from a pack: not proof that the source tree lacks it unless
  the pack configuration and selected target are verified.

## Unsupported In This Slice

- Running Repomix.
- Remote repository packing.
- Repomix MCP server behavior.
- Parsing packed source content into Portolan graph facts.
- Committing private packed outputs as fixtures.
- Treating token-heavy files or file order as technical-debt findings.

## Privacy And Safety

Repomix outputs commonly include source snippets and may include sensitive
content if security checks are disabled or incomplete. A future adapter must:

- require redaction for committed/shared fixtures;
- preserve security scan failures as `cannot_verify` or `blocked`;
- keep remote packing outside Portolan's default local-first path;
- record pack configuration so agents can see what was included or excluded.

## Profile-Gated Commands

Spec 042 does not add a Repomix command recipe. Future recipes should prefer
local-only, JSON output, security checks enabled, explicit include/exclude
patterns, and bounded split output.
