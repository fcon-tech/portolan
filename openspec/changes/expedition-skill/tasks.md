## 1. Skill scaffold

- [x] 1.1 Create the skill content under `skill/` (one method document in
      harness-portable markdown using the locked glossary) and verify a
      review against docs/MANIFEST.md finds no synonym terms and no
      command text addressed to the Governor
- [x] 1.2 Add the Sailing Directions template (top findings with anchors +
      trust labels, Chart location, unsurveyed list) and verify a filled
      example from a fixture target exhibits every required section

## 2. First-run flow

- [x] 2.1 Write the launch section (install skill + MCP server into the
      harness, then proceed unaided) and verify a dry run on a sandbox
      harness completes install without any Governor-copied command
- [x] 2.2 Write the single-approval section (one message covering network
      + tool installation; builds/tests unasked but receipted) and verify a
      dry run shows exactly one approval prompt and a ship's log receipt
      per executed build/test command
- [x] 2.3 Write the perimeter section (writes only under
      `<target>/.portolan/`; never mutate source) and verify a full dry-run
      expedition on a temp target leaves the source tree byte-identical
      (snapshot compare)

## 3. Survey method

- [x] 3.1 Write the five-pass method (vessels from manifests/entry points →
      fairways → ports of entry and beacons → lights → dangers, each pass
      writing entries as it goes) and verify a guided dry run on a small
      fixture produces chart entries per pass in the taught order
- [x] 3.2 Write the interruption guidance (stop anywhere; what stands stays
      charted; the rest `unsurveyed`) and verify a dry run aborted after
      the fairways pass leaves a valid partial Chart with `unsurveyed`
      elsewhere
- [x] 3.3 Write the honesty section (runtime topology, deployed versions,
      and run-time-only behavior are `unsurveyed`; no guessing under
      stronger labels) and verify the fixture dry run's Chart marks those
      aspects `unsurveyed`

## 4. Verify loop and corrections

- [x] 4.1 Write the assert → sound → write-with-verdict loop (sound.edge
      per fairway, sound.anchor per cited anchor; `refuted` forces
      correction or `doubtful`) and verify a dry run on a fixture with a
      planted drift corrects or downgrades the entry in the same run
- [x] 4.2 Write the later-expedition section (start from the Chart, repair
      `pending correction`, report Notices to Mariners, never redraw) and
      verify a second dry run after a source edit repairs only the stale
      entries and emits notices

## 5. Brief delivery

- [x] 5.1 Write the closing step (deliver Sailing Directions in
      conversation and archive at `<target>/.portolan/sailing-directions.md`)
      and verify a completed dry run produces both copies with every
      finding anchored and labeled
- [x] 5.2 Add the unanchored-claim rule to the template guidance (exclude
      or label `unsurveyed`; never present as established) and verify a
      review of the fixture brief finds zero claims lacking anchor + label
