# Sailing Directions — \<target\>

<!-- The Cartographer's brief to the Governor. Fill every section; deliver in
     the conversation and archive at <target>/.portolan/sailing-directions.md.
     Rules: every finding carries its anchors, its trust label, and where it
     lives on the Chart; a finding that cannot be anchored is excluded or
     labeled `unsurveyed`, never presented as an established fact. -->

Expedition \<date\> · Cartographer: \<agent\> · Chart: \<target\>/.portolan/chart/

## The waters

\<One short paragraph: the shape of the province — vessel count, the measured
fairways that connect them, what kind of waters these are.\>

## Top findings

<!-- Structure, risks, smells — the few that matter, most dangerous first.
     Keep the form: finding — trust label — anchors — chart location. -->

- **\<finding\>** — trust: \<measured|charted|reported|doubtful|unsurveyed\> — anchor: \<path:line | manifest key | receipt id\> — chart: \<kind/id\>

## Verification summary

<!-- From `trust.report` (no input): carry its numbers into the brief — the
     trust-label distribution, the vessels pending correction, and the
     refuted anchors verbatim with their entry ids, or the statement that
     every anchor re-sounded `confirmed`. A refuted anchor is reported as it
     stands, never smoothed over. -->

- trust labels: \<measured N · charted N · reported N · doubtful N · unsurveyed N\>
- pending correction: \<vessels with dragged entry counts, or none\>
- anchor re-sounding: \<sounded\>/\<total\> anchors sounded, \<confirmed\> confirmed — \<refuted anchors with entry ids, or none refuted\>

## The Chart

The Chart lives at `\<target\>/.portolan/chart/` — one sheet per vessel
(\<count\> sheets) plus the machine index `index.jsonl`. Read the trust labels
before trusting anything: `measured` taken from source, `charted` from
manifests, `reported` a claim from docs, `doubtful` unvalidated,
`unsurveyed` not determined.

## Unsurveyed waters

<!-- Name every principal water the Expedition could not determine. A static
     survey always leaves at least runtime topology and deployed versions
     here. These are honest limits, not gaps to paper over. -->

- runtime topology — \<what is unknown about where vessels actually run\>
- deployed versions — \<what is unknown about what is actually deployed\>
- \<further unsurveyed waters, each with its chart location if it has one\>

## Notices to Mariners

<!-- What this Expedition changed on the Chart (added, corrected, marked
     stale, retired), from the Chart's own notices. On a first Expedition:
     one line saying the Chart is new. -->

- \<notices\>
