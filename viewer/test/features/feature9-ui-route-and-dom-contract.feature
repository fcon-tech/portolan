Feature: Browser tests can verify Portolan objects without implementation-specific guesses

Scenario: Visible objects expose stable test hooks
  Given the UI is loaded
  When a component, repository, surface, C4 box, relationship, or finding is visible
  Then the element exposes `data-portolan-id`
  And the element exposes `data-portolan-kind`
  And clickable elements expose `data-portolan-route`

Scenario: Object routes are stable
  Given a normalized object exists
  When the user opens its route
  Then the UI shows the matching dossier or detail panel
  And the selected object id and kind are visible to browser automation
