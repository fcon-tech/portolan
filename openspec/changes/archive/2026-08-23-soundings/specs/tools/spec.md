## ADDED Requirements

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
