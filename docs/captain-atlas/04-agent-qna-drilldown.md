# BDD Work Package: Agent Q&A And Drill-Down

## Agent Assignment

Make the generated atlas useful inside the coding-agent workflow. The agent must
answer from the atlas bundle and map selected code back to landscape context.

## Product Question

Can the captain ask follow-up questions or highlight code and immediately see
where that code sits in the landscape?

## Scope

- Bundle query commands or MCP tools.
- Selected file/symbol to atlas lookup.
- Answers grounded in atlas nodes, relationships, facts, files, and gaps.
- Plain language summaries for captains and technical detail for engineers.

## Out Of Scope

- Replacing the coding agent.
- Full semantic code intelligence unless an imported index provides it.
- Pre-generated answer packs for every possible question.

## Implementation Slice

- Owned surfaces: bundle query contract, selected-code lookup behavior,
  harness instruction text, and answer-quality rubric.
- First vertical slice: bounded queries for overview, repos, relationships,
  risks, gaps, and file-path lookup.
- Artifact: five captain Q&A prompts and two selected-code prompts with answers
  citing atlas objects, local files, or explicit gaps.
- Verify: answer from the bundle without reading raw multi-gigabyte outputs or
  inventing unsupported architecture.
- Out of scope: full semantic search unless an imported local index provides it.

## BDD

```gherkin
Feature: Agent uses the atlas during conversation

Scenario: Agent answers a landscape question from the bundle
  Given an atlas bundle exists
  When the captain asks "what is going on in this estate?"
  Then the agent queries overview, repos, relationships, risks, and gaps
  And the answer cites atlas objects or local files
  And the answer separates verified facts from unknowns

Scenario: Agent explains a selected file
  Given the captain selects a file or symbol in the coding harness
  When the agent receives that path or symbol
  Then the agent maps it to repo, component, related files, relationships, and risks
  And the agent can open the relevant atlas view or provide the exact drill-down route

Scenario: Agent compares developer claim with atlas facts
  Given a human or agent claims a component depends on another component
  When the agent checks the atlas bundle
  Then the answer reports whether local evidence supports, contradicts, or cannot verify the claim
  And the answer points to the inspected relationship or missing evidence

Scenario: Agent avoids loading the entire corpus
  Given a large atlas bundle
  When the captain asks a targeted question
  Then the agent uses bounded queries
  And the answer does not require reading raw multi-gigabyte outputs

Scenario: Agent can hand off to human exploration
  Given an answer references repos, risks, or relationships
  When the captain wants to inspect visually
  Then the agent gives a direct atlas route or local app URL for the same object
```

## Deliverables

- Query contract for overview, repo, component, relationship, risk, gap, source,
  and selected-code lookup.
- Harness instruction text for Cursor Composer first.
- Q&A acceptance prompts.
- Answer quality rubric: useful, grounded, concise, navigable.

## Acceptance

Pass when the agent can answer five captain questions and two selected-code
questions from the atlas without reading raw output manually or inventing
unsupported architecture.
