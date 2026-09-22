# Build the Millennium Hospital About Us page

## Goal
Rebuild only `/about` as a responsive, premium hospital page based on the supplied visual reference, using real interface elements, approved facts, existing public data, and the real hospital photograph.

## Changes
- Create a responsive About hero with breadcrumb, approved introduction, four verified facts, service/contact actions, and a softly blended hospital photograph that remains recognisable.
- Add the curved transition and the requested About sections using only supplied or already-published content; omit unsupported claims rather than inventing copy.
- Populate Specialities and Infrastructure from existing published department and facility records, with clear loading, error, and empty states.
- Present the approved Navi Mumbai location details and closing doctor/enquiry actions using existing routes.
- Keep all styling within the established Millennium navy/red design system and leave the homepage, shared header/footer, CMS, authentication, and database unchanged.

## Technical details
- Reuse the existing hospital exterior asset, query layer, Button component, semantic color tokens, and TanStack routes.
- Use one H1, logical headings, meaningful image text, touch-friendly controls, focus states, lazy loading below the fold, and responsive layouts at mobile, tablet, and desktop sizes.
- Do not modify `src/lib/utils.ts`; its reported TS2322 diagnostic is stale because the current type check passes.

## Verification
- Run TypeScript and targeted lint checks, then rely on the automated production build result.
- Inspect `/about` at 390, 768, 1280, and 1440 widths for composition, image cropping, text overflow, keyboard-visible controls, and console errors.
