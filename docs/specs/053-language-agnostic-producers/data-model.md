# Data Model: Language Agnostic Evidence Producers

## Producer Family

- `id`: stable family id, for example `dependency`, `symbol-index`,
  `api-catalog`, `deployment-model`, `static-finding`, `duplication`, `config`,
  or `runtime-observation`
- `blocked_claims`: claims this family can reduce
- `current_state`: `observed`, `partial`, `blocked`, `unknown`,
  `cannot_verify`, or `not_assessed`
- `repositories`: affected repository ids or `landscape`
- `required_output`: expected local artifact or export shape
- `candidate_tools`: candidate producer ids, each treated as an option unless
  evaluated
- `candidate_tools[].verification_state`: not_assessed, cannot_verify,
  verified_local_output, or blocked
- `candidate_tools[].support_state`: candidate_only, accepted, narrowed,
  rejected, or blocked
- `reason`: why this family is recommended

## Producer Candidate

- `id`: stable candidate id
- `family`: producer family id
- `name`: tool, format, or local artifact name
- `mode`: local export, local CLI, local file, service, MCP, daemon, or unknown
- `output_contract`: expected artifact shape or `not_assessed`
- `boundary_risks`: network, credentials, daemon, mutation, source export,
  privacy, size, or unknown risks
- `evaluation_status`: accepted, narrowed, rejected, blocked, or `not_assessed`
- `evaluation_source`: review, local smoke, fixture, docs, or unknown

## Producer Evaluation

- `id`: stable evaluation id
- `candidate_id`: producer candidate id
- `decision`: accepted, narrowed, rejected, blocked, or `not_assessed`
- `fit`: relationship between candidate output and blocked claim family
- `output_contract_stability`: stable, partial, unstable, unknown, or
  `cannot_verify`
- `local_execution`: verified, assumed, blocked, or `not_assessed`
- `license`: accepted, review_required, blocked, or `not_assessed`
- `maintenance`: active, stale, unknown, or `not_assessed`
- `privacy`: local_safe, narrowed, blocked, or `not_assessed`
- `integration_cost`: low, medium, high, or unknown
- `integration_cost`: low, medium, high, unknown, or not_assessed
- `evidence_source`: local file, review artifact, command output, or
  `not_assessed`
- `notes`: bounded explanation

## Blocked Claim

- `id`: stable claim id
- `claim`: plain-language claim that remains weak
- `required_family`: producer family needed to reduce the claim
- `current_state`: unknown, cannot_verify, or `not_assessed`
- `repositories`: affected repository ids or landscape
- `reason`: why current evidence is insufficient

## Coverage Matrix Record

- `id`: stable record id
- `repository_id`: repository id or `landscape`
- `family`: producer family id
- `status`: observed, partial, blocked, unknown, cannot_verify, or
  `not_assessed`
- `evidence_state`: source-visible, metadata-visible, runtime-visible,
  claim-only, unknown, cannot_verify, or `not_assessed`
- `source_artifact`: local artifact that justifies the status
- `scope`: repository, subdirectory, landscape, or unknown
- `scope_detail`: repository id, relative path, component id, or other bounded
  scope detail when coverage is partial
- `languages_in_scope`: language families covered by this record; empty means
  language coverage is not assessed
- `reason`: bounded explanation for agents

## State Rules

- A recommendation is not evidence. It cannot upgrade a claim from
  `not_assessed` to observed.
- A candidate is not supported until a producer evaluation says accepted or
  narrowed with local evidence. Candidate tool names must be represented as
  objects with support state, never as plain strings.
- Runtime topology remains `not_assessed` unless runtime-visible local
  observations exist and are in scope.
- Partial output must stay partial by repository, directory, or family.
- Portolan validates and surfaces evaluation records in this slice; it does not
  autonomously score, rank, probe, install, or run candidate producer tools.
