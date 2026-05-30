# Pull Request

## Scope

- Spec or issue:
- User-facing change:
- Out of scope:

## Verification

Record every relevant check as `verified`, `failed`, `blocked`, or
`not_assessed`.

- [ ] `go test -count=1 ./...`, if Go behavior or shared contracts changed:
- [ ] `jq empty schema/*.json`, if schemas or JSON feature metadata changed:
- [ ] `git diff --check`
- [ ] Issue template YAML parse, if `.github/ISSUE_TEMPLATE/*.yml` changed:
- [ ] Affected CLI command or fixture smoke, if applicable:
- [ ] GitHub checks:

## Evidence-State Impact

List only states affected by this PR, or write `N/A`.

- Affected evidence states:
- Unchanged evidence states:

## Product-Claim Impact

- [ ] No public product claim changes.
- [ ] Product claims updated in `docs/product-claims.md`.
- [ ] Claim remains blocked, failed, rejected, or not_assessed and is not used as positive wording.

## Safety

- [ ] No new network access, daemon behavior, credentials, or target repository mutation without explicit approval.
- [ ] No private source, secrets, customer data, or sensitive vulnerability details are included.
- [ ] Docs, schemas, fixtures, task ledgers, and review artifacts are aligned where applicable.
