# The Millennium Hospital foundation

## Goal
Build a calm, professional, mobile-first hospital website foundation with reusable public and admin layouts. Use only the hospital name supplied; unknown contact details, staff, services, reviews, and articles will remain clearly unavailable rather than being invented.

## What will be built
- Replace the blank home screen with a polished hospital homepage focused on finding care, services, facilities, and contact access.
- Add all requested public pages and detail-page patterns for doctors, services, and articles.
- Add an admin entry, login screen, and dashboard shell. These screens will be presentation-ready but will not claim working authentication or saved content because no backend is connected.
- Add reusable header, mobile navigation, footer, page headings, content cards, forms, and shared loading/error/empty states.
- Centralize the hospital name, contact fields, address, WhatsApp, logo treatment, and social links. Missing values will be hidden or labeled unavailable.
- Add unique search and social metadata for every public and admin page.
- Add simple-English documentation covering structure, content configuration, routes, accessibility, and future backend integration.

## Visual direction
- Calm clinical palette: deep teal, clear blue, soft mint, white, and neutral ink.
- Strong readable typography, restrained corners, clear focus rings, and WCAG AA-conscious contrast.
- Mobile-first layouts with a compact menu and spacious desktop navigation.
- No stock patient claims, fabricated metrics, fake clinicians, testimonials, contact details, or service descriptions.

## Technical details
- Keep TanStack Start file-based routing and the existing component library.
- Use shared public and admin layout routes, while preserving `/` as the home route.
- Use semantic design tokens in the global stylesheet and existing button/form primitives.
- Use slug routes with an honest empty/not-found treatment until real CMS content exists.
- Keep the data layer interface ready for Lovable Cloud later; do not add secrets or a database in this foundation pass.
- Validate the generated route tree, preview every central flow at desktop and mobile sizes, and confirm the latest automated build result is clean.
