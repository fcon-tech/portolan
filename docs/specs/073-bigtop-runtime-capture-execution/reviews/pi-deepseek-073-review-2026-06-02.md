## Evidence Review — Portolan Spec 073

### Findings

| # | Finding | Severity | Evidence |
|---|---------|----------|----------|
| 1 | **Create exit code 0 despite 5 role failures** — provisioner reports success while NameNode, ResourceManager, HistoryServer, ProxyServer, and Datanode all failed/skipped. Exit 0 with partial runtime contradicts the implicit semantic that "create 1" implies a functional single-node Hadoop cluster. | **major** | create exit 0; failures documented: NameNode 1/FAILURE, ResourceManager 255/EXCEPTION, HistoryServer 1/FAILURE, ProxyServer 1/FAILURE, Datanode skipped; only NodeManager active/running |
| 2 | **Cannot verify full runtime topology** — only one Java process (NodeManager) observed; no service dependency graph, no symbol/reference graph, no call graph. Spec/backlog itself admits this is partial and `cannot_verify`. | **cannot_verify** | backlog wording acknowledges partial runtime-visible evidence; enterprise/human parity remain cannot_verify |
| 3 | **Cleanup completeness confirmed** — post-destroy checks show zero container/network/volume/target repo residue. Create and destroy exit codes both 0. No dangling artifacts. | **minor** (positive) | destroy exit 0; confirmed removed: container `20260602_091203_r32618-bigtop-1`, network `20260602_091203_r32618_default`, generated config, `.provision_id`; residue checks all empty |
| 4 | **No Portolan code changes in this PR** — evidence-only PR eliminates regression risk but also means no tooling improvements from this slice. | **minor** | PR is docs/evidence only, no Portolan code changes |
| 5 | **Single-node Bigtop provisioner is not a Hadoop cluster** — with only NodeManager running, this is a Bigtop package-installed container, not a functional Hadoop cluster. Product boundary unclear: is the deliverable "provisioner executes without error" or "provisioner yields a working Hadoop topology"? | **major** | Only 1 of 6 attempted roles succeeded (NodeManager); ResourceManager briefly started then exception; NameNode never reached running state |

### Recommendation

1. **(Finding 1, 5)** Clarify the acceptance criteria for Bigtop provisioner runtime capture. If "create exit 0" is the only gate, document that partial topology is expected. If a working multi-role Hadoop cluster is required, the provisioner must fail (non-zero exit) when critical services cannot start, and diagnostics must be captured.
2. **(Finding 2)** The `cannot_verify` items (full runtime topology, dependency graph, symbol/call graphs) should be tracked as explicit gaps with acceptance criteria or deferred to a future spec slice. Current evidence does not advance these.
3. **(Finding 3)** Cleanup process is solid — no residue risk. This aspect passes verification.
4. **(Finding 4)** No action needed for evidence-only PR; just note that this slice does not improve Portolan tooling.

### Verdict

**Cannot pass as a complete verification.** The evidence demonstrates that the provisioner can create and destroy a Docker container with Bigtop packages installed, and that cleanup is clean. However, the runtime capture reveals a non-functional Hadoop cluster (5 of 6 roles failed) masked by exit code 0. This is at best a partial success of the container lifecycle, not evidence of Bigtop runtime topology capture. The spec/backlog itself is honest about `cannot_verify` for full topology, which is the right posture, but the evidence slice does not close the gap between "provisioner ran" and "Hadoop cluster captured."

### Not Assessed

- **Enterprise parity** — explicitly marked `cannot_verify` in backlog; no evidence provided.
- **Human parity** — explicitly marked `cannot_verify` in backlog; no evidence provided.
- **Symbol/reference graph completeness** — not present in evidence slice.
- **Call graph** — not present in evidence slice.
- **Cross-node communication patterns** — single-node only; no evidence of multi-node topology.
- **Long-running stability** — only a create/destroy cycle observed; no uptime or service recovery evidence.
- **Log correlation between Portolan capture and Bigtop service logs** — not assessed; no log extraction or matching evidence provided.

<!-- telegram_button label="Show severity summary"
Critical: none
Major (2): exit 0 masking 5 role failures; unclear product boundary (Hadoop cluster vs Bigtop container)
Minor (2): cleanup passes cleanly; evidence-only PR, no code risk
Cannot verify (1): full runtime topology/graphs
Not assessed: enterprise/human parity, stability, log correlation, multi-node, symbol/call graphs
Verdict: cannot pass — create exit 0 contradicts 5/6 role failures
-->
