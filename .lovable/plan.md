# Millennium Hospital product alignment and UX quality gate

## Scope
Align the existing public website and staff workspace with the approved Millennium Hospital product direction in `Prompt_6-2.txt`. Preserve all routes, data contracts, relationships, enquiry behavior, and security boundaries. Keep the production backend disconnected and make no database, Auth, RLS, Storage, migration, enum, credential, or environment changes.

## Implementation

### 1. Resolve verified frontend blockers
- Keep the valid six-line `cn()` utility unchanged unless a fresh diagnostic identifies a real source.
- Add the separate optional Registered Contact Number field to every enquiry form and preserve it as a distinct nullable value.
- Correct missing form-label associations and user-facing error handling found in the previous audit.
- Keep WhatsApp as a transparent client-side handoff without forwarding-history writes or false status claims.

### 2. Refine the public hospital experience
- Retain the fixed 12-section homepage and approved Millennium navy/red token system.
- Improve hierarchy, whitespace, section rhythm, CTA clarity, imagery treatment, empty states, and mobile layouts without replacing the approved visual direction.
- Refine doctor cards and the doctor profile into a richer physician experience using only available production fields: designation, qualifications, specialization, experience, consultation information, location, WhatsApp, social links, departments, and services.
- Preserve separate Professional Services and Hospital Services experiences while leaving backend classification explicitly unresolved.
- Preserve selected hospital/doctor reviews, media relationships, and the required 5/3/1 reels and 4/3/1 video layouts.

### 3. Align the staff workspace
- Keep the settled CMS structure: Doctors, Departments, both service experiences, Facilities, FAQs, Reviews, Media & Content, Blog / Resources, Appointment Enquiries, Users & Roles, and Audit Logs.
- Remove generic page-builder/navigation items from the primary product structure while retaining safely isolated code where required for compatibility.
- Keep Blog / Resources visible as a settled frontend product area, with an explicit “Backend required” state when production support is unavailable rather than removing it.
- Make Users & Roles independent of the profiles feature flag and expose only the six approved operational roles in its normal interface.
- Present Super Admin as the highest product authority and provide a clear responsibility/delegation UI using existing backend authorization only; do not invent permissions or a second RBAC system.
- Improve staff navigation, tables, forms, filters, status indicators, dialogs, empty states, and mobile usability using the existing design system.

### 4. Reviews and content workflows
- Clarify hospital reviews versus doctor reviews and preserve the settled staged Google review workflow in the management experience only where existing data supports it.
- Retain the advanced Blog CMS surface and clearly distinguish “Frontend ready” capabilities from “Backend required” capabilities without inventing database fields.
- Preserve doctor clinical review without publication authority.

### 5. Accessibility, SEO, and performance
- Fix verified labels, focus behavior, alt text, dialog/error announcements, heading hierarchy, and touch targets.
- Add unique page metadata to every content route; improve dynamic doctor/department/service/facility/blog metadata where loader data permits.
- Add the missing sitemap and preserve robots/canonical/structured-data architecture without inventing content.
- Keep images lazy-loaded where appropriate, avoid layout shifts and heavy visual effects, and preserve route-level loading/error/empty states.

## Verification
- Run TypeScript, production build, targeted lint for changed files, and available automated tests.
- Exercise public patient journeys and authenticated local staff journeys without touching production.
- Check 390px, 768px, and 1440px layouts for navigation, doctor pages, services, enquiry, media, reviews, blog, staff tables/forms/dialogs, empty states, and permission states.
- Verify no production credentials, service-role key, backend mutation, unsupported production query, or security regression was introduced.
- Return the requested A–L report and exactly one final verdict: **READY FOR NEXT CONTROLLED BACKEND VERIFICATION** or **NOT READY**.
