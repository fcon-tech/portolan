# tools Specification

## Purpose
Defines the probe and receipt tools a Cartographer uses to gather evidence
from the province: text sweeps, symbol lookups, manifest facts, and the
ship's log that receipts every command. Every tool result is anchored and
trust-labeled so it can feed the Chart without a second interpretation step.

## Requirements

### Requirement: Sweep returns anchored chunks
The `sweep` tool SHALL search the target for a pattern and return one
anchored chunk per match: file path, line number, the matching text, and
optional surrounding context lines. Sweep results SHALL carry the trust
label `measured`.

#### Scenario: Matches come back anchored
- **WHEN** the Cartographer sweeps for a pattern that occurs in the target
- **THEN** every result carries the file path, the line number of the match,
  the matched text, and the trust label `measured`

#### Scenario: No match is an honest empty result
- **WHEN** the Cartographer sweeps for a pattern that occurs nowhere in the
  target
- **THEN** the tool returns an empty result list and reports no error

#### Scenario: Invalid pattern is rejected
- **WHEN** the Cartographer sweeps with a malformed pattern
- **THEN** the tool returns an error naming the pattern and returns no
  partial results

### Requirement: Symbols are ctags-backed and anchored
The `symbols` tool SHALL return symbol definitions resolved through ctags —
name, kind, file path, line number — and references where they can be
resolved without fabrication. Symbol results SHALL carry the trust label
`measured`. A symbol with no findings SHALL return an empty result, not an
error.

#### Scenario: Definition lookup is anchored
- **WHEN** the Cartographer asks for a symbol that exists in the target
- **THEN** the result names the symbol's kind, file path, and line number,
  and carries the trust label `measured`

#### Scenario: Unknown symbol is empty, not an error
- **WHEN** the Cartographer asks for a symbol that does not exist in the
  target
- **THEN** the tool returns an empty result list without error

#### Scenario: Unresolvable references are reported as absent
- **WHEN** references are requested and they cannot be resolved for a symbol
- **THEN** the result states that references were not resolvable instead of
  returning guessed locations

### Requirement: Manifests yield cheap deterministic facts
The `manifests` tool SHALL extract deterministic facts — component name,
version, declared dependencies — from manifest files (go.mod, pom.xml,
package.json, Cargo.toml, pubspec.yaml) and from no other file kind: manifest
files are the only structural parsing Portolan performs, and general
source-code parsing is forbidden. Manifest facts SHALL carry the trust label
`charted` and an anchor of the manifest file path plus the manifest key.

#### Scenario: Manifest facts are charted and anchored
- **WHEN** the Cartographer reads a supported manifest file
- **THEN** every returned fact carries the manifest file path, the manifest
  key it came from, and the trust label `charted`

#### Scenario: Unsupported manifest is reported, not guessed
- **WHEN** the Cartographer reads a manifest file whose format is not one of
  the supported kinds
- **THEN** the tool reports that file as unsupported and returns no facts
  for it

#### Scenario: Malformed manifest fails loudly
- **WHEN** a supported manifest file cannot be parsed
- **THEN** the tool returns an error naming the file and the parse failure,
  and returns no partial facts

### Requirement: The ship's log receipts every command
The `log.append` operation SHALL append one receipt per executed command —
command identity, scope, and outcome — and assign it a stable receipt id.
The `log.read` operation SHALL return receipts by id or by filter. Receipt
ids SHALL be usable as anchors by chart entries. The log SHALL be
append-only: an existing receipt MUST NOT be altered or removed.

#### Scenario: A command leaves a receipt
- **WHEN** the Cartographer appends a completed command to the ship's log
- **THEN** the log returns a receipt id, and `log.read` with that id returns
  the command identity and outcome

#### Scenario: Receipts anchor chart entries
- **WHEN** a chart entry cites a receipt id as its anchor
- **THEN** `log.read` resolves that id to the stored receipt

#### Scenario: The log is append-only
- **WHEN** an operation attempts to alter or remove an existing receipt
- **THEN** the operation is refused and the stored receipt is unchanged

### Requirement: Probes are read-only toward the source
The `sweep`, `symbols`, and `manifests` tools SHALL NOT create, modify, or
delete any file in the target. The only write any tool in this capability
performs is appending to the ship's log under `<target>/.portolan/`.

#### Scenario: A full probe battery leaves the source untouched
- **WHEN** the Cartographer runs sweeps, symbol lookups, and manifest reads
  across the target
- **THEN** no file outside `<target>/.portolan/` is created or modified

### Requirement: A missing binary fails honestly
When the external binary a tool depends on — ripgrep for `sweep`, ctags for
`symbols` — is not installed, the tool SHALL return an error that names the
missing binary and states that no results were gathered. The tool MUST NOT
fall back to improvised search or fabricate results.

#### Scenario: Missing ctags errors clearly
- **WHEN** `symbols` is invoked and ctags is not installed
- **THEN** the tool returns an error naming ctags and returns no symbol
  results

#### Scenario: Missing ripgrep does not degrade sweep
- **WHEN** `sweep` is invoked and ripgrep is not installed
- **THEN** the tool returns an error naming ripgrep and does not attempt a
  substitute search

### Requirement: Sounding verdicts are deterministic and evidenced
Every sounding SHALL return exactly one verdict — `confirmed`, `refuted`, or
`unconfirmed` — together with the evidence that produced it. Evidence SHALL
be anchored (file path with line range, manifest key, or receipt id), and a
`confirmed` verdict MUST NOT be returned without evidence. Soundings SHALL
be deterministic: against an unchanged target, the same sounding returns the
same verdict and the same evidence, and no model judgment participates in
producing either.

#### Scenario: Repeated soundings agree
- **WHEN** the same sounding runs twice against an unchanged target
- **THEN** both runs return the same verdict and the same evidence

#### Scenario: Confirmed always carries evidence
- **WHEN** a sounding returns `confirmed`
- **THEN** the response includes at least one anchor naming where the
  evidence was found

### Requirement: sound.anchor verifies an anchor resolves
The `sound.anchor` operation SHALL take an anchor as cited by a chart entry
and verify that it resolves: for a file anchor, that the file exists, the
cited line range is within the file, and any cited content is present at
that range; for a manifest-key anchor, that the key exists in the cited
manifest; for a receipt anchor, that the receipt id resolves in the ship's
log. A failure at any step SHALL return `refuted` with what was actually
found.

#### Scenario: A truthful anchor is confirmed
- **WHEN** an anchor cites an existing file, a valid line range, and content
  that is present at that range
- **THEN** the sounding returns `confirmed` with the content found at the
  cited location

#### Scenario: A fabricated file is refuted
- **WHEN** an anchor cites a file that does not exist in the target
- **THEN** the sounding returns `refuted` naming the cited path

#### Scenario: Content drift is refuted
- **WHEN** an anchor cites a valid line range in an existing file but the
  cited content is not what is at that range
- **THEN** the sounding returns `refuted` showing the content actually
  present at the cited range

#### Scenario: An out-of-range line is refuted
- **WHEN** an anchor cites a line range beyond the end of the cited file
- **THEN** the sounding returns `refuted` naming the file and its actual
  length

#### Scenario: A dead receipt is refuted
- **WHEN** an anchor cites a receipt id that resolves to no receipt in the
  ship's log
- **THEN** the sounding returns `refuted` naming the cited receipt id

### Requirement: sound.edge verifies an asserted fairway
The `sound.edge` operation SHALL take an asserted fairway — from one vessel
to another — and verify it through deterministic means: a dependency
declared in the source vessel's manifest, and/or references to the target
vessel found in the source vessel's files. It SHALL return `confirmed` with
the evidence when at least one means finds support, and `unconfirmed` —
reporting what each means found — when neither does. An `unconfirmed`
verdict MUST NOT be presented as proof that the fairway does not exist.

#### Scenario: A manifest-declared fairway is confirmed
- **WHEN** the asserted dependency is declared in the source vessel's
  manifest
- **THEN** the sounding returns `confirmed` citing the manifest file and key

#### Scenario: A source-referenced fairway is confirmed
- **WHEN** the source vessel's manifest is silent but its files reference
  the target vessel
- **THEN** the sounding returns `confirmed` citing the referencing file
  paths and lines

#### Scenario: No deterministic support is unconfirmed, not disproved
- **WHEN** neither the manifest check nor the source-reference check finds
  support for the asserted fairway
- **THEN** the sounding returns `unconfirmed` reporting both negative
  results, without claiming the fairway is absent

### Requirement: Soundings never upgrade the Chart
A sounding SHALL NOT create, modify, or remove any chart entry and SHALL NOT
change any trust label. Acting on a verdict — including any trust upgrade —
is the Cartographer's write through the chart store, never the sounding's.

#### Scenario: A confirmed sounding writes nothing
- **WHEN** a sounding returns `confirmed` against a chart
- **THEN** the chart on disk is byte-identical to its state before the
  sounding ran

#### Scenario: The verdict informs, the Cartographer writes
- **WHEN** a sounding returns `refuted` for an entry's anchor
- **THEN** the entry and its trust label are unchanged by the sounding, and
  any correction is a separate Cartographer write

### Requirement: trust.report aggregates the province's verification state
The `trust.report` tool SHALL return, in one call, the verification summary
of the province: the count of chart entries per trust label, the count per
entry kind, the staleness state (which vessels are pending correction and
how many entries each drags), and a ship's-log summary (total receipts and
the most recent receipt). The report SHALL refresh staleness first, exactly
as `chart.read` does, so the staleness section is never served from a stale
signature. The tool SHALL NOT create, modify, or remove any chart entry,
trust label, or file outside `<target>/.portolan/`.

#### Scenario: The report answers in one call
- **WHEN** the Cartographer calls `trust.report` against a charted province
- **THEN** the response carries the trust-label distribution, the per-kind
  counts, the pending-correction vessels with their entry counts, and the
  ship's-log summary

#### Scenario: The staleness section is fresh
- **WHEN** a vessel's sources changed after the last survey and
  `trust.report` is called
- **THEN** the response reflects the refreshed `pending correction` state,
  identical to what a `chart.read` would have marked

#### Scenario: The report writes nothing but the refresh
- **WHEN** `trust.report` runs against a province whose signatures are
  unchanged
- **THEN** the Chart on disk is byte-identical afterwards, and no file
  outside `<target>/.portolan/` was touched

### Requirement: trust.report re-sounds anchors live
The report SHALL re-verify every chart anchor through the deterministic
`sound.anchor` machinery and state the outcome: how many anchors were
sounded, how many resolved `confirmed`, and how many `refuted` — listing
every refuted anchor with its entry id and the cited anchor. A refuted
anchor SHALL NOT silently change the entry or its trust label; the verdict
informs, the Cartographer writes.

#### Scenario: Every anchor is sounded
- **WHEN** `trust.report` runs against a charted province
- **THEN** every anchor on the chart was sounded and the report states the
  sounded count and the total as equal

#### Scenario: A broken anchor is named, not smoothed over
- **WHEN** an entry's anchor no longer resolves (file moved, content drifted,
  receipt id gone)
- **THEN** the report lists that entry id with the refuted anchor and what
  was actually found, and the entry on disk is unchanged

#### Scenario: Re-running over an unchanged province agrees
- **WHEN** `trust.report` runs twice over an unchanged province
- **THEN** both responses carry the same counts, the same verdicts, and the
  same refuted list in the same order

### Requirement: chart.neighborhood traverses the Chart's fairways
The `chart.neighborhood` tool SHALL return the neighborhood of one vessel:
the fairways touching it out to the requested depth (default 1, at most 3)
in the requested direction (`in`, `out`, or `both`; default `both`), each
edge carrying its id, endpoints, trust label, optional relation, staleness,
and anchors with line numbers, together with the touched vessels (id,
trust, staleness) and each touched vessel's ports of entry. Traversal
SHALL follow charted fairways only and SHALL visit each vessel at most
once, so a dependency cycle cannot recurse. A vessel id that is not on the Chart
SHALL be an honest unsurveyed error, never an empty answer dressed as a
neighborhood.

#### Scenario: A one-hop neighborhood in both directions
- **WHEN** `chart.neighborhood` is called for a vessel holding fairways
  both in and out
- **THEN** the response lists exactly those fairways with their anchors
  and trust labels, and the touched vessels with their ports of entry

#### Scenario: An unknown vessel is an honest error
- **WHEN** `chart.neighborhood` is called with a vessel id absent from the
  Chart
- **THEN** the call errors, stating the vessel is not on the Chart
  (unsurveyed), and returns no edges

#### Scenario: Direction and depth are honored
- **WHEN** the call asks for direction `in` and depth 2
- **THEN** only incoming fairways out to two hops are returned and no
  outgoing edge appears

#### Scenario: A dependency cycle cannot recurse
- **WHEN** the fairway graph contains a cycle reachable from the queried
  vessel
- **THEN** traversal visits each vessel once and terminates

#### Scenario: An invalid request is rejected
- **WHEN** the call passes a direction outside the enum, a depth above the
  cap, or a budget above its cap
- **THEN** the call is rejected, naming the violated parameter and its
  allowed values

### Requirement: Neighborhoods are fan-in ranked and budgeted
The tool SHALL order returned vessels by their direct fan-in — the count
of charted incoming fairways — highest first, and SHALL pack the response
greedily in that order within the budget: at most `maxEdges` edges
(default 40, capped) and at most `maxBytes` of serialized response
(default 32768, capped). The byte budget SHALL govern the whole serialized
response — the edges and the touched-vessel list alike — and when the
assembled response still overflows, the tool SHALL drop vessels from the
tail of that rank order, never the queried vessel, which SHALL stay
present. When the budget cuts the neighborhood, the response SHALL say so
explicitly instead of serving a silent prefix, stating what was cut.

#### Scenario: The hub outranks the leaf
- **WHEN** a neighborhood contains a vessel with fan-in 11 and a vessel
  with fan-in 1
- **THEN** the hub appears before the leaf in the vessel list

#### Scenario: A tight budget truncates loudly
- **WHEN** the neighborhood holds more edges than the budget allows
- **THEN** the response is marked truncated, keeps the fan-in-ranked
  prefix within the budget, and states the dropped edges — and the dropped
  vessels when the touched-vessel list is what overflowed the byte budget

#### Scenario: The budget is measured in records and bytes
- **WHEN** `maxBytes` is set
- **THEN** the serialized response stays within `maxBytes`

### Requirement: Verification is on demand and names refuted edges
By default the tool SHALL serve the Chart's truth as stored — trust labels
and anchors without re-sounding. With `verify: true` it SHALL re-sound
every returned edge's anchors through the deterministic `sound.anchor`
machinery, mark each edge confirmed or refuted, and name every refuted
edge with its refuted anchors. An edge whose anchors cannot be sounded —
including one citing no anchor — does not resolve and is refuted. A
refuted sounding SHALL NOT modify the Chart; the verdict informs, the
Cartographer writes.

#### Scenario: verify=true catches a planted lie
- **WHEN** `verify` is true and one returned edge's anchor no longer
  resolves
- **THEN** that edge is marked refuted and named with the failed anchor,
  the remaining edges stand confirmed, and the Chart on disk is unchanged

#### Scenario: Default serves chart truth with labels
- **WHEN** `verify` is false (the default)
- **THEN** edges carry their stored trust labels and anchors and no
  sounding runs

### Requirement: The neighborhood is read-only and honest about staleness
The tool SHALL NOT create or remove any chart entry and SHALL NOT alter
any entry's content, trust label, or anchors; staleness metadata is
refreshed before serving exactly as `chart.read` refreshes it. The tool
SHALL NOT touch any file outside `<target>/.portolan/`. Each call SHALL append
exactly one receipt to the ship's log — the one write the tools
capability allows any tool — so the adoption record exists without
relying on the Cartographer's diligence. Vessels pending correction SHALL
appear in the response with their staleness flag set — never hidden or
filtered.

#### Scenario: A stale hub is flagged, not hidden
- **WHEN** a vessel in the neighborhood is pending correction
- **THEN** it appears with its stale flag set and its fairways remain
  listed

#### Scenario: The neighborhood writes nothing but its receipt
- **WHEN** `chart.neighborhood` runs against a province whose signatures
  are unchanged
- **THEN** the Chart on disk is byte-identical afterwards, no file
  outside `<target>/.portolan/` was touched, and the only write under
  `<target>/.portolan/` is the appended ship's-log receipt
