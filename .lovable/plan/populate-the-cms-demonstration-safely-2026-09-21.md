# Populate the CMS demonstration safely

## Goal
Create a clearly labelled, CMS-driven Millennium Hospital demonstration using the existing local Lovable Cloud data model. Preserve the current architecture and do not alter production data, schemas, security, authentication, roles, storage policies, appointments, or unrelated pages.

## Implementation
- Create one demonstration Dental Department, one Dr. Amrut Hanchate demo profile, one Dental Implants professional service, and one hospital-service demonstration record in the empty local database.
- Mark all unverified facts and educational copy explicitly as demonstration content; add no patient reviews, awards, registrations, medical promises, external profiles, or invented contact details.
- Use the existing doctor photo URL field for a replaceable temporary demonstration portrait and preserve the existing appointment/WhatsApp flow.
- Connect the existing doctor → department, doctor → professional service, and department → professional service relationships.
- Enrich only the existing doctor, department, professional-service, and hospital-service public detail presentations so fully populated CMS text and relationships are easy to evaluate.
- Keep public list/detail queries driven by database records; do not hard-code the demonstration records into page components.

## Existing backend limitations
- Departments, professional services, and hospital services currently have no image field, so their requested CMS image lifecycle cannot be implemented without a schema change. This task will leave those image areas absent rather than hard-code assets.
- The CMS currently edits image URLs rather than uploading files, and no storage buckets exist. Storage and policy changes are explicitly outside this task.
- Hospital services have no relationship tables for doctors, departments, or FAQs. Their page will use only supported CMS text and the existing enquiry flow.
- The current schema stores one primary department per doctor; the demonstration will use that supported relationship.

## Verification
- Confirm the reported utility diagnostic is absent with a fresh TypeScript check.
- Verify the local records and relationships through database reads.
- Test a CMS text change and doctor-image URL replacement, then confirm both appear publicly without frontend code changes.
- Check doctor, department, and both service pages on desktop, tablet, and mobile with no overflow or patient-facing technical errors.
- Run targeted lint and the automated build, then report created content, CMS-controlled fields, tested flows, backend gaps, and safety status.
