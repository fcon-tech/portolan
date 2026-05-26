# Example CTO Context Answer

## Context Status

| Item | Value |
| --- | --- |
| Target root | `/local/landscape` |
| Context command | `portolan context prepare --root /local/landscape --out /tmp/portolan-context --profile cursor` |
| Context artifacts inspected | `agent-brief.md`, `query-plan.md`, `repos.json`, `tool-registry.json`, `oss-plan.json`, `gaps.jsonl` |
| Map artifacts inspected | `not_assessed` |
| External completeness | `unknown` |

## Short Answer

The local folder contains three discovered repositories and two local tool-output
candidates. This is enough to answer local-scope questions about visible
repositories and available OSS evidence. It is not enough to claim complete
ecosystem coverage.

## Repository Scope

| Repository | Evidence | What It Means |
| --- | --- | --- |
| `api` | `repos.json` | Locally visible repository. |
| `web` | `repos.json` | Locally visible repository. |
| `worker` | `repos.json` | Locally visible repository. |

## Duplicate Components

| Finding | Evidence | State | Answer |
| --- | --- | --- | --- |
| jscpd output is present with `duplicate_groups` metric. | `tool-registry.json` | `metadata-visible` | Use the summary as a duplication evidence candidate, not a refactoring verdict. |
| SBOM output is absent. | `gaps.jsonl` | `not_assessed` | Component duplication and dependency drift are not assessed from SBOM evidence. |
| Syft producer recipe exists or is missing. | `oss-plan.json` | `not_assessed` | Run only with approval; output must stay under the Portolan context directory. |

## Implicit Knowledge

| Finding | Evidence | State | Answer |
| --- | --- | --- | --- |
| Backstage catalog is present. | `tool-registry.json` | `metadata-visible` | Use it as metadata-visible ownership/service evidence. |
| Code index is absent. | `gaps.jsonl` | `not_assessed` | Do not claim symbol-level or repo-wide semantic coverage. |

## Service Relationships

| Finding | Evidence | State | Answer |
| --- | --- | --- | --- |
| OpenAPI is present. | `tool-registry.json` | `metadata-visible` | API surfaces can be inspected from local contract files. |
| Runtime service graph is absent. | `gaps.jsonl` | `not_assessed` | Runtime topology is not assessed. |

## What I Would Not Claim

- I would not claim this folder is the whole ecosystem.
- I would not claim duplicate components are absent when SBOM/jscpd evidence is
  missing.
- I would not claim runtime topology without local runtime or telemetry export.
- I would not turn an agent inference into `source-visible` evidence.
