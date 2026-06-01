# Data Model: Public Demo Showcase

## DemoTarget

| Field | Description | Validation |
| --- | --- | --- |
| `kind` | `portolan-self`, `fixture`, or `external-oss` | Must be maintainer-approved |
| `source` | Path or public URL | No private paths in committed docs |
| `license_note` | License or reuse note for external target | Required for external OSS |
| `network_behavior` | Whether cloning/fetching is required | Must be explicit |

Chosen target:

```text
kind: external-oss
source: Apache Bigtop
license_note: Apache Bigtop is Apache License 2.0; verify and cite the
  repository license before publishing excerpts.
artifact_policy: runbook plus redacted excerpts; full outputs deferred
visual_policy: screenshots and terminal recordings deferred
```

## DemoRun

| Field | Description | Validation |
| --- | --- | --- |
| `command` | Copyable Portolan command | Must be smoke-tested |
| `output_path` | Local explicit output directory | Must be inside safe workspace path |
| `portolan_version` | Version or commit used | Required |
| `generated_at` | Timestamp or staleness note | Required for committed outputs |
| `artifacts` | Generated files | Must include required bundle members |

## ShowcaseArtifact

| Field | Description | Validation |
| --- | --- | --- |
| `path` | Demo doc, sample output, screenshot, or recording | Must be linked from README or demo doc |
| `purpose` | Install proof, artifact tour, case study, or visual proof | Must be clear |
| `freshness` | Current, generated sample, or historical case study | Must be explicit |
| `claim_scope` | Product claim scope carried with artifact | Required for case studies |

## PrivacyReview

| Field | Description | Validation |
| --- | --- | --- |
| `private_paths` | Private path scan result | Must be clean or blocked |
| `secrets` | Secret-looking value scan result | Must be clean or blocked |
| `customer_context` | Customer/private name scan result | Must be clean or blocked |
| `unsupported_claims` | Claim drift scan result | Must be clean or blocked |
