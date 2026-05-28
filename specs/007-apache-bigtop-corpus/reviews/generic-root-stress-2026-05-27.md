# Generic Root Stress: Apache Bigtop

Date: 2026-05-27
Spec: `specs/007-apache-bigtop-corpus/`
Target: `/home/fall_out_bug/projects/bigtop-landscape`
Output: `/tmp/portolan-bigtop-generic-20260527221217`

## Decision Gate

- Simpler/Faster: run the documented generic Portolan workflow from a normal
  landscape root instead of using the prepared `selection.json`.
- Blocking Edge Cases: this is a 3.0 GB local target with 18 Git checkouts; the
  run can prove CLI/root-discovery stress behavior, but it is not a Cursor UI /
  Composer operator lane.
- Existing Open Source: no new scanner or dependency was added; OSS producers
  remain planned local inputs through `oss-plan.json`.

## Commands

```bash
go run ./cmd/portolan context prepare \
  --root /home/fall_out_bug/projects/bigtop-landscape \
  --out /tmp/portolan-bigtop-generic-20260527221217/context \
  --profile cursor \
  --force

go run ./cmd/portolan map \
  --root /home/fall_out_bug/projects/bigtop-landscape \
  --out /tmp/portolan-bigtop-generic-20260527221217/map \
  --force
```

No `selection.json` was supplied to either command.

## Result

Status: `verified` for generic CLI/root workflow stress.

The run wrote the expected bounded context artifacts:

- `context/agent-brief.md`
- `context/answer-contract.md`
- `context/evidence-index.jsonl`
- `context/gaps.jsonl`
- `context/oss-plan.json`
- `context/query-plan.md`
- `context/repos.json`
- `context/tool-registry.json`

The run wrote the expected map artifacts:

- `map/run.json`
- `map/coverage.json`
- `map/summary.json`
- `map/graph-index.json`
- `map/graph.json`
- `map/findings.jsonl`
- `map/map.md`

## Evidence Summary

From `context/repos.json`:

- repositories discovered: 18
- discovery mode: `repos child repository`
- evidence state: `source-visible`

From `map/summary.json`:

- graph nodes: 172,243
- graph edges: 148,714
- findings: 555
- coverage records: 21
- visible repositories: 18
- weak coverage records: 3
- finding statuses: 430 `observed`, 118 `not_assessed`, 6 `cannot_verify`, 1
  `unknown`
- graph artifact size: 127 MB

Weak coverage records:

- `external-completeness`: `unknown`; no manifest or curated inventory was
  supplied, so local repository discovery does not prove complete ecosystem
  coverage.
- `non-git-child-directories`: `unknown`; one child directory looked
  landscape-like but had no `.git` boundary.
- `non-repository-children`: `not_assessed`; one direct child file was not
  assessed as a repository candidate.

## Product Impact

This verifies that after landscape root discovery, the Bigtop local ecosystem
root can be mapped through the generic root workflow without handing Portolan a
generated selection file. The old failure mode where `map --root` collapsed
the 18 sibling checkouts into one synthetic root was not observed in this run.

This does not verify:

- Cursor UI / Composer 2.5 operator behavior;
- an agent transcript using only Portolan path, target path, and output path;
- whether an agent produces a better answer with these artifacts than with
  agent prose alone;
- Semgrep, jscpd, Syft/CycloneDX, or Graphify producer execution on the Bigtop
  root during this run;
- complete external Bigtop ecosystem coverage beyond the 18 local checkouts.

## Disposition

T021 remains open for the real blind operator lane. The blocker is no longer
generic root CLI mapping; the remaining missing evidence is the Cursor UI /
Composer 2.5 transcript and scored answer using the generic blind contract.
