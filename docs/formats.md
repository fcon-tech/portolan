# Portolan formats

The four machine formats of a Portolan province. Each is defined by one JSON
Schema file (draft 2020-12) in [`core/schema/`](../core/schema/), and that
file is the single source of the contract. This page is the entry point for
a consumer outside Portolan: the schemas and this page are enough to
validate the data — no knowledge of Portolan's source is required.

Every schema file carries a `version` field and a stable `$id`. The `$id`
is not a function of the version: it never changes when the version does.

## Versioning policy

Semver from `0.1.0`. While the major version is 0:

- a **breaking change** — removing or redefining an existing field — bumps
  the **minor**: `0.1.0` → `0.2.0`;
- an **additive change** — a new optional field — bumps the **patch**:
  `0.1.0` → `0.1.1`.

Declaring `1.0.0` is a separate decision of the Governor, recorded when
made. The version lives only in the schema file; the data files
(`index.jsonl`, `log.jsonl`) carry no format version. Where a format's
documents self-describe, they name the schema version they were produced
against (the adjacency export's `version` field — the only one).

Stability promise: a consumer validating against version `0.1.x` keeps
validating against every `0.1.y`. A minor bump announces a breaking change;
when one lands, this page names the new version and the migration
consequence in the format's section.

## Validation

Any draft-2020-12 validator works. With ajv in its default strict mode, the
registration is:

```js
import Ajv2020 from "ajv/dist/2020";
import trustVocabulary from "./trust-vocabulary.schema.json";
import graphExport from "./graph-export.schema.json";

const ajv = new Ajv2020();
ajv.addKeyword("version");      // the schemas' own version annotation — unknown to strict ajv
ajv.addSchema(trustVocabulary); // $ref'd by $id; register it before compiling
const validate = ajv.compile(graphExport);
validate(document);             // true for a well-formed export
```

The same registration serves every format: register the trust vocabulary,
compile the schema you validate against. The chart entry and the adjacency
export reference the vocabulary by its `$id`
(`https://portolan.dev/core/trust-vocabulary.schema.json`), so both files
must be registered for them; the receipt schema stands alone.

## Chart entry — `chart.schema.json`

- **Purpose:** one entry of the Chart (the Padrón) — a vessel, fairway,
  port of entry, beacon, light, or danger — with at least one anchor and
  exactly one trust label. This is the contract entries are written under.
  Entries as stored in a province's `index.jsonl` additionally carry the
  store's `stale` marker and (vessels) its `signature`; this schema accepts
  them, so every stored entry validates.
- **Schema file:** `core/schema/chart.schema.json`
- **Current version:** `0.1.0`
- **Stability:** the versioning policy above. References the trust
  vocabulary by `$id` — register both files (snippet above).

## Trust vocabulary — `trust-vocabulary.schema.json`

- **Purpose:** the closed vocabulary every chart entry and every exported
  node and edge grades itself with: exactly `measured`, `charted`,
  `reported`, `doubtful`, `unsurveyed`. Single source of the enum — the
  chart entry and adjacency export schemas reference it by `$id`.
- **Schema file:** `core/schema/trust-vocabulary.schema.json`
- **Current version:** `0.1.0`
- **Stability:** the versioning policy above. The label set is closed, and
  consumers rely on the closure: any change to the enum — adding a label
  included — is a breaking change and bumps the minor.

## Ship's-log receipt — `receipt.schema.json`

- **Purpose:** one line of `<target>/.portolan/log.jsonl` — the append-only
  receipt written per executed Portolan command. Fields: a monotonic id
  (`r1`, `r2`, …) citable as a receipt anchor, the command identity, an
  optional scope, the outcome, the ISO recording time, and free-form
  command `meta`.
- **Schema file:** `core/schema/receipt.schema.json`
- **Current version:** `0.1.0`
- **Stability:** the versioning policy above. The schema documents exactly
  what the log writes, so every historical line validates; reshaping an
  existing receipt field is a breaking change and bumps the minor.

## Adjacency graph export — `graph-export.schema.json`

- **Purpose:** the Chart's machine layer in one document, format
  `portolan-adjacency`: every non-fairway entry as a node (the charted
  fields as-is, plus `stale`), every fairway as an edge (from/to, relation
  when charted), each carrying its anchors and trust label un-upgraded. No
  timestamps; nothing appears that has no charted counterpart. Byte-budgeted
  (262 144 bytes): an oversized chart truncates loudly — `truncated` plus
  `omitted`, naming every cut vessel with its cut entry count. The
  document's `version` field names the schema version it was produced
  against.
- **How to obtain:** `portolan export --target <province root>` writes the
  document to stdout; the same document is served by the `chart.export`
  MCP tool. No server is needed.
- **Schema file:** `core/schema/graph-export.schema.json`
- **Current version:** `0.1.0`
- **Stability:** the versioning policy above. References the trust
  vocabulary by `$id` — register both files (snippet above).
