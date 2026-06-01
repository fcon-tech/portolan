# Architecture Understanding Ledger Contract

The ledger is a Markdown table or JSONL file that records the same fixed
question set across Cursor-only and Cursor-plus-Portolan lanes.

Required columns:

| Column | Meaning |
| --- | --- |
| `question_id` | Stable question id from the rubric. |
| `evidence_families` | Required evidence families for the question. |
| `cursor_only_status` | Score for the Cursor-only answer. |
| `cursor_plus_portolan_status` | Score for the Cursor-plus-Portolan answer. |
| `delta` | Evidence/correctness/unknown-handling change caused by Portolan context. |
| `claim_status` | Final claim status. |
| `supporting_evidence` | Local files or commands supporting the score. |
| `remaining_gap` | Missing evidence or reason the claim cannot be verified. |

Runtime questions may not be `verified` unless supporting evidence includes
`runtime-visible` Bigtop runtime observations. Static deployment, API/catalog,
dependency, or source evidence is insufficient for runtime topology.
