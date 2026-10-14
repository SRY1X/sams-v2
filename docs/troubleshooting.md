# Troubleshooting

## Sign-in says configuration is missing

Check that the Vercel environment has `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `ATTENDANCE_TOKEN_SECRET`. Redeploy after changing Vercel environment variables. For optional local app work, check `.env.local` and restart `npm run dev`.

## Auth user can sign in but has no portal

An Auth user needs an active `institution_memberships` row with the correct role. Copy the user's UUID from Supabase Authentication → Users and ask a trusted project owner to check the role assignment in SQL Editor. Changing profile metadata does not grant access.

## Invitation or password reset email is missing

Check Supabase Auth redirect allow-list, provider email settings, verified sender/SMTP configuration, and spam folders. The invitation UI also needs the server-only service-role key; manual Auth user creation does not. Do not paste the key into client-visible settings or share it in logs/screenshots.

## Session creation is rejected

Confirm the faculty membership is active and assigned to the section, the academic term is active, the section exists, and no unexpired session is already open. The admin must create the department/course/term/section, faculty assignment, and student enrollment first.

## QR says invalid or expired

Use the currently displayed code, keep the device clock accurate, confirm the session remains open, and scan again. Verify the server has the correct `ATTENDANCE_TOKEN_SECRET` and the phone can reach the same HTTPS deployment. Preview and production need different secrets; a secret mismatch invalidates tokens.

## Camera permission is unavailable

Browser camera APIs require a secure context. Open the deployed Vercel HTTPS site on the phone, allow camera access in the browser, and use that page to scan the faculty display. Plain HTTP addresses on a computer's LAN are not secure browser origins. If testing a Preview, configure it to use a separate staging Supabase project.

## User sees no courses or sections

Check that the user has an active membership, that the faculty user is assigned or the student enrolled in the correct section, and that the records belong to the same institution. RLS intentionally hides unrelated academic data.

## Migration command shows an unexpected project

Stop before applying it. Check the project reference in the Supabase dashboard and run `npm exec -- supabase link --project-ref YOUR_EXPECTED_PROJECT_REF`, then review `npm exec -- supabase db push --dry-run --linked` again. Never use a reset command or apply a migration to production without reviewing its target and effect.

## CI database job fails

Inspect the GitHub Actions `database` job output for migration, SQL lint, or pgTAP failures. That job starts its own isolated database in GitHub Actions. A contributor may reproduce database checks with a disposable local Supabase stack and Docker, but Docker/WSL are not required for ordinary application use or UI contributions.
