/**
 * The fixture province for the expedition-skill dry runs: a small
 * three-vessel target (apps/cli, apps/api, packages/lib) with a root README
 * that plants two doc drifts the survey must refute — a claimed cli→api
 * fairway with no deterministic support, and an export (validate) the source
 * does not have. Content is deterministic; the dry run's output must be too.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export function createFixture(root: string): void {
  const file = (rel: string, text: string) => {
    const path = join(root, rel);
    mkdirSync(join(path, ".."), { recursive: true });
    writeFileSync(path, text);
  };

  file(
    "package.json",
    JSON.stringify(
      { name: "fixture-province", private: true, workspaces: ["apps/*", "packages/*"] },
      null,
      2
    ) + "\n"
  );
  file(
    "README.md",
    [
      "# Fixture province",
      "",
      "A small province for Portolan dry runs.",
      "",
      "- The CLI calls the API over HTTP for every parse.",
      "- packages/lib exports validate() from src/validate.ts.",
      "",
    ].join("\n")
  );

  file(
    "apps/cli/package.json",
    JSON.stringify(
      {
        name: "@fixture/cli",
        bin: { fixture: "./bin/cli.ts" },
        dependencies: { "@fixture/lib": "workspace:*" },
      },
      null,
      2
    ) + "\n"
  );
  file(
    "apps/cli/bin/cli.ts",
    [
      "#!/usr/bin/env bun",
      'import { parse } from "@fixture/lib";',
      "",
      'const prefix = "CLI";',
      'const mode = process.env[prefix + "_MODE"];',
      "const args = process.argv.slice(2);",
      'const json = args.includes("--json");',
      'const value = parse(args.find((a) => !a.startsWith("-")) ?? "");',
      "if (json) console.log(JSON.stringify({ value, mode }));",
      "else console.log(value);",
      "",
    ].join("\n")
  );

  file(
    "apps/api/package.json",
    JSON.stringify(
      { name: "@fixture/api", dependencies: { "@fixture/lib": "workspace:*" } },
      null,
      2
    ) + "\n"
  );
  file(
    "apps/api/server.ts",
    [
      'import { parse } from "@fixture/lib";',
      "",
      'const PORT = Number(process.env.PORT ?? 8080);',
      "",
      "Bun.serve({",
      "  port: PORT,",
      "  fetch(request) {",
      "    const url = new URL(request.url);",
      '    if (url.pathname === "/health") return new Response("ok");',
      "    try {",
      '      const q = url.searchParams.get("q") ?? "";',
      "      return new Response(parse(q));",
      "    } catch {",
      '      return new Response("ok"); // errors swallowed, no error signal',
      "    }",
      "  },",
      "});",
      "",
    ].join("\n")
  );

  file(
    "packages/lib/package.json",
    JSON.stringify(
      { name: "@fixture/lib", main: "src/parse.ts" },
      null,
      2
    ) + "\n"
  );
  file(
    "packages/lib/src/parse.ts",
    [
      "export function parse(input: string): string {",
      '  return input.split(",").join("|");',
      "}",
      "",
    ].join("\n")
  );
  file(
    "packages/lib/check.ts",
    [
      'import { parse } from "./src/parse";',
      "",
      'const ok = parse("a,b") === "a|b";',
      'console.log(ok ? "lib check passed" : "lib check failed");',
      "process.exit(ok ? 0 : 1);",
      "",
    ].join("\n")
  );
}
