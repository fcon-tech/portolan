import { expect, test } from "bun:test";
import { buildBrief, renderHookOutput } from "./session-brief";

// H3's quiet/emit decision (design D2), as a pure function.

const oneChange = JSON.stringify({
  changes: [
    { name: "process-hooks", status: "in-progress", completedTasks: 0, totalTasks: 5 },
  ],
});

test("quiet rule: an all-quiet province prints nothing", () => {
  expect(buildBrief(null, null)).toBeNull();
  expect(buildBrief('{"changes":[]}', null)).toBeNull();
  expect(buildBrief('{"changes":[]}', "")).toBeNull();
  expect(buildBrief('{"changes":[]}', "  \n")).toBeNull();
  expect(buildBrief(null, "")).toBeNull();
});

test("changes only: active changes section, no harbor section", () => {
  const brief = buildBrief(oneChange, null);
  expect(brief).toContain("Active changes");
  expect(brief).toContain("process-hooks — in-progress, 0/5 tasks");
  expect(brief).not.toContain("Harbor queue");
});

test("harbor only: openspec failure skips the change list", () => {
  const brief = buildBrief(null, "Portolan harbor — 1 expedition proposal for this province.");
  expect(brief).toContain("Harbor queue");
  expect(brief).toContain("1 expedition proposal");
  expect(brief).not.toContain("Active changes");
});

test("both parts: harbor queue first, changes second, one block", () => {
  const brief = buildBrief(oneChange, "queue text");
  expect(brief).not.toBeNull();
  expect(brief!.indexOf("Harbor queue")).toBeLessThan(brief!.indexOf("Active changes"));
  expect(brief).not.toMatch(/\n{3,}/);
});

test("malformed openspec output is tolerated as no-information", () => {
  expect(buildBrief("not json", "queue text")).toContain("Harbor queue");
  expect(buildBrief("not json", null)).toBeNull();
});

test("output envelope carries the SessionStart additionalContext", () => {
  const parsed = JSON.parse(renderHookOutput("brief text")) as {
    hookSpecificOutput: { hookEventName: string; additionalContext: string };
  };
  expect(parsed.hookSpecificOutput.hookEventName).toBe("SessionStart");
  expect(parsed.hookSpecificOutput.additionalContext).toBe("brief text");
});
