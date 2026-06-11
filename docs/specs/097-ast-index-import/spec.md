# Feature Specification: ast-index Import (097)

**Status**: Implemented (import-only)

**Input**: Operator-supplied ast-index JSON export normalized into symbol-index (revives draft 085 import path).

## Requirements

- **FR-001**: `import-ast-index.sh` imports explicit local JSON only; does NOT execute ast-index.
- **FR-002**: Imported symbols MUST carry `resolution_limit` and `metadata-visible` evidence state.
- **FR-003**: `build-symbol-index.sh` merges ast-index output when present.
