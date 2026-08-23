# sea-trial Specification

## Purpose
Defines the acceptance gate: how a Portolan expedition is proven against the
real Apache Bigtop corpus — the calibration questions and their machine
checks, the fabricated-anchor automatic fail, the computed metrics, and the
Governor's read as the final sign.

## Requirements

### Requirement: The trial runs against the real corpus with a derived oracle
The gate runner SHALL execute the sea trial against an Apache Bigtop
landscape checkout given at launch, with no intermediate fixture. Every
machine check SHALL derive its expected answers from that checkout's own
BOM and manifests, never from a pre-baked answer sheet.

#### Scenario: Machine checks derive from the checkout
- **WHEN** the runner grades a machine-checked question
- **THEN** the expected answer is computed from the BOM and manifests of
  the surveyed checkout itself

#### Scenario: No fixture shortcut
- **WHEN** the trial is launched
- **THEN** it operates on the named Bigtop checkout's files and Chart, and
  refuses to run against a reduced stand-in corpus

### Requirement: Calibration questions are answered under the answer rules
The runner SHALL pose the calibration questions Q1–Q12 of
acceptance/bigtop-sea-trial.md — covering vessels, fairways, ports of entry
and beacons, lights, dangers, and unsurveyed waters — and SHALL grade each
answer by its machine check where one exists. Every answer SHALL carry at
least one anchor and a trust label; an answer without either SHALL be
graded as unanswered and count against the trial. Questions without a
machine check SHALL be recorded for the Governor's read, not machine-graded.

#### Scenario: A machine-checked answer is verified
- **WHEN** an answer to a machine-checked question is graded
- **THEN** the runner compares it against the BOM-derived expectation and
  records pass or fail for that question

#### Scenario: An expert-judged question is deferred to the Governor
- **WHEN** a question has no machine check
- **THEN** the runner records the answer with its anchors and trust label
  for the Governor's read instead of assigning a machine grade

#### Scenario: An unanchored answer counts against the trial
- **WHEN** an answer arrives without an anchor or without a trust label
- **THEN** the runner grades it as unanswered and reports it as a trial
  failure

### Requirement: A fabricated anchor fails the trial automatically
The runner SHALL sound every anchor cited by every answer. If any sounding
refutes an anchor, the trial SHALL fail as a whole, naming the fabricated
anchor, regardless of the outcome of every other gate.

#### Scenario: One fabrication sinks the trial
- **WHEN** any cited anchor is refuted
- **THEN** the trial result is FAIL naming the fabricated anchor, even
  when all questions and metrics otherwise pass

#### Scenario: A clean fabrication gate
- **WHEN** every cited anchor is confirmed
- **THEN** the fabrication gate passes and the trial outcome is decided by
  the remaining gates

### Requirement: Machine metrics are computed and reported
The runner SHALL compute and report: fairway completeness — the share of
BOM-derived dependencies represented as charted fairways, with the missing
ones listed; the trust distribution across the Chart — the share of entries
per trust label; and the staleness flip — after a single source file
belonging to one vessel is changed, exactly that vessel's entries are
marked `pending correction` and no other vessel's are.

#### Scenario: Fairway completeness is measured against the BOM
- **WHEN** the runner computes fairway completeness
- **THEN** it reports charted fairways against the BOM-derived dependency
  list and names every dependency left uncharted

#### Scenario: Trust distribution is reported per label
- **WHEN** the runner computes the trust distribution
- **THEN** it reports the share of chart entries for each of the five
  trust labels

#### Scenario: One edit flips one sheet
- **WHEN** the runner changes one source file of one vessel and refreshes
  the Chart
- **THEN** exactly that vessel's entries are marked `pending correction`
  and every other vessel's entries are unchanged

### Requirement: Guessing unsurveyed waters fails the trial
The runner SHALL fail the trial when the Chart presents a guess where the
honest label is `unsurveyed` — at minimum real runtime topology and actual
deployed versions. The expedition's unsurveyed answer SHALL be checked for
the expected minimum admissions.

#### Scenario: A guess is caught
- **WHEN** the Chart claims runtime topology or deployed versions without
  anchored evidence
- **THEN** the trial fails, naming the guessed claim

#### Scenario: Honesty is checked, not punished
- **WHEN** the Chart marks runtime topology and deployed versions
  `unsurveyed`
- **THEN** this gate passes and the marking is reported to the Governor

### Requirement: The Governor's read is the final sign
The runner SHALL present the designated vessel sheets for the Governor's
read after all machine gates are evaluated, and SHALL record the
Governor's verdict as the final gate. The trial passes only when the
fabrication gate, all machine checks, all metrics, the unsurveyed-honesty
gate, and the Governor's verdict all pass. The runner SHALL emit a trial
report listing each question's grade, the metrics, the gate outcomes, and
the Governor's verdict, in a form suitable for git review.

#### Scenario: The final sign decides a clean trial
- **WHEN** every machine gate has passed
- **THEN** the runner presents the designated sheets, records the
  Governor's verdict, and the trial passes only on a positive read

#### Scenario: The trial leaves a reviewable report
- **WHEN** the trial completes with any outcome
- **THEN** a report exists listing per-question grades, the three metrics,
  the fabrication-gate outcome, and the Governor's verdict
