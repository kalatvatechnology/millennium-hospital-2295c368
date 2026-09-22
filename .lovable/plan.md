# Upgrade the Doctor Workspace Profile

## Goal
Improve only **CMS → Doctors → Doctor Workspace → Profile** into a compact, draft-oriented data-entry workspace. Preserve existing doctors, departments, roles, security, public pages, and unrelated CMS areas.

## What will change
- Reorganize the Profile screen into clear groups: Professional Identity, Professional Information, Profile Content, Contact, Profile Image, and Draft Actions.
- Add a manually entered **Professional Registration No.** that remains separate from the hidden internal record ID.
- Keep Doctor Name required and generate an editable URL-safe slug as the name is entered. Check existing doctor slugs before saving and offer a safe numbered alternative when necessary.
- Reuse the existing Department relationship, designation, qualifications, and specialization fields rather than creating duplicate content systems.
- Limit Short Introduction to 100 characters and Biography to 500 characters, with live counters and inline validation.
- Split phone and WhatsApp into country code and number inputs. Preserve existing number values and allow the two contacts to differ.
- Replace manual profile-image URL entry with a 4:5 image workflow: supported file validation, preview, generated doctor-name filename, replace/remove actions, and editable ALT text with a factual suggestion.
- Keep new records as drafts. Replace the generic Profile save action with **Save Draft** and **Save & Continue**; no publish control will appear in the Profile workflow. Existing published records retain their current visibility when profile details are edited.

## Database and storage
- Add only genuinely missing doctor columns: professional registration number, phone country code, and WhatsApp country code.
- Add safe length checks for newly saved short introductions and biographies only after confirming existing records are compatible.
- Preserve the existing unique doctor slug constraint and all current doctor/department relationships.
- Create one dedicated doctor-image storage bucket because no approved bucket currently exists. Restrict files to JPG/JPEG/PNG/WebP, enforce the existing content-management permission for uploads/replacements/removals, and allow public reads for profile imagery.
- Keep image paths in the existing `photo_url` field; do not create a second media system or expose privileged credentials.

## Validation and safety
- Validate required fields, contact formats, character limits, image type, and slug uniqueness inline without popups.
- Keep existing RBAC and doctor RLS as the authority; storage write rules will reuse the existing `can_manage_content()` permission.
- Preserve existing doctor data and publication states. No doctor content will be invented or auto-populated.

## Verification
- Confirm manual registration number entry, slug generation/editing/duplicate handling, department selection, content limits, separate phone/WhatsApp values, image upload/preview/replace/remove, factual ALT suggestion, draft saving, and persistence after reload.
- Verify authenticated access, existing doctors/departments, unrelated CMS pages, and the public website remain functional.
- Check the Profile workspace at 390, 768, 1280, and 1440 widths, then run TypeScript, focused lint, and the production build.

## Explicitly out of scope
Doctor Profile themes, PDF generation, new public-profile functionality, authentication or role redesign, and unrelated CMS changes.
