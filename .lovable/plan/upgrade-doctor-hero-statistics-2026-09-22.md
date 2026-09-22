# Upgrade Doctor Hero & Statistics

## Goal
Improve only **CMS → Doctors → Doctor Workspace → Hero & Statistics** with progressive section controls, secure responsive Hero-image management, and reusable statistics. Preserve all existing doctor data, draft behavior, public visibility rules, authentication, RBAC, and unrelated CMS sections.

## Hero
- Replace the current loose Hero fields with one compact section whose ON/OFF switch uses the existing `section_visibility` data. Turning it off hides controls without deleting content.
- Reuse the existing private `doctor-profile-images` bucket, secure public image endpoint, permission checks, unique object paths, verified uploads, deferred old-file cleanup, and rollback-safe replacement flow.
- Support JPG/JPEG, PNG, and WebP up to 5 MB; show the 1600 × 900 (16:9) recommendation, responsive Desktop/Tablet/Mobile crop previews, remove/replace controls, accessibility text, quote, and attribution.
- Add only one doctor field for Left/Center/Right focal positioning, defaulting to Center, and apply it to the existing public Hero image rendering.
- Keep Hero publicly hidden when switched off or when it has no valid content.

## Reusable Statistics
- Add a reusable statistic-definition table containing name, meaning, default PNG icon, and active state.
- Convert the existing `doctor_statistics` rows into assignments by adding a statistic-definition relationship and optional PNG override while preserving current value, order, enabled state, and legacy label/icon content.
- Keep existing rows readable during migration; do not invent doctor values or silently duplicate definitions.
- Seed only the ten requested reusable definition names and meanings, with no values and no fabricated icons. Custom definitions remain supported.
- Provide existing-statistic search/assignment and new-statistic creation, doctor-specific value, optional override icon, compact responsive cards, edit/remove, and Move Up/Move Down ordering.
- Replacing a global icon updates all assignments using the default; doctor overrides remain isolated.

## Storage and security
- Do not create another bucket. Use unique managed paths within `doctor-profile-images` for Hero images, statistic icons, and assignment overrides.
- Extend existing storage policies only as needed to enforce PNG-only statistic icons and the 1 MB icon limit while retaining `can_manage_content()` for all writes and the current read-only delivery endpoint.
- Add grants and RLS for the new definition table using the existing public-read/staff-management pattern. Do not change roles, authentication, or publishing authority.

## CMS and public profile
- Replace the large Hero-page visibility panel with individual Hero and Statistics switches in a single-column layout. Other Doctor pages remain unchanged.
- Preserve staged Save/Cancel and Draft saved behavior; switching sections never deletes saved fields or assignments.
- Update the existing public doctor profile to consume definition names, meanings, resolved icons, assignment values, ordering, focal position, and the exact visibility-plus-valid-content rules.
- Retain backward compatibility for existing statistic rows until they are assigned to reusable definitions.

## Technical details
- Expected schema changes: one statistic-definition table; nullable relationship and icon-override columns on `doctor_statistics`; one Hero focal-position column on `doctors`.
- Reuse the existing Doctor Workspace, profile query layer, generated database types, public image endpoint, Button/form components, semantic design tokens, and current secure image lifecycle.
- Keep `src/lib/utils.ts` unchanged because the current project build passes and its reported diagnostic is stale.

## Verification
- Verify authorized creation/editing/assignment/upload/reorder and unauthorized write denial.
- Verify Hero upload, read check, cache-safe replacement, failed-save preservation, removal, previews, focal positions, and accepted file limits.
- Verify one definition assigned to multiple doctors, global icon replacement, isolated override icon, duplicate prevention, and preserved legacy rows.
- Verify Hero and Statistics for OFF + content, ON + empty, and ON + valid content on the public profile.
- Check CMS and public profile at mobile, tablet, and desktop widths with keyboard labels and no horizontal overflow.
- Run database type regeneration, focused TypeScript/lint checks, automated build, and authenticated browser flows without publishing any doctor.
