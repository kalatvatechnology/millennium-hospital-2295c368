# Fix pre-production compatibility blockers

## Goal
Resolve only the verified frontend compatibility blockers while keeping the production backend disconnected and unchanged.

## Changes
- Replace production role-derived UI permissions with a centralized permission service that calls the existing production permission functions. Preserve the current local-backend role behavior for local testing; never duplicate production rank logic.
- Move supported staff reads and writes for enquiries, users/roles, audit logs, and dashboard counts behind the compatibility repository, returning stable domain models and classified permission errors.
- Keep blog, notifications, profile requests, and other unsupported production modules gated before any unavailable query can run.
- Remove the unconfirmed `services.name` selection from the production enquiry-options query and use the established `title` field only. Keep both service pages, backed by the unified service repository, with hospital/professional classification explicitly unresolved rather than invented.
- Preserve `registered_contact_number: null`, production enquiry status values, trigger-owned audit logging, and the six storage bucket constants.
- Replace explicit `any` usage and fix meaningful lint issues only in files touched by this compatibility work; do not mass-format unrelated code.

## Verification
- Confirm `src/lib/utils.ts` remains unchanged unless the current compiler reproduces its stale diagnostic.
- Run TypeScript, the automated production build, lint with before/after counts, and local public/staff browser smoke tests.
- Search again for legacy backend terms and classify remaining occurrences as production-safe, local-only, legacy/dead, documentation, or blocker.
- Report exact changed files, remaining direct data calls and reasons, tested roles, unresolved production-only testing, and one readiness verdict. Do not connect to or modify production.

## Technical details
- The database remains the authorization boundary; UI permission checks only control visibility and actions.
- Production permission calls use `can_admin`, `is_staff`, `can_edit_content`, `has_role`, and `has_any_role`; `role_rank` and `actor_max_rank` are never recreated client-side.
- Local compatibility stays isolated through the existing backend target switch so current preview data and staff workflows remain testable.
