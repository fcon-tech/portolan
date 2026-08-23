## 1. Tool scaffold

- [x] 1.1 Create the tools module skeleton under `core/` exporting one entry
      point per tool (sweep, symbols, manifests, log.append, log.read) taking
      an explicit target root, and verify `bun test` runs green with a
      placeholder test
- [x] 1.2 Add binary discovery (PATH lookup for rg and ctags returning the
      spec's named-binary error) and verify a unit test with a doctored PATH
      produces the error naming the binary

## 2. Sweep

- [x] 2.1 Implement `sweep` on top of `rg --json`, mapping match events to
      anchored chunks (path, line, matched text, context) labeled `measured`,
      and verify a test against a temp fixture returns anchored chunks for
      every planted match
- [x] 2.2 Implement the no-match and invalid-pattern paths and verify tests:
      empty pattern result is `[]` with no error; a malformed pattern returns
      an error naming the pattern and zero results

## 3. Symbols

- [x] 3.1 Implement `symbols` definitions on ctags JSON output (name, kind,
      path, line, `measured`) and verify a test on a temp fixture resolves a
      planted symbol with its anchor
- [x] 3.2 Implement honest-absent behavior and verify tests: unknown symbol
      returns an empty result without error; a symbol whose references
      cannot be resolved reports them as not resolvable with no guessed
      locations

## 4. Manifests

- [x] 4.1 Implement the five manifest readers (go.mod, pom.xml, package.json,
      Cargo.toml, pubspec.yaml) returning name/version/dependency facts
      anchored by file path + manifest key and labeled `charted`, and verify
      fixture-based tests per format assert the anchors and the label
- [x] 4.2 Implement unsupported-format and malformed-file paths and verify
      tests: an unknown manifest kind reports unsupported with zero facts; a
      truncated manifest returns an error naming the file with zero partial
      facts

## 5. Ship's log

- [x] 5.1 Implement `log.append` writing one receipt per line to
      `<target>/.portolan/log.jsonl` with monotonic receipt ids, and verify a
      test appending commands then reading by id returns identity and outcome
- [x] 5.2 Implement `log.read` by id and by filter and verify a test resolves
      a receipt id of the exact form a chart Anchor cites
- [x] 5.3 Implement append-only enforcement and verify a test attempting to
      alter or remove an existing receipt is refused with the file unchanged

## 6. Perimeter and labels

- [ ] 6.1 Add the read-only guarantee test: run a battery of sweeps, symbol
      lookups, and manifest reads over a temp target and snapshot-compare the
      tree, verifying only `<target>/.portolan/` changed (log appends only)
- [ ] 6.2 Add a cross-tool label test asserting every sweep/symbols result
      carries `measured` and every manifests fact carries `charted`, and
      verify it fails when a label is stripped
