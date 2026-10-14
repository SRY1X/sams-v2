# Deploying SAMS with Supabase and Vercel

This guide deploys the Next.js app to Vercel and connects it to one institution's hosted Supabase project. Supabase and Vercel are replaceable integrations; use a separate project pair for every institution. For new adopters, [hosted setup](setup.md) is the step-by-step entry point.

## Prepare Supabase

1. Create a new Supabase project for this institution. Use a separate project for preview/staging and production when possible.
2. From a trusted computer, clone the repository, install its pinned dependencies, link the Supabase CLI to the intended project, review the migration dry run, and apply it:

   ```sh
   git clone https://github.com/SRY1X/sams-v2.git
   cd sams-v2
   npm ci
   npm exec -- supabase login
   npm exec -- supabase link --project-ref YOUR_PROJECT_REF
   npm exec -- supabase db push --dry-run --linked
   npm exec -- supabase db push --linked
   ```

   Verify the project name and reference in the Supabase dashboard before applying. The first migration creates a neutral placeholder institution and settings. It does not create Auth users or a hosted demo catalog.

3. Customize the placeholder institution through SQL Editor. See [setup](setup.md) for the update statement and timezone guidance.
4. In **Authentication → Users**, manually create one account per desired role (admin, faculty, student), confirm them, and copy their Auth UUIDs. Insert their `institution_memberships` in SQL Editor using the example in [setup](setup.md). The first admin membership is a trusted owner operation; no public self-promotion is available.
5. Configure Auth URL settings: set Site URL to the Vercel HTTPS domain and allow the exact `/auth/callback` URL. Keep public sign-up disabled. Configure verified email delivery if you use invitations or recovery links.

## Configure Vercel

1. Import `SRY1X/sams-v2` into Vercel and select `main` as the production branch.
2. Confirm the project uses the Next.js framework, `npm ci` for installation, and `npm run build` for builds.
3. Add environment variables in the encrypted Vercel settings:

   | Variable                               | Preview / staging                     | Production                                |
   | -------------------------------------- | ------------------------------------- | ----------------------------------------- |
   | `NEXT_PUBLIC_SUPABASE_URL`             | Staging Supabase project URL          | Production Supabase project URL           |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Staging publishable key               | Production publishable key                |
   | `ATTENDANCE_TOKEN_SECRET`              | Unique random secret                  | Different unique random secret            |
   | `NEXT_PUBLIC_SITE_URL`                 | Exact HTTPS preview origin            | Canonical production HTTPS origin         |
   | `SUPABASE_SERVICE_ROLE_KEY`            | Optional; only if testing invitations | Optional; only if invitations are enabled |

   Manual Auth account creation does not require the service-role key. If you enable invitation support, keep it server-only and never use it for ordinary user requests.

4. Generate a separate token-signing key for each environment:

   ```sh
   node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
   ```

5. Set Supabase Auth Site URL and redirect allow-list to match that deployment. Keep Preview on its own staging project so preview links never access production data.
6. Deploy and verify login, role routing, faculty section management, student QR scanning on HTTPS, attendance history, and RLS denials using synthetic users.

## Automated checks and migrations

GitHub Actions checks formatting, lint, TypeScript, unit tests, production build, SQL lint, and database/RLS tests. The database job starts its own isolated Supabase stack in GitHub's runner; developers do not have to run Docker or local Supabase for routine changes. The workflow has read-only repository permissions and no hosted project credentials.

Vercel Git integration builds preview deployments for pull requests and production from the selected branch. Database migrations remain an explicit, reviewed operator step; CI must not mutate a hosted database. Require quality checks and review for changes to migrations, RLS, Auth, role provisioning, signing, and personal-data handling.

## Production verification

- Review migrations and database security/advisor results before importing institutional data.
- Test student, faculty, admin, unauthenticated, suspended, and cross-institution access, including denied reads and writes.
- Test an eligible scan, expired token, duplicate scan, non-enrolled student, closed session, faculty assignment revocation, and network retry.
- Use HTTPS on a mobile browser and synthetic accounts. Camera video is processed in the browser and must not be collected or logged.
- Confirm public sign-up is disabled, Auth redirects are limited to domains you control, and no account can promote itself to admin.
- Review logs for tokens, credentials, email addresses, names, and attendance contents.
- Confirm an accountable operator can restore a backup and roll back an application deployment. For applied database migrations, use reviewed forward migrations instead of assuming a down migration is safe.

## Portability and recovery

The app does not depend on Vercel-only business APIs. Another Node.js host can run the Next.js app. PostgreSQL constraints and policies remain in versioned migrations. Replacing Supabase Auth requires a separately designed identity adapter and migration plan. Take and verify backups before risky data/schema operations, and define incident response, retention, and recovery ownership before production use.
