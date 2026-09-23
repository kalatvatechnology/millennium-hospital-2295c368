# Refine Doctor Hero & Statistics workspace

## Goal
Make the existing Hero & Statistics editor easier to scan and less vertically stretched while preserving its data, permissions, uploads, publication rules, and save behavior.

## Changes
- Group Hero, Doctor Quote, and Statistics into consistent CMS section cards.
- Arrange hero controls and a bounded 16:9 preview side by side on desktop and stacked on smaller screens.
- Keep image upload, replacement, removal, ALT suggestion, focal position, and device previews intact, with tighter segmented controls.
- Move quote fields into their own compact section without changing their stored values.
- Redesign statistics as equal-height responsive cards with clearer values, labels, enabled state, and accessible icon actions.
- Place Add Statistic beside the Statistics heading and add a compact empty state or disabled-state message.
- Preserve the existing sidebar, buttons, design tokens, save flow, and all current doctor data.

## Verification
- Confirm the reported `src/lib/utils.ts` diagnostic is stale without modifying that file.
- Run TypeScript checks and inspect the automated production build result.
- Verify Dr. Amrut Hanchate’s existing hero, quote, and four statistics load unchanged.
- Exercise statistic edit/order/visibility persistence and hero controls without leaving test data changed.
- Check desktop, tablet, and mobile layouts, browser refresh, overflow, and console/runtime errors.

## Technical scope
- Frontend-only changes in the existing Doctor Workspace and statistics editor.
- No database migration, schema, relationship, RLS, RBAC, storage, publishing, or public-profile architecture changes.