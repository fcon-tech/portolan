# Runtime And Symbol Probe Ledger: Spec 058

Date: 2026-06-02
Target root: `/home/fall_out_bug/projects/bigtop-landscape`
Stress root: `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-058-runtime-symbol-parity`

## Runtime Probe

| ID | Probe | Status | Evidence state | Output | Result |
| --- | --- | --- | --- | --- | --- |
| `probe-selection-runtime-20260602` | Inspect `selection.json` runtime and tool output fields | not_assessed | not_assessed | `tool-outputs/selection-runtime-tool-outputs.tsv` | `.runtime == null` and `.tool_outputs == null`; no selected runtime export exists. |
| `probe-docker-runtime-20260602` | Inspect local Docker containers | not_assessed | not_assessed | `tool-outputs/docker-ps.tsv` | Running containers are unrelated to Bigtop (`faust-*`, `bvevvs-*`, `minikube`). No Bigtop runtime observation export exists. |
| `probe-existing-portolan-outputs-20260602` | List existing Bigtop `.portolan` outputs | not_assessed | not_assessed | `tool-outputs/portolan-existing-output-files.txt` | Existing outputs include maps, context packets, SBOM, static producer outputs, and stress artifacts; no runtime-visible Bigtop export was identified in the bounded file list. |

Decision: Bigtop runtime topology remains `not_assessed`. Static Docker Compose
and Helm outputs from prior specs remain `metadata-visible` deployment models
and must not be promoted to runtime topology.

## Symbol/Reference Probe

| ID | Probe | Status | Evidence state | Output | Result |
| --- | --- | --- | --- | --- | --- |
| `probe-symbol-tool-availability-20260602` | Inspect installed symbol/reference producer tools | not_assessed | not_assessed | `tool-outputs/symbol-runtime-tool-availability.tsv` | Full graph producers were not found: `scip`, `ctags`, `universal-ctags`, `lsif-java`, `lsif-go`, and `src-cli` are not installed. Partial tools exist: `gopls`, `javap`, `mvn`, `rg`. |

Decision: full Bigtop symbol/reference graph remains `not_assessed`. The
available tools can support partial or language-specific probes, but they do not
establish full selected-landscape definition/reference coverage by themselves.

Tool installation boundary: installing or enabling a new full symbol/reference
producer may be valid future work, but it is outside this slice because the
current contract is to use available safe local producers or record exact
absence. Installing a new producer must come with an explicit design note about
license, local execution, privacy posture, target mutation risk, and output
validation.

## Privacy And Boundary Review

- No credentials were read.
- No target repositories were mutated.
- No Bigtop services were started.
- No telemetry or remote rule/index packs were enabled.
- Committed artifacts record paths, commands, and summarized results only; raw
  external snapshots remain under the local Bigtop stress root.

## Next Evidence Needed To Become Verified

Runtime topology can move to verified only with a concrete runtime-visible export
for a bounded Bigtop scope, for example process/service/container/orchestrator
state captured from a running Bigtop environment.

Full symbol/reference can move to verified only with a producer output that
contains definitions and references for a declared selected scope, with coverage
and validation evidence. File-symbol listings alone are not enough.
