/**
 * H3 quiet session brief (process-hooks 2.1, design D2/D4; serves the J1
 * briefing mandate).
 *
 * SessionStart hook: run the read-only harbor queue read and the change
 * list; inject a compact briefing as additionalContext ONLY when one of
 * them is non-empty — an all-quiet province prints nothing (the quiet
 * rule, design D2). The decision round itself stays the agent's; the hook
 * implements the mandate, it does not replace the ritual.
 *
 * Failure-tolerant: a subcommand that fails or is missing skips its part;
 * if both parts end up empty, stdout stays empty. Always exits 0 (soft
 * phase — never blocks). cwd-free: everything anchors on
 * ZCODE_PROJECT_DIR, injected by the harness as env.
 */

interface ChangeEntry {
  name: string;
  status: string;
  completedTasks: number;
  totalTasks: number;
}

/**
 * The briefing text, or null when the province is all-quiet (print
 * nothing): no active changes AND an empty harbor queue.
 */
export function buildBrief(
  openspecJson: string | null,
  harborChat: string | null,
): string | null {
  const changes = parseChanges(openspecJson);
  const harbor = harborChat?.trim() ?? "";
  if (changes.length === 0 && harbor === "") return null;
  const parts: string[] = [];
  if (harbor !== "") {
    parts.push(`Harbor queue (decide with expeditions.decide):\n${harbor}`);
  }
  if (changes.length > 0) {
    const lines = changes.map(
      (c) => `- ${c.name} — ${c.status}, ${c.completedTasks}/${c.totalTasks} tasks`,
    );
    parts.push(`Active changes (openspec):\n${lines.join("\n")}`);
  }
  return parts.join("\n\n");
}

function parseChanges(openspecJson: string | null): ChangeEntry[] {
  if (!openspecJson) return [];
  try {
    const parsed: unknown = JSON.parse(openspecJson);
    const list = (parsed as { changes?: unknown }).changes;
    if (!Array.isArray(list)) return [];
    return list.flatMap((c) => {
      const rec = c as Record<string, unknown>;
      if (typeof rec.name !== "string") return [];
      return [
        {
          name: rec.name,
          status: typeof rec.status === "string" ? rec.status : "unknown",
          completedTasks:
            typeof rec.completedTasks === "number" ? rec.completedTasks : 0,
          totalTasks: typeof rec.totalTasks === "number" ? rec.totalTasks : 0,
        },
      ];
    });
  } catch {
    return [];
  }
}

/** The hook output envelope: additionalContext under the strict-schema key. */
export function renderHookOutput(brief: string): string {
  return JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: brief,
    },
  });
}

function main(): void {
  const root = process.env.ZCODE_PROJECT_DIR;
  if (!root) return; // no province known — stay quiet
  let openspecJson: string | null = null;
  let harborChat: string | null = null;
  try {
    const run = Bun.spawnSync(["openspec", "list", "--json"], {
      cwd: root,
      stdout: "pipe",
      stderr: "ignore",
    });
    if (run.exitCode === 0) openspecJson = run.stdout.toString();
  } catch {
    // openspec missing or failing — skip the change-list part
  }
  try {
    const run = Bun.spawnSync(
      [
        "bun",
        `${root}/core/src/harbor/cli.ts`,
        "propose",
        "--target",
        root,
        "--format",
        "chat",
      ],
      { cwd: root, stdout: "pipe", stderr: "ignore" },
    );
    if (run.exitCode === 0) harborChat = run.stdout.toString();
  } catch {
    // harbor CLI missing or failing — skip the queue part
  }
  const brief = buildBrief(openspecJson, harborChat);
  if (brief !== null) console.log(renderHookOutput(brief));
}

if (import.meta.main) main();
