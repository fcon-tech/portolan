## 1. Runner scaffold and oracle

- [ ] 1.1 Create the gate-runner entry point under `acceptance/` taking a
      Bigtop checkout path and an answers artifact path, and verify a smoke
      run on a minimal checkout-shaped temp directory refuses a reduced
      stand-in corpus with a clear error
- [ ] 1.2 Implement the narrow BOM reader (name/version/dependency entries
      from `bigtop.bom`) and verify fixture tests extract the planted
      entries and fail loudly on unrecognized structure

## 2. Answer intake and grading

- [ ] 2.1 Implement answers-artifact loading (question id, text, anchors,
      trust label per line) and verify a test grades an answer missing
      either anchor or label as unanswered-and-failing
- [ ] 2.2 Implement machine-check grading for the BOM-derived questions
      (Q1, Q3 manifest side) and verify fixture tests pass a matching
      answer and fail a mismatching one with the expectation named
- [ ] 2.3 Implement expert-judged question handling (Q4 and peers recorded
      with anchors/labels for the Governor, no machine grade) and verify
      the recorded output carries anchors and trust label

## 3. Automatic-fail and honesty gates

- [ ] 3.1 Implement the fabrication gate (sound.anchor over every cited
      anchor; any `refuted` → trial FAIL naming the anchor) and verify a
      fixture with one fabricated anchor fails despite otherwise perfect
      answers
- [ ] 3.2 Implement the unsurveyed-honesty gate (runtime topology and
      deployed versions must be `unsurveyed`; unanchored claims on those
      axes fail) and verify tests pass an honest chart and fail a guessing
      one with the claim named

## 4. Metrics

- [ ] 4.1 Implement fairway completeness (charted fairways vs BOM-derived
      dependency list, missing named) and verify a fixture test reports
      the correct ratio and missing list
- [ ] 4.2 Implement trust distribution (entry count per trust label) and
      verify a fixture chart yields the exact five-way share
- [ ] 4.3 Implement the staleness-flip check (single whitespace-only
      append to one vessel's file, refresh, assert exactly that vessel
      flips, revert in a finally path with before/after hashes recorded)
      and verify a test on a charted fixture flips only the touched vessel
      and restores the file byte-for-byte

## 5. Report and final sign

- [ ] 5.1 Implement the gate-tree verdict (FAIL on any refuted anchor,
      failed machine check, unanswered question, enumerated guess, or
      negative Governor verdict; else PASS) and verify unit tests cover
      each FAIL cause and the all-pass path
- [ ] 5.2 Implement the Governor's-read capture (present the designated
      vessel sheets, prompt for the verdict, record it verbatim) and
      verify a test records the entered verdict as the final gate line
- [ ] 5.3 Emit the trial report at `<target>/.portolan/sea-trial/report.md`
      (per-question grades, three metrics, gate outcomes, Governor's
      verdict, answers-artifact hash) and verify a completed fixture run
      produces a report containing every section
