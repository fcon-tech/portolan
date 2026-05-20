# Acceptance Smoke Ledger: Bigtop After Skills

Date: 2026-05-20

## Scope

This ledger records the first local Portolan-guided Bigtop smoke using the
portable agent guide and the minimal fixture in `testdata/apache-bigtop-smoke/`.

Cursor + Composer 2.5 is the intended operator lane, but it was not available
inside this Codex session. That lane is `not_assessed`; it is not treated as a
passing or failing external operator result.

## Evidence Summary

| Surface | Status | Evidence |
| --- | --- | --- |
| Portable guide | verified | `agent/AGENT_GUIDE.md` names current commands and marks `portolan map` as target-only. |
| Local selection fixture | verified | `testdata/apache-bigtop-smoke/selection.json` uses only local paths. |
| Local scan | verified | `portolan scan --selection testdata/apache-bigtop-smoke/selection.json --out <tmp>/graph.json --force` succeeded. |
| Packet render | verified | `portolan packet render --graph <tmp>/graph.json --out <tmp>/map.md --force` succeeded. |
| Target `portolan map` command | verified gap | `portolan map --root testdata/apache-bigtop-smoke/repo --out <tmp>/run` returned `unknown command "map"`. |
| Cursor + Composer 2.5 operator run | degraded evidence | `cursor agent --print --model composer-2.5` read the guide, Cursor rule, smoke runbook, and fixture, and returned a smoke report. Shell commands were blocked inside the Cursor lane, so Cursor-side CLI execution remains `not_assessed`. |

## Gap Ledger

| Gap ID | Repo/Context | Attempted Task | Command/Artifact Used | Observed Limitation | Expected Capability | Affected Product Promise | Evidence State | User Impact | Priority | Likely Spec | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GAP-007-001 | Apache Bigtop smoke fixture | Run one-command map workflow from the agent guide target contract | `portolan map --root . --out <tmp>/run` | Command is absent; current user must stitch scan and packet commands manually. | One command writes graph, findings, run metadata, and packet bundle. | UX, evidence, agent workflow | cannot_verify | Agent workflow has an immediate dead end at the target contract. | P2 | `009-map-command-artifacts` | open |
| GAP-007-002 | Apache Bigtop smoke fixture | Produce machine-readable findings | `portolan scan` + `portolan packet render` | No `findings.jsonl` artifact exists in current commands. | Findings with id, kind, summary, evidence state, source, confidence, and status. | tech debt, relationships, duplication, config, evidence | unknown | Agents must scrape prose or invent unsupported findings. | P2 | `009-map-command-artifacts` | open |
| GAP-007-003 | Apache Bigtop smoke fixture | Identify Bigtop component relationships from local metadata | `graph.json` from scan | Only selected metadata and claim edges are represented; no detector derives richer relationship evidence from repository/package/config files. | Evidence-backed relationship detection across source, metadata, runtime, and claim inputs. | relationships | claim-only | Bigtop dependency topology remains mostly manual claim or manifest metadata. | P2 | `010-relationship-detection` | open |
| GAP-007-004 | Apache Bigtop smoke fixture | Report overlapping component or config duplication | `graph.json` and `map.md` | No duplication finding category exists. | Exact, near, and configuration duplication findings with evidence states. | duplication | not_assessed | Agents cannot distinguish unimplemented duplication detection from no duplication found. | P2 | `011-duplication-detection` | open |
| GAP-007-005 | Apache Bigtop smoke fixture | Report configuration surfaces | `graph.json` and `map.md` | Current fixture can show selected nodes and edges only; env vars, ports, manifests, CI, feature flags, and secret references are not extracted. | Local configuration surface detection without exposing secret values. | config | not_assessed | Package/runtime configuration promises cannot be evaluated on Bigtop yet. | P2 | `012-configuration-surfaces` | open |
| GAP-007-006 | Apache Bigtop smoke fixture | Produce technical-debt findings | `graph.json` and `map.md` | No debt finding rules or severity/status artifact exists. | Evidence-backed technical-debt findings without readiness verdicts. | tech debt | not_assessed | Agents cannot prioritize Bigtop review gaps without unsupported manual judgment. | P2 | `013-technical-debt-findings` | open |
| GAP-007-007 | Apache Bigtop smoke fixture | Preserve retired/unknown legacy evidence | `graph.json` from scan | Missing Oozie metadata and source are represented as `cannot_verify`/`unknown`, which is correct, but lifecycle semantics are not first-class. | Retired lifecycle metadata represented separately from source visibility. | evidence | cannot_verify | Retired project status still depends on manually prepared metadata. | P2 | `010-relationship-detection` or later lifecycle modeling | open |
| GAP-007-008 | Cursor + Composer 2.5 operator lane | Run the acceptance smoke commands from the guide inside Cursor Agent | `cursor agent --print --model composer-2.5` | Composer read the guide and fixture but reported shell command execution blocked, so no Cursor-side `graph.json` or `map.md` artifacts were produced. | Cursor operator lane can execute the documented local fallback commands or clearly delegate command execution to the host runner. | agent workflow, evidence | not_assessed | Operator smoke cannot independently verify artifact generation from inside Cursor; the lane depends on separate local CLI evidence. | P1 | `008-agent-skill-pack` follow-up or Cursor environment setup | open |

## Disposition

- Accepted: GAP-007-001 is direct local fallback evidence that the target
  `portolan map` workflow is absent. It does not by itself satisfy the Cursor +
  Composer operator gate.
- Accepted as backlog pressure, not completion evidence: GAP-007-002 through
  GAP-007-006 identify expected artifact and detector gaps that still need
  operator-smoke or implementation-slice evidence before status promotion.
- Accepted with constraint: GAP-007-007 should not become a broad lifecycle
  system until map artifacts and relationship surfaces exist.
- Degraded: Cursor + Composer 2.5 usability. The operator lane ran and followed
  the guide at the prompt/report level, but Cursor-side shell execution was
  blocked, so artifact generation in that lane remains `not_assessed`.
