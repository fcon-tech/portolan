# Feature Specification: Evidence Promotion and Stratified Atlas Contract (109)

**Status**: Draft PR #73 open on branch
`codex/109-evidence-promotion-stratified-atlas`; local implementation verified,
independent PR review not assessed, GitHub Baseline pending, merge not ready.

**Input**: Research synthesis
`/home/fall_out_bug/projects/sdp/portolan-lab/research/evidence-promotion-stratification-2026-06-22/final-report.md`
and the current Portolan product boundary.

## Product Goal

Portolan must let a human or coding agent explore an enterprise software
landscape without confusing raw scanner output, source files, promoted facts,
findings, LLM claims, and unknowns.

The feature defines the product contract for a stratified atlas:

1. Raw producer outputs stay addressable and reproducible.
2. Source files are classified before they influence atlas facts.
3. Facts are promoted only from evidence layers that justify that fact kind.
4. Findings explain why something is a problem, including evidence health.
5. Claims from agents remain `claim-only` unless imported through existing
   claim validation rules, and they are never raised to source truth.
6. Unsupported or not-yet-integrated evidence families are visible as
   `not_integrated`, not silently absent.

This is a full product capability contract. Individual implementation PRs may
land in coherent slices, but they must keep every unsupported evidence family
explicitly marked and must not call the capability complete while only one
producer family is covered.

## Scope Integrity

The contract applies to every Portolan evidence family:

| Family ID | Meaning |
| --- | --- |
| `source_code` | Local source files and file inventory. |
| `documentation` | Human-authored or generated documentation. |
| `build_metadata` | Build manifests, module manifests, lockfiles, and build-system metadata. |
| `dependency_metadata` | SBOMs, dependency reports, and package/component metadata. |
| `configuration` | Env vars, ports, flags, app config, and secret-reference surfaces. |
| `deployment_model` | Compose, Helm, Kubernetes, Terraform, and desired-state deployment files. |
| `ci_cd` | CI/CD and release workflow definitions. |
| `runtime_observation` | Local runtime exports supplied to Portolan as artifacts. |
| `catalog_descriptor` | Backstage, OpenAPI, AsyncAPI, protobuf, service catalogs, and API descriptors. |
| `duplication` | jscpd/CPD-style duplicate and near-clone outputs. |
| `static_analysis` | Semgrep, CodeQL SARIF, Joern, ast-grep, and similar analysis outputs. |
| `search_index` | Text/search indexes used for retrieval and preview. |
| `symbol_index` | Broad symbol outputs such as ctags and ast-index imports. |
| `semantic_index` | Precise LSIF/SCIP/CodeQL/Kythe/Glean-style facts when supplied safely. |
| `analysis_claim` | Agent or human-authored claims imported through claim validation. |

`ctags`, Bigtop, Node bundles, and catalog descriptors are regression fixtures,
not the scope boundary.

Every bundle manifest must include one `promotion_health` record for every
canonical family id. Each record must resolve to one of:

- implemented producer/importer output;
- `not_assessed` because the route exists but no input was supplied or no
  approved producer was run;
- `cannot_verify` because input exists but a specific relationship or fact
  cannot be resolved;
- `not_integrated` because this Portolan version has no implemented route for
  the family.

Any implementation slice that supports only one family is allowed only if it:

- publishes `not_integrated` health for other families that the bundle contract
  names;
- keeps unsupported families out of promoted architecture facts;
- shows the limitation in bundle query and viewer surfaces;
- preserves raw evidence references so future producers can be integrated
  without changing the product semantics.

Spec 109 completion is stricter than slice compliance. The synthetic acceptance
fixture must prove a non-stub integration route for every canonical family:

- representative fixture input exists for the family;
- the implementation reads that input through a real importer, producer output
  normalizer, or classifier route, not a hardcoded health row;
- the route emits at least one expected stratum record or a deterministic
  terminal state defined by this spec;
- the health record includes `producer_ref` and fixture evidence refs;
- no canonical family is left as `not_integrated`.

In real target runs, a family may still be `not_assessed`, `cannot_verify`,
`partial`, `raw_available_only`, or degraded by health when the evidence route
exists but the target or approved run does not provide enough input.

## Non-Goals

- Build a native Go semantic indexer for JavaScript, TypeScript, JVM, Python, or
  other languages.
- Replace mature scanners such as SCIP, CodeQL, Semgrep, Joern, jscpd, Syft, or
  ctags.
- Bundle raw producer artifacts by default.
- Treat vector search, symbol volume, or LLM summaries as architecture truth.
- Generate prebuilt answer packs.
- Become an enterprise service catalog, observability product, readiness gate,
  or coding harness.
- Start services, mutate target repositories, infer secrets, or contact vendor
  APIs by default.

## Evidence Strata

Portolan must distinguish these strata in machine-readable artifacts and in the
viewer:

| Stratum | Meaning | May Promote To Atlas Truth |
| --- | --- | --- |
| `raw_evidence` | Original or normalized tool output, file listing, runtime export, or descriptor. | No. It is only input. |
| `classified_source` | A file/path/artifact role with confidence and classifier evidence. | No. It gates promotion. |
| `promoted_fact` | A fact whose evidence layer supports the specific fact kind. | Yes, within stated limits. |
| `finding` | A ranked issue or opportunity derived from facts and health signals. | No. It explains risk or action. |
| `claim` | Agent or human-authored interpretation. | No. It remains `claim-only`. |
| `promotion_health` | Coverage, pollution, freshness, and integration state. | No. It qualifies everything else. |

`stratum`, `evidence_layer`, and `evidence_state` are separate fields:

- `stratum` identifies the record's lifecycle category from the table above.
- `evidence_layer` identifies the source category used for promotion:
  `source`, `metadata`, `runtime`, `claim`, or `unknown`.
- `evidence_state` keeps the existing Portolan visibility vocabulary:
  `source-visible`, `metadata-visible`, `runtime-visible`, `claim-only`,
  `unknown`, `cannot_verify`, and `not_assessed`.

A `promoted_fact` therefore says both what kind of record it is (`stratum`) and
what kind of evidence made the fact visible (`evidence_layer` and
`evidence_state`).

## Source Role Taxonomy

The initial role vocabulary must cover at least:

- `runtime_product_code`
- `test_code`
- `test_artifact`
- `fixture_data`
- `generated_code`
- `vendor_code`
- `documentation`
- `configuration`
- `deployment_model`
- `build_metadata`
- `ci_cd`
- `secret_reference_surface`
- `runtime_observation`
- `catalog_descriptor`
- `unknown_role`

Roles must carry `confidence`, `classifier`, and `evidence_refs`. A low
confidence role may still be searchable, but it must not silently promote
architecture facts.

## Health Vocabulary

`promotion_health` is separate from `evidence_state`. It qualifies whether a
producer family, repository, or whole bundle can be trusted for a fact kind.

The required health statuses are:

- `ok`
- `partial`
- `non_exhaustive`
- `oversized`
- `dominated_by_fixture_data`
- `polluted_by_non_source`
- `stale`
- `inventory_mismatch`
- `raw_available_only`
- `unsupported_language`
- `not_integrated`
- `cannot_verify`

Health records must include affected family, scope, reason, observed count,
denominator when applicable, threshold when applicable, calculation rule, and
next action.

Default threshold-derived statuses are:

| Status | Default Rule |
| --- | --- |
| `polluted_by_non_source` | Non-promotable source roles exceed 50 percent of rows or files in the affected family/scope. |
| `dominated_by_fixture_data` | `fixture_data` plus `test_artifact` exceed 35 percent of rows or files in the affected family/scope. |
| `oversized` | One raw artifact is at least 100 MiB, or a raw family total is at least 500 MiB in strict core mode. |
| `stale` | A raw artifact or index is older than the source snapshot or declared scan timestamp. If source freshness cannot be compared, emit `unknown` freshness, not `stale`. |
| `inventory_mismatch` | Let `mismatch_count = abs(discovered_file_count - classified_file_count)` and `threshold_count = max(1, min(ceil(discovered_file_count * 0.01), 100))`. Trigger when `mismatch_count > threshold_count`. Synthetic fixtures must use zero tolerance. |
| `non_exhaustive` | A producer reports timeout, truncation, shard failure, omitted scope, or low classifier coverage. |
| `raw_available_only` | Raw input exists and is addressable, but no promotion route exists for the requested fact kind. |

If `unknown_role` or classification confidence below 0.5 covers more than 10
percent of candidate files in a scope, the classifier emits `non_exhaustive`
health for that scope.

## Status Decision Rules

- `not_integrated`: Portolan has no implemented ingestion, classification,
  promotion, query, or viewer route for a canonical family in this code version.
  This is allowed in interim slices but blocks spec 109 completion.
- `not_assessed`: the route exists, but no input was supplied, no approved
  producer was run, or the query asks for an optional expansion that is absent.
- `cannot_verify`: input exists, but Portolan cannot resolve the specific
  relationship, fact, artifact, or cited ref.
- `unknown`: input exists, but the observed value cannot be classified with the
  current rules.

## Promotion Matrix

The product contract must encode at least this promotion matrix:

| Family | Evidence Layer | Eligible Promoted Fact Kinds | Limits |
| --- | --- | --- | --- |
| `source_code` | `source` | file inventory, source role, definition when backed by symbol output | No references, behavior, ownership, or runtime topology from file presence alone. |
| `symbol_index` | `metadata` | definition and broad symbol presence | Definition-only unless the producer contract supplies resolved references. |
| `semantic_index` | `metadata` | definition, reference, call, typed dependency | Only when the supplied producer contract proves those fact kinds and was acquired read-only or approval-gated. |
| `search_index` | `metadata` | retrieval route and preview availability | Not architecture truth. |
| `documentation` | `metadata` | documented intent, surface description | `metadata-visible` unless cross-checked by source/runtime; generated docs inherit source role limits. |
| `build_metadata` | `metadata` | declared modules and build relationships | Declared metadata only; no runtime topology. |
| `dependency_metadata` | `metadata` | package/component/dependency facts | Dependency evidence only; no service relationship unless resolved locally. |
| `configuration` | `metadata` | config surface, env var name, port declaration, secret reference name | Never expose secret values; no runtime proof. |
| `deployment_model` | `metadata` | desired-state service/resource/model facts | `metadata-visible`; no runtime proof. |
| `ci_cd` | `metadata` | workflow and release surface facts | Declared workflow only. |
| `runtime_observation` | `runtime` | observed runtime service/resource/edge facts | `runtime-visible` only for observed artifacts. |
| `catalog_descriptor` | `metadata` | declared service/API/catalog facts | Unresolved relations are `cannot_verify`. |
| `duplication` | `metadata` | duplication finding and duplicate cluster | Not architecture ownership or dependency truth. |
| `static_analysis` | `metadata` | static-analysis finding | Semantic fact only when the producer contract explicitly supplies that fact kind. |
| `analysis_claim` | `claim` | claim record | Always `claim-only`; never promotes facts from statement text alone. |

## Functional Requirements

- **FR-001**: The bundle contract must expose source-role records or an
  equivalent index for every path that influences promotion.
- **FR-002**: Every promoted fact must include `fact_kind`, `evidence_state`,
  `evidence_layer`, `source_refs`, `producer`, `producer_ref`,
  `promotion_basis`, and `resolution_limit`.
- **FR-003**: Raw producer outputs must be represented by lazy artifact
  references: path, size, content hash when available, producer version,
  command or recipe id when available, and expansion mode.
- **FR-004**: Bundle manifests must expose promotion health by bundle, repo,
  evidence family, and fact kind.
- **FR-005**: Query surfaces must return stratum and health information before
  returning large raw rows.
- **FR-006**: Viewer first screen must show target identity, repo coverage,
  health summary, oversize/pollution/staleness warnings, and unsupported
  evidence families before hotspot volume.
- **FR-007**: Hotspot and finding ranking must not reward raw symbol volume,
  fixture volume, generated files, or vendor copies as product importance.
- **FR-008**: Catalog descriptors are `metadata-visible`; unresolved descriptor
  relationships are `cannot_verify`, not architecture truth.
- **FR-009**: Static-analysis findings remain findings. They become semantic
  facts only when their producer contract explicitly provides that fact kind.
- **FR-010**: LLM-authored analysis remains `claim-only` and must continue to
  use cited refs validated by `import-analysis-claims.sh`.
- **FR-011**: Unsupported evidence families must appear as `not_integrated`
  health in manifest, query, and viewer outputs when the product contract names
  them.
- **FR-012**: The implementation must keep local-first and read-only defaults.
  Any tool recipe that may mutate targets, install dependencies, contact a
  network, or start runtime services requires explicit approval text and must
  not run by default.
- **FR-013**: Large bundles must support strict core mode in which raw producer
  artifacts are addressable but not embedded by default.
- **FR-014**: Inventory discrepancies between discovered source files and
  bundle/indexed files must be visible as health, even when `gap_count` is zero.
- **FR-015**: Validation must fail if any canonical evidence family is missing
  from bundle health.
- **FR-016**: Spec completion validation must fail if the synthetic acceptance
  fixture leaves any canonical family as `not_integrated`, or if a family lacks
  non-stub route proof tied to representative fixture input and `producer_ref`.

## BDD Acceptance Scenarios

### Scenario: raw scanner rows do not become atlas truth

Given a bundle contains millions of raw symbol rows
And more than 50 percent of those rows come from test artifacts, generated files,
fixtures, configs, or vendor copies
When Portolan builds atlas facts
Then raw symbol volume is recorded as `raw_evidence`
And affected repositories receive `polluted_by_non_source` health
And the health record includes observed count, denominator, and the 50 percent
threshold
And every promoted architecture fact cites an eligible source role.

### Scenario: ctags definition-only output is useful but bounded

Given ctags emits a symbol for a runtime product source file
When the symbol is normalized
Then the symbol may support a `definition` fact
And the fact states `resolution_limit: definition-only; not a full call graph`
And no promoted fact with `fact_kind` `reference`, `call`, `runtime_topology`,
`ownership`, or `behavior` is emitted from that ctags row.

### Scenario: fixtures cannot dominate product risk

Given a repository contains large JSON fixtures and generated test data
When hotspots and facts are ranked
Then fixture rows may remain searchable
But they do not rank as product architecture hotspots solely by count
And the repository health reports `dominated_by_fixture_data` when fixture and
test-artifact rows exceed the 35 percent threshold.

### Scenario: catalog descriptor import is metadata-visible

Given a Backstage, OpenAPI, AsyncAPI, Compose, Helm, Terraform, or similar
descriptor is imported
When the descriptor references another service that cannot be resolved locally
Then the descriptor itself is `metadata-visible`
And the unresolved relationship is `cannot_verify`
And the viewer shows the unresolved edge as a gap, not as a confirmed link.

### Scenario: LLM analysis stays in the claim stratum

Given an agent writes an architectural interpretation with cited bundle refs
When the claim importer accepts it
Then the record has `evidence_state: claim-only`
And query and viewer surfaces label it as a claim
And no promoted fact is created from the statement text alone.

### Scenario: missing evidence family remains visible

Given the product contract names runtime observations and semantic indexes
And the current bundle has no runtime export and no semantic index output
When a human opens the viewer or an agent queries the bundle
Then a family with an implemented route and no supplied input is listed as
`not_assessed`
And a family with no implemented route is listed as `not_integrated`
And Portolan does not present the atlas as complete.

### Scenario: lazy raw artifacts protect bundle size without hiding provenance

Given a raw producer artifact is at least 100 MiB
When strict core bundle mode is used
Then the core bundle stores locator, size, hash when available, producer, and
recipe metadata
And the artifact `expansion_mode` is one of `core`, `expanded`, `external`, or
`missing`
And queries against a never-produced optional artifact return `not_assessed`
And queries against a manifest-declared but missing artifact return
`cannot_verify`.

### Scenario: health can fail even when gaps are zero

Given all configured producers completed successfully
And `gap_count` is zero
But inventory coverage is incomplete or stale
When Portolan builds the health summary
Then bundle health is degraded
And the first screen explains why completed producers are insufficient.

### Scenario: agent query sees strata before raw rows

Given a bundle contains raw symbol rows and promoted facts
When an agent calls bundle-query or MCP for a path, repo, or fact
Then the response includes `stratum`, `evidence_layer`, `evidence_state`,
`promotion_basis`, and related `promotion_health`
And raw rows are returned only after bounded summary and health metadata.

### Scenario: implementation slices cannot claim full capability

Given an implementation PR only handles ctags source-role classification
When the PR updates documentation or acceptance evidence
Then it must say other families are `not_integrated`
And it must not mark spec 109 complete
And the spec completion validation fails while any synthetic fixture family
remains `not_integrated` or lacks non-stub route proof
And reviewers must treat a claim of full stratified atlas support as a
requirements mismatch.

## Product Acceptance Data

The acceptance suite must include:

- a Bigtop full-corpus or current Bigtop regression bundle with symbol-index
  pollution and fixture dominance visible as health;
- a Node or JavaScript/TypeScript bundle where large raw artifacts are lazy by
  default and not solved by disabling the producer;
- a small synthetic fixture that covers catalog descriptors, claims, generated
  files, vendor files, runtime observations, and unsupported evidence families;
- negative examples for broken claim refs, unresolved descriptor relations,
  stale raw artifacts, and inventory mismatch.

The research data that motivated this spec remains regression evidence:

- Bigtop symbol index: 3,019,203 rows with approximately 69 percent non-source
  rows and approximately 41 percent test fixture rows.
- Strict core bundle experiment: approximately 1.3 MB core representation
  versus approximately 1.8 GB input payload, with raw symbol artifacts kept
  lazy.
- Existing descriptor import path: synthetic descriptors parse, but real
  descriptors may be absent and unresolved relations remain `cannot_verify`.

## Success Criteria

- Humans can tell from the viewer whether the atlas is healthy before reading
  hotspots.
- Agents can query why a fact was promoted, which raw artifact supports it, and
  what limitations remain.
- Large raw artifacts remain reproducible and addressable without bloating the
  default bundle.
- Unsupported families are explicit and testable as `not_integrated`.
- A polluted or stale bundle cannot look complete solely because producers
  emitted many rows or no gaps.

## Decisions

- **Decision**: Define stratification as a product contract across all evidence
  families, not as a ctags cleanup.
  **Rejected**: a narrow symbol-index health patch.
  **Why now**: research showed bundle size, source-role pollution, viewer health,
  and producer semantics are the same product problem.
  **Reversibility**: medium; vocabulary can evolve, but artifacts will depend on
  the strata.
  **Risk if wrong**: Portolan keeps generating impressive but misleading maps.
  **Confidence**: high.

- **Decision**: Use `not_integrated` as promotion health, not as an
  `evidence_state`.
  **Rejected**: extending evidence states for integration status.
  **Why now**: evidence visibility and product integration are different facts.
  **Reversibility**: high if later schemas need a shared enum.
  **Risk if wrong**: query/viewer UX may need migration.
  **Confidence**: medium.

- **Decision**: Keep raw artifacts lazy by default.
  **Rejected**: disabling large producers or truncating raw rows as the primary
  solution.
  **Why now**: the Node bundle problem is a representation and retrieval problem,
  not proof that the evidence is worthless.
  **Reversibility**: medium.
  **Risk if wrong**: strict bundles may hide useful drill-down until expansion
  workflows mature.
  **Confidence**: high.
