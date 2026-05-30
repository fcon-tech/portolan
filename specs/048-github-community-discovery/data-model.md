# Data Model: GitHub Community Discovery

## GitHubMetadata

| Field | Description | Validation |
| --- | --- | --- |
| `description` | Short repository description | Must match product boundary |
| `homepage` | Optional public docs/demo URL | `not_assessed` until chosen and applied |
| `topics` | GitHub discovery topics | Must avoid unsupported claims |
| `badges` | README badges | Must have checked backing state |
| `social_preview` | Optional image | Must not imply unsupported UI/product scope |

## CommunityFile

| Field | Description | Validation |
| --- | --- | --- |
| `path` | File path such as `CONTRIBUTING.md` | Must be discoverable from README or GitHub |
| `purpose` | Contribution, security, conduct, support, issue, or PR | Must be concise |
| `claim_boundary` | Product/security limitation text | Required for security and support |
| `owner_decision` | Maintainer-approved or blocked | Required when contact/policy is involved |

Recommended security file values:

```text
primary_channel: GitHub private vulnerability reporting for fcon-tech/portolan
fallback_channel: none for v1 unless fcon-tech confirms a monitored alias
public_issue_policy: do not post sensitive vulnerability details publicly
supported_versions: v0.1.x once released; unreleased main is best-effort
```

## ContributionTemplate

| Field | Description | Validation |
| --- | --- | --- |
| `kind` | Bug, feature, evidence gap, or PR | Must request scope |
| `evidence_state` | Evidence labels supplied by contributor | Must allow weak states |
| `verification` | Commands/checks run | May be `not_assessed` with reason |
| `claim_impact` | Whether public claims change | Required for PRs |

## OSSHealthSignal

| Field | Description | Validation |
| --- | --- | --- |
| `signal` | CI badge, Scorecard, Best Practices, release, license, community profile | Must be inspected |
| `state` | `verified`, `failed`, `blocked`, or `not_assessed` | Cannot default to green |
| `evidence` | Link or command used to verify | Required when `verified` or `failed` |
