# notices-panel Tasks

## 1. Parse + embed

- [x] 1.1 Add `parseNotices` (grammar of `renderNotices`) to
      `core/src/chartroom/render.ts` and embed the parsed array in
      `__CHART_DATA__`; verify unit tests: full-grammar round-trip against
      `renderNotices` output, note with em-dash, absent file = empty array

## 2. Panel

- [x] 2.1 Render the Notices panel in `template.html` (per-action styling,
      anchors list, honest empty state, engineering lexicon title) and
      verify: both modes show the section, empty state visible

## 3. Verify + archive

- [x] 3.1 Regenerate the Bigtop artifact from core and extend the headless
      check (panel section present); full suite green (`bun test`, tsc);
      archive the change
