/**
 * Shared JSONL reader for the atlas-navigation scripts (adapter I/O).
 *
 * Tolerant: missing file -> []; unparseable line -> skipped with a stderr
 * warning (NOT recorded as a parse failure — a missing file is not an
 * unparseable line). Extracted so a fix lives in one place across the three
 * scripts that read JSONL (export-shell, query, validate).
 *
 * Two variants: readJsonl (rows only) and readJsonlStrict ({rows, failed}).
 *
 * ESM (.mjs) — imported by the .mjs scripts.
 */
'use strict';

import fs from 'node:fs';
import path from 'node:path';

/**
 * Read a JSONL file into an array. Missing file -> []. Unparseable non-empty
 * lines are skipped with a stderr warning and NOT counted as failures (a
 * missing file is distinct from a malformed line).
 *
 * @param {string} file absolute path
 * @returns {Array} parsed rows
 */
export function readJsonl(file) {
  if (!fs.existsSync(file)) return [];
  let content;
  try { content = fs.readFileSync(file, 'utf8'); }
  catch (e) { console.error(`warning: could not read ${file}: ${e.message}`); return []; }
  const out = [];
  const lines = content.split(/\r\n|\r|\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    try { out.push(JSON.parse(line)); }
    catch (e) { console.error(`warning: ${file}:${i + 1} unparseable JSONL line skipped: ${e.message}`); }
  }
  return out;
}

/**
 * Strict variant: returns { rows, failed } where `failed` lists per-line
 * parse failures as `basename:lineno`. A missing file returns failed: [] (a
 * missing file is NOT a parse failure). Used by the validator, which needs to
 * surface parse failures in its report.
 *
 * @param {string} file absolute path
 * @returns {{rows: Array, failed: string[]}}
 */
export function readJsonlStrict(file) {
  const rows = [];
  const failed = [];
  if (!fs.existsSync(file)) return { rows, failed };
  let content;
  try { content = fs.readFileSync(file, 'utf8'); }
  catch (e) { console.error(`warning: could not read ${file}: ${e.message}`); return { rows, failed }; }
  const lines = content.split(/\r\n|\r|\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    try { rows.push(JSON.parse(line)); }
    catch { failed.push(`${path.basename(file)}:${i + 1}`); }
  }
  return { rows, failed };
}
