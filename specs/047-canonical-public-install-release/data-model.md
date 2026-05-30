# Data Model: Canonical Public Install And Release

## CanonicalIdentity

| Field | Description | Validation |
| --- | --- | --- |
| `repository_url` | Public GitHub repository URL used in README and release notes | Exactly one chosen URL |
| `module_path` | Go module path declared in `go.mod` | Must match public install decision |
| `clone_command` | Copyable source checkout command | Must use `repository_url` |
| `go_install_command` | Copyable Go install command if supported | Must succeed or be omitted with reason |
| `ldflags_package_path` | Package path used for release version injection | Must match actual `internal/app.Version` path |

Chosen launch value:

```text
repository_url: https://github.com/fcon-tech/portolan
module_path: github.com/fcon-tech/portolan
clone_command: git clone https://github.com/fcon-tech/portolan.git
go_install_command: go install github.com/fcon-tech/portolan/cmd/portolan@v0.1.0
ldflags_package_path: github.com/fcon-tech/portolan/internal/app.Version
```

## InstallPath

| Field | Description | Validation |
| --- | --- | --- |
| `kind` | `go-install`, `source-bootstrap`, or `release-artifact` | One primary path in README |
| `command` | Copyable command sequence | Must be smoke-tested |
| `network_behavior` | Whether the path fetches modules or artifacts | Must be explicit |
| `verification` | Expected `portolan --version` output | Must be observable |

## ReleaseCandidate

| Field | Description | Validation |
| --- | --- | --- |
| `version` | Release version or tag | Chosen before build |
| `artifacts` | Source or binary artifacts | Checksums required for binaries |
| `release_notes` | Public release text | Must reference claim limits |
| `checks_state` | GitHub checks state | `verified`, `failed`, or `not_assessed` |

Chosen launch value:

```text
version: v0.1.0
artifact_policy: source-first
copy_style: restrained technical launch note
```

## ClaimBoundary

| Field | Description | Validation |
| --- | --- | --- |
| `claim` | Public statement in README or notes | Must map to product claims |
| `status` | `accepted`, `narrowed`, `rejected`, `failed`, `blocked`, or `not_assessed` | Positive claims only from accepted/narrowed |
| `scope` | Limitation text carried with narrowed claims | Required for narrowed claims |
