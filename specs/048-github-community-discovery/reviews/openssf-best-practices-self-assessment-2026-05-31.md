# OpenSSF Best Practices Self-Assessment

**Date**: 2026-05-31

**Repository**: `https://github.com/fcon-tech/portolan`

**Scope**: OpenSSF Best Practices passing-badge readiness for the public
Portolan repository after PR #24.

## Decision

Do not add an OpenSSF Best Practices badge to `README.md` yet.

The repository is close to passing-badge submission, but the honest next state
is `prepared for maintainer submission`, not `badge achieved`.

## Verification Commands

```bash
gh repo view fcon-tech/portolan --json nameWithOwner,url,isPrivate,description,homepageUrl,licenseInfo,defaultBranchRef,createdAt,updatedAt,pushedAt,repositoryTopics,hasIssuesEnabled,isSecurityPolicyEnabled,securityPolicyUrl,hasDiscussionsEnabled,hasWikiEnabled,visibility,viewerPermission
gh api repos/fcon-tech/portolan/private-vulnerability-reporting
gh api repos/fcon-tech/portolan/community/profile
gh issue list --repo fcon-tech/portolan --state all --limit 50 --json number,title,state,createdAt,updatedAt,closedAt,author,comments,url
gh pr list --repo fcon-tech/portolan --state all --limit 30 --json number,title,state,createdAt,updatedAt,closedAt,mergedAt,author,comments,url
gh release list --repo fcon-tech/portolan --limit 20
git tag --list --sort=-creatordate
gh api 'repos/fcon-tech/portolan/code-scanning/alerts?state=open&per_page=100' --paginate | jq 'length'
gh api 'repos/fcon-tech/portolan/dependabot/alerts?state=open&per_page=100' --paginate | jq 'length'
go test ./...
go vet ./...
semgrep scan --config p/golang --error --timeout 60 --metrics off
git grep -n -E 'AKIA[0-9A-Z]{16}|BEGIN (RSA|DSA|EC|OPENSSH|PRIVATE) KEY|ghp_[A-Za-z0-9_]{36,}|github_pat_[A-Za-z0-9_]+|password\s*=|passwd\s*=|secret\s*=|api[_-]?key\s*=' -- . ':!specs/**/reviews/*.md' ':!docs/**'
```

## Current Results

| Surface | State | Evidence |
| --- | --- | --- |
| Public repository | `verified` | `gh repo view` returned `visibility: PUBLIC`, default branch `main`, URL `https://github.com/fcon-tech/portolan`. |
| Repository description | `verified` | `Local-first evidence maps for AI agents working across unfamiliar codebases.` |
| License | `verified` | GitHub reports MIT license; `LICENSE` exists at repository root. |
| Community files | `verified` | GitHub community profile shows README, license, contributing, code of conduct, and PR template on `main`. |
| Issue forms | `verified with API gap` | YAML forms exist on `main`; GitHub community profile API still returns `issue_template: null`. |
| Security policy | `verified` | `gh repo view` returns `isSecurityPolicyEnabled: true`; private vulnerability reporting is enabled. |
| Issues | `verified` | Issues are enabled; `gh issue list` returned no historical issues. |
| Pull request history | `verified` | PR list shows merged PRs #1-#24 with public URLs. |
| Releases/tags | `blocked` | `gh release list` and `git tag --list` returned no public releases/tags. Existing docs prepare `v0.1.0` but it is not published. |
| Code scanning open alerts | `verified` | Code scanning open-alert count returned `0`. |
| Dependabot open alerts | `verified` | Dependabot open-alert count returned `0`. |
| Local tests | `verified` | `go test ./...` passed. |
| Go vet | `verified` | `go vet ./...` passed and is added to CI/contributor/release checks in this follow-up. |
| Semgrep Go rules | `verified` | `semgrep scan --config p/golang --error --timeout 60 --metrics off` ran 42 rules on 33 Go files with 0 findings. |
| Credential grep | `verified` | Focused credential pattern grep returned no matches outside docs/review exclusions. |

## Passing Criteria Mapping

| OpenSSF criterion area | Candidate answer | Evidence / note |
| --- | --- | --- |
| Project website describes what the software does | Met | README first screen and GitHub description. |
| Website explains how to obtain, provide feedback, and contribute | Met | README install section, `CONTRIBUTING.md`, issue forms, support/security docs. |
| Contribution process is explained | Met | `CONTRIBUTING.md` and PR template. |
| Contribution requirements are stated | Met | SpecKit, evidence-state, baseline-check, safety, and claim-boundary requirements in `CONTRIBUTING.md` and PR template. |
| Software is FLOSS | Met | MIT license. |
| License is OSI-approved | Met | MIT is OSI-approved. |
| License is posted in a standard repository location | Met | Root `LICENSE`. |
| Basic documentation exists | Met | README, `docs/onboarding.md`, agent install docs, product claims, demo docs. |
| External interface documentation exists | Met | README command examples, CLI help smoke, docs for context/map/query workflows, schema docs. |
| Project URLs use HTTPS/TLS | Met | GitHub-hosted HTTPS URLs. |
| Discussion/report mechanism is searchable and URL-addressable | Met | GitHub issues and pull requests; Discussions are disabled but not required. |
| English documentation and English bug reports are supported | Met | README, CONTRIBUTING, SECURITY, SUPPORT, issue forms, and PR template are in English. |
| Project is maintained | Met | Recent commits and PR merges on 2026-05-30; 105 commits in the last 60 days. |
| Source repository is public and version-controlled | Met | Public GitHub git repository. |
| Source repository tracks what changed, who changed it, and when | Met | Git history and merged PR history. |
| Repository includes interim versions for review | Met | Public PR history #1-#24. |
| Distributed VCS is used | Met | Git. |
| Unique version identifier for each release | Blocked | No published tag/release yet. Do not claim this until `v0.1.0` is tagged or the project explicitly treats commit SHA as the only current release identifier. |
| SemVer/CalVer release numbering | Prepared, not achieved | Release docs choose `v0.1.0`, but the tag is not published. |
| Releases are identified in version control | Blocked | No tags returned. |
| Release notes exist for each release | Prepared, not achieved | `docs/releases/v0.1.0.md` exists, but no GitHub release is published. |
| Release notes identify publicly known fixed vulnerabilities | N/A until first release | No release exists yet; no open CodeQL or Dependabot alerts were found. |
| Bug report process exists | Met | GitHub issue forms and `SUPPORT.md`. |
| Issue tracker is used | Met | GitHub Issues are enabled. |
| Majority of bug reports in last 2-12 months acknowledged | Met with zero-volume evidence | `gh issue list` returned no submitted issues; no unacknowledged bug reports exist in the window. |
| Majority of enhancement requests in last 2-12 months responded to | Met with zero-volume evidence | `gh issue list` returned no submitted enhancement requests. |
| Public archive of reports and responses exists | Met | GitHub Issues and PRs provide public URLs/archive. |
| Vulnerability reporting process is published | Met | `SECURITY.md` and GitHub security policy URL. |
| Private vulnerability reporting is documented | Met | GitHub private vulnerability reporting is enabled; `SECURITY.md` points to the private advisory URL. |
| Vulnerability initial response time <= 14 days | Met with zero-volume evidence | No security advisories/reports were observed; policy states best-effort without SLA. A stronger answer requires maintainer assertion if the badge form does not accept zero-volume evidence. |
| Working build system exists | Met | Go module, `go build`, `scripts/bootstrap-portolan`, and CI. |
| Common build tools are used | Met | Go toolchain. |
| Buildable with FLOSS tools | Met | Go, jq, and shell scripts are enough to build and verify locally; GitHub Actions is CI infrastructure, not a proprietary build dependency. |
| Automated test suite exists and is documented | Met | `go test ./...` in CI, CONTRIBUTING, release guide, AGENTS. |
| Test suite uses standard invocation | Met | `go test ./...`. |
| Test suite covers most branches/inputs/functionality | Partially met | Broad unit/integration tests exist; no coverage percentage is published. Avoid claiming coverage quality beyond current evidence. |
| Continuous integration is used | Met | GitHub Actions `CI` workflow on PRs and pushes to `main`. |
| New major functionality should add tests | Met | SpecKit workflow and CONTRIBUTING require focused tests unless docs-only. |
| Recent major changes followed test policy | Met | Recent PRs include local verification and CI evidence; docs-only slices record why code tests are unchanged. |
| Test policy is documented in change proposal instructions | Met | `CONTRIBUTING.md`, PR template, AGENTS, SpecKit tasks. |
| Warning flags / safe mode / linter are used | Met after follow-up | `go vet ./...` passed and is now added to CI/contributor/release checks. |
| Warnings are addressed | Met after follow-up | `go vet ./...` passed with no output. |
| Strict warnings where practical | Met enough for current stage | Go vet plus CodeQL/Semgrep evidence; not claiming maximal lint strictness. |
| Primary developer secure-design knowledge | Maintainer assertion required | Repo has threat model and security-boundary docs, but the badge answer asks about developer knowledge. User/maintainer must assert this truthfully. |
| Primary developer knows common vulnerability classes and mitigations | Maintainer assertion required | Evidence exists in security docs/tests, but knowledge is a human assertion. |
| Cryptographic protocols/algorithms are public and reviewed | N/A / Met | Portolan does not implement cryptographic protocols. The only Go crypto use found is `crypto/sha256` for duplicate normalization hashing. |
| Calls dedicated crypto libraries instead of reimplementing crypto | Met | Uses Go stdlib `crypto/sha256`; no custom crypto implementation found. |
| Crypto is FLOSS-implementable | Met | Go stdlib. |
| Key length configuration criteria | N/A | Portolan does not implement key-management security mechanisms. |
| Broken crypto algorithms are not used by default | Met | No MD5/SHA1/broken crypto use found in Go source; SHA256 is used for content hashing. |
| Weak crypto algorithms are not used by default | Met | No weak crypto use found. |
| Perfect forward secrecy | N/A | Portolan does not implement transport/session key exchange. |
| Password storage | N/A | Portolan does not store external-user passwords. |
| Crypto random generation | N/A | Portolan does not generate cryptographic keys/nonces. |
| Delivery counters MITM | Met | GitHub HTTPS/SSH distribution paths; release guide avoids unchecked HTTP hash flows. |
| No unsigned hash retrieved over HTTP | Met | No HTTP hash retrieval flow found. |
| No unpatched medium+ public vulnerabilities older than 60 days | Met with checked external state | Code scanning open alerts: 0; Dependabot open alerts: 0; no security advisories observed. |
| Critical vulnerabilities fixed rapidly | No reports observed | No critical vulnerability reports/alerts observed. Future reports need timed response evidence. |
| Public repository does not leak private credentials | Met for focused scan | Focused credential grep returned no matches outside docs/review exclusions. This is not a full secret-scanning guarantee. |
| Static source analysis before production release | Met | GitHub CodeQL workflow is active; Semgrep Go rules returned 0 findings locally. |
| Static analysis includes common vulnerabilities | Met | CodeQL and Semgrep Go rules cover security-relevant patterns. |
| Medium+ static-analysis findings are fixed timely | Met with current evidence | Current CodeQL alerts count is 0; Semgrep produced 0 findings. |
| Static analysis runs on every commit/daily | Met | GitHub CodeQL/quality workflows run on push/main; CI now includes `go vet`. |
| Dynamic analysis before production release | Not required for passing; not assessed | No DAST/fuzzing claim is made. |
| Dynamic analysis for memory-unsafe language | N/A | Primary implementation language is Go; no C/C++ production source found. |
| Assertions in dynamic analysis | Not assessed | Go tests are run, but no assertion-enabled dynamic analysis profile is claimed. |
| Dynamic-analysis findings fixed timely | N/A | No dynamic-analysis findings are claimed. |

## Submission Boundary

I can prepare and maintain the evidence, but creating/submitting the
Best Practices project requires an authenticated session on
`https://www.bestpractices.dev/`.

The safe submission path is:

1. Publish or explicitly defer `v0.1.0`.
   - Best path: tag and publish `v0.1.0`, then use
     `docs/releases/v0.1.0.md` as release notes.
   - If not publishing yet, answer release/versioning fields with a clear
     statement that no public tagged release exists and source checkout is
     identified by Git commit SHA.
2. Sign in to `https://www.bestpractices.dev/en`.
3. Create a project for `https://github.com/fcon-tech/portolan`.
4. Use this file as the evidence source for passing-criteria answers.
5. Do not add the Best Practices badge to README until the site gives a project
   ID and the badge state is visible.

Expected badge markdown after the site creates a project:

```markdown
[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/<PROJECT_ID>/badge)](https://www.bestpractices.dev/projects/<PROJECT_ID>)
```

## Follow-Up Recommendations

1. Publish `v0.1.0` before attempting a passing badge if the project is meant to
   present a reusable public release.
2. Add OpenSSF Scorecard workflow separately before adding a Scorecard badge.
3. Consider disabling the GitHub wiki if maintainers do not intend it as an
   official documentation surface.
4. Keep Best Practices answers conservative: use `N/A` or explicit notes for
   release, vulnerability-response, and dynamic-analysis criteria where current
   evidence is zero-volume or not applicable.
