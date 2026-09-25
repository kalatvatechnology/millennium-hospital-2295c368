# Department CMS V2.1 — Workspace UX

## Goal
Improve the existing full-page Department editor so staff can immediately see the current section, publishing state, save state, and profile readiness. Preserve all verified V1 data, permissions, draft/preview/publish behavior, image handling, relationships, and public pages.

## What will change

### 1. Workspace header and save state
- Refine the existing header into a compact workspace summary showing the department name, current published/draft state, completion percentage, last saved time, and one accurate state: Unsaved changes, Saving…, Saved, or Save failed.
- Keep the existing Cancel, Save Draft, Preview, Publish, and Unpublish actions and their current handlers. Only improve their placement, labels, disabled states, and hierarchy.
- Keep unsaved form data after a failed save and show the failure without reporting it as saved.

### 2. Deterministic completion model
- Add a small frontend-only completion utility based exclusively on fields and linked content already loaded by the workspace.
- Classify existing sections as Complete, Needs attention, or Optional / not applicable.
- Mark only current V1 validation requirements as required; treat helpful content such as FAQs, media, and enhanced SEO as recommendations that never block saving.
- Show a compact readiness card with the percentage and a short list of missing items. Each missing item links directly to its existing section.

### 3. Smart section navigation
- Keep the 11 existing V1 sections and route structure; do not invent Services, Locations, or other unsupported sections.
- Upgrade desktop navigation with a clear active state, accessible status indicators, and a sticky position within the available workspace.
- Use a compact mobile section control that keeps active-section and completion information visible without recreating the desktop sidebar.
- Preserve Previous/Next navigation and add section-aware missing-item navigation.

### 4. Unsaved-change protection
- Reuse the current baseline comparison as the single dirty-state source.
- Warn before browser refresh/close and before leaving the Department workspace when edits are unsaved, using the existing browser/router confirmation mechanism rather than a new modal system.
- Allow navigation between Department sections without warning because all sections share the same in-memory draft; warn only when leaving the workspace.

### 5. Visual and accessibility refinement
- Use existing Millennium design tokens and current design-system controls only.
- Improve spacing, hierarchy, touch targets, focus states, screen-reader labels, and status text without redesigning form contents or public pages.
- Keep the interface restrained: no new visual libraries, heavy effects, or decorative animations.

## Technical details
- Primary work remains in the existing `DepartmentWorkspace`; extract only small reusable completion/status helpers where this reduces duplication.
- No database migration, RLS/auth/RBAC change, repository change, relationship change, storage change, or public Department page change.
- The existing `src/lib/utils.ts` currently contains six valid lines and the latest preview build is clean; final checks will confirm that the reported stale line-8 type error is absent.

## Verification
- Run the TypeScript check and confirm the preview build is clean.
- Test the authenticated Department workspace with existing data only; do not modify or publish Orthopedics or any other Department.
- Verify section navigation, completion calculations, required/recommended labels, dirty/saving/saved/failed presentation where safely reproducible, leave warning, and Preview access.
- Visually inspect 1440, 1280, 1024, 768, 430, 390, and 375 px widths for overflow, clipped actions, broken navigation, and overlapping sticky elements.
- Report PASS / FAIL / NOT TESTED accurately, especially for Save Draft and publishing behavior when testing would alter existing Department data.
