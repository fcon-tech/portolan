Feature: Portolan repeats on a second ecosystem

Scenario: Non-Bigtop target uses the same first-run path
  Given the polyglot service landscape fixture or another named second OSS target
  When Cursor or a shell agent runs the same Portolan first-run path
  Then Portolan produces a system map and UI without Bigtop-specific choreography
  And component, surface, relationship, dossier, C4, and Q&A checks still run
  And the result contains at least two components and two repositories
  And no promotion rule depends on the literal string "Bigtop"
