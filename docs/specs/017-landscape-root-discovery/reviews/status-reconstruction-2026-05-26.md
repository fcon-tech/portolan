# Status Reconstruction: 017 Landscape Root Discovery

Date: 2026-05-26

## Current State

- Backlog status before this slice: Draft spec; required before real Bigtop
  blind acceptance.
- Existing `map --root` behavior: maps the supplied root as one repository-like
  target and does not split a multi-repository landscape into child
  repositories.
- Existing `context prepare` behavior: already discovers root/direct-child/
  `repos/*` Git repositories for agent context packs.
- Existing `map --selection` behavior: implemented and must remain unchanged.

## Gap

The blind agent path is still incomplete while a user must provide
`selection.json` or accept a collapsed root map for a multi-repository
landscape. That keeps prepared landscapes as the strongest path and weakens the
Cursor augmentation claim.

## Decision

Implement the smallest reversible slice: bounded root discovery for
`portolan map --root`, reusing the selection pipeline internally and preserving
external completeness as `unknown`.

