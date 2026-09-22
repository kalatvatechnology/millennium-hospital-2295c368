# Enable Doctor Profile image uploads

## Goal
Make Doctor Workspace profile-image upload, replacement, removal, preview, and public display work with the existing approved storage while preserving current doctor data, publication state, and CMS security.

## Changes
- Reuse the existing private `doctor-profile-images` bucket; do not create another bucket or change unrelated storage.
- Keep its 5 MB limit and add storage-policy checks for JPG/JPEG, PNG, and WebP files while retaining `can_manage_content()` for upload, replace, and removal.
- Serve stored doctor images through a read-only public app endpoint backed by the bucket's anonymous SELECT policy, without exposing privileged credentials.
- Connect the Profile image editor to the bucket, remove the unavailable message, preserve 4:5 guidance, preview, generated doctor-name filenames, ALT text, and factual ALT suggestion.
- Clean up managed files safely when an uploaded image is replaced, removed, or cancelled; leave existing external image URLs untouched.

## Verification
- Confirm anonymous reads work and anonymous writes are denied.
- Verify an authorized CMS session can upload, preview, replace, remove, and save without publishing the doctor.
- Confirm existing doctor records and images remain unchanged.
- Run TypeScript, focused lint, automated build, and browser checks.

## Technical details
- Add one `/api/public/doctor-profile-image` GET route with strict path validation and immutable image caching.
- Store the endpoint URL in the existing `photo_url` field; no second media system or service-role frontend code.
- Add a focused migration that tightens only the existing bucket's INSERT/UPDATE policies.
