# GitHub Metadata Closeout

**Date**: 2026-05-30

## External GitHub State

Command:

```bash
gh repo view fcon-tech/portolan --json nameWithOwner,description,homepageUrl,repositoryTopics,isPrivate,url
```

Result:

| Surface | State | Evidence |
| --- | --- | --- |
| Repository | `verified` | `fcon-tech/portolan`, public, `https://github.com/fcon-tech/portolan`. |
| Description | `verified` | `Local-first evidence maps for AI agents working across unfamiliar codebases.` |
| Homepage | `verified` | Empty string; Pages URL deferred to P5-050. |
| Topics | `verified` | `ai-agents`, `cli`, `code-intelligence`, `codebase-analysis`, `cyclonedx`, `developer-tools`, `evidence-graph`, `go`, `local-first`, `oss`, `sbom`, `semgrep`, `software-architecture`. |
| Private vulnerability reporting | `verified` | `gh api repos/fcon-tech/portolan/private-vulnerability-reporting` returned `{"enabled":true}`. |

## Community Profile State

Command:

```bash
gh api repos/fcon-tech/portolan/community/profile
```

Current public default-branch state:

| Surface | State | Evidence |
| --- | --- | --- |
| README | `verified` | Present on default branch. |
| License | `verified` | MIT license present on default branch. |
| Contributing | `verified` | Post-merge community profile API shows `CONTRIBUTING.md` on `main`. |
| Code of conduct | `verified` | Post-merge community profile API shows `CODE_OF_CONDUCT.md` on `main`. |
| Issue template | `verified` for files; API gap recorded | YAML issue forms exist on `main`; post-merge community profile API still returned `issue_template: null`. |
| Pull request template | `verified` | Post-merge community profile API shows `.github/pull_request_template.md` on `main`. |
| Badge state | `not_assessed` | No new badge was added in this slice. |
| OpenSSF Scorecard / Best Practices | `not_assessed` | No Scorecard or Best Practices badge was configured in this slice. |

## Disposition

GitHub metadata, private vulnerability reporting, and the post-merge community
profile recheck are externally verified. GitHub's community profile API still
returns `issue_template: null` even though YAML issue forms are present on
`main`; that API gap is recorded in merge closeout instead of being smoothed
into a fully green community-profile claim.

The badge, Scorecard, and Best Practices states are recorded as `not_assessed`.
They are not positive OSS-health claims for this release.
