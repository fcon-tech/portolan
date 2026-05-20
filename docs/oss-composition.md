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

## Integration Rules

- Import outputs; do not vendor large tools by default.
- Record source attribution for every imported fact.
- Preserve tool uncertainty instead of normalizing everything into a pass/fail
  shape.
- Keep no-network and no-daemon defaults until a profile explicitly changes
  them.
