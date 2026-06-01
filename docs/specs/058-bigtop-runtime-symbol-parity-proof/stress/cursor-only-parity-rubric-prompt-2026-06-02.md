# Cursor-Only Parity Rubric Stress

You are Cursor Agent `composer-2.5` working in the local Bigtop landscape
workspace. Do not use Portolan artifacts, Portolan specs, or prior Portolan
review ledgers. Use only what you can infer from the local Bigtop workspace
itself.

Answer against this rubric:

| ID | Capability |
| --- | --- |
| C1 | Landscape scope and role map |
| C2 | Static dependency and relationship graph |
| C3 | Deployment model |
| C4 | Runtime topology |
| C5 | API/catalog/model surfaces |
| C6 | Symbol/reference graph |
| C7 | Evidence-state discipline |
| C8 | Cursor augmentation value |
| C9 | Enterprise parity threshold |

Required output:

1. A markdown table with columns:
   `criterion`, `answer`, `evidence_used`, `status`, `remaining_gap`.
2. Use only statuses: `verified`, `partial`, `not_assessed`, `cannot_verify`.
3. Do not claim runtime topology unless you found runtime-visible process,
   service, container, endpoint, or orchestrator observations for Bigtop.
4. Do not claim full symbol/reference graph unless you found producer output
   with definitions and references for a declared selected scope.
5. End with one sentence answering: "Can Cursor alone prove enterprise
   code-intelligence parity for Bigtop here?"
