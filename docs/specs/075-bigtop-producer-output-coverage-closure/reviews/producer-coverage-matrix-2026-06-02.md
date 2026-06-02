# Producer Coverage Matrix

Spec: `docs/specs/075-bigtop-producer-output-coverage-closure/`

matrix_generated_at: 2026-06-02

commit_range: specs 054-074 committed on `main` through `2a706a9`

scope: docs-only closure over existing producer ledgers; no spec 074 runtime
command was executed by this slice.

## Blocker Taxonomy

- `blocked_074_approval`: the next evidence step requires fresh explicit
  approval for the named spec 074 runtime command sequence.
- `blocked_producer_scope`: the producer ran, but its output class cannot prove
  the broader claim.
- `blocked_future_spec`: a later named spec owns validation or closure.
- `not_assessed_seed_family`: the family is in the broader architecture seed
  space but has no current Portolan/Bigtop producer output in specs 054-074.

## Matrix

| Family | Tool / producer | Source trace | Confirmed bounded output | Status | Evidence state | C1-C9 impact | Boundary / blocker |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Protobuf API/catalog | `protoc` 35.0 | Spec 066 ledger: `docs/specs/066-bigtop-protobuf-api-descriptors/reviews/protobuf-descriptor-ledger-2026-06-02.md`; spec 057 ledger: `docs/specs/057-bigtop-producer-output-expansion/reviews/producer-run-ledger-2026-06-02.md` | Hadoop HDFS/common, YARN API/common, and HBase REST descriptor sets: 76 descriptor files, 957 messages, 61 enums, 38 services, 325 methods across successful groups; Alluxio: 27 proto descriptors. | verified bounded output exists / partial family coverage | metadata-visible | Strengthens C5 API/catalog evidence for bounded protobuf surfaces. | Not full Bigtop API catalog; whole-Hadoop/HBase shaded descriptors remain `cannot_verify`; not runtime calls. `blocked_producer_scope`. |
| Docker Compose deployment model | Docker Compose v5.1.4 `config` | Spec 067 ledger: `docs/specs/067-bigtop-compose-model-producer/reviews/compose-model-ledger-2026-06-02.md` | Normalized cgroup v1/v2 Compose model for the Bigtop Docker provisioner: one service, one network, privilege/memory/mount metadata. | verified bounded output exists | metadata-visible | Strengthens C3 desired deployment/model evidence. | Static desired state only; not running container IDs, process state, or health. `blocked_producer_scope`. |
| Helm deployment/catalog model | Helm v3.19.4 | Spec 068 ledger: `docs/specs/068-bigtop-helm-model-producer/reviews/helm-model-ledger-2026-06-02.md`; spec 057 ledger for Alluxio chart renders | Apache Airflow chart render: 43 Kubernetes resources, including 11 workloads and 8 Services; four Alluxio Helm chart renders. | verified bounded output exists / partial family coverage | metadata-visible | Strengthens C3/C5 desired-state model and service-surface evidence. | Static desired state only; no live Kubernetes resources or pod readiness. `blocked_producer_scope`. |
| Semgrep local API/catalog mentions | Semgrep 1.164.0 with local rule pack | Spec 063 ledger: `docs/specs/063-bigtop-semgrep-local-producer/reviews/producer-ledger-2026-06-02.md` | Local-rule scan over 102 Bigtop provisioner/Puppet files produced 143 findings with 0 Semgrep errors. | verified bounded output exists | metadata-visible | Strengthens C5 component/API/catalog mention evidence for provisioner surfaces. | Mentions only; not semantic API graph, enterprise Semgrep rules, runtime topology, or full corpus coverage. `blocked_producer_scope`. |
| Universal Ctags Java/Go import roles | Universal Ctags 6.2.1 | Spec 070 ledger: `docs/specs/070-bigtop-ctags-import-references/reviews/ctags-import-reference-ledger-2026-06-02.md` | 873,435 Java/Go imported reference-role records across 59,704 files under 15 selected Bigtop roots. | verified bounded output exists / partial graph coverage | source-visible | Strengthens C6 broad package import/reference-role evidence. | Not resolved def/use, method/class references, or call graph. Full symbol/call graph closure is `blocked_future_spec` by spec 077. |
| Universal Ctags C/C++/Python/Sh reference roles | Universal Ctags 6.2.1 | Spec 071 ledger: `docs/specs/071-bigtop-ctags-cross-language-imports/reviews/ctags-cross-language-ledger-2026-06-02.md` | 147,472 reference-role records across 8,432 files for C/C++/Python/Sh. | verified bounded output exists / partial graph coverage | source-visible | Extends C6 evidence beyond Java/Go into Python, C/C++, and shell surfaces. | Not type-resolved cross-reference graph or call graph. Full symbol/call graph closure is `blocked_future_spec` by spec 077. |
| Existing JVM artifact dependencies | `jdeps` 26.0.1 | Spec 072 ledger: `docs/specs/072-existing-artifact-jdeps/reviews/jdeps-existing-artifact-ledger-2026-06-02.md` | Existing `.jar`/`.class` scan produced 289 package dependency rows across 9 artifacts, including 16 unresolved `not found` rows. | verified bounded output exists / narrow partial family coverage | metadata-visible | Adds bounded compiled-artifact dependency evidence to C6/C5. | Dominated by test/resource jars and tiny UDF fixtures; not production Bigtop JVM dependency graph, Maven/Gradle tree, or runtime classloader graph. `blocked_producer_scope`. |
| Duplication | `jscpd` 4.2.4 | Spec 057 ledger: `docs/specs/057-bigtop-producer-output-expansion/reviews/producer-run-ledger-2026-06-02.md` | Bounded Bigtop test/framework clone report JSON existed, was 696,656 bytes, and passed `jq empty`. | verified bounded output exists / partial family coverage | metadata-visible | Supports C7 duplication/debt triage. | Not topology, dependency, source graph, or runtime evidence; bounded source slice only. `blocked_producer_scope`. |
| File symbol listing | `gopls` | Spec 057 ledger: `docs/specs/057-bigtop-producer-output-expansion/reviews/producer-run-ledger-2026-06-02.md` | Symbol listings for five selected Airflow Go SDK files. | partial | metadata-visible | Narrowly supports local symbol inventory for selected Go files. | Not cross-reference graph and not full Bigtop symbol coverage. Full symbol/call graph closure is `blocked_future_spec` by spec 077. |
| Runtime lifecycle / component evidence | Bigtop Docker provisioner plus Docker/systemd/process capture | Spec 073 ledger: `docs/specs/073-bigtop-runtime-capture-execution/reviews/runtime-capture-ledger-2026-06-02.md` | One Bigtop container, one network, Docker inspect, and one running YARN NodeManager observed; NameNode, ResourceManager, HistoryServer, ProxyServer failed; Datanode skipped/not found; cleanup verified. | partial / failed for healthy topology | runtime-visible for bounded observations | Adds C4 runtime-visible evidence for lifecycle and one component. | Complete runtime topology remains `cannot_verify`. 075 does not advance runtime. `blocked_074_approval` for the spec 074 health run. |
| Runtime health summary | `bigtop-docker-provisioner-health-074` | Spec 074 closeout: `docs/specs/074-bigtop-runtime-topology-health-capture/reviews/pr52-merge-closeout-2026-06-02.md` | Schema, approval packet, runbook, health command contract, and Cursor scope stress were reviewed and merged. No runtime health output exists. | blocked / not_assessed | not_assessed | Intended future C4 input. | Requires fresh explicit approval for the named spec 074 runtime command sequence. `blocked_074_approval`. |
| API/service contract producers beyond protobuf | OpenAPI, gRPC reflection, GraphQL, JSON Schema | No current producer ledger in specs 054-074. | No assessed output. | not_assessed_seed_family | not_assessed | Prevents broad C5 API/catalog completeness claim. | Needs discovery or explicit exclusion before API/catalog completeness can be claimed. |
| Dependency producers beyond `jdeps` | Maven/Gradle dependency tree, Cargo/Rust, runtime classloader/module graph | No current producer ledger in specs 054-074. | No assessed output. | not_assessed_seed_family | not_assessed | Prevents broad C6 dependency completeness claim. | Needs discovery or explicit exclusion before dependency completeness can be claimed. |
| Full symbol/reference/call graph | Resolved def/use and call graph producer | No current owner before spec 077. | No assessed output beyond Ctags/gopls bounded symbol/reference records. | blocked_future_spec | cannot_verify | Keeps full C6 and call-graph parity claims rejected. | Spec 077 must either produce mature bounded outputs or record reviewed `cannot_verify`. |

## C1-C9 Coverage Impact

| Criterion | Current producer coverage | Status |
| --- | --- | --- |
| C1 repository role / landscape orientation | Inventory and prior map/context artifacts remain available; this producer matrix is supporting evidence, not a new map run. | partial |
| C2 packaging/deployment role attribution | Bigtop Compose, Helm, Semgrep provisioner/Puppet findings, and source inventories strengthen role attribution. | partial |
| C3 deployment/model understanding | Compose and Helm producer outputs are confirmed bounded desired-state models. | verified bounded metadata-visible; not runtime |
| C4 runtime topology | Spec 073 gives runtime-visible lifecycle and NodeManager only; spec 074 health summary is approval-gated and not executed by 075. | partial / `cannot_verify` for complete topology |
| C5 API/catalog surfaces | Protobuf descriptors and Semgrep local mentions provide bounded API/catalog evidence; OpenAPI/gRPC reflection/GraphQL/JSON Schema are not assessed. | partial |
| C6 symbol/reference/dependency graph | Ctags reference roles, gopls selected-file symbols, and jdeps package rows strengthen evidence. | partial; full graph and call graph `cannot_verify` pending spec 077 |
| C7 duplication/debt clues | jscpd bounded clone report supports duplication/debt triage. | partial |
| C8 evidence discipline / gap attribution | This matrix improves explicit producer-family boundaries and blocker classification. | verified for this matrix scope |
| C9 human/enterprise parity | Requires spec 076 paired Cursor-only vs Cursor-plus-Portolan validation after current producer and runtime evidence are available. | `cannot_verify` |

## Seed Family Gaps

- API/service contract producers: OpenAPI, gRPC reflection, GraphQL, and JSON
  Schema are `not_assessed_seed_family`; protobuf descriptors cover only
  bounded proto surfaces.
- Dependency producers: Maven/Gradle dependency tree, Cargo/Rust, and runtime
  classloader/module graph are `not_assessed_seed_family`.
- Symbol/call graph: Ctags and gopls are useful bounded producers, but they do
  not produce a resolved full def/use graph or call graph; spec 077 owns the
  next closure attempt.
- Runtime fallback: if spec 074 approval is denied or deferred, complete
  runtime topology remains `cannot_verify`; 075 records that state and does not
  substitute static deployment models for runtime proof.

## Spec 076 Acceptance Dependency

Spec 076 must run paired Cursor-only and Cursor-plus-Portolan prompts against
the same Bigtop question set, score C1-C9 independently, require non-GPT review
for every upgraded criterion, and keep any criterion as `partial`,
`cannot_verify`, or `not_assessed` unless the upgraded claim is backed by
current evidence or explicitly excluded with reviewed rationale.

## Claim Boundary

Allowed:

- Portolan has multiple confirmed bounded producer-output families beyond
  Syft/CycloneDX for Bigtop: Compose, Helm, protobuf descriptors, Semgrep local
  findings, Universal Ctags reference-role outputs, jdeps package rows, jscpd
  duplication report, selected gopls symbols, and partial runtime
  lifecycle/component evidence.

Disallowed:

- Portolan verifies complete Bigtop runtime topology.
- Portolan has a full Bigtop symbol/reference graph.
- Portolan has a call graph.
- Portolan plus Cursor understands Bigtop like a human or enterprise code
  intelligence system.
- Static deployment models prove runtime topology.
- Bounded protobuf/Semgrep outputs prove complete API/service catalog coverage.

## PR Readiness Checklist

- Branch contains spec 075 docs plus intentional backlog-only spec 077 planning
  only.
- Commit message must reference spec 075 and producer coverage closure.
- Baseline docs/code checks must be recorded in PR readiness closeout.
- PR description must state that 075 is not a Portolan runtime/topology/parity
  proof.

## Next Required Evidence

- Spec 074 approved runtime health capture for C4.
- Spec 077 full symbol/reference/call graph closure attempt or reviewed
  `cannot_verify`.
- Spec 076 paired Cursor-only and Cursor-plus-Portolan parity scoring after
  this matrix and any available spec 074/runtime or spec 077 graph evidence.
