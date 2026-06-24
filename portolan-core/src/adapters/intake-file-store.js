/**
 * Adapter: intake file store — reads/writes the `.portolan/intake.json`
 * artefact produced by the root Portolan skill's managed intake.
 *
 * Implements a minimal { load, save } over the filesystem. The use-case layer
 * (run-intake) produces the typed object; this adapter persists it.
 *
 * Adapters layer — the only place fs I/O for intake lives.
 */
'use strict';

const fs = require('fs');
const path = require('path');

function createIntakeFileStore(targetRoot) {
  const dir = path.join(targetRoot, '.portolan');
  const file = path.join(dir, 'intake.json');
  return {
    load() {
      try {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
      } catch (e) {
        return null;
      }
    },
    save(intakeResult) {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(file, JSON.stringify(intakeResult, null, 2));
      return file;
    },
    path() { return file; },
    exists() { return fs.existsSync(file); },
  };
}

module.exports = { createIntakeFileStore };
