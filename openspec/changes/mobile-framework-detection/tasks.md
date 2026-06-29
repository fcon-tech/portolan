# Tasks — mobile-framework-detection

## Spec artifacts

- [x] proposal.md
- [x] design.md
- [x] specs/ontology/spec.md (ADDED: mobile manifest detection)

## Implementation slices (follow-on after JVM)

- [ ] Swift Package.swift parser (extract .package/.product declarations)
- [ ] Flutter pubspec.yaml parser (YAML dependencies section)
- [ ] React Native: reuse package.json parser
- [ ] Android: confirm JVM Gradle parser handles Android modules
- [ ] Source references: .swift import resolver, .dart import resolver

## Open questions
- [ ] Swift Package.swift is Swift DSL — regex extraction or structured?
- [ ] CocoaPods Podfile support?
- [ ] How to classify React Native vs plain npm project?
