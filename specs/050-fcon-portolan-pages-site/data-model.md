# Data Model: FCON And Portolan GitHub Pages Site

## SiteSurface

| Field | Description | Validation |
| --- | --- | --- |
| `kind` | `organization` or `project` | Both must be planned |
| `url` | Default Pages URL or custom domain | `not_assessed` until configured |
| `source_repo` | Repository that publishes the site | Required before implementation |
| `source_path` | Branch/path or Actions workflow | Required before publication |

## Page

| Field | Description | Validation |
| --- | --- | --- |
| `slug` | Page path | Stable and human-readable |
| `purpose` | Company intro, project intro, demo, release, or docs route | Must have one primary purpose |
| `source_of_truth` | Repo doc that owns claims | Required for Portolan pages |
| `freshness` | Version/release/date pointer | Required |

## DomainPolicy

| Field | Description | Validation |
| --- | --- | --- |
| `domain` | Custom domain or default Pages URL | Must be chosen |
| `owner` | Who controls DNS/domain settings | Required for custom domain |
| `verification_state` | `verified`, `blocked`, or `not_assessed` | Required |
| `https_state` | `verified`, `blocked`, or `not_assessed` | Required |

## SiteClaim

| Field | Description | Validation |
| --- | --- | --- |
| `copy` | Public claim text | Must map to product claims |
| `claim_status` | `accepted`, `narrowed`, `rejected`, `failed`, `blocked`, or `not_assessed` | Positive claims only from accepted/narrowed |
| `source` | README, release notes, product claims, or demo docs | Required |
