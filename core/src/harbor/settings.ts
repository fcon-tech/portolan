/**
 * The settings file: `<target>/.portolan/settings.json`, one recognized
 * namespace (`harbor`) with one recognized key (`harbor.schedule`), unset by
 * default (design.md, decision 5). The schedule is documentation for
 * external wiring — Portolan interprets nothing from it and runs nothing on
 * its own; the headless propose CLI is the scheduler's entry. Unknown keys
 * are tolerated with a warning so a newer or hand-edited settings file
 * never breaks an older Portolan; a file that is not a JSON object fails
 * loudly.
 * openspec/changes/harbor-master (harbor capability: scheduling is an
 * explicit setting, off by default)
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { SettingsError } from "./errors";

export const SETTINGS_FILE = "settings.json";

/** The recognized `harbor` namespace. */
export interface HarborSettings {
  /** A cron-ish descriptor, documentation for external scheduling; absent by default. */
  schedule?: string;
}

/** What reading the settings file produced, plus its warnings. */
export interface SettingsResult {
  harbor: HarborSettings;
  warnings: string[];
}

/** Where the settings file lives. */
export function settingsFile(targetRoot: string): string {
  return join(targetRoot, ".portolan", SETTINGS_FILE);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Read the settings file. Absent file: `{ harbor: {}, warnings: [] }` — no
 * schedule, nothing configured, nothing runs on its own. Unknown keys (at
 * either level) and ill-typed known keys are tolerated with a warning and
 * ignored; malformed JSON or a non-object root is a loud error.
 */
export function readSettings(targetRoot: string): SettingsResult {
  const file = settingsFile(targetRoot);
  if (!existsSync(file)) return { harbor: {}, warnings: [] };

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(file, "utf8"));
  } catch (err) {
    throw new SettingsError(`cannot parse ${file}: ${(err as Error).message}`);
  }
  if (!isPlainObject(parsed)) {
    throw new SettingsError(`${file} is not a JSON object`);
  }

  const warnings: string[] = [];
  const harbor: HarborSettings = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (key !== "harbor") {
      warnings.push(`settings: unknown key "${key}" ignored (known: harbor)`);
      continue;
    }
    if (!isPlainObject(value)) {
      warnings.push(`settings: "harbor" must be an object; ignored`);
      continue;
    }
    for (const [innerKey, innerValue] of Object.entries(value)) {
      if (innerKey !== "schedule") {
        warnings.push(`settings: unknown key "harbor.${innerKey}" ignored (known: harbor.schedule)`);
      } else if (typeof innerValue !== "string" || innerValue.length === 0) {
        warnings.push(`settings: harbor.schedule must be a non-empty string; ignored`);
      } else {
        harbor.schedule = innerValue;
      }
    }
  }
  return { harbor, warnings };
}
