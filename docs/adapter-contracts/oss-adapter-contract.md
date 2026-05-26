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
- Safe local command recipe when Portolan can suggest one.

## Rules

- `execution.network` must be `none` or `optional`; network-required adapters
  are outside the default local-first boundary.
- `execution.mutates_target` must be `false`.
- Contracts that may include secret values must require redaction.
- `limitations` must be explicit; missing coverage is not success.
- Validation does not run the tool. It only checks whether the adapter contract
  is safe and complete enough to discuss.
