# Department-Based Doctor Profile CMS

## Goal
Extend the existing Doctor Profile CMS so one doctor can belong to multiple departments and all professional options are selected from real department relationships. Preserve current routes, design, permissions, storage, public profiles, images, statistics, services, and legacy doctor data.

## Database changes
- Reuse `departments`, `doctors`, `professional_services`, `professional_service_departments`, `professional_service_doctors`, `doctor_statistic_definitions`, `doctor_statistics`, and the existing doctor-image bucket.
- Add a `doctor_departments` relationship table and backfill every existing `doctors.department_id` relationship. Keep `department_id` as the compatible primary-department fallback.
- Add reusable department-linked libraries for designations, qualifications, and specializations, plus doctor assignment tables. Backfill distinct non-empty legacy `designation`, `qualifications`, and `specialty` values where a department is known; preserve all legacy values regardless.
- Add optional department relationships to statistic definitions so a definition with no department remains generic, while linked definitions are available only through selected departments.
- Extend specialization assignments with description, icon override, visibility, and ordering so each doctor can customize selected reusable specializations without changing the global definition.
- Use case-insensitive uniqueness rules to prevent duplicate options within the same scope.
- Add explicit grants, RLS, content-management policies, indexes, timestamps, and public-read policies limited to published doctor output. Do not change roles or authentication.

## Professional Information
- Keep registration number, slug, name, profile content, contacts, and profile image behavior unchanged.
- Replace the single Department selector with a searchable multi-select showing selected tags.
- Show a department group for each selected department, with searchable Designation, Qualification, and Specialization selectors populated from database relationships.
- Preserve legacy professional values visibly when they have not yet been matched to a reusable option.
- Add small existing-style dialogs for creating a Designation, Qualification, or Specialization under the chosen department. On success, update the selector immediately and select the new option.
- Save the primary selected department and compatible legacy text/arrays along with the new normalized relationships, without publishing the doctor.

## Hero, Statistics, and Specializations
- Leave the Hero background controls and image behavior unchanged.
- Filter the statistic library to generic definitions plus definitions linked to any selected doctor department.
- When creating a statistic, allow generic or selected-department scope while preserving the existing value, icon, override, ordering, and enable controls.
- Place the department-aware Specializations selection and content controls in Hero & Statistics as requested, using searchable multi-select rather than free-text cards.
- Support specialization description and icon upload, preview, replacement, and removal through the existing private bucket and secure image endpoint. Every upload uses a unique managed path and deferred cleanup.
- Keep existing doctor-specialization rows readable and editable during migration.

## Professional Services
- Replace the existing service checkbox list with a searchable multi-select.
- Query services through `professional_service_departments` and show only services linked to the doctor's selected departments, grouped with their department context.
- Preserve existing assigned services even if legacy data has no matching selected department, so saving cannot silently remove them.
- Add an existing-style dialog to create a professional service under a selected department, prevent equivalent duplicates, update options immediately, and select it for the doctor.

## Public compatibility
- Read all normalized doctor departments and professional assignments while retaining legacy fallbacks.
- Keep current public layout and visibility rules; only expand displayed department/professional data when normalized relationships exist.
- Do not alter publication status or create invented clinical content.

## Verification
- Regenerate database types and verify grants/RLS after the additive migration.
- Test an unpublished doctor with two departments: department tags, scoped designation/qualification/specialization options, generic plus scoped statistics, and services from both departments.
- Test every Add New flow, duplicate prevention, immediate selection, save, refresh persistence, and legacy-value preservation.
- Test specialization icon upload, preview, save, refresh, cache-safe replacement, removal, and cleanup.
- Confirm no checkbox lists remain for Department, Designation, Qualification, Specialization, Statistics selection, or Professional Services.
- Confirm public profiles, Hero background, portrait, statistics, services, authentication, and permissions still work on desktop and mobile without publishing a doctor.

## Technical details
- Implement small reusable searchable single-select and multi-select controls with existing Command/Popover/Button components.
- Keep normalized relationship writes staged behind the existing Save/Cancel workflow where practical; Add New library records save immediately because they must become reusable options.
- Keep `src/lib/utils.ts` unchanged; the reported line-8 diagnostic is stale because that file has only six lines and its current function returns a string.
