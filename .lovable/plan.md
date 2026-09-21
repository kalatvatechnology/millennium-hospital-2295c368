# Final doctor profile and smart CMS

## Goal
Create the final public doctor profile in the supplied desktop and mobile visual direction, using only verified CMS content and preserving the existing design system, booking flow, security, and routes.

## Implementation
1. Remove only the deterministic demonstration doctor, department, professional service, hospital service, and their junction rows after confirming they are explicitly demo-labelled.
2. Compare the requested profile sections with the current doctor fields and relationships. Stop before database changes if required fields or relationships are missing, and report the exact minimum additions for approval.
3. Extend the existing models, data mappings, public query, and staff Doctor editor only after those additions are approved and applied with grants and row-level access controls.
4. Rebuild the existing doctor profile route with a responsive image-first introduction, truthful data-dependent action/statistic panels, section navigation, optional content sections, locations/media/reviews/FAQs, and the existing appointment form.
5. Add doctor-specific metadata and structured data only from published fields. Hide every empty or disabled optional section.
6. Validate the source/type diagnostic, focused linting, build, data safety, public visibility rules, keyboard accessibility, and 390/768/1440 layouts.

## Technical details
- Keep the existing doctor route, CMS architecture, authentication, role checks, storage, appointment workflow, global header/footer, typography, and brand tokens.
- Never populate the reference image's sample statistics, schedules, credentials, locations, media, reviews, FAQs, or claims.
- Any new tables must include explicit grants, row-level security, and policies in the same migration.
- The current production-compatible adapter remains disconnected; changes target only the approved local Lovable Cloud schema.
