# Pre-Implementation Analyze: Spec 057

Date: 2026-06-02
Branch: `codex/057-bigtop-producer-output-expansion`

## Scope

Acquire additional real local Bigtop producer outputs beyond Syft/CycloneDX and
record which producer families remain blocked or not_assessed.

## Decision Gate

- Simpler/Faster: run installed OSS producer tools and ledger outputs instead
  of implementing new Portolan scanners.
- Blocking Edge Cases: runtime topology requires runtime-visible observations;
  semgrep `--config auto` requires metrics or a local config; symbol/reference
  coverage may be bounded to available language tooling.
- Existing Open Source: `protoc`, `helm`, `jscpd`, and `gopls` are installed
  and suitable for read-only local outputs.

## Local Tool Availability

Verified:

- `protoc`: `libprotoc 35.0`
- `helm`: `v3.19.4`
- `jscpd`: `4.2.4`
- `semgrep`: `1.164.0`
- `gopls`: present
- `docker`: present

Missing/not selected:

- `ctags`: not installed
- `cloc`, `scc`, `tokei`: not installed

## Candidate Scopes

- Alluxio protobuf API/catalog: 27 proto files under
  `repos/alluxio/core/transport/src/main/proto`.
- Alluxio Helm deployment/model: 5 chart candidates under
  `repos/alluxio/integration/kubernetes`.
- Bigtop duplication: bounded `apache-bigtop-repo/bigtop-tests` and
  `apache-bigtop-repo/bigtop-test-framework` jscpd scope.
- Airflow Go SDK symbols: selected Go files under
  `repos/apache-airflow/go-sdk`.

## Findings

| ID | Severity | Finding | Disposition |
| --- | --- | --- | --- |
| A1 | high | Runtime topology remains unavailable: `/home/fall_out_bug/projects/bigtop-landscape/selection.json` has `runtime: null`, and running Docker containers are unrelated to Bigtop. | Keep runtime blocked/not_assessed. |
| A2 | high | Full Bigtop symbol/reference graph is unavailable because no ctags/LSIF/global symbol producer is installed. | Acquire bounded gopls file-symbol output only; keep cross-Bigtop references not_assessed. |
| A3 | medium | Semgrep auto config cannot run with metrics disabled. | Keep semgrep blocked unless a local rule/config is added. Do not enable telemetry for this slice. |
| A4 | medium | Helm chart rendering may fail for charts requiring values. | Record verified templates and chart-specific blockers separately. |
