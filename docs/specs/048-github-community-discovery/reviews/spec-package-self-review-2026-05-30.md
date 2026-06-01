# Spec Package Self-Review: GitHub Community Discovery

**Date**: 2026-05-30

## Assessment

- `verified`: The repository already has a top-level README and product claim
  boundary that community docs can route to.
- `not_assessed`: Current public GitHub description, homepage, topics, social
  preview, and community profile.
- `not_assessed`: OpenSSF Scorecard and Best Practices state.
- `verified`: Security reporting channel is chosen as GitHub private
  vulnerability reporting for `fcon-tech/portolan`.
- `blocked`: GitHub private vulnerability reporting setting still needs admin
  enablement or explicit rejection.
- `blocked`: Conduct policy until maintainer approves the policy.

## Findings

1. **major - Security contact is a real blocker**
   - `SECURITY.md` should not invent a contact channel. The spec correctly
     blocks implementation until a maintainer-approved reporting route exists.

2. **major - Topics need a claim boundary**
   - Topic choices can silently overclaim. The proposed set avoids
     `security-scanner`, `observability`, and `service-catalog` until evidence
     supports those categories.

3. **minor - Scorecard should be a follow-up unless already configured**
   - It is useful for public trust, but premature badges would be misleading.

## Open Questions

- Which email, GitHub private vulnerability reporting path, or other route
  should `SECURITY.md` use?
- Should the code of conduct be Contributor Covenant or a smaller maintainer
  statement?
- Should the homepage stay empty until a demo page exists, or point to README?
