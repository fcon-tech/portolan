# Implementation Plan: OSS Execution Plan

## Decision Gate

- Simpler/Faster: emit a local execution/import plan from context preparation.
  Do not make Portolan run external scanners in this slice.
- Blocking Edge Cases: scanner execution can be slow, write caches, require
  language package managers, depend on network-backed rule registries, or
  produce huge/private outputs. Portolan must keep read-only target defaults.
- Existing Open Source: jscpd, Syft/CycloneDX, and Semgrep remain external
  producer tools. Portolan only records safe recipes and imports/summarizes
  their local outputs.

## Technical Approach

- Add `oss-plan.json` to the context pack.
- Use local `PATH` lookup to classify producer availability as available or
  not available without running scanners.
- Generate command recipes for:
  - jscpd JSON duplication output;
  - Syft CycloneDX JSON SBOM output;
  - Semgrep JSON output only when a local Semgrep config file exists.
- Require all recipes to write under `<context-dir>/tool-outputs/`.
- Update agent brief, query plan, help text, Cursor rule, and portable skill.

## Verification

Run:

```bash
go test ./...
jq empty schema/*.json
git diff --check
go run ./cmd/portolan context prepare --root testdata/landscape-map --out /tmp/portolan-025-context --profile cursor --force
jq empty /tmp/portolan-025-context/oss-plan.json
```
