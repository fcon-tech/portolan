# Contributing

Portolan welcomes small, evidence-backed contributions that keep the project
local-first, read-only by default, and honest about unknowns.

## Good Contribution Types

- Bug reports with a local command, target shape, expected behavior, actual
  behavior, and evidence state.
- Documentation fixes that make install, agent use, product boundaries, or
  evidence labels clearer.
- Focused CLI, schema, or artifact improvements backed by SpecKit tasks and
  tests.
- Focused importer or producer proposals that normalize local tool output and
  include a SpecKit plan.
- Review artifacts that narrow, reject, block, or verify public claims.

Avoid broad rewrites, speculative architecture, daemon behavior, network access,
credentials, or target repository mutation unless an approved spec explicitly
requires them.

## Evidence Labels

Use explicit states instead of smoothing uncertainty into success:

- `verified`: checked by a command, test, direct inspection, or GitHub state.
- `failed`: checked and failed.
- `blocked`: could not proceed because a named prerequisite is missing.
- `not_assessed`: not checked.
- `unknown`: no usable evidence was available.
- `cannot_verify`: evidence existed, but Portolan could not validate it.

For graph facts, preserve Portolan evidence states:

- `source-visible`
- `metadata-visible`
- `runtime-visible`
- `claim-only`
- `unknown`
- `cannot_verify`

## Before Opening An Issue

1. Check the [README](README.md), [Documentation Onboarding](docs/onboarding.md),
   and [Product Claims](docs/product-claims.md).
2. Run the smallest command that demonstrates the behavior.
3. Record the command, output path, target type, and evidence state.
4. Do not include private source code, secrets, customer data, or sensitive
   vulnerability details in public issues.

Use the security reporting route in [SECURITY.md](SECURITY.md) for sensitive
vulnerabilities.

## Before Opening A Pull Request

For repository changes, start from the relevant SpecKit package under `specs/`
or open a proposal issue when no spec exists yet.

Follow the [Code Of Conduct](CODE_OF_CONDUCT.md). By contributing, you confirm
that you have the right to submit the work under this repository's license. No
CLA or DCO sign-off is required for v1.

Run the baseline checks when they apply:

```bash
go test -count=1 ./...
jq empty schema/*.json
git diff --check
```

For CLI behavior changes, also run the affected command, for example:

```bash
go run ./cmd/portolan <command> --help
```

Update docs, schemas, fixtures, review artifacts, and task ledgers when the
behavior or public claim surface changes.

## Product Claim Discipline

Positive public wording should come only from `accepted` or `narrowed` claims in
[Product Claims](docs/product-claims.md). Treat `rejected`, `failed`,
`blocked`, and `not_assessed` states as limits, not as product promises.
