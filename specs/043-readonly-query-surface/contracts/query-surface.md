# Contract: Readonly Query Surface

## CLI Shape

Initial command family:

```bash
portolan query findings --bundle <run-dir> --kind <kind> --limit <n>
portolan query gaps --bundle <run-dir> --limit <n>
```

The exact command may be adjusted during implementation if local CLI conventions require it, but it must remain read-only and documented.

## Output Shape

```json
{
  "schema_version": "0.1.0",
  "query": {"family": "findings", "limit": 20},
  "records": [
    {
      "id": "finding-id",
      "reference": "portolan://bundle/findings/finding-id",
      "artifact": "findings.jsonl",
      "evidence_state": "source-visible",
      "status": "observed",
      "reason": ""
    }
  ],
  "truncated": false,
  "warnings": []
}
```

Weak records must include a non-empty reason when the source artifact provides one.
