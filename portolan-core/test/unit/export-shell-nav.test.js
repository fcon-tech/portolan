/**
 * HTML export smoke test for the navigation atlas inlining (correction #7).
 *
 * Verifies that safeInlineJson (an ADAPTER/EXPORT concern, extracted to
 * scripts/safe-inline-json.mjs so export-shell.mjs and this test share it):
 *   - escapes script-breaking sequences: </script>, U+2028, U+2029.
 *
 * The full export-shell.mjs end-to-end (does the generated atlas.html contain
 * __NAV_ATLAS and a known route id) is exercised by the acceptance harness,
 * which builds a real bundle and greps the HTML.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');

let safeInlineJson;
let escapeHtmlText;
test('setup: load safeInlineJson from ESM module', async () => {
  const mod = await import('../../scripts/safe-inline-json.mjs');
  safeInlineJson = mod.safeInlineJson;
  assert.strictEqual(typeof safeInlineJson, 'function');
});

test('setup: load escapeHtmlText from ESM module', async () => {
  const mod = await import('../../scripts/html-escape.mjs');
  escapeHtmlText = mod.escapeHtmlText;
  assert.strictEqual(typeof escapeHtmlText, 'function');
});

test('safeInlineJson: escapes </script> sequence', () => {
  const out = safeInlineJson({ evil: '</script><script>alert(1)</script>' });
  assert.ok(!out.includes('</script>'), '</script> must be escaped');
  assert.ok(out.includes('\\u003c'), '< is escaped to \\u003c');
});

test('safeInlineJson: escapes U+2028 and U+2029 line/paragraph separators', () => {
  const out = safeInlineJson({ a: 'x\u2028y\u2029z' });
  assert.ok(!out.includes('\u2028'), 'U+2028 must be escaped');
  assert.ok(!out.includes('\u2029'), 'U+2029 must be escaped');
  assert.ok(out.includes('\\u2028') || out.includes('\\u2029'));
});

test('safeInlineJson: round-trips valid JSON', () => {
  const obj = { route_id: 'route:r1', stages: [1, 2, 3] };
  const out = safeInlineJson(obj);
  assert.deepStrictEqual(JSON.parse(out), obj);
});

test('safeInlineJson: does not alter ordinary content', () => {
  const out = safeInlineJson({ normal: 'text with > and & chars' });
  // > and & are fine inside a script string; only <, U+2028, U+2029 are escaped.
  assert.ok(out.includes('>'));
  assert.ok(out.includes('&'));
});

test('escapeHtmlText: escapes text before insertion into title/html text context', () => {
  const out = escapeHtmlText('Portolan </title><script>alert(1)</script> & friends');
  assert.ok(!out.includes('</title>'), '</title> must be escaped');
  assert.ok(!out.includes('<script>'), '<script> must be escaped');
  assert.ok(out.includes('&lt;/title&gt;'));
  assert.ok(out.includes('&amp; friends'));
});
