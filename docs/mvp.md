# MVP

The MVP should prove one narrow product promise:

> Run Portolan locally against a selected software landscape and receive an
> honest evidence graph plus a readable packet that distinguishes source-visible,
> metadata-visible, runtime-visible, claim-only, unknown, and cannot-verify
> facts.

## Phase 0: Bootstrap

- Repository, license, Go module, and CLI shell.
- Product boundary documents.
- Draft evidence graph schema.

## Phase 1: Static Local Profile

- Accept a local selection file that names repositories and optional metadata
  files.
- Inspect only local filesystem inputs.
- Emit JSON evidence graph.
- Render a compact text packet from the same graph.

## Phase 2: Importers

- Add importers for existing OSS/tool outputs where licenses and formats fit.
- Favor adapters over native reimplementation.
- Preserve source attribution and evidence state per imported fact.

## Phase 3: Black-Box Profile

- Represent systems without source through metadata, runtime observations, and
  claims.
- Keep black-box facts visibly lower authority than source-visible facts.
- Report `unknown` or `cannot_verify` instead of inventing conclusions.

## Non-Goals For MVP

- No SaaS service.
- No background agent.
- No repository mutation.
- No automatic modernization plan.
- No policy gate.
