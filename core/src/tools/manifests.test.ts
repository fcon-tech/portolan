import { test, expect, afterEach } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { formatAnchor } from "../types";
import {
  manifestKindOf,
  ManifestParseError,
  readManifest,
  type ManifestReadResult,
} from "./manifests";

const targets: string[] = [];
afterEach(() => {
  while (targets.length > 0) rmSync(targets.pop() as string, { recursive: true, force: true });
});

const fixtures = join(import.meta.dir, "..", "..", "test", "fixtures", "manifests");

function makeTarget(files: string[] = []): string {
  const target = mkdtempSync(join(tmpdir(), "portolan-manifests-"));
  targets.push(target);
  for (const file of files) {
    const rel = file.includes("/") ? file : file;
    const dir = join(target, rel, "..");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(target, rel), readFileSync(join(fixtures, file), "utf8"));
  }
  return target;
}

function readOk(target: string, path: string): ManifestReadResult {
  const outcome = readManifest(target, path);
  if ("supported" in outcome) {
    throw new Error(`expected a read result, got an unsupported report: ${outcome.reason}`);
  }
  return outcome;
}

function expectAnchoredAndCharted(result: ManifestReadResult): void {
  for (const fact of result.facts) {
    expect(fact.trust).toBe("charted");
    expect(fact.anchor.type).toBe("manifest");
    expect(fact.anchor.path).toBe(result.path);
    expect(fact.anchor.key).toBe(fact.key);
  }
}

test("manifestKindOf recognizes exactly the five supported kinds", () => {
  expect(manifestKindOf("go.mod")).toBe("go.mod");
  expect(manifestKindOf("pom.xml")).toBe("pom.xml");
  expect(manifestKindOf("package.json")).toBe("package.json");
  expect(manifestKindOf("Cargo.toml")).toBe("Cargo.toml");
  expect(manifestKindOf("pubspec.yaml")).toBe("pubspec.yaml");
  expect(manifestKindOf("apps/api/package.json")).toBe("package.json");
  expect(manifestKindOf("build.gradle")).toBeUndefined();
  expect(manifestKindOf("requirements.txt")).toBeUndefined();
  expect(manifestKindOf("go.sum")).toBeUndefined();
});

test("go.mod facts are charted and anchored", () => {
  const target = makeTarget(["go.mod"]);
  const result = readOk(target, "go.mod");

  expect(result.kind).toBe("go.mod");
  expect(result.name).toBe("github.com/bigtop/harbor");
  expect(result.version).toBeUndefined(); // go.mod declares no version

  const keys = result.facts.map((f) => `${f.key}=${f.value}`);
  expect(keys).toContain("module=github.com/bigtop/harbor");
  expect(keys).toContain("require.github.com/stretchr/testify=v1.9.0");
  expect(keys).toContain("require.gopkg.in/yaml.v3=v3.0.1");
  expect(keys).toContain("require.github.com/google/uuid=v1.6.0");
  // replace carries no dependency fact
  expect(keys.some((k) => k.startsWith("require.github.com/old"))).toBe(false);
  expectAnchoredAndCharted(result);
  expect(formatAnchor(result.facts[0]!.anchor)).toBe("go.mod#module");
});

test("pom.xml facts are charted and anchored", () => {
  const target = makeTarget(["pom.xml"]);
  const result = readOk(target, "pom.xml");

  expect(result.kind).toBe("pom.xml");
  expect(result.name).toBe("harbor-service");
  expect(result.version).toBe("1.2.3");

  const keys = result.facts.map((f) => `${f.key}=${f.value}`);
  expect(keys).toContain("project.artifactId=harbor-service");
  expect(keys).toContain("project.groupId=org.apache.bigtop");
  expect(keys).toContain("project.version=1.2.3");
  expect(keys).toContain("project.dependencies.slf4j-api=2.0.9");
  expect(keys).toContain("project.dependencies.junit=4.13.2");
  expect(keys).toContain("project.dependencyManagement.dependencies.guava=32.1.1-jre");
  expectAnchoredAndCharted(result);
});

test("package.json facts are charted and anchored", () => {
  const target = makeTarget(["package.json"]);
  const result = readOk(target, "package.json");

  expect(result.kind).toBe("package.json");
  expect(result.name).toBe("@bigtop/harbor-ui");
  expect(result.version).toBe("0.4.1");

  const keys = result.facts.map((f) => `${f.key}=${f.value}`);
  expect(keys).toContain("name=@bigtop/harbor-ui");
  expect(keys).toContain("version=0.4.1");
  expect(keys).toContain("dependencies.left-pad=^1.3.0");
  expect(keys).toContain("dependencies.react=18.2.0");
  expect(keys).toContain("devDependencies.typescript=~5.4.0");
  expectAnchoredAndCharted(result);
});

test("a nested package.json anchors to its own path", () => {
  const target = mkdtempSync(join(tmpdir(), "portolan-manifests-"));
  targets.push(target);
  mkdirSync(join(target, "apps", "ui"), { recursive: true });
  writeFileSync(
    join(target, "apps", "ui", "package.json"),
    readFileSync(join(fixtures, "package.json"), "utf8"),
  );
  const result = readOk(target, "apps/ui/package.json");
  expect(result.path).toBe("apps/ui/package.json");
  for (const fact of result.facts) {
    expect(fact.anchor.path).toBe("apps/ui/package.json");
  }
  expect(formatAnchor(result.facts[0]!.anchor)).toBe("apps/ui/package.json#name");
});

test("Cargo.toml facts are charted and anchored", () => {
  const target = makeTarget(["Cargo.toml"]);
  const result = readOk(target, "Cargo.toml");

  expect(result.kind).toBe("Cargo.toml");
  expect(result.name).toBe("harbor-cli");
  expect(result.version).toBe("2.1.0");

  const keys = result.facts.map((f) => `${f.key}=${f.value}`);
  expect(keys).toContain("package.name=harbor-cli");
  expect(keys).toContain("package.version=2.1.0");
  // inline-table dependency form
  expect(keys).toContain("dependencies.serde=1.0");
  expect(keys).toContain("dependencies.clap=4.4");
  expect(keys).toContain("dev-dependencies.pretty_assertions=1.4");
  expect(keys).toContain("build-dependencies.cc=1.0");
  expectAnchoredAndCharted(result);
});

test("pubspec.yaml facts are charted and anchored", () => {
  const target = makeTarget(["pubspec.yaml"]);
  const result = readOk(target, "pubspec.yaml");

  expect(result.kind).toBe("pubspec.yaml");
  expect(result.name).toBe("harbor_flutter");
  expect(result.version).toBe("3.0.1+42");

  const keys = result.facts.map((f) => `${f.key}=${f.value}`);
  expect(keys).toContain("name=harbor_flutter");
  expect(keys).toContain("version=3.0.1+42");
  expect(keys).toContain("dependencies.http=^1.1.0");
  // nested version detail under a hosted dependency
  expect(keys).toContain("dependencies.harbor_core=^2.0.0");
  // sdk dependency: declared without a version — empty value, still charted
  expect(keys).toContain("dependencies.flutter=");
  expect(keys).toContain("dev_dependencies.flutter_test=");
  expectAnchoredAndCharted(result);
});

test("an unsupported manifest is reported, not guessed", () => {
  const target = mkdtempSync(join(tmpdir(), "portolan-manifests-"));
  targets.push(target);
  writeFileSync(join(target, "build.gradle"), "plugins { id 'java' }\n");

  const outcome = readManifest(target, "build.gradle");
  if (!("supported" in outcome) || outcome.supported !== false) {
    throw new Error("expected an unsupported-manifest report");
  }
  expect(outcome.reason).toContain("unsupported manifest kind");
  expect(outcome.reason).toContain("build.gradle");
  expect(outcome.reason).toContain("go.mod");
  expect("facts" in outcome).toBe(false);
});

test("a malformed package.json fails loudly with zero partial facts", () => {
  const target = mkdtempSync(join(tmpdir(), "portolan-manifests-"));
  targets.push(target);
  writeFileSync(join(target, "package.json"), '{ "name": "trunc', );

  let err: unknown;
  try {
    readManifest(target, "package.json");
  } catch (e) {
    err = e;
  }
  expect(err).toBeInstanceOf(ManifestParseError);
  expect((err as ManifestParseError).path).toBe("package.json");
  expect((err as ManifestParseError).message).toContain("package.json");
});

test("a truncated pom.xml fails loudly", () => {
  const target = makeTarget(["pom.xml"]);
  const full = readFileSync(join(target, "pom.xml"), "utf8");
  writeFileSync(join(target, "pom.xml"), full.slice(0, full.indexOf("<dependencies>")));

  let err: unknown;
  try {
    readManifest(target, "pom.xml");
  } catch (e) {
    err = e;
  }
  expect(err).toBeInstanceOf(ManifestParseError);
  expect((err as ManifestParseError).message).toContain("never closed");
});

test("an unterminated go.mod require block fails loudly", () => {
  const target = mkdtempSync(join(tmpdir(), "portolan-manifests-"));
  targets.push(target);
  writeFileSync(join(target, "go.mod"), "module example.com/x\n\nrequire (\n\tgopkg.in/yaml.v3 v3.0.1\n");

  let err: unknown;
  try {
    readManifest(target, "go.mod");
  } catch (e) {
    err = e;
  }
  expect(err).toBeInstanceOf(ManifestParseError);
  expect((err as ManifestParseError).message).toContain("unterminated require block");
});

test("an unterminated Cargo.toml string fails loudly", () => {
  const target = mkdtempSync(join(tmpdir(), "portolan-manifests-"));
  targets.push(target);
  writeFileSync(join(target, "Cargo.toml"), '[package]\nname = "harbor-cli\nversion = "0.1.0"\n');

  let err: unknown;
  try {
    readManifest(target, "Cargo.toml");
  } catch (e) {
    err = e;
  }
  expect(err).toBeInstanceOf(ManifestParseError);
  expect((err as ManifestParseError).message).toContain("unterminated string");
});

test("a truncated pubspec.yaml entry fails loudly", () => {
  const target = mkdtempSync(join(tmpdir(), "portolan-manifests-"));
  targets.push(target);
  writeFileSync(
    join(target, "pubspec.yaml"),
    "name: harbor_flutter\nversion: 1.0.0\ndependencies:\n  http: ^1.1.0\n  flutter\n",
  );

  let err: unknown;
  try {
    readManifest(target, "pubspec.yaml");
  } catch (e) {
    err = e;
  }
  expect(err).toBeInstanceOf(ManifestParseError);
  expect((err as ManifestParseError).message).toContain("pubspec.yaml");
  expect((err as ManifestParseError).message).toContain("expected \"<package>:\"");
});

test("a manifest path that escapes the province is reported, never read", () => {
  const target = makeTarget(["package.json"]);
  // An out-of-province manifest that would parse if the perimeter leaked.
  const outside = mkdtempSync(join(tmpdir(), "portolan-outside-"));
  targets.push(outside);
  writeFileSync(join(outside, "package.json"), JSON.stringify({ name: "secret-outside-pkg" }));

  const escape = readManifest(target, relative(target, join(outside, "package.json")));
  if (!("supported" in escape)) throw new Error("expected an unsupported report");
  expect(escape.supported).toBe(false);
  expect(escape.reason).toContain("escapes the target root");
  expect(JSON.stringify(escape)).not.toContain("secret-outside-pkg");

  // The same through an in-target symlink pointing outside the province.
  mkdirSync(join(target, "link"), { recursive: true });
  symlinkSync(join(outside, "package.json"), join(target, "link", "package.json"));
  const throughLink = readManifest(target, join("link", "package.json"));
  if (!("supported" in throughLink)) throw new Error("expected an unsupported report");
  expect(throughLink.supported).toBe(false);
  expect(throughLink.reason).toContain("escapes the target root");
  expect(JSON.stringify(throughLink)).not.toContain("secret-outside-pkg");
});
