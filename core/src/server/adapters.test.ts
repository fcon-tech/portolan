/**
 * Adapter verification (tasks.md 4.1, 4.2; specs/harness: "opencode is the
 * first adapter, shims follow" + "Two harnesses see the same server").
 *
 * - The opencode adapter is launch configuration only: the test installs it
 *   into a sandbox config, then executes the exact launch line that config
 *   declares — and the server that comes up lists all nine tools.
 * - The pi and omp shims exec the same server: tool lists and one result
 *   per launch are compared, deep-equal, against a direct launch.
 * - When the real opencode binary is present, the sandbox install is
 *   additionally confirmed by opencode itself (`opencode mcp list` reports
 *   the server connected).
 */
import { test, expect } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { childEnv, makeProvince, structuredOf, withServer } from "./test-harness";
import { V1_TOOL_NAMES } from "./registry";
import { readManifest } from "../tools/manifests";
import { soundAnchor } from "../tools/sound";
import { findBinary } from "../tools/shared";

const REPO_ROOT = join(import.meta.dir, "..", "..", "..");
const OPENCODE_INSTALL = join(REPO_ROOT, "adapters", "opencode", "install.ts");
const PI_SHIM = join(REPO_ROOT, "adapters", "pi", "portolan-mcp");
const OMP_SHIM = join(REPO_ROOT, "adapters", "omp", "portolan-mcp");

/** Install the opencode adapter into a sandbox config; return its parsed JSON. */
function installOpencode(province: string): { configPath: string; config: Record<string, unknown> } {
  const sandbox = mkdtempSync(join(tmpdir(), "portolan-opencode-"));
  const configPath = join(sandbox, "opencode.jsonc");
  const run = spawnSync(
    process.execPath,
    [OPENCODE_INSTALL, "--target", province, "--config", configPath],
    { encoding: "utf8", env: childEnv() },
  );
  expect(run.status).toBe(0);
  const config = JSON.parse(readFileSync(configPath, "utf8")) as Record<string, unknown>;
  return { configPath, config };
}

/** The launch line the opencode config declares, as a spawn vector. */
function openCodeLaunch(config: Record<string, unknown>): { command: string; args: string[] } {
  const mcp = config.mcp as Record<string, { type: string; command: string[] }>;
  const entry = mcp.portolan;
  expect(entry.type).toBe("local");
  expect(entry.command.length).toBe(4);
  expect(entry.command[2]).toBe("--target");
  return { command: entry.command[0]!, args: entry.command.slice(1) };
}

/** What one launch observes: the full tool list plus two read-only results. */
interface Observation {
  tools: string[];
  manifests: unknown;
  anchorSounding: unknown;
}

async function observe(
  launch: { command: string; args: string[] },
  province: string,
  direct: { manifests: unknown; anchorSounding: unknown },
): Promise<Observation> {
  let observation: Observation | undefined;
  await withServer({ targetRoot: province, command: launch }, async (client) => {
    const listed = await client.listTools();
    const manifests = await client.callTool({
      name: "manifests",
      arguments: { path: "package.json" },
    });
    const anchorSounding = await client.callTool({
      name: "sound.anchor",
      arguments: { anchor: { type: "file", path: "src/cart.ts", line: 4 } },
    });
    observation = {
      tools: listed.tools.map((tool) => tool.name),
      manifests: structuredOf(manifests),
      anchorSounding: structuredOf(anchorSounding),
    };
  });
  expect(observation).toBeDefined();
  expect(observation!.manifests).toEqual(direct.manifests);
  expect(observation!.anchorSounding).toEqual(direct.anchorSounding);
  return observation!;
}

test("the opencode adapter's installed launch line lists all nine tools", async () => {
  const province = makeProvince();
  const { config } = installOpencode(province);
  const launch = openCodeLaunch(config);
  // The config's launch line is bound to the province it was installed for.
  expect(launch.args[2]).toBe(province);
  const observation = await observe(launch, province, {
    manifests: readManifest(province, "package.json"),
    anchorSounding: soundAnchor(province, { anchor: { type: "file", path: "src/cart.ts", line: 4 } }),
  });
  expect(observation.tools).toEqual(V1_TOOL_NAMES);
});

test("pi and omp shims reach the same server a direct launch gives you", async () => {
  const province = makeProvince();
  const direct = {
    manifests: readManifest(province, "package.json"),
    anchorSounding: soundAnchor(province, { anchor: { type: "file", path: "src/cart.ts", line: 4 } }),
  };

  const observations: Record<string, Observation> = {};
  observations.direct = await observe(
    { command: process.execPath, args: [join(import.meta.dir, "main.ts"), "--target", province] },
    province,
    direct,
  );
  observations.pi = await observe({ command: "bash", args: [PI_SHIM, "--target", province] }, province, direct);
  observations.omp = await observe({ command: "bash", args: [OMP_SHIM, "--target", province] }, province, direct);

  // An adapter adds no behavior: tool list and results are indistinguishable.
  expect(observations.pi).toEqual(observations.direct);
  expect(observations.omp).toEqual(observations.direct);
  expect(observations.pi.tools).toEqual(V1_TOOL_NAMES);
});

const opencodeBinary = findBinary("opencode");

test.skipIf(opencodeBinary === undefined)(
  "opencode itself connects to the installed server in a sandbox",
  async () => {
    const province = makeProvince();
    const sandbox = mkdtempSync(join(tmpdir(), "portolan-opencode-live-"));
    try {
      const env = childEnv();
      env.XDG_CONFIG_HOME = join(sandbox, "config");
      env.HOME = sandbox;
      const install = spawnSync(
        process.execPath,
        [
          OPENCODE_INSTALL,
          "--target", province,
          "--config", join(sandbox, "config", "opencode", "opencode.jsonc"),
        ],
        { encoding: "utf8", env },
      );
      expect(install.status).toBe(0);

      const listed = spawnSync(opencodeBinary!, ["mcp", "list"], { encoding: "utf8", env, timeout: 45000 });
      expect(listed.status).toBe(0);
      expect(listed.stdout).toContain("portolan");
      expect(listed.stdout).toContain("connected");
    } finally {
      rmSync(sandbox, { recursive: true, force: true });
    }
  },
  90000,
);

// ---------------------------------------------------------------------------
// The installer merges into comment-bearing JSONC without destroying the
// user's file (the first expedition flagged the old strict-JSON refusal as
// danger/adapters-jsonc-refusal).
// ---------------------------------------------------------------------------

test("the opencode installer preserves comments and sibling keys in a JSONC config", () => {
  const sandbox = mkdtempSync(join(tmpdir(), "portolan-opencode-jsonc-"));
  const configPath = join(sandbox, "opencode.jsonc");
  const original = [
    "{",
    "  // my carefully written config",
    '  "$schema": "https://opencode.ai/config.json",',
    '  "mcp": {',
    "    /* keep my server",
    "       multiline comment */",
    '    "web-reader": { "type": "remote", "url": "https://x//y.example/mcp", },',
    "  },",
    '  "theme": "dark", // trailing comma above',
    "}",
    "",
  ].join("\n");
  writeFileSync(configPath, original);

  const run = spawnSync(
    process.execPath,
    [OPENCODE_INSTALL, "--target", REPO_ROOT, "--config", configPath],
    { encoding: "utf8", env: childEnv() },
  );
  expect(run.status).toBe(0);

  const merged = readFileSync(configPath, "utf8");
  // Every comment survives verbatim; the URL's // is a string, not a comment.
  expect(merged).toContain("// my carefully written config");
  expect(merged).toContain("/* keep my server");
  expect(merged).toContain("multiline comment */");
  expect(merged).toContain("https://x//y.example/mcp");
  expect(merged).toContain('"theme": "dark"');
  // The portolan block landed inside mcp; the block itself is plain JSON.
  expect(merged).toContain('"portolan"');
  const blockMatch = merged.match(/"portolan": (\{[^\n]*\})/);
  expect(blockMatch).not.toBeNull();
  const portolan = JSON.parse(blockMatch![1]!) as { type: string; command: string[]; enabled: boolean };
  expect(portolan.type).toBe("local");
  expect(portolan.command.length).toBe(4);
  expect(portolan.enabled).toBe(true);
  // Sibling keys survive: extract web-reader's line the same way (the
  // fixture's trailing commas are legal JSONC, not legal JSON).
  const webReaderText = merged.match(/"web-reader": (\{[^\n]*\})/)![1]!.replace(/,(\s*})/g, "$1");
  const webReader = JSON.parse(webReaderText) as { type: string };
  expect(webReader.type).toBe("remote");

  // Idempotent: a second install does not duplicate the block.
  const rerun = spawnSync(
    process.execPath,
    [OPENCODE_INSTALL, "--target", REPO_ROOT, "--config", configPath],
    { encoding: "utf8", env: childEnv() },
  );
  expect(rerun.status).toBe(0);
  const after = readFileSync(configPath, "utf8");
  expect((after.match(/"portolan"/g) ?? []).length).toBe(1);

  rmSync(sandbox, { recursive: true, force: true });
});

test("the opencode installer replaces an existing portolan block, keeping mcp siblings", () => {
  const sandbox = mkdtempSync(join(tmpdir(), "portolan-opencode-replace-"));
  const configPath = join(sandbox, "opencode.jsonc");
  writeFileSync(
    configPath,
    [
      "{",
      '  "mcp": {',
      '    "portolan": { "type": "local", "command": ["old"], "enabled": false },',
      "    // comment inside mcp",
      '    "other": {}',
      "  }",
      "}",
      "",
    ].join("\n"),
  );

  const run = spawnSync(
    process.execPath,
    [OPENCODE_INSTALL, "--target", REPO_ROOT, "--config", configPath],
    { encoding: "utf8", env: childEnv() },
  );
  expect(run.status).toBe(0);

  const merged = readFileSync(configPath, "utf8");
  expect(merged).toContain('// comment inside mcp');
  expect(merged).toContain('"other"');
  expect(merged).not.toContain('"old"');
  const parsed = JSON.parse(merged.replace(/\/\/[^\n]*/g, "").replace(/,(\s*[}\]])/g, "$1")) as {
    mcp: Record<string, { command?: string[]; enabled?: boolean }>;
  };
  expect(parsed.mcp.portolan?.command?.[0]).not.toBe("old");
  expect(parsed.mcp.portolan?.enabled).toBe(true);

  rmSync(sandbox, { recursive: true, force: true });
});
