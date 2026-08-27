# chart-write-shrink-guard Tasks

## 1. Store guard

- [x] 1.1 Add the options parameter + 75 % shrink guard (rejection naming
      both counts and `allowShrink`) to `writeChart`; plumb
      `allowShrink` through the `chart.write` MCP schema; verify tests:
      shrink below 75 % rejected with counts in message, `allowShrink:
      true` passes, first write unaffected, equal/growth unaffected,
      registry schema exposes the flag

## 2. Archive

- [x] 2.1 Full suite green; archive
