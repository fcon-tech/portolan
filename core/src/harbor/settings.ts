/**
 * The settings file: `<target>/.portolan/settings.json`, one recognized
 * namespace (`harbor`) with two recognized keys — `harbor.schedule` and
 * `harbor.auto_repair_max_vessels` — unset by default (design.md, decision
 * 5). The schedule is documentation for external wiring — Portolan
 * interprets nothing from it and runs nothing on its own; the headless
 * propose CLI is the scheduler's entry. The auto-repair bound is the night
 * watch's whole policy (night-watch design.md, decision 1): absent or zero
 * means report-only, and a malformed value fails LOUDLY — a typo'd bound
 * must never degrade silently into "launch everything" or "launch nothing".
 * Unknown keys are tolerated with a warning so a newer or hand-edited
 * settings file never breaks an older Portolan; a file that is not a JSON
 * object fails loudly.
 * openspec/changes/harbor-master + openspec/changes/night-watch (harbor
 * capability: scheduling is an explicit setting, off by default / night
 * policy bound)
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { SettingsError } from "./errors";

export const SETTINGS_FILE = "settings.json";

/** The recognized `harbor` namespace. */
export interface HarborSettings {
  /** A cron-ish descriptor, documentation for external scheduling; absent by default. */
  schedule?: string;
  /**
   * The night watch's auto-repair bound: the largest number of affected
   * vessels a repair proposal may carry and still be auto-executed.
   * Absent (and zero) means report-only; a non-negative integer or the
   * settings file fails loudly.
   */
  autoRepairMaxVessels?: number;
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
 * ignored — except `harbor.auto_repair_max_vessels`, which must be a
 * non-negative integer when present and fails loudly otherwise (the bound is
 * the night watch's safety story; ambiguity about it is never tolerable).
 * Malformed JSON or a non-object root is a loud error.
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
      if (innerKey === "schedule") {
        if (typeof innerValue !== "string" || innerValue.length === 0) {
          warnings.push(`settings: harbor.schedule must be a non-empty string; ignored`);
        } else {
          harbor.schedule = innerValue;
        }
      } else if (innerKey === "auto_repair_max_vessels") {
        if (typeof innerValue !== "number" || !Number.isInteger(innerValue) || innerValue < 0) {
          throw new SettingsError(
            `harbor.auto_repair_max_vessels must be a non-negative integer, got ${JSON.stringify(innerValue)}`,
          );
        }
        harbor.autoRepairMaxVessels = innerValue;
      } else {
        warnings.push(
          `settings: unknown key "harbor.${innerKey}" ignored (known: harbor.schedule, harbor.auto_repair_max_vessels)`,
        );
      }
    }
  }
  return { harbor, warnings };
}
