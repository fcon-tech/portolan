Feature: Portolan separates components, repositories, and surfaces

Scenario: Documentation surface is attached, not floated
  Given the bundle contains a support matrix
  When the system map is generated
  Then the support matrix is modeled as a documentation surface
  And it is attached to its owning component or target
  And it is not shown as a peer component in the default map

Scenario: Support objects are not promoted by name alone
  Given the bundle contains a support matrix, CI jobs, mailing lists, and binary repositories
  When component promotion runs
  Then none of those objects become default-map components
  And each object is attached as a surface or recorded as an unknown with owner context

Scenario: Community surface is attached, not floated
  Given the bundle contains mailing lists
  When the system map is generated
  Then mailing lists are modeled as community surfaces
  And they are attached to their owning component or target
  And their dossier explains why they matter

Scenario: Component promotion is deterministic
  Given the same bundle is processed twice
  When the normalized system map is generated
  Then the same raw objects are promoted to components
  And ambiguous objects remain surfaces or unknowns unless two local signals support promotion
  And the promotion report records which local signals caused promotion

Scenario: Retired component remains meaningful
  Given the bundle contains Apache Sqoop
  When the user opens its dossier
  Then the dossier identifies it as retired or legacy
  And the dossier explains why it is present
  And repository, site, tracker, wiki, missing docs, relationships, and findings are visible
