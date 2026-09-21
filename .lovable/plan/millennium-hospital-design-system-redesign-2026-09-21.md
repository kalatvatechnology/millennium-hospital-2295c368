# Millennium Hospital Design System Redesign

## Goal
Create one premium, calm and highly readable Millennium Hospital interface across the public website and staff area, using the supplied navy/red brand palette. Preserve all routes, data, permissions, forms and workflows.

## What will change
- Replace the current teal styling with a central Millennium token system for colour, typography, spacing, radii, shadows, transitions and accessible focus states.
- Standardise shared controls: buttons, inputs, selects, text areas, cards, badges, status indicators, dialogs, drawers, tabs, tables, pagination, search, filters, alerts and feedback states.
- Refine shared public patterns: hospital header, mobile navigation, footer, page introductions, section headings, content cards, loading/empty/error states and appointment-enquiry presentation.
- Refine shared staff patterns: header/sidebar navigation, page headers, tables, filters, forms, dialogs, confirmations, status badges and responsive navigation.
- Remove isolated styling inconsistencies and ensure identical actions use identical visual treatments.
- Preserve restrained use of Millennium Red for important actions and destructive states, with Millennium Navy carrying the primary visual hierarchy.

## Responsive and accessibility pass
- Check public and staff screens at mobile, tablet and desktop widths.
- Prevent overflow, clipped content and inaccessible tables/dialogs.
- Maintain 44px touch targets, visible keyboard focus, labels, semantic headings, readable contrast and reduced-motion behavior.

## Verification
- Run TypeScript checks and confirm the preview build succeeds.
- Exercise representative public and staff screens in the browser at desktop and mobile sizes.
- Check runtime/console errors and verify no business behavior changed.

## Technical boundaries
- Frontend presentation files only; no database, RBAC, API, route or workflow changes.
- Reuse existing components rather than introducing page-specific duplicates.
- Keep all visual values in semantic design tokens and shared variants.
