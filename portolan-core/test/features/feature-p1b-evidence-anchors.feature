Feature: Every semantic claim carries an evidence anchor or not_assessed
  Part-1b: every semantic claim SHALL carry an evidence anchor (source card, local
  source anchor, or command receipt) or be explicitly marked not_assessed. A claim
  without any anchor MUST NOT be presented as verified; the missing anchor MUST be
  surfaced rather than hidden.
  Bound to openspec/specs/semantic-investigation.

  Scenario: Anchored claim renders as verified
    Given a semantic claim has a local source anchor
    When the page renders the claim
    Then the anchor is attached and the claim is not marked not_assessed

  Scenario: Unanchored claim is not_assessed, not verified
    Given a semantic claim has no source card, local anchor, or command receipt
    When the page renders the claim
    Then it is explicitly marked not_assessed
    And it is not presented as verified
