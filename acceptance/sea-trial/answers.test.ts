/**
 * Answers-artifact loading tests (sea-trial tasks.md 2.1): an answer
 * missing its anchor or its trust label grades unanswered-and-failing
 * (a rules problem, not a load error); a structurally broken artifact
 * fails the load loudly.
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { AnswersArtifactError, loadAnswers } from "./answers";

function writeArtifact(lines: unknown[]): string {
  const dir = join(tmpdir(), `portolan-sea-trial-answers-${crypto.randomUUID()}`);
  mkdirSync(dir, { recursive: true });
  const path = join(dir, "answers.jsonl");
  writeFileSync(path, lines.map((l) => JSON.stringify(l)).join("\n") + "\n");
  return path;
}

const GOOD_ANCHOR = { type: "file", path: "repos/apache-spark/pom.xml" } as const;

describe("loadAnswers", () => {
  test("loads a rules-compliant line with claims", () => {
    const path = writeArtifact([
      {
        qid: "Q1",
        text: "The BOM pins zookeeper 3.8.4 and hadoop 3.4.3.",
        anchors: [GOOD_ANCHOR],
        trust: "charted",
        claims: { zookeeper: "3.8.4", hadoop: "3.4.3" },
      },
    ]);
    const loaded = loadAnswers(path);
    expect(loaded.absent).toBe(false);
    expect(loaded.hash).toMatch(/^[0-9a-f]{64}$/);
    const q1 = loaded.answers.get("Q1")!;
    expect(q1.problems).toEqual([]);
    expect(q1.trust).toBe("charted");
    expect(q1.claims).toEqual({ zookeeper: "3.8.4", hadoop: "3.4.3" });
  });

  test("an answer without anchors is loaded but graded unanswered", () => {
    const path = writeArtifact([
      { qid: "Q5", text: "Solr uses ZooKeeper for coordination.", trust: "charted" },
    ]);
    const q5 = loadAnswers(path).answers.get("Q5")!;
    expect(q5.problems.join(" ")).toMatch(/no anchor/);
  });

  test("an answer without a trust label is loaded but graded unanswered", () => {
    const path = writeArtifact([
      { qid: "Q5", text: "Solr uses ZooKeeper for coordination.", anchors: [GOOD_ANCHOR] },
    ]);
    const q5 = loadAnswers(path).answers.get("Q5")!;
    expect(q5.problems.join(" ")).toMatch(/no trust label/);
  });

  test("a trust label outside the vocabulary is a rules problem", () => {
    const path = writeArtifact([
      {
        qid: "Q5",
        text: "Solr uses ZooKeeper for coordination.",
        anchors: [GOOD_ANCHOR],
        trust: "certain",
      },
    ]);
    const q5 = loadAnswers(path).answers.get("Q5")!;
    expect(q5.problems.join(" ")).toMatch(/outside the vocabulary/);
  });

  test("an anchor that is not citable is a rules problem", () => {
    const path = writeArtifact([
      {
        qid: "Q5",
        text: "Solr uses ZooKeeper for coordination.",
        anchors: [{ type: "file", line: 3 }],
        trust: "measured",
      },
    ]);
    const q5 = loadAnswers(path).answers.get("Q5")!;
    expect(q5.problems.join(" ")).toMatch(/not citable/);
    expect(q5.anchors).toEqual([]); // nothing soundable
  });

  test("a missing artifact is an honest empty load", () => {
    const loaded = loadAnswers(join(tmpdir(), "portolan-nowhere", "answers.jsonl"));
    expect(loaded.absent).toBe(true);
    expect(loaded.hash).toBe("absent");
    expect(loaded.answers.size).toBe(0);
  });

  test("a corrupt line fails the load loudly", () => {
    const dir = join(tmpdir(), `portolan-sea-trial-answers-${crypto.randomUUID()}`);
    mkdirSync(dir, { recursive: true });
    const path = join(dir, "answers.jsonl");
    writeFileSync(path, "{not json}\n");
    expect(() => loadAnswers(path)).toThrow(AnswersArtifactError);
    expect(() => loadAnswers(path)).toThrow(/line 1: not JSON/);
  });

  test("an unknown question id fails the load loudly", () => {
    const path = writeArtifact([
      { qid: "Q13", text: "made up", anchors: [GOOD_ANCHOR], trust: "charted" },
    ]);
    expect(() => loadAnswers(path)).toThrow(/unknown question id "Q13"/);
  });

  test("a duplicate answer fails the load loudly", () => {
    const path = writeArtifact([
      { qid: "Q5", text: "one", anchors: [GOOD_ANCHOR], trust: "charted" },
      { qid: "Q5", text: "two", anchors: [GOOD_ANCHOR], trust: "charted" },
    ]);
    expect(() => loadAnswers(path)).toThrow(/duplicate answer for Q5/);
  });
});
