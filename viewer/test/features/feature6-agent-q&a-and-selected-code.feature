Feature: The coding agent uses Portolan during follow-up work

Scenario: Agent answers a landscape question from bounded queries
  Given a system map bundle exists
  When the user asks what is going on in the target
  Then the agent queries overview, components, relationships, findings, and gaps
  And the answer cites Portolan objects or local paths
  And the answer avoids unsupported architecture claims

Scenario: Agent explains selected code
  Given the user gives the agent a file path and optional line
  When the agent queries Portolan for selected code
  Then the answer maps the file to repository, component, C4 placement, related components, findings, and unknowns
  And the answer gives a UI route to inspect the same object
