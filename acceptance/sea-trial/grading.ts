/**
 * Calibration grading (sea-trial tasks.md 2.1–2.3). Every question gets a
 * grade: machine-checked questions (Q1 against the BOM, Q3 against the
 * manifest-derived set, Q12 against the expected unsurveyed admissions)
 * are compared with the derived expectation, which is always named in the
 * detail; expert-judged questions are recorded with their anchors and
 * trust label for the Governor's read — never machine-graded. An answer
 * that breaks the answer rules (no anchor, no trust label) grades as
 * unanswered and counts against the trial.
 */
import type { Anchor } from "../../core/src/index";
import type { Bom } from "./bom";
import type { LoadedAnswer, LoadedAnswers } from "./answers";
import { QUESTIONS, type QuestionId } from "./questions";
import type { ManifestDerivation } from "./oracle";
import { q12Admissions, UNSURVEYED_AXES } from "./gates";

export type GradeOutcome = "pass" | "fail" | "unanswered" | "deferred";

export interface QuestionGrade {
  qid: QuestionId;
  area: string;
  mode: "machine" | "expert";
  outcome: GradeOutcome;
  detail: string;
  /** The expectation the grade was measured against (machine questions). */
  expectation?: string;
  /** Anchors and trust label as recorded for the Governor (expert questions). */
  anchors?: Anchor[];
  trust?: string;
}

export interface GradingResult {
  grades: QuestionGrade[];
  machineFailures: QuestionGrade[];
  unanswered: QuestionGrade[];
}

function unansweredGrade(qid: QuestionId, area: string, detail: string): QuestionGrade {
  return { qid, area, mode: "machine", outcome: "unanswered", detail };
}

function gradeQ1(bom: Bom, answer: LoadedAnswer): QuestionGrade {
  const area = "Vessels (units)";
  const expected = new Map(bom.components.map((c) => [c.label, c.versionBase]));
  const expectation =
    `${bom.components.length} components pinned by bigtop.bom: ` +
    bom.components.map((c) => `${c.label} ${c.versionBase}`).join(", ");
  if (answer.claims === undefined) {
    return {
      qid: "Q1",
      area,
      mode: "machine",
      outcome: "fail",
      expectation,
      detail: "no claims on a machine-checked question — expected { component: version }; " + expectation,
    };
  }
  const problems: string[] = [];
  for (const comp of bom.components) {
    const got = answer.claims[comp.label];
    if (got === undefined) {
      problems.push(`missing ${comp.label} (${comp.versionBase})`);
    } else if (got !== comp.versionBase) {
      problems.push(`expected ${comp.label} ${comp.versionBase}, got ${got}`);
    }
  }
  for (const label of Object.keys(answer.claims)) {
    if (!expected.has(label)) {
      problems.push(`${JSON.stringify(label)} is not a component pinned by bigtop.bom`);
    }
  }
  return {
    qid: "Q1",
    area,
    mode: "machine",
    outcome: problems.length === 0 ? "pass" : "fail",
    expectation,
    detail:
      problems.length === 0
        ? `all ${bom.components.length} BOM components listed with the pinned versions`
        : problems.join("; "),
  };
}

function gradeQ3(derivation: ManifestDerivation, answer: LoadedAnswer): QuestionGrade {
  const area = "Fairways (dependencies)";
  const expected = new Set(derivation.dependents);
  const expectation =
    `manifest-derived hadoop dependents (${derivation.manifestsRead} manifests read` +
    `${derivation.caveats.length > 0 ? `, ${derivation.caveats.length} caveats` : ""}): ` +
    (derivation.dependents.length > 0 ? derivation.dependents.join(", ") : "(none)");
  if (answer.claims === undefined) {
    return {
      qid: "Q3",
      area,
      mode: "machine",
      outcome: "fail",
      expectation,
      detail:
        "no claims on a machine-checked question — expected { component: manifest|import|both }; " +
        expectation,
    };
  }
  const claimed = new Set(
    Object.entries(answer.claims)
      .filter(([, via]) => via === "manifest" || via === "both")
      .map(([label]) => label),
  );
  const problems: string[] = [];
  for (const label of [...expected].sort()) {
    if (!claimed.has(label)) {
      problems.push(`expected ${label} to be claimed via manifest (it declares hadoop)`);
    }
  }
  for (const label of [...claimed].sort()) {
    if (!expected.has(label)) {
      problems.push(
        `no hadoop declaration found in ${JSON.stringify(label)}'s manifests — ` +
          `the derived set is: ${[...expected].sort().join(", ") || "(none)"}`,
      );
    }
  }
  return {
    qid: "Q3",
    area,
    mode: "machine",
    outcome: problems.length === 0 ? "pass" : "fail",
    expectation,
    detail:
      problems.length === 0
        ? `manifest side matches the derived set (${derivation.dependents.length} components)`
        : problems.join("; "),
  };
}

function gradeQ12(answer: LoadedAnswer): QuestionGrade {
  const area = "Unsurveyed (honesty)";
  const admissions = q12Admissions(answer);
  const trustOk = answer.trust === "unsurveyed";
  const expectation =
    `minimum admissions marked unsurveyed: ${UNSURVEYED_AXES.map((a) => a.axis).join(", ")}`;
  if (admissions.missing.length === 0 && trustOk) {
    return {
      qid: "Q12",
      area,
      mode: "machine",
      outcome: "pass",
      expectation,
      detail: `admits ${admissions.admitted.join(" and ")} as unsurveyed`,
    };
  }
  const problems: string[] = [];
  if (admissions.missing.length > 0) {
    problems.push(`missing admission: ${admissions.missing.join(", ")}`);
  }
  if (!trustOk) {
    problems.push(
      `trust label ${JSON.stringify(answer.trust)} — the honest label on this axis is unsurveyed`,
    );
  }
  return {
    qid: "Q12",
    area,
    mode: "machine",
    outcome: "fail",
    expectation,
    detail: problems.join("; "),
  };
}

/**
 * Grade every calibration question Q1–Q12 against the loaded answers.
 * Questions without an answer line, or with answer-rule problems, grade
 * unanswered; expert-judged questions are recorded, not graded.
 */
export function gradeAnswers(bom: Bom, derivation: ManifestDerivation, loaded: LoadedAnswers): GradingResult {
  const grades: QuestionGrade[] = [];
  for (const question of QUESTIONS) {
    const answer = loaded.answers.get(question.id);
    if (answer === undefined) {
      grades.push(
        unansweredGrade(question.id, question.area, "no answer line in the artifact"),
      );
      continue;
    }
    if (answer.problems.length > 0) {
      grades.push(
        unansweredGrade(question.id, question.area, answer.problems.join("; ")),
      );
      continue;
    }
    switch (question.grading) {
      case "machine-bom":
        grades.push(gradeQ1(bom, answer));
        break;
      case "machine-manifest":
        grades.push(gradeQ3(derivation, answer));
        break;
      case "machine-honesty":
        grades.push(gradeQ12(answer));
        break;
      case "expert": {
        grades.push({
          qid: question.id,
          area: question.area,
          mode: "expert",
          outcome: "deferred",
          detail: "recorded for the Governor's read — no machine grade",
          anchors: answer.anchors,
          trust: answer.trust,
        });
        break;
      }
    }
  }
  return {
    grades,
    machineFailures: grades.filter((g) => g.mode === "machine" && g.outcome === "fail"),
    unanswered: grades.filter((g) => g.outcome === "unanswered"),
  };
}
