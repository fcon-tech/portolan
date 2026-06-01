# Contract: Relationship Evidence Import

## Supported Input Families

Initial support must use local files only:

```json
{
  "id": "sbom-api",
  "kind": "dependency",
  "tool": "syft",
  "path": "tool-outputs/sbom-api.cyclonedx.json",
  "repository": "repo-api",
  "limitations": ["local fixture or bounded producer output"]
}
```

Symbol evidence must use the same selection/tool-output principle rather than a
language-specific scanner contract:

```json
{
  "id": "symbols-api",
  "kind": "symbol-index",
  "tool": "scip-or-serena",
  "path": "tool-outputs/symbol-index-api.json",
  "repository": "repo-api",
  "limitations": ["symbol identity only; not complete call graph"]
}
```

If schema compatibility requires a new `tool_outputs[].kind`, update
`schema/selection.schema.json`, selection validation, fixture docs, and
contract examples together.

## Map Bundle Output Expectations

Relationship evidence imported from producer outputs must appear in:

- `graph.json`: nodes and edges with evidence state/source;
- `findings.jsonl`: relationship findings for observed and degraded evidence;
- `summary.json` or a bounded adjacent summary: counts by evidence family,
  repository, and evidence state;
- `graph-index.json`: bounded edge/finding samples;
- `coverage.json`: selected producer artifact coverage;
- `map.md`: human-readable summary derived from graph/findings.

Positive relationship findings must cite the local evidence source.

## Context Output Expectations

`portolan context prepare` must keep producer evidence bounded:

- `tool-registry.json`: producer-output candidates and observed summaries;
- `evidence-index.jsonl`: relationship evidence/gap records suitable for first
  agent pass, plus bounded source-visible relationship candidates for
  build/deploy surfaces such as build manifests, distribution manifests, RPM
  specs, and deployment manifests;
- `gaps.jsonl`: missing dependency/symbol evidence families and affected
  scopes;
- `oss-plan.json`: local native producer recipes only when safe and bounded.

Relationship-candidate records are navigation hints, not parsed relationship
claims. They MUST preserve semantic parsing as `not_assessed` until a selected
producer output or a later approved parser imports evidence with source
references.

## Degraded Evidence Rules

- Missing input: `not_assessed`.
- Unreadable or malformed input: `cannot_verify`.
- Valid but partial input: observed only for the declared scope; remaining
  scope stays `not_assessed`.
- Producer inference without local verification: `claim-only` or
  `cannot_verify`, never source-visible.
- Runtime topology: remains `not_assessed` unless local runtime observations
  exist.

## Baseline Comparison Rule

No-Portolan comparison prompts and ledgers must forbid both `.portolan/` and
legacy root-level `run/` artifacts. Any lane that reads those artifacts is
contaminated and must be rerun from a clean start.
