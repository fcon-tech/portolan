# Tasks — mobile-framework-detection

> Reconciled 2026-08-23 against the implementation (`internal/relationships/
> mobile.go`; commits 6a2d553, a21b609, 0b07144, 8681709).

## Spec artifacts

- [x] proposal.md
- [x] design.md
- [x] specs/ontology/spec.md (ADDED: mobile manifest detection)

## Implementation slices (follow-on after JVM)

- [x] Swift Package.swift parser (`detectSwiftPackageSwift`, `mobile.go:27`;
      regex extraction of `.package(url:...)` declarations)
- [x] Flutter pubspec.yaml parser (`detectPubspecYaml`, `mobile.go:85`;
      package-level pubspec regex hoisted in 8681709)
- [x] React Native: reuse package.json parser (FormatNpm shared path,
      `relationships.go:257`)
- [ ] Android: confirm JVM Gradle parser handles Android modules — no evidence
      of confirmation (no android/com.android handling or fixture in tree)
- [ ] Source references: .swift import resolver, .dart import resolver — not
      implemented; swift:/dart: node prefixes exist only for manifest bridging
      (`isManifestSourceNode`, `maprun.go:984`)

## Open questions
- [ ] Swift Package.swift is Swift DSL — regex extraction or structured?
      (current: regex, `mobile.go`)
- [ ] CocoaPods Podfile support?
- [ ] How to classify React Native vs plain npm project?
