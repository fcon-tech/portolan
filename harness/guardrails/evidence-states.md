# Evidence States (Guardrail)

Allowed states on hotspots and graph facts:

| State | Meaning |
| --- | --- |
| `source-visible` | Visible in source files |
| `metadata-visible` | Tool output or manifest (jscpd, Semgrep, SBOM) |
| `runtime-visible` | Local runtime observation export only |
| `claim-only` | Human/tool claim not verified locally |
| `unknown` | No usable evidence |
| `cannot_verify` | Evidence present but not validated |
| `not_assessed` | Producer not run or surface skipped |

Never upgrade `claim-only` or `not_assessed` to observed without new local output.
