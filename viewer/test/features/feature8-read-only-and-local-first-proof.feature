Feature: Portolan does not mutate the inspected estate by default

Scenario: Source tree remains unchanged
  Given a target root with git repositories or hashable files
  When Portolan runs through Cursor Agent CLI or shell
  Then source files outside the approved output area are unchanged
  And generated files stay under the approved output area

Scenario: Target network and installation actions are explicit
  Given the Portolan run needs a target network fetch, dependency install, credential, or external service
  When the agent reaches that step
  Then it stops or asks for approval
  And the final report records whether the action was approved, skipped, or not assessed
