# Model Review: GLM Turbo

Date: 2026-05-27

Lane: `zai/glm-5-turbo`

Status: assessed

## Raw Output

```json
{
  "findings": [
    {
      "id": "C001",
      "claim": "Headless fixed Bigtop Cursor comparison",
      "status": "accepted",
      "scope": "narrowed"
    },
    {
      "id": "C002",
      "claim": "Local context/map capability",
      "status": "accepted",
      "scope": "full"
    },
    {
      "id": "C003",
      "claim": "Complete inherited-estate claim",
      "status": "rejected",
      "detail": "Claim overreaches available evidence"
    },
    {
      "id": "C005",
      "claim": "Component identity (Syft/CycloneDX)",
      "status": "accepted",
      "scope": "narrowed",
      "limitation": "jscpd failed; Semgrep not assessed"
    },
    {
      "id": "C006",
      "claim": "Duplicate detection",
      "status": "accepted",
      "scope": "narrowed",
      "limitation": "Exact duplicates only"
    },
    {
      "id": "C007",
      "claim": "Relationship claims",
      "status": "accepted",
      "scope": "narrowed",
      "limitation": "Narrowed by evidence type"
    }
  ],
  "verdict": "pass",
  "not_assessed": ["C004", "C009"]
}
```
