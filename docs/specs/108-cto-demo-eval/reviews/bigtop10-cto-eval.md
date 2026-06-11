# CTO Query Eval — bigtop-10 (Lane B, spec 108)

Date: 2026-06-11. Bundle: `/tmp/portolan-bigtop10` (not committed; reproduce below).

## Reproduce

```bash
scripts/portolan-scan.sh ~/projects/bigtop-landscape/repos /tmp/portolan-bigtop10 \
  --limit-repos 10 --cross-repo-dup --yes --no-viewer
# agent analysis pass (claims authored from bundle-query output, then):
scripts/import-analysis-claims.sh /tmp/portolan-bigtop10 <claims.jsonl>
scripts/run-query-eval.sh --run /tmp/portolan-bigtop10
```

Scan wall time ~35 min (10 Java-heavy repos, default 600s shard timeout,
2048MB jscpd heap). Bundle: `hotspots=200` (budget-truncated from 9805),
`gaps=8`, `repos=10`, `relationships=30`.

## Lane B results (C1–C5 CTO questions)

| Q | Command (family) | Result | Assessment |
| --- | --- | --- | --- |
| C1 what repos / what do they do | `repos` | 10 records: identity, language mix, manifests (9 maven, 1 python, 1 gradle first-manifest), activity, maturity per repo | answered, tier A |
| C2 how connected | `relationships` | 30 edges, all `shared-dependency` (no internal depends-on — these are independent Apache projects) | answered, tier A |
| C3 cross-repo duplication | `relationships --type cross-repo-duplication` + gaps | 0 edges; `gap-cross-repo-dup` records that the opt-in cross jscpd pass produced no report (timeout/OOM) | honest gap, not silence |
| C4 riskiest repo | `hotspots --repo alluxio-a8b47d51` | 54 findings scoped to alluxio (repo filter via slug path prefix) | answered, tier A |
| C5 agent analysis | `claims` / `claims --tier speculative` | 6 imported claims: 3 analytical, 2 synthetic, 1 speculative; tier filter works | answered, labeled B/C/D |

Q1–Q10 (spec 100/101 baseline) also ran against this bundle: duplication,
config, gaps, debt-candidate, search, symbol (empty — ctags absent, gap),
top hotspot, dep-hub, static findings, landscape next steps. Outputs in the
raw transcript (`run-query-eval.sh --run`).

## Agent analysis pass (spec 106 full cycle)

7 claims submitted, 6 accepted, 1 rejected:

- accepted examples: `c-bigtop-stack` (B, cites 3 repo refs + jackson edge),
  `c-jackson-risk` (C, cites `relationship:rel-shared-02b469b4d293` —
  jackson-databind shared by 7/10 repos), `c-cross-dup-unknown` (B, cites
  `gap:gap-cross-repo-dup` — explicitly states cross-repo duplication is
  unverified), `c-spec-fork` (D, zero refs, allowed).
- rejected (negative case, required by spec): `c-negative-broken` cited
  `hotspot:dup-000000000000`; importer rejected with
  `cited ref does not resolve in bundle` in `claims-import-report.json`.

`claims.jsonl` records stay `evidence_state: claim-only`; ranked findings
remain tool-only (claims never enter hotspots).

## Demo bar (manual, viewer on this bundle)

- Overview: landscape card; findings-by-repo severity table for 10 repos;
  landscape claims block with B/C/D badges.
- Repos tab: 10 cards (langs, commits/30d, maturity); drill-down ladder
  shows tier A profile → connections → top findings → labeled claims.
- Findings: ranked list tier A only; gaps tab lists cross-repo dup gap and
  6 jscpd shard timeouts.

## Known limits recorded

- Cross-repo jscpd on bigtop-10 times out at default budgets → gap (the
  documented opt-in degradation; verified working on a 2-repo fixture and
  in `harness-cross-repo-smoke.sh`).
- 6/10 per-repo jscpd shards timed out at 600s (airflow, flink, hadoop,
  hbase, hive, kafka) — recorded as `cannot_verify` shard gaps. Gap wording
  bug (`failed (exit 0)` instead of `timed out`) fixed in `run_shard`
  during this slice; old bundles keep the old wording.
- `symbol` family empty: ctags not installed on this host → gap, not a
  product failure.
