# Phase 4 — Secure and complete the Doctor CMS editor

## Goal
Close the Writer publication bypass at the database boundary and complete the existing Doctor editor without changing the Doctor Profile schema, creating records, or changing unrelated areas.

## Implementation
1. **Database publishing guard**
   - Add a focused migration with a Doctor-only trigger that rejects publication-status changes unless `can_publish()` is true.
   - Preserve existing profile edits for Writers and full authority for explicitly assigned Super Admin, Admin, and Editor roles.
   - Keep Front Desk, Doctor, and unassigned users restricted by existing RLS.

2. **Doctor form fields and structure**
   - Add a Department selector populated from existing departments.
   - Reorganize the editor into the requested task-focused tabs while retaining the current design system.
   - Keep the existing 11 visibility controls.

3. **Repeatable profile content**
   - Stage edits locally until the main Save action; Cancel discards them.
   - Support add, edit, confirmed delete, enable/disable, and Up/Down ordering for statistics, specializations, experience, education, and achievements.
   - Expose Present for experience and Description for achievements.

4. **Relationships**
   - Stage relationship changes until Save.
   - Add enabled/order/availability controls for locations, enabled/order controls for FAQs, and profile visibility/enabled/order controls for media.
   - Keep professional services on the existing relationship. Because its table has no order field, do not invent ordering; report that exact limitation.
   - Let staff select only existing approved doctor reviews using the current `reviews.doctor_id` and approval flag—no duplicate review system or review-text editing.

5. **Images**
   - Replace raw profile/hero URL editing with existing-media selection, previews, replace/remove controls, and editable alt text.
   - Add upload only if the current storage bucket and policies support authenticated CMS upload safely; otherwise preserve media selection and report upload as blocked.
   - Never automatically delete stored files when removing a doctor reference.

## Verification
- Apply and test the migration without changing doctor publication states or creating permanent test users.
- Verify the permission matrix using safe transactional/database checks where role accounts are unavailable.
- Verify editor save, cancel, delete confirmation, ordering, relationships, image selection, and responsive layouts at 390, 768, 1280, and 1440 px.
- Run TypeScript, targeted lint, build diagnostics, and browser console checks.
