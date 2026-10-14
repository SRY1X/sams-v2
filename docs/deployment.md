# Deploying SAMS with Supabase and Vercel

Vercel is the initial hosting option, not a requirement of the application domain. A compatible Node.js host can run the Next.js application. Supabase provides the initial hosted PostgreSQL and authentication services.

## Before you begin

- Use a **new Supabase project for staging** and a separate project for production. Do not connect public preview deployments to production student records.
- Apply only reviewed migrations. Do not let an unreviewed pull request or ordinary GitHub Actions job mutate a hosted database.
- Keep Auth sign-up disabled. Provision the first administrator through a trusted project-owner operation; ordinary admins cannot grant themselves the role.
- Configure verified SMTP, Auth redirect URLs, backups, retention, incident response, and an accountable institution owner before importing any real records.
- Review the Supabase Auth leaked-password protection warning and decide whether to enable the check before onboarding production users; record any institution policy exception.
- Use synthetic people and attendance records in previews and demos.

## 1. Prepare the Supabase project

Create the intended staging or production project. From a trusted local checkout, authenticate the CLI, link it to that exact project reference, inspect the migration plan, and then apply the reviewed migrations:

```sh
npm exec -- supabase login
npm exec -- supabase link --project-ref YOUR_PROJECT_REF
npm exec -- supabase db push --dry-run --linked
npm exec -- supabase db push --linked
```

The dry run should list only the migrations you expect. Check the project name and reference in the dashboard before using `db push`; it changes the linked remote database. This project currently includes a first schema migration and synthetic academic catalog seed. Create a fresh project for a clean deployment; do not replay the seed or bootstrap steps against a populated institution database without reviewing their effects.

Create the first Auth user and grant the initial admin membership using the trusted SQL operation in [the setup guide](setup.md). Configure the Auth **Site URL** to the deployed canonical origin and allow only the required callback URLs, including `https://YOUR_HOST/auth/callback`. Keep public sign-up disabled, set verified email delivery, and test invitation and recovery templates before inviting users.

## 2. Create and configure the Vercel project

1. Import the GitHub repository into Vercel and select the intended production branch (`main`).
2. Confirm the framework is detected as **Next.js**, the install command is `npm ci`, and the build command is `npm run build`.
3. Set the required variables in Vercel's encrypted project environment settings. Select each target environment deliberately:

   | Variable                               | Preview / staging                                | Production                                              |
   | -------------------------------------- | ------------------------------------------------ | ------------------------------------------------------- |
   | `NEXT_PUBLIC_SUPABASE_URL`             | Staging project URL                              | Production project URL                                  |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Staging publishable key                          | Production publishable key                              |
   | `ATTENDANCE_TOKEN_SECRET`              | Unique random secret                             | Different unique random secret                          |
   | `NEXT_PUBLIC_SITE_URL`                 | Exact preview origin used for the test           | Canonical production origin                             |
   | `SUPABASE_SERVICE_ROLE_KEY`            | Optional staging-only key for invitation testing | Optional production key only if invitations are enabled |

   `NEXT_ALLOWED_DEV_ORIGINS` is for Next.js development on a local network; do not set it to make production requests work. Never add a service-role key to a `NEXT_PUBLIC_` variable or to GitHub Actions.

4. Set the same intended site origin and callback allow-list in the corresponding Supabase Auth settings. Use only exact origins you control; configure Preview callbacks only for the staging project.
5. Deploy a preview and verify migrations, sign-in, roles, the student/faculty workflows, and HTTPS camera access using synthetic data before production.
6. For production, confirm the production variables and Supabase project again, then deploy from the reviewed `main` branch. Keep production email delivery and user provisioning restricted to the institution's operators.

Generate each HMAC signing secret with a cryptographically secure generator, for example:

```sh
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Use a different value in local, preview, and production environments. Rotate it if exposed; existing QR tokens signed with the prior value will stop validating.

## 3. Understand the GitHub and Vercel checks

The GitHub Actions workflow runs formatting, lint, TypeScript, unit tests, a build with nonfunctional placeholders, and local Supabase database checks. It has read-only repository permissions and no deployment secrets. Vercel's Git integration creates previews and production deployments independently. Database migrations remain an explicit reviewed operator step.

For production, use GitHub branch protection to require the quality workflow before merging. Keep required reviews for migrations, RLS, role provisioning, signing, and personal-data changes. Require a maintainer to check any deployment environment before releasing; do not add a static Vercel token to routine test jobs.

## 4. Verify before inviting real users

- Confirm the expected migration set and run database advisor/security checks.
- Test student, faculty, admin, unauthenticated, suspended, and cross-institution access, including denied reads and writes.
- Create and close an attendance session; test an eligible scan, expired token, duplicate scan, non-enrolled student, and closed session.
- Use an HTTPS mobile browser and synthetic accounts. Camera decoding occurs in the browser; do not collect camera video.
- Verify email links return only to the intended site, no public sign-up is available, and the administrator cannot self-promote.
- Review logs and error output for tokens, credentials, email addresses, names, and attendance contents.
- Confirm an owner can recover from a backup and roll back an application deployment. For database changes, prefer a reviewed forward migration.

## Releases, recovery, and portability

Use additive, backwards-compatible migrations where practical. Take and verify a backup before risky schema/data operations. Keep rollback focused on the application when a database migration has been applied; write a forward migration for corrections instead of assuming the previous schema can safely be restored.

Monitor aggregate failures and service health without recording authentication secrets, QR tokens, student names, or attendance payloads. Define a security disclosure contact and a backup owner before production use. The application does not require Vercel-only business APIs; a different Node.js host and PostgreSQL-compatible backend can be evaluated later, with Supabase Auth replacement requiring a separately designed identity adapter.
