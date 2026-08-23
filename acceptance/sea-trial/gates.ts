/**
 * The two automatic-fail gates (sea-trial tasks.md 3.1–3.2).
 *
 * Fabrication gate: every anchor cited by every answer is sounded with
 * the product's `sound.anchor` — no second anchor-checking
 * implementation (design.md, decision 3). Any `refuted` verdict fails
 * the whole trial, naming the fabricated anchor, regardless of every
 * other gate.
 *
 * Unsurveyed-honesty gate: enumerable, not holistic (design.md, decision
 * 5). Two axes can never be known statically — real runtime topology and
 * actual deployed versions. The chart must not present claims on those
 * axes under a label stronger than `unsurveyed`, and the Q12 answer must
 * carry the expected minimum admissions. Model-holism stays with the
 * Governor.
 */
import { formatAnchor, soundAnchor, type IndexedEntry } from "../../core/src/index";
import type { LoadedAnswer, LoadedAnswers } from "./answers";

// ---------------------------------------------------------------------------
// Fabrication gate
// ---------------------------------------------------------------------------

export interface RefutedAnchor {
  qid: string;
  /** The anchor as cited, formatted for the report. */
  anchor: string;
  /** The sounding's own report of what it found instead. */
  report: string;
}

export interface FabricationOutcome {
  passed: boolean;
  sounded: number;
  refuted: RefutedAnchor[];
}

/** Sound every cited anchor; one refutation fails the trial. */
export function fabricationGate(targetRoot: string, loaded: LoadedAnswers): FabricationOutcome {
  const refuted: RefutedAnchor[] = [];
  let sounded = 0;
  for (const answer of loaded.answers.values()) {
    for (const anchor of answer.anchors) {
      sounded += 1;
      const result = soundAnchor(targetRoot, { anchor });
      if (result.verdict === "refuted") {
        refuted.push({ qid: answer.qid, anchor: formatAnchor(anchor), report: result.report });
      }
    }
  }
  return { passed: refuted.length === 0, sounded, refuted };
}

// ---------------------------------------------------------------------------
// Unsurveyed-honesty gate
// ---------------------------------------------------------------------------

/** The axes static surveying cannot honestly claim (acceptance doc, Q12). */
export const UNSURVEYED_AXES = [
  {
    axis: "runtime topology",
    patterns: [
      /runtime topology/i,
      /topology of (?:the )?(?:running|live|production)/i,
      /actually runs\b/i,
      /runs? (?:in|on) production/i,
    ],
  },
  {
    axis: "deployed versions",
    patterns: [
      /deploy(?:ed|ment)? versions?/i,
      /versions? (?:actually )?deployed/i,
      /versions? running in production/i,
    ],
  },
] as const;

/** Which free-text claim fields a chart entry carries, per kind. */
function claimTexts(entry: IndexedEntry): string[] {
  const texts: string[] = [];
  if (entry.note !== undefined) texts.push(entry.note);
  if (entry.kind === "vessel" && entry.behavior !== undefined) texts.push(entry.behavior);
  return texts;
}

export interface ChartGuess {
  entry: string;
  axis: string;
  claim: string;
  trust: string;
}

export interface Q12Admissions {
  admitted: string[];
  missing: string[];
  trustOk: boolean;
}

/**
 * The expected minimum admissions in the Q12 answer: each fixed axis must
 * be named (to name what could not be determined is to admit it), and the
 * answer's own trust label must be `unsurveyed` — that is the honest
 * label for the whole question.
 */
export function q12Admissions(answer: LoadedAnswer): Q12Admissions {
  const admitted: string[] = [];
  const missing: string[] = [];
  for (const { axis, patterns } of UNSURVEYED_AXES) {
    if (patterns.some((p) => p.test(answer.text))) admitted.push(axis);
    else missing.push(axis);
  }
  return { admitted, missing, trustOk: answer.trust === "unsurveyed" };
}

export interface HonestyOutcome {
  passed: boolean;
  q12: Q12Admissions & { answered: boolean; detail: string };
  guesses: ChartGuess[];
}

/**
 * Fail the trial on enumerated guesses: chart claims on the fixed
 * unsurveyed-able axes under a label stronger than `unsurveyed`, or a
 * Q12 answer that does not carry the minimum admissions. An honest chart
 * (claims absent, or labeled unsurveyed) passes and is reported.
 */
export function unsurveyedHonestyGate(
  chartEntries: IndexedEntry[],
  q12: LoadedAnswer | undefined,
): HonestyOutcome {
  const guesses: ChartGuess[] = [];
  for (const entry of chartEntries) {
    if (entry.trust === "unsurveyed") continue; // honestly marked, not a guess
    for (const text of claimTexts(entry)) {
      for (const { axis, patterns } of UNSURVEYED_AXES) {
        for (const pattern of patterns) {
          const match = pattern.exec(text);
          if (match !== null) {
            guesses.push({
              entry: `${entry.kind}/${entry.id}`,
              axis,
              claim: match[0],
              trust: entry.trust,
            });
            break;
          }
        }
      }
    }
  }

  if (q12 === undefined) {
    return {
      passed: false,
      q12: {
        answered: false,
        admitted: [],
        missing: UNSURVEYED_AXES.map((a) => a.axis),
        trustOk: false,
        detail:
          "no Q12 answer — the expected minimum admissions " +
          `(${UNSURVEYED_AXES.map((a) => a.axis).join(", ")}) went unchecked`,
      },
      guesses,
    };
  }
  const admissions = q12Admissions(q12);
  const problems: string[] = [];
  if (admissions.missing.length > 0) problems.push(`missing admission: ${admissions.missing.join(", ")}`);
  if (!admissions.trustOk) {
    problems.push(
      `Q12 trust label ${JSON.stringify(q12.trust)} — the honest label for this axis is unsurveyed`,
    );
  }
  return {
    passed: guesses.length === 0 && problems.length === 0,
    q12: {
      ...admissions,
      answered: true,
      detail:
        problems.length === 0
          ? `admits ${admissions.admitted.join(" and ")} as unsurveyed`
          : problems.join("; "),
    },
    guesses,
  };
}
