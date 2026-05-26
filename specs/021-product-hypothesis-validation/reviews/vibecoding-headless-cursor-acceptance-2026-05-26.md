# Hypothesis Ledger: Vibe Coding Headless Cursor Acceptance

## Target

- Local target root: `/home/fall_out_bug/projects/vibe_coding`
- Acceptance client: `cursor-agent --print --mode ask --trust`
- Context pack: `/tmp/portolan-vibecoding-context-028`
- Map bundle: `/tmp/portolan-vibecoding-map-028`

This target was selected because it is a real local multi-repo folder, not a
prepared Bigtop fixture or a curated selection file.

## Pre-Fix Failure

Initial `portolan map --root /home/fall_out_bug/projects/vibe_coding` failed:

```text
map: read findings: bufio.Scanner: token too long
```

Accepted product finding: real map findings can exceed the default scanner
token limit. This blocked the agent before Cursor could use Portolan's answer
contract.

## Fix

`specs/028-large-findings-jsonl/` replaces scanner-based findings reading with
a long-line-safe JSONL reader and adds a regression test for a finding line
larger than 64 KiB.

## Verified Portolan Evidence

After the fix:

```bash
.portolan/bin/portolan context prepare --root /home/fall_out_bug/projects/vibe_coding --out /tmp/portolan-vibecoding-context-028 --profile cursor --force
.portolan/bin/portolan map --root /home/fall_out_bug/projects/vibe_coding --out /tmp/portolan-vibecoding-map-028 --force
```

Observed summary:

- Repositories: 30
- Coverage records: 32
- Graph nodes: 780236
- Graph edges: 797749
- Findings: 2450
- Findings by kind: configuration 1196, duplication 1032, inventory 30,
  relationships 188, technical-debt 4
- Findings by status: observed 1144, cannot_verify 891, not_assessed 414,
  unknown 1
- `graph.json`: 680659572 bytes
- `map.md`: 1183418 bytes
- `findings.jsonl`: 2782617 bytes
- Longest finding JSONL line observed: 946192 bytes

## Cursor Agent Result

Prompt asked Cursor Agent to read `answer-contract.md`, `agent-brief.md`,
`gaps.jsonl`, and `summary.json`, avoid loading full `graph.json` unless
necessary, and answer a CTO question using the required fields.

Result classification:

- `verified`: Cursor Agent produced `Answer`, `Evidence`, `Unknowns`, and
  `Next local command`.
- `verified`: Cursor Agent treated the target as a 30-repo local workspace and
  preserved external completeness as `unknown`.
- `verified`: Cursor Agent did not claim full runtime topology, non-Go coupling,
  near-clone duplication, API/catalog coverage, SBOM duplication, or semantic
  config correctness.
- `verified`: Cursor Agent cited `summary.json`, `gaps.jsonl`, `map.md`,
  `findings.jsonl`, and context artifacts instead of inventing unsupported
  architecture facts.
- `verified`: Cursor Agent did not load full `graph.json` and explicitly
  treated it as unnecessary for the first answer.

## Hypothesis Status

- H1: strengthened. Portolan context/map made Cursor scope claims bounded and
  explicit.
- H2: partially supported. Exact duplicate findings were usable, but near-clone
  and SBOM/component duplication stayed `not_assessed`.
- H3: partially supported. Source-visible Go relationship findings were usable,
  but Backstage/OpenAPI/AsyncAPI/Structurizr inputs were absent and correctly
  reported as `not_assessed`.
- H4: strengthened. `answer-contract.md` kept the response compact and
  evidence-shaped instead of a raw dump.
- H5: strengthened for headless Cursor Agent. UI Cursor/Composer acceptance is
  still separate.
- H6: supported on this target.

## Accepted Product Gaps

- Raw `graph.json` at ~681 MB is not an agent-friendly first-read artifact.
  `summary.json` made the run usable, but the product still needs bounded graph
  slices or query surfaces.
- `map.md` at ~1.18 MB is readable but not compact enough for repeated agent
  prompting on larger landscapes.
- OSS producers were absent in this run. `oss-plan.json` remains the right
  place to decide whether to run jscpd, Syft/CycloneDX, Semgrep, or catalog
  producers, but this acceptance did not run them.

## Evidence State

- Context preparation: `verified`
- Map bundle after fix: `verified`
- Headless Cursor Agent answer-contract compliance: `verified`
- Full ecosystem completeness: `unknown`
- UI Cursor/Composer lane: `not_assessed`
- Runtime topology: `not_assessed`
- Near-clone/component duplication: `not_assessed`
- Semantic config correctness: `not_assessed`
