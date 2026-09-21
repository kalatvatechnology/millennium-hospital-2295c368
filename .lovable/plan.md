# Prepare the frontend for the production hospital backend

## Goal

Adapt the existing website and staff interface to the audited production data model while preserving the current design, routes, workflows, and local Lovable data. Do not connect to production or modify any database, authentication, storage, environment setting, migration, policy, or generated integration file.

## Implementation

1. **Introduce a compatibility data layer**
   - Add frontend domain types, production table/field contracts, status constants, error classification, and row mappers.
   - Keep page components consuming stable UI-friendly models instead of production column names.
   - Centralize reads and writes behind repository functions using the existing database client.

2. **Adapt supported public content**
   - Prepare departments, doctors, facilities, reviews, FAQs, and media for `status = published` and production field names.
   - Map doctor fields including `full_name`, `whatsapp`, qualifications, specialization, consultation/location details, and social links without dropping richer data.
   - Map `media_content`, `platform`, and `show_on_homepage` to the existing media presentation.
   - Read FAQ categories from the FAQ text field rather than a category table.

3. **Abstract unified services and relationships**
   - Back both existing service screens with one production `services` repository while retaining the two current UI sections.
   - Preserve the distinction as an unresolved UI/product classification, not a new database field.
   - Prepare relationship reads through `doctor_departments`, `doctor_services`, and `department_services`.

4. **Adapt appointment enquiries**
   - Submit to `appointment_enquiries` with `preferred_doctor_id`, `preferred_department_id`, and `preferred_service_id`.
   - Keep `registered_contact_number` distinct and optional until its business meaning is confirmed.
   - Use only production enquiry statuses and remove the unsupported forwarding-table write; WhatsApp remains a client hand-off.
   - Add explicit user-safe handling for permission, authentication, invalid status, failed query, and empty-result outcomes.

5. **Align authentication, roles, and permissions**
   - Recognize `founder`, `co_founder`, and `brand_super_admin` alongside existing roles.
   - Wrap production permission checks (`can_admin`, `is_staff`, `can_edit_content`, `has_role`, `has_any_role`) without recreating or bypassing hierarchy rules.
   - Remove frontend manual audit-log inserts; production triggers remain authoritative and audit screens stay read-only.
   - Ensure role-management UI does not imply authority beyond production-enforced permissions.

6. **Isolate unsupported modules safely**
   - Mark Blog/Resources, clinical review, FAQ categories, profiles, enquiry forwarding, notifications, website pages, navigation, and profile requests as unavailable pending backend support.
   - Prevent their missing tables from affecting supported public pages or the staff shell.
   - Keep source code isolated for future product decisions rather than inventing replacements.

7. **Prepare storage integration constants**
   - Define the audited bucket names for doctor, department, service, facility, media, and site images.
   - Prepare display/upload call sites only; do not create buckets or perform production storage operations.

8. **Document and verify**
   - Update architecture and roadmap documentation with mappings, unsupported features, blockers, product decisions, and a production connection checklist.
   - Search the source tree for every legacy table, boolean publication field, old role check, project identifier, and backend-specific assumption; classify intentional remnants.
   - Run TypeScript and build validation, then smoke-test supported public and staff screens without production data.

## Technical details

- Generated database types remain untouched because they describe the current local backend; production contracts live in a separate frontend compatibility module.
- The compatibility target is selected in code configuration, but this task keeps the local backend active and production credentials absent.
- Existing UI routes stay unchanged. Data repositories map production records into the current page models.
- Unsupported modules render a consistent “backend not yet available” state and issue no unavailable-table queries.
- No SQL, migration, database CLI, storage mutation, authentication configuration, secrets, or environment-file edits are included.

## Product decisions left open

- How one production services collection should distinguish the two existing service experiences.
- Any non-exact mapping between old enquiry statuses and production statuses.
- Whether Blog/Resources, clinical review, FAQ category management, controlled pages, navigation management, notifications, and profile requests will receive production backend support.

## Completion report

Provide: files changed, intentionally untouched areas, blockers, required product decisions, post-preparation production connection checklist, validation results, remaining legacy references, remaining Lovable-specific references, and runtime risks.