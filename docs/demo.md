# Preparing a synthetic demonstration

SAMS does not publish shared login credentials or automatically create hosted demo users. Create an isolated Supabase project for the demonstration and provision its users manually. The public repository contains no real institutional roster or attendance data.

## Create the accounts

1. Complete [hosted setup](setup.md) through the migration step.
2. In **Supabase → Authentication → Users**, create three distinct accounts and confirm them: one administrator, one faculty member, and one student. Use test email addresses or aliases you control. Choose unique passwords and do not publish them.
3. Copy each account's Auth UUID and run the membership SQL in the setup guide, replacing the example UUIDs.
4. Optionally update `profiles.display_name` for clearer demonstration screens. The Auth user creation trigger creates each profile automatically.
5. Deploy to a Vercel Preview or isolated Vercel project using the same Supabase sandbox and synthetic data.

## Prepare the workflow

Sign in as admin and create a department, academic term, course, and section. Assign the faculty user's UUID to that section and enroll the student user's UUID. Then sign in on separate browser sessions as faculty and student: faculty starts a session; student scans the live QR on an HTTPS phone page; faculty checks the attendance list and student checks their own history.

Do not seed this public repository with institution-specific records. For a presentation, use invented names and course data. Do not use real student photos, identifiers, emails, attendance exports, or shared passwords in screenshots or documentation.

## Refresh or remove a demonstration

Manage synthetic Auth users in the Supabase Authentication dashboard. Remove test accounts and their memberships when the demo is no longer needed. Use a dedicated disposable Supabase project so cleanup cannot affect production data. Never use a database reset, bulk delete, or project credential from a production institution to refresh a demo.
