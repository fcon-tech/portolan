Feature: Every meaningful object has a dossier

Scenario: User clicks a component on the map
  Given the default map is visible
  When the user clicks a component
  Then the dossier opens for that component
  And it explains what the component is, why it exists, where it sits in C4, and what to inspect next

Scenario: User clicks a relationship
  Given a relationship is visible
  When the user clicks the relationship
  Then the relationship detail opens
  And it shows connected components, evidence, producer, weight, unknowns, and next drill-down commands

Scenario: User clicks a surface
  Given a component has attached surfaces
  When the user opens a surface
  Then the surface dossier shows type, owner, link/path, evidence state, why it matters, and missing/unknown status

Scenario: No empty dossier stubs
  Given a visible object has weak or missing evidence
  When the user opens its dossier or detail panel
  Then the view names the known facts
  And it names unknown or not-assessed areas
  And it names the producer or gap that created the object
  And it does not pretend unsupported fields are known

Scenario: Partial evidence is rendered honestly
  Given a component has a name, one backing repository, and unknown lifecycle or relationships
  When the user opens its dossier
  Then known fields render normally
  And unknown fields render as unknown, cannot verify, or not assessed with a reason
  And the dossier does not fabricate a lifecycle, relationship, or risk explanation
