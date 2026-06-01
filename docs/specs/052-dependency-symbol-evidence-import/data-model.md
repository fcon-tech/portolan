# Data Model: Dependency And Symbol Evidence Import

## Evidence Producer Output

- `id`: stable local ID from selection, registry, or derived filename
- `family`: dependency, component, symbol, static-finding, catalog, or runtime
- `producer`: local tool or user-supplied evidence family
- `path`: local source artifact path
- `repository`: optional repository ID or path scope
- `status`: observed, candidate, failed, blocked, cannot_verify, not_assessed
- `evidence_state`: source-visible, metadata-visible, runtime-visible,
  claim-only, unknown, or cannot_verify
- `limitations`: producer or Portolan limitations that constrain claims

## Normalized Relationship Evidence

- `from`: source node ID
- `to`: target node ID
- `kind`: depends-on, imports, owns, references, provides, consumes, observes,
  or producer-specific supported kind
- `evidence_family`: dependency, component, symbol, static-finding, catalog, or
  runtime
- `evidence_state`: Portolan evidence state
- `source_artifact`: local producer output or source file
- `repository_scope`: repository ID, root scope, selected subset, or unknown
- `reason`: required for weak or degraded states

## Relationship Evidence Summary

- `records`: bounded list of evidence-family summaries
- `by_repository`: counts by repository and evidence family
- `by_evidence_state`: counts by Portolan evidence state
- `assessed_claims`: relationship claims with supporting local evidence
- `blocked_claims`: relationship claims that remain not_assessed, unknown, or
  cannot_verify
- `next_evidence`: local producer-output families that would reduce gaps

## Relationship Candidate Record

`portolan context prepare` may surface source-visible relationship candidates
that are useful first-pass navigation targets but are not parsed relationship
claims:

- `id`: stable record ID such as
  `relationship-candidate-<repo>-<family>`
- `kind`: `relationship-candidate`
- `family`: build-manifest, distribution-manifest, rpm-spec, or
  deployment-manifest
- `repository`: discovered repository ID
- `path`: sample local source path for the family
- `count`: bounded count of matching local files
- `evidence_state`: `source-visible`
- `reason`: states that semantic parsing remains `not_assessed`

These records help agents find `pom.xml`, Gradle files, `bigtop.bom`, RPM
specs, Puppet manifests, and compose-style deployment manifests before reading
raw source. They do not prove service topology, runtime behavior, or complete
dependency graphs.

## Evidence State Boundary

- If no dependency, symbol, component, static-analysis, or runtime producer
  output covers a relationship family, the family remains `not_assessed`.
- If a producer output exists but cannot be read, parsed, bounded, trusted, or
  scoped enough for the claimed relationship, the affected producer evidence is
  `cannot_verify`.
- If a producer output records dependencies or symbols but not runtime traffic,
  the relationship evidence is `metadata-visible`; it must not become
  `runtime-visible`.
- If a symbol index records document/symbol ownership only, call relationships
  and semantic correctness remain `not_assessed`.

## Privacy And Local Evidence Boundary

Producer outputs can contain local file paths, package names, symbol names,
registry URLs, hashes, or internal identifiers. This feature imports only local
files selected by the user or agent and writes only local Portolan artifacts.
It does not add network calls, credential access, redaction, or export
behavior. If future public export surfaces include this evidence, privacy and
redaction must be reviewed again.

## Gap Recommendation

- `id`: stable gap identifier
- `relationship_claim`: blocked relationship question or claim family
- `affected_scope`: repositories or root scope
- `current_state`: not_assessed, unknown, cannot_verify, failed, or blocked
- `needed_evidence_family`: dependency, symbol, static-finding, catalog, or
  runtime
- `safe_next_action`: bounded user/agent action that does not run without
  approval

## Legacy Code-Index Alias

`symbol-index` is the primary family name for local symbol/reference producer
evidence in this slice. `code-index` remains a legacy context gap alias for
older agents and ledgers that already looked for `gap-code-index-not-assessed`.
When symbol-index evidence is present, both the primary symbol-index gap and
the legacy code-index alias are suppressed. When symbol-index evidence is
absent, both names may appear so old and new agent instructions preserve the
same weak-state boundary.
