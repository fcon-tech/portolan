# Large Codebase OSS Landscape

Date: 2026-05-26

## Question

The working question is not whether Portolan should become a standalone CTO
report generator. It should not. The product boundary says Portolan augments
coding agents as a read-only local discovery substrate.

The practical question is:

> How should an agent such as Cursor use Portolan to answer CTO-level questions
> about repositories and multi-repo systems of arbitrary size without inventing
> unsupported claims?

## Decision Gate

- Simpler/Faster: do not build custom scanners first. Import and normalize
  existing local tool outputs, then produce a compact agent-facing context pack.
- Blocking Edge Cases: very large repositories, many repositories, generated
  code, vendored code, missing service catalogs, partial runtime data, private
  code that cannot leave the machine, stale docs, and false certainty from LLM
  summaries.
- Existing Open Source: there is strong OSS coverage for clone detection,
  SBOMs, code search, semantic indexes, service catalogs, API contracts,
  architecture-as-code, and agent context packing. Portolan should compose
  these rather than compete with them.

## Short Answer

`portolan inventory --root <folder> --out <dir>` is too narrow as the primary
agent experience. It sounds like a standalone inventory command and it does not
teach Cursor how to proceed.

"Repositories of arbitrary size" cannot mean "load everything into one file."
It has to mean bounded discovery, links to local indexes/tool outputs, and
evidence-labeled answers that can say `unknown` or `cannot_verify`.

The next product slice should be closer to:

```text
portolan context prepare --root <folder> --out <dir> --profile cursor
```

The exact command name is open, but the job is specific: prepare a bounded,
queryable, evidence-labeled context pack that an agent can load before it
answers questions about a code landscape.

## Jobs To Be Done

### 1. Find Duplicate Components

There are three different duplicate problems:

- code clones: near-identical blocks across files and repositories;
- component duplication: multiple services vendoring or reimplementing the same
  package, library, generated client, or internal module;
- configuration duplication: repeated CI, Helm, Terraform, Docker, feature flag,
  or environment patterns that drift independently.

Relevant OSS/tooling:

| Tool or family | Use | Portolan fit |
| --- | --- | --- |
| [jscpd](https://jscpd.dev/) | Multi-language copy/paste detection with JSON, HTML, XML, and AI-oriented output. | High-priority importer for clone clusters. |
| [PMD CPD](https://pmd.github.io/pmd/pmd_userdocs_cpd.html) | Mature duplicate detector shipped with PMD; supports multiple languages and report formats. | Useful importer, especially in Java-heavy landscapes. |
| [Semgrep](https://semgrep.dev/docs/) | Pattern/rule scanning for structural source and config findings. | Import rule findings; do not build a local rule engine first. |
| [Syft](https://github.com/anchore/syft) | Generates SBOMs from filesystems, source trees, images, and packages. | High-priority importer for component/package identity. |
| [CycloneDX](https://cyclonedx.org/) | BOM standard for components, services, dependencies, vulnerabilities, and related metadata. | Preferred normalized SBOM interchange target. |

Implication: Portolan should not start by inventing duplicate detection. It
should normalize duplicate evidence from jscpd/CPD and component identity from
SBOMs, then add cross-repo grouping and evidence states.

### 2. Surface Implicit Knowledge

Implicit knowledge means "the system depends on this, but no single README says
so." This often appears as ownership files, CI jobs, deploy manifests, imports,
schema references, generated clients, feature flags, naming conventions, tests,
dead configs, and tribal conventions embedded in scripts.

Relevant OSS/tooling:

| Tool or family | Use | Portolan fit |
| --- | --- | --- |
| [Sourcebot](https://github.com/sourcebot-dev/sourcebot) | Self-hosted code search for humans and agents. | Optional large-landscape search backend or link target. |
| [OpenGrok](https://github.com/oracle/opengrok) | Source search and cross-reference engine. | Optional import/link target for existing installations. |
| [Zoekt](https://github.com/sourcegraph/zoekt) | Fast code search across many repositories with CLI, web/API modes. | Strong optional local index backend; not a default daemon. |
| [Kythe](https://kythe.io/docs/) | Cross-reference and semantic graph infrastructure. | Valuable for mature/language-specific semantic indexes. |
| [SCIP](https://github.com/scip-code/scip) | Code intelligence protocol. | Good interchange candidate for symbol/index imports. |
| [LSIF](https://microsoft.github.io/language-server-protocol/specifications/lsif/0.6.0/specification/) | Language-server index format. | Import existing indexes when present; do not bet the product on LSIF only. |
| [tree-sitter](https://tree-sitter.github.io/tree-sitter/) | Incremental parsers across many languages. | Use for focused local extraction where existing outputs are absent. |
| [CodeQL](https://codeql.github.com/docs/) | Semantic code database and query engine. | Import/query when already configured; heavy as a default dependency. |
| [Joern](https://joern.io/) | Code property graph for security and program analysis. | Specialized importer for security/deep analysis contexts. |
| [jQAssistant](https://github.com/jqassistant) | Java ecosystem graph analysis with Neo4j-style querying. | Niche but useful for JVM enterprise estates. |
| [ArchUnit](https://www.archunit.org/) | Architecture tests for Java. | Import results as constraints/findings, not as a universal scanner. |
| [Repomix](https://repomix.com/) | Packs repositories into AI-friendly formats. | Reference pattern for agent packs; Portolan needs stronger evidence states. |
| [aider repo map](https://aider.chat/docs/repomap.html) | Token-budgeted repository map for LLM context. | Strong design precedent for query-aware agent context. |
| [Serena](https://github.com/oraios/serena) | MCP toolkit for semantic retrieval/editing at symbol level. | Important adjacent tool; Portolan should complement, not duplicate. |

Implication: Portolan should give Cursor a navigation and query plan, not a
giant static dump. For large codebases, the context pack should point to indexes
and evidence-bearing files, then instruct the agent what to inspect first.

### 3. Describe Relationships Across Services And Repositories

Multi-service understanding comes from several evidence families:

- declared service catalog entries;
- API/event contracts;
- build/deploy/runtime manifests;
- observed telemetry;
- package/component dependencies;
- human architecture docs.

Relevant OSS/tooling:

| Tool or family | Use | Portolan fit |
| --- | --- | --- |
| [Backstage Software Catalog](https://backstage.io/docs/features/software-catalog/) | Entity catalog for components, APIs, resources, systems, owners, and relations. | High-priority importer for `catalog-info.yaml`. |
| [OpenAPI](https://spec.openapis.org/oas/latest.html) | Standard HTTP API description. | High-priority importer for service/API surfaces. |
| [AsyncAPI](https://www.asyncapi.com/docs/reference/specification/latest) | Event-driven API description. | High-priority importer for messaging/event surfaces. |
| [Structurizr DSL](https://docs.structurizr.com/dsl) | Architecture-as-code DSL based on C4-style models. | Import as claim/evidence graph; mark manually authored claims carefully. |
| [OpenTelemetry service graph connector](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/connector/servicegraphconnector) | Derives service graph metrics from traces. | Runtime-visible optional input, not default and not required. |
| Kubernetes, Helm, Terraform, Docker Compose | Deployment and infrastructure relationship hints. | Parse common local files before building custom scanners. |
| [Dependency-Track](https://dependencytrack.org/) | SBOM portfolio and dependency risk tracking. | Optional external system import; not core default. |

Implication: the relationship graph should be evidence-typed. A service relation
from Backstage is metadata-visible. A relation from OpenAPI references is
source-visible or metadata-visible depending on where the spec lives. A relation
from telemetry is runtime-visible. A relation guessed by an agent is claim-only
until grounded.

## What This Means For Cursor

Cursor will not infer a Portolan-specific workflow from a raw JSON file. It
needs an explicit entrypoint and instructions.

A useful Cursor-facing pack should contain:

- `agent-brief.md`: what the agent should do first, what questions this pack can
  answer, and what must remain unknown;
- `repos.json`: discovered repositories, roots, languages, package managers,
  and scan boundaries;
- `evidence-index.jsonl`: normalized facts with evidence state and source
  pointer;
- `findings.jsonl`: duplicate clusters, config surfaces, service relationships,
  and technical debt candidates;
- `tool-outputs/`: imported jscpd, Syft/CycloneDX, Semgrep, Backstage, OpenAPI,
  AsyncAPI, Structurizr, and optional search/index metadata;
- `oss-plan.json`: local producer availability and safe output-path recipes when
  OSS outputs are missing;
- `query-plan.md`: suggested inspection order for common CTO questions;
- `gaps.jsonl`: missing catalogs, missing contracts, unindexed repos, ignored
  directories, unsupported languages, and cannot-verify surfaces.

For Cursor, the key is not "read this artifact." It is:

1. Load `agent-brief.md`.
2. Use `repos.json` to understand landscape scope.
3. Use `query-plan.md` to decide where to look first.
4. Use `oss-plan.json` before claiming missing OSS evidence cannot be produced.
5. Use `evidence-index.jsonl` before making claims.
6. Use `gaps.jsonl` to report unknowns instead of fabricating coverage.

## Recommended Next Slice

Create an "agent context preflight" spec instead of extending `inventory` as the
primary user story.

Minimal useful scope:

1. Discover nested git repositories under a folder without collapsing them into
   one root.
2. Detect existing local outputs from jscpd, Syft/CycloneDX, Semgrep, Backstage
   catalog files, OpenAPI/AsyncAPI specs, Structurizr files, and common deploy
   manifests.
3. Normalize those inputs into evidence-typed records.
4. Generate a compact Cursor-oriented `agent-brief.md` and `query-plan.md`.
5. Keep every unsupported or missing surface in `gaps.jsonl`.

Adapter priority:

1. jscpd JSON or AI output: direct answer to duplicate-code questions.
2. Syft/CycloneDX: direct answer to duplicated components and dependency drift.
3. Backstage + OpenAPI + AsyncAPI: direct answer to service/API relationships.
4. Semgrep: focused config/source pattern extraction once the first three are
   working.
5. Zoekt/Sourcebot/OpenGrok/SCIP/LSIF: optional large-codebase index handles,
   not required for the first pack.

## Rejected Direction

Rejected: make `portolan inventory --root <folder> --out <dir>` the main
product wedge.

Why: it describes Portolan's internal act, not the agent workflow. It does not
tell Cursor what to inspect, how to avoid false certainty, or how to answer CTO
questions over many repositories. It also encourages Portolan to become a
monolithic scanner instead of an OSS-composition and evidence-normalization
layer.

Reversibility: high. The current inventory work can become a sub-step inside
context preparation.

Risk if wrong: medium. If users really want a standalone inventory CLI first,
the agent pack can still be generated from that inventory. The opposite path is
worse: a raw inventory does not automatically become a usable Cursor workflow.

Confidence: high.

## Sources

This is an OSS/product-fit landscape scan, not license due diligence. Before any
adapter becomes an active integration, verify license, maintenance health,
output stability, privacy posture, and local execution behavior.

- jscpd: https://jscpd.dev/
- PMD CPD: https://pmd.github.io/pmd/pmd_userdocs_cpd.html
- Semgrep: https://semgrep.dev/docs/
- Syft: https://github.com/anchore/syft
- CycloneDX: https://cyclonedx.org/
- Backstage Software Catalog:
  https://backstage.io/docs/features/software-catalog/
- OpenAPI: https://spec.openapis.org/oas/latest.html
- AsyncAPI: https://www.asyncapi.com/docs/reference/specification/latest
- Structurizr DSL: https://docs.structurizr.com/dsl
- OpenTelemetry service graph connector:
  https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/connector/servicegraphconnector
- Sourcebot: https://github.com/sourcebot-dev/sourcebot
- OpenGrok: https://github.com/oracle/opengrok
- Zoekt: https://github.com/sourcegraph/zoekt
- Kythe: https://kythe.io/docs/
- SCIP: https://github.com/scip-code/scip
- LSIF: https://microsoft.github.io/language-server-protocol/specifications/lsif/0.6.0/specification/
- tree-sitter: https://tree-sitter.github.io/tree-sitter/
- Repomix: https://repomix.com/
- aider repository map: https://aider.chat/docs/repomap.html
- Serena: https://github.com/oraios/serena
- CodeQL: https://codeql.github.com/docs/
- Joern: https://joern.io/
- jQAssistant: https://github.com/jqassistant
- ArchUnit: https://www.archunit.org/
- Dependency-Track: https://dependencytrack.org/
