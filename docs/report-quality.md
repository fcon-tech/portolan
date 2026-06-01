# Report Quality Contract

Portolan report quality is about evidence honesty, not polish. A report may
pass while still being short if it exposes its limits.

## Summary Shape

`portolan report quality` reads a local JSON summary:

```json
{
  "schema_version": "0.1.0",
  "report_id": "example",
  "required_sections": [
    { "name": "visible_scope", "present": true }
  ],
  "positive_claims": [
    {
      "claim": "The report found source-visible repository evidence.",
      "evidence_ref": "portolan://graph/nodes/repo:api",
      "supported": true
    }
  ],
  "weak_states": [
    {
      "state": "unknown",
      "visible": true,
      "evidence_ref": "portolan://coverage/runtime-topology"
    }
  ],
  "optional_producers": [
    { "name": "jscpd", "visible": true }
  ]
}
```

Schema: [report-quality-summary.schema.json](../schema/report-quality-summary.schema.json).

## Pass Rules

The gate passes only when:

- every required section is present;
- every positive claim has an `evidence_ref`;
- every positive claim is marked `supported: true`;
- every `unknown`, `cannot_verify`, or `not_assessed` source state in the
  summary is visible;
- every weak state has an `evidence_ref`.

Optional producer absence should be visible in the report as a gap or next
action. Hidden optional producer gaps produce warnings.

## Command

```bash
portolan report quality --summary internal/testfixtures/report-quality/thin-honest.json
```

The command exits `0` for `pass`, exits `1` for a valid summary that fails
quality, and exits `2` for usage or parse errors.
