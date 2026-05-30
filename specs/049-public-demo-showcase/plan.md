# Implementation Plan: Public Demo Showcase

**Branch**: `codex/049-public-demo-showcase` | **Date**: 2026-05-30 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/049-public-demo-showcase/spec.md`

## Summary

Create a public, reproducible demo route for Portolan that shows actual map and
context artifacts, preserves weak evidence states, and wraps the validated
Bigtop/Cursor story in claim-bounded case-study language.

## Technical Context

**Language/Version**: Markdown documentation; optional generated Portolan JSON
and Markdown artifacts

**Primary Dependencies**: None required; optional recording tools are deferred
unless maintainers approve them

**Storage**: Demo docs under `docs/`; small redacted excerpt artifacts under
`examples/public-demo/bigtop/`; top-level redaction policy under
`examples/public-demo/README.md`

**Testing**: Demo command smoke; private-path/secret scan; `go test ./...`;
`jq empty schema/*.json`; `git diff --check`

**Target Platform**: Public GitHub repository and local CLI users

**Project Type**: Go CLI with generated evidence artifacts

**Performance Goals**: Demo runs in under five minutes from a clean checkout

**Constraints**: Public-safe data only; read-only target behavior; no private
paths in committed artifacts; no claim broadening; no landing page before
reproducible demo. Locally generated full Bigtop outputs may contain absolute
local paths and must not be shared without a privacy review.

**Scale/Scope**: One demo route, one case study, optional sample artifacts, and
privacy review

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
| --- | --- | --- |
| Local-first and read-only by default | Pass | Demo writes only to explicit local output paths. |
| Evidence state honesty | Pass | Demo must show unknowns and weak states. |
| Complement, do not replace | Pass | Case study keeps Cursor and enterprise-tool limits visible. |
| SpecKit before implementation | Pass | Target and artifact policy are specified before demo docs. |
| Prefer existing OSS/tooling | Pass | Generated Portolan artifacts come before a custom website. |

## Project Structure

### Documentation (this feature)

```text
specs/049-public-demo-showcase/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- checklists/
|   `-- requirements.md
|-- contracts/
|   `-- public-demo-showcase.md
|-- reviews/
|   `-- spec-package-self-review-2026-05-30.md
`-- tasks.md
```

### Candidate implementation files

```text
README.md
docs/
|-- demo.md
|-- product-claims.md
`-- onboarding.md
examples/
`-- public-demo/
    |-- README.md
    |-- selection.json
    `-- expected-artifacts.md
```

**Structure Decision**: Prefer `docs/demo.md` plus optional `examples/public-demo`
artifacts. Do not create a marketing landing page until the reproducible demo
is useful and safe.

## Complexity Tracking

No constitution violations. Demo target and artifact-commit policy remain
blocking maintainer decisions.
