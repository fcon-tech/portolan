/**
 * Chart Room unit checks (chart-room tasks 1.1 + 2.1): the export is a
 * deterministic byproduct — byte-stable, placeholder-exhausted, safe against
 * `$`-sequence injection from chart notes, perimeter-clean, and loud when
 * the province has no chart.
 */
import { test, expect, beforeAll } from "bun:test";
import { mkdtempSync, writeFileSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { renderChartRoom, chartRoomPath, inlineMd, safeInlineJson, parseNotices } from "./render";
import { TOOL_TABLE } from "../server/registry";
import { renderNotices } from "../notices";
import type { IndexedEntry } from "../types";

let province: string;

function writeIndex(lines: unknown[]): string {
  const dir = join(province, ".portolan/chart");
  mkdirSync(dir, { recursive: true });
  const index = join(dir, "index.jsonl");
  writeFileSync(index, lines.map((l) => JSON.stringify(l)).join("\n") + "\n");
  return index;
}

const hostileNote = 'SPARK_DIST_CLASSPATH=$(hadoop classpath) ${spark.version} $& $` $\'';

const fixtureEntries = [
  {
    kind: "vessel", id: "alpha", name: "Alpha", trust: "charted", stale: false,
    note: "anchor vessel", anchors: [{ type: "file", path: "repos/alpha/pom.xml", line: 1 }],
    paths: ["repos/alpha"], signature: { hash: "ab12", files: 120 },
  },
  {
    kind: "vessel", id: "beta", name: "Beta", trust: "measured", stale: true,
    note: hostileNote,
    anchors: [{ type: "manifest", path: "repos/beta/pom.xml", key: "project.version" }],
    paths: ["repos/beta"], signature: { hash: "cd34", files: 7 },
  },
  {
    kind: "fairway", id: "fw-beta-on-alpha", from: "beta", to: "alpha",
    trust: "measured", stale: false, note: "sounded: confirmed",
    anchors: [{ type: "file", path: "repos/beta/pom.xml", line: 9 }],
  },
  {
    kind: "danger", id: "danger-1", vessel: "alpha", category: "rock",
    trust: "measured", stale: false, note: "version rock",
    anchors: [{ type: "file", path: "bom", line: 3 }],
  },
];

beforeAll(() => {
  province = mkdtempSync(join(tmpdir(), "chartroom-"));
});

test("renders one artifact inside the perimeter and reports counts", () => {
  writeIndex(fixtureEntries);
  writeFileSync(
    join(province, ".portolan/sailing-directions.md"),
    "# Sailing Directions — test province\n\nExpedition 2026-08-25 · Cartographer: test\n\n## The waters\n\nTwo vessels, one fairway.\n",
  );
  const result = renderChartRoom(province);
  expect(result.entries).toBe(4);
  expect(result.counts).toEqual({ vessel: 2, fairway: 1, danger: 1 });
  expect(result.path).toBe(chartRoomPath(province));

  const portolan = readdirSync(join(province, ".portolan"));
  expect(portolan.sort()).toEqual(["chart", "chart-room.html", "sailing-directions.md"]);
  const html = readFileSync(result.path, "utf8");
  expect(html).toContain("<!doctype html>");
});

test("deterministic: the same chart renders byte-identical files", () => {
  const first = readFileSync(chartRoomPath(province), "utf8");
  renderChartRoom(province);
  expect(readFileSync(chartRoomPath(province), "utf8")).toEqual(first);
});

test("no template placeholder survives substitution", () => {
  const html = readFileSync(chartRoomPath(province), "utf8");
  for (const token of ["__CHART_DATA__", "__BRIEF_HTML__", "__META__"]) {
    expect(html).not.toContain(token);
  }
});

test("dollar sequences in chart notes reach the page verbatim (no replace() injection)", () => {
  const html = readFileSync(chartRoomPath(province), "utf8");
  // If plain string replace ran, $& / $` / $' would have expanded to matched
  // fragments or surrounding text and the note would be corrupted.
  expect(html).toContain("$(hadoop classpath)");
  expect(html).toContain("${spark.version}");
  expect(html).toContain("$&");
  expect(html).toContain("$`");
  expect(html).toContain("$'");
});

test("no chart fails loudly, naming the expected path", () => {
  const empty = mkdtempSync(join(tmpdir(), "chartroom-empty-"));
  expect(() => renderChartRoom(empty)).toThrow(/index\.jsonl/);
  expect(() => renderChartRoom(empty)).toThrow(join(empty, ".portolan/chart"));
});

test("the briefing inlines the Sailing Directions past its title", () => {
  const html = readFileSync(chartRoomPath(province), "utf8");
  expect(html).toContain("The waters");
  expect(html).toContain("Expedition 2026-08-25");
  expect(html).not.toContain("Sailing Directions — test province");
});

test("inlineMd: headings, lists, bold, code, and HTML escaping", () => {
  expect(inlineMd("## Head\n- one **bold** item\n- `code`\npara <b>x</b>")).toBe(
    '<h3>Head</h3>\n<ul>\n<li>one <b>bold</b> item</li>\n<li><code>code</code></li>\n</ul>\n<p>para &lt;b&gt;x&lt;/b&gt;</p>',
  );
});

test("safeInlineJson closes script breakout and line separators", () => {
  expect(safeInlineJson({ a: "</script>" })).not.toContain("</script>");
  expect(safeInlineJson({ a: "\u2028" })).toContain("\\u2028");
});

test("parseNotices round-trips renderNotices output exactly", () => {
  const anchors = [
    { type: "file" as const, path: "repos/x/pom.xml", line: 12 },
    { type: "manifest" as const, path: "repos/y/pom.xml", key: "project.version" },
    { type: "receipt" as const, id: "r7" },
  ];
  const notices: Parameters<typeof renderNotices>[0] = [
    { action: "added", kind: "vessel", id: "web", anchors: [anchors[0]!] },
    { action: "corrected", kind: "beacon", id: "PORT", note: "changed: note; repaired (was pending correction)", anchors },
    { action: "markedStale", kind: "fairway", id: "fw-a-on-b", note: "sources changed since the last survey", anchors: [anchors[0]!] },
    { action: "retired", kind: "danger", id: "danger-1", anchors: [] },
  ];
  const parsed = parseNotices(renderNotices(notices));
  expect(parsed).toEqual([
    { action: "added", key: "vessel/web", anchors: ["repos/x/pom.xml:12"] },
    {
      action: "corrected",
      key: "beacon/PORT",
      note: "changed: note; repaired (was pending correction)",
      anchors: [
        "repos/x/pom.xml:12",
        "repos/y/pom.xml#project.version",
        "receipt:r7",
      ],
    },
    { action: "markedStale", key: "fairway/fw-a-on-b", note: "sources changed since the last survey", anchors: ["repos/x/pom.xml:12"] },
    { action: "retired", key: "danger/danger-1", anchors: [] },
  ]);
});

test("parseNotices skips the header and tolerates an empty file", () => {
  expect(parseNotices("NOTICES TO MARINERS\n")).toEqual([]);
  expect(parseNotices("")).toEqual([]);
});

test("the artifact embeds notices; absent file renders an explicit empty state", () => {
  // fixture province has no notices.txt → the empty-state branch must exist
  let html = readFileSync(chartRoomPath(province), "utf8");
  expect(html).toContain("No outstanding notices");
  // write real notices and re-render: the data must reach the page
  writeFileSync(
    join(province, ".portolan/chart/notices.txt"),
    renderNotices([
      { action: "retired", kind: "vessel", id: "ghost", anchors: [{ type: "file", path: "repos/ghost", line: 1 }] },
    ]),
  );
  renderChartRoom(province);
  html = readFileSync(chartRoomPath(province), "utf8");
  expect(html).toContain('"action":"retired"');
  expect(html).toContain('"key":"vessel/ghost"');
  expect(html).toContain("repos/ghost:1");
  // both branches' literals ship in the page script
  expect(html).toContain("RETIRED");
});

test("the chart.render MCP tool serves the same core function surface", () => {
  const spec = TOOL_TABLE.find((t) => t.name === "chart.render");
  expect(spec?.description.length).toBeGreaterThan(0);
  expect((spec?.inputSchema as { type?: string }).type).toBe("object");
  // No chart in this temp province → the handler surfaces the loud error.
  const empty = mkdtempSync(join(tmpdir(), "chartroom-mcp-"));
  expect(() => spec?.handler({}, { targetRoot: empty })).toThrow(/index\.jsonl/);
});
