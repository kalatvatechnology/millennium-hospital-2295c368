# The Millennium Hospital website

## Project overview
This project contains the hospital's public website and protected staff workspace. Public pages read only published hospital content from Lovable Cloud. Unknown details remain unpublished rather than being guessed.

## Architecture
- TanStack Start supplies server rendering and file-based routes.
- React Query handles live content reads and loading/error states.
- Tailwind CSS and shared UI components provide the visual system.
- Lovable Cloud provides authentication, content records, enquiries, permissions, notifications, and audit records.
- Public presentation lives in `src/components`; live queries and permission helpers live in `src/lib`.

## Routes
Public routes cover the homepage, about, departments and profiles, doctors and profiles, professional and hospital service profiles, facilities and profiles, media, FAQs, reviews, articles and profiles, contact, privacy, and terms. Unknown public addresses use the application's not-found experience.

The staff workspace at `/_admin` covers the dashboard, doctors, departments, both service types, facilities, locations, enquiries, media, FAQ categories, FAQs, reviews, articles, website pages, navigation, users and roles, notifications, profile requests, and audit logs.

## Database structure
Core records include departments, doctors, professional services, hospital services, facilities, locations, media, FAQs, reviews, articles, enquiries, forwarding records, and their many-to-many relationships. Staff support records include profiles, roles, notifications, audit logs, website pages, navigation items, and doctor profile-change requests.

Relationships use foreign keys and publishing fields. Public reads are restricted to published records. Enquiries are accepted publicly but remain private to authorised staff.

## Roles and permissions
Roles are `super_admin`, `admin`, `editor`, `writer`, `front_desk`, and `doctor`.

- Super admin: full access, including role assignment.
- Admin: delegated content, enquiry, and audit access; cannot grant roles.
- Editor: content editing and publishing.
- Writer: content drafting without publishing authority.
- Front desk: enquiry-focused access.
- Doctor: assigned clinical reviews and profile-change requests; cannot directly change the authoritative public profile.

Screen permissions improve usability, but database row-level policies and publishing triggers are the security boundary. Staff actions write to the audit log.

## Media and storage
Content records support image URLs and external video URLs. Videos stay external. A managed upload workflow with replacement cleanup and orphan checks is not yet verified in this codebase; administrators should use only approved image URLs until that work is completed.

## Search visibility
Content pages define page-specific titles, descriptions, Open Graph metadata, and Twitter cards. Admin and unpublished detail pages are excluded from indexing. `public/robots.txt` exists. Canonical URLs, a generated sitemap, complete structured data, and redirect rules still require production-domain verification.

## Security
- No privileged backend key is shipped to the browser.
- Authentication protects staff access.
- Database policies enforce role restrictions for reads and writes.
- Publishing triggers stop writers and clinical reviewers from publishing.
- Doctors submit profile changes for approval instead of editing public records.
- Public enquiry creation does not grant public enquiry reads.

## Content and legacy rules
Legacy material is a research source only. Do not copy it without verification. Use the statuses Verified, Source Confirmed, Unverified, Conflicting, Pending Verification, and Archived during content review. Never invent clinicians, departments, qualifications, insurers, statistics, reviews, or medical claims. A testimonial-only name is not enough to create a clinician profile.

## Accessibility and performance
The interface includes keyboard focus states, labelled controls, semantic headings, 44px touch targets, reduced-motion support, lazy-ready media presentation, stable card layouts, and mobile navigation. Desktop and mobile checks found no horizontal overflow on the homepage or staff sign-in screen.

## Deployment requirements and unresolved items
- Replace unpublished contact, map, opening-hours, and social fields with verified hospital information.
- Add and verify real hospital imagery and meaningful alternative text.
- Complete and test managed image upload, replacement, deletion, and orphan cleanup policies.
- Verify canonical URLs, sitemap, structured data, redirects, broken links, and production analytics after a production domain is connected.
- Perform final authenticated cross-role browser testing with designated staff accounts before launch.

## Verification
The latest TypeScript check passes, the preview build reports `build OK`, and desktop/mobile browser checks render without page errors or horizontal overflow. This is not a claim that production content, every authenticated role journey, storage cleanup, or domain-level SEO has been fully verified.