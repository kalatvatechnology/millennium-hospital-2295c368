# Correct Doctor Hero Background Usage

## Goal
Keep the doctor portrait and decorative Hero background completely independent, while preserving all existing image data and security.

## Changes
- Add dedicated nullable Hero background image, ALT text, and focal-position fields. Preserve the existing profile image and legacy Hero image fields without reinterpreting or migrating their contents.
- Update Doctor Workspace → Hero & Statistics to label and explain “Hero Background Image,” retain one responsive 16:9 upload with Desktop/Tablet/Mobile cover previews, and keep Left/Center/Right focal positioning.
- Store new Hero backgrounds in the existing secure doctor image bucket under unique managed Hero paths. Keep cache-safe replacement, read verification, deferred cleanup, and existing content-management permission checks.
- Render the new Hero background as a responsive cover layer behind the public doctor information, with a restrained readability treatment. Continue displaying the doctor portrait from the existing profile-image field only.
- Preserve profile information when Hero is off, empty, or invalid; never publish a doctor or modify unrelated CMS sections.

## Data safety
- Existing `photo_url`, `hero_image_url`, and their stored objects remain unchanged.
- No existing Hero image is automatically treated as a background because it may contain a doctor portrait.
- Only newly selected/uploaded Hero background images populate the dedicated fields.

## Verification
- Confirm portrait/background independence, visibility rules, focal positions, readable overlay, and profiles without backgrounds.
- Check CMS previews and public profile at desktop, tablet, and mobile widths.
- Verify authorized upload/replacement/removal, cache-safe cleanup, unauthorized denial, TypeScript, and the automated build.

## Technical details
- Reuse the current doctor table, storage bucket, secure delivery endpoint, RBAC/RLS, image lifecycle, and semantic design tokens.
- Add only dedicated Hero-background columns and corresponding generated types/models/mapping.
