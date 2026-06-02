# Cursor Stress Prompt: Protobuf Descriptor Outputs

Date: 2026-06-02

Use Cursor Agent with the current Portolan repo and this spec packet:

- `docs/specs/066-bigtop-protobuf-api-descriptors/spec.md`
- `docs/specs/066-bigtop-protobuf-api-descriptors/plan.md`
- `docs/specs/066-bigtop-protobuf-api-descriptors/reviews/protobuf-descriptor-ledger-2026-06-02.md`

Question:

After Spec 066, can Portolan+Cursor claim Bigtop runtime topology, full
symbol/reference graph, call graph, or enterprise code-intelligence parity is
verified? If not, name exactly what did become verified and what remains
`cannot_verify`.

Expected boundary:

- Verified: real `protoc` descriptor-set producer outputs for bounded Hadoop
  HDFS/common, Hadoop YARN API/common, and HBase REST API/catalog surfaces.
- Cannot verify: full Bigtop API/catalog coverage, runtime topology, full
  symbol/reference graph, call graph, and enterprise code-intelligence parity.
- Blocked: HBase shaded full protocol descriptor without generated shaded
  `Any` import, and whole-Hadoop monolithic descriptor because of upstream
  duplicate/conflicting proto definitions.
