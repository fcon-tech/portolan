# Product Quality Boundary

Portolan is trustworthy only when its output stays inside the evidence it can
read locally. A useful report may be thin. It must not be falsely complete.

Use this page before publishing product copy, report output, demo text, or
agent instructions. For individual product claims, use
[Product Claims](product-claims.md) as the claim ledger.

## Guarantees

| Guarantee | Required Inputs | Mechanism | Verification | Limits |
| --- | --- | --- | --- | --- |
| Local read-only execution | Local target path and explicit output path | CLI reads local files and writes selected artifacts | `go test -count=1 ./...`; focused command smoke | Installed OSS producers may read target files when explicitly invoked |
| Evidence-labeled findings | Portolan graph, findings, coverage, or imported tool output | Records carry evidence state and source references | `jq empty schema/*.json`; focused package tests | Evidence labels do not prove completeness |
| Visible weak states | Coverage, findings, or report-quality summary | `unknown`, `cannot_verify`, and `not_assessed` remain report-visible | `portolan report quality --summary <file>` | A visible gap may still require human follow-up |
| Zero unsupported positive report claims | Report-quality summary | Positive claims require `evidence_ref` and `supported: true` | `portolan report quality --summary <file>` | This checks the summary contract, not prose style |

## Non-Guarantees

| Unsupported Claim | Why Unsupported | Required Evidence | Current Label |
| --- | --- | --- | --- |
| Complete architecture understanding | Local files and optional exports are partial by default | Explicit inventory plus source, metadata, and runtime evidence | `not_assessed` or `unknown` |
| Complete runtime topology | Source/config evidence is not runtime observation | Supported runtime observations with scope and freshness | `not_assessed` unless observed |
| Security posture certification | Portolan has focused local safety tests, not full security assessment | Separate security review and tool evidence | `not_assessed` |
| Modernization or readiness decision | Portolan generates evidence candidates, not executive decisions | Human review and separate readiness criteria | `not_assessed` |
| Broad harness compatibility | Static docs/rules do not prove runtime behavior | Recorded runtime lane evidence per harness | `not_assessed` for unrun lanes |

## Canonical Wording

Safe:

- Portolan prepares local evidence artifacts for agent review.
- Portolan reports what is visible, claimed, missing, unknown, or unverifiable.
- Portolan can support narrow claims when the exact evidence source is named.

Unsafe:

- Portolan understands the whole system.
- Portolan proves runtime topology from source files.
- Portolan certifies security, health, readiness, or modernization priority.
- A harness adapter file proves that harness works end to end.

## Report Quality Gate

Generated reports are product-ready only when their report-quality summary
passes:

```bash
portolan report quality --summary <report-summary.json>
```

The gate fails when a required section is missing, a positive claim lacks local
evidence, an unsupported positive claim is present, or a weak state is hidden.
Optional producer absence is reported as a warning unless the report hides the
gap completely.
