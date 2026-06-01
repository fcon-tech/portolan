# Research: Relationship Detection

## Scope From Bigtop Smoke

Decision: Implement the first relationship detector as local artifact
normalization for explicit source and manifest relationships, not as a broad
service-topology inference engine.

Rationale: `GAP-007-003` showed that current Bigtop output lacks richer
relationship evidence. The safe first step is to detect relationships that are
directly visible in local files and keep unsupported relationship families
explicitly out of scope.

Alternatives considered: Inferring service dependencies from names,
directories, or package labels was rejected because it would violate evidence
state honesty. Building a whole-codebase intelligence engine was rejected
because Portolan should complement mature tools.

## Existing Open Source And Patterns

Decision: Use Go parser libraries for the first slice: standard-library
`go/parser`/`go/ast` for imports and `golang.org/x/mod/modfile` for `go.mod`
manifests.

Rationale: The immediate fixture need is source import edges and manifest
dependency edges in local Go projects. Adding tree-sitter, Semgrep, or
language-server dependencies would add integration and maintenance cost before
Bigtop proves that need. `golang.org/x/mod/modfile` is the mature Go module
manifest parser, avoids fragile custom parsing, is maintained with the Go
toolchain ecosystem, has low runtime privacy risk because it parses local bytes
only, and has manageable integration cost.

Alternatives considered:

- Tree-sitter: strong multi-language parsing, but higher integration cost and
  grammar management. Deferred until multiple languages require AST parsing.
- Semgrep-style rules: useful for pattern-based relationships, but premature
  for source imports and module manifests.
- Custom `go.mod` text scanning: less code in `go.mod`, but rejected because it
  would diverge from Go manifest syntax and recreate a mature parser.
- Sourcegraph/LSIF-style indexes: powerful but out of scope for local-first v1.

## Evidence Semantics

Decision: Emit source import relationships as `source-visible`, manifest
dependencies as `metadata-visible`, existing claim relationships as
`claim-only`, and unsupported relationship families as `not_assessed` findings
rather than clean results.

Rationale: The graph schema already supports `imports` and `depends-on` edge
kinds. Map findings already support `relationships`, so the first slice can
replace the placeholder relationship finding with observed relationship counts
only when evidence exists.

Alternatives considered: Collapsing manifest dependencies into source-visible
evidence was rejected because `go.mod` is metadata, not observed source imports.

## Integration Surface

Decision: Integrate relationship detection into `portolan map --root --out`
first, while keeping `scan --selection` relationship behavior unchanged except
for preserving existing metadata and claim edges.

Rationale: Spec 009 created the agent-facing artifact bundle and currently
emits a `relationships` placeholder finding. Updating map output gives agents a
machine-readable relationship surface without changing selection schemas or
adding new commands.

Alternatives considered: Adding a new `portolan relationships` command was
rejected because it would fragment the one-command agent workflow.
