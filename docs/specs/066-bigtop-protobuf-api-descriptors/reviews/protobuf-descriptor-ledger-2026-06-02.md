# Protobuf Descriptor Ledger: Spec 066

Date: 2026-06-02
External output root:
`/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-066-protobuf-api-descriptors/tool-outputs`

## Tool Availability

verified:

```text
protoc	libprotoc 35.0
```

`protoc` is an existing OSS producer. No Portolan-owned protobuf scanner was
implemented.

## Descriptor Producer Results

verified:

```text
producer	exit_code	desc_bytes	stderr_bytes	source_count
hadoop-hdfs-common	0	114306	1067	38
hadoop-yarn-api-common	0	72753	0	27
hbase-rest	0	4075	0	11
hbase-protocol-shaded	1	0	1013	55
```

The non-zero stderr for `hadoop-hdfs-common` contains only unused import
warnings from upstream `.proto` files; no `protoc` errors were emitted for that
bounded group. The descriptor output still exists and exit code is `0`.

## Descriptor Summary

verified:

```text
producer	files	messages	enums	services	methods	pbtxt_bytes
hadoop-hdfs-common	38	633	27	21	219	334045
hadoop-yarn-api-common	27	313	34	17	106	196500
hbase-rest	11	11	0	0	0	14178
```

Interpretation:

- Hadoop HDFS/common now has real descriptor-set API/catalog evidence covering
  38 descriptor files, 633 messages, 27 enums, 21 services, and 219 methods.
- Hadoop YARN API/common now has real descriptor-set API/catalog evidence
  covering 27 descriptor files, 313 messages, 34 enums, 17 services, and 106
  methods.
- HBase REST now has real descriptor-set API/catalog evidence covering 11
  descriptor files and 11 messages. It does not define protobuf services in
  this descriptor set; the zero service/method count is confirmed by decoded
  descriptor inspection, not an omitted measurement.

## Blocked Broader Descriptor Groups

cannot_verify:

- Whole-Hadoop monolithic descriptor generation failed with duplicate
  `hadoop.common.RequestHeaderProto` symbols between `ProtobufRpcEngine.proto`
  and `ProtobufRpcEngine2.proto`. This is a structural conflict in the selected
  upstream source set.
- Whole-Hadoop descriptor generation after excluding `ProtobufRpcEngine.proto`
  still failed with YARN server enum value collisions and unresolved dependent
  types. This is a second structural conflict exposed after the first
  duplicate-symbol blocker is removed.
- HBase shaded protocol descriptor generation failed because
  `org/apache/hbase/thirdparty/google/protobuf/any.proto` is not present in the
  source checkout without generated shaded protobuf inputs. This is an
  environmental/generated-source blocker in the current checkout.

These failures are not treated as successful API evidence.

## Output Integrity

verified:

- `sha256.txt` records hashes for descriptor sets, decoded pbtxt files, source
  lists, include directory lists, command stdout/stderr, and summaries.
- `sizes.txt` records byte sizes for generated outputs.

## Claim Boundary

verified:

- Real protobuf API/catalog producer outputs exist for the three successful
  descriptor groups.

cannot_verify:

- Full Bigtop API/catalog coverage.
- Runtime topology.
- Full symbol/reference graph.
- Call graph.
- Enterprise code-intelligence parity.

blocked pending separate approval/tooling:

- Building or generating HBase shaded thirdparty protobuf inputs.
- Resolving whole-Hadoop duplicate or conflicting upstream proto definitions.
