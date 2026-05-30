# Research: Docs And Harness Onboarding

## Decision: Add one onboarding route before adding harness-specific manuals

**Rationale**: The repository already has strong specialized docs: README, Russian overview, agent quickstart/install/prompt docs, product claims, acceptance matrix, release guide, and Cursor rule. The missing piece is a first-hop route that tells humans and agents which specialized document to open and what support boundary applies.

**Alternatives considered**:

- Add separate `docs/agent/CURSOR.md` and `docs/agent/OPENCODE.md`. Rejected for this slice because it duplicates acceptance-matrix content and creates more surfaces to keep aligned.
- Expand README substantially. Rejected because README is already dense and should stay a concise overview.
- Add `.opencode` project configuration. Rejected because current boundary is harness-independent docs and no OpenCode runtime integration is required.

## Decision: Keep source bootstrap as the default install story

**Rationale**: Portolan does not publish prebuilt binaries yet, and `scripts/bootstrap-portolan` already enforces the important default: build locally without fetching Go modules from the network unless explicitly approved.

**Alternatives considered**:

- Add a Makefile or install wrapper. Rejected because the existing bootstrap script is simpler and already verified by release-envelope work.
- Document `go install` as primary. Rejected because current product boundary and README prefer source checkout bootstrap and repo-local binary output.

## Decision: Treat Cursor and OpenCode as operator surfaces, not product dependencies

**Rationale**: Product claims explicitly say Portolan is not tied to Cursor, OpenCode, Codex, pi, or any harness. The docs should help operators use these harnesses without implying Portolan depends on them.

**Alternatives considered**:

- Add tool-specific setup as a required workflow. Rejected because it would broaden the harness boundary.
- Keep harness details only in `docs/agent/ACCEPTANCE.md`. Rejected because OpenCode default-permission behavior and Cursor UI limits are operationally important enough to surface in onboarding.

## Decision: Preserve failed and not_assessed surfaces in docs

**Rationale**: The OpenCode external-output lane failed under default permissions, while repo-local output worked. Cursor UI is outside current required acceptance scope. These are not negative marketing details; they are necessary setup constraints for trustworthy agent operation.

**Alternatives considered**:

- Phrase docs as "works with OpenCode" and "works with Cursor". Rejected because it collapses evidence states and violates the product claim boundary.
