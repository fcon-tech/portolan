# OSS Adapter Contract

Portolan imports local OSS/tool outputs. It does not install tools, fetch
network resources, start daemons, mutate target repositories, or trust adapter
claims without local evidence.

Use an adapter contract before adding a new OSS input family.

## Validate

```bash
portolan adapter validate --in testdata/oss-adapter-contract/jscpd.json
```

## Required Decisions

- Tool identity and evidence family.
- Output kind that Portolan can normalize.
- License review status.
- Local execution posture.
- Network and mutation posture.
- Privacy posture, including source snippets and secret values.
- Default evidence state and limitations.
- Optional producer-confidence mapping when the tool distinguishes extracted,
  inferred, ambiguous, or otherwise weak facts.
- Safe local command recipe when Portolan can suggest one.

## Rules

- `execution.network` must be `none` or `optional`; network-required adapters
  are outside the default local-first boundary.
- `execution.mutates_target` must be `false`.
- Contracts that may include secret values must require redaction.
- `limitations` must be explicit; missing coverage is not success.
- `evidence.confidence_map` values must be valid Portolan evidence states.
  No producer confidence label may map to `source-visible` or `runtime-visible`
  unless a future importer performs direct Portolan source/runtime inspection
  outside this contract-only path. Producer `INFERRED` and `AMBIGUOUS` must
  remain weak evidence and must not map to `metadata-visible`. Acceptable weak
  states include `claim-only`, `unknown`, `cannot_verify`, and `not_assessed`.
- Validation does not run the tool. It only checks whether the adapter contract
  is safe and complete enough to discuss.
