# Data Model: Agent Skill Pack

## Agent Guide

Fields:

- purpose: why the guide exists;
- triggers: user phrases that should activate the workflow;
- commands: current-command fallback plus target `portolan map` command;
- artifacts: current artifacts and target files the agent must inspect;
- report sections: required answer structure;
- forbidden behavior: unsupported inference, hidden network, mutation.

## Cursor Rule

Fields:

- title;
- trigger conditions;
- pointer to portable guide;
- minimal workflow reminders;
- stop conditions.

Rules:

- Cursor rule content must stay short.
- Cursor rule must not duplicate the whole portable guide.
- Cursor rule must not describe Portolan as Cursor-only.

## Example Report

Sections:

- relationships;
- duplication;
- configuration surfaces;
- technical debt;
- unknown;
- cannot_verify;
- not_assessed.

Each row must include evidence state and source pointer.
