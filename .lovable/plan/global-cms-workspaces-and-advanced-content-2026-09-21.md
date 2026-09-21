# Global CMS workspaces and advanced content

## Goal
Replace every CMS editing popup, drawer, overlay, and row editor with a dedicated full-page workspace, using the Doctor Workspace as the shared pattern. Extend Blog and Doctor content safely without inventing medical or business information, weakening permissions, or publishing real content during implementation.

## Implementation

### 1. Shared full-page CMS pattern
- Create reusable workspace layout, section navigation, staged-form state, Save/Cancel bar, unsaved-change warning, and inline destructive confirmation components.
- Replace `FormModal` and `ConfirmDialog` usage across Departments, Professional Services, Hospital Services/Facilities where present, Locations, Media & Content, Website Content, FAQs, Reviews, Blog, profile requests, Users & Roles, and Doctors.
- Preserve list pages and existing URLs; Add/Edit/Manage actions navigate to dedicated child routes. Audit Log remains read-only, while appointment/enquiry management uses full-page detail routes.
- Add a Settings workspace only for settings already backed by the current system; do not invent a parallel settings store.
- Keep ordinary controls such as select menus and date pickers, but no editing workflow or confirmation appears as an overlay.

### 2. Secure schema extension
- Add one focused migration for fields the current 44-table schema cannot represent:
  - Blog rich document, featured-image metadata, SEO/social fields, indexing controls, engagement settings, and structured visualization blocks.
  - Moderated blog comments and non-identifying like records/counts, with approved-only public reads and no direct unrestricted public writes.
  - Google review source/reference metadata plus an explicit doctor-review selection relationship, so hospital and doctor sources remain distinguishable.
  - Achievement image reference/alt text.
  - Doctor-location public display name and map/reference link.
  - Ordered doctor social links without reusing hospital social links.
- Include grants, RLS, indexes, foreign keys, validation constraints, audit integration, and publication guards in the same migration. Writers may draft but cannot publish; unassigned users receive no CMS authority.
- Reuse current media, doctors, locations, reviews, blog, and relationship tables. Do not create duplicate content modules or seed/publish records.
- Keep upload disabled because no approved storage bucket or object policies exist; staff can select existing reusable Media Library references only.

### 3. Full-page Blog publishing workspace
- Split Blog into All Posts and `/new` / `/:postId/:section` workspaces: Writing, Media, Data Visualizations, SEO, Social Preview, Engagement, Clinical Review, and Publishing.
- Add an accessible rich-text editor with headings, paragraph styles, emphasis, lists, quotes, links, tables, alignment, divider, undo/redo, clear formatting, and safe structured output.
- Support Media Library image insertion with preview, alt text, caption, alignment, size, replace, and reference removal; never delete the source asset.
- Validate YouTube URLs, preserve the provider URL, and show responsive previews without uploading video files.
- Build a guided chart flow for bar, line, area, pie/doughnut, comparison, and timeline charts using author-entered data only. Include labels, units, legend, source, accessibility text, caption, and responsive preview. Omit 3D unless a secure, accessible existing library genuinely supports it.
- Add plain-English SEO guidance and deterministic checks for missing/overlong fields, featured image/alt text, H1/heading structure, canonical URL, excerpt, and internal links. Show search and social previews without fake scores or invented copy.
- Preserve clinical review as a separate full-page workflow that never grants publishing authority.

### 4. Public Blog experience and moderation
- Render sanitized structured article content, images, videos, charts, author/reviewer dates, related existing entities, share actions, and a restrained final CTA.
- Add Like, Share, and moderated Comments. New comments remain pending; only approved comments are public. Staff moderation actions use a full-page workspace and inline confirmation.
- Add related articles and existing doctor/department/service links only when relationships exist.
- Keep pages accessible, responsive, fast, and SEO-ready, including route-specific metadata and structured article data where valid.

### 5. Doctor workspace completion
- Add achievement Media Library image selection, preview, alt text, replace, and reference removal.
- Extend multiple-location editing with separate public location name, map link, availability, enabled state, and order.
- Replace the social-link object editor with ordered, enabled doctor-specific links.
- Add Google review source/reference controls and approved-review selection with clear Hospital vs Doctor source labels.
- Rework Doctor SEO into plain-language fields with slug-change warning, sensible editable suggestions based only on stored facts, Google-style preview, and social-sharing preview.
- Preserve the existing statistics editor and align its preview with the public profile treatment.

### 6. Remaining CMS modules
- Build list + full-page create/edit/detail routes for every currently generic content module, reusing current fields, relationships, permissions, and audit logging.
- Give each workspace a clear title, short purpose, section navigation where useful, local staged changes, Save, Cancel, and inline confirmation for destructive actions.
- Keep Central Media Library, Media & Content, and Website Content separate. Do not add a generic page builder.

## Technical details
- Use TanStack Router child routes and the existing admin shell; preserve current route contracts and add every referenced route in the same change.
- Use an established React rich-text editor with JSON/HTML serialization and strict public rendering sanitization; charts use the existing responsive chart library.
- Centralize workspace state and navigation guards rather than duplicating save/cancel logic.
- All mutations continue through authenticated clients with database RLS as the security boundary, plus audit entries for create/update/delete/publish/review/moderation actions.
- Replace the stale `src/lib/utils.ts(8,7)` diagnostic by validating the current source; the file currently has only six lines and its `cn` helper returns a string.

## Verification
- Confirm there are no CMS editor, drawer, modal, alert-dialog, or overlay-editing call sites.
- Test Add/Edit/Manage navigation, staged Save/Cancel, inline destructive confirmation, Blog writing/media/video/chart/SEO previews, comments moderation, doctor reviews/locations/achievements/social links, and publication controls.
- Verify Super Admin, Admin, Editor, Writer, Doctor, Front Desk, and unassigned permission outcomes at both UI and database boundaries; specifically prove Writers cannot publish.
- Test authenticated CMS and affected public pages at 390, 768, 1280, and 1440 px with keyboard navigation, focus behavior, no overflow, and no console/runtime errors.
- Run TypeScript, targeted lint/tests, current build diagnostics, database lint/security checks, and an end-to-end save/readback flow without publishing or inventing content.

## Known constraint
Managed image upload remains unavailable until an approved storage bucket and object policies are explicitly provided. Existing Media Library selection remains available; removing a reference never deletes the reusable asset.
