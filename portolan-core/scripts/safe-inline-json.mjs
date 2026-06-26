/**
 * Safe JSON inlining for HTML <script> blobs. ADAPTER/EXPORT concern only —
 * not domain logic. Extracted so export-shell.mjs and its smoke test share one
 * implementation.
 *
 * JSON.stringify does NOT escape U+2028/U+2029 (which break JS parsers) nor
 * `<` (which can close the tag via `</script>`). This escapes all three.
 *
 * NOTE: `>` and `&` are intentionally NOT escaped — they are safe inside a
 * `<script>` element (no HTML-entity parsing occurs in script content), so
 * escaping them would add noise without benefit.
 */
'use strict';

export function safeInlineJson(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
