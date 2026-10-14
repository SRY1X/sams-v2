# Troubleshooting

## Sign-in says configuration is missing

Check `.env.local` contains the Supabase URL, publishable key, and attendance signing secret. Restart `npm run dev` after changing environment values.

## Account is signed in but has no portal

The Auth account has no active `institution_memberships` row. Ask an institution administrator to invite/assign it, or use the documented trusted bootstrap procedure for the first local admin. Do not change a profile field to grant a role.

## Invitation or password reset email is missing

Check Supabase Auth redirect allow-list, provider email settings, SMTP configuration, spam folder, and local email testing inbox. Production mail requires verified sender configuration. Invitation UI also needs the server-only service-role key.

## Session creation is rejected

Confirm the faculty account is active and assigned to the selected section, its term is active, and no non-expired session is already open. An admin must set up course, term, section, assignment, and enrollment records first.

## QR says invalid or expired

Use the currently displayed code, keep the clock accurate, confirm the session remains open, and scan again. Confirm HTTPS in production, that the attendance secret is present in the server environment, and that the browser can open the deployed site.

## Local database does not start

Ensure Docker is running and the Supabase CLI is installed, then run `supabase status` and `supabase db reset`. Read the CLI output for port conflicts or image-download failures. Avoid linking local work to the production project.
