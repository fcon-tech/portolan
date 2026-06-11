# Implementation Plan: Evidence Navigation UX Patterns

**Date**: 2026-06-10 | **Status**: Implemented via `viewer/` MVP

## Summary

Ship UA-inspired navigation as `viewer/` loading Portolan bundle evidence only.
Constitution 1.1.0 allows local static viewer session.

## Deliverables

- `viewer/` — tour, graph nodes, gaps panel, evidence badges
- `scripts/serve.js` — read-only bundle proxy on 127.0.0.1

## Verification

```bash
scripts/harness-portolan-smoke.sh
```
