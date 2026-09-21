# Public Doctors Directory Redesign

## Scope

Redesign only the public Doctors listing page, preserving the existing header, footer, routes, brand system, doctor profile, CMS queries, appointment workflow, permissions, and backend.

## Implementation

- Replace the simple intro with the specified “OUR DOCTORS” healthcare introduction.
- Build a desktop sidebar and accessible mobile filter sheet.
- Search across real doctor name, designation, specialty, qualifications, department, location, and expertise fields.
- Filter by real departments and locations; omit availability controls because the current doctor model has no reliable availability data.
- Add working relevance, name, and experience sorting, clear/apply behavior, result context, live count, and client-side pagination.
- Redesign listing cards around real doctor photography with a consistent ratio, meaningful alt text, and a neutral non-photographic fallback.
- Show only populated doctor attributes; never invent experience, qualifications, location, specialty, contact details, or availability.
- Link cards to the existing profile route, send appointment actions into the existing enquiry flow, and show Call Now only when an approved hospital phone exists.
- Add doctor-card skeletons, a retryable patient-safe error state, and distinct empty states for no published doctors versus no filtered matches.
- Keep state local to the existing route rather than changing routing architecture.

## Verification

- Confirm the stale `src/lib/utils.ts` diagnostic remains absent with a fresh typecheck.
- Run targeted lint and the production build.
- Exercise search, filters, sorting, pagination, profile links, appointment action, empty state, and responsive layouts at mobile, tablet, and desktop widths.
- Report the unavailable availability filter and Call Now behavior honestly when the real data contract cannot support them.
