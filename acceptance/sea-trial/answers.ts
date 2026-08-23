/**
 * The answers artifact (sea-trial design.md, decision 1): the Cartographer
 * answers Q1–Q12 into `<target>/.portolan/sea-trial/answers.jsonl` before
 * grading — one JSON object per line with the question id, the answer
 * text, its anchors, and its trust label (plus optional machine-check
 * `claims`). The runner grades that file; the artifact is itself evidence,
 * hashed into the report so post-hoc edits are visible.
 *
 * Answer rules enforced here (acceptance/bigtop-sea-trial.md):
 * an answer without a citable anchor or without a trust label is graded
 * unanswered and counts against the trial — it is a rules failure, not a
 * load error. A structurally broken artifact (not JSON, unknown question
 * id, duplicate question) fails the load loudly instead: replayable
 * evidence cannot be half-read.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { TRUST_LABELS, type Anchor, type TrustLabel } from "../../core/src/index";
import { QUESTION_IDS, type QuestionId } from "./questions";

export const SEA_TRIAL_DIR = ".portolan/sea-trial";
export const ANSWERS_FILE = "answers.jsonl";

export class AnswersArtifactError extends Error {
  constructor(message: string) {
    super(`answers artifact: ${message}`);
    this.name = "AnswersArtifactError";
  }
}

/** Where the answers artifact lives for a target root. */
export function answersPathFor(targetRoot: string): string {
  return join(targetRoot, SEA_TRIAL_DIR, ANSWERS_FILE);
}

/** One loaded answer line, with the answer-rule problems that make it unanswered. */
export interface LoadedAnswer {
  qid: QuestionId;
  line: number;
  text: string;
  /** The raw trust label as written; undefined when absent. */
  trust?: string;
  /** Only well-shaped anchors (file/manifest/receipt) — these get sounded. */
  anchors: Anchor[];
  /** Machine-check claims (Q1: label→version; Q3: component→manifest|import|both). */
  claims?: Record<string, string>;
  /** Why this answer violates the answer rules (missing anchor/label/...). */
  problems: string[];
}

export interface LoadedAnswers {
  path: string;
  /** sha256 of the artifact bytes, or "absent" when no artifact exists. */
  hash: string;
  absent: boolean;
  answers: Map<QuestionId, LoadedAnswer>;
}

function isAnchorShaped(value: unknown): value is Anchor {
  if (typeof value !== "object" || value === null) return false;
  const a = value as Record<string, unknown>;
  if (a.type === "file") return typeof a.path === "string" && a.path.length > 0;
  if (a.type === "manifest") return typeof a.path === "string" && typeof a.key === "string";
  if (a.type === "receipt") return typeof a.id === "string" && a.id.length > 0;
  return false;
}

/**
 * Load the answers artifact. A missing artifact is an honest empty load
 * (every question will grade unanswered); a corrupt one throws.
 */
export function loadAnswers(path: string): LoadedAnswers {
  if (!existsSync(path)) {
    return { path, hash: "absent", absent: true, answers: new Map() };
  }
  const bytes = readFileSync(path);
  const hash = createHash("sha256").update(bytes).digest("hex");
  const answers = new Map<QuestionId, LoadedAnswer>();
  const text = bytes.toString("utf8");
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i]!;
    if (raw.trim().length === 0) continue;
    const lineNo = i + 1;
    let doc: unknown;
    try {
      doc = JSON.parse(raw);
    } catch (err) {
      throw new AnswersArtifactError(
        `line ${lineNo}: not JSON (${(err as Error).message}) in ${path}`,
      );
    }
    if (typeof doc !== "object" || doc === null || Array.isArray(doc)) {
      throw new AnswersArtifactError(`line ${lineNo}: not a JSON object`);
    }
    const obj = doc as Record<string, unknown>;
    if (typeof obj.qid !== "string" || !(QUESTION_IDS as readonly string[]).includes(obj.qid)) {
      throw new AnswersArtifactError(
        `line ${lineNo}: unknown question id ${JSON.stringify(obj.qid)} — the trial asks ${QUESTION_IDS.join(", ")}`,
      );
    }
    const qid = obj.qid as QuestionId;
    if (answers.has(qid)) {
      throw new AnswersArtifactError(`line ${lineNo}: duplicate answer for ${qid}`);
    }

    const problems: string[] = [];
    const answerText = typeof obj.text === "string" ? obj.text : "";
    if (answerText.trim().length === 0) problems.push("no answer text");

    let trust: string | undefined;
    if (typeof obj.trust !== "string" || obj.trust.length === 0) {
      problems.push("no trust label");
    } else if (!(TRUST_LABELS as readonly string[]).includes(obj.trust)) {
      problems.push(
        `trust label ${JSON.stringify(obj.trust)} is outside the vocabulary (${TRUST_LABELS.join(", ")})`,
      );
      trust = obj.trust;
    } else {
      trust = obj.trust;
    }

    const anchors: Anchor[] = [];
    if (!Array.isArray(obj.anchors) || obj.anchors.length === 0) {
      problems.push("no anchor (path[:line], manifest key, or log receipt)");
    } else {
      obj.anchors.forEach((a, k) => {
        if (isAnchorShaped(a)) anchors.push(a);
        else problems.push(`anchor #${k + 1} is not citable (file, manifest, or receipt)`);
      });
      if (anchors.length === 0 && !problems.some((p) => p.includes("not citable"))) {
        problems.push("no anchor (path[:line], manifest key, or log receipt)");
      }
    }

    let claims: Record<string, string> | undefined;
    if (obj.claims !== undefined) {
      if (
        typeof obj.claims !== "object" ||
        obj.claims === null ||
        Array.isArray(obj.claims) ||
        Object.values(obj.claims).some((v) => typeof v !== "string")
      ) {
        problems.push("claims malformed (expected an object mapping strings to strings)");
      } else {
        claims = obj.claims as Record<string, string>;
      }
    }

    answers.set(qid, {
      qid,
      line: lineNo,
      text: answerText,
      trust,
      anchors,
      claims,
      problems,
    });
  }
  return { path, hash, absent: false, answers };
}

/** A normalized, rules-compliant answer (for callers that already know it is valid). */
export interface ValidAnswer {
  qid: QuestionId;
  text: string;
  trust: TrustLabel;
  anchors: Anchor[];
  claims?: Record<string, string>;
}
