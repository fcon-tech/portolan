# Cursor Plus Portolan Parity Rubric Stress

You are Cursor Agent `composer-2.5` working in the local Bigtop landscape
workspace. Use the Portolan evidence summary below as additional context. Do not
upgrade missing evidence to success.

## Portolan Evidence Summary

From merged Portolan specs 054-057:

- Static deployment-model evidence exists from Docker Compose and Helm outputs.
- Bounded protobuf API schema/catalog evidence exists, including an expanded
  Alluxio descriptor over 27 proto files.
- Bounded duplication evidence exists from jscpd on Bigtop tests/framework.
- Partial selected-file symbol listing exists from `gopls` for Airflow Go SDK
  files.
- Bigtop runtime topology remains `not_assessed`; no runtime-visible Bigtop
  observation export is selected.
- Full Bigtop symbol/reference graph remains `not_assessed`; no full
  definition/reference producer output is available.
- Enterprise code-intelligence parity remains `not_assessed`.

Use this rubric:

| ID | Capability | Verified requires |
| --- | --- | --- |
| C1 | Landscape scope and role map | Repo inventory, role evidence, and explicit unknowns for selected Bigtop scope |
| C2 | Static dependency and relationship graph | Evidence-backed source/metadata relationships with queryable graph support |
| C3 | Deployment model | Rendered or parsed local deployment artifacts with evidence states |
| C4 | Runtime topology | Runtime-visible process/service/container/orchestrator observation for bounded Bigtop runtime |
| C5 | API/catalog/model surfaces | Real producer outputs such as protobuf descriptors, OpenAPI, schema/catalog exports, or generated model metadata with scope and validation |
| C6 | Symbol/reference graph | Producer output with definitions and references for declared selected scope |
| C7 | Evidence-state discipline | Every claim carries verified/partial/not_assessed/cannot_verify boundary and cites producer/run IDs |
| C8 | Cursor augmentation value | Same-question Cursor-only and Cursor-plus-Portolan comparison shows improved correctness, evidence discipline, or gap attribution |
| C9 | Enterprise parity threshold | C1-C8 verified for declared selected scope, with runtime and symbol/reference covered or explicitly excluded from a narrowed claim |

Required output:

1. A markdown table with columns:
   `criterion`, `answer`, `portolan_evidence_used`, `status`, `remaining_gap`,
   `delta_vs_cursor_only_expected`.
2. Use only statuses: `verified`, `partial`, `not_assessed`, `cannot_verify`.
3. Cite producer/evidence families where useful: protobuf descriptor, Helm,
   Docker Compose, jscpd, gopls, runtime probe, symbol probe.
4. Do not claim runtime topology unless runtime-visible evidence exists.
5. Do not claim full symbol/reference graph unless definition/reference producer
   output exists.
6. End with one sentence answering: "Can Cursor plus Portolan prove enterprise
   code-intelligence parity for Bigtop here?"
