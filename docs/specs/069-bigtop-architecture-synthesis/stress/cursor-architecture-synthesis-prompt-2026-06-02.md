# Cursor Plus Portolan Architecture Synthesis Prompt

Run metadata:

- model: Cursor Agent `composer-2.5`
- branch: `codex/069-bigtop-architecture-synthesis`
- base_commit: `79b4ca2`
- prompt_recorded_at_utc: `2026-06-02T01:08:53Z`
- execution_mode: `cursor-agent --print --mode ask --trust`
- editing: prompt authored as bounded review packet before execution

You are evaluating whether Cursor plus Portolan can now claim Apache Bigtop
architecture understanding comparable to a human architect or enterprise code
intelligence system after the producer-output expansion wave through PR #46.

Do not browse the internet. Do not start services. Do not contact Kubernetes.
Do not treat static files, Compose config, Helm rendered manifests, protobuf
descriptors, Semgrep findings, or ctags definition listings as runtime topology
or full symbol/reference evidence.

Use these evidence states exactly:

- `verified`: directly checked by a recorded command, producer output, or
  stress artifact.
- `partial`: bounded evidence exists but does not cover the full criterion.
- `metadata-visible`: desired-state or tool-output metadata, not runtime.
- `runtime-visible`: observed live process/container/orchestrator state.
- `cannot_verify`: evidence required by the criterion is absent or blocked.
- `not_assessed`: not checked in the available packet.

## C1-C9 Rubric

| ID | Capability | Verified requires | Partial allows | Not enough |
| --- | --- | --- | --- | --- |
| C1 | Landscape scope and role map | Repo inventory, role evidence, and explicit unknowns for selected Bigtop scope | Correct hub/component roles for bounded repos | README-only claims without scope limits |
| C2 | Static dependency and relationship graph | Evidence-backed source/metadata relationships with queryable graph support | Selected relationship slices | Narrative dependency guesses |
| C3 | Deployment model | Rendered or parsed local deployment artifacts with evidence states | Static Compose/Helm model for selected services | Treating deployment model as runtime |
| C4 | Runtime topology | Runtime-visible process/service/container/orchestrator observation for bounded Bigtop runtime | None; if runtime export is absent this remains `not_assessed` or `cannot_verify` | Compose/Helm/proto/static files |
| C5 | API/catalog/model surfaces | Real producer outputs such as protobuf descriptors, OpenAPI, schema/catalog exports, or generated model metadata with scope and validation | Bounded protobuf or chart-derived model surfaces | Unvalidated file mentions |
| C6 | Symbol/reference graph | Producer output with definitions and references for declared selected scope | File-symbol or definition-only listing for selected scope | `rg` snippets or definitions-only lists represented as references |
| C7 | Evidence-state discipline | Every claim carries verified/partial/not_assessed/cannot_verify boundary and cites producer/run IDs | Minor citation gaps without overclaim | Collapsing unknowns into success |
| C8 | Cursor augmentation value | Same-question Cursor-only and Cursor-plus-Portolan comparison shows improved correctness, evidence discipline, or gap attribution | Improvement on bounded packet only | Unpaired Cursor anecdotes |
| C9 | Enterprise parity threshold | C1-C8 verified for declared selected scope, with runtime and symbol/reference covered or explicitly excluded from a narrowed claim | Strong partial claim when C4 or C6 remain missing | Saying "enterprise code intelligence" while C4 or C6 are not verified |

## Prior Baseline

Spec 056 established a bounded Cursor-only vs Cursor-plus-Portolan comparison.
It found that Portolan improved evidence discipline or gap attribution on at
least five questions, but did not verify broad Bigtop architecture
understanding. Runtime topology, symbol/reference relationships, full
API/catalog/model/runtime coverage, and enterprise code-intelligence parity
remained blocked or not assessed.

Spec 058 established this C1-C9 parity rubric. It found:

- C1 partial.
- C2 partial.
- C3 partial or metadata-visible.
- C4 not_assessed / cannot_verify.
- C5 partial.
- C6 not_assessed or partial only for selected-file symbol listings.
- C7 partial.
- C8 partial.
- C9 not_assessed / cannot_verify because C4 and full C6 were missing.

## Producer Expansion Evidence After Spec 058

### Spec 059 - Bigtop Symbol/Reference Producer Acquisition

Verified:

- Universal Ctags 6.2.1 was acquired locally.
- It ran over 15 selected Bigtop targets.
- It produced 5,390,732 definitions across 93,380 files with 0 bad JSON lines.

Boundary:

- This is broad definition evidence, not a full symbol/reference graph.
- Full references and call graph remain not assessed.
- Runtime topology and enterprise parity remain not assessed.

### Spec 060 - Bigtop Runtime Topology Acquisition

Verified:

- Read-only Docker, Kubernetes, process, selection, and existing Portolan output
  probes were run.
- No current Bigtop runtime surface was found.
- Cursor stress verified static files, ctags symbols, Docker Compose/Helm
  models, and unrelated minikube state must not be promoted to runtime
  topology.

Boundary:

- Inspected Bigtop runtime topology remains `cannot_verify`.

### Spec 061 - Bigtop Runtime Capture Approval

Verified:

- Upstream Bigtop Docker provisioner was selected as the minimal runtime capture
  candidate.
- Approval and runbook boundary were recorded.
- No runtime provisioning was approved or executed.

Boundary:

- Runtime topology remains `cannot_verify`.
- Enterprise parity remains not assessed.

### Spec 062 - Runtime Capture Preflight

Verified:

- Docker/Compose/Ruby/cgroup and Bigtop `--env-check` preflight passed
  read-only.
- Cursor stress preserved prerequisites as `verified`, runtime topology as
  `cannot_verify`, and the next create command as `blocked`.

Boundary:

- Runtime provisioning still not approved or executed.

### Spec 063 - Semgrep Local Producer

Verified:

- Bounded Semgrep local-config run succeeded with 143 findings across 102
  scanned files and 0 Semgrep errors.
- Local rule pack/hash/size evidence is auditable.

Boundary:

- Findings are metadata/source surfaces, not full runtime, full corpus, full
  def/ref, or call graph.

### Spec 064 - Def/Ref Producer Probe

Verified:

- Local probe found no SCIP/LSIF/CodeQL/srcml/JDTLS producer and no compiled
  target classes in Hadoop/HBase/Bigtop repos.
- `jdeps cachedir.jar` produced no project graph evidence.

Boundary:

- Full symbol/reference graph, call graph, runtime topology, and enterprise
  parity remain `cannot_verify`.

### Spec 065 - Runtime Capture Execution Gate

Verified:

- Fresh read-only Docker/Kubernetes/process probes found no current Bigtop
  runtime surface.
- Upstream Bigtop Docker provisioner runbook is present.

Boundary:

- Runtime topology remains blocked pending explicit approved create/capture run.

### Spec 066 - Protobuf API Descriptors

Verified:

- `protoc` generated descriptor sets for Hadoop HDFS/common: 38 files, 633
  messages, 27 enums, 21 services, 219 methods.
- `protoc` generated descriptor sets for Hadoop YARN API/common: 27 files, 313
  messages, 34 enums, 17 services, 106 methods.
- `protoc` generated HBase REST descriptor evidence: 11 files, 11 messages.

Boundary:

- Whole-Hadoop and HBase shaded descriptors remain blocked by upstream proto
  conflicts/import issues.
- Descriptor outputs are metadata-visible API/catalog evidence, not runtime
  topology or call graph.

### Spec 067 - Compose Model Producer

Verified:

- Docker Compose v5.1.4 generated cgroup v1/v2 model outputs for the Bigtop
  Docker provisioner without starting containers.
- The model resolved one `bigtop` service, network, image, command,
  privilege, memory limit, and bind mounts.
- cgroup v1/v2 delta was recorded.

Boundary:

- Compose config is metadata-visible deployment-model evidence only.
- Runtime topology remains `cannot_verify` until running containers are
  observed.

### Spec 068 - Helm Model Producer

Verified:

- Helm v3.19.4 rendered the Apache Airflow chart from the local Bigtop
  landscape with exit code 0.
- Rendered output contained 105 nonempty YAML document segments and 43
  Kubernetes resources.
- Resource summaries recorded 11 workload surfaces and 8 Service surfaces.

Boundary:

- Helm output is metadata-visible desired-state model evidence only.
- Live Kubernetes resources, pod readiness, endpoints, container IDs, IPs,
  ports, process state, full def/ref graph, call graph, and enterprise
  architecture parity remain `cannot_verify`.

## Required Output

Return a concise assessment with:

1. A C1-C9 table using the states above.
2. What changed after PR #46 compared with spec 058.
3. Whether the claim "Portolan plus Cursor understands Bigtop architecture like
   a human architect or enterprise code intelligence system" is verified.
4. Whether runtime topology is verified.
5. Whether real symbol/API/catalog/model/runtime producer outputs beyond
   Syft/CycloneDX are verified, broken down by family.
6. The next evidence required to move the remaining major gaps to verified.

Be strict. Do not give credit for broader claims than the evidence supports.
