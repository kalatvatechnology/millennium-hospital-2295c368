# Restore specialization icons in doctor profiles

## Goal
Make Staff Preview and published doctor profiles reuse the existing specialization icons already visible in the Doctor Workspace, without changing records, uploads, permissions, publishing, or layout architecture.

## Changes
- Include the specialization master icon and description, plus the existing doctor-specific icon override, in the doctor profile read query.
- Map each specialization to one resolved icon using the same priority already used by the workspace: doctor override, master icon, then legacy icon.
- Render that resolved icon in the existing specialization card, with a neutral fallback that never shows a broken image.
- Keep specialization names, descriptions, assignments, files, storage, RLS, RBAC, and publication rules unchanged.

## Verification
- Confirm Dr. Amrut Hanchate’s saved icon references remain unchanged.
- Verify the same existing icons in the workspace and Staff Preview after refresh.
- Verify unpublished public access remains blocked; if a published profile is available, verify its icons through the same shared profile path.
- Check desktop, tablet, and mobile sizing, aspect ratio, overflow, broken requests, and console errors.
- Run TypeScript checks and inspect the automated production build result; leave `src/lib/utils.ts` unchanged.
