# Producer Ledger: Spec 063

Date: 2026-06-02
External output root:
`/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-063-semgrep-local-producer-final/tool-outputs`

## Producer Run

| ID | Producer | Scope | Status | Evidence state | Result |
| --- | --- | --- | --- | --- | --- |
| `producer-run-bigtop-semgrep-local-api-catalog-20260602` | Semgrep 1.164.0 with local generic rule pack | `apache-bigtop-repo/provisioner/docker`, `apache-bigtop-repo/bigtop-deploy/puppet` | verified | metadata-visible | Exit `0`; 102 files scanned; 143 findings; 0 Semgrep errors. |

## Command

```bash
semgrep scan \
  --config bigtop-api-catalog-rules.yaml \
  --metrics off \
  --disable-version-check \
  --json \
  --max-target-bytes 1000000 \
  /home/fall_out_bug/projects/bigtop-landscape/repos/apache-bigtop-repo/provisioner/docker \
  /home/fall_out_bug/projects/bigtop-landscape/repos/apache-bigtop-repo/bigtop-deploy/puppet
```

## Rule Pack

Rule pack provenance: written for this spec as a local generic Semgrep rule
targeting API/catalog mentions in Bigtop Puppet/provisioner surfaces. It was not
fetched from the Semgrep registry.

```yaml
rules:
  - id: bigtop-hadoop-ecosystem-api-mention
    message: Apache Hadoop ecosystem API or component namespace mention
    severity: INFO
    languages: [generic]
    pattern-regex: '(org\.apache\.(hadoop|hbase|hive|spark|flink|kafka|zookeeper|tez|phoenix|ranger|zeppelin|airflow|alluxio)[A-Za-z0-9_.$-]*|apache\.(hadoop|hbase|hive|spark|flink|kafka|zookeeper|tez|phoenix|ranger|zeppelin|airflow|alluxio)[A-Za-z0-9_.$-]*|\b(HDFS|YARN|MapReduce|HBase|Hive|Spark|Flink|Kafka|ZooKeeper|Tez|Phoenix|Ranger|Zeppelin|Airflow|Alluxio)\b)'
    metadata:
      producer_family: semgrep-local-generic
      evidence_state: metadata-visible
      claim_boundary: API/catalog mention evidence only; not runtime topology and not symbol/reference graph
```

## Output Files

verified:

Raw / primary:

- `bigtop-api-catalog-rules.yaml`
- `command.txt`
- `targets.txt`
- `semgrep-bigtop-api-catalog.json`
- `semgrep-bigtop-api-catalog.stderr`
- `semgrep-exit-code.txt`

Derived:

- `semgrep-summary.json`
- `top-result-paths.txt`
- `top-api-mentions.txt` (empty; derived extraction looked only at Semgrep
  `extra.lines`, while the generic regex findings are still present in raw
  Semgrep JSON)
- `sha256.txt`
- `sizes.txt`

## Summary

```json
{
  "results_count": 143,
  "errors_count": 0,
  "paths_scanned_count": 102,
  "skipped_count": 0
}
```

`semgrep-summary.json` is a derived summary from raw Semgrep JSON, not native
Semgrep output.

Verbatim excerpt from `semgrep-bigtop-api-catalog.stderr`:

```text
Scanning 102 files tracked by git with 1 Code rule:
Scanning 102 files.
Scan completed successfully.
 • Findings: 143 (143 blocking)
 • Rules run: 1
 • Targets scanned: 102
 • Parsed lines: ~100.0%
 • Scan skipped:
   ◦ Files matching .semgrepignore patterns: 10
 • Scan was limited to files tracked by git
Ran 1 rule on 102 files: 143 findings.
```

## Output Integrity

`sha256.txt` records:

```text
45e7801f624b2ade9c15d2aa896a9cfa93d82757b5166a917d973b45cc383095  bigtop-api-catalog-rules.yaml
815e49eabc27bf5f25af86beec3f5afe3a25d08fb78571d23247f94c96cf420b  command.txt
d036afdf6c5cb2dc3523a3d02f676a351467870fc814217cb53e37498ae54fd4  semgrep-bigtop-api-catalog.json
0d2218672bcd2c310e76e9311fc525900efaacb7344724b21e9ca81d32ac419e  semgrep-bigtop-api-catalog.stderr
9a271f2a916b0b6ee6cecb2426f0b3206ef074578be55d9bc94f6f3fe3ab86aa  semgrep-exit-code.txt
d5892875222344ee7b4476361863b2f4c78d3db623d3313d1cd29674f5ee7bdc  semgrep-summary.json
edf1568ac0a96b0d93af798a4714395eb08ff732eef2d5c0769f1604b7e66dda  targets.txt
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855  top-api-mentions.txt
5c183e82e625fa0fdf2cd2b4763d82668637d13340d22db80d0bdd7d12446cd7  top-result-paths.txt
```

`sizes.txt` records:

```text
   743 bigtop-api-catalog-rules.yaml
   281 command.txt
128473 semgrep-bigtop-api-catalog.json
   755 semgrep-bigtop-api-catalog.stderr
     2 semgrep-exit-code.txt
   100 semgrep-summary.json
  1852 sha256.txt
   180 targets.txt
     0 top-api-mentions.txt
  3392 top-result-paths.txt
135778 total
```

The empty `top-api-mentions.txt` does not mean the producer found no matches.
It means the optional derived mention counter did not extract tokens from the
chosen Semgrep JSON field. The authoritative producer result is
`semgrep-bigtop-api-catalog.json` plus `semgrep-summary.json`.

## Failed/Overscoped Attempt

cannot_verify:

- A broader three-target run over `apache-bigtop-repo`, `apache-hadoop`, and
  `apache-hbase` exceeded the bounded slice budget and was stopped. It is not
  counted as producer evidence.
- No valid JSON or complete output from that overscoped attempt is counted in
  this slice.

## Claim Boundary

Allowed:

- Bounded Semgrep local-config API/catalog mention evidence exists for Bigtop
  deployment/provisioner surfaces.
- The previous Semgrep auto-config blocker is narrowed: local config works for a
  bounded scope.

Forbidden:

- Runtime topology.
- Full symbol/reference graph.
- Call graph.
- Full corpus Semgrep coverage.
- Enterprise code-intelligence parity.

## Privacy And Mutation Review

- No registry config was used.
- `--metrics off` and `--disable-version-check` were set.
- No autofix was used.
- Target repositories were not modified.
- Raw output remains outside the repository.
