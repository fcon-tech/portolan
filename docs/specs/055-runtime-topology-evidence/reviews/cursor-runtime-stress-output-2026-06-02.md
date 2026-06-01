Evidence is drawn only from the five files you listed. The smoke bundle is a **fixture** map (`internal/testfixtures/runtime-topology-evidence/selection.json` per `summary.json`); Bigtop landscape has **no** selected runtime observation export.

```json
{
  "smoke_runtime_visible": [
    "api → worker (observes)"
  ],
  "smoke_metadata_only": [
    "fixture-deps → fixture-deps:component:api (observes)",
    "fixture-deps → fixture-deps:component:library (observes)",
    "fixture-deps:component:api → fixture-deps:component:library (depends-on)"
  ],
  "bigtop_runtime_topology": {
    "status": "not_verified",
    "evidence_state": "not_assessed",
    "reason": "bigtop-landscape/selection.json sets \"runtime\": null and has no runtime observation in targets; producer-runs.jsonl records producer-run-bigtop-runtime-not-assessed-20260601 with status not_assessed and limitation \"no runtime-visible local observation supplied\". Available producers are deployment-model (docker-compose, helm) and api-catalog (protoc), all metadata-visible with explicit \"not runtime topology\" / \"does not prove runtime calls\" limitations—none qualify as runtime topology evidence."
  },
  "overclaim_check": "Do not treat CycloneDX fixture-deps edges, Docker Compose config, Helm templates, or protobuf descriptors as Bigtop runtime topology. The smoke bundle proves one runtime-visible call edge (api→worker) on test fixtures only; fixture-runtime→runtime-topology is unknown (partial coverage), not runtime-visible. Bigtop has no selected runtime observation export—compose/helm/protoc must stay metadata-visible deployment/API metadata, not verified service topology."
}
```

**Notes (from artifacts only):**

| Edge | Evidence state | Source |
|------|----------------|--------|
| `api` → `worker` (`observes`) | `runtime-visible` | `runtime/redacted-export.json` |
| CycloneDX `fixture-deps` edges | `metadata-visible` | `dependencies.cdx.json` |
| `fixture-runtime` → `runtime-topology` (`unknown`) | `unknown` | partial runtime coverage; not runtime topology proof |

Bigtop: `selection.json` line 86 `"runtime": null`; `producer-runs.jsonl` line 5 documents missing `runtime-observation-export`. No Bigtop map bundle was supplied—only landscape selection and producer-run ledger.
