Feature: Cursor builds a Portolan result from a clean prompt

Scenario: Cursor discovers Portolan without hidden hints
  Given a local target root
  And a Portolan URL or local checkout path
  When the user asks Cursor Agent CLI or Cursor Composer to build the Portolan result
  Then Cursor finds the installed instructions
  And Cursor identifies the target root and output location
  And Cursor asks only necessary clarifying questions
  And the terminal transcript is captured when Cursor Agent CLI is available
  And the prompt contains only Portolan location, target root, and the user goal

Scenario: Cursor keeps the target read-only by default
  Given the target root contains source repositories
  When Cursor installs and runs Portolan
  Then source files are not modified
  And generated Portolan files stay under the approved output area
  And target network fetches or tool installation actions require explicit approval

Scenario: Cursor produces a usable handoff
  Given Portolan completes or partially completes
  When Cursor reports back
  Then the answer includes the local UI launch route
  And the answer includes the main components, relationships, risks, gaps, and next actions
  And unsupported claims are marked unknown, cannot verify, or not assessed
