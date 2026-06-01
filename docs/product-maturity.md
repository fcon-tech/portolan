# Product Maturity Matrix

This matrix separates implemented surfaces from first-run promises. A surface
can be useful without being a stable product promise.

All stable first-run surfaces are local-first, read-only by default, and still
limited by their local inputs. Per-row limits state the claim boundary that must
remain visible.

| Surface | Kind | Maturity | Product Boundary | Not Supported | Verification |
| --- | --- | --- | --- | --- | --- |
| `portolan context prepare` | CLI | `stable-first-run` | Builds local agent context packs | Does not answer architecture questions itself | Go tests and CLI smoke |
| `portolan map` | CLI | `stable-first-run` | Builds local map bundles with graph, coverage, findings, summary, and packet | Does not prove complete estate coverage | Go tests, map fixtures, and recorded acceptance lanes |
| `portolan query findings` | CLI | `stable-first-run` | Reads bounded finding records from a map bundle | Not a general graph query language | Go tests and CLI smoke |
| `portolan query gaps` | CLI | `stable-first-run` | Surfaces weak evidence and missing coverage records | Does not resolve the gaps | Go tests and CLI smoke |
| `portolan report quality` | CLI | `tooling` | Validates report-quality summaries before UX/report claims | Does not judge prose quality or create evidence | Go tests and fixture smokes |
| `summary.json`, `graph-index.json`, `findings.jsonl`, `coverage.json` | Artifact | `stable-first-run` | First artifacts agents should read before full graph loading | Not a complete service catalog | Schema and map tests |
| `graph.json` | Artifact | `stable-first-run` | Full machine-readable evidence graph, loaded after bounded summaries when detail is needed | Too large for many first prompts | Schema and graph tests |
| `map.md` and packet Markdown | Artifact | `stable-first-run` | Human-readable view derived from graph evidence | Does not add facts beyond source artifacts | Packet tests |
| CycloneDX/Syft import | Producer/import | `tooling` | Normalizes local SBOM component identity and dependencies | Does not run Syft or prove security posture | Importer tests |
| jscpd-style duplication input | Producer/import | `tooling` | Represents bounded near-clone evidence from local JSON | Does not prove all duplication across a landscape | Adapter/import tests |
| Semgrep output contract | Producer/import | `tooling` | Preserves native Semgrep JSON output as metadata evidence | Does not run Semgrep, download rules, or certify security | Output contract tests and docs |
| Graphify import | Producer/import | `experimental` | Imports native Graphify node-link output | MCP, LLM, dashboard, execution, and full semantic quality remain not_assessed | Adapter/import tests |
| Repomix import | Producer/import | `tooling` | Imports local Repomix file inventory evidence | Execution and source/redaction semantics remain bounded | Importer tests |
| Symbol-index import | Producer/import | `experimental` | Imports bounded SCIP/Serena-style JSON symbol records | Does not run indexers or language servers | Importer tests |
| Agent docs and install prompts | Doc | `stable-first-run` | Give harness-independent local execution instructions | Do not prove arbitrary harness behavior | Acceptance matrix lanes |
| Cursor/OpenCode adapter guidance | Adapter/doc | `experimental` | Static guidance and selected recorded runtime lanes | UI Cursor and arbitrary targets remain not_assessed | Acceptance matrix evidence |
| MCP/LSP-style surfaces | Future | `future` | Direction only | Not implemented or verified | not_assessed |

Harness readiness rule: static adapter parity and runtime end-to-end behavior
are separate. A file may be correct while the runtime lane remains
`not_assessed`; use [Agent Acceptance](agent/ACCEPTANCE.md) for recorded lanes.
