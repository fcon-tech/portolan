# Comparison Ledger: Cursor Comparison Validation

Date: 2026-05-26

## Target

- Target path: `/home/fall_out_bug/projects/bigtop-landscape`
- Target class: local Apache Bigtop landscape
- Local checkout scope: 18 Git repositories under `repos/`
- Local checkout completeness: `unknown`
- Full Apache Bigtop ecosystem completeness: `unknown`

## Lane Inputs

```json
{
  "lane_id": "cursor-alone",
  "run_state": "completed",
  "prompt_path": "specs/034-cursor-comparison-validation/reviews/cursor-alone-prompt.md",
  "raw_output_path": "specs/034-cursor-comparison-validation/reviews/cursor-alone-output.md",
  "input_artifacts": [],
  "failure_reason": ""
}
```

```json
{
  "lane_id": "cursor-plus-portolan",
  "run_state": "completed",
  "prompt_path": "specs/034-cursor-comparison-validation/reviews/cursor-plus-portolan-prompt.md",
  "raw_output_path": "specs/034-cursor-comparison-validation/reviews/cursor-plus-portolan-output.md",
  "input_artifacts": [
    "/tmp/portolan-034-bigtop-context/",
    "/tmp/portolan-034-bigtop-map/summary.json",
    "/tmp/portolan-034-bigtop-map/graph-index.json"
  ],
  "failure_reason": ""
}
```

## Prompts And Raw Outputs

- Shared prompt:
  `specs/034-cursor-comparison-validation/reviews/shared-five-question-prompt.md`
- Cursor-alone prompt:
  `specs/034-cursor-comparison-validation/reviews/cursor-alone-prompt.md`
- Cursor-alone raw output:
  `specs/034-cursor-comparison-validation/reviews/cursor-alone-output.md`
- Cursor-plus-Portolan prompt:
  `specs/034-cursor-comparison-validation/reviews/cursor-plus-portolan-prompt.md`
- Cursor-plus-Portolan raw output:
  `specs/034-cursor-comparison-validation/reviews/cursor-plus-portolan-output.md`

## Per-Question Scores

```json
{
  "question_id": "scope-completeness",
  "lane_id": "cursor-alone",
  "unsupported_claim_count": 3,
  "scope_correct": "partial",
  "evidence_use": "partial",
  "unknown_handling": "yes",
  "next_action_quality": "equal",
  "notes": "Correctly counted 18 local repos and marked full corpus unknown, but mixed target-only inspection with selection.json/BOM-derived component assertions and version-alignment claims that were not preserved as bounded artifact evidence."
}
```

```json
{
  "question_id": "scope-completeness",
  "lane_id": "cursor-plus-portolan",
  "unsupported_claim_count": 0,
  "scope_correct": "yes",
  "evidence_use": "yes",
  "unknown_handling": "yes",
  "coverage_completeness": "partial-bounded",
  "next_action_quality": "equal",
  "notes": "Used repos.json, evidence-index.jsonl, summary.json, and gaps.jsonl; kept local checkout scope and external completeness separate."
}
```

```json
{
  "question_id": "duplicate-component-risk",
  "lane_id": "cursor-alone",
  "unsupported_claim_count": 3,
  "scope_correct": "partial",
  "evidence_use": "partial",
  "unknown_handling": "partial",
  "next_action_quality": "worse",
  "notes": "Identified plausible overlap among Airflow/Oozie, Spark/Flink, Hive/Phoenix/Spark/Solr/Zeppelin, and Alluxio/HDFS, but these are architectural inferences rather than measured duplication or component-identity evidence."
}
```

```json
{
  "question_id": "duplicate-component-risk",
  "lane_id": "cursor-plus-portolan",
  "unsupported_claim_count": 0,
  "scope_correct": "yes",
  "evidence_use": "yes",
  "unknown_handling": "yes",
  "coverage_completeness": "partial-bounded",
  "next_action_quality": "better",
  "notes": "Used observed exact duplicate findings and explicitly limited claims to byte-identical source/config clusters; marked near-clone and SBOM/component duplication as not_assessed."
}
```

```json
{
  "question_id": "implicit-knowledge",
  "lane_id": "cursor-alone",
  "unsupported_claim_count": 1,
  "scope_correct": "partial",
  "evidence_use": "partial",
  "unknown_handling": "yes",
  "next_action_quality": "equal",
  "notes": "Surfaced useful BOM, packaging, smoke-test, and release-note signals, but did not separate source-visible implicit knowledge from a reusable evidence index."
}
```

```json
{
  "question_id": "implicit-knowledge",
  "lane_id": "cursor-plus-portolan",
  "unsupported_claim_count": 0,
  "scope_correct": "yes",
  "evidence_use": "yes",
  "unknown_handling": "yes",
  "coverage_completeness": "partial-bounded",
  "next_action_quality": "equal",
  "notes": "Grounded claims in context-pack files, graph-index samples, summary.json, and explicit gaps for missing catalog/API/tool outputs."
}
```

```json
{
  "question_id": "service-relationships",
  "lane_id": "cursor-alone",
  "unsupported_claim_count": 4,
  "scope_correct": "partial",
  "evidence_use": "partial",
  "unknown_handling": "partial",
  "next_action_quality": "worse",
  "notes": "Listed many plausible package/build/README relationships and some runtime-sounding relationships, but source inspection alone did not provide runtime or service-topology evidence."
}
```

```json
{
  "question_id": "service-relationships",
  "lane_id": "cursor-plus-portolan",
  "unsupported_claim_count": 0,
  "scope_correct": "yes",
  "evidence_use": "yes",
  "unknown_handling": "yes",
  "coverage_completeness": "partial-bounded",
  "next_action_quality": "better",
  "notes": "Limited observed relationship claims to Go import/go.mod edges and source-visible deployment groupings; marked non-Go relationships and runtime topology as not_assessed."
}
```

```json
{
  "question_id": "next-actions",
  "lane_id": "cursor-alone",
  "unsupported_claim_count": 1,
  "scope_correct": "partial",
  "evidence_use": "partial",
  "unknown_handling": "yes",
  "next_action_quality": "worse",
  "notes": "Recommended useful manual follow-up, but some actions depended on reading external manifests or ad hoc extraction without a bounded artifact path."
}
```

```json
{
  "question_id": "next-actions",
  "lane_id": "cursor-plus-portolan",
  "unsupported_claim_count": 0,
  "scope_correct": "yes",
  "evidence_use": "yes",
  "unknown_handling": "yes",
  "coverage_completeness": "partial-bounded",
  "next_action_quality": "better",
  "notes": "Produced bounded next local actions tied to selection/manifest, graph slice commands, and OSS producer gaps."
}
```

## Unsupported Claim Delta

- Cursor-alone unsupported claims: 12
- Cursor-plus-Portolan unsupported claims: 0
- Reduction: 100%
- Threshold: at least 50%
- Result: `verified` pass

## Useful Next Action Comparison

- Equal or better questions: 5 of 5
- Equal or better percent: 100%
- Threshold: at least 75%
- Result: `verified` pass

## Final Product Claim Decision

```json
{
  "unsupported_claim_reduction_percent": 100,
  "next_action_equal_or_better_percent": 100,
  "decision": "accepted",
  "decision_rationale": "Cursor-plus-Portolan passed both configured thresholds on the fixed Bigtop target: unsupported claims dropped from 12 to 0 and useful next actions were equal or better for all five questions.",
  "limitations": [
    "UI Cursor/Composer lane not_assessed",
    "Full Apache Bigtop ecosystem completeness unknown",
    "Runtime service topology not_assessed",
    "Near-clone and SBOM/component duplication not_assessed",
    "OSS producers not executed",
    "Zero unsupported claims in the assisted lane includes bounded abstention on unsupported surfaces; it does not mean complete relationship, runtime, SBOM, or ecosystem coverage"
  ]
}
```

## Coverage Interpretation

The accepted claim is about evidence discipline and bounded next-action quality,
not complete landscape understanding. The assisted lane reached zero unsupported
claims partly by refusing to answer beyond observed or indexed evidence. That is
the desired safety behavior for this validation, but it leaves service topology,
non-Go relationships, near-clone duplication, SBOM/component identity, runtime
state, and full ecosystem completeness as incomplete coverage.

Accepted product claim:

> On the fixed local Bigtop landscape, Portolan gives Cursor a bounded evidence
> context that reduced unsupported claims from 12 to 0 and produced equal or
> better next actions for all five questions. It keeps local checkout scope
> separate from ecosystem completeness, prevents unsupported relationship and
> duplication claims, and turns missing evidence into explicit `unknown` or
> `not_assessed` follow-up work.

## Not Assessed / Unknown / Blocked Surfaces

- UI Cursor/Composer lane: `not_assessed`
- Full Apache Bigtop ecosystem completeness: `unknown`
- Runtime-visible service topology without local runtime exports:
  `not_assessed`
- Near-clone and semantic duplication: `not_assessed`
- Component/SBOM duplicate risk: `not_assessed`
- OSS producers such as jscpd, Syft/CycloneDX, and Semgrep: `not_assessed`
- Portolan full `graph.json` as first-pass prompt input: avoided and
  `not_assessed`
