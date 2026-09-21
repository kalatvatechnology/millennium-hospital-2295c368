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

## Approval required: minimum schema additions
The current CMS cannot represent the required profile without a database change. Add only:

- Doctor fields for short introduction, hero image, quote and attribution, phone, SEO title/description/canonical/OG image, and optional-section visibility settings.
- Repeatable doctor statistics, specialization cards, experience, education, and achievements/memberships, each with enabled and display-order controls.
- Doctor-to-location relationships with consultation availability, enabled, and display order.
- Doctor-to-FAQ relationships with enabled and display order.
- Extend the existing doctor-to-media relationship with profile visibility, enabled, and display order.

Existing structures remain authoritative for doctors, departments, professional services, reviews, media, FAQs, locations, publishing, verification, appointments, authentication, roles, and security. No content is seeded by this migration.

The existing review relationship already supports doctor-specific approved public reviews. Professional services and media already have doctor junctions, though media needs profile-specific relationship controls. The current staff editor has no relationship manager, tabs, image picker, section controls, repeatable editors, or live preview; these will be added after schema approval without creating a second CMS.
