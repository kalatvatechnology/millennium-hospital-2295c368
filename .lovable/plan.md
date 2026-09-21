# Doctor CMS workspace and content architecture

## Goal
Replace the doctor popup editor with a full-page, section-based staff workspace while preserving all existing doctor records, permissions, publishing safeguards, relationships, and public routes. Do not create demo content or publish doctors.

## What will change

### 1. Full-page doctor workspace
- Keep `Doctors` as the searchable list, but open New/Edit actions in a dedicated doctor workspace route instead of a modal.
- Show the selected doctor beneath Doctors in the staff navigation and provide section links for Profile, Hero & Statistics, Specializations, Services, Experience, Education, Achievements & Memberships, Locations, Social Media, Media, Reviews, FAQs, SEO, and Publishing.
- Highlight the active section and use a compact mobile section selector at narrow widths.
- Provide one clear Save and Cancel flow per section. Changes remain local until Save; Cancel restores the last loaded values.
- Keep delete confirmations for destructive actions and the existing profile preview action.

### 2. Profile, SEO, and publishing editors
- Move the existing doctor fields into dedicated full-page editors, including the real department selector and image previews/alt text.
- Keep profile basics separate from hero/statistics, social media, SEO, and publishing.
- Parse and validate doctor social links into platform, URL, enabled, and order controls using the existing `social_links` JSON field; do not copy hospital social links or invent URLs.
- Preserve the existing role checks and database publication guard. Writers cannot publish; unassigned users receive no staff authority.

### 3. Repeatable doctor content
- Reuse the existing profile tables for statistics, specializations, experience, education, and achievements.
- Support staged add, inline edit, enable/disable, Up/Down ordering, and confirmed deletion without popups.
- Add a live statistics preview beside the editor on desktop and below it on mobile, using the existing public statistics visual treatment where practical.
- Preserve `Present` behavior for experience and editable achievement descriptions.

### 4. Existing relationships
- Professional Services: connect/remove existing records only; do not add ordering because the relationship has no order field.
- Locations: connect/remove existing locations and edit supported availability, enabled, and order values.
- Media: connect/remove existing media and edit profile visibility, enabled, and order values.
- Reviews: select only existing approved doctor reviews; keep review text read-only.
- FAQs: reuse the existing FAQ records and doctor relationship. Relationship changes are staged; global FAQ content remains managed by the existing FAQ module to avoid duplicating or unexpectedly changing shared content.

### 5. Media and image handling
- Keep Media & Content separate from Website Content.
- Add an existing-media selector for profile, hero, and OG images when a usable image URL or thumbnail already exists, while retaining preview, replace, remove-reference, and alt-text controls.
- Show image guidance derived from the current profile image slots: portrait uses a 4:5 aspect ratio; hero guidance follows the current hero presentation rather than inventing arbitrary pixel dimensions.
- Do not enable uploads or file deletion: the project currently has no approved storage bucket or policies. Removing an image only clears the doctor reference and never deletes a reusable asset.

### 6. Main staff navigation and Website Content
- Add the existing Locations and Website Content areas to the staff navigation without merging them into Media & Content.
- Present the existing website-page records as fixed website content rather than introducing a generic drag-and-drop or JSON page builder.
- Do not change unrelated CMS modules, public pages, authentication, roles, policies, appointments, leads, or database schema.

## Technical details
- Add typed TanStack routes for the doctor workspace and its active section; every referenced path is created in the same change.
- Refactor doctor-specific editing out of the generic `ContentManager`; other content managers continue using their current forms.
- Split the current large doctor section editor into focused workspace components with shared staged-state, save, reset, ordering, and relationship controls.
- Continue using the signed-in browser client so current row-level policies remain the security boundary.
- Keep existing doctor/profile database columns and relationship tables; no migration is planned.

## Verification
- Confirm doctor list → workspace → every section navigation path.
- Verify Save, Cancel, add/edit/delete confirmation, enable/disable, ordering, relationship selection, live statistics preview, media selection, and staff preview.
- Confirm no doctor publication state or real content changes during testing.
- Verify Writer publication controls stay unavailable and the database guard remains unchanged.
- Test 390, 768, 1280, and 1440 widths for no overlap, clipping, or horizontal scrolling.
- Run TypeScript, targeted lint, build diagnostics, and browser console checks.
- Report upload as blocked until an approved storage bucket and policies exist, and report Professional Services ordering as unsupported by the current schema.
