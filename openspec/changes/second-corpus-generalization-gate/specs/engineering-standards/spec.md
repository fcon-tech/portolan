# Spec Delta — engineering-standards

## ADDED Requirements

### Requirement: Contracts are verified on a second OSS landscape
Portolan's executable contracts SHALL be verified on at least one second,
independent OSS landscape beyond Apache Bigtop. A contract that holds on Bigtop
but not on the second corpus SHALL be flagged `not-generalized` and MUST NOT be
declared done. Bigtop SHALL remain a stress corpus, not a hand-staged fixture.

#### Scenario: A contract passes on both corpora
- GIVEN a contract passes on Bigtop and on the second corpus
- WHEN generalization is assessed
- THEN the contract is marked generalized

#### Scenario: A Bigtop-only contract is not-generalized
- GIVEN a contract passes on Bigtop but fails on the second corpus
- WHEN generalization is assessed
- THEN the contract is flagged not-generalized
- AND it is not declared done
