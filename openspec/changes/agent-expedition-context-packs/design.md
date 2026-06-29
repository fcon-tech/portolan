# Design — agent-expedition-context-packs

## Decision

Expedition context packs are the agent-facing delivery shape: bounded,
query-relevant bundles scoped to an investigation, fitting a context budget by
default. The full landscape is opt-in.

## Relationship to agent-atlas-foundation

`agent-atlas-foundation` proposes the economical-tentacles PRINCIPLE (the
substrate is bounded/query-aware, never a dump). This change makes the pack the
CONCRETE mechanism. If the foundation is applied first, this change specializes
its requirement; they do not conflict.

## Status

Recorded intent (spec-level). Pack format, query/scoping language, and budget
policy are design-TBD.

## Reversibility

High. Additive delivery shape; degrades to the existing bundle when packs are
absent.
