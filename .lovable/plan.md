# Repair doctor specialization synchronization

## Diagnosis
- Dr. Amrut Hanchate has one current Dental Care department, but the database still contains two normalized specialization assignments: “Leading Implantologist” and an out-of-scope “Pediatrician” assignment from another department.
- The Profile selector hides the out-of-scope assignment, so removing the old department does not visibly expose or remove it.
- Profile saving rebuilds the legacy `doctors.specialty` summary by preserving values it considers “unmatched”; because “Pediatrician” belongs to a different department, it is treated as unmatched and written back.
- The Doctors listing and profile header read that legacy summary directly, while the profile’s specialization section reads `doctor_specializations`. These competing sources can diverge.

## Smallest safe fix
1. Make active normalized `doctor_specializations` relationships the single display source for current specializations.
2. When Profile departments/specializations are saved, remove normalized assignments that are no longer selected, including assignments belonging to removed departments.
3. Rebuild the compatibility `doctors.specialty` summary only from the saved normalized assignments; retain the legacy field for compatibility, but never let it re-add removed values.
4. Update the doctor repository and staff listing to fetch and map normalized specialization names consistently for listings, profile headers, preview, public profiles, cards, and search.
5. Keep legacy designation and qualification preservation unchanged; replace the misleading combined unmatched-values message with field-specific handling so specialization history is not presented as current selection.
6. Invalidate the public doctor list and profile queries after save so navigation reflects the saved relationships without a forced refresh.

## Data safety and verification
- No destructive schema migration, publishing change, RBAC/RLS change, or broad legacy-data deletion.
- Correct Dr. Amrut Hanchate’s stale specialization through the same save path, then verify the database contains only “Leading Implantologist”.
- Test another doctor to confirm the behavior is general.
- Verify Workspace reload, staff listing, staff Preview, public unpublished blocking, refresh persistence, existing Professional Services, TypeScript, build, console, and runtime logs.
- Leave `src/lib/utils.ts` unchanged; its reported diagnostic is currently not reproduced by the project build.
