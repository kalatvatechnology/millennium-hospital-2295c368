# Complete the public hospital website

## Goal
Finish the patient-facing experience described in Prompt 2 without inventing doctors, reviews, statistics, contact details, or medical claims. Keep unavailable content clearly marked as unpublished.

## What will change
- Expand the homepage into the required 12-section structure, using reusable section and card patterns.
- Add CMS-ready content types and reusable cards for doctors, services, facilities, reviews, FAQs, and articles.
- Add doctor search and specialty/department filters, with a clear empty result when no verified profiles exist.
- Separate professional services from hospital services, while preserving honest empty states.
- Prepare rich doctor, service, facility, and article detail presentations that only render verified fields.
- Improve contact presentation for phone, email, WhatsApp, address, map, and enquiry availability without fabricating values.
- Preserve the existing visual system, accessibility behavior, navigation, metadata, legal pages, and responsive layouts.

## Technical details
- Keep content in typed, CMS-ready data structures; all optional fields remain nullable.
- Reuse TanStack Router routes and inferred route values without casts.
- Use existing design-system controls and semantic color tokens.
- Verify the exact `src/lib/utils.ts` error, run the type check, inspect the latest build result, and test core desktop/mobile flows in the browser.

## Content boundary
No real doctors, services, reviews, contact details, map location, statistics, or medical claims will be added until verified content is supplied.
