# Full Ecosystem Checkouts - 2026-05-26

## Scope

Prepared the local Apache Bigtop ecosystem target under:

```text
/home/fall_out_bug/projects/bigtop-landscape/repos
```

This is outside the Portolan repository so target source checkouts do not become
repo noise.

## Repository Checkouts

Cloned every `repository_url` target from `corpora/apache-bigtop/manifest.json`
using shallow working-tree checkouts:

- `apache-bigtop-repo`
- `apache-airflow`
- `alluxio`
- `apache-flink`
- `apache-hadoop`
- `apache-hbase`
- `apache-hive`
- `apache-kafka`
- `apache-livy`
- `apache-phoenix`
- `apache-ranger`
- `apache-solr`
- `apache-spark`
- `apache-tez`
- `apache-zeppelin`
- `apache-zookeeper`
- `apache-oozie`
- `apache-sqoop`

Total local git checkouts: 18.

## Selection

Generated selection:

```text
/home/fall_out_bug/projects/bigtop-landscape/selection.json
```

Command:

```bash
go run ./cmd/portolan selection generate-bigtop \
  --manifest corpora/apache-bigtop/manifest.json \
  --repo-dir /home/fall_out_bug/projects/bigtop-landscape/repos \
  --out /home/fall_out_bug/projects/bigtop-landscape/selection.json \
  --force
```

Result: selection contains 15 active/external source repository targets and one
manifest metadata input. `apache-livy`, `apache-oozie`, and `apache-sqoop` are
present as local checkouts, but current selection generation does not promote
incubating or retired lifecycle entries into active/external source targets.

## Local Portolan Preflight

Command:

```bash
go run ./cmd/portolan map \
  --selection /home/fall_out_bug/projects/bigtop-landscape/selection.json \
  --out /home/fall_out_bug/projects/bigtop-landscape/run \
  --force
```

Result: wrote five artifacts:

- `run.json`
- `coverage.json`
- `graph.json`
- `findings.jsonl`
- `map.md`

Coverage summary:

```json
{
  "evidence_state:metadata-visible": 13,
  "evidence_state:source-visible": 31,
  "status:represented": 12,
  "status:visible": 32,
  "total": 44
}
```

Blocked records: 0.

`map.md` contains the expected CTO packet sections:

- Landscape Inventory
- Repo/Product Matrix
- Contracts And Surfaces
- Duplication
- Configuration
- Legacy And Debt
- Unknowns And Cannot Verify
- Machine Artifact Summary
- Next-Agent Tasks

## Remaining Acceptance Work

This proves local checkouts, generated selection, full-corpus gate, and Portolan
artifact generation. It does not complete the real blind operator lane. The next
step is still Cursor + Composer 2.5 using the `Landscape:
/home/fall_out_bug/projects/bigtop-landscape/selection.json` prompt shape and
recording the transcript or concise transcript summary.
