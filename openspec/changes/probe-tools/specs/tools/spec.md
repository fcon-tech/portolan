## Purpose

Defines the probe and receipt tools a Cartographer uses to gather evidence
from the province: text sweeps, symbol lookups, manifest facts, and the
ship's log that receipts every command. Every tool result is anchored and
trust-labeled so it can feed the Chart without a second interpretation step.

## ADDED Requirements

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
