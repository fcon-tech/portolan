# Client-Safe Answer

Date: 2026-05-27

Question: Why Portolan if we already have Cursor?

## Answer

Portolan is useful when Cursor needs a bounded local evidence pack before it
answers architecture or estate questions. In the fixed local Bigtop headless
comparison, the Portolan-assisted lane reduced unsupported claims from 12 to 0
and produced equal or better next actions across all five tested questions
(`C001`).

The practical value is evidence discipline. Portolan prepares local context,
map, graph, finding, and answer-contract artifacts that tell an agent what is
visible, what is only declared, what is missing, and what remains unknown
(`C002`). That makes Cursor less likely to turn local files, partial scans, or
planned OSS integrations into broader claims.

The current validated claim is narrow. Portolan can support local visible-scope
mapping, exact duplicate-cluster evidence, relationship evidence by type, and
Syft/CycloneDX component identity evidence where those artifacts exist
(`C005`, `C006`, `C007`). It should be described as a complement to Cursor and
enterprise tools, not as their replacement (`C008`).

## Limitations To Keep Visible

- Portolan is a local evidence-preparation tool, not a live service, SLA,
  observability system, modernization engine, or control plane.
- UI Cursor/Composer behavior is `not_assessed`; the comparison evidence is for
  headless Cursor on the fixed local Bigtop target (`C009`).
- Complete inherited-estate coverage is not proven by a local repository count;
  use local visible-scope wording unless an inventory verifies completeness
  (`C003`).
- Runtime service topology remains `not_assessed` without runtime observations
  (`C004`).
- OSS producer validation is currently narrow: Syft/CycloneDX component
  identity is verified for the fixed target, while jscpd near-clone evidence
  failed in the full generated-file-heavy run and Semgrep remains
  `not_assessed` (`C005`, `C006`).
- Output quality depends on the local evidence supplied to Portolan. Missing,
  stale, or incomplete inputs must stay visible as gaps, not be hidden as
  product success.

## Trace

Positive claims used: C001, C002, C005, C006, C007.

Rejected or limiting claims carried forward: C003, C004, C008, C009.
