# pointer Specification

## Purpose
The Pointer is the marker-delimited block the province's `AGENTS.md` carries
between `<!-- portolan:harbor:begin -->` and `<!-- portolan:harbor:end -->`:
the one generated text surface Portolan ships. It points at the Chart's
tools — it never summarizes the codebase — because instructions are the one
channel agents demonstrably obey and passive overviews rot. This capability
owns the block's single template, its format version, its CLI surfaces, the
expedition lifecycle that keeps it current, and the honest status line that
reports its state.

## Requirements

### Requirement: One template owns the Pointer's text
The Pointer's text SHALL have exactly one source: a core module exporting
the rendered block, the format name `portolan-pointer`, and the current
format version. The skill name inside the block SHALL be derived from the
skill file's frontmatter at render time, not hardcoded. The opencode
installer and the `portolan pointer` command SHALL render byte-identical
blocks from that source. The block SHALL carry its format version on a
dedicated version line, and the version SHALL be the format version — never
the package version, so a package release never stales a single province.

#### Scenario: Installer and command render the same bytes
- **WHEN** the installer writes the block and `portolan pointer` prints it
  in the same province
- **THEN** the written block and the printed block are byte-identical

#### Scenario: A package release does not stale the Pointer
- **WHEN** the package version is bumped with no format change
- **THEN** the rendered block, including its version line, is unchanged

### Requirement: The Pointer is obtainable and installable without the MCP server
`portolan pointer` SHALL print the rendered block to stdout — the same core
function the installer uses, and no ship's-log receipt, per CLI discipline.
`portolan install --target <province root>` SHALL route to the harness
installer (opencode first) exactly as the `chartroom` and `harbor`
subcommands route to theirs. The installer SHALL keep its idempotent
behavior: an existing block between the markers is replaced wholesale, an
orphaned or misordered marker set is cleaned, and a file without the block
gains one appended block — the rest of the file byte-identical.

#### Scenario: A visitor prints the block and places it
- **WHEN** `portolan pointer` runs (it takes no arguments; the block is
  target-independent)
- **THEN** the block is printed in full and the ship's log is untouched

#### Scenario: Install is the one command a new harness needs
- **WHEN** an agent in a charted province runs `portolan install --target .`
  with the one approval
- **THEN** the harness installer runs — server registration, skill copy,
  Pointer placement — and reports what it did

#### Scenario: Reinstall rewrites a hand-edited block
- **WHEN** the block between the markers was hand-edited and the installer
  runs again
- **THEN** the block is replaced wholesale with the current template and the
  text outside the markers is byte-identical to before

### Requirement: The expedition keeps the Pointer current
The skill SHALL mandate a Pointer step in the expedition's close-out: read
`<target>/AGENTS.md` and compare the block against the current render —
both the version line and the bytes. A block at the current version whose
bytes match the render SHALL be left alone and unmentioned. A stale block —
its version behind, or its text diverging from the current render — SHALL
be replaced with the fresh block, and a missing block in an existing
`AGENTS.md` SHALL be appended, each with a receipt in the ship's log naming
the command `pointer install`, the versions found and set, and the file. A
charted province with no `AGENTS.md` reports `missing` and is left to
install: the close-out never creates a top-level file. No other edit to
`AGENTS.md` is ever made by an expedition.

#### Scenario: A current block buys silence
- **WHEN** the close-out Pointer step finds the block at the current format
  version with bytes matching the current render
- **THEN** the expedition says nothing about the Pointer, writes nothing,
  and appends no receipt

#### Scenario: A stale block is refreshed and receipted
- **WHEN** the step finds a block whose version line is behind the current
  format version, or whose text diverges from the current render
- **THEN** the block is replaced with the fresh one and a `pointer install`
  receipt names the found version, the set version, and the file

#### Scenario: A hand-edit with an intact version line is still stale
- **WHEN** the block's version line names the current format version but
  its text was edited away from the current render
- **THEN** the step treats it as stale, replaces it wholesale, and receipts
  the refresh

#### Scenario: A missing block is appended and receipted
- **WHEN** the step finds no block between the markers (or no markers) in an
  existing `AGENTS.md`
- **THEN** the fresh block is appended after cleaning any stray markers, and
  a `pointer install` receipt records it

### Requirement: The Pointer status is a reported fact
`trust.report` SHALL include the Pointer status in its summary, and
`expeditions.propose` SHALL include the same status in its output: exactly
one of `current` (the version), `stale` (the found version, when parseable,
and the current one), `missing`, `unparseable` (markers present but no
parsable block between them), or `unreadable` (with the reason). A block is
stale when its version is behind the current format version or its text
diverges from the current render. An `AGENTS.md` that cannot be read
through the province's read perimeter — an escaping symlink, a non-regular
file, an unreadable or oversized file — reports `unreadable` and is never
read past the refusal; the status still blocks nothing. Determining the
status SHALL read `<target>/AGENTS.md` and nothing else, SHALL write
nothing, and the status SHALL never become a queue input or block any
operation — the close-out step is the repair path, not the harbor queue.

#### Scenario: Both surfaces agree
- **WHEN** `trust.report` and `expeditions.propose` run against the same
  province in the same state
- **THEN** both report the same Pointer status with the same version facts

#### Scenario: A stale Pointer proposes nothing
- **WHEN** the Pointer block is stale or missing and the queue is computed
- **THEN** the queue gains no proposal for it, and the status line still
  reports the state

#### Scenario: The status check writes nothing
- **WHEN** either surface computes the Pointer status
- **THEN** the computation itself performs no write, and
  `<target>/AGENTS.md` is byte-identical afterwards

#### Scenario: An unparseable block is named, not guessed
- **WHEN** the markers are present but the text between them carries no
  parsable version line
- **THEN** both surfaces report `unparseable` instead of inventing a
  version

#### Scenario: An unreadable AGENTS.md is a fact, not a crash
- **WHEN** `<target>/AGENTS.md` is an in-target symlink escaping the target, or cannot be read as a regular file
- **THEN** both surfaces report `unreadable` with the reason, and no byte outside the target is read

### Requirement: The block mandates; it never describes
The block SHALL consist of actionable mandates and nothing else: call
`expeditions.propose` at session start; present a non-empty queue in one
message and ask for a one-phrase decision recorded with `expeditions.decide`;
answer landscape questions from the Chart citing anchors and trust labels;
call `chart.neighborhood` before a task touching more than one file or
vessel; modify nothing outside `.portolan/`, this block's own refresh
excepted; name the skill as the full method; and give a visitor without the
tools the install command in its runnable form (`bunx --package
@fcon-tech/portolan portolan install --target .`). The block SHALL NOT
describe, summarize, or assess the target codebase. `AGENTS.md` SHALL be
the only file the Pointer occupies — no CLAUDE.md copy, no symlinks.

#### Scenario: Every line mandates
- **WHEN** the block's lines are read
- **THEN** each names a tool to call, a boundary to hold, the location of
  the full method, or the install path — and no line describes what the
  codebase contains

#### Scenario: The front door works for an uninstrumented visitor
- **WHEN** an agent with no Portolan installed reads the block
- **THEN** the block tells it the one runnable command — the `bunx` launch
  line — that installs the server, the skill, and the Pointer itself
