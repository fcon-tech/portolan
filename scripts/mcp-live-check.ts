#!/usr/bin/env bun
/**
 * Live end-to-end check of the Portolan MCP server against a real province.
 *
 * Unlike the core test suite (fixture provinces, in-suite assertions), this
 * script plays an external harness: it launches the real entry point over
 * stdio, completes the MCP handshake, and exercises the tool table — the
 * happy paths and the error split — printing a compact report. Exit code is
 * non-zero when any check fails.
 *
 * Usage: bun scripts/mcp-live-check.ts [--target <province root>]
 *
 * Invariants asserted (province-independent): the handshake identifies the
 * server, tools/list serves exactly the fifteen-tool contract, tool errors
 * carry the underlying message with isError and never kill the server, and
 * the province binding refuses redirects. Province facts (queue contents,
 * trust distribution, entry counts) are printed for eyeballing, not
 * asserted — they change with every expedition.
 */
import { parseArgs } from "node:util";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import corePkg from "../core/package.json";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const SERVER_ENTRY = resolve(scriptDir, "../core/src/server/main.ts");

/** The served toolset, per docs/MANIFEST.md — the contract this check guards. */
const EXPECTED_TOOLS = [
  "chart.read",
  "chart.write",
  "chart.render",
  "trust.report",
  "chart.neighborhood",
  "chart.export",
  "sweep",
  "symbols",
  "manifests",
  "sound.edge",
  "sound.anchor",
  "log.append",
  "log.read",
  "expeditions.propose",
  "expeditions.decide",
];

interface CheckResult {
  name: string;
  ok: boolean;
  detail: string;
}

const results: CheckResult[] = [];

async function check(name: string, fn: () => Promise<string>): Promise<void> {
  try {
    const detail = await fn();
    results.push({ name, ok: true, detail });
  } catch (err) {
    results.push({
      name,
      ok: false,
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function eq(actual: unknown, expected: unknown, label: string): void {
  assert(
    JSON.stringify(actual) === JSON.stringify(expected),
    `${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
  );
}

interface CallOutcome {
  structured: Record<string, unknown>;
  /** The verbatim text of a tool error, undefined on success. */
  errorText: string | undefined;
}

/** Call a tool and normalize: success yields structured content; a tool error yields its text. */
async function call(client: Client, name: string, args: Record<string, unknown> = {}): Promise<CallOutcome> {
  const result = (await client.callTool({ name, arguments: args })) as Record<string, unknown>;
  if (result.isError === true) {
    const content = result.content as Array<{ type: string; text?: string }>;
    return { structured: {}, errorText: content.map((part) => part.text ?? "").join("\n") };
  }
  assert(result.structuredContent !== undefined, `${name}: no structured content on success`);
  return { structured: result.structuredContent as Record<string, unknown>, errorText: undefined };
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    allowPositionals: false,
    options: {
      target: { type: "string", default: process.cwd() },
    },
  });
  const targetRoot = resolve(values.target as string);

  const client = new Client({ name: "portolan-live-check", version: "0.0.0" }, { capabilities: {} });
  let stderrText = "";
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [SERVER_ENTRY, "--target", targetRoot],
    stderr: "pipe",
  });
  transport.stderr?.on("data", (chunk: Buffer) => {
    stderrText += chunk.toString("utf8");
  });

  try {
    await client.connect(transport);
  } catch (err) {
    console.error(`failed to connect to the server at ${SERVER_ENTRY}:`, err);
    if (stderrText !== "") console.error("--- server stderr ---\n" + stderrText);
    process.exit(1);
  }

  try {
    await check("handshake identifies the server", async () => {
      const version = client.getServerVersion();
      eq(version.name, "portolan", "server name");
      eq(version.version, corePkg.version, "server version vs core package.json");
      return `portolan ${version.version} serving ${targetRoot}`;
    });

    await check("tools/list serves the fifteen-tool contract", async () => {
      const listed = await client.listTools();
      const names = listed.tools.map((tool) => tool.name);
      const missing = EXPECTED_TOOLS.filter((name) => !names.includes(name));
      const extra = names.filter((name) => !EXPECTED_TOOLS.includes(name));
      assert(missing.length === 0 && extra.length === 0, `missing=${missing} extra=${extra}`);
      for (const tool of listed.tools) {
        assert(
          (tool.inputSchema as { type?: string }).type === "object",
          `tool ${tool.name}: inputSchema is not an object schema`,
        );
      }
      return `${names.length} tools`;
    });

    await check("expeditions.propose reports queue + Pointer status", async () => {
      const { structured } = await call(client, "expeditions.propose");
      const proposals = structured.proposals as Array<Record<string, unknown>>;
      const pointer = structured.pointer as { state: string; version?: string };
      assert(Array.isArray(proposals), "proposals is not an array");
      for (const proposal of proposals) {
        for (const field of ["kind", "fingerprint", "evidence", "anchors", "scope"]) {
          assert(proposal[field] !== undefined, `proposal missing ${field}`);
        }
      }
      eq(pointer.state, "current", "pointer state");
      return `${proposals.length} proposals; pointer ${pointer.state} (${pointer.version ?? "?"})`;
    });

    await check("trust.report: no refuted anchors, no pending corrections", async () => {
      const { structured } = await call(client, "trust.report");
      const anchors = structured.anchors as Record<string, unknown>;
      const staleness = structured.staleness as { pendingVessels: unknown[] };
      const pointer = structured.pointer as { state: string };
      eq(anchors.refuted, 0, "refuted anchors");
      eq((anchors.refutedList as unknown[]).length, 0, "refutedList");
      eq(anchors.sounded, anchors.total, "sounded vs total");
      eq(staleness.pendingVessels.length, 0, "pendingVessels");
      eq(pointer.state, "current", "pointer state");
      return `anchors ${anchors.confirmed}/${anchors.total} confirmed; trust ${JSON.stringify(structured.trust)}`;
    });

    await check("chart.read serves the machine index", async () => {
      const { structured } = await call(client, "chart.read");
      const entries = structured.entries as Array<Record<string, unknown>>;
      assert(entries.length > 0, "chart is empty");
      for (const entry of entries) {
        assert(entry.trust !== undefined, `entry ${entry.id}: no trust label`);
        assert(entry.anchors !== undefined, `entry ${entry.id}: no anchors`);
      }
      const tally = new Map<string, number>();
      for (const entry of entries) tally.set(entry.trust as string, (tally.get(entry.trust as string) ?? 0) + 1);
      return `${entries.length} entries; trust ${JSON.stringify(Object.fromEntries(tally))}`;
    });

    let neighborhoodReceiptId = "";
    await check("chart.neighborhood (verify) confirms every served edge", async () => {
      const { structured, errorText } = await call(client, "chart.neighborhood", {
        vessel: "core",
        verify: true,
      });
      assert(errorText === undefined, `tool error: ${errorText}`);
      eq(structured.vessel, "core", "echoed vessel");
      const edges = structured.edges as Array<{ verdict?: string }>;
      const vessels = structured.vessels as unknown[];
      assert(edges.length > 0, "no edges around vessel core");
      const refuted = edges.filter((edge) => edge.verdict === "refuted");
      eq(refuted.length, 0, "refuted edges in the served neighborhood");
      eq(structured.truncated, false, "truncated");
      const receipts = (
        await call(client, "log.read", { filter: { command: "chart.neighborhood" } })
      ).structured.receipts as Array<{ id: string; scope: string }>;
      const last = receipts[receipts.length - 1];
      assert(last !== undefined && last.scope === "core", "no chart.neighborhood receipt for scope core");
      neighborhoodReceiptId = last.id;
      return `${edges.length} edges, ${vessels.length} vessels, receipt ${last.id}`;
    });

    await check("log.read resolves a receipt by id", async () => {
      assert(neighborhoodReceiptId !== "", "no receipt id captured by the neighborhood check");
      const { structured } = await call(client, "log.read", { id: neighborhoodReceiptId });
      const receipts = structured.receipts as Array<{ id: string }>;
      eq(receipts.length, 1, "receipts by id");
      eq(receipts[0].id, neighborhoodReceiptId, "receipt id");
      return neighborhoodReceiptId;
    });

    await check("chart.export serves the adjacency document", async () => {
      const { structured } = await call(client, "chart.export");
      eq(structured.format, "portolan-adjacency", "format");
      const nodes = structured.nodes as unknown[];
      const edges = structured.edges as unknown[];
      assert(nodes.length > 0, "no nodes");
      eq(structured.truncated, false, "truncated");
      const receipts = (
        await call(client, "log.read", { filter: { command: "chart.export" } })
      ).structured.receipts as unknown[];
      assert(receipts.length > 0, "no chart.export receipt");
      return `${nodes.length} nodes, ${edges.length} edges`;
    });

    await check("sweep returns measured chunks", async () => {
      const { structured } = await call(client, "sweep", {
        pattern: "portolan:harbor:begin",
        glob: "AGENTS.md",
      });
      const chunks = structured.chunks as Array<Record<string, unknown>>;
      assert(chunks.length > 0, "no chunks for the harbor marker");
      eq(structured.trust, "measured", "result trust");
      return `${chunks.length} chunks in ${chunks[0].anchor?.path ?? "?"}`;
    });

    await check("symbols resolves a real definition via ctags", async () => {
      const { structured, errorText } = await call(client, "symbols", { name: "computeProposals" });
      if (errorText !== undefined && errorText.includes("ctags")) {
        return `skipped on this machine: ${errorText}`;
      }
      assert(errorText === undefined, `tool error: ${errorText}`);
      const definitions = structured.definitions as Array<Record<string, unknown>>;
      assert(definitions.length > 0, "no definitions for computeProposals");
      const paths = definitions.map((definition) => definition.path).join(", ");
      return `${definitions.length} definition(s): ${paths}`;
    });

    await check("manifests reads the core package", async () => {
      const { structured } = await call(client, "manifests", { path: "core/package.json" });
      eq(structured.name, "@portolan/core", "manifest name");
      eq(structured.version, corePkg.version, "manifest version");
      return `${structured.name} ${structured.version}`;
    });

    await check("sound.anchor confirms a file anchor", async () => {
      const { structured } = await call(client, "sound.anchor", {
        anchor: { type: "file", path: "AGENTS.md" },
      });
      eq(structured.verdict, "confirmed", "verdict");
      return "AGENTS.md confirmed";
    });

    await check("tool error: unsurveyed vessel is honest, server keeps serving", async () => {
      const { errorText } = await call(client, "chart.neighborhood", { vessel: "no-such-vessel" });
      assert(errorText !== undefined, "expected a tool error");
      assert(errorText.includes("no-such-vessel"), `error does not name the vessel: ${errorText}`);
      const alive = await client.listTools();
      assert(alive.tools.length === EXPECTED_TOOLS.length, "server did not keep serving after the error");
      return `isError with the vessel named; ${alive.tools.length} tools still listed`;
    });

    await check("tool error: expeditions.decide rejects an unknown fingerprint", async () => {
      const { errorText } = await call(client, "expeditions.decide", {
        fingerprint: "0".repeat(64),
        decision: "accepted",
      });
      assert(errorText !== undefined, "expected a tool error");
      return errorText.split("\n")[0];
    });

    await check("tool error: the province binding refuses a redirect", async () => {
      const { errorText } = await call(client, "chart.read", { targetRoot: "/tmp" });
      assert(errorText !== undefined, "expected a tool error");
      assert(errorText.includes("cannot be redirected"), `unexpected message: ${errorText}`);
      return "refused as designed";
    });

    await check("unknown tool is a protocol error, not a silent success", async () => {
      let threw = false;
      try {
        await client.callTool({ name: "no.such.tool", arguments: {} });
      } catch {
        threw = true;
      }
      assert(threw, "the call unexpectedly succeeded");
      const alive = await client.listTools();
      assert(alive.tools.length === EXPECTED_TOOLS.length, "server did not keep serving");
      return "rejected; server still serving";
    });
  } finally {
    await client.close();
  }

  const failed = results.filter((result) => !result.ok);
  for (const result of results) {
    console.log(`${result.ok ? "ok  " : "FAIL"}  ${result.name} — ${result.detail}`);
  }
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (stderrText !== "") console.log(`--- server stderr ---\n${stderrText}`);
  process.exit(failed.length === 0 ? 0 : 1);
}

await main();
