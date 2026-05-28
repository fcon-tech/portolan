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
developer machine. A local binary on `PATH` is not success until a bounded
producer output is generated, preserved, normalized, and recorded.

| Component | Current state | Evidence boundary |
| --- | --- | --- |
| Syft / CycloneDX | `verified` narrowly | Syft produced a local CycloneDX SBOM for the fixed Bigtop target; Portolan preserved it in the context pack and recorded CycloneDX as `metadata-visible`. This supports component identity evidence only. |
| jscpd | `narrowed` / mixed | A bounded jscpd run on the Portolan repository smoke target produced usable JSON and was preserved as `metadata-visible`. The earlier full Bigtop jscpd run failed before usable JSON output, so Bigtop near-clone evidence remains unproven. |
| Semgrep | `verified` as a first-class local OSS producer path | `portolan produce semgrep` invokes installed Semgrep with a local config and explicit JSON output path. A real Semgrep 1.157.0 run produced findings on a temporary local target, and `context prepare` preserved that JSON as `metadata-visible`. Registry-backed configs, remote rules, and broad rule-value claims remain outside the default boundary. |
| Graphify | `verified` as a first-class local OSS producer path plus raw node-link import and source-backed `EXTRACTED` verification | `portolan produce graphify` invokes installed Graphify through a staged source copy under an explicit output directory, so the target checkout remains read-only. The Graphify-style fixture validates confidence-to-evidence-state mapping. A local Graphify snapshot also produced `graphify-out/graph.json` on a temporary target. `portolan import graphify` normalizes raw `nodes`/`links` or `nodes`/`edges` outputs and can mark `EXTRACTED` facts `source-visible` when `--root` is supplied and `source_file` is readable inside that root. Graphify MCP/LLM behavior, PR dashboards, source-range hashing, and large-graph limits are still outside the importer contract. |
| SCIP / Serena-style symbol indexes | `verified` narrowly for bounded JSON symbol-index import; SCIP CLI `verified` only | SCIP CLI help ran from the local snapshot, proving protocol tooling availability. `portolan import symbol-index` normalizes a local SCIP/Serena-style JSON export into document and symbol metadata. SCIP protobuf parsing, real SCIP indexer output, real Serena export, LSP/MCP daemon behavior, semantic correctness, and call-graph completeness remain unassessed. |
| Repomix | `verified` as a first-class local OSS producer and file-inventory import path | `portolan produce repomix` invokes installed Repomix with an explicit local output path and security checks enabled by default. `repomix@1.14.1` also packed a temporary one-file local target. `portolan import repomix` normalizes local packed-output file paths as `metadata-visible` inventory and marks disabled security-check packs as `cannot_verify`. Packed source parsing as architecture facts, redaction enforcement, and token/summary semantics remain unimplemented. |

## First-Wave Adapter Profiles

Spec `specs/042-agent-adapter-layer/` adds the first productization wave of
adapter profiles:

- `docs/adapter-contracts/graphify-profile.md`: Graphify is accepted as an
  installed local OSS producer invoked by Portolan through a staging copy, plus
  a local adapter-contract validation profile, raw node-link import, and
  source-backed verification for readable `source_file` paths under `--root`.
  `EXTRACTED` producer confidence is `source-visible` only after Portolan source
  inspection, otherwise `metadata-visible`; `INFERRED` is `claim-only`, and
  `AMBIGUOUS` is `cannot_verify`.
- `docs/adapter-contracts/symbol-index-profile.md`: SCIP and Serena-style
  symbol exports are accepted for bounded local JSON symbol-index import, not
  as SCIP protobuf parsing or LSP/MCP daemon behavior.
- `docs/adapter-contracts/repomix-profile.md`: Repomix is accepted as a context
  pack profile and bounded file-inventory import. Packed source content is
  context, not architecture truth, and requires redaction before sharing.

The first-wave evaluation ledger is recorded in
`specs/042-agent-adapter-layer/reviews/oss-candidate-ledger-2026-05-27.md`.
The follow-up producer smoke ledger is recorded in
`specs/042-agent-adapter-layer/reviews/oss-composition-followup-2026-05-27.md`.

## Integration Rules

- Import outputs; do not vendor large tools by default.
- Treat OSS scanners as optional local dependencies. Portolan may run or import
  them only after the tool is installed locally and the user has approved that
  evidence source.
- Verify upstream tools before running producers: Semgrep
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
`testdata/oss-adapter-contract/`.
