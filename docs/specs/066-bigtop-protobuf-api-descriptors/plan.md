# Implementation Plan: Bigtop Protobuf API Descriptors

**Branch**: `codex/066-bigtop-protobuf-api-descriptors`

**Spec**: `docs/specs/066-bigtop-protobuf-api-descriptors/spec.md`

## Summary

Use `protoc` to generate real protobuf descriptor sets for bounded Hadoop and
HBase API surfaces in the local Bigtop landscape, record successful outputs and
upstream blockers, and preserve evidence-state boundaries.

## Decision Gate

- **Simpler/Faster**: Count `.proto` files directly. Rejected because source
  file inventory is not the same as real producer output.
- **Blocking Edge Cases**: Whole-Hadoop descriptor generation hits duplicate
  upstream symbols between `ProtobufRpcEngine.proto` and
  `ProtobufRpcEngine2.proto`, then YARN server enum collisions. HBase shaded
  descriptors require generated shaded protobuf imports that are absent without
  a build/generation step.
- **Existing Open Source**: Use standard `protoc` descriptor-set output. Do not
  implement protobuf parsing inside Portolan.

## Scope

In scope:

- Hadoop HDFS/common descriptor generation.
- Hadoop YARN API/common descriptor generation.
- HBase REST descriptor generation.
- Whole-Hadoop and HBase shaded blocker evidence.
- Descriptor text summaries.
- Cursor boundary stress and independent review.

Out of scope:

- Building target repositories.
- Creating generated protobuf code.
- Runtime capture.
- Full def/ref or call graph generation.

## External Outputs

External output root:

```text
/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-066-protobuf-api-descriptors/tool-outputs/
```

Key files:

- `hadoop-hdfs-common.desc`
- `hadoop-yarn-api-common.desc`
- `hbase-rest.desc`
- `hadoop-hdfs-common.pbtxt`
- `hadoop-yarn-api-common.pbtxt`
- `hbase-rest.pbtxt`
- `protoc-run-summary.tsv`
- `descriptor-summary.tsv`
- `sha256.txt`
- `sizes.txt`

## Producer Results

verified:

```text
producer	exit_code	desc_bytes	stderr_bytes	source_count
hadoop-hdfs-common	0	114306	1067	38
hadoop-yarn-api-common	0	72753	0	27
hbase-rest	0	4075	0	11
hbase-protocol-shaded	1	0	1013	55
```

Descriptor summary:

```text
producer	files	messages	enums	services	methods	pbtxt_bytes
hadoop-hdfs-common	38	633	27	21	219	334045
hadoop-yarn-api-common	27	313	34	17	106	196500
hbase-rest	11	11	0	0	0	14178
```

blocked / cannot_verify:

- Whole-Hadoop monolithic descriptor set due duplicate
  `hadoop.common.RequestHeaderProto` symbols across `ProtobufRpcEngine.proto`
  and `ProtobufRpcEngine2.proto`; this is a structural conflict in the selected
  upstream source set.
- Whole-Hadoop descriptor set after excluding `ProtobufRpcEngine.proto` due
  YARN server enum value collisions and unresolved dependent types; this is a
  second structural conflict exposed after the first duplicate-symbol blocker is
  removed.
- HBase shaded protocol descriptor due missing
  `org/apache/hbase/thirdparty/google/protobuf/any.proto` generated import;
  this is an environmental/generated-source blocker in the current checkout.

Notes:

- The non-zero stderr for `hadoop-hdfs-common` contains only unused import
  warnings from upstream `.proto` files; no `protoc` errors were emitted for
  that bounded group, and the descriptor output exists with exit code `0`.
- HBase REST defines no protobuf services in this descriptor set; the zero
  service/method count is confirmed by the decoded descriptor summary, not an
  omitted measurement.

## Verification

```bash
go test ./...
go vet ./...
jq empty schema/*.json
git diff --check
```
