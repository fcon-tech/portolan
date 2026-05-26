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

## Integration Rules

- Import outputs; do not vendor large tools by default.
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
