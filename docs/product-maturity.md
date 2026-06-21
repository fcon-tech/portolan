# Product Maturity Matrix

This matrix separates implemented surfaces from broader promises. A surface can
be useful without proving complete enterprise coverage.

All first-run product surfaces are local-first, read-only by default, and still
limited by local inputs. Per-row limits state the claim boundary that must remain
visible.

| Surface | Kind | Maturity | Product Boundary | Not Supported | Verification |
| --- | --- | --- | --- | --- | --- |
| `scripts/portolan-install.sh` | Installer | `stable-first-run` | Installs Cursor/OpenCode instructions and target-local wrappers under `<target-root>/.portolan/bin` | Does not install producer tools without explicit approval | Product acceptance gate and clean source-copy install smoke |
| `<target-root>/.portolan/bin/portolan-scan.sh` | Installed wrapper | `stable-first-run` | Builds a local atlas bundle from the target through the installed interface | Does not prove complete estate coverage or runtime topology | Product acceptance gate, smoke fixtures, Bigtop-10 acceptance |
| `<target-root>/.portolan/bin/portolan-bundle-query.sh` | Installed wrapper | `stable-first-run` | Reads bounded repos, relationships, hotspots, gaps, search, symbols, source, and claims from a bundle | Not a general graph database | Bundle-query smoke, MCP smoke, Bigtop-10 acceptance |
| `<target-root>/.portolan/bin/portolan-viewer.sh` | Installed wrapper | `stable-first-run` | Opens the local atlas viewer against a bundle | Not a hosted service or shared catalog | Clean source-copy viewer wrapper smoke and viewer build checks |
| `<target-root>/.portolan/bin/portolan-import-analysis-claims.sh` | Installed wrapper | `tooling` | Imports tier-labeled agent claims when cited refs resolve | Does not promote agent claims into tool evidence | Clean source-copy claim-import smoke and schema validation |
| `manifest.json`, `repo-profiles.json`, `relationships.jsonl`, `hotspots*.jsonl`, `gaps.jsonl` | Atlas artifact | `stable-first-run` | First artifacts agents should read before broad answers | Not complete architecture truth by itself | Atlas schema validation and product acceptance |
| `atlas-facts.json`, `atlas-surfaces.json`, `atlas-surface-content.json` | Atlas artifact | `stable-first-run` | Viewer and agent navigation contract for components, surfaces, and drill-down routes | Not a runtime call graph | Atlas schema validation and viewer smoke |
| Cursor installed rule | Adapter/doc | `stable-first-run` | Gives Cursor a target-local atlas workflow and wrapper commands | Does not prove every Cursor UI mode or future release | Headless Cursor runtime lane in product acceptance |
| OpenCode managed `AGENTS.md` block | Adapter/doc | `stable-first-run` | Gives OpenCode a target-local atlas workflow and wrapper commands | Does not prove every permission mode or future release | OpenCode runtime lane in product acceptance |
| MCP bundle-query adapter | Adapter/tool | `tooling` | Exposes the same bundle-query families to MCP-capable harnesses | Not required for Cursor/OpenCode install path | MCP smoke with fixture bundle |
| CycloneDX/Syft import | Producer/import | `tooling` | Normalizes local SBOM component identity and dependencies | Does not prove security posture | Importer tests |
| jscpd-style duplication input | Producer/import | `tooling` | Represents bounded near-clone evidence from local JSON | Does not prove all duplication across a landscape | Adapter/import tests and Bigtop-10 acceptance when enabled |
| Semgrep output contract | Producer/import | `tooling` | Preserves native Semgrep JSON output as metadata evidence | Does not download rules or certify security | Output contract tests and docs |
| Graphify import | Producer/import | `limited` | Imports native Graphify node-link output | MCP, LLM, dashboard, execution, and full semantic quality remain not_assessed | Adapter/import tests |
| Repomix import | Producer/import | `tooling` | Imports local Repomix file inventory evidence | Execution and source/redaction semantics remain bounded | Importer tests |
| Symbol-index import | Producer/import | `limited` | Imports bounded SCIP/Serena-style JSON symbol records | Does not run indexers or language servers | Importer tests |
| Legacy `portolan context prepare` | CLI compatibility | `legacy-compatible` | Builds older local agent context packs for users who explicitly request them | Not the primary Cursor/OpenCode atlas path | Go tests and CLI smoke |
| Legacy `portolan map` / `portolan query` | CLI compatibility | `legacy-compatible` | Builds and queries older map bundles; optional map bridge can import hints into atlas bundles | Does not replace the installed atlas route | Go tests, map fixtures, and bridge smoke |

Harness readiness rule: installed files and runtime behavior are separate. A
generated rule can be correct while an unrun runtime lane remains `not_assessed`;
use [Agent Acceptance](agent/ACCEPTANCE.md) for recorded lanes.
