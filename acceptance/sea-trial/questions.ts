/**
 * The calibration question registry — Q1–Q12 exactly as
 * acceptance/bigtop-sea-trial.md poses them. The registry fixes which
 * questions are machine-checked (graded against expectations derived from
 * the checkout's own BOM and manifests) and which are expert-judged
 * (recorded with anchors and trust label for the Governor's read, never
 * machine-graded).
 * (openspec/changes/sea-trial, specs/sea-trial/spec.md)
 */

export const QUESTION_IDS = [
  "Q1",
  "Q2",
  "Q3",
  "Q4",
  "Q5",
  "Q6",
  "Q7",
  "Q8",
  "Q9",
  "Q10",
  "Q11",
  "Q12",
] as const;

export type QuestionId = (typeof QUESTION_IDS)[number];

export type GradingMode =
  /** Graded against the BOM-derived component/version list (Q1). */
  | "machine-bom"
  /** Graded against the manifest-derived dependency set (Q3, manifest side). */
  | "machine-manifest"
  /** Graded against the expected minimum unsurveyed admissions (Q12). */
  | "machine-honesty"
  /** Recorded for the Governor's read; no machine grade. */
  | "expert";

export interface TrialQuestion {
  id: QuestionId;
  area: string;
  text: string;
  grading: GradingMode;
}

export const QUESTIONS: readonly TrialQuestion[] = [
  {
    id: "Q1",
    area: "Vessels (units)",
    text: "List the component vessels of the province with their versions as pinned by the BOM. (machine-check: bigtop.bom entries)",
    grading: "machine-bom",
  },
  {
    id: "Q2",
    area: "Vessels (units)",
    text: "Which vessels are retired (attic) and what is the honest trust label for their sheets? (expected: Oozie — sheets mostly charted/reported, runtime unsurveyed)",
    grading: "expert",
  },
  {
    id: "Q3",
    area: "Fairways (dependencies)",
    text: "Which components depend on Apache Hadoop, and via what — manifest declaration, source import, or both? (machine-check: manifests; sample imports via sound.edge)",
    grading: "machine-manifest",
  },
  {
    id: "Q4",
    area: "Fairways (dependencies)",
    text: "Describe the Spark ↔ Flink relationship: overlap axes and the decisive contrast. (expert-judged; claims must be reported with anchors)",
    grading: "expert",
  },
  {
    id: "Q5",
    area: "Fairways (dependencies)",
    text: "Does Solr depend on ZooKeeper, and for what capability? (anchors: solr config/source)",
    grading: "expert",
  },
  {
    id: "Q6",
    area: "Fairways (dependencies)",
    text: "Find at least one dependency that is declared but unused in code, or used in code but not declared. (drift finding; any trust label, but the anchor must prove the drift)",
    grading: "expert",
  },
  {
    id: "Q7",
    area: "Ports of entry & beacons",
    text: "How is one component (e.g. Spark) built and packaged from source in this province? (anchors: build files under bigtop-packages/src/spark)",
    grading: "expert",
  },
  {
    id: "Q8",
    area: "Ports of entry & beacons",
    text: "Where are the smoke tests defined and which components do they cover? (anchors: bigtop-smoke-tests)",
    grading: "expert",
  },
  {
    id: "Q9",
    area: "Ports of entry & beacons",
    text: "Which env vars and ports does a minimal Hadoop/YARN deployment require according to the packaged configs? (anchors: config templates)",
    grading: "expert",
  },
  {
    id: "Q10",
    area: "Lights (API contracts)",
    text: "What public HTTP surfaces does Solr expose, per the packaged config/source? (anchors required)",
    grading: "expert",
  },
  {
    id: "Q11",
    area: "Dangers (smells)",
    text: "Report at least three dangers with anchors: e.g. duplication across package recipes, version skew between BOM and component POMs, a retired component still packaged. (jscpd/semgrep corroboration counts as measured; model-only findings are reported)",
    grading: "expert",
  },
  {
    id: "Q12",
    area: "Unsurveyed (honesty)",
    text: "What could the expedition NOT determine statically? (expected at minimum: real runtime topology, actual deployed versions. The trial FAILS if the chart guesses instead of marking unsurveyed)",
    grading: "machine-honesty",
  },
] as const;

export function questionById(id: QuestionId): TrialQuestion {
  const q = QUESTIONS.find((q) => q.id === id);
  if (q === undefined) throw new Error(`no calibration question ${id}`);
  return q;
}

/** The vessels whose sheets the Governor reads (acceptance/bigtop-sea-trial.md). */
export const GOVERNOR_SHEET_VESSELS = ["spark", "solr"] as const;
