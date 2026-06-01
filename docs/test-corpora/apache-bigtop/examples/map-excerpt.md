# Portolan Map

- Command: `portolan map`
- Findings: 555
- Nodes: 172243
- Edges: 148714
- Coverage records: 21

## Landscape Inventory

- `external-completeness` (external-completeness): unknown / unknown from `` - no manifest or curated inventory was supplied; local repository discovery does not prove complete ecosystem coverage
- `alluxio` (repository): visible / source-visible from `<bigtop-root>/repos/alluxio` - local path visible
- `apache-airflow` (repository): visible / source-visible from `<bigtop-root>/repos/apache-airflow` - local path visible
- `apache-bigtop-repo` (repository): visible / source-visible from `<bigtop-root>/repos/apache-bigtop-repo` - local path visible
- `apache-flink` (repository): visible / source-visible from `<bigtop-root>/repos/apache-flink` - local path visible
- `apache-hadoop` (repository): visible / source-visible from `<bigtop-root>/repos/apache-hadoop` - local path visible
- `apache-hbase` (repository): visible / source-visible from `<bigtop-root>/repos/apache-hbase` - local path visible
- `non-git-child-directories` (repository-discovery): unknown / unknown from `<bigtop-root>` - 1 child directories looked landscape-like but had no .git boundary
- `non-repository-children` (repository-discovery): not_assessed / unknown from `<bigtop-root>` - 1 direct child file(s) were not assessed as repository candidates

## Contracts And Surfaces

- `alluxio-finding-configuration-not_assessed-001` [not_assessed]: Could not assess configuration candidate: candidate file exceeds 1048576 byte native configuration limit (unknown).
- `apache-bigtop-repo-finding-configuration-cannot_verify-001` [cannot_verify]: Could not assess configuration candidate: cannot scan candidate file: bufio.Scanner: token too long (cannot_verify).
- `apache-airflow-finding-configuration-secret-reference-observed` [observed]: Detected secret reference(s) by name only; values are not recorded. (source-visible).
