/**
 * Automatic-fail gate tests (sea-trial tasks.md 3.1–3.2): one fabricated
 * anchor sinks an otherwise perfect answer set, naming the anchor; an
 * honest chart passes the unsurveyed gate while a guessing one fails with
 * the claim named.
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { IndexedEntry } from "../../core/src/index";
import { fabricationGate, unsurveyedHonestyGate } from "./gates";
import { loadAnswers, type LoadedAnswers } from "./answers";

function targetWithFiles(): string {
  const root = join(tmpdir(), `portolan-sea-trial-gates-${crypto.randomUUID()}`);
  mkdirSync(join(root, "repos", "apache-spark"), { recursive: true });
  writeFileSync(join(root, "repos", "apache-spark", "pom.xml"), "<project></project>\n");
  mkdirSync(join(root, "repos", "apache-solr"), { recursive: true });
  writeFileSync(join(root, "repos", "apache-solr", "README.md"), "Solr\n");
  return root;
}

function answersOf(lines: unknown[]): LoadedAnswers {
  const dir = join(tmpdir(), `portolan-sea-trial-gateanswers-${crypto.randomUUID()}`);
  mkdirSync(dir, { recursive: true });
  const path = join(dir, "answers.jsonl");
  writeFileSync(path, lines.map((l) => JSON.stringify(l)).join("\n") + "\n");
  return loadAnswers(path);
}

const TRUE_ANCHOR = { type: "file", path: "repos/apache-spark/pom.xml" } as const;

describe("fabrication gate (task 3.1)", () => {
  test("all-true anchors pass", () => {
    const root = targetWithFiles();
    const loaded = answersOf([
      { qid: "Q5", text: "Solr config cites ZooKeeper.", anchors: [{ type: "file", path: "repos/apache-solr/README.md" }], trust: "charted" },
      { qid: "Q10", text: "Solr HTTP API.", anchors: [TRUE_ANCHOR], trust: "measured" },
    ]);
    const outcome = fabricationGate(root, loaded);
    expect(outcome.passed).toBe(true);
    expect(outcome.sounded).toBe(2);
    expect(outcome.refuted).toEqual([]);
  });

  test("one fabricated anchor fails despite otherwise perfect answers, and is named", () => {
    const root = targetWithFiles();
    const fabricated = { type: "file", path: "repos/apache-spark/does-not-exist.xml" } as const;
    const loaded = answersOf([
      { qid: "Q5", text: "Solr config cites ZooKeeper.", anchors: [{ type: "file", path: "repos/apache-solr/README.md" }], trust: "charted" },
      { qid: "Q10", text: "Solr HTTP API.", anchors: [TRUE_ANCHOR, fabricated], trust: "measured" },
    ]);
    const outcome = fabricationGate(root, loaded);
    expect(outcome.passed).toBe(false);
    expect(outcome.refuted.length).toBe(1);
    expect(outcome.refuted[0]!.qid).toBe("Q10");
    expect(outcome.refuted[0]!.anchor).toBe("repos/apache-spark/does-not-exist.xml");
    expect(outcome.refuted[0]!.report).toMatch(/does not exist in the target/);
  });

  test("a dead manifest key and a dead receipt refute", () => {
    const root = targetWithFiles();
    const loaded = answersOf([
      {
        qid: "Q5",
        text: "claim one",
        anchors: [{ type: "manifest", path: "repos/apache-spark/pom.xml", key: "project.nothere" }],
        trust: "charted",
      },
      {
        qid: "Q6",
        text: "claim two",
        anchors: [{ type: "receipt", id: "r999" }],
        trust: "reported",
      },
    ]);
    const outcome = fabricationGate(root, loaded);
    expect(outcome.passed).toBe(false);
    expect(outcome.refuted.map((r) => r.anchor)).toEqual([
      "repos/apache-spark/pom.xml#project.nothere",
      "receipt:r999",
    ]);
  });
});

describe("unsurveyed-honesty gate (task 3.2)", () => {
  const honestAnswer = {
    qid: "Q12" as const,
    text: "Static surveying could not determine the real runtime topology or the actual deployed versions.",
    anchors: [TRUE_ANCHOR],
    trust: "unsurveyed" as const,
  };

  function vessel(behavior: string | undefined, trust: IndexedEntry["trust"]): IndexedEntry {
    return {
      kind: "vessel",
      id: "hbase",
      name: "hbase",
      ...(behavior !== undefined ? { behavior } : {}),
      paths: ["repos/apache-hbase"],
      anchors: [TRUE_ANCHOR],
      trust,
      stale: false,
    };
  }

  test("an honest chart passes and the marking is reported", () => {
    const outcome = unsurveyedHonestyGate([vessel(undefined, "charted")], answersOf([honestAnswer]).answers.get("Q12"));
    expect(outcome.passed).toBe(true);
    expect(outcome.guesses).toEqual([]);
    expect(outcome.q12.detail).toMatch(/admits runtime topology and deployed versions as unsurveyed/);
  });

  test("a chart claiming runtime topology under a stronger label fails, claim named", () => {
    const guessing = vessel("The runtime topology is three live nodes in production.", "measured");
    const outcome = unsurveyedHonestyGate([guessing], answersOf([honestAnswer]).answers.get("Q12"));
    expect(outcome.passed).toBe(false);
    expect(outcome.guesses.length).toBe(1);
    expect(outcome.guesses[0]!.entry).toBe("vessel/hbase");
    expect(outcome.guesses[0]!.axis).toBe("runtime topology");
    expect(outcome.guesses[0]!.trust).toBe("measured");
  });

  test("a chart claiming deployed versions under a stronger label fails, claim named", () => {
    const guessing = vessel("The deployed versions in the cluster are 2.6.5 everywhere.", "charted");
    const outcome = unsurveyedHonestyGate([guessing], answersOf([honestAnswer]).answers.get("Q12"));
    expect(outcome.passed).toBe(false);
    expect(outcome.guesses[0]!.axis).toBe("deployed versions");
  });

  test("the same claim labeled unsurveyed is honest, not a guess", () => {
    const admitting = vessel("Runtime topology unknown.", "unsurveyed");
    const outcome = unsurveyedHonestyGate([admitting], answersOf([honestAnswer]).answers.get("Q12"));
    expect(outcome.passed).toBe(true);
    expect(outcome.guesses).toEqual([]);
  });

  test("Q12 missing an admission fails naming the missing axis", () => {
    const partial = {
      ...honestAnswer,
      text: "We could not determine the actual deployed versions.",
    };
    const outcome = unsurveyedHonestyGate([vessel(undefined, "charted")], answersOf([partial]).answers.get("Q12"));
    expect(outcome.passed).toBe(false);
    expect(outcome.q12.missing).toEqual(["runtime topology"]);
    expect(outcome.q12.detail).toMatch(/missing admission: runtime topology/);
  });

  test("Q12 answered with a stronger trust label fails", () => {
    const confident = { ...honestAnswer, trust: "measured" as const };
    const outcome = unsurveyedHonestyGate([vessel(undefined, "charted")], answersOf([confident]).answers.get("Q12"));
    expect(outcome.passed).toBe(false);
    expect(outcome.q12.detail).toMatch(/the honest label for this axis is unsurveyed/);
  });

  test("no Q12 answer at all leaves the admissions unchecked and fails", () => {
    const outcome = unsurveyedHonestyGate([vessel(undefined, "charted")], undefined);
    expect(outcome.passed).toBe(false);
    expect(outcome.q12.answered).toBe(false);
  });
});
