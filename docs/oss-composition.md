# OSS Composition

Portolan should compose existing tools before it builds new scanners.

## Direction

The market already has strong tools for code search, code graphs, modernization,
service catalogs, observability, and AI context. Portolan's useful wedge is not
to beat each tool in its own category. The wedge is to normalize mixed evidence
from many sources into one honest graph.

## Candidate Inputs

Evaluate candidates by format stability, license, local execution, privacy
posture, maintenance health, and adapter cost.

Potential input families:

- source graph and context tools;
- repository packers;
- service catalog exports;
- observability exports;
- dependency and build metadata;
- human-maintained inventory files.

Candidate names from discovery include Graphify, GitNexus, CodeGraphContext,
codebase-memory-mcp, Serena, and Repomix. Each needs a fresh license and
maintenance review before integration.

See `docs/research/2026-05-26-large-codebase-oss-landscape.md` for the current
large-codebase OSS landscape and the recommended agent-context direction.

## Current Validation Status

These states are product-evidence states, not a list of tools found on one
developer machine. A local binary on `PATH` is not success until bounded native
OSS output is generated, preserved, normalized, and recorded.

| Component | Current state | Evidence boundary |
| --- | --- | --- |
| Syft / CycloneDX | `verified` narrowly | Syft produced local CycloneDX SBOM output for named stress targets; current atlas scans preserve it under bundle producers and normalize dependency evidence as `metadata-visible`. This supports component identity and shared-dependency evidence only. |
| jscpd | `narrowed` / mixed | A bounded jscpd run on the Portolan repository smoke target produced usable JSON and was preserved as `metadata-visible`. A separate large stress-target jscpd run failed before usable JSON output, so broad near-clone evidence remains unproven. |
| Semgrep | `verified` as a local OSS output contract | Native Semgrep CLI output with a local config and explicit JSON output path can be preserved by `portolan-scan` as `metadata-visible` atlas evidence. Agents should use Semgrep's native CLI/skill/MCP surfaces when available; Portolan does not claim registry-backed configs, remote rules, or broad rule-value coverage by default. |
| Graphify | `verified` for raw node-link import and source-backed `EXTRACTED` verification | Native Graphify CLI/skill/MCP output can be imported when it produces local `graphify-out/graph.json` node-link data. The Graphify-style fixture validates confidence-to-evidence-state mapping. `portolan import graphify` normalizes raw `nodes`/`links` or `nodes`/`edges` outputs and can mark `EXTRACTED` facts `source-visible` when `--root` is supplied and `source_file` is readable inside that root. Graphify MCP/LLM behavior, PR dashboards, source-range hashing, and large-graph limits are still outside the importer contract. |
| SCIP / Serena-style symbol indexes | `verified` narrowly for bounded JSON symbol-index import; SCIP CLI `verified` only | SCIP CLI help ran from the local snapshot, proving protocol tooling availability. `portolan import symbol-index` normalizes a local SCIP/Serena-style JSON export into document and symbol metadata. SCIP protobuf parsing, real SCIP indexer output, real Serena export, LSP/MCP daemon behavior, semantic correctness, and call-graph completeness remain unassessed. |
| Repomix | `verified` as a file-inventory import path | Native Repomix CLI/skill/MCP output can be imported from an explicit local output path. `portolan import repomix` normalizes local packed-output file paths as `metadata-visible` inventory and marks disabled security-check packs as `cannot_verify`. Packed source parsing as architecture facts, redaction enforcement, and token/summary semantics remain unimplemented. |

## First-Wave Adapter Profiles

The active OSS decision surface is
`docs/captain-atlas/06-oss-kill-gates.md`. Current adapter profiles:

- `docs/adapter-contracts/graphify-profile.md`: Graphify is accepted through
  native OSS output plus a local adapter-contract validation profile, raw
  node-link import, and source-backed verification for readable `source_file`
  paths under `--root`.
  `EXTRACTED` producer confidence is `source-visible` only after Portolan source
  inspection, otherwise `metadata-visible`; `INFERRED` is `claim-only`, and
  `AMBIGUOUS` is `cannot_verify`.
- `docs/adapter-contracts/symbol-index-profile.md`: SCIP and Serena-style
  symbol exports are accepted for bounded local JSON symbol-index import, not
  as SCIP protobuf parsing or LSP/MCP daemon behavior.
- `docs/adapter-contracts/repomix-profile.md`: Repomix is accepted as a
  repository-pack profile and bounded file-inventory import. Packed source
  content is navigation context, not architecture truth, and requires redaction
  before sharing.

Future OSS decisions should be recorded as captain-atlas scorecards, with a
clear kill, pack, or build recommendation.

## Integration Rules

- Import outputs; do not vendor large tools by default.
- Treat OSS scanners as optional local dependencies. Portolan may run or import
  them only after the tool is installed locally and the user has approved that
  evidence source.
- Verify upstream tools before running native OSS commands: Semgrep
  (<https://semgrep.dev/docs/getting-started/quickstart>), Repomix
  (<https://github.com/yamadashy/repomix>), Graphify
  (<https://github.com/safishamsi/graphify>), Syft
  (<https://github.com/anchore/syft>), and jscpd (<https://jscpd.dev/>).
- Validate a proposed tool-output adapter with
  `portolan adapter validate --in <adapter.json>` before adding it to agent
  workflows.
- Record source attribution for every imported fact.
- Preserve tool uncertainty instead of normalizing everything into a pass/fail
  shape.
- Keep no-network and no-daemon defaults until a profile explicitly changes
  them.

The current public adapter contract is documented in
`docs/adapter-contracts/oss-adapter-contract.md`; fixtures live under
`internal/testfixtures/oss-adapter-contract/`.
