# Research: OSS Producer Acceptance

## Decision: Validate Producer Availability Before Any Execution

- Decision: Start with existing `oss-plan.json` and local executable discovery.
- Rejected alternatives: install producer tools automatically; add a Portolan
  producer runner; substitute native Portolan duplicate/config findings for OSS
  producer output.
- Why now: Spec 034 left OSS producer execution explicitly `not_assessed`.
- Reversibility: High. Installing or wiring producers can be a later approved
  slice.
- Risk if wrong: A useful producer might be available through a non-PATH wrapper
  and be missed.
- Confidence: high.

## Decision: Treat Missing Or Failed Producers As Non-Validation

- Decision: If a producer is absent, record it as `blocked`; if it runs but does
  not produce usable output, record it as `failed`; if Semgrep has no local
  config, keep it `not_assessed`.
- Rejected alternatives: mark the whole slice failed; mark producer absence as a
  passed acceptance because Portolan emitted recipes.
- Why now: The feature goal is proving real OSS output generation, not recipe
  generation.
- Reversibility: High. Rerun after installing approved local producers.
- Risk if wrong: The backlog could look more blocked than necessary.
- Confidence: high.

## Decision: Fix Context-Local Producer Output Preservation

- Decision: Preserve existing `<out>/tool-outputs/` regular files when
  `context prepare --force` replaces the context pack, and detect those files as
  candidate tool outputs.
- Rejected alternatives: require users to write producer outputs under the
  target root; remove `--force` from the generated after-run command; ask users
  to manually copy outputs back after rerun.
- Why now: The generated Syft output was erased by the advertised after-run
  command, so the planned workflow could not prove OSS composition.
- Reversibility: Medium. The output location contract is now stronger and
  should remain stable.
- Risk if wrong: Very large producer outputs can make context preparation slower.
- Confidence: high.

## Decision: Do Not Commit Raw Producer Outputs

- Decision: Commit only summarized evidence and command/status records.
- Rejected alternatives: commit full jscpd/SBOM/Semgrep outputs; store outputs
  under the spec directory.
- Why now: Bigtop is OSS, but the repo rule is broader: avoid committing raw
  source snippets or large generated payloads.
- Reversibility: Medium. A future fixture can be curated and scrubbed.
- Risk if wrong: Too little evidence for later auditing; mitigated by recording
  command paths and output locations.
- Confidence: high.
