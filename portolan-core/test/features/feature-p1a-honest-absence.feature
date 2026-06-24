Feature: Honest absence degrades gracefully
  Part-1a: when data is absent (behaviour-only atlas, no runtime evidence), the
  product shows honest empty states rather than fabricating.

  Scenario: Behaviour-only atlas when no intentions/representations ingested
    Given intake named only repositories
    When the snapshot builds
    Then the atlas is behaviour-only
    And the triangulation overlay is absent with a clear "behaviour-only" state
    And this is a valid complete Part-1 result

  Scenario: Container level honest-empty without runtime evidence
    Given the perimeter has no runtime/deploy evidence
    When the admiral opens the C4 map
    Then the Container level renders honestly empty with an explanation
    And it is greyed-out, not hidden
