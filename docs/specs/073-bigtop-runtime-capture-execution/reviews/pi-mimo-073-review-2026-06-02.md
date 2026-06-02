---

# Review: Spec 073 — Bigtop Runtime Capture Evidence Slice

## 1. Requirements Fit & Product Boundary

| # | Finding | Severity | Evidence |
|---|---------|----------|----------|
| F1 | Scope correctly limited to docs/evidence; no Portolan code delta. | minor (info) | PR content only evidence files. |
| F2 | Single-node provisioner run matches approved topology (`--create 1`). | minor (info) | Create command, container name pattern `…-bigtop-1`. |
| F3 | Runtime-visible evidence covers only partial role set: NodeManager confirmed running; NameNode, ResourceManager, HistoryServer, ProxyServer, Datanode all failed or skipped. | **major** | Provisioner failure logs; post-run process inspection. |

## 2. Evidence-State Semantics

| # | Finding | Severity | Evidence |
|---|---------|----------|----------|
| F4 | `create` exit code 0 despite multiple service failures (NameNode 1/FAILURE, ResourceManager 255/EXCEPTION, HistoryServer 1/FAILURE, ProxyServer 1/FAILURE). Exit code does **not** reflect service health. | **major** | Script exit code, individual service status lines. |
| F5 | `destroy` exit code 0 and post-destroy residue checks empty — cleanup semantics are sound. | minor (info) | Destroy output, container/network/volume/.provision_id absence confirmed. |
| F6 | Datanode "skipped and service not found" — unclear whether this is a provisioner config omission or an image deficiency. Evidence does not distinguish root cause. | **major** | Provisioner log line; no further diagnostic. |

## 3. Security / Privacy / Local-First Cleanup Risk

| # | Finding | Severity | Evidence |
|---|---------|----------|----------|
| F7 | All cleanup artifacts (container, network, generated config, .provision_id) verified removed. No residual volumes or repo residue detected. | minor (info) | Post-destroy inspection output. |
| F8 | Image `bigtop/puppet:trunk-ubuntu-24.04` pulled from public registry; no evidence of vulnerability scan or provenance verification. | **minor** | Image name observed; no scan artifact in evidence. |
| F9 | No sensitive data (credentials, keys) surfaced in captured logs based on reviewed evidence. | minor (info) | Log content review. |

## 4. Test / Verification Gaps

| # | Finding | Severity | Evidence |
|---|---------|----------|----------|
| F10 | Full HDFS topology (NameNode + DataNode) never achieved running state — HDFS read/write path untested. | **major** | NameNode FAILURE, Datanode skipped. |
| F11 | ResourceManager lifecycle observed as "briefly started then 255/EXCEPTION" — YARN application submission path untested. | **major** | ResourceManager status. |
| F12 | Only NodeManager confirmed active/running; this is insufficient to claim "runtime capture" for the Bigtop stack. | **major** | Process inspection. |
| F13 | Spec/backlog explicitly marks: full runtime topology, service dependency graph, full symbol/reference graph, call graph, enterprise/human parity as `cannot_verify`. Evidence is consistent with this claim. | minor (info) | Backlog wording. |

---

## Not Assessed

| Item | Reason |
|------|--------|
| Full Bigtop runtime topology | Runtime never reached complete state; cannot assess. |
| Service dependency graph | Only NodeManager confirmed; dependency order unverifiable. |
| Full symbol/reference graph | Out of scope for this evidence slice. |
| Call graph | Out of scope for this evidence slice. |
| Enterprise/human parity | Requires production-grade cluster; single-node partial run insufficient. |
| Bigtop image build provenance | No build log or SBOM provided; cannot assess. |

---

## Recommendations

1. **R1 (Major):** Investigate root cause of NameNode/ResourceManager failures before claiming runtime evidence completeness. Either fix provisioner config to achieve full stack or explicitly document the partial state as the intended deliverable.
2. **R2 (Major):** Clarify Datanode "skipped and service not found" — determine whether this is a known provisioner limitation or a bug.
3. **R3 (Major):** Do not use `create` exit code 0 as evidence of success; add per-service health assertions or document that exit code 0 means "provisioner script completed" not "all services healthy."
4. **R4 (Minor):** For future runs, consider capturing `docker logs <container>` or Bigtop puppet logs to enable root-cause analysis of service failures.
5. **R5 (Minor):** If public images are used in sensitive environments, add provenance/scan evidence.

---

## Verdict

**EVIDENCE IS PARTIAL — DOES NOT MEET FULL RUNTIME CAPTURE CLAIM**

The evidence slice honestly documents a single-node provisioner run where only 1 of 6 attempted roles (NodeManager) achieved running state. The remaining 5 roles either failed with non-zero exit codes or were skipped. The cleanup phase is well-executed and verified.

The spec/backlog's own `cannot_verify` annotations for full topology, dependency graph, and enterprise parity are **correct and consistent** with the observed evidence state.

**Acceptability:** The evidence is valid for what it is — a partial capture attempt with honest failure documentation. It should **not** be used to claim Bigtop runtime completeness. If the goal of spec 073 is "demonstrate the provisioner runs and captures what it can," the evidence is acceptable. If the goal is "capture a working Bigtop stack," the evidence is insufficient.

---
