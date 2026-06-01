# Contract: Public Install And Release

## Public Install Contract

The README public install section is acceptable only when:

- it names one canonical repository/module identity;
- the primary install command is copyable;
- the source-checkout fallback is copyable;
- `portolan --version` is the success check;
- package-manager paths are absent unless implemented and verified;
- network behavior is explicit for each path.

## Release Contract

The release checklist is acceptable only when it records:

- chosen version;
- clean checkout source;
- local baseline result;
- version-command result;
- artifact checksum result;
- GitHub check state;
- release publication state;
- product-claim review result;
- adoption/popularity as separate and not inferred.

For `v0.1.0`, the default artifact contract is source-first:

- Git tag;
- GitHub release notes;
- public `go install` command;
- source-checkout bootstrap command;
- source archive from GitHub;
- checksums only for artifacts explicitly built and published.

Prebuilt binaries are not required for `v0.1.0` and must not be implied unless
the release slice explicitly adds platform smoke, checksum, and closeout
coverage for them.

## Release Note Shape

The `v0.1.0` release note should fit on one screen before expansion:

1. What Portolan is: local-first evidence maps for agents.
2. Quick start: canonical install or source bootstrap.
3. What is verified: current accepted/narrowed product claims.
4. Demo: Apache Bigtop route with fixed local scope.
5. Limits: no UI Cursor claim, no complete estate claim, no broad security
   certification, no adoption claim.

Avoid hero language, maturity badges, customer-style proof, or broad benchmark
phrasing unless the corresponding evidence has been verified.

## Claim Contract

Public release copy may say Portolan is a local evidence-preparation CLI for
agents. It may not say Portolan replaces coding harnesses, enterprise code
intelligence, observability, service catalogs, modernization tooling, or
security scanners. Any Bigtop, Cursor, OpenCode, OSS adapter, duplication,
relationship, runtime, or security claim must carry the current scope from
`docs/product-claims.md`.
