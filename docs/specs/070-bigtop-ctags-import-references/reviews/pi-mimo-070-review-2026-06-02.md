findings:
- severity: minor
  evidence: Producer result — "first attempted command without -R produced only pseudo tags and was discarded before assessed final run"
  issue: The discarded attempt is recorded but the protocol for what "discarded" means (e.g., file deleted, moved aside, overwritten) is not explicit. Reproducibility depends on knowing whether a stale partial output could be confused with the final run.
  recommendation: Add a one-line note to the ledger specifying the discard action (e.g., "overwritten by final run" or "removed before assessed run") so a re-runner knows the final file is clean.

- severity: minor
  evidence: Producer result — "total JSON records 936,748" vs "tag records 936,715"
  issue: 33 non-tag JSON records (pseudo-tags or header lines) exist but are not enumerated or classified. A reviewer cannot confirm these are benign without re-running. This is a minor transparency gap, not an overclaim.
  recommendation: Add a count or short description of the 33 non-tag records (likely pseudo-tag headers) to the ledger for full auditability.

- severity: minor
  evidence: Spec requirement FR-004 — classify roles:"imported" package records; Producer result — "imported reference records 873,435; roles: imported 873,435; def 63,280"
  issue: The def-role count (63,280) plus imported (873,435) sums to 936,715, which exactly matches tag records. This is correct and tight, but the ledger does not explicitly note this cross-check. Minor documentation gap.
  recommendation: Add one line to the ledger: "imported + def = 936,715 = total tag records ✓" so the invariant is self-evident to reviewers.

- severity: major
  evidence: Spec requirement FR-005 — "do not claim method/class refs, call graph, or enterprise parity"
  issue: The producer result and Cursor stress both correctly state these are "cannot_verify" or "beyond scope." However, the phrase "verified bounded package import-reference evidence" in the Cursor stress output could be misread as claiming completeness of the reference picture rather than acknowledging it is partial. The boundary is stated but the word "verified" risks implying a stronger guarantee than what FR-005 permits.
  recommendation: Tighten the Cursor stress summary to: "C6 now includes verified *partial* bounded package import-reference evidence; method/class refs, xref linkage, call graph, runtime topology, and enterprise parity remain cannot_verify." This preserves clarity that C6 is still incomplete.

- severity: critical
  evidence: Spec requirement FR-006 — "do not build Bigtop, start services, contact K8s, mutate target repos, or add network-dependent tooling."
  issue: The producer result does not explicitly attest that no repos were mutated (e.g., no tags files written into source trees) and no network calls were made. The command uses `-f "$OUT/..."` which writes to an output directory, but the ledger does not state that the output path is outside the target repos or that no side-effects touched the source trees. A reviewer must infer this from the command syntax alone.
  recommendation: Add a single attestation line to the ledger: "Output written to $OUT (outside target repos); no target repos mutated; no network calls made; no new tooling installed." This closes the FR-006 verification gap explicitly.

- severity: minor
  evidence: Reviews/ctags-import-reference-ledger — reproducibility
  issue: The ledger records the command, version, exit code, and counts but does not include the environment (OS, shell, or whether the target repos are at a specific commit). For full reproducibility, these should be noted.
  recommendation: Add a brief environment section: OS, shell, and whether target repos were pinned at a known commit or branch.

not_assessed:
- Runtime capture, runtime topology, call graph, method/class references, xref linkage, enterprise parity — all explicitly out of scope per spec 070 (FR-005, FR-006).
- Whether the 59,704 unique importing files are themselves within the selected scope or include transitive dependencies — not assessed in this slice.
- Bigtop architecture understanding beyond symbol/reference evidence — deferred to later specs.

verdict: ready_with_minor_fixes
