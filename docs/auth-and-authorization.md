# Authentication and authorization

SAMS uses cookie-based Supabase Auth with PKCE-compatible SSR helpers. Server-side page and mutation checks use verified claims; the app does not trust the profile name or user metadata as a role. Membership rows in PostgreSQL are authoritative.

## Roles

- **Student:** Read own profile, active enrollments, relevant section/session data, and personal attendance; claim attendance only for an active session in an enrolled section.
- **Faculty:** Read assigned sections, rosters, and attendance; create and close sessions only for assigned sections.
- **Admin:** Manage academic structure and institution memberships, inspect institution-scoped attendance/audit records, and invite students/faculty.

Admins cannot promote themselves from the UI. They may suspend or restore another member; role changes and first-admin bootstrap require an explicitly trusted project-owner operation. Admin invitations use the optional server-only service-role key only after checking the administrator’s active membership in the user-scoped request; routine data requests never use that key.

Every Server Action and Route Handler rechecks the current authenticated user and required role. RLS independently protects database rows. Authentication grants identity, not institutional access. Suspended or missing membership results in the access-pending screen.

Email recovery and invitation callback destinations are restricted to a same-origin path. Configure exact project redirect URLs, public sign-up disabled, a verified production mail provider, and appropriate Auth rate limits before production use.
