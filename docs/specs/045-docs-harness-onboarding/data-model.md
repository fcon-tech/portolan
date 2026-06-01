# Data Model: Docs And Harness Onboarding

This documentation slice does not add runtime data models. The entities below are documentation concepts that must stay aligned across docs.

## Documentation Route

- **Purpose**: Maps a reader's intent to the correct starting document.
- **Fields**: audience, intent, next document, evidence boundary, verification label.
- **Validation**: Every route must point to an existing document and avoid broader product claims than `docs/product-claims.md`.

## Harness Surface

- **Purpose**: Names a receiving agent harness and the support boundary currently documented for it.
- **Fields**: harness name, verified lane, failed lane, not_assessed lane, recommended output path, non-goal.
- **Validation**: Cursor and OpenCode wording must match `docs/product-claims.md` and `docs/agent/ACCEPTANCE.md`.

## Install Path

- **Purpose**: Explains how an agent resolves a Portolan command.
- **Fields**: installed binary, source checkout bootstrap, development fallback, network boundary, output directory rule.
- **Validation**: Source checkout bootstrap remains `scripts/bootstrap-portolan`; network dependency fetching remains opt-in.

## Evidence State

- **Purpose**: Preserves Portolan's trust vocabulary in human and agent docs.
- **Fields**: verified, failed, blocked, unknown, cannot_verify, not_assessed, source-visible, metadata-visible, runtime-visible, claim-only.
- **Validation**: Missing or unrun harness behavior must not be described as verified.
