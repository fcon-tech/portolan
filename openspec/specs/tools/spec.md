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
