## 1. Lane State

**`verified`**

Evaluation used only the allowed integrated context directory. No forbidden reads were performed.

---

## 2. Artifacts Read

Exact paths read (8 files, all under the allowed context root):

- `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-081-integrated-navigation-stress/context/agent-brief.md`
- `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-081-integrated-navigation-stress/context/answer-contract.md`
- `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-081-integrated-navigation-stress/context/evidence-index.jsonl`
- `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-081-integrated-navigation-stress/context/gaps.jsonl`
- `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-081-integrated-navigation-stress/context/oss-plan.json`
- `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-081-integrated-navigation-stress/context/query-plan.md`
- `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-081-integrated-navigation-stress/context/repos.json`
- `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-081-integrated-navigation-stress/context/tool-registry.json`

---

## 3. Forbidden Path Check

**no**

No sibling stress roots, `run/`, `.portolan/producer-runs.jsonl`, map bundles, `repos/` source, or jscpd outputs outside the allowed context were opened. Path strings inside context files (e.g. `repos/...`, `.portolan/producer-runs.jsonl` as `source_artifact`) were used only as embedded metadata.

---

## 4. Clean-Start Guard Assessment

| Check | Result |
|--------|--------|
| **Fresh artifact boundary explicit?** | **Yes.** `agent-brief.md`, `answer-contract.md`, and `query-plan.md` all name the current context dir and forbid sibling `.portolan/stress/*`, root `run/`, and unrelated `
