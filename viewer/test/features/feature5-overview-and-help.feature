Feature: Overview guides the first five minutes

Scenario: Overview read more stays in overview
  Given the overview is visible
  When the user clicks Read more
  Then additional overview explanation appears or the page scrolls to overview detail
  And the selected component does not unexpectedly change

Scenario: Help does not obscure content
  Given the user hovers or focuses help
  When the help text appears
  Then it remains inside the viewport
  And it does not render under the map, table, or side panel
  And labels do not shift or wrap badly

Scenario: Fake controls are rejected
  Given a control is visible
  When the user activates the control
  Then it changes the UI state, changes the route, starts a visible export, or is disabled with a reason

Scenario: Overview is the default route
  Given the local UI opens
  When no object route is selected
  Then Overview is shown first
  And Map requires an explicit user action
  And the first screen is not an undifferentiated node-link graph
