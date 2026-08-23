/**
 * Chart entry validation — ajv (draft 2020-12) against
 * core/schema/chart.schema.json, with entry-locating errors: every problem
 * names the offending entry's kind and id.
 */
import Ajv2020 from "ajv/dist/2020";
import schema from "../schema/chart.schema.json";
import { ENTRY_KINDS, type ChartEntry, type EntryKind } from "./types";

interface AjvErrorLike {
  message?: string;
  instancePath?: string;
  params?: { allowedValues?: unknown[] };
}

type SubschemaValidator = ((data: unknown) => boolean) & {
  errors?: AjvErrorLike[] | null;
};

const SCHEMA_ID = schema.$id;

const ajv = new Ajv2020({ allErrors: true });
ajv.addSchema(schema);

const validators = new Map<string, SubschemaValidator>();

function validatorFor(kind: EntryKind): SubschemaValidator {
  let v = validators.get(kind);
  if (!v) {
    const got = ajv.getSchema(`${SCHEMA_ID}#/$defs/${kind}`);
    if (!got) throw new Error(`chart schema has no $defs/${kind}`);
    v = got as SubschemaValidator;
    validators.set(kind, v);
  }
  return v;
}

/** One offending entry and its problems. */
export interface EntryProblem {
  kind: string;
  id: string;
  problems: string[];
}

/** Thrown when a write batch contains invalid entries. Nothing is persisted. */
export class ChartValidationError extends Error {
  readonly problems: EntryProblem[];

  constructor(problems: EntryProblem[]) {
    const lines = problems.map(
      (p) => `  - ${p.kind}/${p.id}: ${p.problems.join("; ")}`
    );
    super(`chart validation failed:\n${lines.join("\n")}`);
    this.name = "ChartValidationError";
    this.problems = problems;
  }
}

function locate(entry: unknown, index: number): { kind: string; id: string } {
  const obj = (entry ?? {}) as Record<string, unknown>;
  const kind = typeof obj.kind === "string" ? obj.kind : "unknown";
  const id =
    typeof obj.id === "string" && obj.id.length > 0 ? obj.id : `#${index} (no id)`;
  return { kind, id };
}

function formatAjvErrors(errors: AjvErrorLike[]): string[] {
  return errors.map((e) => {
    const at = e.instancePath || "/";
    const allowed = e.params?.allowedValues;
    const list = Array.isArray(allowed) ? `: ${allowed.join(", ")}` : "";
    return `${e.message ?? "is invalid"}${list} (at ${at})`;
  });
}

/** Validate a single entry; returns its problem report, or null when valid. */
export function validateEntry(entry: unknown, index = 0): EntryProblem | null {
  const { kind, id } = locate(entry, index);
  if (!ENTRY_KINDS.includes(kind as EntryKind)) {
    return {
      kind,
      id,
      problems: [
        `unknown kind (expected one of: ${ENTRY_KINDS.join(", ")})`,
      ],
    };
  }
  const validate = validatorFor(kind as EntryKind);
  if (validate(entry)) return null;
  return { kind, id, problems: formatAjvErrors(validate.errors ?? []) };
}

/**
 * Validate a whole write batch. Returns the batch unchanged when every entry
 * conforms; throws {@link ChartValidationError} naming every offending entry
 * otherwise. Callers must treat a throw as "nothing was written".
 */
export function validateEntries(entries: unknown[]): ChartEntry[] {
  const problems: EntryProblem[] = [];
  entries.forEach((entry, index) => {
    const problem = validateEntry(entry, index);
    if (problem) problems.push(problem);
  });
  if (problems.length > 0) throw new ChartValidationError(problems);
  return entries as ChartEntry[];
}
