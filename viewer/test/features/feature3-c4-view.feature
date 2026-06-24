Feature: C4 explains the same Portolan result

Scenario: Context view names the target and external systems
  Given a system map exists
  When the user opens C4 Context
  Then the view shows the target root or integrator
  And it shows external projects and major external surfaces
  And every box opens a dossier

Scenario: Container view groups components by role
  Given components have roles and groups
  When the user opens C4 Containers/Families
  Then components are grouped into meaningful families
  And surface counts and unknowns are summarized per family
  And the user can drill into a family
  And the grouping reason is visible in the family or component dossier
  And repeated generation assigns the same primary family for the same component evidence

Scenario: Component view explains selected family
  Given the user selected a family or component
  When the component C4 level is shown
  Then meaningful components and their important relationships are visible
  And repositories and surfaces are attached as detail, not equal peer boxes
