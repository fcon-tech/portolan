/**
 * The Harbor Master's error type. One shape for every harbor rejection —
 * corrupt snapshot/history files, unknown decision vocabulary, deciding on
 * a fingerprint the queue does not compute — so the registry boundary can
 * surface any of them verbatim as a tool error (same discipline as
 * LogError / SoundingError in the tool layer).
 * openspec/changes/harbor-master
 */
export class HarborError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HarborError";
  }
}

/** A settings file that cannot be honored as written. */
export class SettingsError extends HarborError {
  constructor(message: string) {
    super(`settings: ${message}`);
    this.name = "SettingsError";
  }
}
