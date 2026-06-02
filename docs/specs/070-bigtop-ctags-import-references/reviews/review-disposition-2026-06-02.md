# Review Disposition: Spec 070

Date: 2026-06-02
Branch: `codex/070-bigtop-ctags-import-references`

## Lane Status

| Lane | Model | Status | Disposition |
| --- | --- | --- | --- |
| DeepSeek | `openrouter/deepseek/deepseek-v4-pro` | assessed | Accepted scope, role-classification, selected-path provenance, hash/size, and Cursor reproducibility clarifications. |
| MiMo | `openrouter/xiaomi/mimo-v2.5-pro` | assessed | Accepted discarded-attempt, pseudo-record, invariant, wording, FR-006, and environment clarifications. |
| GLM | `zai/glm-5.1` | assessed | Accepted discarded-attempt, def-role disposition, hash/size, and binary provenance clarifications. |

## Accepted Findings

| ID | Source | Severity | Finding | Fix |
| --- | --- | --- | --- | --- |
| F1 | DeepSeek | critical | Java/Go language filter needed explicit scope and excluded-language rationale. | Added Java/Go-only scope and excluded C/C++, Python, shell, Scala/Kotlin/Groovy surfaces to spec, plan, ledger, and stress wording. |
| F2 | DeepSeek / GLM | major / minor | `def` package records needed classification to avoid false method/class definition claims. | Ledger now states `def` records are direct ctags package declaration output, excluded from import-reference claim, and not method/class definitions. |
| F3 | DeepSeek | major | Selected target path provenance was under-documented. | Ledger now states spec 059 selected-target file was copied byte-for-byte and lists target repo heads plus dirty counts. |
| F4 | DeepSeek / GLM | minor | Hashes and sizes for raw output were not visible in ledger. | Added key hashes and sizes, including raw JSONL hash and byte size. |
| F5 | MiMo / GLM | minor | Discarded first attempt and 33 pseudo records needed explicit disposition. | Ledger now says first output was overwritten and enumerates the 33 pseudo/header records. |
| F6 | MiMo | critical | FR-006 side-effect boundary needed explicit attestation. | Ledger now states output was written only to external `$OUT`, target repos were not mutated, no services/Kubernetes/build/network tooling were used. |
| F7 | MiMo | major | "verified bounded package import-reference evidence" could imply completeness. | Stress wording now says verified partial Java/Go package import-reference evidence. |
| F8 | DeepSeek | minor | Cursor did not reproduce byte-level output. | Cursor stress ledger now states Cursor reviewed recorded counts; byte-level verification is by external hashes/sizes. |

## Rejected Or Adjusted Findings

| ID | Source | Finding | Decision |
| --- | --- | --- |
| R1 | DeepSeek | Critical severity for Java/Go scope. | Accepted as a documentation fix, but not as a product blocker because spec 070 intentionally targets a bounded role supported by installed ctags. |
| R2 | MiMo | Runtime/build/network not assessed. | Recorded as out of scope and explicitly attested for this run rather than expanding the slice. |

## Final Review Decision

verified:

- Three assessed non-GPT review lanes completed.
- Accepted findings were fixed in spec, plan, ledger, stress output, and review
  disposition.
- The slice preserves the full C6 boundary.

partial:

- C6 is stronger than definitions-only because Java/Go package import
  references are verified, but full symbol/reference graph remains unverified.

cannot_verify:

- Method/class references.
- Cross-reference resolution.
- Call graph.
- Runtime topology.
- Human/enterprise architecture parity.
