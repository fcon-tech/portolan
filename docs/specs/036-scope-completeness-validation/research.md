# Research: Scope Completeness Validation

## Decision: Use Existing Corpus Manifest As Local Inventory

Portolan already has `selection.corpus_manifest`, `require_full_corpus`,
`coverage.json`, and a corpus manifest schema. Reusing that path is smaller and
more coherent than creating `--inventory` or a second JSON format.

Rejected alternatives:

- Add a new `portolan scope validate` command. Rejected because it would create
  a second coverage truth source before the current map bundle contract is
  exhausted.
- Infer completeness from root discovery counts. Rejected because repository
  count is not estate coverage evidence.
- Add an OSS scanner. Rejected because scanners can discover local files but do
  not know the expected inherited estate.

Reversibility: high. The change is isolated to coverage classification and
schema/docs language.

Risk if wrong: users may need a friendlier inventory alias later, but the
underlying manifest comparison remains useful.

Confidence: high.

## Decision: Represent Selected-But-Unexpected Targets As `extra`

Expected inventory items can already become `visible`, `represented`,
`missing`, or `blocked`. The missing status is the inverse case: a local target
is selected or discovered but absent from the inventory. That should be called
`extra` instead of hidden inside counts.

Rejected alternatives:

- Mark unexpected targets as `unknown`. Rejected because the local repository is
  visible; what is unknown is its estate membership.
- Mark unexpected targets as `cannot_verify`. Rejected because the mismatch is
  verifiable from local manifest comparison.

Reversibility: medium. `extra` becomes a schema-visible status.

Risk if wrong: downstream consumers may need to accept one new coverage status.

Confidence: high.
