# Community Template Dry Run

**Date**: 2026-05-30

## Scope

Dry-run review of the public issue templates and pull request template added for
GitHub community discovery.

## Checks

| Surface | State | Evidence |
| --- | --- | --- |
| Issue template YAML syntax | `verified` | `ruby -e 'require "yaml"; ARGV.each { |f| YAML.load_file(f); puts "OK #{f}" }' .github/ISSUE_TEMPLATE/config.yml .github/ISSUE_TEMPLATE/bug_report.yml .github/ISSUE_TEMPLATE/feature_request.yml .github/ISSUE_TEMPLATE/evidence_gap.yml` |
| Bug report evidence fields | `verified` | Template requires command/target shape, expected behavior, actual behavior, evidence state, evidence, and privacy check. |
| Feature request boundary fields | `verified` | Template requires problem, direction, product-boundary impact, simpler alternatives or OSS fit, and evidence/current gap. |
| Evidence gap template | `verified` | Template requires current weak state, reason, next check, and confirmation that the gap is not counted as product success. |
| Pull request template | `verified` | Template asks for scope, verification, evidence-state impact, product-claim impact, and safety checks. |

## Notes

The PR template path is `.github/pull_request_template.md`, matching GitHub's
documented hidden-directory template path.

No broken local links were found by direct inspection of the added files.

