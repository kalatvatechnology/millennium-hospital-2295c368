# Refine the global specialization card

## What will change
- Extract the specialization tile markup into one reusable `SpecializationCard` used by the doctor profile route for both Staff Preview and public profiles.
- Place the existing specialization icon and title in one horizontal header row.
- Remove only the icon’s border, background, and framed container while keeping the outer card unchanged.
- Keep descriptions below the complete icon-and-title row, allow long titles to wrap, and preserve the existing neutral fallback when an icon fails.

## Technical details
- Make this a presentation-only change in `src/routes/doctors.$slug.tsx`.
- Preserve dynamic doctor, department, specialization, image URL, description, publication, and permission behavior.
- Do not change `src/lib/utils.ts`, backend data, storage, uploads, or image records.

## Verification
- Check TypeScript and the automated production build.
- Verify Dr. Amrut Hanchate only as a test case in Staff Preview and public-profile behavior.
- Check desktop, tablet, and mobile layouts for icon/title alignment, descriptions below, fallback safety, and horizontal overflow.
