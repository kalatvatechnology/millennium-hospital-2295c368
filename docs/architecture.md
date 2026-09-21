# Website architecture

## Purpose
This project is the public website and future content management foundation for The Millennium Hospital. It separates reusable presentation, hospital settings, content placeholders, and page routes so each part can change without rewriting the whole site.

## Main folders
- `src/routes` contains one file for each public or administration web address.
- `src/components/layout` contains the shared public header, footer, and page shell.
- `src/components/shared` contains reusable page headings and loading, error, and empty states.
- `src/components/ui` contains low-level buttons and form controls.
- `src/config/site.ts` is the single source for the hospital name, contact details, address, WhatsApp, and social links.
- `src/content` holds temporary content shapes until a content database is connected.

## Content safety
Unknown hospital details are represented as `null`. The website hides them or says they are not yet published. Do not replace these values with guesses. Doctor, service, facility, review, and article collections remain empty until verified content is provided.

## Public and administration areas
Public pages use `PublicPage`, which supplies the website header and footer. Administration pages use their own quiet workspace style and are excluded from search indexing. Login and saved content are not active because no secure backend has been connected.

## Future content connection
When a backend is added, keep private keys on the server. Public pages should read published records only. Administration pages and every create, edit, or delete action must verify the signed-in staff member on the server, not only in the browser.

## Accessibility
Pages use landmarks, heading order, labelled form fields, keyboard focus indicators, clear link names, reduced-motion support, and colour contrast intended to meet WCAG AA. New content should keep image descriptions meaningful and avoid using colour alone to convey information.

## Search visibility
Every page supplies its own title, description, Open Graph title and description, page type, and Twitter card. Unpublished detail pages and all administration pages tell search engines not to index them.
## Staff area and roles

The staff area lives at `/_admin` and is protected by Supabase Auth plus database
row-level security. Screen-level permission checks (`src/lib/permissions.ts`,
`src/hooks/use-admin-session.ts`) only hide controls; the database policies are the
real security boundary.

Roles (`app_role`): `super_admin`, `admin`, `editor`, `writer`, `front_desk`, `doctor`.

- Super admin: everything, including granting and removing roles (`user_roles`).
- Admin: all content, enquiries, audit logs; cannot change roles.
- Editor: content plus publishing.
- Writer: content, but the `enforce_publish_authority` trigger blocks publishing.
- Front desk: enquiries only.
- Doctor: own dashboard, clinical blog review (`restrict_doctor_blog_edits` limits
  them to review fields), and profile change requests instead of direct edits to
  their public profile.

Supporting tables: `profiles` (created automatically on sign-up), `user_roles`,
`audit_logs`, `notifications`, `doctor_profile_change_requests`, `locations`,
`website_pages`, `navigation_items`.

Verified by test: front desk cannot write content or grant roles, writers cannot
publish, anonymous visitors cannot read audit logs or profiles, and every staff
create/update/delete is written to the audit log.
