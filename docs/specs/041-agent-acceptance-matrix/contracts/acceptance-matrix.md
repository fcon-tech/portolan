# Contract: Agent Acceptance Matrix

## Matrix Rows

Each planned cell must record:

```json
{
  "id": "codex-single-repo",
  "harness": "Codex",
  "target_shape": "single-repo",
  "state": "not_assessed",
  "reason": "lane not run yet"
}
```

Allowed states: `verified`, `failed`, `blocked`, `unknown`, `not_assessed`.

## Lane Ledger

Each executed lane must include:

- prompt text or path;
- target path;
- output path;
- Portolan commands used;
- agent answer;
- unsupported-claim count;
- useful-next-action count;
- explicit unknowns and `not_assessed` surfaces.
