# Deployment with Vercel and Supabase

The app uses standard Next.js server features and PostgreSQL-backed rules; Vercel is the initial hosting option, not a domain requirement.

## First deployment

1. Create a fresh Supabase production project and apply the reviewed migrations with the Supabase CLI from a trusted release environment. Do not apply migrations automatically from an unreviewed pull request.
2. Create the initial Auth admin through Supabase Auth and grant the first membership using the trusted bootstrap SQL in `docs/setup.md`.
3. Create a Vercel project connected to the GitHub repository. Use the repository’s npm lockfile and build command `npm run build`.
4. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `ATTENDANCE_TOKEN_SECRET`, and `NEXT_PUBLIC_SITE_URL` to the intended Vercel environment. Add `SUPABASE_SERVICE_ROLE_KEY` only if the admin invitation feature will be enabled. Store all server secrets in Vercel’s encrypted environment settings, never in Git.
5. Add the deployment callback URL to Supabase Auth’s redirect allow-list and keep public sign-up disabled. Configure verified SMTP, recovery/invitation templates, backups, and provider account access before inviting real users.
6. Use a separate staging Supabase project for Preview deployments. Use synthetic data only in previews; never point a public preview at production student records.

## Releases and recovery

Review and test migrations locally before applying them to staging and production. Prefer additive, backwards-compatible schema changes; take a verified backup before risky changes. Keep rollback focused on application code, and use a forward migration when database data or schema has changed. Rehearse restore and rollback before the first production release.

Enable platform request protections/rate limits for sign-in, password recovery, invitation, and attendance claim endpoints. Monitor uptime and aggregate failures without logging credentials, QR tokens, student names, or attendance payloads. Define a security incident contact and an owner for backups before go-live.
