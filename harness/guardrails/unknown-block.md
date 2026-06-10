# Unknown Block (Guardrail)

When evidence is missing, say so in one short block:

```text
Unknowns:
- duplication: not_assessed (no jscpd output) — see harness/recipes/duplication-jscpd.md
- runtime topology: not_assessed (no runtime export)
```

Rules:

- List gaps from `gaps.jsonl` first.
- Do not fill gaps with naming conventions or repository size.
- Missing producer output is not proof of absence of issues.
