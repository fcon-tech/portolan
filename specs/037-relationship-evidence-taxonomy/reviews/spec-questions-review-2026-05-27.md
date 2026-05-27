# Spec Questions Review: 037 Relationship Evidence Taxonomy

**Date**: 2026-05-27

## Questions Checked

| Question | Assessment | Disposition |
| --- | --- | --- |
| Does the spec require a new scanner or only product-level taxonomy/reporting? | The spec says taxonomy and product language. It does not require new relationship detection. | non-blocking; implementation stays docs/generated-contract only |
| Does runtime service topology need to be detected? | No. The spec requires runtime topology to remain `not_assessed` without runtime-visible local observations. | non-blocking; generated contract states this explicitly |
| Does `not_assessed` belong in the relationship taxonomy even though it is not a graph evidence state? | Yes. It is a review/reporting state used when a relationship surface was not run or no local input was supplied. | non-blocking; docs distinguish missing surfaces from clean results |
| Are stakeholder questions mapped to relationship kinds? | Yes. The generated answer contract maps "what talks to what?" to relationship evidence and points to bounded artifacts. | non-blocking |
| Are there acceptance criteria that cannot be locally verified? | PR review approval and GitHub checks cannot be verified locally. | record as `not_assessed` in closeout |

## Result

No blocking spec questions remain for this slice. The assumptions are explicit:
no new scanner, no schema migration, no runtime inference, and no product claim
stronger than supplied local evidence.
